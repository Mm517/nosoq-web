/* ==========================================================================
   js/cart-page.js — صفحة السلة: قائمة البنود + الملخص + الحالة الفارغة
   (منطق التعديل نفسه مفوَّض في ui.js عبر data-cart-action)
   ========================================================================== */
(function () {
  'use strict';
  const root = document.getElementById('cart-root');
  if (!root) return;

  function render() {
    const ls = Cart.lines();
    if (!ls.length) {
      root.innerHTML =
        UI.emptyHTML({
          icon: 'bag', title: 'سلتك فارغة',
          text: 'لم تضف أي منتج بعد. اكتشف أحدث القطع وأضف ما يعجبك.',
          actions: [{ label: 'ابدأ التسوق', href: '/shop', primary: true }, { label: 'المفضلة', href: '/shop?wishlist=1' }]
        }) +
        '<section class="suggest" aria-labelledby="sg-title"><h2 id="sg-title">الأكثر تقييماً</h2><div class="grid grid--4">' +
        UI.cards(Products.all().filter((p) => !Products.isSoldOut(p)).sort((a, b) => b.rating - a.rating).slice(0, 4)) + '</div></section>';
      return;
    }
    const t = Cart.totals();
    root.innerHTML =
      '<div class="cart-layout">' +
        '<section aria-labelledby="items-title"><h2 class="sr-only" id="items-title" tabindex="-1" data-focus-after-remove>المنتجات في السلة</h2>' +
          '<ul class="lines lines--page">' + ls.map(UI.lineHTML).join('') + '</ul>' +
          '<div class="cart-actions"><a class="btn btn--ghost" href="/shop">متابعة التسوق</a>' +
          '<button type="button" class="link-btn" data-clear-cart>إفراغ السلة</button></div>' +
        '</section>' +
        '<aside class="cart-summary" aria-label="ملخص الطلب">' + UI.summaryHTML(t, { cta: 'checkout', uid: 'cart' }) + '</aside>' +
      '</div>';
  }

  /* زر يحتاج تأكيداً (بدل confirm()): أول نقرة تُسلّحه وتغيّر نصه، والثانية تنفّذ */
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-clear-cart]');
    if (!btn) return;
    if (btn.dataset.armed) {
      delete btn.dataset.armed;
      Cart.clear();
      UI.announce('تم إفراغ السلة');
      return;
    }
    btn.dataset.armed = '1';
    btn.dataset.label = btn.textContent;
    btn.textContent = 'اضغط للتأكيد';
    setTimeout(() => {
      if (btn.isConnected && btn.dataset.armed) {
        delete btn.dataset.armed;
        btn.textContent = btn.dataset.label;
      }
    }, 3500);
  });

  Cart.subscribe(render);
  render();
})();
