/* ==========================================================================
   js/nasaq-links.js — الربط بين منصات نَسَق التلاتة:
     main   = المتجر (المشتري + الأدمن)
     seller = لوحة البائع
     driver = لوحة المندوب
   لازم يتحمّل أول سكربت في <head> (بعد nasaq-config.js وقبل api-shim.js).

   بيعمل 3 حاجات:
   1) روابط المنصات: عدّل العناوين تحت (NASAQ_LINKS) في كل مشروع لو الدومين اتغيّر.
   2) تمرير الجلسة: لما المستخدم يضغط رابط لمنصة تانية بنضيف الجلسة في الـ #fragment
      (الـ fragment عمره ما بيتبعت للسيرفر)، والمنصة التانية بتقراها وتمسحها من الرابط فوراً،
      فيفتح مسجّل دخول من غير ما يكتب بياناته تاني. (localStorage مش مشترك بين الدومينات.)
   3) توجيه الروابط: أي رابط داخل المشروع لصفحة بتاعة منصة تانية بيتحوّل لها تلقائياً.
   ========================================================================== */
(function () {
  'use strict';

  /* ======== إعدادات المشروع ======== */
  var ME = 'main';   /* ← 'main' | 'seller' | 'driver' (بيتغيّر لكل مشروع) */
  var LINKS = window.NASAQ_LINKS = {
    main:   'https://nosoq-shop.vercel.app',          /* ← غيّره لدومين المتجر الفعلي */
    seller: 'https://nosoq-seller.vercel.app',
    driver: 'https://nosoq-driver.vercel.app'
  };
  /* ================================= */

  window.NASAQ_PLATFORM = ME;
  var K_TOKEN = 'nasaq_access_token_v1', K_SESSION = 'nasaq_session_v1', H_AUTH = 'nq_auth', H_HASH = 'nq_hash';

  function b64enc(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64dec(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------- 1) استلام الجلسة القادمة من منصة تانية ---------- */
  try {
    if (location.hash.indexOf(H_AUTH + '=') > -1) {
      var hp = new URLSearchParams(location.hash.slice(1));
      var raw = hp.get(H_AUTH), back = hp.get(H_HASH) || '';
      if (raw) {
        var pay = JSON.parse(b64dec(raw));
        if (pay && pay.t) {
          localStorage.setItem(K_TOKEN, pay.t);
          if (pay.u) localStorage.setItem(K_SESSION, pay.u);
        }
      }
      /* امسح الجلسة من شريط العنوان والتاريخ فوراً */
      history.replaceState(null, '', location.pathname + location.search + (back ? '#' + back : ''));
    }
  } catch (_) { /* لو فشل، المستخدم هيسجّل دخول عادي */ }

  /* ---------- 2) بناء الروابط ---------- */
  function authHash(extraHash) {
    var parts = [];
    try {
      var t = localStorage.getItem(K_TOKEN), u = localStorage.getItem(K_SESSION);
      if (t) parts.push(H_AUTH + '=' + b64enc(JSON.stringify({ t: t, u: u || '' })));
    } catch (_) { /* تجاهل */ }
    if (extraHash) parts.push(H_HASH + '=' + encodeURIComponent(extraHash.replace(/^#/, '')));
    return parts.length ? '#' + parts.join('&') : '';
  }
  function url(platform, path) { return (LINKS[platform] || '').replace(/\/+$/, '') + (path || '/'); }
  function go(platform, path, newTab) {
    var m = String(path || '/').match(/^([^#]*)(#.*)?$/);
    var target = url(platform, m[1]) + authHash(m[2]);
    if (newTab) window.open(target, '_blank'); else location.assign(target);
  }

  /* ---------- 3) مين صاحب الصفحة؟ ---------- */
  function ownerOf(path, inChrome) {
    if (path === '/seller')         return ['seller', '/'];
    if (path === '/become-seller')  return ['seller', '/become-seller'];
    if (path === '/rider')          return ['driver', '/'];
    if (path === '/become-rider')   return ['driver', '/become-rider'];
    if (path === '/application-status') return [ME === 'main' ? 'seller' : ME, path];
    if (ME === 'main') return ['main', path];
    /* seller/driver: لوحة التحكم على "/" — إلا لو الرابط جاي من هيدر/فوتر المتجر (شعار الموقع) فده بيرجع للمتجر */
    if (path === '/' && !inChrome) return [ME, '/'];
    return ['main', path];
  }
  function platformOfOrigin(origin) {
    for (var k in LINKS) { try { if (new URL(LINKS[k]).origin === origin) return k; } catch (_) { /* تجاهل */ } }
    return null;
  }

  function onClick(e) {
    if (e.defaultPrevented && e.type === 'click') return;
    if (e.type === 'click' && e.button !== 0) return;
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var raw = a.getAttribute('href') || '';
    if (/^(#|mailto:|tel:|javascript:)/i.test(raw) || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.href, location.href); } catch (_) { return; }
    var plat, path;
    if (u.origin === location.origin) {
      var o = ownerOf(u.pathname, !!a.closest('#site-header,#site-footer,#tabbar,.site-header,.site-footer'));
      plat = o[0]; path = o[1];
    } else {
      plat = platformOfOrigin(u.origin); path = u.pathname;
      if (!plat) return;                 /* رابط خارجي عادي */
    }
    if (plat === ME && u.origin === location.origin) return;   /* صفحة من نفس المنصة */
    e.preventDefault();
    var newTab = a.target === '_blank' || e.type === 'auxclick' || e.ctrlKey || e.metaKey;
    go(plat, path + u.search + u.hash, newTab);
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);

  window.NasaqLinks = { url: url, go: go, platform: ME, links: LINKS, authHash: authHash };
})();
