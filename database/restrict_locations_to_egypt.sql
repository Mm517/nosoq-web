-- (مطبَّق بالفعل على قاعدة البيانات) حصر المواقع داخل مصر
alter table public.marketplace_users drop constraint if exists marketplace_users_location_egypt_chk;
alter table public.marketplace_users add constraint marketplace_users_location_egypt_chk
  check (latitude is null or longitude is null or (latitude between 21.5 and 31.95 and longitude between 24.5 and 37.0));
alter table public.visitor_locations drop constraint if exists visitor_locations_egypt_chk;
alter table public.visitor_locations add constraint visitor_locations_egypt_chk
  check (latitude between 21.5 and 31.95 and longitude between 24.5 and 37.0);
-- + دالة save_visitor_location بتترفض خارج الحدود (راجع nosoq_upgrade_v2.sql مع شرط الحدود)
