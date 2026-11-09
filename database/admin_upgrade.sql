-- ============================================================================
-- نَسَق (Nasaq) — admin_upgrade.sql
-- هذا الملف مُطبَّق بالفعل على قاعدة البيانات الحية (مشروع Supabase: nosoq،
-- dbzqejwsivgndftfnezb) بتاريخ 2026-09-23، على 3 دفعات (migrations):
--   1) admin_dashboard_upgrade
--   2) admin_dashboard_upgrade_lockdown
--   3) admin_dashboard_upgrade_lockdown_anon
-- محتواه هنا للمرجعية وإعادة التطبيق على أي بيئة تانية (staging مثلاً) —
-- لو شغّلته تاني على نفس القاعدة مفيش أي ضرر، كل حاجة فيه idempotent
-- (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
--
-- ملاحظة مهمة: الملف القديم بنفس الاسم كان "مسودة لم تُختبر ضد قاعدة
-- البيانات الفعلية" وفيه عدة فروق حقيقية عن السكيمة الفعلية (تم اكتشافها
-- بالفحص المباشر عبر Supabase MCP قبل أي تنفيذ):
--   * notifications: الجدول موجود بالفعل بأعمدة (kind, title, body, href,
--     read_at) — لم يُعَد إنشاؤه، واستُخدمت دالة public._notify() الموجودة.
--   * stores / riders: يستخدمان عمود review_note الموجود فعلاً (ومُستخدَم
--     بالفعل فى seller.js و rider.js) بدل عمود rejection_reason جديد —
--     لتفادي عمود مكرر وكسر أي كود موجود.
--   * marketplace_users: يستخدم عمود is_blocked الموجود فعلاً (لم يكن
--     مُستخدَمًا فى أي مكان بالواجهة) بدل عمود account_status جديد —
--     الحالة (active/disabled/deleted) تُحسب من is_blocked + deleted_at
--     الجديد، بدون تخزين مكرر.
--   * deliveries: يستخدم عمود fee الموجود فعلاً (يُحسب وقت إنشاء التوصيلة)
--     بدل عمود rider_fee جديد.
--   * الدالة الفعلية اسمها public.is_admin() مش public._is_admin().
--   * public.admin_review_entity() / admin_overview() / admin_assign_delivery()
--     موجودة ومُستخدَمة بالفعل فى الواجهة — أُعيد استخدامها بدل تكرار
--     منطق الموافقة/الرفض لكل من المتاجر والمناديب.
-- ============================================================================

-- =====================================================================
-- 1) أعمدة جديدة (كل عمود جديد كليًا على جدوله — بدون أي تكرار)
-- =====================================================================

-- مراجعة المنتجات (مفيش عمود مراجعة سابق على products إطلاقًا)
alter table public.products add column if not exists rejection_reason text;
alter table public.products add column if not exists reviewed_by text;
alter table public.products add column if not exists reviewed_at timestamptz;

-- عمولة المنصة لكل متجر (نسبة مئوية) — غير موجودة سابقًا، افتراضي 10%
alter table public.stores add column if not exists commission_rate numeric(5,2) not null default 10;

-- تاريخ الحذف الناعم للمستخدم — الحالة الكاملة تُحسب من is_blocked
-- (الموجود فعلاً) + deleted_at، بدون عمود status مكرر.
alter table public.marketplace_users add column if not exists deleted_at timestamptz;

-- =====================================================================
-- 2) جدول المعاملات المالية (transactions) — جديد بالكامل، مطلوب صراحة
--    فى الطلب ومش موجود قبل كده فى القاعدة.
-- =====================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  store_order_id uuid references public.store_orders (id) on delete set null,
  store_id uuid references public.stores (id) on delete set null,
  rider_id uuid references public.riders (id) on delete set null,
  customer_external_id text,
  amount numeric(12,2) not null default 0,          -- إجمالي بيع المتجر لهذا الطلب الفرعي (subtotal)
  commission_rate numeric(5,2) not null default 0,   -- نسبة عمولة المنصة وقت التسوية
  commission_amount numeric(12,2) not null default 0,-- قيمة عمولة المنصة
  rider_fee numeric(12,2) not null default 0,        -- أجرة المندوب (من deliveries.fee)
  net_seller_amount numeric(12,2) not null default 0,-- صافي ربح البائع = amount - commission - rider_fee
  status text not null default 'paid',               -- pending / paid / refunded / failed
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_status_check') then
    alter table public.transactions
      add constraint transactions_status_check check (status in ('pending', 'paid', 'refunded', 'failed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_store_order_key') then
    alter table public.transactions
      add constraint transactions_store_order_key unique (store_order_id);
  end if;
end $$;

create index if not exists transactions_order_idx on public.transactions (order_id);
create index if not exists transactions_store_idx on public.transactions (store_id);
create index if not exists transactions_rider_idx on public.transactions (rider_id);
create index if not exists transactions_customer_idx on public.transactions (customer_external_id);
create index if not exists transactions_created_idx on public.transactions (created_at desc);

alter table public.transactions enable row level security;

drop policy if exists transactions_admin_all on public.transactions;
create policy transactions_admin_all on public.transactions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists transactions_seller_select on public.transactions;
create policy transactions_seller_select on public.transactions
  for select using (
    exists (select 1 from public.stores s where s.id = transactions.store_id and s.owner_external_id = auth.uid()::text)
  );

drop policy if exists transactions_rider_select on public.transactions;
create policy transactions_rider_select on public.transactions
  for select using (
    exists (select 1 from public.riders r where r.id = transactions.rider_id and r.user_external_id = auth.uid()::text)
  );

drop policy if exists transactions_customer_select on public.transactions;
create policy transactions_customer_select on public.transactions
  for select using (customer_external_id = auth.uid()::text);

-- =====================================================================
-- 3) تسوية تلقائية حقيقية: تُنشئ معاملة مالية واحدة فقط لحظة تسليم الطلب
--    الفرعي فعليًا (لا بيانات وهمية إطلاقًا — كل صف transactions ناتج من
--    تسليم فعلي حصل فى النظام).
-- =====================================================================
create or replace function public._settle_store_order(p_store_order uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  so public.store_orders;
  o public.orders;
  s public.stores;
  d public.deliveries;
  v_commission numeric;
  v_rider_fee numeric;
begin
  select * into so from public.store_orders where id = p_store_order;
  if so.id is null then return; end if;
  select * into o from public.orders where id = so.order_id;
  select * into s from public.stores where id = so.store_id;
  select * into d from public.deliveries where store_order_id = p_store_order;

  v_commission := round(coalesce(so.subtotal, 0) * coalesce(s.commission_rate, 0) / 100, 2);
  v_rider_fee := coalesce(d.fee, 0);

  insert into public.transactions
    (order_id, store_order_id, store_id, rider_id, customer_external_id,
     amount, commission_rate, commission_amount, rider_fee, net_seller_amount, status)
  values (
    so.order_id, so.id, so.store_id, d.rider_id, o.customer_external_id,
    coalesce(so.subtotal, 0), coalesce(s.commission_rate, 0), v_commission, v_rider_fee,
    coalesce(so.subtotal, 0) - v_commission - v_rider_fee, 'paid'
  )
  on conflict (store_order_id) do nothing;
end;
$$;

-- دالة داخلية بحتة — لا تُمنح صلاحية تنفيذ لأي دور (anon/authenticated)،
-- تُستدعى فقط من داخل rider_delivery_action عبر perform.
revoke all on function public._settle_store_order(uuid) from public;
revoke all on function public._settle_store_order(uuid) from anon;
revoke all on function public._settle_store_order(uuid) from authenticated;

-- ربط التسوية بلحظة التسليم الفعلية: إضافة سطر واحد فقط
-- (perform public._settle_store_order(...)) داخل الدالة الموجودة بالفعل
-- rider_delivery_action، بدون تغيير أي سلوك آخر لها إطلاقًا.
create or replace function public.rider_delivery_action(p_rider uuid, p_delivery uuid, p_action text, p_note text DEFAULT NULL::text)
 RETURNS deliveries
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.riders; d public.deliveries; v_active int; v_owner text; v_num text; v_ok boolean;
begin
  select exists(select 1 from public.riders where id = p_rider and user_external_id = auth.uid()::text) or public.is_admin() into v_ok;
  if not v_ok then raise exception 'غير مصرح لك بهذا الإجراء'; end if;

  select * into r from public.riders where id = p_rider;
  if not found or r.status <> 'active' then raise exception 'حساب المندوب غير مفعّل بعد'; end if;

  if p_action = 'accept' then
    select count(*) into v_active from public.deliveries where rider_id = p_rider and status in ('assigned','picked_up');
    if v_active >= 5 then raise exception 'وصلت للحد الأقصى من الطلبات النشطة (5)'; end if;
    update public.deliveries
       set rider_id = p_rider, status = 'assigned', assigned_at = now(), updated_at = now()
     where id = p_delivery and status = 'unassigned' returning * into d;
    if not found then raise exception 'تم قبول هذا الطلب من مندوب آخر أو لم يعد متاحًا'; end if;
  else
    select * into d from public.deliveries where id = p_delivery and rider_id = p_rider for update;
    if not found then raise exception 'الطلب غير موجود ضمن طلباتك'; end if;
    if p_action = 'release' then
      if d.status <> 'assigned' then raise exception 'لا يمكن التخلي عن الطلب بعد الاستلام'; end if;
      update public.deliveries set rider_id = null, status = 'unassigned', assigned_at = null, updated_at = now()
       where id = d.id returning * into d;
    elsif p_action = 'pickup' then
      if d.status <> 'assigned' then raise exception 'الطلب ليس في حالة «تم القبول»'; end if;
      update public.deliveries set status = 'picked_up', picked_up_at = now(), updated_at = now()
       where id = d.id returning * into d;
      update public.store_orders set status = 'out_for_delivery', updated_at = now() where id = d.store_order_id;
    elsif p_action = 'deliver' then
      if d.status <> 'picked_up' then raise exception 'استلم الطلب من المتجر أولًا'; end if;
      update public.deliveries set status = 'delivered', delivered_at = now(), updated_at = now()
       where id = d.id returning * into d;
      update public.store_orders set status = 'delivered', updated_at = now() where id = d.store_order_id;
      perform public._settle_store_order(d.store_order_id);
    elsif p_action = 'fail' then
      if d.status not in ('assigned','picked_up') then raise exception 'لا يمكن تسجيل فشل التسليم في هذه الحالة'; end if;
      update public.deliveries set status = 'failed', note = p_note, updated_at = now()
       where id = d.id returning * into d;
      update public.store_orders set status = 'returned', updated_at = now() where id = d.store_order_id;
      perform public._restock_store_order(d.store_order_id);
    else
      raise exception 'إجراء غير معروف';
    end if;
  end if;

  perform public.sync_order_status(d.order_id);
  select owner_external_id into v_owner from public.stores where id = d.store_id;
  select order_number into v_num from public.orders where id = d.order_id;
  perform public._notify(v_owner, 'delivery',
    case p_action when 'accept' then 'مندوب قبل توصيل الطلب ' when 'pickup' then 'تم استلام الطلب من المتجر '
      when 'deliver' then 'تم تسليم الطلب ' when 'fail' then 'تعذّر تسليم الطلب ' else 'تحديث توصيل الطلب ' end || v_num,
    null, '#/orders');
  return d;
end $function$;

-- =====================================================================
-- 4) دوال لوحة الإدارة الجديدة (admin_*) — كلها SECURITY DEFINER، وكل
--    واحدة فيها تتحقق من public.is_admin() جوّاها أولًا قبل أي شيء.
-- =====================================================================

-- 4.1 مراجعة طلب تقديم (Application) — تعيد استخدام admin_review_entity
-- الموجودة فعلاً لو الطلب مرتبط بمتجر/مندوب (الحالة الشائعة عند التقديم
-- من نموذج seller/rider onboarding)، فلا يوجد منطق موافقة/رفض/إشعار
-- مكرر. فى حالة الطلبات القديمة بدون store_id/rider_id مرتبط، يتم تحديث
-- الطلب مباشرة وإرسال إشعار للمستخدم.
create or replace function public.admin_review_application(p_id uuid, p_status text, p_reason text default null)
returns public.applications
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_app public.applications;
  v_admin_email text;
  v_kind text;
  v_target uuid;
  v_mapped text;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  if p_status not in ('approved', 'rejected') then raise exception 'حالة غير صحيحة.'; end if;
  if p_status = 'rejected' and coalesce(trim(p_reason), '') = '' then raise exception 'اكتب سبب الرفض.'; end if;

  select email into v_admin_email from auth.users where id = auth.uid();
  select * into v_app from public.applications where id = p_id;
  if v_app.id is null then raise exception 'الطلب غير موجود.'; end if;

  if v_app.store_id is not null then
    v_kind := 'store'; v_target := v_app.store_id;
  elsif v_app.rider_id is not null then
    v_kind := 'rider'; v_target := v_app.rider_id;
  end if;

  v_mapped := case when p_status = 'approved' then 'active' else 'rejected' end;

  if v_kind is not null then
    perform public.admin_review_entity(v_kind, v_target, v_mapped, p_reason, v_admin_email);
  else
    update public.applications
       set status = p_status, reviewed_by = v_admin_email, reviewed_at = now(),
           review_note = coalesce(p_reason, review_note)
     where id = p_id;
    if v_app.user_external_id is not null then
      perform public._notify(v_app.user_external_id, 'review',
        case when p_status = 'approved' then 'تم قبول طلبك' else 'تم رفض طلبك' end,
        case when p_status = 'rejected' then coalesce(p_reason, 'لم يتم تحديد سبب.') else null end,
        null);
    end if;
    perform public._log(v_admin_email, null, 'application.' || p_status, 'application', p_id::text, jsonb_build_object('reason', p_reason));
  end if;

  select * into v_app from public.applications where id = p_id;
  return v_app;
end;
$$;

-- 4.2 نظرة عامة على المستخدمين (+ عدد الطلبات وإجمالي الإنفاق لكل مستخدم)
create or replace function public.admin_users_overview()
returns table (
  external_id text, email text, name text, phone text, role text,
  account_status text, created_at timestamptz, orders_count bigint, total_spent numeric
)
language sql stable security definer set search_path to 'public'
as $$
  select mu.external_id, mu.email, mu.name, mu.phone, mu.role,
    case when mu.deleted_at is not null then 'deleted' when mu.is_blocked then 'disabled' else 'active' end,
    mu.created_at, coalesce(o.cnt, 0), coalesce(o.total, 0)
  from public.marketplace_users mu
  left join (
    select customer_external_id, count(*) cnt, sum(total) total
    from public.orders group by customer_external_id
  ) o on o.customer_external_id = mu.external_id
  where public.is_admin()
  order by mu.created_at desc;
$$;

-- 4.3 تفعيل/تعطيل مستخدم (يستخدم is_blocked الموجود فعلاً)
create or replace function public.admin_set_user_status(p_external_id text, p_status text)
returns public.marketplace_users
language plpgsql security definer set search_path to 'public'
as $$
declare v_row public.marketplace_users;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  if p_status not in ('active', 'disabled') then raise exception 'حالة غير صحيحة.'; end if;
  update public.marketplace_users
     set is_blocked = (p_status = 'disabled')
   where external_id = p_external_id and deleted_at is null
   returning * into v_row;
  if v_row.external_id is null then raise exception 'المستخدم غير موجود أو محذوف.'; end if;
  perform public._notify(p_external_id, 'account',
    case when p_status = 'disabled' then 'تم تعطيل حسابك' else 'تم تفعيل حسابك' end, null, null);
  perform public._log((select email from auth.users where id = auth.uid()), null, 'user.' || p_status, 'user', p_external_id, '{}'::jsonb);
  return v_row;
end;
$$;

-- 4.4 حذف ناعم لمستخدم (تعطيل + إخفاء البيانات الشخصية، بدون لمس auth.users)
create or replace function public.admin_soft_delete_user(p_external_id text)
returns public.marketplace_users
language plpgsql security definer set search_path to 'public'
as $$
declare v_row public.marketplace_users;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  update public.marketplace_users
     set is_blocked = true, deleted_at = now(), name = 'مستخدم محذوف', phone = null, email = null
   where external_id = p_external_id
   returning * into v_row;
  if v_row.external_id is null then raise exception 'المستخدم غير موجود.'; end if;
  perform public._log((select email from auth.users where id = auth.uid()), null, 'user.deleted', 'user', p_external_id, '{}'::jsonb);
  return v_row;
end;
$$;

-- 4.5 نظرة عامة على البائعين (مبيعات/عمولة/أرباح من transactions الحقيقية)
create or replace function public.admin_sellers_overview()
returns table (
  store_id uuid, name text, slug text, phone text, email text, category text, status text,
  owner_external_id text, commission_rate numeric, created_at timestamptz,
  products_count bigint, orders_count bigint, total_sales numeric, commission_total numeric, net_earnings numeric
)
language sql stable security definer set search_path to 'public'
as $$
  select s.id, s.name, s.slug, s.phone, s.email, s.category, s.status, s.owner_external_id, s.commission_rate, s.created_at,
    coalesce(p.cnt, 0),
    coalesce(so.cnt, 0),
    coalesce(t.total, 0), coalesce(t.commission, 0), coalesce(t.net, 0)
  from public.stores s
  left join (select store_id, count(*) cnt from public.products group by store_id) p on p.store_id = s.id
  left join (select store_id, count(*) cnt from public.store_orders group by store_id) so on so.store_id = s.id
  left join (
    select store_id, sum(amount) total, sum(commission_amount) commission, sum(net_seller_amount) net
    from public.transactions where status = 'paid' group by store_id
  ) t on t.store_id = s.id
  where public.is_admin()
  order by s.created_at desc;
$$;

-- 4.6 أرباح بائع واحد (اليوم/الأسبوع/الشهر/كل الوقت) — من transactions
create or replace function public.admin_seller_earnings(p_store uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public'
as $$
declare v_rate numeric; v jsonb;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  select commission_rate into v_rate from public.stores where id = p_store;
  select jsonb_build_object(
    'commission_rate', coalesce(v_rate, 0),
    'today', coalesce((select sum(net_seller_amount) from public.transactions where store_id = p_store and status = 'paid' and (created_at at time zone 'Africa/Cairo')::date = (now() at time zone 'Africa/Cairo')::date), 0),
    'week', coalesce((select sum(net_seller_amount) from public.transactions where store_id = p_store and status = 'paid' and (created_at at time zone 'Africa/Cairo') >= date_trunc('week', now() at time zone 'Africa/Cairo')), 0),
    'month', coalesce((select sum(net_seller_amount) from public.transactions where store_id = p_store and status = 'paid' and (created_at at time zone 'Africa/Cairo') >= date_trunc('month', now() at time zone 'Africa/Cairo')), 0),
    'all_time', coalesce((select sum(net_seller_amount) from public.transactions where store_id = p_store and status = 'paid'), 0),
    'orders_count', coalesce((select count(*) from public.transactions where store_id = p_store and status = 'paid'), 0)
  ) into v;
  return v;
end;
$$;

-- 4.7 أرباح مندوب واحد — من transactions (rider_fee الفعلي المسدَّد)
create or replace function public.admin_rider_earnings(p_rider uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public'
as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  select jsonb_build_object(
    'today', coalesce((select sum(rider_fee) from public.transactions where rider_id = p_rider and status = 'paid' and (created_at at time zone 'Africa/Cairo')::date = (now() at time zone 'Africa/Cairo')::date), 0),
    'week', coalesce((select sum(rider_fee) from public.transactions where rider_id = p_rider and status = 'paid' and (created_at at time zone 'Africa/Cairo') >= date_trunc('week', now() at time zone 'Africa/Cairo')), 0),
    'month', coalesce((select sum(rider_fee) from public.transactions where rider_id = p_rider and status = 'paid' and (created_at at time zone 'Africa/Cairo') >= date_trunc('month', now() at time zone 'Africa/Cairo')), 0),
    'all_time', coalesce((select sum(rider_fee) from public.transactions where rider_id = p_rider and status = 'paid'), 0),
    'deliveries_count', coalesce((select count(*) from public.transactions where rider_id = p_rider and status = 'paid'), 0),
    'avg_fee', coalesce((select avg(rider_fee) from public.transactions where rider_id = p_rider and status = 'paid'), 0)
  ) into v;
  return v;
end;
$$;

-- 4.8 لوحة مالية عامة
create or replace function public.admin_financial_summary()
returns jsonb language plpgsql stable security definer set search_path to 'public'
as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  select jsonb_build_object(
    'total_sales', coalesce((select sum(total) from public.orders where status <> 'cancelled'), 0),
    'platform_commission', coalesce((select sum(commission_amount) from public.transactions where status = 'paid'), 0),
    'seller_earnings', coalesce((select sum(net_seller_amount) from public.transactions where status = 'paid'), 0),
    'rider_earnings', coalesce((select sum(rider_fee) from public.transactions where status = 'paid'), 0),
    'paid', coalesce((select sum(amount) from public.transactions where status = 'paid'), 0),
    'pending', coalesce((select sum(amount) from public.transactions where status = 'pending'), 0),
    'refunded', coalesce((select sum(amount) from public.transactions where status = 'refunded'), 0)
  ) into v;
  return v;
end;
$$;

-- 4.9 مراجعة منتج (قبول/رفض بسبب/إخفاء/أرشفة)
create or replace function public.admin_review_product(p_id uuid, p_status text, p_reason text default null)
returns public.products language plpgsql security definer set search_path to 'public'
as $$
declare v_row public.products; v_admin_email text;
begin
  if not public.is_admin() then raise exception 'غير مصرح.'; end if;
  if p_status not in ('active', 'rejected', 'hidden', 'pending', 'archived') then raise exception 'حالة غير صحيحة.'; end if;
  if p_status = 'rejected' and coalesce(trim(p_reason), '') = '' then raise exception 'اكتب سبب الرفض.'; end if;
  select email into v_admin_email from auth.users where id = auth.uid();
  update public.products
     set status = p_status,
         rejection_reason = case when p_status = 'rejected' then p_reason else rejection_reason end,
         reviewed_by = v_admin_email, reviewed_at = now(), updated_at = now()
   where id = p_id
   returning * into v_row;
  if v_row.id is null then raise exception 'المنتج غير موجود.'; end if;
  if v_row.seller_external_id is not null and p_status in ('active', 'rejected') then
    perform public._notify(v_row.seller_external_id,
      'product',
      case when p_status = 'active' then 'تم قبول منتجك' else 'تم رفض منتجك' end,
      case when p_status = 'rejected' then coalesce(p_reason, 'لم يتم تحديد سبب.') else v_row.name end,
      'seller.html');
  end if;
  perform public._log(v_admin_email, null, 'product.' || p_status, 'product', p_id::text, jsonb_build_object('reason', p_reason));
  return v_row;
end;
$$;

-- =====================================================================
-- 5) صلاحيات التنفيذ (grant/revoke) للدوال الجديدة فقط
-- =====================================================================
-- ملحوظة: مشروع Supabase ده بيمنح EXECUTE افتراضيًا لكل من anon و
-- authenticated على أي دالة جديدة فى public (default privileges). فبعد
-- إنشاء الدوال، لازم نسحب الصلاحية من anon صراحة (مش كفاية نسحبها من
-- PUBLIC بس) عشان تفضل الدوال دي متاحة لـ authenticated بس (زي باقي كل
-- دوال admin_* الموجودة أصلاً فى المشروع)، والتحقق الحقيقي بيحصل جوّا كل
-- دالة بـ public.is_admin().
revoke execute on function public.admin_review_application(uuid, text, text) from public, anon;
revoke execute on function public.admin_users_overview() from public, anon;
revoke execute on function public.admin_set_user_status(text, text) from public, anon;
revoke execute on function public.admin_soft_delete_user(text) from public, anon;
revoke execute on function public.admin_sellers_overview() from public, anon;
revoke execute on function public.admin_seller_earnings(uuid) from public, anon;
revoke execute on function public.admin_rider_earnings(uuid) from public, anon;
revoke execute on function public.admin_financial_summary() from public, anon;
revoke execute on function public.admin_review_product(uuid, text, text) from public, anon;

grant execute on function public.admin_review_application(uuid, text, text) to authenticated;
grant execute on function public.admin_users_overview() to authenticated;
grant execute on function public.admin_set_user_status(text, text) to authenticated;
grant execute on function public.admin_soft_delete_user(text) to authenticated;
grant execute on function public.admin_sellers_overview() to authenticated;
grant execute on function public.admin_seller_earnings(uuid) to authenticated;
grant execute on function public.admin_rider_earnings(uuid) to authenticated;
grant execute on function public.admin_financial_summary() to authenticated;
grant execute on function public.admin_review_product(uuid, text, text) to authenticated;

-- =====================================================================
-- نهاية الملف — تم التحقق بعد التطبيق عبر:
--   * محاكاة جلسة أدمن حقيقية (admin@nasaq.app) لكل دالة جديدة.
--   * محاكاة جلسة مستخدم عادي (غير أدمن) للتأكد من الرفض.
--   * Supabase Security Advisor (get_advisors) قبل وبعد — تأكيد عدم وجود
--     أي دالة SECURITY DEFINER جديدة متاحة لـ anon.
-- =====================================================================
