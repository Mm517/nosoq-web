/* ==========================================================================
   js/ui.js — مكوّنات الواجهة المشتركة بين كل الصفحات
   الهيدر (بحث + موقع + حساب + سلة) وشريط التصنيفات، قائمة جانبية، سلة منزلقة، اختيار الموقع،
   Toast، بطاقات المنتجات، كاروسيل، بطاقات البلاطات، Skeleton
   ========================================================================== */
(function () {
  'use strict';

  const CFG = window.Store.config;
  const esc = window.Store.esc;
  const money = window.Store.money;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- الأيقونات (sprite واحد) ---------- */
  const ICONS = {
    bag: '<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z"/>',
    home: '<path d="M4 11.2 12 4l8 7.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-7.8Z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7"/>',
    truck: '<path d="M3 6.5h11v9.5H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
    shield: '<path d="M12 3l7 3v5.2c0 4.6-3 7.9-7 9.8-4-1.9-7-5.2-7-9.8V6l7-3Z"/><path d="m9 12 2 2 4-4.2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-3.6L4 9.5M4 4.5v5h5M4 13a8 8 0 0 0 14.3 3.6l1.7-2.1M20 19.5v-5h-5"/>',
    filter: '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    'chev-l': '<path d="m15 6-6 6 6 6"/>',
    'chev-r': '<path d="m9 6 6 6-6 6"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.3-3.6 4-5.4 7-5.4s5.7 1.8 7 5.4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.4"/>',
    idcard: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M6 16c.5-1.6 1.7-2.4 2.5-2.4s2 .8 2.5 2.4M14 9.5h5M14 13h5M14 16h3"/>',
    store: '<path d="M4 10 5 4h14l1 6"/><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9"/><path d="M4 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
    motorbike: '<circle cx="5.5" cy="17" r="2.6"/><circle cx="18.5" cy="17" r="2.6"/><path d="M5.5 17 9 10h4.5l2.8 4.4M9 10 7.7 7H5M13.5 10l2 3.2h3"/>',
    bicycle: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17 10 8h3l4 9M10 8H8M13 11l3-3h2.5"/>',
    car: '<path d="M4 16v-3.5l2-4.5h12l2 4.5V16"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16.5" r="1.6"/><circle cx="16" cy="16.5" r="1.6"/>',
    chat: '<path d="M4 12a8 8 0 1 1 3 6.2L4 20l1.6-3.8A8 8 0 0 1 4 12Z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    chart: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
    megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h2l8 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M18 9.5a4 4 0 0 1 0 5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/><circle cx="12" cy="12" r="7"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14 8 3 3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17v.01"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    'chev-d': '<path d="m6 9 6 6 6-6"/>',
    tag: '<path d="M3.5 12.2V4.5h7.7l9.3 9.3a1.5 1.5 0 0 1 0 2.1l-5.6 5.6a1.5 1.5 0 0 1-2.1 0L3.5 12.2Z"/><circle cx="8" cy="9" r="1.3"/>',
    cash: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18v3H3zM12 9v11M12 9c-1.5-3.5-5-4-5-1.7C7 9 9.5 9 12 9Zm0 0c1.5-3.5 5-4 5-1.7C17 9 14.5 9 12 9Z"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }
  function sprite() {
    const syms = Object.keys(ICONS).map((k) => '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + syms + '</defs></svg>';
  }

  /* ---------- قطع HTML صغيرة قابلة لإعادة الاستخدام ---------- */
  function priceHTML(p) {
    const has = Products.discountPct(p) > 0;
    return '<p class="price"><span class="price__now">' + money(p.price) + '</span>' +
      (has ? '<del class="price__old"><span class="sr-only">السعر قبل الخصم </span>' + money(p.oldPrice) + '</del>' : '') + '</p>';
  }

  /* مسافة المتجر عن المشتري (لو معروفة) — تُعرض على بطاقة المنتج/صفحة المتجر */
  function distanceHTML(p) {
    if (p.distanceM == null || !window.Distance) return '';
    const t = window.Distance.format(p.distanceM);
    if (!t) return '';
    return '<p class="card__distance"><span class="sr-only">يبعد عنك </span>' + icon('pin') + t + '</p>';
  }

  function ratingHTML(p) {
    if (!p.reviews) return '<span class="rating rating--none">جديد · بلا تقييمات بعد</span>';
    return '<span class="rating"><span class="stars" style="--rate:' + p.rating + '" role="img" aria-label="التقييم ' + p.rating + ' من 5"></span>' +
      '<span class="rating__num">' + p.rating.toFixed(1) + '</span><span class="rating__count">(' + p.reviews + ')</span></span>';
  }

  function badgesHTML(p) {
    const pct = Products.discountPct(p);
    let h = '';
    if (Products.isSoldOut(p)) h += '<span class="badge badge--out">نفدت الكمية</span>';
    else {
      if (p.isNew) h += '<span class="badge badge--new">جديد</span>';
      if (pct) h += '<span class="badge badge--sale">خصم ' + pct + '%</span>';
    }
    if (sponsor(p)) h += '<span class="badge badge--ad">مموَّل</span>';
    return h;
  }

  /* روابط ومصادر صور الإعلانات: نقبل فقط صفحات المتجر أو http(s) وصور data:image، لمنع javascript: */
  const safeHref = (h) => (/^(https?:\/\/|\/(?!\/)|[a-z0-9_\-\/]+\.html)/i.test(h || '') ? h : '/shop');
  const safeImg = (u) => (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(u || '') ? u : '');

  /* شريحة إعلانية في شريط اللافتات */
  function adSlide(c) {
    return '<article class="promo-card promo-card--ad" data-ad="' + esc(c.id) + '">' +
      (safeImg(c.img) ? '<img class="promo-card__bg" src="' + safeImg(c.img) + '" alt="" loading="lazy">' : '') +
      '<span class="badge badge--ad promo-card__tag">إعلان</span>' +
      '<div class="promo-card__body"><h3>' + esc(c.title) + '</h3>' + (c.text ? '<p>' + esc(c.text) + '</p>' : '') +
      '<a class="btn btn--light btn--sm promo-card__cta" href="' + esc(safeHref(c.href)) + '">' + esc(c.cta || 'تسوّق الآن') + '</a></div></article>';
  }
  /* لافتة عريضة أعلى صفحة المنتجات */
  function adBanner(c) {
    return '<a class="ad-banner" href="' + esc(safeHref(c.href)) + '" data-ad="' + esc(c.id) + '">' +
      (safeImg(c.img) ? '<img class="ad-banner__img" src="' + safeImg(c.img) + '" alt="">' : '') +
      '<span class="ad-banner__body"><span class="badge badge--ad">إعلان</span><strong>' + esc(c.title) + '</strong>' +
      (c.text ? '<span>' + esc(c.text) + '</span>' : '') + '<span class="btn btn--light btn--sm">' + esc(c.cta || 'تسوّق الآن') + '</span></span></a>';
  }

  /* منتج مموَّل: حملة إعلانية نشطة لهذا المنتج (من منصة البائعين) */
  function sponsor(p) {
    if (!window.Market) return null;
    return window.Market.ads.active('product').find((c) => Number(c.productId) === p.id) || null;
  }
  /* رابط المنتج: لو عليه حملة نشطة يفتح من /campaigns/... وإلا /product/... */
  function productHref(p) { const c = sponsor(p); return c ? Products.campaignUrl(c, p) : Products.url(p); }
  function adAttr(p) {
    const c = sponsor(p);
    if (!c) return '';
    window.Market.ads.impression(c.id);
    return ' data-ad="' + c.id + '"';
  }

  function wishBtn(p, cls) {
    const on = Wishlist.has(p.id);
    return '<button type="button" class="' + (cls || 'wish-btn') + (on ? ' is-active' : '') + '" data-wish="' + p.id + '" aria-pressed="' + on +
      '" aria-label="المفضلة: ' + esc(p.name) + '">' + icon('heart') + '</button>';
  }

  /* ---------- بطاقة المنتج ---------- */
  function card(p) {
    const out = Products.isSoldOut(p);
    const href = productHref(p);
    let quick;
    if (out) {
      quick = '<div class="card__quick"><button type="button" class="btn btn--sm btn--block" disabled>نفدت الكمية</button></div>';
    } else if (p.sizes.length) {
      quick = '<div class="card__quick"><p class="card__quick-title">إضافة للسلة، اختر المقاس</p><div class="chips" role="group" aria-label="اختر المقاس لإضافة ' + esc(p.name) + '">' +
        p.sizes.map((s) => '<button type="button" class="chip" data-quick-add="' + p.id + '" data-size="' + s + '"' +
          (Products.sizeSoldOut(p, s) ? ' disabled' : '') + ' aria-label="إضافة ' + esc(p.name) + ' مقاس ' + s + ' إلى السلة">' + s + '</button>').join('') +
        '</div></div>';
    } else {
      quick = '<div class="card__quick"><button type="button" class="btn btn--primary btn--sm btn--block" data-quick-add="' + p.id + '">' + icon('bag') + 'إضافة للسلة</button></div>';
    }
    return '<article class="card' + (out ? ' is-out' : '') + '" data-id="' + p.id + '"' + adAttr(p) + '>' +
      '<div class="card__media">' +
        '<a class="card__link" href="' + href + '" tabindex="-1" aria-hidden="true">' +
          '<img class="card__img"' + Products.imgAttrs(p, 0, 0, 'md') + ' alt="' + esc(p.name) + '" width="480" height="600" loading="lazy" decoding="async">' +
          '<img class="card__img card__img--alt"' + Products.imgAttrs(p, 1, 0, 'md') + ' alt="" width="480" height="600" loading="lazy" decoding="async">' +
        '</a>' +
        '<div class="card__badges">' + badgesHTML(p) + '</div>' +
        wishBtn(p, 'wish-btn card__wish') +
        quick +
      '</div>' +
      '<div class="card__body">' +
        '<h3 class="card__title"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
        ratingHTML(p) + priceHTML(p) + distanceHTML(p) +
      '</div></article>';
  }

  const cards = (list) => list.map(card).join('');

  /* بطاقة الكاروسيل: صورة، عنوان، تقييم، شارة الأكثر مبيعاً، نسبة الخصم والسعر، موعد التوصيل */
  function pcard(p) {
    const href = productHref(p);
    const pct = Products.discountPct(p);
    const out = Products.isSoldOut(p);
    return '<article class="pcard' + (out ? ' is-out' : '') + '" data-id="' + p.id + '"' + adAttr(p) + '>' +
      (sponsor(p) ? '<span class="pcard__ad">مموَّل</span>' : '') +
      '<div class="pcard__media"><a href="' + href + '" tabindex="-1" aria-hidden="true"><img' + Products.imgAttrs(p, 0, 0, 'md') + ' alt="' + esc(p.name) + '" width="480" height="600" loading="lazy" decoding="async"></a>' +
        wishBtn(p, 'wish-btn pcard__wish') + '</div>' +
      '<h3 class="pcard__title"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
      ratingHTML(p) +
      (Products.isBestSeller(p) ? '<p><span class="best">الأكثر مبيعاً في ' + esc(Products.categoryName(p.category)) + '</span></p>' : '') +
      '<p class="pcard__price">' + (pct ? '<span class="pct"><span class="sr-only">خصم </span>−' + pct + '%</span>' : '') + '<strong>' + money(p.price) + '</strong></p>' +
      (pct ? '<p class="pcard__list">السعر قبل الخصم: <del>' + money(p.oldPrice) + '</del></p>' : '') +
      (out ? '<p class="pcard__note is-out">نفدت الكمية</p>'
           : '<p class="pcard__note">يصلك ' + Products.delivery.standard() + '</p><p class="pcard__note pcard__note--muted">' + Products.shipNote(p) + '</p>') +
      distanceHTML(p) +
    '</article>';
  }

  /* بلاطة داخل بطاقة متعددة البلاطات: إمّا صورة أو نص كبير. label/sub/badge HTML جاهز (يُهرَّب عند الاستدعاء) */
  function tile(o) {
    const top = o.img
      ? '<span class="tile__img"><img' + o.img + ' alt="" width="320" height="400" loading="lazy" decoding="async">' + (o.badge ? '<span class="tile__badge">' + o.badge + '</span>' : '') + '</span>'
      : '<span class="tile__text' + (o.tone ? ' tile__text--' + o.tone : '') + '"><strong>' + o.big + '</strong><small>' + o.small + '</small></span>';
    return '<a class="tile" href="' + o.href + '">' + top + '<span class="tile__label">' + o.label + '</span>' + (o.sub ? '<span class="tile__sub">' + o.sub + '</span>' : '') + '</a>';
  }

  function tileCard(o) {
    return '<section class="tcard' + (o.cls ? ' ' + o.cls : '') + '" id="' + o.id + '" aria-labelledby="' + o.id + '-t">' +
      '<div class="tcard__head"><h2 id="' + o.id + '-t">' + esc(o.title) + '</h2>' +
      (o.href ? '<a class="tcard__more" href="' + o.href + '" aria-label="عرض الكل: ' + esc(o.title) + '">' + icon('chev-l') + '</a>' : '') + '</div>' +
      (o.body || '<div class="tcard__grid">' + o.tiles.join('') + '</div>') + (o.foot || '') + '</section>';
  }

  /* كاروسيل أفقي بأسهم وعدّاد صفحات. o.rail = شريط بلا عنوان (لافتات الرئيسية) */
  function carousel(o) {
    const tid = o.id + '-t';
    return '<section class="car' + (o.rail ? ' car--rail' : '') + '" data-carousel id="' + o.id + '" aria-labelledby="' + tid + '">' +
      (o.rail
        ? '<h2 class="sr-only" id="' + tid + '">' + esc(o.title) + '</h2>'
        : '<div class="car__head"><h2 class="car__title" id="' + tid + '">' + esc(o.title) + '</h2>' +
          (o.href ? '<a class="section__link" href="' + o.href + '">' + esc(o.more || 'عرض المزيد') + '</a>' : '') +
          '<span class="car__page" data-car-page></span></div>') +
      '<div class="car__wrap">' +
        '<button type="button" class="car__nav car__nav--prev" data-car-dir="-1" aria-label="السابق" hidden>' + icon('chev-r') + '</button>' +
        '<div class="car__track" tabindex="0" role="group" aria-roledescription="كاروسيل" aria-labelledby="' + tid + '">' +
          o.items.map((h) => '<div class="car__item">' + h + '</div>').join('') + '</div>' +
        '<button type="button" class="car__nav car__nav--next" data-car-dir="1" aria-label="التالي">' + icon('chev-l') + '</button>' +
      '</div></section>';
  }

  function initCarousels(root) {
    $$('[data-carousel]', root || document).forEach((car) => {
      if (car.dataset.ready) return;
      car.dataset.ready = '1';
      const track = $('.car__track', car), prev = $('[data-car-dir="-1"]', car), next = $('[data-car-dir="1"]', car), pageEl = $('[data-car-page]', car);
      let raf = 0;
      const update = () => {
        raf = 0;
        const w = track.clientWidth, sw = track.scrollWidth, x = Math.abs(track.scrollLeft), step = w * 0.92;
        const total = sw - w <= 2 ? 1 : Math.ceil((sw - w - 2) / step) + 1;
        const atEnd = x + w >= sw - 2;
        const cur = atEnd ? total : Math.min(total, Math.round(x / step) + 1);
        prev.hidden = total === 1 || x < 2;
        next.hidden = total === 1 || atEnd;
        if (pageEl) pageEl.textContent = total > 1 ? 'صفحة ' + cur + ' من ' + total : '';
      };
      const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
      track.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue);
      update();
    });
  }

  function scrollCarousel(btn) {
    const track = $('.car__track', btn.closest('[data-carousel]'));
    const rtl = getComputedStyle(track).direction === 'rtl';
    track.scrollBy({ left: Number(btn.dataset.carDir) * (rtl ? -1 : 1) * track.clientWidth * 0.92, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  /* عدّاد العروض: يعدّ حتى منتصف الليل، وتحدّثه كل الشارات بمؤقت واحد */
  const countdownHTML = () => '<span class="countdown" role="timer" data-countdown>' + Products.clock(Products.msToMidnight()) + '</span>';
  function tickCountdowns() {
    const t = Products.clock(Products.msToMidnight());
    $$('[data-countdown]').forEach((el) => { if (el.textContent !== t) el.textContent = t; });
  }

  /* ---------- الموقع: مدينة التوصيل + تفاصيل العنوان (من Geo) ---------- */
  const LOC_KEY = 'nasaq_loc_v1', LOC2 = 'nasaq_loc_v2';
  const loc = {
    details() { try { const d = JSON.parse(localStorage.getItem(LOC2)); return d && typeof d === 'object' ? d : null; } catch (_) { return null; } },
    get() {
      const d = loc.details();
      if (d && (d.city || d.area)) return d.city || d.area;
      try { return localStorage.getItem(LOC_KEY) || ''; } catch (_) { return ''; }
    },
    setDetails(d) {
      try { localStorage.setItem(LOC2, JSON.stringify(d)); localStorage.setItem(LOC_KEY, d.city || d.area || ''); } catch (_) { /* التخزين غير متاح */ }
      document.dispatchEvent(new CustomEvent('location:change'));
    },
    set(city) { loc.setDetails({ city }); }
  };
  function updateLocLabels() {
    const c = loc.get();
    $$('[data-loc-label]').forEach((el) => { el.textContent = c || 'تحديث الموقع'; });
    $$('[data-loc-city]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.locCity === c)));
  }

  /* ---------- شاهدتها مؤخراً ---------- */
  const RECENT_KEY = 'nasaq_recent_v1';
  const recent = {
    ids() {
      try { const a = JSON.parse(localStorage.getItem(RECENT_KEY)); return Array.isArray(a) ? a.map(Number).filter((id) => Products.byId(id)) : []; } catch (_) { return []; }
    },
    add(id) {
      id = Number(id);
      const l = recent.ids().filter((x) => x !== id);
      l.unshift(id);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(l.slice(0, 12))); } catch (_) { /* تجاهل */ }
    },
    list() { return recent.ids().map((id) => Products.byId(id)); }
  };

  function skeletonCards(n) {
    let h = '';
    for (let i = 0; i < n; i++) {
      h += '<div class="card card--skeleton" aria-hidden="true"><div class="card__media skeleton"></div>' +
        '<div class="skeleton skeleton--line"></div><div class="skeleton skeleton--line skeleton--short"></div></div>';
    }
    return h;
  }

  /* تحميل مع Skeleton: يعرض الهياكل ثم يبدّلها بالمحتوى */
  function load(el, opts) {
    const count = opts.count || 4;
    const delay = opts.delay != null ? opts.delay : (reduceMotion() ? 0 : 450);
    el.setAttribute('aria-busy', 'true');
    el.innerHTML = opts.skeleton || skeletonCards(count);
    return new Promise((resolve) => {
      setTimeout(() => {
        el.innerHTML = opts.render();
        el.setAttribute('aria-busy', 'false');
        resolve();
      }, delay);
    });
  }

  function emptyHTML(o) {
    const acts = (o.actions || []).map((a) => {
      const cls = 'btn ' + (a.primary ? 'btn--primary' : 'btn--ghost');
      return a.href
        ? '<a class="' + cls + '" href="' + esc(a.href) + '">' + esc(a.label) + '</a>'
        : '<button type="button" class="' + cls + '" ' + (a.attr || '') + '>' + esc(a.label) + '</button>';
    }).join('');
    return '<div class="empty" role="status"><div class="empty__icon">' + icon(o.icon || 'bag') + '</div>' +
      '<h2 class="empty__title">' + esc(o.title) + '</h2><p class="empty__text">' + esc(o.text) + '</p>' +
      (acts ? '<div class="empty__actions">' + acts + '</div>' : '') + '</div>';
  }

  /* شريط "حدّد موقعك": يظهر بدل المتاجر/المنتجات لو موقع المشتري غير معروف —
     المتجر يعرض فقط ما يبعد عن المشتري 50 كم أو أقل، وهذا يحتاج معرفة موقعه أولاً. */
  function locationBannerHTML() {
    const loggedIn = !!(window.NasaqCloud && window.NasaqCloud.getSession && window.NasaqCloud.getSession());
    return '<div class="empty location-banner" role="status" data-location-banner>' +
      '<div class="empty__icon">' + icon('pin') + '</div>' +
      '<h2 class="empty__title">حدّد موقعك لنعرض لك المتاجر القريبة منك</h2>' +
      '<p class="empty__text">نعرض فقط المتاجر والمنتجات التي تبعد عنك ' + (window.Products ? window.Products.radiusKm : 50) + ' كم أو أقل، حسب موقعك الفعلي.</p>' +
      '<div class="empty__actions">' +
        '<button type="button" class="btn btn--primary" data-locate-btn>' + icon('pin') + 'استخدم موقعي الحالي</button>' +
        (loggedIn ? '<a class="btn btn--ghost" href="/profile">تحديد الموقع من حسابي</a>' : '<a class="btn btn--ghost" href="/auth?tab=signup">أنشئ حساباً واحفظ موقعك</a>') +
      '</div><p class="field__error" data-locate-msg role="alert"></p></div>';
  }

  /* يُفعِّل زر «استخدم موقعي الحالي» داخل أي شريط location-banner معروض حالياً في الصفحة.
     تُستدعى من shop.js/home.js/mobile-home.js بعد رسم الشريط. */
  function bindLocationBanner(root) {
    const scope = root || document;
    const btn = scope.querySelector('[data-locate-btn]');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const msg = scope.querySelector('[data-locate-msg]');
      btn.disabled = true;
      if (msg) msg.textContent = 'جارٍ تحديد موقعك…';
      window.BuyerLocation.locateGuest().then(() => {
        location.reload();
      }).catch((err) => {
        btn.disabled = false;
        if (msg) msg.textContent = err.message || 'تعذّر تحديد موقعك، حاول لاحقاً.';
      });
    });
  }

  /* ---------- بنود السلة ---------- */
  function variantText(l) {
    const parts = [];
    if (l.color) parts.push('اللون: ' + l.color);
    if (l.size) parts.push('المقاس: ' + l.size);
    return parts.join('، ');
  }
  function lineImgAttrs(l) {
    const idx = Math.max(0, l.product.colors.findIndex((c) => c.name === l.color));
    return Products.imgAttrs(l.product, 0, idx, 'sm');
  }

  function lineHTML(l) {
    const p = l.product;
    const k = esc(l.key);
    return '<li class="line" data-key="' + k + '">' +
      '<a class="line__img" href="' + Products.url(p) + '"><img' + lineImgAttrs(l) + ' alt="" width="96" height="120" loading="lazy"></a>' +
      '<div class="line__info">' +
        '<a class="line__title" href="' + Products.url(p) + '">' + esc(p.name) + '</a>' +
        '<p class="line__variant">' + esc(variantText(l)) + '</p>' +
        '<div class="qty" role="group" aria-label="الكمية: ' + esc(p.name) + '">' +
          '<button type="button" data-cart-action="dec" data-key="' + k + '" aria-label="إنقاص الكمية">' + icon('minus') + '</button>' +
          '<output aria-live="polite">' + l.qty + '</output>' +
          '<button type="button" data-cart-action="inc" data-key="' + k + '" aria-label="زيادة الكمية"' + (l.qty >= Cart.maxQty(p) ? ' disabled' : '') + '>' + icon('plus') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="line__side">' +
        '<strong class="line__total">' + money(l.lineTotal) + '</strong>' +
        (Products.discountPct(p) ? '<del class="line__old">' + money(p.oldPrice * l.qty) + '</del>' : '') +
        '<button type="button" class="link-btn" data-cart-action="remove" data-key="' + k + '" aria-label="حذف ' + esc(p.name) + ' من السلة">' + icon('trash') + 'حذف</button>' +
      '</div></li>';
  }

  /* بند للقراءة فقط (صفحة الدفع) */
  function miniLineHTML(l) {
    return '<li class="mini-line"><div class="mini-line__img"><img' + lineImgAttrs(l) + ' alt="" width="64" height="80"><span class="mini-line__qty" aria-hidden="true">' + l.qty + '</span></div>' +
      '<div class="mini-line__info"><p class="mini-line__title">' + esc(l.product.name) + '</p><p class="mini-line__variant">' + esc(variantText(l)) + '</p><span class="sr-only">الكمية ' + l.qty + '</span></div>' +
      '<strong>' + money(l.lineTotal) + '</strong></li>';
  }

  /* ---------- ملخص الطلب المشترك (السلة + الدفع) ---------- */
  function shipProgressHTML(t) {
    if (t.subtotal <= 0) return '';
    const done = t.freeShippingRemaining === 0;
    return '<div class="ship-progress">' +
      '<p>' + (done ? 'الشحن العادي مجاني على هذا الطلب' : 'أضف ' + money(t.freeShippingRemaining) + ' للحصول على شحن مجاني') + '</p>' +
      '<div class="progress" role="progressbar" aria-label="التقدم نحو الشحن المجاني" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + t.freeShippingProgress + '"><span style="width:' + t.freeShippingProgress + '%"></span></div></div>';
  }

  function couponHTML(t) {
    const c = t.coupon;
    if (c && c.valid) {
      return '<div class="coupon-applied"><span>' + icon('check') + 'الكوبون <strong>' + esc(c.code) + '</strong> مُفعّل</span>' +
        '<button type="button" class="link-btn" data-coupon-remove>إزالة</button></div>';
    }
    return '<form class="coupon" data-coupon-form novalidate>' +
      '<label class="sr-only" for="coupon-input-' + (t.uid || 'x') + '">كود الخصم</label>' +
      '<div class="coupon__row"><input class="input" id="coupon-input-' + (t.uid || 'x') + '" name="coupon" placeholder="كود الخصم" autocomplete="off" dir="ltr">' +
      '<button type="submit" class="btn btn--ghost">تطبيق</button></div>' +
      '<p class="field__error" data-coupon-msg aria-live="polite">' + (c && !c.valid ? esc(c.reason) : '') + '</p></form>';
  }

  function summaryHTML(t, o) {
    const opt = o || {};
    t.uid = opt.uid || 'x';
    const rows =
      '<div><dt>المجموع الفرعي</dt><dd>' + money(t.subtotal) + '</dd></div>' +
      (t.discount > 0 ? '<div class="is-good"><dt>كوبون ' + esc(t.coupon.code) + '</dt><dd>−' + money(t.discount) + '</dd></div>' : '') +
      '<div><dt>الشحن</dt><dd>' + (t.shipping === 0 ? 'مجاني' : money(t.shipping)) + '</dd></div>' +
      '<div class="summary__total"><dt>الإجمالي</dt><dd>' + money(t.total) + '</dd></div>';
    return '<div class="summary"><h2 class="summary__title">ملخص الطلب</h2>' +
      shipProgressHTML(t) +
      '<dl class="summary__rows">' + rows + '</dl>' +
      (t.savings > 0 ? '<p class="summary__note">وفّرت ' + money(t.savings) + ' من خصومات المنتجات</p>' : '') +
      couponHTML(t) +
      (opt.cta === 'checkout' ? '<a class="btn btn--primary btn--block btn--lg" href="/checkout">إتمام الطلب</a>' : '') +
      '</div>';
  }

  /* ---------- Toast ---------- */
  let toastBox, liveBox;
  function announce(msg) {
    if (!liveBox) return;
    liveBox.textContent = '';
    setTimeout(() => { liveBox.textContent = msg; }, 30);
  }

  function toast(message, opts) {
    const o = opts || {};
    const type = o.type || 'success';
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.innerHTML = icon(type === 'error' ? 'close' : 'check', 'toast__icon') +
      '<span class="toast__msg">' + esc(message) + '</span>' +
      (o.action ? '<button type="button" class="toast__action">' + esc(o.action.label) + '</button>' : '') +
      '<button type="button" class="toast__close" aria-label="إغلاق الإشعار">' + icon('close') + '</button>';
    const dismiss = () => {
      el.classList.remove('is-in');
      setTimeout(() => el.remove(), reduceMotion() ? 0 : 250);
    };
    $('.toast__close', el).addEventListener('click', dismiss);
    if (o.action) $('.toast__action', el).addEventListener('click', () => { dismiss(); if (o.action.onClick) o.action.onClick(); });
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
    requestAnimationFrame(() => el.classList.add('is-in'));
    const ms = o.duration == null ? 4200 : o.duration;
    if (ms) setTimeout(dismiss, ms);
    return el;
  }

  /* ---------- اللوحات: السلة، القائمة الجانبية، الموقع، عارض الصور ---------- */
  let drawer, overlay, activePanel = null, lastFocus = null;
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function renderDrawer() {
    const ls = Cart.lines();
    const t = Cart.totals();
    $('[data-drawer-count]').textContent = ls.length ? '(' + t.count + ')' : '';
    $('[data-drawer-body]').innerHTML = ls.length
      ? '<ul class="lines">' + ls.map(lineHTML).join('') + '</ul>'
      : emptyHTML({ icon: 'bag', title: 'سلتك فارغة', text: 'ابدأ بإضافة قطعة تعجبك وستظهر هنا.', actions: [{ label: 'تصفّح المنتجات', href: '/shop', primary: true }] });
    $('[data-drawer-foot]').innerHTML = ls.length
      ? shipProgressHTML(t) +
        '<div class="drawer__subtotal"><span>المجموع الفرعي</span><strong>' + money(t.subtotal) + '</strong></div>' +
        '<p class="drawer__hint">الشحن والكوبونات تُحسب في الخطوة التالية.</p>' +
        '<a class="btn btn--primary btn--block btn--lg" href="/checkout">إتمام الطلب</a>' +
        '<a class="btn btn--ghost btn--block" href="/cart">عرض السلة</a>'
      : '';
  }

  function syncMenuButtons() {
    const open = !!(activePanel && activePanel.id === 'side-menu');
    $$('[data-menu-open]').forEach((b) => {
      b.setAttribute('aria-expanded', String(open));
    });
  }

  function openPanel(el) {
    if (!el || activePanel === el) return;
    if (activePanel) closePanel(true);
    if (!lastFocus || !document.contains(lastFocus) || lastFocus === document.body) lastFocus = document.activeElement;
    activePanel = el;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-visible');
    document.body.classList.add('no-scroll');
    syncMenuButtons();
    setTimeout(() => { const b = $('[data-autofocus]', el) || $('[data-panel-close]', el); if (b) b.focus(); }, 30);
  }

  function closePanel(keepFocusState) {
    if (!activePanel) return;
    const el = activePanel;
    activePanel = null;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
    syncMenuButtons();
    if (keepFocusState === true) return;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  const openCart = () => openPanel(drawer);
  const closeCart = () => closePanel();

  function trapFocus(e) {
    if (e.key !== 'Tab' || !activePanel) return;
    const f = $$(FOCUSABLE, activePanel).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- الهيدر: شعار + موقع + بحث بفئة + حساب + مفضلة + سلة ---------- */
  function currentAccount() {
    try {
      const raw = localStorage.getItem('nasaq_session_v1');
      const account = raw ? JSON.parse(raw) : null;
      return account && account.userId ? account : null;
    } catch (_) { return null; }
  }

  function accountLinks() {
    const account = currentAccount();
    if (!account) {
      return '<a class="btn btn--primary btn--block btn--sm" href="/auth">تسجيل الدخول</a>' +
        '<p class="acct__new">عميل جديد؟ <a href="/auth?tab=signup">أنشئ حسابك</a></p>' +
        '<ul><li><a href="/shop?wishlist=1">المفضلة</a></li><li><a href="/cart">سلة التسوق</a></li>' +
        '<li><a href="/become-seller">بيع منتجاتك معنا</a></li><li><a href="/become-rider">انضم كمندوب توصيل</a></li></ul>';
    }
    const name = esc(account.name || account.email || 'حسابي');
    let roleLink = '';
    if (account.role === 'admin') roleLink = '<li><a href="/admin">لوحة الإدارة</a></li>';
    else if (account.role === 'support') roleLink = '<li><a href="/support">لوحة الدعم</a></li>';
    else if (account.role === 'seller') roleLink = '<li><a href="/seller">لوحة البائع</a></li>';
    else if (account.role === 'rider') roleLink = '<li><a href="/rider">لوحة المندوب</a></li>';
    else roleLink = '<li><a href="/become-seller">بيع منتجاتك معنا</a></li><li><a href="/become-rider">انضم كمندوب توصيل</a></li>';
    return '<a class="acct__welcome" href="/profile"><strong>' + name + '</strong><small>إدارة الحساب</small></a>' +
      '<ul><li><a href="/profile">الملف الشخصي والطلبات</a></li><li><a href="/shop?wishlist=1">المفضلة</a></li><li><a href="/cart">سلة التسوق</a></li>' +
      roleLink + '</ul><button type="button" class="link-btn acct__logout" data-account-logout>تسجيل الخروج</button>';
  }

  function buildHeader() {
    const P = new URLSearchParams(location.search);
    const catOpts = '<option value="">الكل</option>' + Products.categories.map((c) =>
      '<option value="' + c.id + '"' + (P.get('cat') === c.id ? ' selected' : '') + '>' + c.name + '</option>').join('');
    const city = loc.get();

    return '<div class="header-bar container">' +
      '<button type="button" class="icon-btn header__menu-btn" data-menu-open aria-expanded="false" aria-controls="side-menu" aria-label="فتح القائمة">' + icon('menu') + '</button>' +
      '<a class="logo notranslate" translate="no" href="/" aria-label="' + esc(CFG.name) + ' — الصفحة الرئيسية">' + esc(CFG.name) + '<span class="logo__dot" aria-hidden="true"></span></a>' +
      '<button type="button" class="loc" data-loc-open aria-haspopup="dialog">' + icon('pin') +
        '<span class="loc__text"><small>التوصيل إلى</small><strong data-loc-label>' + esc(city || 'تحديث الموقع') + '</strong></span></button>' +
      '<form class="search" role="search" action="/shop" method="get">' +
        '<label class="sr-only" for="header-search">ابحث في المتجر</label>' +
        '<select class="search__cat" name="cat" aria-label="البحث في فئة">' + catOpts + '</select>' +
        '<input class="search__input" id="header-search" type="search" name="q" value="' + esc(P.get('q') || '') + '" placeholder="ابحث عن منتج، لون، فئة…" autocomplete="off">' +
        '<button class="search__btn" type="submit" aria-label="بحث">' + icon('search') + '</button></form>' +
      '<div class="header-actions">' +
                '<div class="acct">' +
          '<a class="acct__trigger" href="/profile" aria-label="تسجيل الدخول والحساب">' + icon('user', 'acct__icon') +
            '<span class="acct__text"><small>' + (currentAccount() ? 'مرحباً بعودتك' : 'أهلاً، سجّل الدخول') + '</small><strong>' + (currentAccount() ? esc(currentAccount().name || 'حسابي') : 'الحساب والمفضلة') + '</strong></span></a>' +
          '<div class="acct__menu">' + accountLinks() + '</div>' +
        '</div>' +
        '<a class="icon-btn header__wish" href="/shop?wishlist=1" aria-label="المفضلة">' + icon('heart') + '<span class="count-badge" data-wish-count hidden>0</span></a>' +
        '<button type="button" class="cart-btn" data-cart-open aria-label="السلة">' +
          '<span class="cart-btn__icon">' + icon('bag') + '<span class="count-badge" data-cart-count hidden>0</span></span>' +
          '<span class="cart-btn__label">السلة</span></button>' +
      '</div>' +
    '</div>';
  }

  /* ---------- الشريط السفلي (موبايل): الرئيسية · حسابي · السلة · القائمة ---------- */
  const TAB_PAGES = ['home', 'shop', 'product', 'store', 'cart', 'profile'];
  function hasTabbar() { return TAB_PAGES.indexOf(document.body.dataset.page || '') > -1; }
  function buildTabbar() {
    const page = document.body.dataset.page || '';
    const acct = currentAccount();
    const it = (on, tag, attrs, ico, label, badge) =>
      '<' + tag + ' class="tabbar__item' + (on ? ' is-on' : '') + '" ' + attrs + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="tabbar__ico">' + icon(ico) + (badge || '') + '</span><span>' + label + '</span></' + tag + '>';
    return '<nav class="tabbar" aria-label="التنقل السفلي">' +
      it(page === 'home', 'a', 'href="/"', 'home', 'الرئيسية') +
      it(page === 'profile', 'a', 'href="' + (acct ? '/profile' : '/auth') + '"', 'user', acct ? 'حسابي' : 'دخول') +
      (page === 'cart'
        ? it(true, 'a', 'href="/cart"', 'bag', 'السلة', '<span class="count-badge" data-cart-count hidden>0</span>')
        : it(false, 'button', 'type="button" data-cart-open', 'bag', 'السلة', '<span class="count-badge" data-cart-count hidden>0</span>')) +
      it(false, 'button', 'type="button" data-menu-open aria-haspopup="dialog" aria-controls="side-menu"', 'menu', 'القائمة') +
    '</nav>';
  }

  /* ---------- شريط التصنيفات تحت الهيدر (يمرّ تحت الهيدر الثابت عند التمرير) ---------- */
  function buildSubnav() {
    const page = document.body.dataset.page || '';
    const P = new URLSearchParams(location.search);
    const shop = page === 'shop';
    const bare = !P.get('cat') && !P.get('sale') && !P.get('q') && !P.get('wishlist') && P.get('sort') !== 'new';
    const links = [
      { label: 'عروض اليوم', href: '/shop?sale=1', on: shop && P.get('sale') === '1' && !P.get('cat') },
      { label: 'الكوبونات', href: '/#coupons', on: false },
      { label: 'وصل حديثاً', href: '/shop?sort=new', on: shop && P.get('sort') === 'new' && !P.get('cat') },
      { label: 'كل المنتجات', href: '/shop', on: shop && bare }
    ].concat(Products.categories.map((c) => ({ label: c.name, href: '/shop?cat=' + c.id, on: shop && P.get('cat') === c.id })))
     .concat([{ label: 'بيع معنا', href: '/seller', on: page === 'become-seller' }]);

    const nav = links.map((l) => '<a href="' + l.href + '"' + (l.on ? ' aria-current="page"' : '') + '>' + l.label + '</a>').join('');
    return '<div class="subnav"><div class="subnav__inner container">' +
      '<button type="button" class="subnav__all" data-menu-open aria-expanded="false" aria-controls="side-menu">' + icon('menu') + 'الكل</button>' +
      '<button type="button" class="subnav__loc" data-loc-open aria-haspopup="dialog">' + icon('pin') + '<span data-loc-label>' + esc(loc.get() || 'تحديث الموقع') + '</span></button>' +
      '<nav class="subnav__links" aria-label="التنقل الرئيسي">' + nav + '</nav>' +
      '<ul class="subnav__perks" aria-label="مزايا المتجر">' +
        '<li>' + icon('truck') + 'شحن مجاني فوق ' + money(CFG.freeShippingFrom) + '</li>' +
        '<li>' + icon('refresh') + 'إرجاع مجاني</li>' +
        '<li>' + icon('cash') + 'الدفع عند الاستلام</li></ul>' +
    '</div></div>';
  }

  /* عمليات بحث شائعة: أول كلمة من أشهر المنتجات */
  function buildSuggest() {
    const top = Products.all().sort((a, b) => b.rating * Math.log(b.reviews + 1) - a.rating * Math.log(a.reviews + 1)).slice(0, 10);
    const words = top.map((p) => p.name.split(' ')[0]).filter((w, i, a) => a.indexOf(w) === i);
    return '<nav class="suggest-strip" aria-label="عمليات بحث شائعة"><div class="container suggest-strip__inner"><span>الأكثر بحثاً</span>' +
      words.map((w) => '<a href="/shop?q=' + encodeURIComponent(w) + '">' + esc(w) + '</a>').join('') + '</div></nav>';
  }

  /* ---------- القائمة الجانبية (زر «الكل») ---------- */
  function buildSideMenu() {
    const li = (href, label) => '<li><a href="' + href + '">' + label + '</a></li>';
    const account = currentAccount();
    const accountTitle = account ? esc(account.name || account.email || 'حسابي') : 'أهلاً، سجّل الدخول';
    const roleItems = account && account.role === 'admin' ? li('/admin', 'لوحة الإدارة') :
      account && account.role === 'support' ? li('/support', 'لوحة الدعم') :
      account && account.role === 'seller' ? li('/seller', 'لوحة البائع') :
      account && account.role === 'rider' ? li('/rider', 'لوحة المندوب') :
      li('/become-seller', 'بيع منتجاتك معنا') + li('/become-rider', 'انضم كمندوب توصيل');
    return '<aside class="sidenav" id="side-menu" role="dialog" aria-modal="true" aria-labelledby="side-title" aria-hidden="true">' +
      '<div class="sidenav__head"><a class="sidenav__user" href="' + (account ? '/profile' : '/auth') + '">' + icon('user') + '<span id="side-title">' + accountTitle + '</span></a>' +
        '<button type="button" class="icon-btn" data-panel-close aria-label="إغلاق القائمة">' + icon('close') + '</button></div>' +
      '<div class="sidenav__body">' +
        '<button type="button" class="sidenav__loc" data-loc-open>' + icon('pin') + '<span>التوصيل إلى <strong data-loc-label>' + esc(loc.get() || 'تحديث الموقع') + '</strong></span></button>' +
        '<h3>تسوّق حسب الفئة</h3><ul>' + Products.categories.map((c) => li('/shop?cat=' + c.id, c.name)).join('') + li('/shop', 'كل المنتجات') + '</ul>' +
        '<h3>عروض ومزايا</h3><ul>' + li('/shop?sale=1', 'عروض اليوم') + li('/#coupons', 'الكوبونات وأكواد الخصم') + li('/shop?sort=new', 'وصل حديثاً') + li('/shop?sort=rating', 'الأعلى تقييماً') + '</ul>' +
         '<h3>حسابك</h3><ul>' + li(account ? '/profile' : '/auth', account ? 'الملف الشخصي والطلبات' : 'تسجيل الدخول') + li('/shop?wishlist=1', 'المفضلة') + li('/cart', 'سلة التسوق') + '</ul>' +
         '<h3>' + (account ? 'مساحتك' : 'انضم إلينا') + '</h3><ul>' + roleItems + '</ul>' +
      '</div></aside>';
  }

  /* ---------- نافذة اختيار الموقع: GPS + خريطة جوجل + تفاصيل العنوان ---------- */
  function buildLocModal() {
    return '<div class="modal modal--loc" id="loc-modal" role="dialog" aria-modal="true" aria-labelledby="loc-title" aria-hidden="true">' +
      '<div class="modal__head"><h2 id="loc-title">موقع التوصيل</h2>' +
        '<button type="button" class="icon-btn" data-panel-close aria-label="إغلاق">' + icon('close') + '</button></div>' +
      '<div class="modal__body"><p>حدّد موقعك بدقة لنعرض لك مواعيد التوصيل الصحيحة ونملأ عنوان الشحن تلقائياً.</p>' +
        '<div data-geo-root></div>' +
        '<details class="geo-quick"><summary>أو اختر مدينة سريعاً</summary>' +
        '<div class="city-grid" role="radiogroup" aria-label="المدينة">' + CFG.cities.map((c) =>
          '<button type="button" class="chip city" role="radio" aria-checked="false" data-loc-city="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div></details></div>' +
      '<div class="modal__foot"><button type="button" class="btn btn--accent btn--block" data-loc-save>تأكيد الموقع</button></div>' +
    '</div>';
  }
  let geoCtl = null;
  function ensureGeo() {
    const root = $('#loc-modal [data-geo-root]');
    if (geoCtl || !root || !window.Geo) return;
    geoCtl = window.Geo.mount(root, { value: loc.details() });
  }

  function buildFooter() {
    return '<div class="container footer__grid">' +
      '<div class="footer__brand"><p class="logo">' + esc(CFG.name) + '<span class="logo__dot" aria-hidden="true"></span></p>' +
        '<p>ملابس وحقائب وإكسسوارات بتصاميم هادئة وخامات تدوم.</p></div>' +
      '<nav aria-label="روابط المتجر"><h2 class="footer__title">المتجر</h2><ul>' +
        '<li><a href="/shop">كل المنتجات</a></li>' +
        Products.categories.map((c) => '<li><a href="/shop?cat=' + c.id + '">' + c.name + '</a></li>').join('') +
        '<li><a href="/shop?sale=1">العروض</a></li></ul></nav>' +
      '<nav aria-label="انضم لينا"><h2 class="footer__title">انضم لينا</h2><ul>' +
        '<li><a href="/become-seller">بيع منتجاتك معنا</a></li>' +
        '<li><a href="/become-rider">انضم كمندوب توصيل</a></li>' +
        '<li><a href="/auth">تسجيل الدخول</a></li></ul></nav>' +
      '<div><h2 class="footer__title">الشحن والإرجاع</h2><ul class="footer__text">' +
        '<li>شحن مجاني للطلبات فوق ' + money(CFG.freeShippingFrom) + '</li>' +
        '<li>إرجاع مجاني خلال ' + CFG.returnDays + ' يوماً</li>' +
        '<li>الدفع بالبطاقة أو عند الاستلام</li></ul></div>' +
      '<div><h2 class="footer__title">تواصل معنا</h2><ul class="footer__text">' +
        '<li><a href="mailto:' + CFG.email + '" dir="ltr">' + CFG.email + '</a></li>' +
        '<li>يوميًا من 9 صباحاً حتى 9 مساءً</li></ul></div>' +
      '</div><div class="footer__legal container"><p>© ' + new Date().getFullYear() + ' ' + esc(CFG.name) + '. جميع الحقوق محفوظة.</p></div>';
  }

  /* ---------- تحديث العدّادات ---------- */
  function bump(el) {
    if (!el || reduceMotion()) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
  function updateCartCount(animate) {
    const n = Cart.count();
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
      if (animate) bump(el);
    });
    const btn = $('[data-cart-open]');
    if (btn) btn.setAttribute('aria-label', 'السلة، ' + n + ' منتج');
  }
  function updateWishCount() {
    const n = Wishlist.count();
    $$('[data-wish-count]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
    $$('[data-wish]').forEach((b) => {
      const on = Wishlist.has(b.dataset.wish);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  /* حفظ موقع التوصيل كخطوة واحدة مترابطة: نجيب الإحداثيات (لو مدينة بس نحوّلها لإحداثيات)،
     نحفظها في السيرفر (لو مسجّل دخول) وعلى الجهاز، وبعدين نحدّث الصفحة عشان المتاجر القريبة
     تظهر فوراً — بدون ما المستخدم يحدّد موقعه تاني في أي مكان. */
  function commitLocation(v) {
    const BL = window.BuyerLocation;
    const before = BL && BL.get ? BL.get() : null;
    const label = v.city || v.area || (v.formatted ? BL.shortLabel(v.formatted) : '') || 'موقعك المحدّد';
    const coords = v.lat != null && v.lng != null
      ? Promise.resolve(v)
      : (window.Geo && window.Geo.search
        ? window.Geo.search([v.area, v.city, 'مصر'].filter(Boolean).join('، ')).then((r) => (r && r[0] ? Object.assign({}, v, r[0]) : null)).catch(() => null)
        : Promise.resolve(null));
    return coords.then((c) => {
      if (!c || c.lat == null || c.lng == null || !BL) { loc.setDetails(v); return label; }
      return BL.save({ lat: c.lat, lng: c.lng, address: c.formatted || v.formatted, placeId: c.placeId || v.placeId, details: Object.assign({}, c, v) }).then(() => {
        const moved = !before || Math.abs(before.lat - c.lat) > 1e-5 || Math.abs(before.lng - c.lng) > 1e-5;
        if (moved) setTimeout(() => location.reload(), 700);
        return label;
      });
    });
  }

  /* ---------- الأحداث المفوّضة ---------- */
  function bindEvents() {
    document.addEventListener('click', (e) => {
      const t = e.target;

      if (t.closest('[data-cart-open]')) { openCart(); return; }
      if (t.closest('[data-panel-close]') || t === overlay) { closePanel(); return; }
      if (t.closest('[data-menu-open]')) { openPanel($('#side-menu')); return; }
      if (t.closest('[data-account-logout]')) {
        e.preventDefault();
        const finish = () => { if (window.NasaqCloud) window.NasaqCloud.clearSession(); location.href = '/'; };
        if (window.NasaqCloud) window.NasaqCloud.request('/auth/logout', null, 'POST').then(finish).catch(finish);
        else finish();
        return;
      }
      if (t.closest('[data-loc-open]')) { ensureGeo(); openPanel($('#loc-modal')); return; }
      if (t.closest('[data-loc-save]')) {
        const v = geoCtl ? geoCtl.getValue() : null;
        if (!v || !(v.city || v.area || v.lat != null)) { toast('حدّد موقعك على الخريطة أو اكتب مدينتك أولاً', { type: 'error' }); return; }
        const btn = t.closest('[data-loc-save]');
        btn.disabled = true;
        commitLocation(v).then((label) => {
          closePanel();
          toast('سيصلك طلبك إلى ' + label, { duration: 2600 });
        }).catch((err) => {
          toast(err && err.message ? err.message : 'تعذّر حفظ الموقع، حاول مرة أخرى.', { type: 'error' });
        }).then(() => { btn.disabled = false; });
        return;
      }
      /* نقرة على إعلان: تُحتسب للحملة */
      const adEl = t.closest('[data-ad]');
      if (adEl && t.closest('a') && window.Market) window.Market.ads.click(adEl.dataset.ad);
      if (t.closest('[data-car-dir]')) { scrollCarousel(t.closest('[data-car-dir]')); return; }

      /* اختيار المدينة */
      const city = t.closest('[data-loc-city]');
      if (city) {
        const name = city.dataset.locCity;
        commitLocation({ city: name }).then((label) => {
          closePanel();
          toast('سيصلك طلبك إلى ' + label, { duration: 2600 });
        }).catch((err) => {
          toast(err && err.message ? err.message : 'تعذّر حفظ الموقع، حاول مرة أخرى.', { type: 'error' });
        });
        return;
      }

      /* إضافة سريعة من البطاقة */
      const q = t.closest('[data-quick-add]');
      if (q) {
        const p = Products.byId(q.dataset.quickAdd);
        const r = Cart.add(p.id, { size: q.dataset.size || null, color: p.colors[0].name, qty: 1 });
        if (r.ok) {
          toast('أُضيف «' + p.name + '» إلى السلة', { action: { label: 'عرض السلة', onClick: openCart } });
          announce('أُضيف ' + p.name + ' إلى السلة');
          updateCartCount(true);
        } else toast(r.message, { type: 'error' });
        return;
      }

      /* قائمة الأمنيات */
      const w = t.closest('[data-wish]');
      if (w) {
        const p = Products.byId(w.dataset.wish);
        const added = Wishlist.toggle(p.id);
        toast(added ? 'أُضيف «' + p.name + '» إلى المفضلة' : 'أُزيل «' + p.name + '» من المفضلة', { duration: 2600 });
        return;
      }

      /* تعديل بنود السلة (الدرج + صفحة السلة) */
      const a = t.closest('[data-cart-action]');
      if (a) {
        const key = a.dataset.key, action = a.dataset.cartAction;
        const line = Cart.lines().find((l) => l.key === key);
        if (!line) return;
        if (action === 'remove') {
          Cart.remove(key);
          announce('تم حذف ' + line.product.name + ' من السلة');
          const focusTarget = $('[data-focus-after-remove]') || $('#drawer-title');
          if (focusTarget) focusTarget.focus();
        } else {
          const r = Cart.setQty(key, line.qty + (action === 'inc' ? 1 : -1));
          if (!r.ok && r.message) toast(r.message, { type: 'error' });
          const again = $('[data-cart-action="' + action + '"][data-key="' + key.replace(/"/g, '\\"') + '"]');
          if (again && !again.disabled) again.focus();
        }
        return;
      }

      if (t.closest('[data-coupon-remove]')) { Cart.removeCoupon(); return; }
    });

    /* الكوبون */
    document.addEventListener('submit', (e) => {
      const f = e.target.closest && e.target.closest('[data-coupon-form]');
      if (!f) return;
      e.preventDefault();
      const input = $('input', f), msg = $('[data-coupon-msg]', f);
      const r = Cart.applyCoupon(input.value);
      if (r.ok) toast(r.message);
      else {
        msg.textContent = r.message;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (activePanel) closePanel();
      }
      trapFocus(e);
    });

    Cart.subscribe(() => { updateCartCount(false); renderDrawer(); });
    Wishlist.subscribe(updateWishCount);
    document.addEventListener('location:change', updateLocLabels);
    document.addEventListener('keydown', (e) => {
      /* مجموعة المدن بلوحة المفاتيح */
      if (!e.target.closest || !e.target.closest('.city-grid')) return;
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const all = $$('[data-loc-city]', e.target.closest('.city-grid'));
      const i = all.indexOf(document.activeElement);
      const dir = (e.key === 'ArrowLeft' || e.key === 'ArrowDown') ? 1 : -1;
      all[(i + dir + all.length) % all.length].focus();
    });
  }

  /* ---------- التهيئة ---------- */
  function init() {
    document.body.insertAdjacentHTML('afterbegin',
      sprite() + '<a class="skip-link" href="#main">تخطّي إلى المحتوى</a>');

    const header = $('#site-header');
    if (header) {
      header.innerHTML = buildHeader();
      const page = document.body.dataset.page;
      header.insertAdjacentHTML('afterend', buildSubnav() + (page === 'home' || page === 'shop' ? buildSuggest() : ''));
    }
    const footer = $('#site-footer');
    if (footer) footer.innerHTML = buildFooter();

    document.body.insertAdjacentHTML('beforeend',
      '<div class="overlay" data-overlay></div>' +
      (hasTabbar() ? buildTabbar() : '') +
      buildSideMenu() + buildLocModal() + (window.I18n ? window.I18n.modalHTML(icon) : '') +
      '<aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true">' +
        '<div class="drawer__head"><h2 id="drawer-title" tabindex="-1">سلة التسوق <span data-drawer-count></span></h2>' +
        '<button type="button" class="icon-btn" data-panel-close aria-label="إغلاق السلة">' + icon('close') + '</button></div>' +
        '<div class="drawer__body" data-drawer-body></div><div class="drawer__foot" data-drawer-foot></div></aside>' +
      '<div class="toasts" id="toasts" aria-live="polite" aria-atomic="false"></div>' +
      '<div class="sr-only" id="live" aria-live="polite" aria-atomic="true"></div>');

    if (hasTabbar()) document.body.classList.add('has-tabbar');
    drawer = $('#cart-drawer');
    overlay = $('[data-overlay]');
    toastBox = $('#toasts');
    liveBox = $('#live');

    bindEvents();
    renderDrawer();
    updateCartCount(false);
    updateWishCount();
    updateLocLabels();
    initCarousels();
    setInterval(tickCountdowns, 1000);
    if (window.I18n) window.I18n.boot();
  }

  window.UI = {
    icon, card, cards, skeletonCards, load, emptyHTML, priceHTML, ratingHTML, badgesHTML, wishBtn,
    distanceHTML, locationBannerHTML, bindLocationBanner,
    lineHTML, miniLineHTML, summaryHTML, shipProgressHTML,
    pcard, tile, tileCard, carousel, initCarousels, countdownHTML, loc, recent, sponsor, adSlide, adBanner, safeHref, safeImg,
    toast, announce, openCart, closeCart, openPanel, closePanel, updateCartCount, reduceMotion, $, $$
  };

  init();   // السكربتات defer، أي أن DOM جاهز عند التنفيذ
})();
