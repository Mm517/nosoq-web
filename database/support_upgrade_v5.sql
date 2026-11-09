-- ============================================================================
-- نَسَق — support_upgrade_v5.sql   (آمن لو اتشغّل أكتر من مرة — شغّله بعد support_upgrade_v4.sql)
-- 1) بيانات صاحب التذكرة (الاسم / الرقم / الصورة / النوع / المتجر أو السائق / عدد الطلبات) تظهر لموظف الدعم والأدمن.
-- 2) عمود avatar_url للمستخدم (صورته الشخصية) — لو مفيش صورة بنستخدم شعار المتجر أو صورة السائق ثم الحرف الأول.
-- 3) إشعارات موظفي الدعم: أي رسالة جديدة من عميل في نطاقه تتبعت له إشعار، ولما الأدمن يرد على تذكرة اتصعّدت.
-- 4) الأدمن يقدر يشيل علامة «طلب مساعدة» بعد ما يخلص (support_resolve_escalation).
-- ============================================================================

alter table public.marketplace_users add column if not exists avatar_url text;

-- ---------- 1) بيانات صاحب التذكرة ----------
create or replace function public._support_party(p_uid text) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
  mu jsonb; st jsonb; rd jsonb; oc int := 0; sp numeric := 0;
begin
  if p_uid is null then return '{}'::jsonb; end if;

  select to_jsonb(m) into mu from public.marketplace_users m where m.external_id = p_uid;

  begin
    select to_jsonb(s) into st from public.stores s where s.owner_external_id = p_uid order by s.created_at limit 1;
  exception when others then st := null; end;

  begin
    select to_jsonb(r) into rd from public.riders r where r.user_external_id = p_uid limit 1;
  exception when others then rd := null; end;

  begin
    select count(*), coalesce(sum(o.total), 0) into oc, sp from public.orders o where o.customer_external_id = p_uid;
  exception when others then oc := 0; sp := 0; end;

  return jsonb_build_object(
    'name',    coalesce(nullif(mu->>'name', ''), rd->>'name', st->>'name'),
    'phone',   coalesce(nullif(mu->>'phone', ''), nullif(rd->>'phone', ''), nullif(st->>'phone', '')),
    'email',   coalesce(nullif(mu->>'email', ''), st->>'email'),
    'role',    mu->>'role',
    'joined',  mu->>'created_at',
    'blocked', coalesce((mu->>'is_blocked')::boolean, false),
    'address', coalesce(nullif(mu->>'address', ''), st->>'address'),
    'avatar',  coalesce(nullif(mu->>'avatar_url', ''), nullif(rd->>'photo_url', ''), nullif(rd->>'avatar_url', ''), nullif(rd->>'photo', ''), nullif(st->>'logo_url', '')),
    'orders_count', oc,
    'total_spent',  sp,
    'store', case when st is null then null else jsonb_build_object(
      'name', st->>'name', 'category', st->>'category', 'status', st->>'status',
      'phone', st->>'phone', 'address', st->>'address', 'logo', st->>'logo_url') end,
    'rider', case when rd is null then null else jsonb_build_object(
      'name', rd->>'name', 'vehicle', rd->>'vehicle', 'city', rd->>'city', 'area', rd->>'area',
      'status', rd->>'status', 'phone', rd->>'phone') end
  );
end $$;

-- ---------- 2) القائمة والمحادثة بيرجعوا «party» ----------
create or replace function public.admin_support_list()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'هذه الصفحة مخصصة للإدارة والدعم.'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc nulls last), '[]'::jsonb) from (
    select t.id, t.ticket_number, t.subject, t.message, t.name, t.email, t.priority, t.status, t.category, t.origin,
           t.created_at, t.last_message_at, t.admin_unread, t.user_external_id, t.handled_by, t.closed_at,
           t.escalated, t.escalated_at, t.escalation_note,
           (select count(*) from public.support_ticket_msgs m where m.ticket_number = t.ticket_number) as messages_count,
           (select left(coalesce(nullif(m.body, ''), 'صورة مرفقة'), 90) from public.support_ticket_msgs m
             where m.ticket_number = t.ticket_number order by m.created_at desc limit 1) as last_body,
           (select m.author_role from public.support_ticket_msgs m
             where m.ticket_number = t.ticket_number order by m.created_at desc limit 1) as last_role,
           public._support_party(t.user_external_id) as party
    from public.support_tickets t
    where public._support_can(t)
    order by t.last_message_at desc nulls last limit 500
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
    'party', public._support_party(t.user_external_id),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('role', m.author_role, 'body', m.body, 'created_at', m.created_at,
                          'attachments', m.attachments, 'author_name', m.author_name) order by m.created_at)
                          from public.support_ticket_msgs m where m.ticket_number = p_ticket_number), '[]'::jsonb));
end $$;

-- ---------- 3) إشعارات موظفي الدعم ----------
-- رسالة جديدة من العميل → إشعار لكل موظف دعم نطاقه يشمل نوع التذكرة.
-- رد الأدمن على تذكرة مصعَّدة → إشعار لموظفي الدعم المسؤولين عنها.
create or replace function public._support_notify_staff_trg() returns trigger
language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype; h text; s record; ttl text; bdy text;
begin
  select * into t from public.support_tickets where ticket_number = new.ticket_number;
  if not found then return new; end if;
  if new.author_role = 'user' then
    ttl := 'رسالة جديدة · ' || t.ticket_number;
    bdy := coalesce(t.name, 'عميل') || ': ' || left(coalesce(nullif(new.body, ''), 'صورة مرفقة'), 80);
  elsif new.author_role = 'admin' and t.escalated then
    ttl := 'ردّت الإدارة على ' || t.ticket_number;
    bdy := left(coalesce(nullif(new.body, ''), 'صورة مرفقة'), 90);
  else
    return new;
  end if;
  h := case upper(left(coalesce(t.ticket_number, ''), 2))
         when 'SL' then 'seller' when 'RD' then 'rider' when 'US' then 'customer' when 'GS' then 'guest'
         else case coalesce(t.origin, '') when 'seller' then 'seller' when 'rider' then 'rider' when 'customer' then 'customer' else 'guest' end
       end;
  for s in select user_id::text as uid, handles from public.support_staff loop
    if to_jsonb(s.handles) ? h then
      perform public._support_notify(s.uid, ttl, bdy, 'support.html#' || t.ticket_number);
    end if;
  end loop;
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists trg_support_notify_staff on public.support_ticket_msgs;
create trigger trg_support_notify_staff after insert on public.support_ticket_msgs
  for each row execute function public._support_notify_staff_trg();

-- ---------- 4) الأدمن يشيل علامة «طلب مساعدة» ----------
create or replace function public.support_resolve_escalation(p_ticket_number text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'للأدمن فقط.'; end if;
  update public.support_tickets set escalated = false, escalated_at = null, escalation_note = null
   where ticket_number = p_ticket_number;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public._support_party(text), public.admin_support_list(), public.admin_support_thread(text),
  public.support_resolve_escalation(text) to authenticated;
