/* ==========================================================================
   js/shop.js — البحث، التصفية بالتصنيف والسعر، الترتيب، مزامنة الرابط
   الحالة كلها في الـ URL (?cat=&q=&min=&max=&sort=&stock=1&sale=1&wishlist=1)
   ========================================================================== */
(function () {
  'use strict';
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const esc = window.Store.esc;
  const money = window.Store.money;
  const $ = (id) => document.getElementById(id);

  const els = {
    title: $('shop-title'), crumb: $('shop-crumb'), search: $('search-input'), sort: $('sort-select'),
    toggle: $('filters-toggle'), panel: $('filters'), cats: $('cat-list'),
    min: $('price-min'), max: $('price-max'), stock: $('only-stock'), sale: $('only-sale'),
    active: $('active-filters'), count: $('result-count')
  };

  const SORTS = {
    featured: (a, b) => b.rating * Math.log(b.reviews + 1) - a.rating * Math.log(a.reviews + 1),
    new: (a, b) => (Number(b.isNew) - Number(a.isNew)) || (new Date(b.addedAt) - new Date(a.addedAt)),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => (b.rating - a.rating) || (b.reviews - a.reviews),
    discount: (a, b) => Products.discountPct(b) - Products.discountPct(a)
  };

  const num = (v) => (v !== null && v !== '' && !isNaN(v) ? Number(v) : null);
  const toLatin = (s) => String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  /* ---------- الحالة ---------- */
  function readState() {
    const p = new URLSearchParams(location.search);
    let cat = p.get('cat');
    const sub = Products.catOfSub(p.get('sub')) ? p.get('sub') : '';
    if (sub) cat = Products.catOfSub(sub);
    return {
      cat: Products.categories.some((c) => c.id === cat) ? cat : '',
      sub: sub,
      q: (p.get('q') || '').trim(),
      min: num(p.get('min')),
      max: num(p.get('max')),
      sort: SORTS[p.get('sort')] ? p.get('sort') : 'featured',
      stock: p.get('stock') === '1',
      sale: p.get('sale') === '1',
      wishlist: p.get('wishlist') === '1'
    };
  }
  let state = readState();

  function writeState() {
    const p = new URLSearchParams();
    if (state.cat) p.set('cat', state.cat);
    if (state.sub) p.set('sub', state.sub);
    if (state.q) p.set('q', state.q);
    if (state.min !== null) p.set('min', state.min);
    if (state.max !== null) p.set('max', state.max);
    if (state.sort !== 'featured') p.set('sort', state.sort);
    if (state.stock) p.set('stock', '1');
    if (state.sale) p.set('sale', '1');
    if (state.wishlist) p.set('wishlist', '1');
    const qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (_) { /* file:// في بعض المتصفحات */ }
  }

  /* ---------- التصفية والترتيب ---------- */
  function filtered() {
    const words = Products.normalize(toLatin(state.q)).split(/\s+/).filter(Boolean);
    return Products.all().filter((p) => {
      if (state.cat && p.category !== state.cat) return false;
      if (state.sub && p.sub !== state.sub) return false;
      if (words.length) {
        const hay = Products.normalize([p.name, Products.categoryName(p.category), p.description, p.colors.map((c) => c.name).join(' ')].join(' '));
        if (!words.every((w) => hay.includes(w))) return false;
      }
      if (state.min !== null && p.price < state.min) return false;
      if (state.max !== null && p.price > state.max) return false;
      if (state.stock && Products.isSoldOut(p)) return false;
      if (state.sale && !Products.discountPct(p)) return false;
      if (state.wishlist && !Wishlist.has(p.id)) return false;
      return true;
    }).sort(SORTS[state.sort]).sort(sponsoredFirst);
  }

  /* المنتجات المموَّلة تظهر أولاً في الترتيب الافتراضي فقط (الترتيب ثابت فتبقى بقية القائمة كما هي) */
  function sponsoredFirst(a, b) {
    if (state.sort !== 'featured' || !window.Market) return 0;
    const sp = window.Market.ads.sponsoredIds();
    return (sp.has(b.id) ? 1 : 0) - (sp.has(a.id) ? 1 : 0);
  }

  /* لافتة إعلانية أعلى النتائج (حملة «لافتة أعلى صفحة المنتجات») */
  function renderAd() {
    const slot = document.getElementById('ad-slot');
    if (!slot || !window.Market) return;
    const list = window.Market.ads.active('category', { category: state.cat });
    if (!list.length) { slot.innerHTML = ''; return; }
    const c = list[Math.floor(Math.random() * list.length)];
    window.Market.ads.impression(c.id);
    slot.innerHTML = UI.adBanner(c);
  }

  /* ---------- نصوص عربية ---------- */
  function countText(n) {
    if (n === 0) return 'لا توجد منتجات';
    if (n === 1) return 'منتج واحد';
    if (n === 2) return 'منتجان';
    if (n <= 10) return n + ' منتجات';
    return n + ' منتجاً';
  }
  function titleText() {
    if (state.wishlist) return 'قائمة المفضلة';
    if (state.q) return 'نتائج البحث عن «' + state.q + '»';
    if (state.sub) return Products.categoryName(state.cat) + ' - ' + Products.subName(state.sub);
    if (state.cat) return Products.categoryName(state.cat);
    if (state.sale) return 'العروض';
    return 'كل المنتجات';
  }

  /* ---------- العرض ---------- */
  function renderCategories() {
    const total = Products.all().length;
    const opt = (id, name, n) => '<li><button type="button" class="filter-opt" data-cat="' + id + '" aria-pressed="' + (state.cat === id) + '">' + name + '<small>' + n + '</small></button></li>';
    const subOpt = (x) => '<li><button type="button" class="filter-opt filter-opt--sub" data-sub="' + x.id + '" aria-pressed="' + (state.sub === x.id) + '">' + x.name + '<small>' + Products.all().filter((p) => p.sub === x.id).length + '</small></button></li>';
    els.cats.innerHTML = opt('', 'الكل', total) +
      Products.categories.map((c) => opt(c.id, c.name, Products.all().filter((p) => p.category === c.id).length) +
        (state.cat === c.id && c.subs && c.subs.length ? '<li><ul class="filter-subs">' + c.subs.filter((x) => Products.all().some((p) => p.sub === x.id)).map(subOpt).join('') + '</ul></li>' : '')).join('');
  }

  function renderChips() {
    const chips = [];
    const chip = (key, label) => chips.push('<span class="tag">' + esc(label) + '<button type="button" data-remove-filter="' + key + '" aria-label="إزالة الفلتر: ' + esc(label) + '">' + UI.icon('close') + '</button></span>');
    if (state.cat) chip('cat', Products.categoryName(state.cat));
    if (state.sub) chip('sub', Products.subName(state.sub));
    if (state.q) chip('q', 'بحث: ' + state.q);
    if (state.min !== null || state.max !== null) {
      chip('price', 'السعر: ' + (state.min !== null ? 'من ' + money(state.min) : '') + (state.max !== null ? ' إلى ' + money(state.max) : ''));
    }
    if (state.stock) chip('stock', 'المتوفر فقط');
    if (state.sale) chip('sale', 'العروض فقط');
    if (state.wishlist) chip('wishlist', 'المفضلة');
    els.active.innerHTML = chips.join('');
    els.active.hidden = chips.length === 0;
  }

  function resultsHTML(list) {
    if (!Products.locationKnown()) return '<div class="grid__empty" style="grid-column:1/-1">' + UI.locationBannerHTML() + '</div>';
    if (list.length) return UI.cards(list);
    const wishEmpty = state.wishlist && Wishlist.count() === 0 && !state.q && !state.cat;
    return '<div class="grid__empty" style="grid-column:1/-1">' + (wishEmpty
      ? UI.emptyHTML({ icon: 'heart', title: 'قائمة المفضلة فارغة', text: 'اضغط على القلب في أي منتج لتحفظه هنا وتعود إليه لاحقاً.', actions: [{ label: 'تصفّح المنتجات', href: '/shop', primary: true }] })
      : UI.emptyHTML({ icon: 'search', title: 'لا توجد نتائج مطابقة', text: 'جرّب كلمات أبسط، أو وسّع نطاق السعر، أو أزل بعض الفلاتر.', actions: [{ label: 'إعادة ضبط الفلاتر', attr: 'data-reset', primary: true }, { label: 'كل المنتجات', href: '/shop' }] })) + '</div>';
  }

  function renderMeta(list) {
    const t = titleText();
    els.title.textContent = t;
    if (els.crumb) els.crumb.textContent = t;
    document.title = t + ' | ' + window.Store.config.name;
    els.count.textContent = countText(list.length);
    renderChips();
  }

  function syncControls() {
    els.search.value = state.q;
    els.sort.value = state.sort;
    els.min.value = state.min === null ? '' : state.min;
    els.max.value = state.max === null ? '' : state.max;
    els.stock.checked = state.stock;
    els.sale.checked = state.sale;
    $$('[data-cat]', els.cats).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
  }
  function $$(s, r) { return Array.from((r || document).querySelectorAll(s)); }

  function update() {
    const list = filtered();
    writeState();
    renderCategories();
    syncControls();
    renderMeta(list);
    renderAd();
    grid.innerHTML = resultsHTML(list);
    UI.bindLocationBanner(grid);
  }

  /* ---------- الأحداث ---------- */
  let timer;
  els.search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = els.search.value.trim(); update(); }, 220);
  });
  els.sort.addEventListener('change', () => { state.sort = els.sort.value; update(); });
  els.stock.addEventListener('change', () => { state.stock = els.stock.checked; update(); });
  els.sale.addEventListener('change', () => { state.sale = els.sale.checked; update(); });
  ['change'].forEach((ev) => {
    els.min.addEventListener(ev, () => { state.min = num(toLatin(els.min.value)); update(); });
    els.max.addEventListener(ev, () => { state.max = num(toLatin(els.max.value)); update(); });
  });

  els.cats.addEventListener('click', (e) => {
    const sb = e.target.closest('[data-sub]');
    if (sb) { state.sub = state.sub === sb.dataset.sub ? '' : sb.dataset.sub; update(); return; }
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    state.sub = '';
    update();
  });

  els.toggle.addEventListener('click', () => {
    const open = !els.panel.classList.contains('is-open');
    els.panel.classList.toggle('is-open', open);
    els.toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]') || e.target.closest('#reset-filters')) {
      state = { cat: '', sub: '', q: '', min: null, max: null, sort: 'featured', stock: false, sale: false, wishlist: false };
      update();
      return;
    }
    const r = e.target.closest('[data-remove-filter]');
    if (r) {
      const k = r.dataset.removeFilter;
      if (k === 'price') { state.min = null; state.max = null; } else if (k === 'cat') { state.cat = ''; state.sub = ''; } else if (k === 'sub') state.sub = ''; else state[k] = k === 'q' ? '' : false;
      update();
    }
  });

  /* عند تغيير المفضلة داخل عرض المفضلة نحدّث القائمة */
  Wishlist.subscribe(() => { if (state.wishlist) update(); });

  /* ---------- البداية ---------- */
  renderCategories();
  syncControls();
  const first = filtered();
  renderMeta(first);
  UI.load(grid, { count: 6, render: () => resultsHTML(filtered()) }).then(() => UI.bindLocationBanner(grid));
})();
