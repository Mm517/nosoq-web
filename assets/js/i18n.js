/* ==========================================================================
   js/i18n.js — نظام الترجمة المركزي (window.I18n) — العربية / English / Deutsch

   • اللغة الافتراضية: العربية. اللغة المختارة تُحفظ في localStorage (nasaq_lang_v1).
   • الاتجاه: ar → rtl ، en/de → ltr (الاتجاه نتيجة اللغة وليس هو الترجمة).
   • t('add_to_cart')           ← مفتاح من القاموس (js/i18n-dict.js → keys)
   • t('نص عربي {n}')           ← أو نص عربي موجود في القاموس (phrases)
   • data-i18n="key"            ← ترجمة عنصر ثابت في HTML (وكذلك data-i18n-placeholder / -title / -aria-label)
   • تلقائياً: كل نص عربي يظهر في الصفحة (نصوص + placeholder/title/aria-label/alt + alert/confirm)
     يُترجم من القاموس، بما فيه المحتوى الذي يرسمه الجافاسكربت لاحقاً (MutationObserver).
   • بيانات الداتابيس (المنتجات/الأقسام): تُسجَّل عبر I18n.register({...}) من products.js بترتيب
     fallback:  Deutsch → English → العربية   |   English → العربية.
   • لا اتصال بأي خدمة ترجمة خارجية.
   ========================================================================== */
(function () {
  'use strict';
  if (window.I18n && window.I18n.__v === 2) return;

  const KEY = 'nasaq_lang_v1';
  const DEFAULT = 'ar';
  /* [الكود، الاسم بلغته، الاتجاه] */
  /* الموقع عربي فقط — باقي اللغات اتشالت */
  const LANGS = [['ar', 'العربية', 'rtl']];
  const IDX = { ar: 0, en: 1, de: 2 };
  const DICT = window.NASAQ_I18N_DICT || { keys: {}, phrases: {} };
  const AR_RE = /[\u0600-\u06FF]/;
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, SVG: 1, IFRAME: 1 };

  let observer = null, applying = false, booted = false, scheduled = false;

  /* ---------- اللغة الحالية ---------- */
  const valid = (c) => LANGS.some((l) => l[0] === c);
  function stored() { try { localStorage.removeItem(KEY); } catch (_) { /* تجاهل */ } return DEFAULT; }
  let lang = stored();
  const by = (c) => LANGS.find((l) => l[0] === c) || LANGS[0];
  const dirOf = (c) => (by(c)[2] === 'rtl' ? 'rtl' : 'ltr');
  const current = () => lang;

  function applyDir(code) {
    const root = document.documentElement;
    root.setAttribute('dir', dirOf(code));
    root.setAttribute('lang', code);
  }

  /* ---------- القواميس ---------- */
  const keyTable = DICT.keys || {};
  const phrases = new Map();                 /* عربي مُطبَّع ({n}) → [en, de] */
  Object.keys(DICT.phrases || {}).forEach((k) => phrases.set(k, DICT.phrases[k]));
  const dyn = new Map();                     /* بيانات الداتابيس: نص عربي حرفي → [ar, en, de] */
  let fragList = null, fragRe = null;        /* بناء كسول لوضع الأجزاء */
  const cache = new Map();                   /* lang|text → ناتج */

  const collapse = (s) => String(s).replace(/\s+/g, ' ').trim();

  /* تسجيل ترجمات ديناميكية: { 'اسم عربي': { en:'..', de:'..' } } — fallback de→en→ar و en→ar */
  function register(map, opts) {
    const asPhrase = !!(opts && opts.phrase);
    Object.keys(map || {}).forEach((ar) => {
      const v = map[ar] || {};
      const k = collapse(ar);
      if (!k) return;
      const en = (v.en && String(v.en).trim()) || '';
      const de = (v.de && String(v.de).trim()) || '';
      const row = [ar, en || ar, de || en || ar];
      if (asPhrase) { if (en || de) { phrases.set(k, [row[1], row[2]]); fragList = null; } }
      else dyn.set(k, row);
    });
    cache.clear();
    if (booted) retranslate();
  }
  (window.NASAQ_I18N_PENDING || []).forEach((p) => register(p.map, p.opts));
  window.NASAQ_I18N_PENDING = { push(p) { register(p.map, p.opts); } };

  /* ---------- الترجمة ---------- */
  const NUM_RE = /\d+(?:[.,]\d+)*/g;

  function buildFrags() {
    fragList = [];
    phrases.forEach((v, k) => {
      if (k.indexOf('{n}') > -1 && k.replace(/\{n\}/g, '').replace(/[^\u0600-\u06FF]/g, '').length < 4) return;
      const letters = k.replace(/[^\u0600-\u06FF]/g, '');
      if (letters.length < 3) return;
      fragList.push(k);
    });
    fragList.sort((a, b) => b.length - a.length);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{n\\\}/g, '\\{n\\}');
    try {
      fragRe = new RegExp('(?<![\\u0600-\\u06FF])(?:' + fragList.map(esc).join('|') + ')(?![\\u0600-\\u06FF])', 'g');
    } catch (_) { fragRe = null; }
  }

  function fill(str, nums) {
    let i = 0;
    return str.replace(/\{n\}/g, () => (i < nums.length ? nums[i++] : ''));
  }

  /* يترجم نصاً عربياً إلى لغة code (يُرجع نفس النص لو لا ترجمة) */
  function tr(text, code) {
    code = code || lang;
    if (code === 'ar' || !text || !AR_RE.test(text)) return text;
    const ck = code + '|' + text;
    if (cache.has(ck)) return cache.get(ck);
    const lead = (text.match(/^\s*/) || [''])[0], trail = (text.match(/\s*$/) || [''])[0];
    const core = collapse(text);
    const idx = IDX[code];
    let out = null;

    /* 1) بيانات الداتابيس (أسماء/أوصاف المنتجات، أسماء الأقسام) — تطابق حرفي */
    const d = dyn.get(core);
    if (d) out = d[idx];

    /* 2) القاموس: تطابق كامل مع تطبيع الأرقام */
    if (out == null) {
      const nums = core.match(NUM_RE) || [];
      const norm = core.replace(NUM_RE, '{n}');
      const hit = phrases.get(norm);
      if (hit) out = fill(hit[idx - 1], nums);
      else {
        /* 3) أجزاء: نترجم العبارات المعروفة داخل النص (مثل «حذف X من السلة») */
        if (!fragList) buildFrags();
        if (fragRe) {
          fragRe.lastIndex = 0;
          let changed = false;
          const res = norm.replace(fragRe, (m) => { const h = phrases.get(m); if (h) { changed = true; return h[idx - 1]; } return m; });
          if (changed) out = fill(res, nums);
        }
      }
    }
    const result = out == null ? text : lead + out + trail;
    if (cache.size > 6000) cache.clear();
    cache.set(ck, result);
    return result;
  }

  /* t(key | نص عربي, vars) */
  function t(key, vars) {
    let s;
    const row = keyTable[key];
    if (row) s = row[IDX[lang]] || row[0];
    else s = tr(String(key), lang);
    if (vars) Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  /* اسم/وصف من كائن ترجمات {ar,en,de} مع fallback: de→en→ar ، en→ar */
  function pick(obj, field) {
    if (!obj) return '';
    const g = (l) => { const v = obj[field + '_' + l] != null ? obj[field + '_' + l] : (obj[field + (l[0].toUpperCase() + l.slice(1))]); return v && String(v).trim() ? v : ''; };
    if (lang === 'de') return g('de') || g('en') || g('ar') || obj[field] || '';
    if (lang === 'en') return g('en') || g('ar') || obj[field] || '';
    return g('ar') || obj[field] || '';
  }

  /* ---------- ترجمة DOM ---------- */
  const nodeState = new WeakMap();   /* TextNode → { orig, out } */
  const attrState = new WeakMap();   /* Element → { attr: { orig, out } } */
  const pendingRoots = new Set();

  function skipEl(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentNode) {
      if (SKIP_TAGS[n.tagName] || n.isContentEditable) return true;
      if (n.classList && n.classList.contains('notranslate')) return true;
      if (n.getAttribute && (n.getAttribute('translate') === 'no' || n.hasAttribute('data-no-i18n'))) return true;
    }
    return false;
  }

  function doText(node) {
    const st = nodeState.get(node);
    let src;
    if (st && node.data === st.out) src = st.orig;      /* نصنا نحن — الأصل محفوظ */
    else src = node.data;                                /* نص جديد من الصفحة */
    if (!AR_RE.test(src)) { if (st) nodeState.delete(node); return; }
    const out = lang === 'ar' ? src : tr(src, lang);
    if (out !== node.data) node.data = out;
    nodeState.set(node, { orig: src, out });
  }

  function doAttr(el, a) {
    const cur = el.getAttribute(a);
    if (cur == null) return;
    const map = attrState.get(el) || {};
    const st = map[a];
    const src = st && cur === st.out ? st.orig : cur;
    if (!AR_RE.test(src)) { if (st) delete map[a]; return; }
    const out = lang === 'ar' ? src : tr(src, lang);
    if (out !== cur) el.setAttribute(a, out);
    map[a] = { orig: src, out };
    attrState.set(el, map);
  }

  function doKeyed(el) {
    /* data-i18n="key" وأخواتها — تُترجم من المفتاح مباشرة بغض النظر عن لغة النص الحالي */
    const k = el.getAttribute('data-i18n');
    if (k) el.textContent = t(k);
    ATTRS.forEach((a) => { const kk = el.getAttribute('data-i18n-' + a); if (kk) el.setAttribute(a, t(kk)); });
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (root.parentNode && !skipEl(root.parentNode)) doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && skipEl(root)) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType === 1 && (SKIP_TAGS[n.tagName] || (n.classList && n.classList.contains('notranslate')) || n.getAttribute('translate') === 'no' || n.hasAttribute('data-no-i18n'))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    if (root.nodeType === 1) { ATTRS.forEach((a) => doAttr(root, a)); if (root.hasAttribute('data-i18n') || ATTRS.some((a) => root.hasAttribute('data-i18n-' + a))) doKeyed(root); }
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else {
        ATTRS.forEach((a) => doAttr(n, a));
        if (n.hasAttribute('data-i18n') || ATTRS.some((a) => n.hasAttribute('data-i18n-' + a))) doKeyed(n);
        if ((n.tagName === 'INPUT') && /^(button|submit|reset)$/i.test(n.type)) doAttr(n, 'value');
      }
    }
  }

  function doMeta() {
    if (!document.head) return;
    const t0 = document.title; /* العنوان */
    const st = nodeState.get(document);
    const src = st && t0 === st.out ? st.orig : t0;
    if (AR_RE.test(src)) { const out = lang === 'ar' ? src : tr(src, lang); if (out !== t0) document.title = out; nodeState.set(document, { orig: src, out }); }
    const md = document.querySelector('meta[name="description"]');
    if (md) doAttr(md, 'content');
  }

  function run(roots) {
    applying = true;
    try { roots.forEach(walk); doMeta(); } finally {
      if (observer) observer.takeRecords();
      applying = false;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    const go = () => { scheduled = false; const r = Array.from(pendingRoots); pendingRoots.clear(); if (r.length) run(r); };
    (window.requestAnimationFrame || setTimeout)(go);
  }

  function startObserver() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver((recs) => {
      if (applying) return;
      recs.forEach((r) => {
        if (r.type === 'childList') r.addedNodes.forEach((n) => pendingRoots.add(n));
        else if (r.type === 'characterData') pendingRoots.add(r.target);
        else if (r.type === 'attributes') pendingRoots.add(r.target);
      });
      schedule();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['data-i18n']) });
  }

  function retranslate() {
    if (!document.body) return;
    run([document.documentElement]);
  }

  /* alert / confirm / prompt تُترجَم تلقائياً */
  function wrapDialogs() {
    ['alert', 'confirm', 'prompt'].forEach((fn) => {
      const orig = window[fn];
      if (typeof orig !== 'function' || orig.__i18n) return;
      const w = function (msg) { const a = Array.prototype.slice.call(arguments); if (typeof a[0] === 'string') a[0] = tr(a[0], lang); return orig.apply(window, a); };
      w.__i18n = true;
      window[fn] = w;
    });
  }

  /* ---------- الواجهة (Language Switcher) ---------- */
  const label = () => by(lang)[1];
  const shortCode = () => lang.toUpperCase();

  function modalHTML(icon) {
    return ''; /* لا نافذة لغات */
    return '<div class="modal modal--lang" id="lang-modal" role="dialog" aria-modal="true" aria-labelledby="lang-title" aria-hidden="true">' +
      '<div class="modal__head"><h2 id="lang-title" data-no-i18n>' + t('language') + ' / Language / Sprache</h2>' +
        '<button type="button" class="icon-btn" data-panel-close aria-label="' + t('close') + '" data-i18n-aria-label="close">' + icon('close') + '</button></div>' +
      '<div class="modal__body">' +
        '<div class="lang-grid notranslate" translate="no" role="radiogroup" aria-label="Language">' +
          LANGS.map((l) => '<button type="button" class="chip lang" role="radio" lang="' + l[0] + '" dir="' + l[2] + '" aria-checked="' + (l[0] === lang) + '" data-lang="' + l[0] + '">' + l[1] + '</button>').join('') +
        '</div>' +
      '</div></div>';
  }

  function refreshSwitcher() {
    document.querySelectorAll('.lang-btn__code').forEach((el) => { el.textContent = shortCode(); });
    document.querySelectorAll('.sidenav__loc strong').forEach((el) => { if (el.closest('[data-lang-open]')) el.textContent = label(); });
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === lang)));
  }

  /* تغيير اللغة فوراً بدون إعادة تحميل الصفحة */
  function set(code) {
    return; /* عربي فقط */
    if (!valid(code)) return;
    lang = code;
    try { localStorage.setItem(KEY, code); } catch (_) { /* تجاهل */ }
    applyDir(code);
    cache.clear();
    retranslate();
    refreshSwitcher();
    const closeBtn = document.querySelector('#lang-modal [data-panel-close]');
    if (closeBtn) closeBtn.click();
    try { window.dispatchEvent(new CustomEvent('nasaq:langchange', { detail: { lang: code, dir: dirOf(code) } })); } catch (_) { /* تجاهل */ }
  }

  function boot() {
    if (booted) { return; }
    booted = true;
    applyDir(lang);
    try { document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch (_) { /* كوكي قديمة من نظام جوجل */ }
    wrapDialogs();
    retranslate();
    refreshSwitcher();
    startObserver();
  }

  window.I18n = { __v: 2, LANGS, current, set, boot, label, shortCode, modalHTML, dirOf, t, tr, pick, register, translateDom: retranslate };
  window.t = window.t || t;

  /* الاتجاه مبكراً لتجنّب وميض الاتجاه الخاطئ، والتشغيل التلقائي عند جاهزية الصفحة */
  applyDir(lang);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
