/* ==========================================================================
   js/mobile-home.js — الرئيسية على الموبايل (أقل من 768px)
   لافتات، شريط أقسام، «مقترحة لك»، عروض، أكواد خصم، ثم قسم لكل فئة (بلاطات فرعية + لافتة + مختارات).
   يُرسم مرة واحدة داخل #m-home. شاشة الكمبيوتر تبقى كما رسمها home.js دون أي تغيير.
   ========================================================================== */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'home') return;
  const root = document.getElementById('m-home');
  if (!root || !window.Products || !window.UI) return;

  const esc = window.Store.esc;
  const money = window.Store.money;
  const CFG = window.Store.config;
  const icon = UI.icon;
  const mq = window.matchMedia('(max-width: 767px)');

  const all = Products.all();
  const pctOf = Products.discountPct;
  const inStock = (p) => !Products.isSoldOut(p);
  const feat = (a, b) => b.rating * Math.log(b.reviews + 1) - a.rating * Math.log(a.reviews + 1);
  const spIds = window.Market ? window.Market.ads.sponsoredIds() : new Set();
  const spFirst = (a, b) => (spIds.has(b.id) ? 1 : 0) - (spIds.has(a.id) ? 1 : 0);
  const kfmt = (n) => (n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + ' ألف' : String(n));
  const discounted = all.filter((p) => pctOf(p) > 0 && inStock(p)).sort((a, b) => pctOf(b) - pctOf(a));
  const maxDiscount = discounted.length ? pctOf(discounted[0]) : 0;
  const newest = all.filter((p) => p.isNew && inStock(p)).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  const ofCat = (cat) => all.filter((p) => p.category === cat && inStock(p)).sort(feat);

  /* ألوان أشكال الأقسام (من لوحة الموقع: حبر/نيلي/رمادي) */
  const TONES = ['#2b2e35', '#2f45d4', '#8b919d', '#1f2f9a', '#454a55', '#c5cad3'];
  const LIGHT = ['#eceef1', '#c5cad3', '#a9b5ff'];
  const cover = (kind, i) => '<img src="' + Products.art(kind, TONES[i % TONES.length], 0, i) + '" alt="" width="82" height="82" loading="lazy" decoding="async">';

  /* ---------- أجزاء صغيرة ---------- */
  const head = (title, href, sub) =>
    '<div class="m-head"><div class="m-head__main"><h2>' + esc(title) + '</h2>' + (sub || '') + '</div>' +
    (href ? '<a class="m-view" href="' + href + '">عرض الكل</a>' : '') + '</div>';

  const rail = (html, cls) =>
    '<div class="mrail' + (cls ? ' ' + cls : '') + '" data-mrail>' +
      '<button type="button" class="mrail__nav mrail__nav--prev" data-mdir="-1" aria-label="السابق" hidden>' + icon('chev-r') + '</button>' +
      '<div class="mrail__track">' + html + '</div>' +
      '<button type="button" class="mrail__nav mrail__nav--next" data-mdir="1" aria-label="التالي" hidden>' + icon('chev-l') + '</button>' +
    '</div>';

  function note(p) {
    if (!inStock(p)) return '<p class="mc__note mc__note--out">نفدت الكمية</p>';
    if (p.stock <= 5) return '<p class="mc__note mc__note--low">' + icon('alert') + (p.stock === 1 ? 'متبقي قطعة واحدة فقط' : 'متبقي ' + p.stock + ' قطع فقط') + '</p>';
    return '<p class="mc__note mc__note--ship">' + icon('truck') + (p.price >= CFG.freeShippingFrom ? 'توصيل مجاني' : 'توصيل خلال 3 - 5 أيام') + '</p>';
  }

  /* بطاقة المنتج: صورة + قلب + زر (+) + عنوان + تقييم + سعر + توصيل/مخزون */
  function mcard(p) {
    const spn = UI.sponsor(p);
    const href = spn ? Products.campaignUrl(spn, p) : Products.url(p);
    const pct = pctOf(p);
    const out = !inStock(p);
    const sp = UI.sponsor(p);
    if (sp && window.Market) window.Market.ads.impression(sp.id);
    const add = out ? '' : (p.sizes.length
      ? '<a class="mc__add" href="' + href + '" aria-label="اختر المقاس لإضافة ' + esc(p.name) + '">' + icon('plus') + '</a>'
      : '<button type="button" class="mc__add" data-quick-add="' + p.id + '" aria-label="أضف إلى السلة: ' + esc(p.name) + '">' + icon('plus') + '</button>');
    return '<article class="mc' + (out ? ' is-out' : '') + '" data-id="' + p.id + '"' + (sp ? ' data-ad="' + esc(sp.id) + '"' : '') + '>' +
      '<div class="mc__media"><a class="mc__link" href="' + href + '" tabindex="-1" aria-hidden="true"><img' + Products.imgAttrs(p, 0, 0, 'md') + ' alt="' + esc(p.name) + '" width="176" height="176" loading="lazy" decoding="async"></a>' +
        (sp ? '<span class="mc__ad">مموَّل</span>' : '') + UI.wishBtn(p, 'wish-btn mc__wish') + add + '</div>' +
      '<h3 class="mc__title"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
      (p.reviews
        ? '<span class="mc__rate"><b>' + p.rating.toFixed(1) + '</b><span>(' + kfmt(p.reviews) + ')</span></span>'
        : '<span class="mc__rate mc__rate--none">جديد</span>') +
      '<p class="mc__price"><strong>' + money(p.price) + '</strong></p>' +
      '<p class="mc__old">' + (pct ? '<del><span class="sr-only">السعر قبل الخصم </span>' + money(p.oldPrice) + '</del><bdi class="pct"><span class="sr-only">خصم </span>−' + pct + '%</bdi>' : '') + '</p>' +
      note(p) + '</article>';
  }

  /* ---------- 1) لافتات الأعلى ---------- */
  function artOf(list) {
    return '<span class="mb__art" aria-hidden="true">' + list.slice(0, 2).map((p) => (p.photos && p.photos.length
      ? '<img class="mb__ph" src="' + esc(Products.photoURL(p, 0, 0)) + '" alt="" width="120" height="120" loading="lazy">'
      : '<img src="' + Products.art(p.art, p.colors[0].hex, 0, p.id, true) + '" alt="" width="120" height="150" loading="lazy">')).join('') + '</span>';
  }
  const slide = (tone, title, text, cta, href, list) =>
    '<a class="mb mb--' + tone + '" href="' + href + '"><span class="mb__txt"><strong>' + esc(title) + '</strong><small>' + esc(text) + '</small><span class="mb__cta">' + esc(cta) + '</span></span>' + artOf(list || []) + '</a>';

  function heroSlides() {
    const s = [];
    const mix = [ofCat('electronics')[0], ofCat('home')[0]].filter(Boolean);
    s.push(slide('deep', 'كل ما تحتاجه في مكان واحد', 'إلكترونيات وأجهزة ومنزل وأزياء وجمال وأكثر', 'ابدأ التسوّق', '/shop', mix));
    if (discounted.length) s.push(slide('ink', 'خصم حتى ' + maxDiscount + '% على قطع مختارة', 'عروض لفترة محدودة في كل الأقسام', 'شاهد العروض', '/shop?sale=1', discounted));
    /* لافتات المعلنين (حملات «لافتة الصفحة الرئيسية») */
    if (window.Market) {
      window.Market.ads.active('hero').forEach((c) => {
        window.Market.ads.impression(c.id);
        s.push('<a class="mb mb--ad" data-ad="' + esc(c.id) + '" href="' + esc(UI.safeHref(c.href)) + '">' +
          (UI.safeImg(c.img) ? '<img class="mb__bg" src="' + UI.safeImg(c.img) + '" alt="" loading="lazy">' : '') +
          '<span class="badge badge--ad mb__tag">إعلان</span>' +
          '<span class="mb__txt"><strong>' + esc(c.title) + '</strong>' + (c.text ? '<small>' + esc(c.text) + '</small>' : '') +
          '<span class="mb__cta">' + esc(c.cta || 'تسوّق الآن') + '</span></span></a>');
      });
    }
    if (newest.length) s.push(slide('soft', 'وصل حديثاً', 'أحدث المنتجات في كل الأقسام', 'تسوّق الجديد', '/shop?sort=new', newest));
    if (ofCat('appliances').length) s.push(slide('mid', 'أجهزة تسهّل يومك', 'ثلاجات وغسالات وتكييفات بتوصيل سريع', 'تسوّق الأجهزة', '/shop?cat=appliances', ofCat('appliances')));
    const fashion = [ofCat('clothes')[0], ofCat('shoes')[0]].filter(Boolean);
    if (fashion.length) s.push(slide('deep', 'موضة تناسب الجميع', 'ملابس وأحذية وحقائب لكل الأعمار', 'تسوّق الأزياء', '/shop?cat=clothes', fashion));
    return s;
  }

  function heroHTML() {
    const s = heroSlides();
    return '<section class="m-hero container" aria-label="لافتات وعروض المتجر"><div class="mhero">' +
      '<p class="mhero__strip">' + icon('truck') + 'شحن مجاني فوق ' + money(CFG.freeShippingFrom) + ' · الدفع عند الاستلام</p>' +
      '<div class="mhero__track" data-hero>' + s.join('') + '</div></div>' +
      (s.length > 1 ? '<div class="mdots" role="group" aria-label="اللافتات">' + s.map((_, i) => '<button type="button" data-hdot="' + i + '" aria-label="لافتة ' + (i + 1) + '"' + (i === 0 ? ' class="is-on"' : '') + '></button>').join('') + '</div>' : '') +
    '</section>';
  }

  /* ---------- 2) شريط الأقسام ---------- */
  function catsHTML() {
    const items = [];
    if (discounted.length) items.push('<a class="mcat" href="/shop?sale=1"><span class="mcat__img mcat__img--pct"><b>' + maxDiscount + '%</b><small>خصم</small></span><span class="mcat__label">عروض اليوم</span></a>');
    if (newest.length) items.push('<a class="mcat" href="/shop?sort=new"><span class="mcat__img mcat__img--new">جديد</span><span class="mcat__label">وصل حديثاً</span></a>');
    Products.categories.forEach((c, i) => {
      if (!all.some((p) => p.category === c.id)) return;
      items.push('<a class="mcat" href="/shop?cat=' + c.id + '"><span class="mcat__img"><img src="' + Products.art(c.art, TONES[i % TONES.length], 0, i) + '" alt="" width="64" height="64" loading="lazy" decoding="async"></span><span class="mcat__label">' + esc(c.name) + '</span></a>');
    });
    return '<section class="m-cats container" aria-label="تسوّق حسب القسم">' + rail(items.join(''), 'mrail--cats') + '</section>';
  }

  /* ---------- 3) مقترحة لك: أفضل منتج من كل قسم بالتناوب ---------- */
  function recommended() {
    const groups = Products.categories.map((c) => ofCat(c.id).sort(spFirst)).filter((g) => g.length);
    const out = [];
    for (let i = 0; out.length < 14 && groups.some((g) => g[i]); i++) groups.forEach((g) => { if (g[i] && out.length < 14) out.push(g[i]); });
    return out;
  }

  /* ---------- 4) أقسام الفئات ---------- */
  const BANNERS = {
    electronics: { title: 'استمتع بترفيه غير مسبوق', subs: ['games', 'tvs', 'headsets'] },
    appliances: { title: 'أجهزة تسهّل يومك', subs: ['fridges', 'washers', 'ac'] },
    home: { title: 'بيتك بأحلى شكل', subs: ['furniture', 'lighting', 'decor'] },
    clothes: { title: 'إطلالة جديدة لكل مناسبة', subs: ['women', 'men', 'kids'] },
    shoes: { title: 'خطوة مريحة كل يوم', subs: ['womenshoes', 'menshoes', 'sportshoes'] },
    bags: { title: 'حقيبة تناسب وجهتك', subs: ['handbags', 'backpacks', 'travel'] },
    accessories: { title: 'لمسة تكمل إطلالتك', subs: ['watches', 'sunglasses', 'jewelry'] },
    beauty: { title: 'جمالك أولاً', subs: ['perfumes', 'makeup', 'skincare'] },
    supermarket: { title: 'مشتريات البيت في مكان واحد', subs: ['groceries', 'drinks', 'cooking'] },
    toys: { title: 'فرحة الأطفال تبدأ هنا', subs: ['plush', 'building', 'vehicles'] },
    sports: { title: 'ابدأ نشاطك اليوم', subs: ['football', 'fitness', 'cycling'] },
    books: { title: 'للقراءة والدراسة', subs: ['books', 'stationery', 'school'] },
    auto: { title: 'عناية كاملة لسيارتك', subs: ['tires', 'autooils', 'motoacc'] },
    pets: { title: 'كل ما يحتاجه رفيقك', subs: ['petfood', 'petacc', 'pettoys'] },
    tools: { title: 'أدوات لكل مهمة', subs: ['power', 'hand', 'worklight'] }
  };

  function banner(c, subs, idx) {
    const cfg = BANNERS[c.id] || {};
    const three = (cfg.subs || []).map((id) => subs.find((x) => x.id === id)).filter(Boolean);
    const cols = (three.length === 3 ? three : subs).slice(0, 3);
    const tone = ['', 'mbn--accent', 'mbn--ink'][idx % 3];
    return '<div class="mbn ' + tone + '"><h3 class="mbn__title">' + esc(cfg.title || 'اكتشف ' + c.name) + '</h3><div class="mbn__cols">' +
      cols.map((x, k) => '<a class="mbn__col" href="/shop?cat=' + c.id + '&amp;sub=' + x.id + '"><img src="' + Products.art(x.art, LIGHT[k % 3], 0, idx + k, true) + '" alt="" width="100" height="92" loading="lazy" decoding="async"><strong>' + esc(x.name) + '</strong><span class="mbn__btn">تسوّق الآن</span></a>').join('') +
      '</div></div>';
  }

  function deptSection(c, idx) {
    const list = all.filter((p) => p.category === c.id);
    if (!list.length) return '';
    const subs = c.subs.filter((x) => list.some((p) => p.sub === x.id));
    const picks = ofCat(c.id).sort(spFirst).slice(0, 12);
    let h = head(c.name, '/shop?cat=' + c.id);
    if (subs.length) h += rail(subs.map((x, k) => '<a class="mtile" href="/shop?cat=' + c.id + '&amp;sub=' + x.id + '"><span class="mtile__img">' + cover(x.art, idx * 2 + k) + '</span><span class="mtile__label">' + esc(x.name) + '</span></a>').join(''), 'mrail--tiles');
    if (subs.length >= 3) h += banner(c, subs, idx);
    if (picks.length) h += head('مختارات ' + c.name, '/shop?cat=' + c.id) + rail(picks.map(mcard).join(''));
    return '<section class="m-sec container" id="dept-' + c.id + '" aria-label="' + esc(c.name) + '">' + h + '</section>';
  }

  /* ---------- الرسم ---------- */
  let drawn = false;
  function draw() {
    drawn = true;
    const rec = recommended();
    const couponRows = Object.keys(window.Cart ? Cart.coupons : {}).map((code) =>
      '<div class="mcoupon"><span><span class="mcoupon__code" dir="ltr">' + esc(code) + '</span><span class="mcoupon__desc">' + esc(Cart.coupons[code].label) + '</span></span>' +
      '<button type="button" data-code="' + esc(code) + '" aria-label="انسخ كود الخصم ' + esc(code) + '">' + icon('copy') + '</button></div>').join('');
    const seen = UI.recent.list();

    root.innerHTML =
      heroHTML() +
      (Products.locationKnown() ? '' : '<div class="container m-sec">' + UI.locationBannerHTML() + '</div>') +
      catsHTML() +
      (rec.length ? '<section class="m-sec container" aria-label="مقترحة لك">' + head('مقترحة لك') + rail(rec.map(mcard).join('')) + '</section>' : '') +
      (discounted.length ? '<section class="m-sec container" aria-label="عروض اليوم">' + head('عروض اليوم', '/shop?sale=1', '<span class="m-count">' + icon('clock') + 'ينتهي خلال ' + UI.countdownHTML() + '</span>') + rail(discounted.slice(0, 14).map(mcard).join('')) + '</section>' : '') +
      (couponRows ? '<section class="m-sec container" id="coupons" aria-label="أكواد الخصم">' + head('أكواد الخصم') + rail(couponRows) + '</section>' : '') +
      Products.categories.map(deptSection).join('') +
      (seen.length ? '<section class="m-sec container" aria-label="شاهدتها مؤخراً">' + head('شاهدتها مؤخراً') + rail(seen.map(mcard).join('')) + '</section>' : '');

    initRails();
    initHero();
    UI.bindLocationBanner(root);
  }

  /* ---------- الأشرطة الأفقية: إظهار/إخفاء الأسهم حسب موضع التمرير ---------- */
  function initRails() {
    root.querySelectorAll('[data-mrail]').forEach((el) => {
      const t = el.querySelector('.mrail__track');
      const prev = el.querySelector('[data-mdir="-1"]');
      const next = el.querySelector('[data-mdir="1"]');
      let raf = 0;
      const upd = () => {
        raf = 0;
        const w = t.clientWidth, sw = t.scrollWidth, x = Math.abs(t.scrollLeft);
        const can = sw - w > 4;
        prev.hidden = !can || x < 4;
        next.hidden = !can || x + w >= sw - 4;
      };
      t.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
  }

  function initHero() {
    const t = root.querySelector('[data-hero]');
    const dots = Array.from(root.querySelectorAll('[data-hdot]'));
    if (!t || !dots.length) return;
    let raf = 0;
    t.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const i = Math.round(Math.abs(t.scrollLeft) / t.clientWidth);
        dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      });
    }, { passive: true });
    dots.forEach((d) => d.addEventListener('click', () => {
      const rtl = getComputedStyle(t).direction === 'rtl';
      t.scrollTo({ left: Number(d.dataset.hdot) * t.clientWidth * (rtl ? -1 : 1), behavior: UI.reduceMotion() ? 'auto' : 'smooth' });
    }));
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mdir]');
    if (!b) return;
    const t = b.closest('[data-mrail]').querySelector('.mrail__track');
    const rtl = getComputedStyle(t).direction === 'rtl';
    t.scrollBy({ left: Number(b.dataset.mdir) * (rtl ? -1 : 1) * t.clientWidth * 0.85, behavior: UI.reduceMotion() ? 'auto' : 'smooth' });
  });

  const start = () => { if (mq.matches && !drawn) draw(); };
  start();
  if (mq.addEventListener) mq.addEventListener('change', start); else if (mq.addListener) mq.addListener(start);
})();
