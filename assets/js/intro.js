/* ==========================================================================
   js/intro.js — شاشة افتتاح نَسَق (Intro Animation)
   لا يعتمد على أي مكتبة أو ملف آخر في المشروع. يبني الشاشة بجافاسكربت
   عادي ثم يشغّلها فوراً. تظهر مرة واحدة فقط لكل جلسة تصفح (sessionStorage).
   ========================================================================== */
(function () {
  'use strict';

  var SESSION_KEY = 'nasaq-intro-seen';
  if (window.sessionStorage && window.sessionStorage.getItem(SESSION_KEY)) return;

  var TIMINGS = { converge: 1750, word: 2450, logo: 3500, out: 4350, done: 4850 };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var root = document.createElement('div');
  root.className = 'ni';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', 'شاشة افتتاح نَسَق');
  root.innerHTML =
    '<div class="ni__bg"></div>' +
    '<button class="ni__skip" type="button">تخطي</button>' +
    '<div class="ni__stage">' +
      '<div class="ni__line-wrap">' +
        '<svg class="ni__line" viewBox="0 0 600 90" preserveAspectRatio="none">' +
          '<defs><linearGradient id="niLineGrad" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#2f45d4" stop-opacity="0"/>' +
            '<stop offset="0.15" stop-color="#2f45d4"/>' +
            '<stop offset="0.85" stop-color="#2f45d4"/>' +
            '<stop offset="1" stop-color="#2f45d4" stop-opacity="0"/>' +
          '</linearGradient></defs>' +
          '<path d="M580,45 H20" pathLength="100"/>' +
        '</svg>' +
        '<div class="ni__icons">' +
          '<div class="ni__icon ni__icon--buyer">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>' +
            '</svg></div>' +
          '<span class="ni__label">المشتري</span>' +
          '<div class="ni__icon ni__icon--seller">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M4 9l1-4h14l1 4"/><path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v9h14V9"/><path d="M9 18v-5h6v5"/>' +
            '</svg></div>' +
          '<span class="ni__label">البائع</span>' +
          '<div class="ni__icon ni__icon--driver">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="6" cy="18" r="2.6"/><circle cx="17" cy="18" r="2.6"/><path d="M6 18h4l2-5h4l2 4h1.5"/><path d="M10.5 13l1.8-3.4H15"/>' +
            '</svg></div>' +
          '<span class="ni__label">السائق</span>' +
        '</div>' +
      '</div>' +
      '<span class="ni__word">نَسَق<span class="ni__dot"></span></span>' +
    '</div>';

  document.body.insertBefore(root, document.body.firstChild);

  var stage = root.querySelector('.ni__stage');
  var lineSvg = root.querySelector('.ni__line');
  var linePath = root.querySelector('.ni__line path');
  var timers = [];
  var done = false;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* يحسب مسافة كل أيقونة عن مركز المسرح بدقة، فتتجمع بشكل صحيح على أي مقاس شاشة */
  function computeConvergeOffsets() {
    var stageRect = stage.getBoundingClientRect();
    var centerX = stageRect.left + stageRect.width / 2;
    var els = root.querySelectorAll('.ni__icon, .ni__label');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      var elCenter = r.left + r.width / 2;
      els[i].style.setProperty('--ni-dx', (centerX - elCenter) + 'px');
    }
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* يحوّل الخط المستقيم إلى دايرة مقفولة عبر تغيير d الخاص بالـ path تدريجياً
     (بدون أي مكتبة morph — حساب نقاط يدوي + requestAnimationFrame). */
  function buildLineToCircleFrames() {
    var N = 48;
    var x1 = 580, x2 = 20, y = 45; // نفس إحداثيات "M580,45 H20"
    var linePts = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1);
      linePts.push([x1 + (x2 - x1) * t, y]);
    }

    // تصحيح نصف القطر حسب نسبة تمدد الـ viewBox الفعلية، عشان الدايرة تطلع دايرة حقيقية
    // على الشاشة مش بيضاوية، حتى لو حاوية الـ SVG مستطيلة.
    var vb = lineSvg.viewBox.baseVal;
    var rect = lineSvg.getBoundingClientRect();
    var sx = rect.width / vb.width;
    var sy = rect.height / vb.height;
    var pixelRadius = 40;
    var rx = pixelRadius / sx;
    var ry = pixelRadius / sy;
    var cx = vb.x + vb.width / 2;
    var cy = vb.y + vb.height / 2;

    var circPts = [];
    var startAngle = -Math.PI / 2;
    for (var j = 0; j < N; j++) {
      var a = startAngle + (2 * Math.PI) * (j / (N - 1));
      circPts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return { line: linePts, circle: circPts };
  }

  function pointsToPath(pts) {
    var d = '';
    for (var i = 0; i < pts.length; i++) {
      d += (i === 0 ? 'M' : 'L') + pts[i][0].toFixed(2) + ',' + pts[i][1].toFixed(2) + ' ';
    }
    return d;
  }

  function morphLineToCircle(duration, onDone) {
    var frames = buildLineToCircleFrames();
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var t = Math.min(1, (ts - startTime) / duration);
      var e = easeInOutCubic(t);
      var pts = [];
      for (var i = 0; i < frames.line.length; i++) {
        var lx = frames.line[i][0], ly = frames.line[i][1];
        var cx2 = frames.circle[i][0], cy2 = frames.circle[i][1];
        pts.push([lx + (cx2 - lx) * e, ly + (cy2 - ly) * e]);
      }
      linePath.setAttribute('d', pointsToPath(pts));
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  function finish() {
    if (done) return;
    done = true;
    clearTimers();
    if (window.sessionStorage) window.sessionStorage.setItem(SESSION_KEY, '1');
    if (root.parentNode) root.parentNode.removeChild(root);
    document.documentElement.classList.remove('ni-lock');
  }

  function skip() {
    if (done) return;
    clearTimers();
    root.classList.add('is-out');
    timers.push(setTimeout(finish, 350));
  }

  root.addEventListener('click', skip);
  root.querySelector('.ni__skip').addEventListener('click', function (e) {
    e.stopPropagation();
    skip();
  });

  /* يمنع تمرير الصفحة خلف الشاشة أثناء عرض الـ Intro */
  document.documentElement.classList.add('ni-lock');

  requestAnimationFrame(function () {
    computeConvergeOffsets();
  });

  if (reduced) {
    var f = buildLineToCircleFrames();
    linePath.setAttribute('d', pointsToPath(f.circle));
    root.classList.add('is-converge', 'is-word', 'is-logo');
    timers.push(setTimeout(function () { root.classList.add('is-out'); }, 500));
    timers.push(setTimeout(finish, 900));
  } else {
    timers.push(setTimeout(function () {
      root.classList.add('is-converge');
      morphLineToCircle(650);
    }, TIMINGS.converge));
    timers.push(setTimeout(function () { root.classList.add('is-word'); }, TIMINGS.word));
    timers.push(setTimeout(function () { root.classList.add('is-logo'); }, TIMINGS.logo));
    timers.push(setTimeout(function () { root.classList.add('is-out'); }, TIMINGS.out));
    timers.push(setTimeout(finish, TIMINGS.done));
  }
})();
