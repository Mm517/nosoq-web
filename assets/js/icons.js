/* نَسَق — مكتبة أيقونات SVG موحّدة (بديل الإيموجي).
   الاستخدام من JS:   NIcon('truck')  أو  NIcon('bell', {size: 16})
   الاستخدام من HTML: <i data-icon="truck"></i>  (تتحوّل تلقائياً عند تحميل الصفحة، أو استدعِ NIcon.hydrate(root)) */
(function () {
  'use strict';
  var P = {
    truck: '<path d="M1 4h13v12H1zM14 8h4l3 3v5h-7"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    store: '<path d="M3 9l1-5h16l1 5M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 12v8h14v-8M10 20v-5h4v5"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>',
    'bell-off': '<path d="M13.7 21a2 2 0 01-3.4 0M18.6 13a17.9 17.9 0 01-1.6-5 6 6 0 00-9.3-5M6.3 6.3A6 6 0 006 8c0 7-3 9-3 9h14M1 1l22 22"/>',
    lifebuoy: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M4.9 19.1l4.3-4.3"/>',
    clip: '<path d="M21 12l-8.5 8.5a5 5 0 01-7-7L14 5a3.3 3.3 0 014.7 4.7L10 18.4a1.7 1.7 0 01-2.4-2.4L15 8.6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    headset: '<path d="M3 14v-2a9 9 0 0118 0v2"/><path d="M21 14v3a2 2 0 01-2 2h-1v-6h3zM3 14v3a2 2 0 002 2h1v-6H3zM18 19v1a2 2 0 01-2 2h-3"/>',
    chat: '<path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-5.4A8 8 0 1121 12z"/>',
    'chev-left': '<path d="M15 6l-6 6 6 6"/>',
    'chev-right': '<path d="M9 6l6 6-6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0020.5 15"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v9"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 8h6M9 12h6"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'
  };
  function NIcon(name, opt) {
    opt = opt || {};
    var s = opt.size || 18, body = P[name];
    if (!body) return '';
    return '<svg class="ic ic-' + name + (opt.cls ? ' ' + opt.cls : '') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="' + (opt.stroke || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  NIcon.hydrate = function (root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.dataset.iconDone) return;
      el.innerHTML = NIcon(el.dataset.icon, { size: Number(el.dataset.size) || 18 });
      el.dataset.iconDone = '1';
    });
  };
  NIcon.names = Object.keys(P);
  window.NIcon = NIcon;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { NIcon.hydrate(); });
  else NIcon.hydrate();
})();
