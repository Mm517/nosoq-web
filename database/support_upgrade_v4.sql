-- ============================================================================
-- نَسَق — support_upgrade_v4.sql   (آمن لو اتشغّل أكتر من مرة — شغّله بعد support_upgrade_v3.sql)
-- 1) نطاق كل موظف دعم: يشوف ويرد على أنواع المحادثات اللي اتحددت له بس (بائعين SL / سائقين RD / مستخدمين US / زوّار GS)
--    التطبيق على السيرفر (مش بس في الواجهة): القائمة، فتح المحادثة، الرد، تغيير الحالة، وصور المحادثة.
-- 2) دوال الإدارة اللي الواجهة بتناديها: admin_support_staff_set_scope / admin_support_staff_create_direct / support_escalate
-- 3) الحذف الكامل للأدمن: admin_delete_entity (طلب، منتج، متجر، سائق، طلب تقديم، محادثة دعم، معاملة، توصيلة)
-- ============================================================================

-- ---------- 1) أعمدة النطاق والتصعيد ----------
alter table public.support_staff add column if not exists handles text[] not null default array['seller']::text[];
alter table public.support_tickets add column if not exists escalated boolean not null default false;
alter table public.support_tickets add column if not exists escalated_at timestamptz;
alter table public.support_tickets add column if not exists escalation_note text;

-- ---------- 2) هل الموظف الحالي مسموح له بالمحادثة دي؟ ----------
-- الأدمن: دايماً نعم. موظف الدعم: لو نوع المحادثة (من بادئة الكود، أو origin للتذاكر القديمة) ضمن handles بتاعته.
create or replace function public._support_can(t public.support_tickets) returns boolean
language plpgsql security definer stable set search_path = public as $$
declare hs jsonb; h text;
begin
  if public.is_admin() then return true; end if;
  select to_jsonb(s.handles) into hs from public.support_staff s where s.user_id = auth.uid();
  if hs is null then return false; end if;
  h := case upper(left(coalesce(t.ticket_number, ''), 2))
         when 'SL' then 'seller' when 'RD' then 'rider' when 'US' then 'customer' when 'GS' then 'guest'
         else case coalesce(t.origin, '') when 'seller' then 'seller' when 'rider' then 'rider' when 'customer' then 'customer' else 'guest' end
       end;
  return hs ? h;
end $$;

create or replace function public._support_can_number(p_tn text) returns boolean
language plpgsql security definer stable set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  select * into t from public.support_tickets where ticket_number = p_tn;
  if not found then return public.is_admin(); end if;
  return public._support_can(t);
end $$;

-- من أنا؟ + النطاق (الواجهة بتخفي الأقسام اللي مش ليه)
create or replace function public.support_whoami() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  return jsonb_build_object(
    'role', case when public.is_admin() then 'admin' when public.is_support() then 'support' else 'none' end,
    'handles', case when public.is_admin() then '["seller","rider","customer","guest"]'::jsonb
                    else coalesce((select to_jsonb(s.handles) from public.support_staff s where s.user_id = auth.uid()), '[]'::jsonb) end);
end $$;

-- ---------- 3) القائمة / المحادثة / الرد / الحالة — كلها بفلتر النطاق ----------
create or replace function public.admin_support_list()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc nulls last), '[]'::jsonb) from (
    select t.id, t.ticket_number, t.subject, t.message, t.name, t.email, t.priority, t.status, t.category, t.origin,
           t.created_at, t.last_message_at, t.admin_unread, t.user_external_id, t.handled_by, t.closed_at,
           t.escalated, t.escalation_note,
           (select count(*) from public.support_ticket_msgs m where m.ticket_number = t.ticket_number) as messages_count
    from public.support_tickets t
    where public._support_can(t)
    order by t.last_message_at desc nulls last limit 1000
  ) x);
end $$;

create or replace function public.admin_support_thread(p_ticket_number text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  if not public._support_can(t) then raise exception 'المحادثة دي مش ضمن الأنواع المسموحة لك.'; end if;
  update public.support_tickets set admin_unread = false where ticket_number = p_ticket_number;
  return jsonb_build_object('ticket', to_jsonb(t),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('role', m.author_role, 'body', m.body, 'created_at', m.created_at,
                          'attachments', m.attachments, 'author_name', m.author_name) order by m.created_at)
                          from public.support_ticket_msgs m where m.ticket_number = p_ticket_number), '[]'::jsonb));
end $$;

create or replace function public.admin_support_reply(p_ticket_number text, p_body text, p_status text default 'in_progress', p_attachments jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype; who text; r text; st text;
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  if not public._support_can(t) then raise exception 'المحادثة دي مش ضمن الأنواع المسموحة لك.'; end if;
  if coalesce(trim(p_body), '') = '' and jsonb_array_length(coalesce(p_attachments, '[]'::jsonb)) = 0 then
    raise exception 'اكتب رداً أو أرفق صورة.';
  end if;
  r := case when public.is_admin() then 'admin' else 'support' end;
  select coalesce(nullif(s.name, ''), s.email) into who from public.support_staff s where s.user_id = auth.uid();
  if who is null then select email into who from public.admin_users where user_id = auth.uid(); end if;
  st := case when p_status in ('open','in_progress','resolved','closed') then p_status else 'in_progress' end;
  insert into public.support_ticket_msgs (ticket_number, author_external_id, author_role, author_name, body, attachments)
  values (p_ticket_number, auth.uid()::text, r, who, coalesce(p_body, ''), coalesce(p_attachments, '[]'::jsonb));
  update public.support_tickets set status = st, last_message_at = now(), admin_unread = false, handled_by = who,
         closed_at = case when st = 'closed' then now() else null end
   where ticket_number = p_ticket_number;
  if t.user_external_id is not null then
    perform public._support_notify(t.user_external_id, 'رد جديد من الدعم', left(coalesce(nullif(p_body, ''), 'صورة مرفقة'), 100), null);
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.staff_support_set_status(p_ticket_number text, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  if not public.is_staff() then raise exception 'غير مسموح.'; end if;
  if p_status not in ('open','in_progress','resolved','closed') then raise exception 'حالة غير صحيحة.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  if not public._support_can(t) then raise exception 'المحادثة دي مش ضمن الأنواع المسموحة لك.'; end if;
  update public.support_tickets set status = p_status, closed_at = case when p_status = 'closed' then now() else null end
   where ticket_number = p_ticket_number;
  return jsonb_build_object('ok', true);
end $$;

-- طلب مساعدة الإدارة (موظف الدعم يصعّد محادثة)
create or replace function public.support_escalate(p_ticket_number text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  if not public.is_staff() then raise exception 'غير مسموح.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  if not public._support_can(t) then raise exception 'المحادثة دي مش ضمن الأنواع المسموحة لك.'; end if;
  update public.support_tickets set escalated = true, escalated_at = now(), escalation_note = nullif(trim(p_note), '')
   where ticket_number = p_ticket_number;
  perform public._support_notify_admins('طلب مساعدة على ' || p_ticket_number, coalesce(nullif(trim(p_note), ''), 'موظف الدعم طلب مساعدة الإدارة'));
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 4) إدارة نطاق موظفي الدعم (للأدمن فقط) ----------
create or replace function public.admin_support_staff_set_scope(p_user_id uuid, p_handles text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare clean text[];
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  select array_agg(distinct x) into clean from unnest(coalesce(p_handles, '{}'::text[])) x where x in ('seller','rider','customer','guest');
  if clean is null then raise exception 'لازم تختار نوع محادثات واحد على الأقل.'; end if;
  update public.support_staff set handles = clean where user_id = p_user_id;
  if not found then raise exception 'موظف الدعم غير موجود.'; end if;
  return jsonb_build_object('ok', true, 'handles', to_jsonb(clean));
end $$;

-- إنشاء موظف دعم بحساب جاهز (بريد + كلمة مرور) من غير إيميل تأكيد
create or replace function public.admin_support_staff_create_direct(p_email text, p_name text, p_handles text[], p_password text)
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare e text := lower(trim(p_email)); u uuid; clean text[]; was_staff boolean; created boolean := false; pw_reset boolean := false;
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  if e is null or e = '' or position('@' in e) = 0 then raise exception 'بريد غير صحيح.'; end if;
  select array_agg(distinct x) into clean from unnest(coalesce(p_handles, '{}'::text[])) x where x in ('seller','rider','customer','guest');
  if clean is null then raise exception 'لازم تختار نوع محادثات واحد على الأقل.'; end if;
  select id into u from auth.users where lower(email) = e;
  if u is null then
    if coalesce(length(p_password), 0) < 6 then raise exception 'كلمة المرور لازم تكون 6 أحرف على الأقل.'; end if;
    u := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', u, 'authenticated', 'authenticated', e, crypt(p_password, gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', nullif(trim(p_name), ''), 'email_verified', true), now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u, u::text, jsonb_build_object('sub', u::text, 'email', e, 'email_verified', true), 'email', now(), now(), now());
    created := true;
  else
    select exists (select 1 from public.support_staff where user_id = u) into was_staff;
    if was_staff and coalesce(length(p_password), 0) >= 6 then
      update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = u;
      pw_reset := true;
    end if;
  end if;
  insert into public.support_staff (user_id, email, name, handles)
  values (u, e, nullif(trim(p_name), ''), clean)
  on conflict (user_id) do update set name = coalesce(excluded.name, public.support_staff.name), handles = excluded.handles;
  return jsonb_build_object('ok', true, 'created', created, 'password_reset', pw_reset, 'user_id', u);
end $$;

-- ---------- 5) صور المحادثات: القراءة/الرفع حسب نطاق الموظف، والحذف للأدمن ----------
drop policy if exists support_files_read on storage.objects;
create policy support_files_read on storage.objects for select to authenticated using (
  bucket_id = 'support-files' and (public._support_can_number((storage.foldername(name))[1]) or exists (
    select 1 from public.support_tickets t where t.ticket_number = (storage.foldername(name))[1] and t.user_external_id = auth.uid()::text)));
drop policy if exists support_files_insert on storage.objects;
create policy support_files_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'support-files' and (public._support_can_number((storage.foldername(name))[1]) or exists (
    select 1 from public.support_tickets t where t.ticket_number = (storage.foldername(name))[1] and t.user_external_id = auth.uid()::text)));
drop policy if exists support_files_admin_delete on storage.objects;
create policy support_files_admin_delete on storage.objects for delete to authenticated using (
  bucket_id = 'support-files' and public.is_admin());

-- ---------- 6) الحذف الكامل للأدمن ----------
-- kind: order | product | store | rider | application | ticket | transaction | delivery
-- (المستخدمون بيتحذفوا حذف ناعم عن طريق admin_soft_delete_user عشان سجل الطلبات والمعاملات يفضل سليم)
create or replace function public.admin_delete_entity(p_kind text, p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int := 0; oid uuid;
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  if coalesce(trim(p_id), '') = '' then raise exception 'المعرّف مفقود.'; end if;

  if p_kind = 'order' then
    oid := p_id::uuid;
    begin delete from public.transactions where order_id = oid; exception when undefined_table or undefined_column then null; end;
    begin delete from public.deliveries where order_id = oid; exception when undefined_table or undefined_column then null; end;
    begin delete from public.store_orders where order_id = oid; exception when undefined_table or undefined_column then null; end;
    begin delete from public.order_items where order_id = oid; exception when undefined_table or undefined_column then null; end;
    delete from public.orders where id = oid;
    get diagnostics n = row_count;

  elsif p_kind = 'product' then
    delete from public.products where id::text = p_id;
    get diagnostics n = row_count;

  elsif p_kind = 'store' then
    begin
      begin delete from public.products where store_id::text = p_id; exception when undefined_table or undefined_column then null; end;
      delete from public.stores where id::text = p_id;
      get diagnostics n = row_count;
    exception when foreign_key_violation then
      raise exception 'المتجر مرتبط بطلبات سابقة ومينفعش يتحذف نهائياً. غيّر حالته إلى «موقوف» بدل الحذف.';
    end;

  elsif p_kind = 'rider' then
    begin
      delete from public.riders where id::text = p_id;
      get diagnostics n = row_count;
    exception when foreign_key_violation then
      raise exception 'السائق مرتبط بتوصيلات سابقة ومينفعش يتحذف نهائياً. غيّر حالته إلى «موقوف» بدل الحذف.';
    end;

  elsif p_kind = 'application' then
    delete from public.applications where id::text = p_id;
    get diagnostics n = row_count;

  elsif p_kind = 'ticket' then
    delete from public.support_ticket_msgs where ticket_number = p_id;
    delete from public.support_tickets where ticket_number = p_id;
    get diagnostics n = row_count;

  elsif p_kind = 'transaction' then
    delete from public.transactions where id::text = p_id;
    get diagnostics n = row_count;

  elsif p_kind = 'delivery' then
    delete from public.deliveries where id::text = p_id;
    get diagnostics n = row_count;

  else
    raise exception 'نوع غير مدعوم للحذف.';
  end if;

  if n = 0 then raise exception 'العنصر غير موجود أو اتحذف قبل كده.'; end if;
  return jsonb_build_object('ok', true, 'deleted', n);
exception when foreign_key_violation then
  raise exception 'العنصر مرتبط ببيانات تانية ومينفعش يتحذف نهائياً. عطّله أو غيّر حالته بدل الحذف.';
end $$;

grant execute on function public._support_can(public.support_tickets), public._support_can_number(text), public.support_whoami(),
  public.admin_support_list(), public.admin_support_thread(text), public.admin_support_reply(text, text, text, jsonb),
  public.staff_support_set_status(text, text), public.support_escalate(text, text),
  public.admin_support_staff_set_scope(uuid, text[]), public.admin_support_staff_create_direct(text, text, text[], text),
  public.admin_delete_entity(text, text) to authenticated;


-- ---------- 7) الدور الفعلي للمستخدم الحالي في مكالمة واحدة ----------
-- admin | support | seller | rider | customer  (الواجهة بتحوّل الدعم لصفحة الدعم أول ما يسجل دخول من الموقع العادي)
create or replace function public.nasaq_my_role() returns text
language plpgsql security definer stable set search_path = public as $$
declare r text;
begin
  if auth.uid() is null then return null; end if;
  if public.is_admin() then return 'admin'; end if;
  if public.is_support() then return 'support'; end if;
  select role into r from public.marketplace_users where external_id = auth.uid()::text;
  return coalesce(r, 'customer');
end $$;
grant execute on function public.nasaq_my_role() to authenticated;
