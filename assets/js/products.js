/* ==========================================================================
   js/products.js — إعدادات المتجر + كتالوج المنتجات الحقيقي من Supabase
   لا بيانات وهمية هنا: المنتجات تُقرأ مباشرة من جدول public.products (المنتجات
   التي تضيفها المتاجر الحقيقية المفعّلة فقط). أي منتج بلا صور حقيقية يظهر
   برسمة SVG بديلة حسب تصنيفه بدل صورة عشوائية من الإنترنت.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- إعدادات المتجر (غيّرها من هنا) ---------- */
  const STORE = {
    name: 'نَسَق',
    currency: 'ج.م',
    currencyCode: 'EGP',          // لاستخدامه في schema.org
    freeShippingFrom: 500,
    shipping: { standard: 35, express: 75 },
    returnDays: 14,
    email: 'hello@nasaq.example',
    cities: ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا', 'الزقازيق', 'أسيوط', 'الأقصر'],

    /* ---- منصة البائعين ---- */
    commission: 0.10,                       // عمولة المنصة على مبيعات كل بائع (10%)
    minPayout: 100,                         // أقل مبلغ يمكن سحبه
    supportEmail: 'sellers@nasaq.example',
    /* مفتاح Google Maps (Maps JavaScript API + Geocoding API). اتركه فارغاً وسيعمل تحديد الموقع
       بالـ GPS مع معاينة خريطة جوجل، وعند وضع المفتاح تصبح الخريطة تفاعلية (تحريك الدبوس والبحث). */
    googleMapsKey: '',   /* فارغ = خريطة OpenStreetMap المجانية (بدون مفتاح) */
    /* أسعار الإعلانات بالجنيه لليوم الواحد + خصم على المدد الطويلة */
    adPlacements: {
      hero:     { name: 'لافتة الصفحة الرئيسية', desc: 'تظهر ضمن شريط اللافتات في أول الرئيسية، أعلى ظهور في المتجر.', perDay: 150, ratio: '4:5 (مثال 800×1000)' },
      category: { name: 'لافتة أعلى صفحة المنتجات', desc: 'شريط عريض أعلى نتائج التصفح، يمكن تخصيصه لفئة معيّنة أو كل الفئات.', perDay: 90, ratio: '4:1 (مثال 1600×400)' },
      product:  { name: 'منتج مموَّل', desc: 'يظهر منتجك أولاً في القوائم والكاروسيل بشارة «مموّل».', perDay: 40, ratio: null }
    },
    adDiscounts: [{ days: 30, off: 0.2 }, { days: 14, off: 0.15 }, { days: 7, off: 0.1 }]
  };

  /* الأقسام الرئيسية (category) وتحتها أقسام فرعية (sub). المعرّفات القديمة clothes/bags/shoes/accessories
     باقية كما هي حتى تبقى منتجات المتاجر الحالية سليمة. art = شكل الرسمة البديلة للمنتجات بلا صور. */
  const S = (id, name, art) => ({ id, name, art });
  const CATEGORIES = [
    { id: 'electronics', name: 'إلكترونيات', art: 'phone', subs: [S('tvs', 'تلفزيونات', 'tv'), S('headsets', 'سماعات', 'headset'), S('games', 'ألعاب فيديو', 'gamepad'), S('mobiles', 'موبايلات', 'phone'), S('cameras', 'كاميرات', 'camera'), S('wearables', 'ساعات ذكية', 'smartwatch'), S('laptops', 'لابتوب', 'laptop')] },
    { id: 'appliances', name: 'أجهزة منزلية', art: 'fridge', subs: [S('fridges', 'ثلاجات', 'fridge'), S('washers', 'غسالات', 'washer'), S('ac', 'تكييفات', 'ac'), S('cookers', 'بوتاجازات', 'cooker'), S('smallapp', 'أجهزة مطبخ', 'airfryer'), S('vacuums', 'مكانس', 'vacuum')] },
    { id: 'home', name: 'المنزل والمطبخ', art: 'sofa', subs: [S('furniture', 'أثاث', 'sofa'), S('cookware', 'أواني الطهي', 'pot'), S('lighting', 'إضاءة', 'lamp'), S('bedding', 'مفروشات', 'bedding'), S('decor', 'ديكور', 'vase'), S('storage', 'تخزين وتنظيم', 'storage')] },
    { id: 'clothes', name: 'ملابس', art: 'tee', subs: [S('women', 'نسائي', 'dress'), S('men', 'رجالي', 'tee'), S('kids', 'أطفال', 'tee'), S('sportswear', 'ملابس رياضية', 'hoodie')] },
    { id: 'shoes', name: 'أحذية', art: 'shoe', subs: [S('womenshoes', 'نسائي', 'shoe'), S('menshoes', 'رجالي', 'shoe'), S('kidsshoes', 'أطفال', 'shoe'), S('sportshoes', 'رياضي', 'shoe')] },
    { id: 'bags', name: 'حقائب', art: 'bag', subs: [S('handbags', 'حقائب يد', 'bag'), S('backpacks', 'شنط ظهر', 'bag'), S('travel', 'حقائب سفر', 'bag'), S('wallets', 'محافظ', 'wallet')] },
    { id: 'accessories', name: 'إكسسوارات', art: 'watch', subs: [S('watches', 'ساعات', 'watch'), S('sunglasses', 'نظارات', 'glasses'), S('jewelry', 'مجوهرات', 'ring'), S('hats', 'قبعات وأوشحة', 'scarf')] },
    { id: 'beauty', name: 'الجمال والعناية', art: 'perfume', subs: [S('perfumes', 'عطور', 'perfume'), S('makeup', 'مكياج', 'lipstick'), S('skincare', 'عناية بالبشرة', 'jar'), S('haircare', 'عناية بالشعر', 'hairdryer')] },
    { id: 'supermarket', name: 'سوبر ماركت', art: 'cereal', subs: [S('groceries', 'مواد غذائية', 'cereal'), S('drinks', 'مشروبات', 'can'), S('cooking', 'زيوت وطبخ', 'bottle'), S('cleaning', 'منظفات', 'bottle')] },
    { id: 'toys', name: 'ألعاب وأطفال', art: 'teddy', subs: [S('plush', 'ألعاب محشوة', 'teddy'), S('building', 'ألعاب تركيب', 'blocks'), S('vehicles', 'سيارات ومركبات', 'toycar')] },
    { id: 'sports', name: 'رياضة ولياقة', art: 'ball', subs: [S('football', 'كرات', 'ball'), S('fitness', 'أجهزة لياقة', 'dumbbell'), S('yoga', 'يوجا', 'mat'), S('cycling', 'دراجات', 'bike')] },
    { id: 'books', name: 'كتب وقرطاسية', art: 'book', subs: [S('books', 'كتب', 'book'), S('stationery', 'قرطاسية', 'notebook'), S('school', 'شنط مدرسية', 'bag')] },
    { id: 'auto', name: 'السيارات', art: 'tire', subs: [S('tires', 'إطارات', 'tire'), S('autooils', 'زيوت وسوائل', 'oilcan'), S('motoacc', 'إكسسوارات', 'helmet')] },
    { id: 'pets', name: 'حيوانات أليفة', art: 'petfood', subs: [S('petfood', 'طعام', 'petfood'), S('petacc', 'مستلزمات', 'bowl'), S('pettoys', 'ألعاب', 'bone')] },
    { id: 'tools', name: 'عدد وأدوات', art: 'drill', subs: [S('power', 'أدوات كهربائية', 'drill'), S('hand', 'عدد يدوية', 'toolbox'), S('worklight', 'إضاءة ورش', 'lamp')] }
  ];
  const SUB2CAT = {}, SUB_INDEX = {};
  CATEGORIES.forEach((c) => c.subs.forEach((x) => { SUB2CAT[x.id] = c.id; SUB_INDEX[x.id] = x; }));

  /* ---------- أدوات صغيرة مشتركة ---------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  const money = (n) => {
    const r = Math.round(n * 100) / 100;
    return r.toLocaleString('en-US', { minimumFractionDigits: r % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }) + ' ' + STORE.currency;
  };

  /* توحيد النص العربي للبحث: إزالة التشكيل وتوحيد الألف والياء والتاء المربوطة */
  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .trim();

  /* ---------- مولّد الصور: أشكال SVG بسيطة لكل نوع منتج ---------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r);
    g = Math.round((t - g) * p + g);
    b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* f = تعبئة الجسم (تدرّج)، d = لون داكن للتفاصيل */
  const SHAPES = {
    tee: (f, d) =>
      `<path d="M140 92 L96 112 L56 176 L98 200 L125 168 L125 402 L275 402 L275 168 L302 200 L344 176 L304 112 L260 92 Q200 136 140 92 Z" fill="${f}"/>
       <path d="M140 92 Q200 136 260 92" fill="none" stroke="${d}" stroke-width="7" opacity=".45"/>`,
    hoodie: (f, d) =>
      `<path d="M138 104 L84 134 L58 336 L104 346 L126 214 L126 412 L274 412 L274 214 L296 346 L342 336 L316 134 L262 104 Q200 156 138 104 Z" fill="${f}"/>
       <path d="M148 100 Q160 44 200 44 Q240 44 252 100 Q200 150 148 100 Z" fill="${f}"/>
       <path d="M164 102 Q200 138 236 102 Q228 66 200 64 Q172 66 164 102 Z" fill="${d}" opacity=".5"/>
       <path d="M150 330 H250 L266 380 H134 Z" fill="${d}" opacity=".25"/>
       <path d="M188 140 V190 M212 140 V190" stroke="${d}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`,
    jacket: (f, d) =>
      `<path d="M140 96 L88 122 L60 350 L108 358 L128 220 L128 410 L272 410 L272 220 L292 358 L340 350 L312 122 L260 96 L228 122 L200 100 L172 122 Z" fill="${f}"/>
       <path d="M172 122 L200 100 L228 122 L214 152 L200 138 L186 152 Z" fill="${d}" opacity=".4"/>
       <path d="M200 138 V410" stroke="${d}" stroke-width="4" opacity=".5"/>
       <rect x="146" y="236" width="44" height="40" rx="4" fill="none" stroke="${d}" stroke-width="3" opacity=".55"/>
       <rect x="210" y="236" width="44" height="40" rx="4" fill="none" stroke="${d}" stroke-width="3" opacity=".55"/>
       <path d="M128 380 H272" stroke="${d}" stroke-width="5" opacity=".4"/>`,
    dress: (f, d) =>
      `<path d="M154 126 Q200 152 246 126 L250 196 L322 446 H78 L150 196 Z" fill="${f}"/>
       <path d="M182 92 L193 132 M218 92 L207 132" stroke="${d}" stroke-width="8" stroke-linecap="round" fill="none"/>
       <path d="M150 196 H250" stroke="${d}" stroke-width="6" opacity=".4"/>
       <path d="M200 206 L192 446 M200 206 L226 446 M200 206 L174 446" stroke="${d}" stroke-width="2" opacity=".2"/>`,
    pants: (f, d) =>
      `<path d="M138 78 H262 L290 444 H218 L200 214 L182 444 H110 Z" fill="${f}"/>
       <path d="M138 78 H262 V104 H138 Z" fill="${d}" opacity=".4"/>
       <path d="M200 104 V214" stroke="${d}" stroke-width="3" opacity=".5"/>
       <path d="M150 130 Q170 160 180 150" stroke="${d}" stroke-width="3" fill="none" opacity=".5"/>`,
    bag: (f, d) =>
      `<path d="M142 204 V158 Q142 92 200 92 Q258 92 258 158 V204" fill="none" stroke="${d}" stroke-width="12" stroke-linecap="round"/>
       <path d="M92 204 H308 L334 424 Q335 434 325 434 H75 Q65 434 66 424 Z" fill="${f}"/>
       <path d="M92 204 H308 L312 244 Q200 276 88 244 Z" fill="${d}" opacity=".3"/>
       <circle cx="200" cy="262" r="10" fill="${d}" opacity=".75"/>`,
    shoe: (f, d) =>
      `<path d="M58 322 Q58 254 112 244 L168 238 Q196 190 244 212 L304 252 Q352 262 352 314 V346 H58 Z" fill="${f}"/>
       <path d="M52 342 H358 V366 Q358 380 344 380 H66 Q52 380 52 366 Z" fill="#ffffff" stroke="${d}" stroke-width="2" opacity=".92"/>
       <path d="M168 238 L190 262 M198 226 L216 250 M228 220 L244 244" stroke="${d}" stroke-width="4" stroke-linecap="round" opacity=".55"/>
       <path d="M58 322 Q120 300 176 318" stroke="${d}" stroke-width="4" fill="none" opacity=".35"/>`,
    watch: (f, d) =>
      `<rect x="160" y="40" width="80" height="150" rx="16" fill="${d}"/>
       <rect x="160" y="310" width="80" height="150" rx="16" fill="${d}"/>
       <circle cx="200" cy="250" r="92" fill="${f}"/>
       <circle cx="200" cy="250" r="72" fill="#ffffff" opacity=".93"/>
       <path d="M200 186v8M200 306v-8M136 250h8M264 250h-8" stroke="#15171c" stroke-width="3" stroke-linecap="round"/>
       <path d="M200 250 V204 M200 250 L230 266" stroke="#15171c" stroke-width="5" stroke-linecap="round"/>
       <circle cx="200" cy="250" r="6" fill="#15171c"/>`,
    cap: (f, d) =>
      `<path d="M86 312 Q84 178 200 166 Q316 178 314 312 Z" fill="${f}"/>
       <path d="M200 166 V312 M200 166 Q150 200 146 312 M200 166 Q250 200 254 312" stroke="${d}" stroke-width="3" fill="none" opacity=".4"/>
       <path d="M300 300 Q392 296 392 330 Q330 346 286 322 Z" fill="${d}"/>
       <circle cx="200" cy="168" r="9" fill="${d}"/>
       <rect x="86" y="306" width="228" height="18" rx="6" fill="${d}" opacity=".45"/>`,
    scarf: (f, d) =>
      `<path d="M110 92 Q200 60 290 92 Q312 150 280 196 Q200 228 120 196 Q88 150 110 92 Z" fill="${f}"/>
       <ellipse cx="200" cy="146" rx="52" ry="26" fill="${d}" opacity=".3"/>
       <path d="M150 190 L128 424 H214 L232 200 Z" fill="${f}"/>
       <path d="M226 194 L250 380 H318 L282 190 Z" fill="${f}"/>
       <path d="M131 386 H213 M133 366 H214 M254 346 H316 M252 326 H310" stroke="${d}" stroke-width="4" opacity=".4"/>
       <path d="M134 424v20M148 424v20M162 424v20M176 424v20M190 424v20M204 424v20M256 380v18M270 380v18M284 380v18M298 380v18M312 380v18" stroke="${d}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
    glasses: (f, d) =>
      `<path d="M64 224 Q64 208 84 208 H170 Q196 208 196 236 Q196 296 140 296 Q64 296 64 236 Z" fill="${f}"/>
       <path d="M204 236 Q204 208 230 208 H316 Q336 208 336 224 V236 Q336 296 260 296 Q204 296 204 236 Z" fill="${f}"/>
       <path d="M196 226 Q200 216 204 226" stroke="${d}" stroke-width="6" fill="none"/>
       <path d="M64 222 L40 200 M336 222 L360 200" stroke="${d}" stroke-width="8" stroke-linecap="round"/>
       <path d="M84 224 Q110 214 150 220" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35" fill="none"/>`,
    wallet: (f, d) =>
      `<rect x="86" y="170" width="228" height="170" rx="18" fill="${f}"/>
       <path d="M86 210 H314" stroke="${d}" stroke-width="4" opacity=".45"/>
       <rect x="238" y="236" width="88" height="56" rx="12" fill="${d}" opacity=".65"/>
       <circle cx="268" cy="264" r="8" fill="#fff" opacity=".85"/>
       <path d="M104 186 H296" stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".5"/>`
    ,
    /* ---- إلكترونيات ---- */
    phone: (f, d) =>
      `<rect x="120" y="72" width="160" height="340" rx="30" fill="${f}"/>
       <rect x="130" y="82" width="140" height="320" rx="22" fill="#14161b"/>
       <circle cx="200" cy="268" r="58" fill="${f}" opacity=".5"/>
       <path d="M130 190 L270 118 V176 L130 250Z" fill="#fff" opacity=".08"/>
       <rect x="178" y="92" width="44" height="9" rx="4.5" fill="${f}"/>`,
    tablet: (f, d) =>
      `<rect x="70" y="90" width="260" height="340" rx="26" fill="${f}"/>
       <rect x="82" y="102" width="236" height="316" rx="16" fill="#14161b"/>
       <circle cx="200" cy="262" r="70" fill="${f}" opacity=".5"/>
       <path d="M82 230 L318 130 V196 L82 300Z" fill="#fff" opacity=".07"/>`,
    laptop: (f, d) =>
      `<rect x="96" y="130" width="208" height="142" rx="10" fill="${d}"/>
       <rect x="106" y="140" width="188" height="122" rx="4" fill="#14161b"/>
       <circle cx="200" cy="202" r="40" fill="${f}" opacity=".55"/>
       <path d="M60 286 H340 L326 306 Q324 312 316 312 H84 Q76 312 74 306 Z" fill="${f}"/>
       <rect x="170" y="286" width="60" height="6" rx="3" fill="${d}" opacity=".5"/>`,
    tv: (f, d) =>
      `<rect x="50" y="130" width="300" height="182" rx="10" fill="#15171c"/>
       <rect x="58" y="138" width="284" height="166" rx="4" fill="${f}"/>
       <path d="M58 250 L200 160 L342 220 V304 H58Z" fill="#fff" opacity=".18"/>
       <rect x="176" y="312" width="48" height="24" fill="${d}"/>
       <rect x="140" y="336" width="120" height="10" rx="5" fill="${d}"/>`,
    headset: (f, d) =>
      `<path d="M96 262 V232 Q96 110 200 110 Q304 110 304 232 V262" fill="none" stroke="${d}" stroke-width="14" stroke-linecap="round"/>
       <rect x="72" y="230" width="56" height="112" rx="26" fill="${f}"/>
       <rect x="272" y="230" width="56" height="112" rx="26" fill="${f}"/>
       <rect x="116" y="248" width="14" height="76" rx="7" fill="${d}"/>
       <rect x="270" y="248" width="14" height="76" rx="7" fill="${d}"/>`,
    gamepad: (f, d) =>
      `<path d="M110 200 Q60 200 52 300 Q48 360 86 360 Q112 360 128 330 L152 300 H248 L272 330 Q288 360 314 360 Q352 360 348 300 Q340 200 290 200 Z" fill="${f}"/>
       <path d="M118 246 h30 M133 231 v30" stroke="${d}" stroke-width="9" stroke-linecap="round"/>
       <circle cx="268" cy="236" r="9" fill="${d}"/><circle cx="292" cy="258" r="9" fill="${d}" opacity=".8"/>
       <circle cx="244" cy="258" r="9" fill="${d}" opacity=".8"/><circle cx="268" cy="280" r="9" fill="${d}" opacity=".6"/>
       <circle cx="170" cy="290" r="15" fill="${d}" opacity=".85"/><circle cx="230" cy="290" r="15" fill="${d}" opacity=".85"/>`,
    camera: (f, d) =>
      `<rect x="70" y="170" width="260" height="170" rx="22" fill="${f}"/>
       <path d="M130 170 L146 140 H254 L270 170Z" fill="${d}"/>
       <circle cx="200" cy="255" r="66" fill="#14161b"/><circle cx="200" cy="255" r="48" fill="${d}"/>
       <circle cx="200" cy="255" r="26" fill="#14161b"/><circle cx="186" cy="242" r="8" fill="#fff" opacity=".5"/>
       <rect x="90" y="190" width="34" height="18" rx="4" fill="#fff" opacity=".6"/>`,
    smartwatch: (f, d) =>
      `<rect x="150" y="40" width="100" height="140" rx="20" fill="${d}"/>
       <rect x="150" y="320" width="100" height="140" rx="20" fill="${d}"/>
       <rect x="118" y="150" width="164" height="200" rx="44" fill="${f}"/>
       <rect x="130" y="162" width="140" height="176" rx="34" fill="#14161b"/>
       <circle cx="200" cy="250" r="42" fill="none" stroke="${f}" stroke-width="9" stroke-dasharray="170 100" stroke-linecap="round"/>
       <rect x="282" y="220" width="10" height="36" rx="5" fill="${d}"/>`,
    /* ---- أجهزة منزلية ---- */
    fridge: (f, d) =>
      `<rect x="110" y="50" width="180" height="400" rx="16" fill="${f}"/>
       <path d="M110 190 H290" stroke="${d}" stroke-width="4" opacity=".5"/>
       <rect x="262" y="92" width="8" height="70" rx="4" fill="${d}"/><rect x="262" y="214" width="8" height="90" rx="4" fill="${d}"/>
       <path d="M128 70 V430" stroke="#fff" stroke-width="10" opacity=".25"/>`,
    washer: (f, d) =>
      `<rect x="90" y="80" width="220" height="340" rx="18" fill="${f}"/>
       <rect x="90" y="80" width="220" height="60" rx="18" fill="${d}" opacity=".25"/>
       <circle cx="130" cy="110" r="10" fill="${d}"/><circle cx="168" cy="110" r="10" fill="${d}" opacity=".6"/>
       <rect x="228" y="102" width="58" height="16" rx="8" fill="${d}" opacity=".7"/>
       <circle cx="200" cy="284" r="86" fill="${d}" opacity=".55"/><circle cx="200" cy="284" r="68" fill="#14161b"/>
       <path d="M160 262 Q200 232 240 264" stroke="#fff" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/>`,
    ac: (f, d) =>
      `<rect x="50" y="130" width="300" height="112" rx="24" fill="${f}"/>
       <rect x="72" y="202" width="256" height="18" rx="9" fill="${d}" opacity=".55"/>
       <circle cx="318" cy="160" r="6" fill="${d}"/><rect x="74" y="152" width="70" height="8" rx="4" fill="${d}" opacity=".3"/>`,
    cooker: (f, d) =>
      `<rect x="90" y="140" width="220" height="290" rx="14" fill="${f}"/>
       <path d="M90 196 L108 140 H292 L310 196Z" fill="${d}" opacity=".85"/>
       <ellipse cx="156" cy="164" rx="28" ry="9" fill="${f}"/><ellipse cx="244" cy="164" rx="28" ry="9" fill="${f}"/>
       <circle cx="132" cy="222" r="9" fill="${d}"/><circle cx="172" cy="222" r="9" fill="${d}"/><circle cx="228" cy="222" r="9" fill="${d}"/><circle cx="268" cy="222" r="9" fill="${d}"/>
       <rect x="112" y="258" width="176" height="130" rx="10" fill="#14161b"/><rect x="130" y="244" width="140" height="8" rx="4" fill="${d}"/>`,
    airfryer: (f, d) =>
      `<path d="M110 120 Q110 90 140 90 H260 Q290 90 290 120 V370 Q290 420 240 420 H160 Q110 420 110 370 Z" fill="${f}"/>
       <rect x="140" y="150" width="120" height="72" rx="12" fill="#14161b"/>
       <circle cx="170" cy="326" r="18" fill="${d}"/><circle cx="230" cy="326" r="18" fill="${d}" opacity=".6"/>
       <path d="M290 210 h32 q12 0 12 12 v40 q0 12 -12 12 h-32" fill="none" stroke="${d}" stroke-width="10"/>`,
    vacuum: (f, d) =>
      `<ellipse cx="200" cy="304" rx="130" ry="46" fill="${d}" opacity=".9"/>
       <ellipse cx="200" cy="286" rx="130" ry="46" fill="${f}"/>
       <circle cx="200" cy="284" r="24" fill="${d}" opacity=".6"/><circle cx="200" cy="284" r="9" fill="#fff" opacity=".85"/>
       <circle cx="118" cy="268" r="7" fill="${d}" opacity=".5"/>`,
    /* ---- المنزل والمطبخ ---- */
    sofa: (f, d) =>
      `<rect x="70" y="180" width="260" height="120" rx="24" fill="${f}"/>
       <rect x="50" y="220" width="62" height="120" rx="24" fill="${f}"/><rect x="288" y="220" width="62" height="120" rx="24" fill="${f}"/>
       <rect x="102" y="244" width="196" height="70" rx="16" fill="${d}" opacity=".25"/>
       <rect x="72" y="336" width="14" height="28" fill="${d}"/><rect x="314" y="336" width="14" height="28" fill="${d}"/>`,
    pot: (f, d) =>
      `<rect x="90" y="214" width="220" height="146" rx="20" fill="${f}"/>
       <rect x="80" y="202" width="240" height="24" rx="12" fill="${d}" opacity=".55"/>
       <rect x="56" y="250" width="38" height="14" rx="7" fill="${d}"/><rect x="306" y="250" width="38" height="14" rx="7" fill="${d}"/>
       <rect x="184" y="166" width="32" height="36" rx="10" fill="${d}"/>`,
    lamp: (f, d) =>
      `<path d="M120 152 L160 80 H240 L280 152 Z" fill="${f}"/>
       <ellipse cx="200" cy="152" rx="80" ry="10" fill="${d}" opacity=".4"/>
       <rect x="194" y="152" width="12" height="226" fill="${d}"/><ellipse cx="200" cy="382" rx="60" ry="12" fill="${d}"/>`,
    bedding: (f, d) =>
      `<rect x="60" y="232" width="280" height="110" rx="14" fill="${f}"/>
       <rect x="60" y="232" width="280" height="34" rx="14" fill="${d}" opacity=".3"/>
       <rect x="80" y="172" width="100" height="70" rx="20" fill="#fff" opacity=".92"/><rect x="220" y="172" width="100" height="70" rx="20" fill="#fff" opacity=".92"/>
       <rect x="60" y="342" width="20" height="30" fill="${d}"/><rect x="320" y="342" width="20" height="30" fill="${d}"/>`,
    vase: (f, d) =>
      `<path d="M200 118 V50 M200 92 Q160 74 150 42 M200 84 Q240 62 250 30" stroke="#3f8f5a" stroke-width="6" fill="none" stroke-linecap="round"/>
       <circle cx="150" cy="40" r="12" fill="#3f8f5a"/><circle cx="250" cy="32" r="12" fill="#3f8f5a"/><circle cx="200" cy="48" r="12" fill="#3f8f5a"/>
       <path d="M160 122 H240 Q236 162 262 222 Q290 302 250 392 Q200 412 150 392 Q110 302 138 222 Q164 162 160 122 Z" fill="${f}"/>
       <ellipse cx="200" cy="122" rx="40" ry="9" fill="${d}" opacity=".5"/>`,
    storage: (f, d) =>
      `<path d="M90 204 H310 L296 382 Q294 394 282 394 H118 Q106 394 104 382 Z" fill="${f}"/>
       <rect x="80" y="180" width="240" height="32" rx="10" fill="${d}" opacity=".5"/>
       <rect x="170" y="242" width="60" height="22" rx="11" fill="${d}" opacity=".5"/>`,
    /* ---- إكسسوارات / جمال ---- */
    ring: (f, d) =>
      `<circle cx="200" cy="272" r="80" fill="none" stroke="${f}" stroke-width="14"/>
       <circle cx="200" cy="186" r="24" fill="${d}"/><circle cx="200" cy="186" r="11" fill="#fff" opacity=".75"/>`,
    perfume: (f, d) =>
      `<rect x="120" y="190" width="160" height="200" rx="18" fill="${f}"/>
       <rect x="140" y="222" width="120" height="120" rx="8" fill="#fff" opacity=".5"/>
       <rect x="170" y="132" width="60" height="58" rx="8" fill="${d}"/><rect x="186" y="100" width="28" height="36" rx="6" fill="${d}" opacity=".8"/>`,
    lipstick: (f, d) =>
      `<rect x="150" y="262" width="100" height="128" rx="10" fill="${d}"/>
       <rect x="160" y="210" width="80" height="60" rx="6" fill="#c5cad3"/>
       <path d="M164 212 L176 124 Q200 102 224 124 L236 212Z" fill="${f}"/>`,
    jar: (f, d) =>
      `<rect x="100" y="240" width="200" height="132" rx="18" fill="${f}"/>
       <rect x="92" y="196" width="216" height="52" rx="14" fill="${d}"/>
       <rect x="120" y="270" width="160" height="72" rx="8" fill="#fff" opacity=".6"/>`,
    hairdryer: (f, d) =>
      `<path d="M80 172 Q80 122 150 122 H270 Q320 122 320 172 Q320 222 270 222 H150 Q80 222 80 172Z" fill="${f}"/>
       <path d="M180 220 L210 402 H270 L250 220Z" fill="${d}"/>
       <rect x="318" y="152" width="30" height="40" rx="6" fill="${d}" opacity=".7"/>`,
    /* ---- سوبر ماركت ---- */
    bottle: (f, d) =>
      `<rect x="176" y="70" width="48" height="50" rx="10" fill="${d}"/>
       <path d="M160 132 Q160 112 176 112 H224 Q240 112 240 132 L262 192 V392 Q262 412 242 412 H158 Q138 412 138 392 V192 Z" fill="${f}"/>
       <rect x="138" y="240" width="124" height="96" fill="#fff" opacity=".72"/><circle cx="200" cy="288" r="22" fill="${d}" opacity=".5"/>`,
    can: (f, d) =>
      `<rect x="140" y="110" width="120" height="292" rx="14" fill="${f}"/>
       <ellipse cx="200" cy="112" rx="60" ry="12" fill="${d}" opacity=".5"/>
       <rect x="140" y="200" width="120" height="110" fill="#fff" opacity=".68"/><circle cx="200" cy="255" r="26" fill="${d}" opacity=".7"/>`,
    cereal: (f, d) =>
      `<rect x="110" y="90" width="180" height="312" rx="10" fill="${f}"/>
       <path d="M290 90 L320 110 V382 L290 402Z" fill="${d}" opacity=".5"/>
       <circle cx="200" cy="230" r="60" fill="#fff" opacity=".88"/><circle cx="200" cy="230" r="34" fill="${d}" opacity=".6"/>`,
    /* ---- ألعاب ورياضة ---- */
    teddy: (f, d) =>
      `<circle cx="146" cy="120" r="28" fill="${f}"/><circle cx="254" cy="120" r="28" fill="${f}"/>
       <ellipse cx="200" cy="304" rx="82" ry="90" fill="${f}"/>
       <ellipse cx="112" cy="290" rx="24" ry="52" fill="${f}" transform="rotate(20 112 290)"/><ellipse cx="288" cy="290" rx="24" ry="52" fill="${f}" transform="rotate(-20 288 290)"/>
       <circle cx="200" cy="176" r="66" fill="${f}"/>
       <ellipse cx="200" cy="196" rx="30" ry="22" fill="#fff" opacity=".75"/>
       <circle cx="176" cy="168" r="7" fill="${d}"/><circle cx="224" cy="168" r="7" fill="${d}"/><ellipse cx="200" cy="190" rx="9" ry="6" fill="${d}"/>
       <ellipse cx="200" cy="316" rx="46" ry="52" fill="#fff" opacity=".3"/>`,
    blocks: (f, d) =>
      `<rect x="108" y="292" width="92" height="92" rx="8" fill="${f}"/><rect x="204" y="292" width="92" height="92" rx="8" fill="${d}"/>
       <rect x="156" y="198" width="92" height="92" rx="8" fill="#e9a82a"/>
       <circle cx="154" cy="338" r="22" fill="#fff" opacity=".55"/><circle cx="250" cy="338" r="22" fill="#fff" opacity=".35"/><circle cx="202" cy="244" r="22" fill="#fff" opacity=".55"/>`,
    toycar: (f, d) =>
      `<path d="M60 282 Q60 242 100 238 L140 192 Q150 182 166 182 H244 Q260 182 270 192 L310 238 Q350 242 350 282 V304 H60Z" fill="${f}"/>
       <path d="M152 202 H196 V238 H132Z M204 202 H246 L272 238 H204Z" fill="#fff" opacity=".72"/>
       <circle cx="122" cy="306" r="32" fill="#1b1e25"/><circle cx="122" cy="306" r="14" fill="#c5cad3"/>
       <circle cx="288" cy="306" r="32" fill="#1b1e25"/><circle cx="288" cy="306" r="14" fill="#c5cad3"/>`,
    ball: (f, d) =>
      `<circle cx="200" cy="262" r="110" fill="${f}"/>
       <path d="M200 222 L236 248 L222 290 H178 L164 248Z" fill="${d}"/>
       <path d="M200 222 V156 M236 248 L296 228 M222 290 L256 346 M178 290 L144 346 M164 248 L104 228" stroke="${d}" stroke-width="6" stroke-linecap="round"/>`,
    dumbbell: (f, d) =>
      `<rect x="56" y="212" width="42" height="100" rx="8" fill="${d}"/><rect x="98" y="192" width="42" height="140" rx="10" fill="${f}"/>
       <rect x="140" y="250" width="120" height="24" rx="8" fill="#9aa1af"/>
       <rect x="260" y="192" width="42" height="140" rx="10" fill="${f}"/><rect x="302" y="212" width="42" height="100" rx="8" fill="${d}"/>`,
    mat: (f, d) =>
      `<rect x="110" y="172" width="192" height="170" rx="20" fill="${f}"/>
       <ellipse cx="110" cy="257" rx="36" ry="85" fill="${d}"/><ellipse cx="110" cy="257" rx="24" ry="57" fill="${f}"/><ellipse cx="110" cy="257" rx="11" ry="26" fill="${d}"/>`,
    bike: (f, d) =>
      `<circle cx="110" cy="322" r="70" fill="none" stroke="${d}" stroke-width="10"/><circle cx="290" cy="322" r="70" fill="none" stroke="${d}" stroke-width="10"/>
       <path d="M110 322 L172 202 H252 L290 322 M172 202 L212 322 H110 M212 322 L252 202 M160 182 H192 M252 202 L242 170 H272" stroke="${f}" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
    /* ---- كتب / سيارات / حيوانات / أدوات ---- */
    book: (f, d) =>
      `<rect x="110" y="90" width="192" height="304" rx="8" fill="${f}"/>
       <rect x="110" y="90" width="26" height="304" rx="6" fill="${d}" opacity=".5"/>
       <rect x="158" y="142" width="112" height="14" rx="7" fill="#fff" opacity=".85"/><rect x="158" y="172" width="80" height="10" rx="5" fill="#fff" opacity=".6"/>
       <rect x="118" y="386" width="184" height="14" rx="4" fill="#fff" opacity=".92"/>`,
    notebook: (f, d) =>
      `<rect x="96" y="110" width="172" height="272" rx="10" fill="${f}"/>
       <circle cx="96" cy="148" r="7" fill="${d}"/><circle cx="96" cy="196" r="7" fill="${d}"/><circle cx="96" cy="244" r="7" fill="${d}"/><circle cx="96" cy="292" r="7" fill="${d}"/><circle cx="96" cy="340" r="7" fill="${d}"/>
       <rect x="132" y="150" width="100" height="12" rx="6" fill="#fff" opacity=".8"/>
       <path d="M296 150 H326 V350 L311 384 L296 350Z" fill="#e9a82a"/><path d="M296 350 L311 384 L326 350Z" fill="#f1d9b0"/>`,
    tire: (f, d) =>
      `<circle cx="200" cy="262" r="130" fill="#1b1e25"/><circle cx="200" cy="262" r="84" fill="${f}"/>
       <circle cx="200" cy="262" r="26" fill="${d}"/>
       <path d="M200 178 V236 M200 288 V346 M116 262 H174 M226 262 H284 M141 203 L182 244 M218 280 L259 321 M259 203 L218 244 M182 280 L141 321" stroke="${d}" stroke-width="8" stroke-linecap="round" opacity=".7"/>`,
    oilcan: (f, d) =>
      `<path d="M140 172 Q140 122 200 122 Q240 122 240 172" fill="none" stroke="${d}" stroke-width="14"/>
       <path d="M110 172 H270 Q290 172 290 192 V372 Q290 392 270 392 H130 Q110 392 110 372 V192 Q110 172 130 172Z" fill="${f}"/>
       <path d="M276 184 L340 134 H362" stroke="${d}" stroke-width="12" fill="none" stroke-linecap="round"/>
       <rect x="150" y="232" width="100" height="90" rx="8" fill="#fff" opacity=".78"/>`,
    helmet: (f, d) =>
      `<path d="M90 302 Q90 130 210 130 Q320 130 320 262 V322 H90Z" fill="${f}"/>
       <path d="M200 204 H320 V272 H204 Q192 240 200 204Z" fill="#14161b"/>
       <path d="M90 322 H320 V350 Q200 372 90 350Z" fill="${d}" opacity=".6"/>`,
    petfood: (f, d) =>
      `<path d="M110 130 H290 L300 402 H100Z" fill="${f}"/>
       <path d="M110 130 Q200 100 290 130 L288 152 Q200 124 112 152Z" fill="${d}" opacity=".5"/>
       <circle cx="200" cy="274" r="56" fill="#fff" opacity=".88"/>
       <circle cx="200" cy="284" r="18" fill="${d}"/><circle cx="180" cy="256" r="8" fill="${d}"/><circle cx="200" cy="248" r="8" fill="${d}"/><circle cx="220" cy="256" r="8" fill="${d}"/>`,
    bowl: (f, d) =>
      `<path d="M80 232 H320 Q320 342 200 352 Q80 342 80 232Z" fill="${f}"/>
       <ellipse cx="200" cy="232" rx="120" ry="24" fill="${d}" opacity=".5"/><ellipse cx="200" cy="230" rx="100" ry="15" fill="#c98f5a"/>`,
    bone: (f, d) =>
      `<g transform="rotate(-35 200 250)"><rect x="110" y="236" width="180" height="30" rx="14" fill="${f}"/>
       <circle cx="114" cy="230" r="22" fill="${f}"/><circle cx="114" cy="272" r="22" fill="${f}"/><circle cx="286" cy="230" r="22" fill="${f}"/><circle cx="286" cy="272" r="22" fill="${f}"/>
       <rect x="150" y="242" width="100" height="6" rx="3" fill="${d}" opacity=".3"/></g>`,
    drill: (f, d) =>
      `<rect x="80" y="130" width="204" height="80" rx="24" fill="${f}"/>
       <path d="M150 208 L180 382 Q182 394 194 394 H236 Q246 394 244 382 L220 208Z" fill="${d}"/>
       <rect x="284" y="156" width="34" height="28" rx="6" fill="#9aa1af"/><rect x="318" y="164" width="58" height="12" rx="6" fill="#c5cad3"/>
       <rect x="100" y="150" width="60" height="18" rx="9" fill="#fff" opacity=".35"/>`,
    toolbox: (f, d) =>
      `<path d="M150 204 V172 Q150 152 170 152 H230 Q250 152 250 172 V204" fill="none" stroke="${d}" stroke-width="12"/>
       <rect x="70" y="200" width="260" height="172" rx="16" fill="${f}"/>
       <rect x="70" y="200" width="260" height="46" rx="16" fill="${d}" opacity=".45"/>
       <rect x="176" y="240" width="48" height="30" rx="6" fill="#e9a82a"/>`
  };
  const FLOOR = { tee: 404, hoodie: 414, jacket: 412, dress: 448, pants: 446, bag: 436, shoe: 382, watch: 462, cap: 346, scarf: 444, glasses: 300, wallet: 342,
    phone: 412, tablet: 430, laptop: 316, tv: 346, headset: 340, gamepad: 362, camera: 340, smartwatch: 462, fridge: 450, washer: 420, ac: 244, cooker: 430, airfryer: 420, vacuum: 346,
    sofa: 364, pot: 360, lamp: 388, bedding: 372, vase: 400, storage: 394, ring: 360, perfume: 392, lipstick: 390, jar: 372, hairdryer: 402, bottle: 412, can: 402, cereal: 402,
    teddy: 392, blocks: 384, toycar: 340, ball: 372, dumbbell: 332, mat: 342, bike: 392, book: 400, notebook: 384, tire: 392, oilcan: 392, helmet: 356, petfood: 402, bowl: 352, bone: 300, drill: 394, toolbox: 372 };
  const DY = { shoe: -32, bag: -12, hoodie: 18, pants: -8, wallet: -5, laptop: 30, ac: 60, gamepad: -30, vacuum: -40, sofa: -20, pot: -12, bedding: -20, vase: 20, storage: -34, jar: -34, blocks: -38, toycar: -8, dumbbell: -10, bike: -26, bowl: -10 };

  const artCache = new Map();
  function art(kind, color, variant, seed, bare) {
    const key = kind + color + variant + seed + (bare ? 'b' : '');
    if (artCache.has(key)) return artCache.get(key);

    const dark = shade(color, -0.34), light = shade(color, 0.28);
    const lum = (parseInt(color.slice(1, 3), 16) * 0.299 + parseInt(color.slice(3, 5), 16) * 0.587 + parseInt(color.slice(5, 7), 16) * 0.114) / 255;
    const palettes = lum > 0.78
      ? [['#dfe3e8', '#cdd3db'], ['#d8e0df', '#c6d1d0'], ['#e3dcd4', '#d2c8bd'], ['#d9dcec', '#c7cce3']]
      : [['#f1f3f6', '#e1e5ea'], ['#eaefef', '#d9e1e0'], ['#f2eeea', '#e3dcd4'], ['#eceef6', '#dbe0ee']];
    const [b1, b2] = palettes[(seed + variant) % 4];
    const dy = DY[kind] || 0;
    const floor = (FLOOR[kind] || 440) + dy;

    let view = '', extra = '', shadow = '';
    if (variant === 1) view = 'translate(200 250) rotate(-6) scale(1.04) translate(-200 -250)';
    if (variant === 2) view = 'translate(200 250) scale(1.5) translate(-200 -250)';
    if (variant === 3) {
      view = 'translate(200 250) scale(.8) translate(-200 -250)';
      extra = '<circle cx="200" cy="250" r="168" fill="#fff" opacity=".5"/><circle cx="200" cy="250" r="118" fill="#fff" opacity=".4"/>';
    }
    if (variant !== 2 && !bare) {
      shadow = `<ellipse cx="200" cy="${floor + 10}" rx="${kind === 'watch' || kind === 'glasses' ? 70 : 120}" ry="10" fill="#15171c" opacity=".14" filter="url(#s)"/>`;
    }

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">` +
      `<defs>` +
      `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient>` +
      `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
      `<filter id="s" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>` +
      `</defs>${bare ? '' : `<rect width="400" height="500" fill="url(#bg)"/>${extra}`}` +
      `<g transform="${view}">${shadow}<g transform="translate(0 ${dy})">${SHAPES[kind]('url(#g)', dark)}</g></g></svg>`;

    const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    artCache.set(key, uri);
    return uri;
  }

  /* ---------- بيانات المنتجات: تُقرأ مباشرة من Supabase (لا كتالوج تجريبي) ----------
     يُنفَّذ الطلب بشكل متزامن (XMLHttpRequest) لأن باقي ملفات الموقع (home.js,
     shop.js, product-page.js, store-page.js...) تفترض أن window.Products.all()
     جاهزة فوراً عند تحميلها؛ وهذا الملف يُحمَّل مؤجَّلاً (defer) بعد supabase-js
     و js/api-shim.js، فالبيانات تصل قبل أي صفحة تحتاجها. */
  const ART_BY_CAT = {};
  CATEGORIES.forEach((c) => { ART_BY_CAT[c.id] = c.art; });

  function sbGet(path) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', window.NASAQ_SUPABASE_URL + '/rest/v1/' + path, false);
      xhr.setRequestHeader('apikey', window.NASAQ_SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', 'Bearer ' + window.NASAQ_SUPABASE_ANON_KEY);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) return JSON.parse(xhr.responseText || '[]');
      console.error('[nasaq] تعذّر تحميل المنتجات من Supabase:', xhr.status, xhr.responseText);
    } catch (err) {
      console.error('[nasaq] تعذّر الاتصال بـ Supabase لتحميل المنتجات:', err);
    }
    return [];
  }

  /* نطاق ظهور المتاجر للمشتري: لا متجر يظهر (ولا أي منتج تابع له) لو أبعد من هذا الرقم
     بالكيلومتر عن موقع المشتري الفعلي (إحداثيات، مش اسم محافظة/منطقة). القيمة نفسها
     مُستخدمة كـ default داخل دالة public.nearby_products في قاعدة البيانات، وممرَّرة هنا
     صراحة حتى تبقى واضحة ومربوطة في مكان واحد. */
  const BUYER_RADIUS_KM = 50;

  /* هل موقع المشتري (المسجَّل أو الزائر) معروف الآن؟ تُستخدم من shop.js/home.js لعرض
     شريط "حدّد موقعك" بدل قائمة فارغة بلا تفسير. */
  let locationKnown = false;
  let buyerLoc = null;

  function buildCatalog() {
    buyerLoc = (window.BuyerLocation && window.BuyerLocation.get()) || null;
    locationKnown = !!buyerLoc;
    if (!locationKnown) return []; /* بدون موقع معروف للمشتري لا تظهر أي متاجر/منتجات حقيقية (٥٠ كم فقط) */

    /* الفلترة بالمسافة (٥٠ كم أو أقل، حسب الإحداثيات فقط) تتم بالكامل داخل قاعدة البيانات
       عبر RPC واحدة: public.nearby_products — لا نجلب كل المنتجات هنا لنفلترها في المتصفح. */
    const rows = sbGet('rpc/nearby_products?buyer_lat=' + encodeURIComponent(buyerLoc.lat) +
      '&buyer_lng=' + encodeURIComponent(buyerLoc.lng) + '&radius_km=' + BUYER_RADIUS_KM + '&p_limit=500');
    /* لو دالة nearby_products مش بترجّع video_url نكمّله بطلب واحد خفيف (id + رابط الفيديو فقط)،
       فيظهر فيديو الخدمة/المنتج للعملاء القريبين بدون الحاجة لتعديل الدالة في الداتابيس. */
    if (rows.length && !('video_url' in rows[0])) {
      const vids = {};
      sbGet('products?select=id,video_url&video_url=not.is.null&limit=2000').forEach((v) => { vids[v.id] = v.video_url; });
      rows.forEach((r) => { if (vids[r.id]) r.video_url = vids[r.id]; });
    }
    const reviewRows = rows.length ? sbGet('reviews?select=product_id,rating&limit=5000') : [];
    const agg = {};
    reviewRows.forEach((r) => {
      const a = agg[r.product_id] || (agg[r.product_id] = { sum: 0, count: 0 });
      a.sum += Number(r.rating || 0); a.count += 1;
    });
    return rows
      .filter((row) => row.legacy_id != null)
      .map((row) => {
        const a = agg[row.id];
        /* ألوان حقيقية (product_colors مع صورها الخاصة وكميتها المستقلة) عبر color_variants
           من دالة nearby_products؛ رجوع للعمود القديم colors (بلا صور) لو لم تُضَف ألوان بعد. */
        const realColors = Array.isArray(row.color_variants) && row.color_variants.length
          ? row.color_variants.map((c) => ({ id: c.id, name: c.name, hex: c.hex || '#2b2e35', stock: Number(c.stock || 0), images: Array.isArray(c.images) ? c.images.filter(Boolean) : [] }))
          : null;
        const colors = realColors || (Array.isArray(row.colors) && row.colors.length ? row.colors : [{ name: 'أساسي', hex: '#c5cad3' }]);
        return {
          id: row.legacy_id,
          uuid: row.id,
          storeId: row.store_id || null,
          sellerId: row.store_id || null,
          seller: row.store_id ? { id: row.store_id, name: row.store_name, slug: row.store_slug } : null,
          name: row.name_ar || row.name || '',
          nameAr: row.name_ar || row.name || '', nameEn: row.name_en || '', nameDe: row.name_de || '',
          descriptionAr: row.description_ar || row.description || '', descriptionEn: row.description_en || '', descriptionDe: row.description_de || '',
          category: row.category || 'clothes',
          price: Number(row.price || 0),
          oldPrice: row.old_price == null ? null : Number(row.old_price),
          isNew: Date.now() - new Date(row.added_at).getTime() < 14 * 864e5,
          rating: a ? Math.round((a.sum / a.count) * 10) / 10 : 0,
          reviews: a ? a.count : 0,
          stock: Number(row.stock || 0),
          sizes: Array.isArray(row.sizes) ? row.sizes : [],
          soldOutSizes: [],
          art: ART_BY_CAT[row.category] || 'tee',
          sku: row.sku || ('NQ-' + row.legacy_id),
          addedAt: row.added_at,
          colors,
          description: row.description_ar || row.description || '',
          details: Array.isArray(row.details) ? row.details : [],
          photos: Array.isArray(row.photos) ? row.photos.filter(Boolean) : [],
          video: row.video_url || null,
          /* المسافة بالمتر بين المشتري وهذا المتجر — لعرضها في بطاقة المنتج/صفحة المتجر */
          distanceM: row.distance_m == null ? null : Number(row.distance_m)
        };
      });
  }

  const PRODUCTS = buildCatalog();

  /* ---------- روابط المنتجات الجميلة ----------
     /product/<اسم-المتجر>/<اسم-المنتج>        ← الرابط العادي
     /campaigns/<اسم-الحملة>/<اسم-المنتج>      ← لو دخل العميل من إعلان/حملة
     الـ slug بيتبني من اسم المنتج العربي (ثابت مهما كانت لغة العرض). لو منتجين في نفس المتجر
     ليهم نفس الاسم، التاني بياخد -<id> في الآخر عشان الرابط يفضل فريد. */
  const OFFICIAL_MARKET = 'nasaq';
  function slugify(s) {
    return String(s == null ? '' : s).normalize('NFC').toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')          /* التشكيل والتطويل */
      .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
  }
  const marketSlugOf = (p) => slugify((p.seller && p.seller.slug) || OFFICIAL_MARKET);
  let PATH_IDX = null, PATH_IDX_LEN = -1;
  function pathIndex() {
    if (PATH_IDX && PATH_IDX_LEN === PRODUCTS.length) return PATH_IDX;
    const byId = new Map(), byPath = new Map();
    PRODUCTS.slice().sort((a, b) => a.id - b.id).forEach((p) => {
      const m = marketSlugOf(p); let n = slugify(p.nameAr || p.name);
      if (byPath.has(m + '/' + n)) n = n + '-' + p.id;
      byPath.set(m + '/' + n, p); byId.set(p.id, { market: m, name: n });
    });
    PATH_IDX = { byId, byPath }; PATH_IDX_LEN = PRODUCTS.length;
    return PATH_IDX;
  }
  const enc = encodeURIComponent;
  function productUrl(p) { const x = pathIndex().byId.get(p.id); return x ? '/product/' + enc(x.market) + '/' + enc(x.name) : '/shop'; }
  function campaignUrl(c, p) { const x = pathIndex().byId.get(p.id); return x ? '/campaigns/' + enc(slugify(c && c.name)) + '/' + enc(x.name) : productUrl(p); }
  function byPath(market, name) { return pathIndex().byPath.get(slugify(market) + '/' + slugify(name)) || null; }
  /* منتج بالاسم فقط (صفحات الحملات): لو في أكتر من متجر بنفس الاسم نفضّل متجر الحملة */
  function bySlug(name, storeId) {
    const n = slugify(name); let hit = null;
    pathIndex().byPath.forEach((p, k) => {
      if (k.split('/')[1] !== n) return;
      if (!hit || (storeId != null && p.storeId === storeId)) hit = p;
    });
    return hit;
  }

  /* ---------- الترجمة: أسماء وأوصاف المنتجات (من الداتابيس) + أسماء الأقسام ---------- */
  function i18nRegister(map, opts) {
    const q = window.NASAQ_I18N_PENDING = window.NASAQ_I18N_PENDING || [];
    if (window.I18n && window.I18n.register) window.I18n.register(map, opts);
    else if (q && q.push) q.push({ map, opts });
  }
  (function registerCatalogI18n() {
    const m = {};
    PRODUCTS.forEach((p) => {
      /* fallback: Deutsch → English → العربية ، English → العربية (يُطبَّق داخل I18n.register) */
      if (p.nameAr && (p.nameEn || p.nameDe)) m[p.nameAr] = { en: p.nameEn, de: p.nameDe };
      if (p.descriptionAr && (p.descriptionEn || p.descriptionDe)) m[p.descriptionAr] = { en: p.descriptionEn, de: p.descriptionDe };
    });
    i18nRegister(m);
    /* أسماء الأقسام: جدول categories (name_ar/en/de). الأقسام الفرعية أولاً ثم الرئيسية كي تغلب الرئيسية عند تطابق الاسم العربي. */
    try {
      let rows = null;
      const ck = 'nasaq_cats_i18n_v1';
      try { const c = JSON.parse(sessionStorage.getItem(ck) || 'null'); if (c && Date.now() - c.t < 600000) rows = c.rows; } catch (_) { /* تجاهل */ }
      if (!rows) {
        rows = sbGet('categories?select=slug,parent_slug,name_ar,name_en,name_de&order=sort_order.asc&limit=500');
        if (rows && rows.length) { try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), rows })); } catch (_) { /* تجاهل */ } }
      }
      const cm = {};
      (rows || []).filter((r) => r.parent_slug).concat((rows || []).filter((r) => !r.parent_slug)).forEach((r) => { cm[r.name_ar] = { en: r.name_en, de: r.name_de }; });
      i18nRegister(cm, { phrase: true });
    } catch (_) { /* القاموس المدمج يكفي */ }
  })();

  /* ---------- الصور: صور اللون المختار أولاً (إن وُجدت)، وإلا صور المنتج العامة، وإلا رسمة SVG بديلة ---------- */
  /* صور اللون الحالي: فقط لو كان لهذا اللون صور خاصة به (رفعها البائع)؛ غير ذلك null */
  function colorImages(p, colorIdx) {
    const c = p.colors && p.colors[colorIdx || 0];
    return (c && Array.isArray(c.images) && c.images.length) ? c.images : null;
  }
  function activePhotos(p, colorIdx) {
    return colorImages(p, colorIdx) || (p.photos && p.photos.length ? p.photos : null);
  }
  function photoCount(p, colorIdx) {
    const ph = activePhotos(p, colorIdx);
    return ph ? ph.length : 1;
  }
  function photoURL(p, i, colorIdx) {
    const ph = activePhotos(p, colorIdx);
    if (ph) return ph[i % ph.length];
    return artFor(p.id, i, colorIdx);
  }
  function gallery(p, colorIdx) {
    return Array.from({ length: photoCount(p, colorIdx) }, (_, i) => photoURL(p, i, colorIdx));
  }
  function artFor(id, i, colorIdx) {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    const c = p.colors[colorIdx || 0] || p.colors[0];
    return art(p.art, c.hex, (i || 0) % 4, p.id);
  }
  /* سمات img جاهزة: المصدر + مفتاح الرسمة الاحتياطية */
  function imgAttrs(p, i, colorIdx, size) {
    return ' src="' + photoURL(p, i, colorIdx, size) + '" data-art="' + p.id + '.' + i + '.' + (colorIdx || 0) + '"';
  }
  function setImg(img, p, i, colorIdx, size) {
    delete img.dataset.artDone;
    img.dataset.art = p.id + '.' + i + '.' + (colorIdx || 0);
    img.src = photoURL(p, i, colorIdx, size);
  }
  /* أي صورة تفشل (بلا إنترنت مثلاً) تُستبدل بالرسمة تلقائياً */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.dataset || !img.dataset.art || img.dataset.artDone) return;
    img.dataset.artDone = '1';
    const a = img.dataset.art.split('.').map(Number);
    img.src = artFor(a[0], a[1], a[2]);
  }, true);

  PRODUCTS.forEach((p) => { p.images = gallery(p, 0); });

  /* ---------- الأكثر مبيعاً: الأعلى تقييمات داخل كل فئة ---------- */
  const bestIds = new Set();
  CATEGORIES.forEach((c) => {
    const top = PRODUCTS.filter((p) => p.category === c.id && p.stock > 0).sort((a, b) => b.reviews - a.reviews)[0];
    if (top) bestIds.add(top.id);
  });

  /* ---------- التوصيل: من سياسة المتجر (3 إلى 5 أيام عادي، 1 إلى 2 سريع) ---------- */
  const F_DAY = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric' });
  const F_MONTH = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { month: 'long' });
  const F_FULL = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
  const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  function rangeText(a, b) {
    const d1 = F_DAY.format(a), d2 = F_DAY.format(b), m1 = F_MONTH.format(a), m2 = F_MONTH.format(b);
    return m1 === m2 ? d1 + ' و' + d2 + ' ' + m1 : d1 + ' ' + m1 + ' و' + d2 + ' ' + m2;
  }
  const delivery = {
    standard: () => 'بين ' + rangeText(inDays(3), inDays(5)),
    express: () => 'بين ' + rangeText(inDays(1), inDays(2)),
    fullDate: (n) => F_FULL.format(inDays(n))
  };
  const shipNote = (p) => (p.price >= STORE.freeShippingFrom ? 'شحن مجاني' : 'شحن مجاني فوق ' + money(STORE.freeShippingFrom));

  /* ---------- عدّاد العروض: ينتهي عند منتصف الليل (يتجدد يومياً) ---------- */
  function msToMidnight() {
    const n = new Date(), m = new Date(n);
    m.setHours(24, 0, 0, 0);
    return m - n;
  }
  function clock(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const two = (x) => String(x).padStart(2, '0');
    return two(Math.floor(t / 3600)) + ':' + two(Math.floor((t % 3600) / 60)) + ':' + two(t % 60);
  }

  const Products = {
    categories: CATEGORIES,
    /* موقع المشتري غير معروف؟ لا تُظهر واجهات المتجر "لا توجد نتائج" العادية، بل شريط
       "حدّد موقعك" (راجع UI.locationBannerHTML وshop.js/home.js) */
    locationKnown: () => locationKnown,
    buyerLocation: () => buyerLoc,
    radiusKm: BUYER_RADIUS_KM,
    all: () => PRODUCTS.slice(),
    byId: (id) => PRODUCTS.find((p) => p.id === Number(id)),
    slugify, url: productUrl, campaignUrl, byPath, bySlug,
    categoryName: (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || '',
    subs: (id) => (CATEGORIES.find((c) => c.id === id) || {}).subs || [],
    subName: (id) => (SUB_INDEX[id] || {}).name || '',
    catOfSub: (id) => SUB2CAT[id] || '',
    /* رسمة جاهزة بلا منتج: kind = شكل، color = لون، bare = بلا خلفية (للافتات) */
    art: (kind, color, variant, seed, bare) => art(kind, color || '#2b2e35', variant || 0, seed || 0, !!bare),
    discountPct: (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0),
    isSoldOut: (p) => p.stock <= 0,
    sizeSoldOut: (p, s) => (p.soldOutSizes || []).includes(s),
    gallery, photoURL, photoCount, imgAttrs, setImg, artFor,
    normalize,
    isBestSeller: (p) => bestIds.has(p.id),
    sellerOf: (p) => p.seller || { id: 'official', name: STORE.name, slug: '' },
    delivery, shipNote, msToMidnight, clock,
    related(p, n) {
      const same = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category);
      const rest = PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category).sort((a, b) => b.rating - a.rating);
      return same.concat(rest).slice(0, n || 4);
    }
  };

  window.Store = { config: STORE, esc, money };
  window.Products = Products;
})();
