-- ============================================================================
-- نَسَق — support_upgrade_v3.sql  (آمن لو اتشغّل أكتر من مرة)
-- 1) أكواد التذاكر بحسب النوع: SL- بائع | RD- سائق | US- عميل | GS- زائر
-- 2) صور في رسائل الدعم (bucket خاص support-files + روابط موقّعة)
-- 3) موظفو الدعم (support_staff) يضيفهم الأدمن، ويشوفوا صفحة الدعم فقط
-- 4) الأدمن يشوف كل حاجة: مين ردّ (handled_by) وكل الرسائل
-- ============================================================================
alter table public.support_ticket_msgs add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.support_ticket_msgs add column if not exists author_name text;
alter table public.support_tickets add column if not exists handled_by text;
alter table public.support_tickets add column if not exists closed_at timestamptz;

alter table public.support_ticket_msgs drop constraint if exists support_ticket_msgs_author_role_check;
alter table public.support_ticket_msgs add constraint support_ticket_msgs_author_role_check
  check (author_role in ('user', 'admin', 'support'));
alter table public.support_ticket_msgs drop constraint if exists support_ticket_msgs_body_check;
alter table public.support_ticket_msgs add constraint support_ticket_msgs_body_check
  check (char_length(body) between 0 and 4000);

create table if not exists public.support_staff (
  user_id uuid primary key,
  email text,
  name text,
  created_at timestamptz not null default now()
);
alter table public.support_staff enable row level security;
drop policy if exists support_staff_admin_all on public.support_staff;
create policy support_staff_admin_all on public.support_staff
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.is_support() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.support_staff where user_id = auth.uid());
$$;
create or replace function public.is_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select public.is_admin() or public.is_support();
$$;

create or replace function public._support_prefix(p_origin text) returns text
language sql immutable as $$
  select case p_origin when 'seller' then 'SL' when 'rider' then 'RD' when 'customer' then 'US' else 'GS' end;
$$;

-- من أنا؟ (admin | support | none) — تستخدمها صفحة الإدارة لإظهار الأقسام المناسبة
create or replace function public.support_whoami() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  return jsonb_build_object('role', case when public.is_admin() then 'admin' when public.is_support() then 'support' else 'none' end);
end $$;

-- إنشاء تذكرة: الكود يبدأ ببادئة النوع
create or replace function public.support_create_ticket(
  p_subject text, p_message text, p_category text default null, p_priority text default 'normal',
  p_origin text default 'customer', p_name text default null, p_email text default null,
  p_ticket_number text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid text := auth.uid()::text; tn text; pfx text; org text; t public.support_tickets%rowtype;
begin
  if uid is null then raise exception 'سجّل الدخول أولاً.'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'اكتب نص الرسالة.'; end if;
  org := case when p_origin in ('seller','rider','customer') then p_origin else 'customer' end;
  pfx := public._support_prefix(org);
  tn := nullif(trim(p_ticket_number), '');
  if tn is null or tn not like pfx || '-%' then
    tn := pfx || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  end if;
  if exists (select 1 from public.support_tickets where ticket_number = tn) then
    tn := tn || substr(md5(random()::text), 1, 2);
  end if;
  insert into public.support_tickets (ticket_number, user_external_id, email, name, subject, message, priority, source, status, category, origin, last_message_at, admin_unread)
  values (tn, uid, p_email, p_name, coalesce(nullif(trim(p_subject), ''), 'استفسار'), p_message,
    case when p_priority in ('low','normal','high','urgent') then p_priority else 'normal' end,
    'storefront', 'open', p_category, org, now(), true)
  returning * into t;
  insert into public.support_ticket_msgs (ticket_number, author_external_id, author_role, author_name, body)
  values (tn, uid, 'user', p_name, p_message);
  perform public._support_notify_admins('تذكرة دعم جديدة ' || tn, coalesce(p_name, 'مستخدم') || ': ' || left(coalesce(p_subject, p_message), 80));
  return jsonb_build_object('ticket_number', tn, 'status', t.status, 'created_at', t.created_at);
end $$;

-- تذاكري (تحتوي الصور الآن)
create or replace function public.support_my_tickets()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select t.ticket_number, t.subject, t.category, t.status, t.priority, t.created_at, t.last_message_at,
           coalesce((select jsonb_agg(jsonb_build_object('from', case when m.author_role in ('admin','support') then 'support' else 'seller' end,
                       'text', m.body, 'date', m.created_at, 'attachments', m.attachments) order by m.created_at)
                     from public.support_ticket_msgs m where m.ticket_number = t.ticket_number), '[]'::jsonb) as messages
    from public.support_tickets t where t.user_external_id = auth.uid()::text
    order by t.created_at desc limit 200
  ) x;
$$;

-- قائمة التذاكر للأدمن وموظف الدعم
create or replace function public.admin_support_list()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc nulls last), '[]'::jsonb) from (
    select t.id, t.ticket_number, t.subject, t.message, t.name, t.email, t.priority, t.status, t.category, t.origin,
           t.created_at, t.last_message_at, t.admin_unread, t.user_external_id, t.handled_by, t.closed_at,
           (select count(*) from public.support_ticket_msgs m where m.ticket_number = t.ticket_number) as messages_count
    from public.support_tickets t order by t.last_message_at desc nulls last limit 1000
  ) x);
end $$;

create or replace function public.admin_support_thread(p_ticket_number text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  update public.support_tickets set admin_unread = false where ticket_number = p_ticket_number;
  return jsonb_build_object('ticket', to_jsonb(t),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('role', m.author_role, 'body', m.body, 'created_at', m.created_at,
                          'attachments', m.attachments, 'author_name', m.author_name) order by m.created_at)
                          from public.support_ticket_msgs m where m.ticket_number = p_ticket_number), '[]'::jsonb));
end $$;

-- رد (نص و/أو صور) — من الأدمن أو موظف الدعم
drop function if exists public.admin_support_reply(text, text, text);
create or replace function public.admin_support_reply(p_ticket_number text, p_body text, p_status text default 'in_progress', p_attachments jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype; who text; r text; st text;
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
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

-- تغيير حالة / قفل المحادثة
create or replace function public.staff_support_set_status(p_ticket_number text, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'غير مسموح.'; end if;
  if p_status not in ('open','in_progress','resolved','closed') then raise exception 'حالة غير صحيحة.'; end if;
  update public.support_tickets set status = p_status, closed_at = case when p_status = 'closed' then now() else null end
   where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- إدارة موظفي الدعم (للأدمن فقط)
create or replace function public.admin_support_staff_list() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb) from public.support_staff s);
end $$;
create or replace function public.admin_support_staff_add(p_email text, p_name text default null) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare u uuid;
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  select id into u from auth.users where lower(email) = lower(trim(p_email));
  if u is null then raise exception 'لا يوجد حساب بهذا البريد. اطلب منه التسجيل أولاً.'; end if;
  insert into public.support_staff (user_id, email, name) values (u, lower(trim(p_email)), nullif(trim(p_name), ''))
  on conflict (user_id) do update set name = coalesce(excluded.name, public.support_staff.name);
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.admin_support_staff_remove(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  delete from public.support_staff where user_id = p_user_id;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.is_support(), public.is_staff(), public.support_whoami(),
  public.admin_support_list(), public.admin_support_thread(text), public.admin_support_reply(text, text, text, jsonb),
  public.staff_support_set_status(text, text), public.admin_support_staff_list(),
  public.admin_support_staff_add(text, text), public.admin_support_staff_remove(uuid) to authenticated;

-- الملفات (صور الدعم): bucket خاص، القراءة للموظفين وصاحب التذكرة فقط
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-files', 'support-files', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = false;

drop policy if exists support_files_read on storage.objects;
create policy support_files_read on storage.objects for select to authenticated using (
  bucket_id = 'support-files' and (public.is_staff() or exists (
    select 1 from public.support_tickets t where t.ticket_number = (storage.foldername(name))[1] and t.user_external_id = auth.uid()::text)));
drop policy if exists support_files_insert on storage.objects;
create policy support_files_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'support-files' and (public.is_staff() or exists (
    select 1 from public.support_tickets t where t.ticket_number = (storage.foldername(name))[1] and t.user_external_id = auth.uid()::text)));
