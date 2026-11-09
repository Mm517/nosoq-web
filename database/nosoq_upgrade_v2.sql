-- ============================================================================
-- نَسَق (Nasaq) — nosoq_upgrade_v2.sql
-- شغّله مرة واحدة من Supabase → SQL Editor. كل حاجة فيه idempotent (آمن لو
-- اتشغّل أكتر من مرة). لا يمسّ أي جدول موجود غير بإضافة أعمدة جديدة.
--
-- بيضيف:
--   1) الدعم: رسائل التذاكر (support_ticket_msgs) + دوال للبائع/العميل/الإدمن،
--      وإشعار للإدمن عند كل تذكرة/رد جديد، وإشعار للمستخدم عند رد الإدمن.
--   2) حفظ موقع الزائر (غير المسجّل) في الداتابيس: visitor_locations.
--   3) إحصائيات حقيقية للمشاهدات/السلة لكل منتج: product_daily_stats.
--   4) بيانات لوحة البائع (المحفظة/الإعلانات/التفضيلات): seller_data.
--   5) buckets الصور والفيديو + صلاحيات الرفع والعرض.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) الدعم
-- ---------------------------------------------------------------------------
alter table public.support_tickets add column if not exists category text;
alter table public.support_tickets add column if not exists origin text;            -- seller | customer | rider | guest
alter table public.support_tickets add column if not exists last_message_at timestamptz default now();
alter table public.support_tickets add column if not exists admin_unread boolean not null default true;

create table if not exists public.support_ticket_msgs (
  id                 uuid primary key default gen_random_uuid(),
  ticket_number      text not null,
  author_external_id text,
  author_role        text not null default 'user' check (author_role in ('user', 'admin')),
  body               text not null check (char_length(body) between 1 and 4000),
  created_at         timestamptz not null default now()
);
create index if not exists support_ticket_msgs_ticket_idx on public.support_ticket_msgs (ticket_number, created_at);
alter table public.support_ticket_msgs enable row level security;

drop policy if exists support_ticket_msgs_admin_all on public.support_ticket_msgs;
create policy support_ticket_msgs_admin_all on public.support_ticket_msgs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- إشعار داخلي آمن: لو فشل لأي سبب (أعمدة مختلفة) ما يوقفش إنشاء التذكرة
create or replace function public._support_notify(p_user text, p_title text, p_body text, p_href text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_external_id, kind, title, body, href)
  values (p_user, 'support', p_title, p_body, p_href);
exception when others then
  null;
end $$;

create or replace function public._support_notify_admins(p_title text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select user_id::text as uid from public.admin_users loop
    perform public._support_notify(r.uid, p_title, p_body, 'admin.html#support');
  end loop;
exception when others then
  null;
end $$;

-- إنشاء تذكرة (مسجّل دخول): تُنشئ التذكرة + أول رسالة + إشعار للإدمن
create or replace function public.support_create_ticket(
  p_subject text, p_message text, p_category text default null, p_priority text default 'normal',
  p_origin text default 'customer', p_name text default null, p_email text default null,
  p_ticket_number text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid text := auth.uid()::text;
  tn  text;
  t   public.support_tickets%rowtype;
begin
  if uid is null then raise exception 'سجّل الدخول أولاً.'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'اكتب نص الرسالة.'; end if;
  tn := coalesce(nullif(trim(p_ticket_number), ''), 'SUP-' || upper(to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint)));
  if exists (select 1 from public.support_tickets where ticket_number = tn) then
    tn := tn || '-' || substr(md5(random()::text), 1, 3);
  end if;
  insert into public.support_tickets
    (ticket_number, user_external_id, email, name, subject, message, priority, source, status,
     category, origin, last_message_at, admin_unread)
  values
    (tn, uid, p_email, p_name, coalesce(nullif(trim(p_subject), ''), 'استفسار'), p_message,
     case when p_priority in ('low','normal','high','urgent') then p_priority else 'normal' end,
     'storefront', 'open', p_category, coalesce(p_origin, 'customer'), now(), true)
  returning * into t;
  insert into public.support_ticket_msgs (ticket_number, author_external_id, author_role, body)
  values (tn, uid, 'user', p_message);
  perform public._support_notify_admins('تذكرة دعم جديدة ' || tn, coalesce(p_name, 'مستخدم') || ': ' || left(coalesce(p_subject, p_message), 80));
  return jsonb_build_object('ticket_number', tn, 'status', t.status, 'created_at', t.created_at);
end $$;

-- تذاكري + رسائلها
create or replace function public.support_my_tickets()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select t.ticket_number, t.subject, t.category, t.status, t.priority, t.created_at, t.last_message_at,
           coalesce((select jsonb_agg(jsonb_build_object('from', case m.author_role when 'admin' then 'support' else 'seller' end,
                                                        'text', m.body, 'date', m.created_at) order by m.created_at)
                     from public.support_ticket_msgs m where m.ticket_number = t.ticket_number), '[]'::jsonb) as messages
    from public.support_tickets t
    where t.user_external_id = auth.uid()::text
    order by t.created_at desc limit 200
  ) x;
$$;

-- رد المستخدم على تذكرته
create or replace function public.support_user_reply(p_ticket_number text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid text := auth.uid()::text; t public.support_tickets%rowtype;
begin
  if uid is null then raise exception 'سجّل الدخول أولاً.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number and user_external_id = uid;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'اكتب نص الرد.'; end if;
  insert into public.support_ticket_msgs (ticket_number, author_external_id, author_role, body) values (p_ticket_number, uid, 'user', p_body);
  update public.support_tickets set status = 'open', last_message_at = now(), admin_unread = true where ticket_number = p_ticket_number;
  perform public._support_notify_admins('رد جديد على ' || p_ticket_number, left(p_body, 80));
  return jsonb_build_object('ok', true);
end $$;

-- المستخدم يغلق/يعيد فتح تذكرته
create or replace function public.support_user_set_status(p_ticket_number text, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('open', 'closed') then raise exception 'حالة غير صحيحة.'; end if;
  update public.support_tickets
     set status = p_status, admin_unread = (p_status = 'open')
   where ticket_number = p_ticket_number and user_external_id = auth.uid()::text;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- الإدمن: قائمة التذاكر (مع عدد الرسائل وآخر نشاط)
create or replace function public.admin_support_list()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'هذه الصفحة مخصصة للإدمن.'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc nulls last), '[]'::jsonb) from (
    select t.id, t.ticket_number, t.subject, t.message, t.name, t.email, t.priority, t.status, t.category, t.origin,
           t.created_at, t.last_message_at, t.admin_unread, t.user_external_id,
           (select count(*) from public.support_ticket_msgs m where m.ticket_number = t.ticket_number) as messages_count
    from public.support_tickets t order by t.last_message_at desc nulls last limit 1000
  ) x);
end $$;

-- الإدمن: محادثة تذكرة واحدة (ويعلّمها مقروءة)
create or replace function public.admin_support_thread(p_ticket_number text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  if not public.is_admin() then raise exception 'هذه الصفحة مخصصة للإدمن.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  update public.support_tickets set admin_unread = false where ticket_number = p_ticket_number;
  return jsonb_build_object(
    'ticket', to_jsonb(t),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('role', m.author_role, 'body', m.body, 'created_at', m.created_at) order by m.created_at)
                          from public.support_ticket_msgs m where m.ticket_number = p_ticket_number), '[]'::jsonb));
end $$;

-- الإدمن: رد على تذكرة (+ إشعار لصاحبها)
create or replace function public.admin_support_reply(p_ticket_number text, p_body text, p_status text default 'in_progress')
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.support_tickets%rowtype;
begin
  if not public.is_admin() then raise exception 'هذه الصفحة مخصصة للإدمن.'; end if;
  select * into t from public.support_tickets where ticket_number = p_ticket_number;
  if not found then raise exception 'التذكرة غير موجودة.'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'اكتب نص الرد.'; end if;
  insert into public.support_ticket_msgs (ticket_number, author_external_id, author_role, body)
  values (p_ticket_number, auth.uid()::text, 'admin', p_body);
  update public.support_tickets
     set status = case when p_status in ('open','in_progress','resolved','closed') then p_status else 'in_progress' end,
         last_message_at = now(), admin_unread = false
   where ticket_number = p_ticket_number;
  if t.user_external_id is not null then
    perform public._support_notify(t.user_external_id, 'رد جديد من الدعم', left(p_body, 100),
      case t.origin when 'seller' then 'seller.html#/support/' || p_ticket_number else 'profile.html' end);
  end if;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.support_create_ticket(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.support_my_tickets() to authenticated;
grant execute on function public.support_user_reply(text,text) to authenticated;
grant execute on function public.support_user_set_status(text,text) to authenticated;
grant execute on function public.admin_support_list() to authenticated;
grant execute on function public.admin_support_thread(text) to authenticated;
grant execute on function public.admin_support_reply(text,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) موقع الزائر (غير المسجّل) — يتحفظ بمعرّف الجهاز
-- ---------------------------------------------------------------------------
create table if not exists public.visitor_locations (
  device_id  text primary key check (char_length(device_id) between 8 and 80),
  latitude   double precision not null check (latitude between -90 and 90),
  longitude  double precision not null check (longitude between -180 and 180),
  address    text,
  accuracy   double precision,
  user_external_id text,
  updated_at timestamptz not null default now()
);
alter table public.visitor_locations enable row level security;
drop policy if exists visitor_locations_admin_select on public.visitor_locations;
create policy visitor_locations_admin_select on public.visitor_locations
  for select to authenticated using (public.is_admin());

create or replace function public.save_visitor_location(
  p_device text, p_lat double precision, p_lng double precision,
  p_address text default null, p_accuracy double precision default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_device is null or char_length(p_device) < 8 then raise exception 'معرّف الجهاز غير صالح.'; end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then raise exception 'إحداثيات غير صحيحة.'; end if;
  insert into public.visitor_locations (device_id, latitude, longitude, address, accuracy, user_external_id, updated_at)
  values (p_device, p_lat, p_lng, left(p_address, 300), p_accuracy, auth.uid()::text, now())
  on conflict (device_id) do update
     set latitude = excluded.latitude, longitude = excluded.longitude, address = excluded.address,
         accuracy = excluded.accuracy, user_external_id = coalesce(excluded.user_external_id, public.visitor_locations.user_external_id),
         updated_at = now();
end $$;
grant execute on function public.save_visitor_location(text,double precision,double precision,text,double precision) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) إحصائيات المشاهدات/السلة الحقيقية لكل منتج
-- ---------------------------------------------------------------------------
create table if not exists public.product_daily_stats (
  product_id uuid not null,
  store_id   uuid,
  day        date not null default current_date,
  views      integer not null default 0,
  carts      integer not null default 0,
  primary key (product_id, day)
);
create index if not exists product_daily_stats_store_idx on public.product_daily_stats (store_id, day);
alter table public.product_daily_stats enable row level security;
drop policy if exists product_daily_stats_admin_select on public.product_daily_stats;
create policy product_daily_stats_admin_select on public.product_daily_stats
  for select to authenticated using (public.is_admin());

create or replace function public.track_product_event(p_product uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if p_kind not in ('view', 'cart') then return; end if;
  select store_id into sid from public.products where id = p_product;
  if not found then return; end if;
  insert into public.product_daily_stats (product_id, store_id, day, views, carts)
  values (p_product, sid, current_date, (p_kind = 'view')::int, (p_kind = 'cart')::int)
  on conflict (product_id, day) do update
     set views = public.product_daily_stats.views + (p_kind = 'view')::int,
         carts = public.product_daily_stats.carts + (p_kind = 'cart')::int;
end $$;
grant execute on function public.track_product_event(uuid, text) to anon, authenticated;

create or replace function public.seller_product_stats(p_days integer default 90)
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('day', s.day, 'product_id', p.legacy_id, 'product_uuid', s.product_id,
                                               'views', s.views, 'carts', s.carts)), '[]'::jsonb)
  from public.product_daily_stats s
  join public.stores st on st.id = s.store_id and st.owner_external_id = auth.uid()::text
  left join public.products p on p.id = s.product_id
  where s.day >= current_date - greatest(1, least(p_days, 400));
$$;
grant execute on function public.seller_product_stats(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) بيانات لوحة البائع المحفوظة (محفظة / إعلانات / تفضيلات)
-- ---------------------------------------------------------------------------
create table if not exists public.seller_data (
  store_id   uuid not null,
  key        text not null check (key in ('wallet', 'ads', 'prefs')),
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (store_id, key)
);
alter table public.seller_data enable row level security;
drop policy if exists seller_data_admin_select on public.seller_data;
create policy seller_data_admin_select on public.seller_data
  for select to authenticated using (public.is_admin());

create or replace function public.seller_data_get()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_object_agg(d.key, d.value), '{}'::jsonb)
  from public.seller_data d join public.stores s on s.id = d.store_id
  where s.owner_external_id = auth.uid()::text;
$$;

create or replace function public.seller_data_set(p_key text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if p_key not in ('wallet', 'ads', 'prefs') then raise exception 'مفتاح غير مسموح.'; end if;
  if pg_column_size(p_value) > 3 * 1024 * 1024 then raise exception 'حجم البيانات كبير جداً.'; end if;
  select id into sid from public.stores where owner_external_id = auth.uid()::text order by created_at limit 1;
  if sid is null then raise exception 'لا يوجد متجر لهذا الحساب.'; end if;
  insert into public.seller_data (store_id, key, value, updated_at) values (sid, p_key, p_value, now())
  on conflict (store_id, key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.seller_data_get() to authenticated;
grant execute on function public.seller_data_set(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) التخزين: buckets الصور والفيديو (عامة للقراءة، الرفع للمسجّلين فقط)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-videos', 'product-videos', true, 52428800, array['video/mp4','video/webm','video/quicktime','video/ogg'])
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists nasaq_media_public_read on storage.objects;
create policy nasaq_media_public_read on storage.objects
  for select to public using (bucket_id in ('product-images', 'product-videos'));

drop policy if exists nasaq_media_auth_insert on storage.objects;
create policy nasaq_media_auth_insert on storage.objects
  for insert to authenticated with check (bucket_id in ('product-images', 'product-videos'));

drop policy if exists nasaq_media_auth_update on storage.objects;
create policy nasaq_media_auth_update on storage.objects
  for update to authenticated using (bucket_id in ('product-images', 'product-videos') and owner = auth.uid())
  with check (bucket_id in ('product-images', 'product-videos'));

drop policy if exists nasaq_media_auth_delete on storage.objects;
create policy nasaq_media_auth_delete on storage.objects
  for delete to authenticated using (bucket_id in ('product-images', 'product-videos') and owner = auth.uid());

-- ---------------------------------------------------------------------------
-- 6) فحص سريع بعد التشغيل (اختياري): لازم nearby_products ترجّع video_url
--    شغّل السطر ده لو الفيديو مش بيظهر للعملاء:
--      select pg_get_function_result('public.nearby_products'::regproc);
--    لو مفيهاش video_url مش مشكلة — الواجهة بتكمّله تلقائياً (products.js).
-- ---------------------------------------------------------------------------
