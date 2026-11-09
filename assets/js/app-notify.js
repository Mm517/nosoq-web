/* ==========================================================================
   js/app-notify.js — إشعار بشكل إشعارات تطبيقات الموبايل
   يظهر مرة واحدة لكل جلسة (sessionStorage)، على الموبايل فقط، بعد ما تخلص
   شاشة الافتتاح (إن كانت ستُعرض) حتى ما يتزاحموش. مستقل تماماً ولا يعتمد
   على أي ملف تاني في المشروع.
   ========================================================================== */
(function () {
  'use strict';

  if (!window.matchMedia || !window.matchMedia('(max-width: 767px)').matches) return;

  var SESSION_KEY = 'nasaq-app-notify-seen';
  if (window.sessionStorage && window.sessionStorage.getItem(SESSION_KEY)) return;

  var MSG = { title: 'عروض اليوم بانتظارك', text: 'قطع جديدة وخصومات مختارة أُضيفت الآن — تصفّحها قبل ما تخلص.' };
  var AUTO_HIDE_MS = 6000;

  function markSeen() {
    if (window.sessionStorage) window.sessionStorage.setItem(SESSION_KEY, '1');
  }

  function build() {
    var el = document.createElement('div');
    el.className = 'app-notify';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="app-notify__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="32" height="32" rx="8" fill="#15171c"/><circle cx="16" cy="16" r="5" fill="#2f45d4"/>' +
        '</svg>' +
      '</div>' +
      '<div class="app-notify__body">' +
        '<div class="app-notify__meta"><span class="app-notify__app">نَسَق</span><span class="app-notify__dot">·</span><span class="app-notify__time">الآن</span></div>' +
        '<div class="app-notify__title"></div>' +
        '<div class="app-notify__text"></div>' +
      '</div>' +
      '<button type="button" class="app-notify__close" aria-label="إغلاق الإشعار">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>';
    el.querySelector('.app-notify__title').textContent = MSG.title;
    el.querySelector('.app-notify__text').textContent = MSG.text;
    return el;
  }

  function show() {
    if (window.sessionStorage && window.sessionStorage.getItem(SESSION_KEY)) return;

    var el = build();
    document.body.appendChild(el);

    var hideTimer = null;
    var startY = null;
    var dragging = false;

    function dismiss() {
      clearTimeout(hideTimer);
      markSeen();
      el.classList.remove('is-in');
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }

    el.querySelector('.app-notify__close').addEventListener('click', function (e) {
      e.stopPropagation();
      dismiss();
    });
    el.addEventListener('click', dismiss);

    el.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
      dragging = true;
      el.style.transition = 'none';
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (!dragging || startY == null) return;
      var dy = e.touches[0].clientY - startY;
      if (dy < 0) el.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      dragging = false;
      el.style.transition = '';
      var dy = e.changedTouches[0].clientY - (startY || 0);
      el.style.transform = '';
      startY = null;
      if (dy < -24) dismiss();
    });

    requestAnimationFrame(function () { el.classList.add('is-in'); });
    hideTimer = setTimeout(dismiss, AUTO_HIDE_MS);
  }

  function waitThenShow() {
    /* لو شاشة الافتتاح (intro.js) شغالة دلوقتي، ننتظر لحد ما تخلص عشان
       الإشعارين ما يتزاحموش فوق بعض. */
    if (document.documentElement.classList.contains('ni-lock')) {
      var settled = false;
      var mo = new MutationObserver(function () {
        if (settled || document.documentElement.classList.contains('ni-lock')) return;
        settled = true;
        mo.disconnect();
        setTimeout(show, 500);
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      /* شبكة أمان: لو الـ intro اتعطل لأي سبب، منستناش للأبد */
      setTimeout(function () {
        if (!settled) { settled = true; mo.disconnect(); show(); }
      }, 6000);
    } else {
      setTimeout(show, 900);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitThenShow);
  } else {
    waitThenShow();
  }
})();
