/* ==========================================================================
   js/collection-page.js — صفحات التجميعات (كلها بتتخدم من pages/collection.html):

     /coupons                         كل أكواد الخصم
     /coupons/<الكود>                 صفحة كوبون واحد (نسخ + تطبيق على السلة)
     /campaigns                       الحملات الإعلانية النشطة
     /campaigns/<الحملة>              صفحة حملة
     /bestsellers                     الأكثر مبيعاً
     /daily-offers                    عروض اليوم (بعدّاد لنهاية اليوم)
     /categories                      كل الأقسام
     /categories/<القسم>              منتجات قسم + متاجره
     /categories/<القسم>/<المتجر>     منتجات متجر معيّن داخل القسم

   صفحة المنتج نفسها (…/<المتجر>/<المنتج>) بتتخدم من pages/product.html عبر product-page.js.
   ========================================================================== */
(function () {
  'use strict';
  const root = document.getElementById('collection-root');
  if (!root) return;

  const CFG = window.Store.config;
  const esc = window.Store.esc;
  const dec = (x) => { try { return decodeURIComponent(x); } catch (_) { return x; } };
  const seg = location.pathname.split('/').filter(Boolean).map(dec);
  const kind = seg[0] || '';
  const enc = encodeURIComponent;
  let timer = null;

  /* ---------- هيكل مشترك ---------- */
  function head(crumbs, title, sub, extra) {
    const li = crumbs.map((c, i) => '<li>' + (i < crumbs.length - 1 && c.href
      ? '<a href="' + esc(c.href) + '">' + esc(c.label) + '</a>'
      : '<span aria-current="page">' + esc(c.label) + '</span>') + '</li>').join('');
    return '<div class="col-head"><nav class="breadcrumb" aria-label="مسار التنقل"><ol><li><a href="/">الرئيسية</a></li>' + li + '</ol></nav>' +
      '<h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + (extra || '') + '</div>';
  }
  function setTitle(t) { document.title = t + ' | ' + CFG.name; }
  function render(html) { root.innerHTML = html; root.setAttribute('aria-busy', 'false'); }
  function notFound(title, text, back) {
    setTitle(title);
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
    render(UI.emptyHTML({ icon: 'search', title, text, actions: [{ label: back.label, href: back.href, primary: true }, { label: 'الرئيسية', href: '/' }] }));
  }

  /* شبكة منتجات: كل لينك /product/... جوه الكروت بيتحوّل للرابط الخاص بالسياق (لو مفيش حملة) */
  function productsGrid(list, ctxKind, emptyOpts) {
    if (!Products.locationKnown()) return '<div>' + UI.locationBannerHTML() + '</div>';
    if (!list.length) return UI.emptyHTML(emptyOpts || { icon: 'box', title: 'لا توجد منتجات هنا حالياً', text: 'جرّب تصفّح باقي المتجر.', actions: [{ label: 'تصفّح كل المنتجات', href: '/shop', primary: true }] });
    return '<div class="grid grid--4 col-grid" data-ctx="' + esc(ctxKind || '') + '">' + UI.cards(list) + '</div>';
  }
  function afterRender() {
    if (!Products.locationKnown()) { try { UI.bindLocationBanner(root); } catch (_) { /* تجاهل */ } }
    root.querySelectorAll('[data-ctx]').forEach((g) => {
      const k = g.getAttribute('data-ctx'); if (!k) return;
      g.querySelectorAll('[data-id]').forEach((el) => {
        const p = Products.byId(el.getAttribute('data-id')); if (!p) return;
        el.querySelectorAll('a[href^="/product/"]').forEach((a) => a.setAttribute('href', Products.ctxUrl(k, p)));
      });
    });
    try { if (window.I18n && window.I18n.translateDom) window.I18n.translateDom(root); } catch (_) { /* تجاهل */ }
  }

  /* ---------- الكوبونات ---------- */
  function couponStoreName(c) {
    if (!c.storeId) return '';
    try { const p = Products.all().find((x) => x.storeId === c.storeId); return (p && p.seller && p.seller.name) || ''; } catch (_) { return ''; }
  }
  const couponDesc = (c) => (c.label || '') + (c.min ? ' — للطلبات من ' + window.Store.money(c.min) : '') +
    (c.storeId ? ' — خاص بمنتجات ' + (couponStoreName(c) || 'متجر معيّن') : '');
  function couponCodeFromUrl() { return String(seg[1] || '').trim().toUpperCase(); }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise((ok, no) => {
      try { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); r ? ok() : no(); } catch (e) { no(e); }
    });
  }

  function couponsPage() {
    const all = window.Cart ? window.Cart.coupons : {};
    const codes = Object.keys(all);
    if (seg[1]) {
      const code = couponCodeFromUrl(), def = all[code];
      if (!def) return notFound('الكوبون غير موجود', 'الكود «' + seg[1] + '» غير صحيح أو انتهت صلاحيته.', { label: 'كل الكوبونات', href: '/coupons' });
      setTitle('كوبون ' + code);
      render(head([{ label: 'الكوبونات', href: '/coupons' }, { label: code }], 'كوبون خصم ' + code, def.label) +
        '<section class="ticket" aria-label="كوبون ' + esc(code) + '">' +
          '<div class="ticket__code" dir="ltr">' + esc(code) + '</div>' +
          '<p class="ticket__desc">' + esc(couponDesc(def)) + '</p>' +
          '<div class="ticket__actions"><button type="button" class="btn btn--ghost" data-copy="' + esc(code) + '">' + UI.icon('copy') + 'نسخ الكود</button>' +
          '<button type="button" class="btn btn--primary" data-apply="' + esc(code) + '">طبّق على سلتي</button>' +
          '<a class="btn btn--ghost" href="/shop">تابع التسوّق</a></div>' +
          '<p class="ticket__msg" data-msg aria-live="polite"></p></section>' +
        '<p style="margin-block:var(--sp-5) var(--sp-8)"><a href="/coupons">← كل الكوبونات</a></p>');
      return;
    }
    setTitle('أكواد الخصم');
    render(head([{ label: 'الكوبونات' }], 'أكواد الخصم', 'انسخ الكود واستخدمه عند إتمام الطلب. الكوبونات بتتطبّق فوق أسعار العروض.') +
      (codes.length ? '<div class="col-coupons">' + codes.map((c) =>
        '<article class="col-coupon"><span class="col-coupon__code">' + esc(c) + '</span><span>' + esc(couponDesc(all[c])) + '</span>' +
        '<div class="ticket__actions" style="justify-content:flex-start"><a class="btn btn--primary btn--sm" href="/coupons/' + enc(c) + '">تفاصيل وتطبيق</a>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-copy="' + esc(c) + '">' + UI.icon('copy') + 'نسخ</button></div></article>').join('') + '</div>'
        : UI.emptyHTML({ icon: 'tag', title: 'لا توجد كوبونات حالياً', text: 'تابعنا قريباً.', actions: [{ label: 'تصفّح المتجر', href: '/shop', primary: true }] })));
  }

  /* ---------- الحملات (بتتقرا من منصة البائعين — راجع ملاحظة README) ---------- */
  function campaigns() { try { return window.Market ? window.Market.ads.list() : []; } catch (_) { return []; } }
  const campActive = (c) => { try { return window.Market.ads.statusOf(c) === 'active'; } catch (_) { return false; } };
  const campSlug = (c) => Products.slugify(c.name);

  function campaignsPage() {
    const list = campaigns().filter(campActive);
    if (seg[1]) {
      const slug = Products.slugify(seg[1]);
      const c = campaigns().find((x) => campSlug(x) === slug);
      if (!c) return notFound('الحملة غير متاحة', 'ربما انتهت الحملة أو تغيّر رابطها.', { label: 'كل الحملات', href: '/campaigns' });
      const live = campActive(c);
      let products = [];
      if (c.type === 'product' && c.productId != null) { const p = Products.byId(c.productId); if (p) products = [p]; }
      else if (c.type === 'category') products = Products.all().filter((p) => !c.category || p.category === c.category || p.category === Products.catOfSub(c.category));
      else if (c.sellerId) products = Products.all().filter((p) => p.storeId === c.sellerId);
      setTitle(c.title || c.name);
      render(head([{ label: 'الحملات', href: '/campaigns' }, { label: c.name }], c.title || c.name, c.text || '') +
        (UI.safeImg(c.img) ? '<div class="col-banner"><img src="' + UI.safeImg(c.img) + '" alt="' + esc(c.title || c.name) + '"></div>' : '') +
        (!live ? '<p class="ticket__msg is-bad">هذه الحملة غير نشطة حالياً.</p>' : '') +
        productsGrid(products, '', { icon: 'box', title: 'لا توجد منتجات في هذه الحملة', text: 'تصفّح بقية المتجر.', actions: [{ label: 'كل المنتجات', href: '/shop', primary: true }] }));
      return;
    }
    setTitle('الحملات');
    render(head([{ label: 'الحملات' }], 'الحملات والعروض الترويجية', 'حملات المتاجر النشطة الآن.') +
      (list.length ? '<div class="col-tiles">' + list.map((c) => '<a class="col-tile" href="/campaigns/' + enc(campSlug(c)) + '"><strong>' + esc(c.title || c.name) + '</strong><small>' + esc(c.text || c.name) + '</small></a>').join('') + '</div>'
        : UI.emptyHTML({ icon: 'tag', title: 'لا توجد حملات نشطة الآن', text: 'ارجع قريباً لتشوف عروض المتاجر.', actions: [{ label: 'تصفّح المتجر', href: '/shop', primary: true }] })));
  }

  /* ---------- الأكثر مبيعاً ---------- */
  function bestsellersPage() {
    setTitle('الأكثر مبيعاً');
    render(head([{ label: 'الأكثر مبيعاً' }], 'الأكثر مبيعاً', 'أفضل منتج في كل قسم، حسب مبيعات وتقييمات العملاء.') +
      productsGrid(Products.bestSellers(), 'bestsellers'));
  }

  /* ---------- عروض اليوم ---------- */
  function dailyOffersPage() {
    setTitle('عروض اليوم');
    render(head([{ label: 'عروض اليوم' }], 'عروض اليوم', 'خصومات حقيقية على منتجات مختارة — تتجدد يومياً.',
      '<div class="col-timer" aria-live="off"><span>ينتهي خلال</span><span dir="ltr" data-clock>' + Products.clock(Products.msToMidnight()) + '</span></div>') +
      productsGrid(Products.dailyOffers(), 'daily-offers', { icon: 'tag', title: 'لا توجد عروض اليوم', text: 'ارجع بكرة لعروض جديدة.', actions: [{ label: 'تصفّح كل المنتجات', href: '/shop', primary: true }] }));
    const el = root.querySelector('[data-clock]');
    if (el) timer = setInterval(() => { el.textContent = Products.clock(Products.msToMidnight()); }, 1000);
  }

  /* ---------- الأقسام ---------- */
  function categoriesPage() {
    if (!seg[1]) {
      setTitle('كل الأقسام');
      const all = Products.all();
      render(head([{ label: 'الأقسام' }], 'تسوّق حسب القسم') +
        '<div class="col-tiles">' + Products.categories.map((c) => {
          const n = all.filter((p) => p.category === c.id).length;
          return '<a class="col-tile" href="/categories/' + enc(c.id) + '"><strong>' + esc(c.name) + '</strong><small>' + n + ' منتج</small></a>';
        }).join('') + '</div>');
      return;
    }
    const cat = Products.categoryById(seg[1]);
    if (!cat) return notFound('القسم غير موجود', 'لا يوجد قسم بهذا الاسم.', { label: 'كل الأقسام', href: '/categories' });
    const inCat = Products.all().filter((p) => p.category === cat.id);
    const stores = Products.storesOf(inCat);
    if (seg[2]) {
      const st = stores.find((s) => s.slug === Products.slugify(seg[2]));
      if (!st) return notFound('المتجر غير موجود في هذا القسم', 'لا توجد منتجات لهذا المتجر في «' + cat.name + '».', { label: 'قسم ' + cat.name, href: '/categories/' + enc(cat.id) });
      const list = inCat.filter((p) => Products.storeSlug(p) === st.slug);
      setTitle(st.name + ' — ' + cat.name);
      render(head([{ label: 'الأقسام', href: '/categories' }, { label: cat.name, href: '/categories/' + enc(cat.id) }, { label: st.name }], st.name + ' — ' + cat.name, list.length + ' منتج',
        st.slug !== 'nasaq' ? '<p style="margin-top:var(--sp-2)"><a href="/store/' + enc(st.slug) + '">صفحة المتجر ←</a></p>' : '') +
        productsGrid(list, 'categories'));
      return;
    }
    setTitle(cat.name);
    render(head([{ label: 'الأقسام', href: '/categories' }, { label: cat.name }], cat.name, inCat.length + ' منتج') +
      (stores.length > 1 ? '<nav class="col-chips" aria-label="المتاجر في هذا القسم">' + stores.map((s) => '<a href="/categories/' + enc(cat.id) + '/' + enc(s.slug) + '">' + esc(s.name) + ' (' + s.count + ')</a>').join('') + '</nav>' : '') +
      (cat.subs && cat.subs.length ? '<nav class="col-chips" aria-label="الأقسام الفرعية">' + cat.subs.map((s) => '<a href="/shop?sub=' + enc(s.id) + '">' + esc(s.name) + '</a>').join('') + '</nav>' : '') +
      productsGrid(inCat, 'categories'));
  }

  /* ---------- أحداث الأزرار (نسخ / تطبيق الكوبون) ---------- */
  root.addEventListener('click', (e) => {
    const cp = e.target.closest && e.target.closest('[data-copy]');
    if (cp) { copyText(cp.getAttribute('data-copy')).then(() => UI.toast('تم نسخ الكود'), () => UI.toast('انسخ الكود يدوياً')); return; }
    const ap = e.target.closest && e.target.closest('[data-apply]');
    if (ap) {
      const r = window.Cart.applyCoupon(ap.getAttribute('data-apply'));
      const msg = root.querySelector('[data-msg]');
      if (msg) {
        msg.className = 'ticket__msg ' + (r.ok ? 'is-good' : 'is-bad');
        msg.innerHTML = esc(r.message) + (r.ok ? ' — <a href="/cart">اذهب للسلة</a>' : '');
      }
    }
  });

  /* ---------- التوجيه ---------- */
  const routes = { coupons: couponsPage, campaigns: campaignsPage, bestsellers: bestsellersPage, 'daily-offers': dailyOffersPage, categories: categoriesPage };
  (routes[kind] || function () { notFound('الصفحة غير موجودة', 'تأكد من الرابط وحاول مرة أخرى.', { label: 'تصفّح المتجر', href: '/shop' }); })();
  afterRender();
  window.addEventListener('pagehide', () => { if (timer) clearInterval(timer); });
})();
