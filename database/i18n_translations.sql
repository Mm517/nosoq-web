-- =====================================================================
-- i18n_translations.sql  —  نظام الترجمة (ar / en / de) للمنتجات والأقسام
-- آمن ومتراكم (additive): لا حذف لأي بيانات، ويمكن تشغيله أكثر من مرة.
-- =====================================================================
begin;

-- 1) ترجمات المنتجات: أعمدة لكل لغة داخل جدول products نفسه
--    (اخترنا الأعمدة بدل جدول product_translations لأن دالة nearby_products وكل استعلامات
--     الموقع تقرأ من products مباشرة، فلا نحتاج JOIN إضافي ولا تغيير في سياسات RLS الحالية).
alter table public.products
  add column if not exists name_ar text,
  add column if not exists name_en text,
  add column if not exists name_de text,
  add column if not exists description_ar text,
  add column if not exists description_en text,
  add column if not exists description_de text;

-- 2) المنتجات القديمة: العربية هي المصدر (name/description الحاليان يُنسخان إلى *_ar)
update public.products
   set name_ar = coalesce(nullif(name_ar, ''), name),
       description_ar = coalesce(nullif(description_ar, ''), description)
 where name_ar is null or name_ar = '' or (description_ar is null and description is not null);

-- 3) تزامن عكسي: العمودان القديمان name/description يفضلان = العربية (توافق مع أي كود قديم)
create or replace function public.products_sync_i18n() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    -- كود قديم عدّل name/description فقط -> ننقله للعربية
    if new.name is distinct from old.name and new.name_ar is not distinct from old.name_ar then
      new.name_ar := new.name;
    end if;
    if new.description is distinct from old.description and new.description_ar is not distinct from old.description_ar then
      new.description_ar := new.description;
    end if;
  end if;
  if coalesce(new.name_ar, '') = '' then new.name_ar := new.name; end if;
  if coalesce(new.description_ar, '') = '' then new.description_ar := new.description; end if;
  new.name := coalesce(nullif(new.name_ar, ''), new.name);
  new.description := coalesce(nullif(new.description_ar, ''), new.description);
  -- نص فارغ = "لا توجد ترجمة" (يُخزَّن null ليعمل الـ fallback)
  new.name_en := nullif(btrim(coalesce(new.name_en, '')), '');
  new.name_de := nullif(btrim(coalesce(new.name_de, '')), '');
  new.description_en := nullif(btrim(coalesce(new.description_en, '')), '');
  new.description_de := nullif(btrim(coalesce(new.description_de, '')), '');
  return new;
end $$;

drop trigger if exists trg_products_sync_i18n on public.products;
create trigger trg_products_sync_i18n before insert or update on public.products
  for each row execute function public.products_sync_i18n();

-- 4) الأقسام (Categories) والأقسام الفرعية بثلاث لغات
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  parent_slug text,
  name_ar text not null,
  name_en text,
  name_de text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categories_slug_parent_uq on public.categories (slug, coalesce(parent_slug, ''));
alter table public.categories enable row level security;

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.categories to anon, authenticated;

insert into public.categories (slug, parent_slug, name_ar, name_en, name_de, sort_order) values
('electronics', null, 'إلكترونيات', 'Electronics', 'Elektronik', 100),
('tvs', 'electronics', 'تلفزيونات', 'TVs', 'Fernseher', 101),
('headsets', 'electronics', 'سماعات', 'Headphones', 'Kopfhörer', 102),
('games', 'electronics', 'ألعاب فيديو', 'Video Games', 'Videospiele', 103),
('mobiles', 'electronics', 'موبايلات', 'Mobile Phones', 'Handys', 104),
('cameras', 'electronics', 'كاميرات', 'Cameras', 'Kameras', 105),
('wearables', 'electronics', 'ساعات ذكية', 'Smartwatches', 'Smartwatches', 106),
('laptops', 'electronics', 'لابتوب', 'Laptops', 'Laptops', 107),
('appliances', null, 'أجهزة منزلية', 'Home Appliances', 'Haushaltsgeräte', 200),
('fridges', 'appliances', 'ثلاجات', 'Refrigerators', 'Kühlschränke', 201),
('washers', 'appliances', 'غسالات', 'Washing Machines', 'Waschmaschinen', 202),
('ac', 'appliances', 'تكييفات', 'Air Conditioners', 'Klimaanlagen', 203),
('cookers', 'appliances', 'بوتاجازات', 'Cookers', 'Herde', 204),
('smallapp', 'appliances', 'أجهزة مطبخ', 'Kitchen Appliances', 'Küchengeräte', 205),
('vacuums', 'appliances', 'مكانس', 'Vacuum Cleaners', 'Staubsauger', 206),
('home', null, 'المنزل والمطبخ', 'Home & Kitchen', 'Haus & Küche', 300),
('furniture', 'home', 'أثاث', 'Furniture', 'Möbel', 301),
('cookware', 'home', 'أواني الطهي', 'Cookware', 'Kochgeschirr', 302),
('lighting', 'home', 'إضاءة', 'Lighting', 'Beleuchtung', 303),
('bedding', 'home', 'مفروشات', 'Bedding', 'Bettwaren', 304),
('decor', 'home', 'ديكور', 'Decor', 'Dekoration', 305),
('storage', 'home', 'تخزين وتنظيم', 'Storage & Organization', 'Aufbewahrung & Ordnung', 306),
('clothes', null, 'ملابس', 'Clothing', 'Kleidung', 400),
('women', 'clothes', 'نسائي', 'Women', 'Damen', 401),
('men', 'clothes', 'رجالي', 'Men', 'Herren', 402),
('kids', 'clothes', 'أطفال', 'Kids', 'Kinder', 403),
('sportswear', 'clothes', 'ملابس رياضية', 'Sportswear', 'Sportbekleidung', 404),
('shoes', null, 'أحذية', 'Shoes', 'Schuhe', 500),
('womenshoes', 'shoes', 'نسائي', 'Women', 'Damen', 501),
('menshoes', 'shoes', 'رجالي', 'Men', 'Herren', 502),
('kidsshoes', 'shoes', 'أطفال', 'Kids', 'Kinder', 503),
('sportshoes', 'shoes', 'رياضي', 'Sports', 'Sport', 504),
('bags', null, 'حقائب', 'Bags', 'Taschen', 600),
('handbags', 'bags', 'حقائب يد', 'Handbags', 'Handtaschen', 601),
('backpacks', 'bags', 'شنط ظهر', 'Backpacks', 'Rucksäcke', 602),
('travel', 'bags', 'حقائب سفر', 'Travel Bags', 'Reisetaschen', 603),
('wallets', 'bags', 'محافظ', 'Wallets', 'Geldbörsen', 604),
('accessories', null, 'إكسسوارات', 'Accessories', 'Accessoires', 700),
('watches', 'accessories', 'ساعات', 'Watches', 'Uhren', 701),
('sunglasses', 'accessories', 'نظارات', 'Sunglasses', 'Sonnenbrillen', 702),
('jewelry', 'accessories', 'مجوهرات', 'Jewelry', 'Schmuck', 703),
('hats', 'accessories', 'قبعات وأوشحة', 'Hats & Scarves', 'Hüte & Schals', 704),
('beauty', null, 'الجمال والعناية', 'Beauty & Care', 'Schönheit & Pflege', 800),
('perfumes', 'beauty', 'عطور', 'Perfumes', 'Parfüms', 801),
('makeup', 'beauty', 'مكياج', 'Makeup', 'Make-up', 802),
('skincare', 'beauty', 'عناية بالبشرة', 'Skincare', 'Hautpflege', 803),
('haircare', 'beauty', 'عناية بالشعر', 'Haircare', 'Haarpflege', 804),
('supermarket', null, 'سوبر ماركت', 'Supermarket', 'Supermarkt', 900),
('groceries', 'supermarket', 'مواد غذائية', 'Groceries', 'Lebensmittel', 901),
('drinks', 'supermarket', 'مشروبات', 'Drinks', 'Getränke', 902),
('cooking', 'supermarket', 'زيوت وطبخ', 'Oils & Cooking', 'Öle & Kochen', 903),
('cleaning', 'supermarket', 'منظفات', 'Cleaning Supplies', 'Reinigungsmittel', 904),
('toys', null, 'ألعاب وأطفال', 'Toys & Kids', 'Spielzeug & Kinder', 1000),
('plush', 'toys', 'ألعاب محشوة', 'Plush Toys', 'Kuscheltiere', 1001),
('building', 'toys', 'ألعاب تركيب', 'Building Toys', 'Bauspielzeug', 1002),
('vehicles', 'toys', 'سيارات ومركبات', 'Cars & Vehicles', 'Autos & Fahrzeuge', 1003),
('sports', null, 'رياضة ولياقة', 'Sports & Fitness', 'Sport & Fitness', 1100),
('football', 'sports', 'كرات', 'Balls', 'Bälle', 1101),
('fitness', 'sports', 'أجهزة لياقة', 'Fitness Equipment', 'Fitnessgeräte', 1102),
('yoga', 'sports', 'يوجا', 'Yoga', 'Yoga', 1103),
('cycling', 'sports', 'دراجات', 'Bicycles', 'Fahrräder', 1104),
('books', null, 'كتب وقرطاسية', 'Books & Stationery', 'Bücher & Schreibwaren', 1200),
('books', 'books', 'كتب', 'Books', 'Bücher', 1201),
('stationery', 'books', 'قرطاسية', 'Stationery', 'Schreibwaren', 1202),
('school', 'books', 'شنط مدرسية', 'School Bags', 'Schultaschen', 1203),
('auto', null, 'السيارات', 'Automotive', 'Auto', 1300),
('tires', 'auto', 'إطارات', 'Tires', 'Reifen', 1301),
('autooils', 'auto', 'زيوت وسوائل', 'Oils & Fluids', 'Öle & Flüssigkeiten', 1302),
('motoacc', 'auto', 'إكسسوارات', 'Accessories', 'Zubehör', 1303),
('pets', null, 'حيوانات أليفة', 'Pets', 'Haustiere', 1400),
('petfood', 'pets', 'طعام', 'Food', 'Futter', 1401),
('petacc', 'pets', 'مستلزمات', 'Supplies', 'Zubehör', 1402),
('pettoys', 'pets', 'ألعاب', 'Toys', 'Spielzeug', 1403),
('tools', null, 'عدد وأدوات', 'Tools', 'Werkzeug', 1500),
('power', 'tools', 'أدوات كهربائية', 'Power Tools', 'Elektrowerkzeuge', 1501),
('hand', 'tools', 'عدد يدوية', 'Hand Tools', 'Handwerkzeuge', 1502),
('worklight', 'tools', 'إضاءة ورش', 'Work Lights', 'Arbeitsleuchten', 1503)
on conflict (slug, coalesce(parent_slug, '')) do nothing;

-- 5) nearby_products ترجع الآن أعمدة الترجمة أيضاً (نفس الوسائط ونفس الأعمدة القديمة + 6 جديدة في النهاية)
drop function if exists public.nearby_products(double precision, double precision, numeric, integer);
create function public.nearby_products(buyer_lat double precision, buyer_lng double precision, radius_km numeric default 50, p_limit integer default 500)
 returns table(id uuid, legacy_id integer, store_id uuid, name text, category text, price numeric, old_price numeric, stock integer, sku text, description text, details jsonb, sizes text[], colors jsonb, photos text[], added_at timestamptz, store_name text, store_slug text, distance_m double precision, video_url text, color_variants jsonb,
               name_ar text, name_en text, name_de text, description_ar text, description_en text, description_de text)
 language sql stable
 set search_path to 'public', 'extensions'
as $function$
  select p.id, p.legacy_id, p.store_id, p.name, p.category, p.price, p.old_price, p.stock,
         p.sku, p.description, p.details, p.sizes, p.colors, p.photos, p.added_at,
         ns.name as store_name, ns.slug as store_slug, ns.distance_m,
         p.video_url,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'id', pc.id, 'name', pc.name, 'hex', pc.hex, 'stock', pc.stock,
             'images', coalesce((
               select jsonb_agg(pi.public_url order by pi.sort_order)
               from public.product_images pi
               where pi.color_id = pc.id
             ), '[]'::jsonb)
           ) order by pc.sort_order)
           from public.product_colors pc
           where pc.product_id = p.id
         ), '[]'::jsonb) as color_variants,
         p.name_ar, p.name_en, p.name_de, p.description_ar, p.description_en, p.description_de
  from public.nearby_stores(buyer_lat, buyer_lng, radius_km) ns
  join public.products p on p.store_id = ns.id
  where p.status = 'active'
  order by ns.distance_m asc, p.added_at desc
  limit greatest(p_limit, 1);
$function$;
grant execute on function public.nearby_products(double precision, double precision, numeric, integer) to anon, authenticated;

commit;
