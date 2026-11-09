# نظام الترجمة (ar / en / de) — نَسَق

## الملفات
- `js/i18n.js` — المحرك: `I18n.set('de')` ، `t('cart')` ، اللغة المحفوظة في `localStorage` (`nasaq_lang_v1`) والافتراضية العربية. التغيير فوري بدون إعادة تحميل.
- `js/i18n-dict.js` — القاموس المركزي: `keys` (مفاتيح مثل `add_to_cart`) و`phrases` (نص عربي ← English / Deutsch، الأرقام تُكتب `{n}`).
- `i18n_translations.sql` — الـ migration (مُطبَّق على مشروع nosoq بالفعل، ويمكن إعادة تشغيله بأمان).

## الداتابيس
- `products`: أعمدة جديدة `name_ar/en/de` و`description_ar/en/de`. المنتجات القديمة نُسخ اسمها ووصفها إلى `*_ar` (لا حذف). العمودان `name` و`description` يفضلان = العربية عبر trigger (`products_sync_i18n`).
- `categories` (جدول جديد): `slug, parent_slug, name_ar, name_en, name_de` — 15 قسماً رئيسياً + 62 فرعياً. القراءة للجميع، والكتابة للأدمن فقط.
- `nearby_products` ترجع أعمدة الترجمة الستة.

## ترتيب الـ fallback
Deutsch → English → العربية ، وEnglish → العربية.

## إضافة ترجمة جديدة
1. نص ثابت: أضف سطراً في `phrases` (أو مفتاحاً في `keys`) داخل `js/i18n-dict.js`.
2. في الكود: `I18n.t('add_to_cart')` أو `t('add_to_cart')`، أو `data-i18n="add_to_cart"` في HTML (وكذلك `data-i18n-placeholder` / `-title` / `-aria-label`).
3. أي نص عربي موجود في القاموس يُترجم تلقائياً أينما ظهر (HTML أو نص يرسمه الجافاسكربت لاحقاً أو alert/confirm).
