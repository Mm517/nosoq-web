/* ==========================================================================
   js/product-page.js — معرض صور بتكبير جانبي وعارض كامل، اللون/المقاس/الكمية، موعد التوصيل،
   «يُشترى معاً»، كاروسيل المنتجات المشابهة وآخر المشاهدات، schema.org
   الروابط: /product/<المتجر>/<المنتج>  و  /campaigns/<الحملة>/<المنتج>  (والقديم /product?id=6 بيتحوّل تلقائياً)
   ========================================================================== */
(function () {
  'use strict';
  const root = document.getElementById('product-root');
  if (!root) return;

  const CFG = window.Store.config;
  const esc = window.Store.esc;
  const money = window.Store.money;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- تحديد المنتج من الرابط ---------- */
  const seg = location.pathname.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch (_) { return x; } });
  const legacyId = new URLSearchParams(location.search).get('id');
  let p = null, campaign = null;
  if (seg[0] === 'campaigns' && seg.length >= 3) {
    const cs = Products.slugify(seg[1]);
    campaign = (window.Market && window.Market.ads.list().find((c) => Products.slugify(c.name) === cs)) || null;
    p = Products.bySlug(seg[2], campaign ? campaign.sellerId : null) || (campaign && campaign.productId != null ? Products.byId(campaign.productId) : null);
  } else if (seg[0] === 'product' && seg.length >= 3) {
    p = Products.byPath(seg[1], seg[2]);
  } else if (legacyId) {
    p = Products.byId(legacyId);
    if (p) { try { history.replaceState(null, '', Products.url(p)); } catch (_) { /* تجاهل */ } }
  }

  /* ---------- غير موجود ---------- */
  if (!p) {
    document.title = 'المنتج غير موجود | ' + CFG.name;
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex';
    document.head.appendChild(m);
    root.innerHTML = UI.emptyHTML({
      icon: 'search', title: 'لم نجد هذا المنتج',
      text: 'ربما تغيّر الرابط أو لم يعد المنتج متاحاً. تصفّح بقية القطع من المتجر.',
      actions: [{ label: 'تصفّح المتجر', href: '/shop', primary: true }, { label: 'الرئيسية', href: '/' }]
    });
    root.setAttribute('aria-busy', 'false');
    return;
  }

  const state = { color: 0, size: null, qty: 1, img: 0, showVideo: false };
  let N = Products.photoCount(p, state.color);        // عدد صور المعرض (يتغيّر مع اللون المختار)
  const SLOTS = 6;                         // عدد المصغّرات الظاهرة (آخرها يحمل +N لو فيه صور زيادة)
  UI.recent.add(p.id);
  if (window.Market) window.Market.track.view(p);
  const out = Products.isSoldOut(p);
  const limit = Cart.maxQty(p);

  /* ---------- SEO: العنوان + Meta + schema.org ---------- */
  function upsert(selector, create, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement(create); document.head.appendChild(el); }
    Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
    return el;
  }

  function injectSEO() {
    const url = new URL(Products.url(p), location.origin).href;   /* الرابط الأساسي (canonical) دايماً /product/... حتى لو الدخول من حملة */
    const title = p.name + ' | ' + CFG.name;
    const desc = p.description.length > 155 ? p.description.slice(0, 152) + '…' : p.description;
    document.title = title;
    upsert('meta[name="description"]', 'meta', { name: 'description', content: desc });
    upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
    upsert('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'product' });
    upsert('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    upsert('meta[property="og:description"]', 'meta', { property: 'og:description', content: desc });
    upsert('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });

    /* استبدل الصور بروابط حقيقية عبر الحقل photos عند الإطلاق */
    const photos = (p.photos && p.photos.length ? p.photos : Products.gallery(p, 0))
      .map((u) => (u.startsWith('data:') ? u : new URL(u, location.origin + '/').href));

    const product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description,
      sku: p.sku,
      image: photos,
      category: Products.categoryName(p.category),
      brand: { '@type': 'Brand', name: CFG.name },
      color: p.colors.map((c) => c.name).join(', '),
      aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: CFG.currencyCode,
        price: p.price.toFixed(2),
        priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
        itemCondition: 'https://schema.org/NewCondition',
        availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: CFG.name }
      }
    };
    const crumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: new URL('/', location.href).href },
        { '@type': 'ListItem', position: 2, name: Products.categoryName(p.category), item: new URL('/shop?cat=' + p.category, location.href).href },
        { '@type': 'ListItem', position: 3, name: p.name, item: url }
      ]
    };
    [['ld-product', product], ['ld-breadcrumb', crumbs]].forEach(([id, data]) => {
      let s = document.getElementById(id);
      if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = id; document.head.appendChild(s); }
      s.textContent = JSON.stringify(data);
    });
  }

  /* ---------- القالب ---------- */
  function thumbsHTML() {
    const shown = Math.min(N, SLOTS);
    let h = '';
    for (let i = 0; i < shown; i++) {
      const more = N > SLOTS && i === SLOTS - 1;
      h += '<li><button type="button" class="thumb" data-thumb="' + i + '" aria-label="' + (more ? 'عرض كل الصور، ' + N + ' صور' : 'عرض الصورة ' + (i + 1) + ' من ' + N) + '" aria-current="' + (!state.showVideo && i === 0) + '">' +
        '<img' + Products.imgAttrs(p, i, state.color, 'xs') + ' alt="" width="72" height="90" loading="lazy">' +
        (more ? '<span class="thumb__more" aria-hidden="true">+' + (N - SLOTS + 1) + '</span>' : '') + '</button></li>';
    }
    /* فيديو المنتج: يظهر كمصغّرة إضافية بجانب صور المعرض؛ الضغط عليها يشغّل الفيديو في نفس المسرح الرئيسي */
    if (p.video) {
      h += '<li><button type="button" class="thumb thumb--video" data-thumb-video aria-label="تشغيل فيديو المنتج" aria-current="' + state.showVideo + '">' +
        '<img' + Products.imgAttrs(p, 0, state.color, 'xs') + ' alt="" width="72" height="90" loading="lazy">' +
        '<span class="thumb__play" aria-hidden="true">' + UI.icon('play') + '</span></button></li>';
    }
    return h;
  }

  function deliveryHTML() {
    if (out) return '';
    return '<div class="delivery">' +
      '<p>' + UI.icon('truck') + '<span>يصلك <strong>' + Products.delivery.standard() + '</strong><small> · ' + Products.shipNote(p) + '</small></span></p>' +
      '<p>' + UI.icon('clock') + '<span>بالشحن السريع <strong>' + Products.delivery.express() + '</strong><small> · ' + money(CFG.shipping.express) + '</small></span></p>' +
      '<p>' + UI.icon('pin') + '<button type="button" class="delivery__loc" data-loc-open>التوصيل إلى <strong data-loc-label>' + esc(UI.loc.get() || 'تحديث الموقع') + '</strong></button></p>' +
      '</div>';
  }

  function template() {
    const pct = Products.discountPct(p);
    const stockNote = out
      ? '<p class="pdp__stock is-out" role="status">نفدت الكمية حالياً</p>'
      : p.stock <= 5 ? '<p class="pdp__stock is-low" role="status">متبقي ' + p.stock + ' قطع فقط</p>'
      : '<p class="pdp__stock is-ok">متوفر في المخزون</p>';

    const colors = '<div class="opt"><p class="opt__label" id="color-label">اللون: <strong data-color-name>' + esc(p.colors[0].name) + '</strong></p>' +
      '<div class="swatches" role="radiogroup" aria-labelledby="color-label" data-group="color">' +
      p.colors.map((c, i) => '<button type="button" class="swatch" role="radio" style="--sw:' + c.hex + '" aria-checked="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-index="' + i + '" aria-label="' + esc(c.name) + '"></button>').join('') +
      '</div></div>';

    const sizes = p.sizes.length
      ? '<div class="opt"><p class="opt__label" id="size-label">المقاس</p>' +
        '<div class="chips" role="radiogroup" aria-labelledby="size-label" aria-describedby="size-error" data-group="size">' +
        p.sizes.map((s, i) => {
          const so = Products.sizeSoldOut(p, s);
          return '<button type="button" class="chip" role="radio" aria-checked="false" data-size="' + s + '" tabindex="' + (i === 0 ? 0 : -1) + '"' + (so ? ' aria-disabled="true" title="غير متوفر"' : '') + '>' + s + (so ? '<span class="sr-only"> غير متوفر</span>' : '') + '</button>';
        }).join('') + '</div><p class="field__error" id="size-error" role="alert"></p></div>'
      : '';

    return '<nav class="breadcrumb" aria-label="مسار التنقل"><ol>' +
        '<li><a href="/">الرئيسية</a></li>' +
        '<li><a href="/shop?cat=' + p.category + '">' + Products.categoryName(p.category) + '</a></li>' +
        '<li><span aria-current="page">' + esc(p.name) + '</span></li></ol></nav>' +
      '<div class="pdp">' +
        '<div class="gallery" role="group" aria-roledescription="معرض صور" aria-label="صور ' + esc(p.name) + '">' +
          '<ul class="gallery__thumbs">' + thumbsHTML() + '</ul>' +
          '<div class="gallery__stage" data-stage>' +
            '<div class="gallery__main" data-zoom>' +
              '<img id="main-img"' + Products.imgAttrs(p, 0, state.color, 'lg') + ' alt="' + esc(p.name) + '، الصورة 1" width="900" height="1125" fetchpriority="high">' +
              (p.video ? '<video id="main-video" class="gallery__video" src="' + esc(p.video) + '" playsinline preload="metadata" controls hidden></video>' : '') +
              '<div class="card__badges">' + UI.badgesHTML(p) + '</div>' +
              '<span class="zoom-lens" aria-hidden="true"></span>' +
              '<button type="button" class="gallery__nav gallery__nav--prev" data-gal="-1" aria-label="الصورة السابقة">' + UI.icon('chev-r') + '</button>' +
              '<button type="button" class="gallery__nav gallery__nav--next" data-gal="1" aria-label="الصورة التالية">' + UI.icon('chev-l') + '</button>' +
            '</div>' +
            '<div class="zoom-pane" data-pane aria-hidden="true"></div>' +
            '<button type="button" class="gallery__full" data-lightbox-open>' + UI.icon('expand') + 'اضغط لعرض الصورة بالحجم الكامل</button>' +
          '</div>' +
        '</div>' +
        '<div class="pdp__info">' +
          '<p class="pdp__cat"><a href="/shop?cat=' + p.category + '">' + Products.categoryName(p.category) + '</a>' +
            (p.seller ? ' · البائع: <a href="/store/' + encodeURIComponent(p.seller.slug) + '">' + esc(p.seller.name) + '</a>' : '') + '</p>' +
          '<h1 class="pdp__title">' + esc(p.name) + '</h1>' +
          '<div class="pdp__meta">' + UI.ratingHTML(p) + (Products.isBestSeller(p) ? '<span class="best">الأكثر مبيعاً في ' + esc(Products.categoryName(p.category)) + '</span>' : '') + '</div>' +
          '<div class="pdp__price">' + UI.priceHTML(p) + (pct ? '<span class="badge badge--sale">وفّر ' + pct + '%</span>' : '') + '</div>' +
          '<p class="pdp__desc">' + esc(p.description) + '</p>' +
          deliveryHTML() +
          colors + sizes +
          '<div class="pdp__buy">' +
            '<div class="qty" role="group" aria-label="الكمية">' +
              '<button type="button" data-qty="-1" aria-label="إنقاص الكمية"' + (out ? ' disabled' : '') + '>' + UI.icon('minus') + '</button>' +
              '<output id="qty-out" aria-live="polite">1</output>' +
              '<button type="button" data-qty="1" aria-label="زيادة الكمية"' + (out || limit < 2 ? ' disabled' : '') + '>' + UI.icon('plus') + '</button>' +
            '</div>' +
            '<button type="button" class="btn btn--primary btn--lg" id="add-btn"' + (out ? ' disabled' : '') + '>' + (out ? 'نفدت الكمية' : UI.icon('bag') + 'أضف إلى السلة') + '</button>' +
            UI.wishBtn(p, 'wish-btn') +
          '</div>' +
          stockNote +
          '<ul class="trust">' +
            '<li>' + UI.icon('truck') + 'شحن مجاني للطلبات فوق ' + money(CFG.freeShippingFrom) + '</li>' +
            '<li>' + UI.icon('refresh') + 'إرجاع مجاني خلال ' + CFG.returnDays + ' يوماً</li>' +
            '<li>' + UI.icon('shield') + 'دفع آمن وحماية للمشتري</li></ul>' +
          '<div class="accordion">' +
            '<details open><summary>المواصفات</summary><ul class="accordion__body">' + p.details.map((d) => '<li>' + esc(d) + '</li>').join('') + '<li>رمز المنتج: <span dir="ltr">' + esc(p.sku) + '</span></li></ul></details>' +
            '<details><summary>الشحن والإرجاع</summary><div class="accordion__body"><p>يصل الطلب خلال 3 إلى 5 أيام عمل، أو 1 إلى 2 يوم بالشحن السريع. يمكنك إرجاع القطعة خلال ' + CFG.returnDays + ' يوماً بحالتها الأصلية وسنعيد لك المبلغ كاملاً.</p></div></details>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="fbt-root"></div>' +
      '<div class="pdp-car" id="related-root"></div>' +
      '<div class="pdp-car" id="recent-root" hidden></div>';
  }

  /* ---------- «يُشترى معاً بشكل متكرر» ---------- */
  const score = (x) => x.rating * Math.log(x.reviews + 1);
  function companions() {
    const others = Products.all().filter((x) => x.id !== p.id && !Products.isSoldOut(x) && x.category !== p.category);
    const cap = Math.max(400, p.price);
    const pick = (list) => list.sort((a, b) => score(b) - score(a));
    const cheap = others.filter((x) => x.price <= cap);
    const plain = pick(cheap.filter((x) => !x.sizes.length)), sized = pick(cheap.filter((x) => x.sizes.length));
    return plain.concat(sized).slice(0, 2);
  }

  function fbtItem(x, isMain) {
    const firstSize = x.sizes.find((s) => !Products.sizeSoldOut(x, s));
    const sel = !isMain && x.sizes.length
      ? '<label class="sr-only" for="fbt-size-' + x.id + '">مقاس ' + esc(x.name) + '</label>' +
        '<select class="select select--sm" id="fbt-size-' + x.id + '" data-fbt-size="' + x.id + '">' +
        x.sizes.map((s) => '<option value="' + s + '"' + (Products.sizeSoldOut(x, s) ? ' disabled' : '') + (s === firstSize ? ' selected' : '') + '>المقاس ' + s + '</option>').join('') + '</select>'
      : '';
    return '<li class="fbt__item" data-fbt-item="' + x.id + '">' +
      '<label class="fbt__check"><input type="checkbox" checked data-fbt-check="' + x.id + '"><span class="sr-only">إضافة ' + esc(x.name) + ' إلى المجموعة</span></label>' +
      '<a class="fbt__img" href="' + (isMain ? '#main' : Products.url(x)) + '" tabindex="-1" aria-hidden="true"><img' + Products.imgAttrs(x, 0, 0, 'sm') + ' alt="" width="320" height="400" loading="lazy"></a>' +
      '<a class="fbt__name" href="' + (isMain ? '#main' : Products.url(x)) + '">' + (isMain ? '<strong>هذا المنتج:</strong> ' : '') + esc(x.name) + '</a>' +
      '<span class="fbt__price">' + money(x.price) + '</span>' + sel +
      (isMain && x.sizes.length ? '<small class="fbt__hint">المقاس واللون من اختياراتك أعلاه</small>' : '') + '</li>';
  }

  function renderFBT() {
    const root = $('#fbt-root');
    const list = out ? [] : companions();
    if (!root || list.length < 2) return;
    const items = [p].concat(list);
    root.innerHTML = '<section class="fbt" aria-labelledby="fbt-title"><h2 id="fbt-title">يُشترى معاً بشكل متكرر</h2>' +
      '<div class="fbt__layout"><ul class="fbt__items">' +
        items.map((x, i) => (i ? '<li class="fbt__plus" aria-hidden="true">+</li>' : '') + fbtItem(x, i === 0)).join('') + '</ul>' +
      '<div class="fbt__buy"><p class="fbt__total">الإجمالي: <strong data-fbt-total></strong></p>' +
        '<button type="button" class="btn btn--accent btn--block" data-fbt-add></button>' +
        '<p class="field__error" data-fbt-error role="alert"></p></div></div></section>';

    const checks = () => $$('[data-fbt-check]', root);
    const update = () => {
      const on = checks().filter((c) => c.checked).map((c) => Products.byId(c.dataset.fbtCheck));
      $('[data-fbt-total]', root).textContent = money(on.reduce((t, x) => t + x.price, 0));
      const btn = $('[data-fbt-add]', root);
      btn.textContent = on.length ? (on.length === 1 ? 'أضف المنتج إلى السلة' : 'أضف ' + on.length + ' منتجات إلى السلة') : 'اختر منتجاً واحداً على الأقل';
      btn.disabled = !on.length;
      checks().forEach((c) => c.closest('.fbt__item').classList.toggle('is-off', !c.checked));
    };
    root.addEventListener('change', (e) => { if (e.target.matches('[data-fbt-check]')) update(); });
    $('[data-fbt-add]', root).addEventListener('click', () => {
      const err = $('[data-fbt-error]', root);
      err.textContent = '';
      const ids = checks().filter((c) => c.checked).map((c) => Number(c.dataset.fbtCheck));
      if (ids.includes(p.id) && p.sizes.length && !state.size) {
        err.textContent = 'اختر مقاس هذا المنتج من الأعلى أولاً';
        const first = $('[data-group="size"] [role="radio"]:not([aria-disabled="true"])');
        if (first) { first.scrollIntoView({ block: 'center', behavior: UI.reduceMotion() ? 'auto' : 'smooth' }); first.focus({ preventScroll: true }); }
        return;
      }
      let added = 0, fail = '';
      ids.forEach((id) => {
        const x = Products.byId(id);
        const sizeEl = $('[data-fbt-size="' + id + '"]', root);
        const opts = id === p.id
          ? { size: state.size, color: p.colors[state.color].name, qty: 1 }
          : { size: sizeEl ? sizeEl.value : null, color: x.colors[0].name, qty: 1 };
        const r = Cart.add(id, opts);
        if (r.ok) added++; else fail = fail || r.message;
      });
      if (added) { UI.updateCartCount(true); UI.announce('أُضيف ' + added + ' منتجات إلى السلة'); UI.openCart(); }
      if (fail) UI.toast(fail, { type: 'error' });
    });
    update();
  }

  /* ---------- كاروسيلات أسفل الصفحة ---------- */
  function renderCarousels() {
    const rel = Products.related(p, 8);
    const relRoot = $('#related-root');
    if (relRoot && rel.length) relRoot.innerHTML = UI.carousel({ id: 'car-related', title: 'عملاء شاهدوا هذا المنتج شاهدوا أيضاً', href: '/shop?cat=' + p.category, items: rel.map(UI.pcard) });
    const seen = UI.recent.list().filter((x) => x.id !== p.id);
    const recRoot = $('#recent-root');
    if (recRoot && seen.length) {
      recRoot.hidden = false;
      recRoot.innerHTML = UI.carousel({ id: 'car-recent', title: 'شاهدتها مؤخراً', items: seen.map(UI.pcard) });
    }
    UI.initCarousels(root);
  }

  /* ---------- المعرض ---------- */
  function setImage(i) {
    state.img = (i + N) % N;
    const main = $('#main-img');
    Products.setImg(main, p, state.img, state.color, 'lg');
    main.alt = p.name + '، الصورة ' + (state.img + 1);
    const shown = Math.min(N, SLOTS);
    $$('.thumb', $('.gallery__thumbs')).forEach((t, k) => {
      if (t.hasAttribute('data-thumb-video')) { t.setAttribute('aria-current', 'false'); return; }
      const cur = k === state.img || (N > SLOTS && k === SLOTS - 1 && state.img >= SLOTS - 1);
      t.setAttribute('aria-current', String(cur));
      Products.setImg(t.firstElementChild, p, k, state.color, 'xs');
    });
    if (lb) lbRender();
  }
  /* أظهر صورة عادية في المسرح الرئيسي (تُلغي وضع الفيديو إن كان مفعّلاً) */
  function showMainImage(i) {
    const stage = $('[data-stage]'), vid = $('#main-video');
    state.showVideo = false;
    if (stage) stage.classList.remove('is-video');
    if (vid) { vid.pause(); vid.hidden = true; }
    $('#main-img').hidden = false;
    setImage(i);
  }
  /* أظهر فيديو المنتج في نفس مسرح المعرض، بجوار مصغّرات الصور مباشرة */
  function showMainVideo() {
    const stage = $('[data-stage]'), vid = $('#main-video');
    if (!vid) return;
    state.showVideo = true;
    if (stage) stage.classList.add('is-video');
    $('#main-img').hidden = true;
    vid.hidden = false;
    $$('.thumb', $('.gallery__thumbs')).forEach((t) => t.setAttribute('aria-current', String(t.hasAttribute('data-thumb-video'))));
  }

  /* عارض الصور بالحجم الكامل */
  let lb = null;
  function lbThumbs() {
    let h = '';
    for (let i = 0; i < N; i++) {
      h += '<button type="button" class="thumb" data-lb-thumb="' + i + '" aria-label="الصورة ' + (i + 1) + ' من ' + N + '" aria-current="' + (i === state.img) + '"><img' + Products.imgAttrs(p, i, state.color, 'xs') + ' alt="" width="56" height="70"></button>';
    }
    return h;
  }
  function lbRender() {
    Products.setImg($('[data-lb-img]', lb), p, state.img, state.color, 'lg');
    $('[data-lb-count]', lb).textContent = (state.img + 1) + ' / ' + N;
    $$('[data-lb-thumb]', lb).forEach((t, k) => t.setAttribute('aria-current', String(k === state.img)));
  }
  function openLightbox(i) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'صور ' + p.name + ' بالحجم الكامل');
      lb.setAttribute('aria-hidden', 'true');
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-lb]'), th = e.target.closest('[data-lb-thumb]');
        if (nav) setImage(state.img + Number(nav.dataset.lb));
        if (th) setImage(Number(th.dataset.lbThumb));
      });
      lb.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') setImage(state.img + 1);
        if (e.key === 'ArrowRight') setImage(state.img - 1);
      });
    }
    lb.innerHTML =
      '<div class="lightbox__bar"><p class="lightbox__count" data-lb-count aria-live="polite"></p><button type="button" class="icon-btn" data-panel-close data-autofocus aria-label="إغلاق العارض">' + UI.icon('close') + '</button></div>' +
      '<div class="lightbox__stage"><button type="button" class="lightbox__nav lightbox__nav--prev" data-lb="-1" aria-label="الصورة السابقة">' + UI.icon('chev-r') + '</button>' +
        '<img class="lightbox__img" data-lb-img' + Products.imgAttrs(p, i, state.color, 'lg') + ' alt="' + esc(p.name) + '">' +
        '<button type="button" class="lightbox__nav lightbox__nav--next" data-lb="1" aria-label="الصورة التالية">' + UI.icon('chev-l') + '</button></div>' +
      '<div class="lightbox__thumbs">' + lbThumbs() + '</div>';
    state.img = i;
    setImage(i);
    UI.openPanel(lb);
  }

  /* مجموعة radio بلوحة المفاتيح (أسهم) */
  function bindRadioGroup(group, onSelect) {
    const items = () => $$('[role="radio"]', group);
    const select = (el, focus) => {
      if (el.getAttribute('aria-disabled') === 'true') return;
      items().forEach((x) => { x.setAttribute('aria-checked', String(x === el)); x.tabIndex = x === el ? 0 : -1; });
      if (focus) el.focus();
      onSelect(el);
    };
    group.addEventListener('click', (e) => { const b = e.target.closest('[role="radio"]'); if (b) select(b, false); });
    group.addEventListener('keydown', (e) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const list = items().filter((x) => x.getAttribute('aria-disabled') !== 'true');
      const cur = list.indexOf(document.activeElement);
      const dir = (e.key === 'ArrowLeft' || e.key === 'ArrowDown') ? 1 : -1;   // RTL: اليسار = التالي
      const next = list[(cur + dir + list.length) % list.length];
      if (next) select(next, true);
    });
  }

  function bind() {
    const stage = $('[data-stage]'), main = $('.gallery__main'), lens = $('.zoom-lens'), pane = $('[data-pane]');

    function bindThumbs() {
      $$('.thumb', $('.gallery__thumbs')).forEach((t) => t.addEventListener('click', () => {
        if (t.hasAttribute('data-thumb-video')) { showMainVideo(); return; }
        const i = Number(t.dataset.thumb);
        if (N > SLOTS && i === SLOTS - 1) openLightbox(i); else showMainImage(i);
      }));
    }
    bindThumbs();
    $$('[data-gal]').forEach((b) => b.addEventListener('click', () => { if (!state.showVideo) setImage(state.img + Number(b.dataset.gal)); }));
    $('.gallery').addEventListener('keydown', (e) => {
      if (state.showVideo) return;
      if (e.key === 'ArrowLeft') setImage(state.img + 1);
      if (e.key === 'ArrowRight') setImage(state.img - 1);
    });
    $('[data-lightbox-open]').addEventListener('click', () => openLightbox(state.img));
    main.addEventListener('click', (e) => { if (!state.showVideo && !e.target.closest('.gallery__nav')) openLightbox(state.img); });

    /* تكبير جانبي: مستطيل فوق الصورة + لوحة مكبّرة بجوارها (على الأجهزة التي تدعم المرور فقط) */
    const ZOOM = 2.5;
    const canZoom = () => window.matchMedia('(hover: hover) and (min-width: 900px)').matches;
    const stopZoom = () => { stage.classList.remove('is-zoomed'); main.classList.remove('is-zoomed'); };
    main.addEventListener('mousemove', (e) => {
      if (state.showVideo || !canZoom() || e.target.closest('.gallery__nav')) { stopZoom(); return; }
      const r = main.getBoundingClientRect();
      const lw = r.width / ZOOM, lh = r.height / ZOOM;
      const x = Math.min(Math.max(e.clientX - r.left - lw / 2, 0), r.width - lw);
      const y = Math.min(Math.max(e.clientY - r.top - lh / 2, 0), r.height - lh);
      lens.style.width = lw + 'px'; lens.style.height = lh + 'px'; lens.style.left = x + 'px'; lens.style.top = y + 'px';
      const src = $('#main-img').currentSrc || $('#main-img').src;
      if (pane.dataset.src !== src) { pane.dataset.src = src; pane.style.backgroundImage = 'url("' + src + '")'; }
      pane.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
      pane.style.backgroundPosition = (-x * ZOOM) + 'px ' + (-y * ZOOM) + 'px';
      stage.classList.add('is-zoomed'); main.classList.add('is-zoomed');
    });
    main.addEventListener('mouseleave', stopZoom);

    bindRadioGroup($('[data-group="color"]'), (el) => {
      state.color = Number(el.dataset.index);
      $('[data-color-name]').textContent = p.colors[state.color].name;
      /* لكل لون صوره الخاصة: أعِد بناء عدد الصور والمصغّرات بالكامل، ثم اعرض أول صورة له */
      N = Products.photoCount(p, state.color);
      state.showVideo = false;
      $('.gallery__thumbs').innerHTML = thumbsHTML();
      bindThumbs();
      showMainImage(0);
    });

    const sizeGroup = $('[data-group="size"]');
    if (sizeGroup) {
      bindRadioGroup(sizeGroup, (el) => { state.size = el.dataset.size; $('#size-error').textContent = ''; });
    }

    $$('[data-qty]').forEach((b) => b.addEventListener('click', () => {
      state.qty = Math.min(limit, Math.max(1, state.qty + Number(b.dataset.qty)));
      $('#qty-out').textContent = state.qty;
      $('[data-qty="-1"]').disabled = state.qty <= 1;
      $('[data-qty="1"]').disabled = state.qty >= limit;
    }));
    $('[data-qty="-1"]').disabled = true;

    $('#add-btn').addEventListener('click', () => {
      if (p.sizes.length && !state.size) {
        $('#size-error').textContent = 'يرجى اختيار المقاس أولاً';
        const first = $('[data-group="size"] [role="radio"]:not([aria-disabled="true"])');
        if (first) first.focus();
        return;
      }
      const r = Cart.add(p.id, { size: state.size, color: p.colors[state.color].name, qty: state.qty });
      if (r.ok) {
        UI.updateCartCount(true);
        UI.announce('أُضيف ' + p.name + ' إلى السلة');
        UI.openCart();
      } else UI.toast(r.message, { type: 'error' });
    });
  }

  /* ---------- البداية ---------- */
  injectSEO();
  setTimeout(() => {
    root.innerHTML = template();
    root.setAttribute('aria-busy', 'false');
    bind();
    renderFBT();
    renderCarousels();
  }, UI.reduceMotion() ? 0 : 400);
})();
