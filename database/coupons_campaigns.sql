-- ===========================================================================
-- coupons_campaigns.sql — ربط الكوبونات والحملات الإعلانية بـ Supabase
-- شغّله مرة واحدة من: Supabase Dashboard → SQL Editor → New query → Run
-- (آمن لو اتشغّل أكتر من مرة)
--
-- بيعمل:
--   1) جدول coupons       : أكواد الخصم (منصة كاملة أو خاصة بمتجر بائع)
--   2) جدول campaigns     : الحملات الإعلانية اللي البائع بينشرها (كانت في localStorage فقط)
--   3) view  public_campaigns : النسخة العامة للحملات النشطة (اللي الزوار بيشوفوها)
--   4) دوال RPC:
--        validate_coupon(code, subtotal)   تحقق من الكود في السيرفر
--        redeem_coupon(code)               زيادة عدّاد الاستخدام بعد نجاح الطلب
--        seller_campaigns_sync(list)       البائع يرفع حملاته
--        campaign_track(id, kind)          عدّ مشاهدات/نقرات الحملة
--        admin_set_campaign_paused(id, b)  الأدمن يوقف/يشغّل أي حملة
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) الكوبونات
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  type          text not null check (type in ('percent', 'fixed', 'shipping')),
  value         numeric(10,2) not null default 0 check (value >= 0),
  min_order     numeric(10,2) not null default 0 check (min_order >= 0),
  max_discount  numeric(10,2),                       -- سقف الخصم للنسبة المئوية (اختياري)
  label         text not null default '',
  store_id      uuid references public.stores(id) on delete cascade,   -- null = كوبون المنصة كلها
  starts_at     timestamptz,
  ends_at       timestamptz,
  usage_limit   integer check (usage_limit is null or usage_limit > 0),
  used_count    integer not null default 0,
  active        boolean not null default true,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- الكود فريد (بغض النظر عن حالة الأحرف)
create unique index if not exists coupons_code_uq on public.coupons (upper(code));
create index if not exists coupons_store_idx on public.coupons (store_id);

alter table public.coupons enable row level security;

drop policy if exists coupons_public_read   on public.coupons;
drop policy if exists coupons_admin_all     on public.coupons;
drop policy if exists coupons_seller_select on public.coupons;
drop policy if exists coupons_seller_insert on public.coupons;
drop policy if exists coupons_seller_update on public.coupons;
drop policy if exists coupons_seller_delete on public.coupons;

-- الزوار والعملاء: يقروا الكوبونات الشغّالة بس
create policy coupons_public_read on public.coupons
  for select to anon, authenticated
  using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
    and (usage_limit is null or used_count < usage_limit)
  );

-- الأدمن: كل حاجة
create policy coupons_admin_all on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- البائع: كوبونات متجره هو بس (قراءة كاملة حتى المتوقفة/المنتهية، وإضافة وتعديل وحذف)
create policy coupons_seller_select on public.coupons
  for select to authenticated
  using (store_id in (select id from public.stores where owner_external_id = auth.uid()::text));
create policy coupons_seller_insert on public.coupons
  for insert to authenticated
  with check (store_id in (select id from public.stores where owner_external_id = auth.uid()::text));
create policy coupons_seller_update on public.coupons
  for update to authenticated
  using      (store_id in (select id from public.stores where owner_external_id = auth.uid()::text))
  with check (store_id in (select id from public.stores where owner_external_id = auth.uid()::text));
create policy coupons_seller_delete on public.coupons
  for delete to authenticated
  using (store_id in (select id from public.stores where owner_external_id = auth.uid()::text));

-- نفس الأكواد الثلاثة اللي كانت مكتوبة جوه cart.js (تتحط مرة واحدة فقط)
insert into public.coupons (code, type, value, min_order, label)
values
  ('NASAQ10',   'percent',  10,  0,   'خصم 10%'),
  ('WELCOME50', 'fixed',    50,  300, 'خصم 50 ج.م على الطلبات فوق 300'),
  ('FREESHIP',  'shipping', 0,   0,   'شحن مجاني')
on conflict (upper(code)) do nothing;

-- ---------------------------------------------------------------------------
-- 2) تحقق الكوبون في السيرفر (مش بنثق في المتصفح)
--    بترجّع: {ok, code, type, value, min, max_discount, label, store_id, discount, free_shipping, message}
-- ---------------------------------------------------------------------------
create or replace function public.validate_coupon(p_code text, p_subtotal numeric default 0)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare c public.coupons; d numeric := 0;
begin
  select * into c from public.coupons where upper(code) = upper(btrim(coalesce(p_code, ''))) limit 1;
  if not found or not c.active then
    return jsonb_build_object('ok', false, 'message', 'كود الخصم غير صحيح أو منتهي');
  end if;
  if c.starts_at is not null and c.starts_at > now() then
    return jsonb_build_object('ok', false, 'message', 'هذا الكوبون لم يبدأ بعد');
  end if;
  if c.ends_at is not null and c.ends_at < now() then
    return jsonb_build_object('ok', false, 'message', 'انتهت صلاحية هذا الكوبون');
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return jsonb_build_object('ok', false, 'message', 'تم استنفاد هذا الكوبون');
  end if;
  if c.min_order > 0 and coalesce(p_subtotal, 0) < c.min_order then
    return jsonb_build_object('ok', false, 'message', 'يتطلب الكوبون طلباً بقيمة ' || c.min_order::text || ' على الأقل');
  end if;
  if c.type = 'percent' then
    d := round(coalesce(p_subtotal, 0) * c.value / 100, 2);
    if c.max_discount is not null then d := least(d, c.max_discount); end if;
  elsif c.type = 'fixed' then
    d := least(c.value, coalesce(p_subtotal, 0));
  end if;
  return jsonb_build_object(
    'ok', true, 'code', upper(c.code), 'type', c.type, 'value', c.value, 'min', c.min_order,
    'max_discount', c.max_discount, 'label', c.label, 'store_id', c.store_id,
    'discount', d, 'free_shipping', c.type = 'shipping', 'message', 'تم تطبيق الكوبون'
  );
end $$;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;

-- زيادة عدّاد الاستخدام بعد نجاح الطلب (ذرّية، وبتحترم usage_limit)
create or replace function public.redeem_coupon(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.coupons
     set used_count = used_count + 1, updated_at = now()
   where upper(code) = upper(btrim(coalesce(p_code, '')))
     and active
     and (usage_limit is null or used_count < usage_limit);
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end $$;
grant execute on function public.redeem_coupon(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) الحملات الإعلانية
--    id نصي (AD....) زي ما لوحة البائع بتولّده — فبنقدر نعمل upsert من غير تعديل منطق اللوحة.
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id            text primary key,
  store_id      uuid not null references public.stores(id) on delete cascade,
  type          text not null check (type in ('hero', 'category', 'product')),
  name          text not null,
  title         text not null default '',
  text          text not null default '',
  cta           text not null default '',
  img           text not null default '',
  href          text not null default '',
  product_legacy_id integer,                          -- products.legacy_id (رقم المنتج في الواجهة)
  category      text not null default '',
  start_date    date not null,
  days          integer not null check (days > 0),
  paused        boolean not null default false,
  impressions   integer not null default 0,
  clicks        integer not null default 0,
  total         numeric(10,2) not null default 0,
  per_day       numeric(10,2) not null default 0,
  source        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists campaigns_store_idx  on public.campaigns (store_id);
create index if not exists campaigns_window_idx on public.campaigns (start_date, days);

alter table public.campaigns enable row level security;
drop policy if exists campaigns_admin_all     on public.campaigns;
drop policy if exists campaigns_seller_select on public.campaigns;
create policy campaigns_admin_all on public.campaigns
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy campaigns_seller_select on public.campaigns
  for select to authenticated
  using (store_id in (select id from public.stores where owner_external_id = auth.uid()::text));
-- (مفيش insert/update للبائع مباشرة — بيعدّي من seller_campaigns_sync اللي بتتحقق من المتجر)

-- النسخة العامة: الحملات النشطة الآن فقط، ومن غير بيانات مالية
create or replace view public.public_campaigns as
  select c.id, c.store_id, s.slug as store_slug, s.name as store_name,
         c.type, c.name, c.title, c.text, c.cta, c.img, c.href,
         c.product_legacy_id, c.category, c.start_date, c.days, c.paused
    from public.campaigns c
    join public.stores s on s.id = c.store_id
   -- هامش يوم واحد في الطرفين عشان فرق التوقيت (القاهرة/UTC)؛ الواجهة بتفلتر بدقة بعد كده
   where not c.paused
     and c.start_date <= current_date + 1
     and current_date <= c.start_date + (c.days - 1) + 1
     and s.status = 'active';
grant select on public.public_campaigns to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) البائع يرفع حملاته (القائمة كاملة) — بتتحقق إن المتجر بتاعه
--    p_list: مصفوفة JSON بنفس شكل حملات لوحة البائع (market.js → ads.list())
-- ---------------------------------------------------------------------------
create or replace function public.seller_campaigns_sync(p_list jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare sid uuid; it jsonb; ids text[] := '{}'; n integer := 0;
begin
  select id into sid from public.stores where owner_external_id = auth.uid()::text order by created_at limit 1;
  if sid is null then raise exception 'لا يوجد متجر لهذا الحساب.'; end if;
  if jsonb_typeof(coalesce(p_list, '[]'::jsonb)) <> 'array' then raise exception 'صيغة غير صالحة.'; end if;

  for it in select * from jsonb_array_elements(p_list) loop
    if coalesce(it->>'id', '') = '' or it->>'type' not in ('hero', 'category', 'product') then continue; end if;
    insert into public.campaigns as c (
      id, store_id, type, name, title, text, cta, img, href, product_legacy_id, category,
      start_date, days, paused, impressions, clicks, total, per_day, source, created_at, updated_at
    ) values (
      it->>'id', sid, it->>'type',
      left(coalesce(it->>'name', ''), 80), left(coalesce(it->>'title', ''), 120), left(coalesce(it->>'text', ''), 200),
      left(coalesce(it->>'cta', ''), 40), coalesce(it->>'img', ''), left(coalesce(it->>'href', ''), 500),
      nullif(it->>'productId', '')::integer, coalesce(it->>'category', ''),
      (it->>'start')::date, greatest(1, (it->>'days')::integer), coalesce((it->>'paused')::boolean, false),
      coalesce((it->>'impressions')::integer, 0), coalesce((it->>'clicks')::integer, 0),
      coalesce((it->>'total')::numeric, 0), coalesce((it->>'perDay')::numeric, 0), it->>'source',
      coalesce((it->>'createdAt')::timestamptz, now()), now()
    )
    on conflict (id) do update set
      name = excluded.name, title = excluded.title, text = excluded.text, cta = excluded.cta,
      img = excluded.img, href = excluded.href, product_legacy_id = excluded.product_legacy_id,
      category = excluded.category, start_date = excluded.start_date, days = excluded.days,
      paused = excluded.paused,
      -- العدّادات: نحتفظ بالأكبر عشان مشاهدات الزوار (campaign_track) ماتتمسحش من نسخة قديمة في المتصفح
      impressions = greatest(c.impressions, excluded.impressions),
      clicks = greatest(c.clicks, excluded.clicks),
      updated_at = now()
    where c.store_id = sid;                       -- ماينفعش البائع يعدّل حملة متجر تاني
    ids := ids || (it->>'id');
    n := n + 1;
  end loop;

  -- اللي اتمسح من لوحة البائع يتمسح هنا كمان
  delete from public.campaigns where store_id = sid and not (id = any(ids));
  return jsonb_build_object('ok', true, 'count', n);
end $$;
grant execute on function public.seller_campaigns_sync(jsonb) to authenticated;

-- عدّاد المشاهدات والنقرات (الزائر مش محتاج تسجيل دخول)
create or replace function public.campaign_track(p_id text, p_kind text)
returns void language sql security definer set search_path = public as $$
  update public.campaigns
     set impressions = impressions + (case when p_kind = 'impression' then 1 else 0 end),
         clicks      = clicks      + (case when p_kind = 'click'      then 1 else 0 end)
   where id = p_id and p_kind in ('impression', 'click');
$$;
grant execute on function public.campaign_track(text, text) to anon, authenticated;

-- الأدمن: إيقاف/تشغيل أي حملة
create or replace function public.admin_set_campaign_paused(p_id text, p_paused boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  update public.campaigns set paused = p_paused, updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.admin_set_campaign_paused(text, boolean) to authenticated;
