/* ==========================================================================
   js/home.js — الرئيسية: شريط اللافتات، بطاقات البلاطات، الكاروسيل، وصل حديثاً، الكوبونات، النشرة
   كل الأرقام (نسب الخصم، عدد المنتجات، الميزانيات) تُحسب من بيانات المنتجات، لا أرقام ثابتة.
   ========================================================================== */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'home') return;

  const esc = window.Store.esc;
  const money = window.Store.money;
  const CFG = window.Store.config;
  const all = Products.all();
  const $ = (id) => document.getElementById(id);

  const inStock = (p) => !Products.isSoldOut(p);
  const byFeatured = (a, b) => b.rating * Math.log(b.reviews + 1) - a.rating * Math.log(a.reviews + 1);
  const pctOf = Products.discountPct;
  const spIds = window.Market ? window.Market.ads.sponsoredIds() : new Set();
  const sponsoredFirst = (a, b) => (spIds.has(b.id) ? 1 : 0) - (spIds.has(a.id) ? 1 : 0);
  const discounted = all.filter((p) => pctOf(p) > 0 && inStock(p)).sort((a, b) => pctOf(b) - pctOf(a));
  const maxDiscount = discounted.length ? pctOf(discounted[0]) : 0;
  const newest = all.filter((p) => p.isNew && inStock(p)).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  const count = (n) => (n === 1 ? 'منتج واحد' : n === 2 ? 'منتجان' : n <= 10 ? n + ' منتجات' : n + ' منتجاً');
  const img = (p, i, size) => Products.imgAttrs(p, i || 0, 0, size || 'sm');
  const ofCat = (cat) => all.filter((p) => p.category === cat && inStock(p)).slice(0, 2);

  /* ---------- 1) شريط اللافتات ---------- */
  function art(list) {
    return '<div class="promo-card__art" aria-hidden="true">' +
      list.slice(0, 2).map((p) => '<img' + img(p, 0, 'md') + ' alt="" width="480" height="600" loading="lazy" decoding="async">').join('') + '</div>';
  }
  function slide(o) {
    return '<article class="promo-card promo-card--' + o.tone + '">' +
      '<h3>' + esc(o.title) + '</h3><p>' + esc(o.text) + '</p>' +
      '<a class="btn ' + (o.btn || 'btn--light') + ' btn--sm promo-card__cta" href="' + o.href + '">' + esc(o.cta) + '</a>' +
      art(o.products) + '</article>';
  }

  function heroSlides() {
    const perk = (ic, t) => '<div class="perk"><span class="perk__ic">' + UI.icon(ic) + '</span>' + t + '</div>';
    const brand = '<article class="promo-card promo-card--accent">' +
      '<h3>أناقة هادئة،<br>لكل يوم</h3>' +
      '<p>قطع مختارة بخامات تدوم موسماً بعد موسم.</p>' +
      '<div class="perk-grid">' +
        perk('truck', 'شحن مجاني<small>فوق ' + money(CFG.freeShippingFrom) + '</small>') +
        perk('refresh', 'إرجاع مجاني<small>خلال ' + CFG.returnDays + ' يوماً</small>') +
        perk('cash', 'الدفع عند<small>الاستلام</small>') +
        perk('shield', 'دفع آمن<small>لبياناتك</small>') +
      '</div>' +
      '<a class="btn btn--light btn--sm promo-card__cta" href="/shop">تسوّق المجموعة</a></article>';

    /* لافتات المعلنين (حملات «لافتة الصفحة الرئيسية») تظهر بعد لافتة المتجر مباشرة */
    const adCards = window.Market ? window.Market.ads.active('hero').map((c) => { window.Market.ads.impression(c.id); return UI.adSlide(c); }) : [];
    const cards = [brand].concat(adCards);
    if (newest.length) cards.push(slide({ tone: 'soft', title: 'وصل حديثاً', text: 'قطع جديدة هذا الأسبوع بخامات وتصاميم هادئة.', cta: 'تسوّق الجديد', href: '/shop?sort=new', products: newest, btn: 'btn--primary' }));
    if (discounted.length) cards.push(slide({ tone: 'ink', title: 'عروض لفترة محدودة', text: 'خصم حتى ' + maxDiscount + '% على قطع مختارة.', cta: 'شاهد العروض', href: '/daily-offers', products: discounted }));
    if (ofCat('bags').length) cards.push(slide({ tone: 'mid', title: 'حقائب ومحافظ جلد', text: 'جلد طبيعي يزداد جمالاً مع الاستخدام.', cta: 'تسوّق الحقائب', href: '/shop?cat=bags', products: ofCat('bags'), btn: 'btn--primary' }));
    if (ofCat('accessories').length) cards.push(slide({ tone: 'plain', title: 'إكسسوارات تكمل إطلالتك', text: 'ساعات ونظارات وأوشحة بلمسة بسيطة.', cta: 'تسوّق الإكسسوارات', href: '/shop?cat=accessories', products: ofCat('accessories'), btn: 'btn--primary' }));
    if (ofCat('clothes').length) cards.push(slide({ tone: 'deep', title: 'ملابس لكل يوم', text: 'هودي وجاكيت وتيشيرتات بقصّات مريحة.', cta: 'تسوّق الملابس', href: '/shop?cat=clothes', products: ofCat('clothes') }));
    return cards;
  }

  const railRoot = $('hero-rail-root');
  if (railRoot) {
    railRoot.innerHTML = UI.carousel({ id: 'hero-rail', rail: true, title: 'لافتات وعروض المتجر', items: heroSlides() });
  }

  /* موقع المشتري غير معروف: نعرض شريطاً واضحاً بدل ما نعرض متاجر خارج نطاق 50 كم أو
     نخفي المنتجات القريبة الحقيقية بصمت. يظهر أعلى الصفحة، فوق كل الأقسام. */
  if (!Products.locationKnown() && railRoot) {
    const bannerRoot = document.createElement('div');
    bannerRoot.className = 'container';
    bannerRoot.innerHTML = UI.locationBannerHTML();
    railRoot.insertAdjacentElement('afterend', bannerRoot);
    UI.bindLocationBanner(bannerRoot);
  }

  /* ---------- 2) بطاقات البلاطات: الصف الأول ---------- */
  const row1 = [];

  /* أقسام فيها منتجات فعلاً فقط (لا أقسام فاضية ولا بطاقات بلا صور) */
  const catTiles = Products.categories.map((c) => ({ c, list: all.filter((p) => p.category === c.id) })).filter((x) => x.list.length).slice(0, 4);
  if (catTiles.length) {
    row1.push(UI.tileCard({
      id: 'tc-cats', title: 'تسوّق حسب الفئة', href: '/shop',
      tiles: catTiles.map(({ c, list }) => {
        const cover = list.find(inStock) || list[0];
        return UI.tile({ href: '/categories/' + c.id, img: img(cover), label: esc(c.name), sub: count(list.length) });
      })
    }));
  }

  if (discounted.length) {
    const dealTones = ['', 'deep', 'mid', 'ink'];
    const tiles = [UI.tile({ href: '/daily-offers', big: 'حتى ' + maxDiscount + '%', small: 'خصم', label: 'كل العروض', tone: dealTones[0] })];
    Products.categories.forEach((c) => {
      const d = discounted.filter((p) => p.category === c.id);
      if (d.length && tiles.length < 4) {
        tiles.push(UI.tile({ href: '/shop?cat=' + c.id + '&sale=1', big: 'حتى ' + pctOf(d[0]) + '%', small: 'خصم', label: esc(c.name), tone: dealTones[tiles.length] }));
      }
    });
    row1.push(UI.tileCard({ id: 'tc-deals', title: 'خصومات حسب الفئة', href: '/daily-offers', tiles: tiles }));
  }

  row1.push(UI.tileCard({
    id: 'tc-join', cls: 'tcard--join', title: 'تسوّق بثقة من نَسَق',
    body: '<p>أنشئ حسابك لإدارة طلباتك ومشترياتك في مكان واحد.</p>' +
      '<a class="btn btn--light btn--sm" href="/auth?tab=signup">أنشئ حسابك</a>' +
      '<div class="mini-perks">' +
        '<span class="mini-perk">' + UI.icon('truck') + 'شحن مجاني فوق ' + money(CFG.freeShippingFrom) + '</span>' +
        '<span class="mini-perk">' + UI.icon('refresh') + 'إرجاع خلال ' + CFG.returnDays + ' يوماً</span>' +
        '<span class="mini-perk">' + UI.icon('cash') + 'الدفع عند الاستلام</span>' +
        '<span class="mini-perk">' + UI.icon('shield') + 'دفع آمن</span>' +
      '</div>'
  }));

  if (discounted.length) {
    row1.push(UI.tileCard({
      id: 'tc-today', title: 'عروض اليوم', href: '/shop?sale=1',
      tiles: discounted.slice(0, 4).map((p) => UI.tile({
        href: Products.url(p), img: img(p), label: esc(p.name),
        sub: '<span class="pill-sale">−' + pctOf(p) + '%</span> ينتهي خلال ' + UI.countdownHTML()
      }))
    }));
  }
  const t1 = $('tiles-1');
  if (t1) t1.innerHTML = row1.join('');

  /* ---------- 3) الصف الثاني ---------- */
  const row2 = [];
  const budgetTones = ['', 'mid', 'deep', 'ink'];
  const budgets = [200, 400, 700, 1000].filter((m) => all.some((p) => p.price <= m));
  if (budgets.length) {
    row2.push(UI.tileCard({
      id: 'tc-budget', title: 'تسوّق حسب الميزانية', href: '/shop',
      tiles: budgets.map((m, i) => UI.tile({
        href: '/shop?max=' + m, big: m, small: 'ج.م فأقل', tone: budgetTones[i], label: 'أقل من ' + m + ' ج.م', sub: count(all.filter((p) => p.price <= m).length)
      }))
    }));
  }

  const topRated = all.filter(inStock).sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews)).slice(0, 4);
  if (topRated.length) {
    row2.push(UI.tileCard({
      id: 'tc-top', title: 'الأعلى تقييماً', href: '/shop?sort=rating',
      tiles: topRated.map((p) => UI.tile({
        href: Products.url(p), img: img(p), label: esc(p.name), sub: p.reviews ? '<svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" focusable="false" style="vertical-align:-1px;margin-inline-end:3px;color:var(--c-star,#f5a524)"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>' + p.rating.toFixed(1) + ' (' + p.reviews + ' تقييم)' : 'جديد على نَسَق'
      }))
    }));
  }

  const couponRows = Object.keys(Cart.coupons).map((code) =>
    '<div class="coupon-row"><span><a class="coupon-row__code" dir="ltr" href="/coupons/' + encodeURIComponent(code) + '">' + esc(code) + '</a><span class="coupon-row__desc">' + esc(Cart.coupons[code].label) + '</span></span>' +
    '<button type="button" class="coupon-row__copy" data-code="' + esc(code) + '" aria-label="انسخ كود الخصم ' + esc(code) + '">' + UI.icon('copy') + '</button></div>').join('');
  row2.push(UI.tileCard({
    id: 'coupons', cls: 'tcard--ink tcard--wide', title: 'أكواد الخصم', href: '/coupons',
    body: '<p>انسخ الكود واستخدمه عند إتمام الطلب. أكواد الخصم تُطبَّق فوق أسعار العروض.</p><div class="coupon-list">' + couponRows + '</div>'
  }));
  const t2 = $('tiles-2');
  if (t2) t2.innerHTML = row2.join('');

  /* ---------- 4) كاروسيلات المنتجات ---------- */
  /* سكيلتون على شكل بطاقات (نفس نظام #new-grid) يظهر لحظياً في كل قسم قبل
     أن يُستبدل بالكاروسيل الحقيقي — على الكمبيوتر فقط، بدون أي تأثير على الموبايل. */
  const railSkeleton = (n) => {
    let items = '';
    for (let i = 0; i < n; i++) {
      items += '<div class="car__item"><div class="card card--skeleton" aria-hidden="true">' +
        '<div class="card__media skeleton"></div>' +
        '<div class="skeleton skeleton--line"></div><div class="skeleton skeleton--line skeleton--short"></div>' +
      '</div></div>';
    }
    return '<div class="car car--rail car--skeleton" aria-hidden="true"><div class="car__wrap"><div class="car__track">' + items + '</div></div></div>';
  };

  const moreRoot = $('more-root');
  if (moreRoot && !all.length && Products.locationKnown()) {
    moreRoot.innerHTML = UI.emptyHTML({ icon: 'store', title: 'لا توجد منتجات قريبة منك بعد', text: 'لم يضف أي متجر منتجات ضمن ' + Products.radiusKm + ' كم من موقعك حتى الآن. جرّب تغيير موقعك أو عد لاحقاً.', actions: [{ label: 'تغيير الموقع', attr: 'data-loc-open' }] });
  } else if (moreRoot && all.length) {
    UI.load(moreRoot, {
      count: 4, skeleton: railSkeleton(4),
      render: () => UI.carousel({ id: 'car-more', title: 'منتجات قد تهمّك', href: '/shop', items: all.slice().sort(byFeatured).sort(sponsoredFirst).map(UI.pcard) })
    }).then(() => UI.initCarousels(moreRoot));
  }
  const dealsRoot = $('deals-root');
  if (dealsRoot && discounted.length) {
    UI.load(dealsRoot, {
      count: 4, skeleton: railSkeleton(4),
      render: () => UI.carousel({ id: 'car-deals', title: 'عروض لفترة محدودة', href: '/daily-offers', more: 'عرض الكل', items: discounted.map(UI.pcard) })
    }).then(() => UI.initCarousels(dealsRoot));
  }
  const recentRoot = $('recent-root');
  const seen = UI.recent.list();
  if (recentRoot && seen.length) {
    recentRoot.hidden = false;
    UI.load(recentRoot, {
      count: Math.min(4, seen.length), skeleton: railSkeleton(Math.min(4, seen.length)),
      render: () => UI.carousel({ id: 'car-recent', title: 'شاهدتها مؤخراً', items: seen.map(UI.pcard) })
    }).then(() => UI.initCarousels(recentRoot));
  }
  UI.initCarousels();

  /* ---------- 5) وصل حديثاً (شبكة) ---------- */
  const newGrid = $('new-grid');
  if (newGrid) {
    UI.load(newGrid, {
      count: 4,
      render: () => UI.cards(all.filter((p) => p.isNew).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)).slice(0, 4))
    });
  }

  /* ---------- 6) نسخ أكواد الخصم ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-code]');
    if (!b) return;
    const code = b.dataset.code;
    const done = () => UI.toast('تم نسخ الكود ' + code, { duration: 2600 });
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
    else done();
  });

  /* ---------- 7) النشرة البريدية ---------- */
  const form = $('newsletter-form');
  if (form) {
    const input = form.querySelector('input');
    const err = form.querySelector('.field__error');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (!ok) {
        err.textContent = 'أدخل بريداً إلكترونياً صحيحاً، مثل name@example.com';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      err.textContent = '';
      input.removeAttribute('aria-invalid');
      input.value = '';
      UI.toast('تم اشتراكك بنجاح، سنراسلك بأحدث القطع');
      /* اربط هذا الجزء بخدمة البريد (Mailchimp/Resend…) عند الإطلاق */
    });
  }
})();
