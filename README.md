# نَسَق — المنصة الرئيسية (المشتري + الأدمن)

```
nosoq-main/
├─ index.html            ← الرئيسية  (/)
├─ vercel.json           ← الروابط النضيفة + التحويلات + مسارات المنتج/الحملات
├─ pages/                ← shop · cart · checkout · auth · profile · support · product · store
├─ admin/                ← index.html (/admin) · order.html (/admin/order)
├─ assets/               ← css/ · js/ · img/
├─ database/             ← ملفات SQL (مش بتترفع على فيرسيل — .vercelignore)
└─ docs/                 ← توثيق (مش بيترفع)
```

## الروابط
| الصفحة | الرابط |
|---|---|
| الرئيسية | `/` |
| المنتجات | `/shop` · `/shop?cat=clothes` |
| منتج | `/product/<اسم-المتجر>/<اسم-المنتج>` |
| منتج من حملة | `/campaigns/<اسم-الحملة>/<اسم-المنتج>` |
| الحملات | `/campaigns` · `/campaigns/<اسم-الحملة>` |
| الكوبونات | `/coupons` · `/coupons/<الكود>` (مثال `/coupons/NASAQ10`) |
| الأكثر مبيعاً | `/bestsellers` · `/bestsellers/<المتجر>/<المنتج>` |
| عروض اليوم | `/daily-offers` · `/daily-offers/<المتجر>/<المنتج>` |
| الأقسام | `/categories` · `/categories/<القسم>` · `/categories/<القسم>/<المتجر>` · `/categories/<القسم>/<المتجر>/<المنتج>` |
| منتج داخل متجر | `/store/<slug>/<المنتج>` |
| متجر بائع | `/store/<slug>` |
| لوحة الأدمن | `/admin` · `/admin/order?id=...` |
| لوحة البائع | `/seller` ← https://nosoq-seller.vercel.app (مع تمرير الجلسة) |
| لوحة المندوب | `/rider` ← https://nosoq-driver.vercel.app (مع تمرير الجلسة) |

## النشر على Vercel
Framework Preset = **Other** · Build Command = فاضي · Output Directory = فاضي (الجذر).

## الربط بين المنصات التلاتة
`assets/js/nasaq-links.js` (نسخة منه في كل مشروع):
- **عناوين المنصات** في `NASAQ_LINKS` أول الملف — غيّر `main` لدومين المتجر الفعلي.
- **الجلسة**: عند الانتقال لمنصة تانية بتتبعت في الـ `#fragment` وبتتمسح من الرابط فوراً.
- `/auth?next=seller` أو `?next=driver`: بعد تسجيل الدخول يرجّع المستخدم للوحته.

## ملاحظات على الصفحات الجديدة
- كل صفحات القوائم (`/coupons` `/campaigns` `/bestsellers` `/daily-offers` `/categories`) بتتخدم من `pages/collection.html` + `assets/js/collection-page.js`.
- صفحة المنتج في أي سياق هي نفس `pages/product.html` (الـ canonical دايماً `/product/...`).
- **الكوبونات** بتتحمّل من جدول `coupons` في Supabase (`assets/js/cart.js`) — أدمن/بائع بيضيفوها من لوحاتهم. **الحملات** بتتنشر من لوحة البائع لجدول `campaigns` وبيقراها الزوار من الـ view `public_campaigns`. شغّل `database/coupons_campaigns.sql` مرة واحدة. التفاصيل في `اقرأني-تشغيل-وربط.md` في جذر الحزمة.
