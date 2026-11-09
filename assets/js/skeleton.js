/* ==========================================================================
   js/skeleton.js — هياكل التحميل (Skeleton) لشكل الموبايل (أقل من 768px)

   يتحمّل في <head> بشكل متزامن عشان الهيكل يظهر فور ظهور <main> وقبل ما تشتغل
   باقي السكربتات. بيرسم هيكل متحرك للهيدر والشريط السفلي ومحتوى كل صفحة،
   وبعد ما الصفحة تجهز (DOMContentLoaded) بيشيله بنعومة.
   صفحات بتجيب بياناتها بعد التحميل (زي «حسابي») بتنادي NasaqSkeleton.done().
   ========================================================================== */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 767px)').matches) return;

  const root = document.documentElement;
  const START = Date.now();
  const MIN_MS = 350;      /* أقل مدة عرض عشان ما يبقاش وميض */
  const MAX_MS = 7000;     /* أمان: لو حصل خطأ ما يفضلش الهيكل للأبد */
  const TAB_PAGES = ['home', 'shop', 'product', 'store', 'cart', 'profile'];
  const HOLD_PAGES = ['profile'];
  root.classList.add('sk-on');

  let finished = false, held = false, domReady = false;
  const made = [];

  /* ---------- قطع بناء ---------- */
  const sk = (cls, style) => '<i class="sk ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '></i>';
  const line = (w, h) => sk('sk-line ' + (w || 'w100') + (h ? ' ' + h : ''));
  const rail = (n, fn) => '<div class="sk-rail">' + Array.from({ length: n }, fn).join('') + '</div>';
  const mcard = () => '<div class="sk-mcard">' + sk() + line('w85') + line('w50') + line('w40', 'h16') + '</div>';
  const card = () => '<div class="sk-card">' + sk() + line('w85') + line('w50') + line('w40', 'h16') + '</div>';
  const head = () => '<div class="sk-head">' + line('w40', 'h20') + sk('sk-pill', 'width:74px;height:30px') + '</div>';
  const grid = (n) => '<div class="sk-grid">' + Array.from({ length: n }, card).join('') + '</div>';
  const cats = () => '<div class="sk-cats">' + Array.from({ length: 7 }, () => '<div class="sk-cat">' + sk('sk-circle') + line() + '</div>').join('') + '</div>';
  const lineItem = () => '<div class="sk-line-item">' + sk() + '<div class="sk-stack">' + line('w85') + line('w50') + line('w40', 'h16') + sk('sk-pill', 'width:96px;height:34px') + '</div></div>';
  const field = () => '<div class="sk-stack">' + line('w30') + sk('sk-input') + '</div>';

  /* ---------- هيكل كل صفحة ---------- */
  const SCREENS = {
    home: () => '<div class="sk-wrap">' + sk('sk-hero') + '<div class="sk-gap-lg">' + cats() + '</div>' +
      head() + rail(3, mcard) + head() + rail(3, mcard) + head() + rail(3, mcard) + '</div>',
    shop: () => '<div class="sk-wrap"><div class="sk-chips">' + Array.from({ length: 5 }, () => sk()).join('') + '</div>' +
      '<div class="sk-gap">' + line('w40') + '</div><div class="sk-gap">' + grid(6) + '</div></div>',
    store: () => '<div class="sk-wrap">' + sk('sk-banner') + '<div class="sk-row sk-gap">' + sk('sk-circle sk-avatar') +
      '<div class="sk-stack" style="flex:1">' + line('w60', 'h20') + line('w40') + '</div></div><div class="sk-gap-lg">' + grid(4) + '</div></div>',
    product: () => '<div class="sk-wrap">' + sk('sk-square') + '<div class="sk-dots">' + sk() + sk() + sk() + '</div>' +
      '<div class="sk-stack sk-gap-lg">' + line('w100', 'h20') + line('w70', 'h20') + line('w40') + line('w50', 'h28') + '</div>' +
      '<div class="sk-row sk-gap-lg">' + sk('sk-circle', 'width:34px;height:34px') + sk('sk-circle', 'width:34px;height:34px') + sk('sk-circle', 'width:34px;height:34px') + '</div>' +
      '<div class="sk-gap-lg">' + sk('sk-btn') + '</div><div class="sk-gap">' + sk('sk-btn') + '</div>' +
      '<div class="sk-stack sk-gap-lg">' + line() + line('w85') + line('w70') + '</div></div>',
    cart: () => '<div class="sk-wrap">' + line('w40', 'h28') + '<div class="sk-gap">' + lineItem() + lineItem() + lineItem() + '</div>' +
      '<div class="sk-gap-lg">' + sk('sk-panel') + '</div><div class="sk-gap">' + sk('sk-btn') + '</div></div>',
    checkout: () => '<div class="sk-wrap">' + line('w40', 'h28') + '<div class="sk-stack sk-gap" style="gap:16px">' + field() + field() + field() + field() + '</div>' +
      '<div class="sk-gap-lg">' + sk('sk-panel') + '</div><div class="sk-gap">' + sk('sk-btn') + '</div></div>',
    profile: () => '<div class="sk-wrap"><div class="sk-row">' + sk('sk-circle sk-avatar') + '<div class="sk-stack" style="flex:1">' + line('w60', 'h20') + line('w85') + '</div></div>' +
      '<div class="sk-stats sk-gap-lg">' + sk('sk-stat') + sk('sk-stat') + sk('sk-stat') + '</div>' +
      '<div class="sk-gap-lg">' + sk('sk-panel') + '</div><div class="sk-gap">' + lineItem() + lineItem() + '</div></div>',
    form: () => '<div class="sk-wrap">' + line('w60', 'h28') + '<div class="sk-gap">' + line('w85') + '</div>' +
      '<div class="sk-stack sk-gap-lg" style="gap:16px">' + field() + field() + field() + '</div><div class="sk-gap-lg">' + sk('sk-btn') + '</div></div>'
  };
  SCREENS.auth = SCREENS['become-seller'] = SCREENS['become-rider'] = SCREENS['application-status'] = SCREENS.form;

  const headerHTML = () => '<div class="sk-hdr" aria-hidden="true"><div class="sk-hdr__top">' + sk('', 'width:92px;height:26px;border-radius:8px') +
    '<div class="sk-row" style="gap:8px">' + sk('sk-circle', 'width:32px;height:32px') + sk('sk-circle', 'width:32px;height:32px') + '</div></div>' + sk('sk-hdr__search') + '</div>';
  const subnavHTML = () => '<div class="sk-subnav" aria-hidden="true">' + [70, 56, 84, 64, 76, 60, 80].map((w) => sk('', 'width:' + w + 'px')).join('') + '</div>';
  const tabbarHTML = () => '<div class="sk-tabbar" aria-hidden="true">' + Array.from({ length: 4 }, () => '<div class="sk-tab">' + sk('sk-circle') + sk() + '</div>').join('') + '</div>';

  function add(el, where, html, cls) {
    const t = document.createElement('div');
    t.innerHTML = html;
    const node = t.firstElementChild;
    if (cls) node.classList.add(cls);
    el.insertAdjacentElement(where, node);
    made.push(node);
    return node;
  }

  /* ---------- الحقن فور ظهور العناصر أثناء تحليل الصفحة ---------- */
  let hdrDone = false, mainDone = false, tabDone = false;
  function inject() {
    const body = document.body;
    if (!body) return;
    const page = body.dataset.page || '';
    if (!page || /^(admin|seller-dash|rider-dash)$/.test(page)) { finish(true); return; }
    if (HOLD_PAGES.indexOf(page) > -1) held = true;

    const header = document.getElementById('site-header');
    if (header && !hdrDone) {
      hdrDone = true;
      add(header, 'beforebegin', headerHTML());
      add(header, 'beforebegin', subnavHTML());
    }
    const main = document.getElementById('main');
    if (main && !mainDone) {
      mainDone = true;
      const key = SCREENS[page] ? page : 'form';
      const screen = add(main, 'afterbegin', '<div class="sk-screen" aria-hidden="true">' + SCREENS[key]() + '</div>');
      screen.setAttribute('role', 'presentation');
    }
    if (!tabDone && TAB_PAGES.indexOf(page) > -1) {
      tabDone = true;
      body.classList.add('has-tabbar');
      add(body, 'beforeend', tabbarHTML());
    }
    if (hdrDone && mainDone) obs.disconnect();
  }
  const obs = new MutationObserver(inject);
  obs.observe(root, { childList: true, subtree: true });
  inject();

  /* ---------- الإنهاء ---------- */
  function finish(now) {
    if (finished) return;
    finished = true;
    obs.disconnect();
    const remove = () => {
      root.classList.remove('sk-on', 'sk-out');
      made.forEach((n) => { if (n.parentNode) n.parentNode.removeChild(n); });
    };
    if (now) { remove(); return; }
    root.classList.add('sk-out');
    setTimeout(remove, 230);
  }
  function tryFinish() {
    if (finished || held || !domReady) return;
    const wait = Math.max(0, MIN_MS - (Date.now() - START));
    setTimeout(() => requestAnimationFrame(() => finish(false)), wait);
  }
  document.addEventListener('DOMContentLoaded', () => { domReady = true; tryFinish(); });
  setTimeout(() => finish(false), MAX_MS);

  /* ---------- صور أثناء التحميل ---------- */
  function watchImg(img) {
    if (img.complete || !img.getAttribute('src')) return;
    img.classList.add('sk-loading');
  }
  document.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'IMG') e.target.classList.remove('sk-loading'); }, true);
  document.addEventListener('error', (e) => { if (e.target && e.target.tagName === 'IMG') e.target.classList.remove('sk-loading'); }, true);
  new MutationObserver((list) => {
    list.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'IMG') watchImg(n);
      else if (n.querySelectorAll) n.querySelectorAll('img').forEach(watchImg);
    }));
  }).observe(root, { childList: true, subtree: true });

  window.NasaqSkeleton = {
    /* الصفحات اللي بتنتظر بيانات (حسابي…) تنادي done() بعد ما ترسم */
    done() { held = false; tryFinish(); },
    hold() { if (!finished) held = true; }
  };
})();
