/* ==========================================================================
   js/nasaq-share.js — زرار «شارك»: بيشارك لينك من منصة اللينكس (مش من دومين المتجر).
   - اللينك بيتولّد تلقائياً في قاعدة البيانات مع كل منتج/متجر جديد (جدول share_links).
   - الزرار بيطلب الكود من الدالة ensure_share_link ويبني  <SHARE_BASE>/<code>.
   - لو منصة اللينكس أو الدالة مش متاحة: بنرجع للرابط الأصلي بدل ما الزرار يبوظ.
   الاستخدام:  NasaqShare.button({ kind:'product'|'store', id:<uuid>, title:'...' , cls:'...' })  ← HTML
               NasaqShare.bind(rootElement)                                                       ← يربط الأزرار
   ========================================================================== */
(function () {
  'use strict';
  var SHARE_BASE = (window.NASAQ_SHARE_BASE || 'https://nosoq-link.vercel.app').replace(/\/+$/, '');
  var cache = {};

  var ICON = '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function fetchCode(kind, id) {
    var key = kind + ':' + id;
    if (cache[key]) return Promise.resolve(cache[key]);
    var base = window.NASAQ_SUPABASE_URL, k = window.NASAQ_SUPABASE_ANON_KEY;
    if (!base || !k || !id) return Promise.reject(new Error('no-config'));
    return fetch(base + '/rest/v1/rpc/ensure_share_link', {
      method: 'POST',
      headers: { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: kind, p_ref: id })
    }).then(function (r) { if (!r.ok) throw new Error('http-' + r.status); return r.json(); })
      .then(function (code) { if (!code || typeof code !== 'string') throw new Error('no-code'); cache[key] = code; return code; });
  }

  /* لينك المشاركة: من منصة اللينكس، وإلا الرابط الأصلي */
  function resolveUrl(opts) {
    return fetchCode(opts.kind, opts.id).then(function (code) { return SHARE_BASE + '/' + code; })
      .catch(function () { return opts.fallbackUrl || location.href.split('#')[0]; });
  }

  function toast(msg) {
    if (window.UI && UI.toast) { UI.toast(msg); return; }
    var t = document.createElement('div'); t.textContent = msg; t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;inset-inline:0;bottom:90px;margin:auto;width:max-content;max-width:90%;background:#15171c;color:#fff;padding:10px 18px;border-radius:12px;z-index:99999;font-size:.95rem';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      try { var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); var r = document.execCommand('copy'); ta.remove(); r ? ok() : no(); } catch (e) { no(e); }
    });
  }

  function sheet(url, title) {
    var old = document.getElementById('nq-share'); if (old) old.remove();
    var u = encodeURIComponent(url), t = encodeURIComponent(title || '');
    var items = [
      ['واتساب', 'https://wa.me/?text=' + t + '%20' + u, '#25d366'],
      ['فيسبوك', 'https://www.facebook.com/sharer/sharer.php?u=' + u, '#1877f2'],
      ['تيليجرام', 'https://t.me/share/url?url=' + u + '&text=' + t, '#229ed9'],
      ['إكس', 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t, '#111']
    ];
    var el = document.createElement('div'); el.id = 'nq-share'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'مشاركة');
    el.innerHTML =
      '<style>#nq-share{position:fixed;inset:0;z-index:99998;display:grid;align-items:end;background:rgba(10,14,25,.5)}' +
      '#nq-share .box{background:var(--c-bg,#fff);color:var(--c-ink,#15171c);width:min(480px,100%);margin:auto;border-radius:18px 18px 0 0;padding:18px 18px 24px;box-shadow:0 -8px 30px rgba(0,0,0,.2)}' +
      '@media(min-width:600px){#nq-share{align-items:center}#nq-share .box{border-radius:18px}}' +
      '#nq-share h3{margin:0 0 12px;font-size:1.1rem;display:flex;justify-content:space-between;align-items:center}' +
      '#nq-share .x{border:0;background:transparent;font-size:1.5rem;cursor:pointer;color:inherit;line-height:1}' +
      '#nq-share .ch{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}' +
      '#nq-share .ch a{display:grid;justify-items:center;gap:6px;text-decoration:none;color:inherit;font-size:.85rem}' +
      '#nq-share .ch i{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;color:#fff;font-style:normal;font-weight:700}' +
      '#nq-share .ln{display:flex;gap:8px}#nq-share .ln input{flex:1;min-width:0;padding:10px 12px;border:1.5px solid var(--c-line-strong,#c5cad3);border-radius:10px;background:var(--c-surface,#f4f5f7);color:inherit;direction:ltr;font:inherit}' +
      '#nq-share .ln button{border:0;border-radius:10px;padding:0 18px;background:var(--c-ink,#15171c);color:var(--c-bg,#fff);cursor:pointer;font:inherit}</style>' +
      '<div class="box"><h3><span>شارك</span><button class="x" type="button" aria-label="إغلاق">×</button></h3>' +
      '<div class="ch">' + items.map(function (i) { return '<a href="' + esc(i[1]) + '" target="_blank" rel="noopener"><i style="background:' + i[2] + '">' + esc(i[0].charAt(0)) + '</i>' + esc(i[0]) + '</a>'; }).join('') + '</div>' +
      '<div class="ln"><input readonly value="' + esc(url) + '" aria-label="رابط المشاركة"><button type="button" class="cp">نسخ</button></div></div>';
    document.body.appendChild(el);
    var input = el.querySelector('input');
    function close() { el.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', function (e) { if (e.target === el || e.target.closest('.x')) close(); });
    el.querySelector('.cp').addEventListener('click', function () { copy(url).then(function () { toast('تم نسخ الرابط'); }, function () { input.select(); }); });
    input.addEventListener('focus', function () { input.select(); });
    el.querySelector('.cp').focus();
  }

  function open(opts) {
    return resolveUrl(opts).then(function (url) {
      if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        return navigator.share({ title: opts.title || '', text: opts.title || '', url: url }).catch(function (e) { if (e && e.name !== 'AbortError') sheet(url, opts.title); });
      }
      sheet(url, opts.title);
    });
  }

  function button(opts) {
    return '<button type="button" class="' + esc(opts.cls || 'share-btn') + '" data-nq-share data-kind="' + esc(opts.kind) + '" data-id="' + esc(opts.id) + '" data-title="' + esc(opts.title || '') + '" aria-label="مشاركة">' + ICON + (opts.label ? '<span>' + esc(opts.label) + '</span>' : '') + '</button>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-nq-share]');
    if (!b) return;
    e.preventDefault();
    open({ kind: b.getAttribute('data-kind'), id: b.getAttribute('data-id'), title: b.getAttribute('data-title') });
  });

  window.NasaqShare = { open: open, button: button, resolveUrl: resolveUrl, base: SHARE_BASE };
})();
