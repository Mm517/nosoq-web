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
