/* ==========================================================================
   js/wizard.js — مكوّن Wizard (رحلة على مراحل) قابل لإعادة الاستخدام.
   يُستخدم في: /auth (مشتري) · /become-seller · /become-rider

   • المراحل تُكتب في الـ HTML كـ <section class="wz-step" data-step="id" data-label="مفتاح_ترجمة">.
   • التحقق إعلاني: data-rules="required email phone nid password:6 match:#id image checked".
   • كل النصوص تأتي من القاموس المركزي (js/i18n-dict.js) عبر t('wz_...') — لا نصوص عربية هنا.
   • المسودة تُحفظ في sessionStorage (بدون كلمات المرور ولا الملفات) وتُستعاد بعد الـ refresh.
   • window.Wizard.create({ root, id, steps, summary, draft, submit, success })
   ========================================================================== */
(function () {
  'use strict';
  if (window.Wizard) return;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const tt = (k, v) => (typeof window.t === 'function' ? window.t(k, v) : k);
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- أرقام عربية/فارسية → لاتينية (للتحقق من الهاتف والرقم القومي) ---------- */
  function digits(s) {
    return String(s == null ? '' : s)
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  }

  /* ---------- قواعد التحقق (ترجع null لو سليم، أو مفتاح رسالة، أو [مفتاح، متغيرات]) ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  /* موبايل مصري: 010/011/012/015 + 8 أرقام، مع قبول +20 أو 0020 أو بدون الصفر الأول */
  const PHONE_RE = /^(?:\+?20|0020|0)?1[0125]\d{8}$/;
  const MAX_FILE = 25 * 1024 * 1024;   /* الصورة تُصغَّر قبل الرفع؛ هذا سقف الملف الأصلي فقط */

  const rules = {
    required(v, el) {
      if (el.type === 'checkbox') return el.checked ? null : 'wz_err_required';
      return String(v).trim() ? null : 'wz_err_required';
    },
    checked(v, el) { return el.checked ? null : 'wz_err_terms'; },
    email(v) { return !v.trim() || EMAIL_RE.test(v.trim()) ? null : 'wz_err_email'; },
    phone(v) {
      const s = digits(v).replace(/[\s\-().]/g, '');
      return !s || PHONE_RE.test(s) ? null : 'wz_err_phone';
    },
    nid(v) {
      const s = digits(v).replace(/\s/g, '');
      return !s || /^\d{14}$/.test(s) ? null : 'wz_err_nid';
    },
    password(v, el, arg) { return !v || v.length >= (+arg || 6) ? null : ['wz_err_pass_min', { n: +arg || 6 }]; },
    match(v, el, arg) {
      const other = $(arg, el.form || document);
      return !other || v === other.value ? null : 'wz_err_pass_match';
    },
    image(v, el) {
      const f = el.files && el.files[0];
      if (!f) return null;
      if (!/^image\//.test(f.type)) return 'wz_err_file_type';
      if (f.size > MAX_FILE) return 'wz_err_file_big';
      return null;
    }
  };

  class WizardError extends Error {
    /* o = { step: معرّف المرحلة، field: اسم الحقل، key: مفتاح ترجمة، vars } — لو مفيش key نعرض message كما هي */
    constructor(message, o) {
      super(message || '');
      o = o || {};
      this.name = 'WizardError';
      this.step = o.step || null;
      this.field = o.field || null;
      this.key = o.key || null;
      this.vars = o.vars || null;
    }
  }

  /* ---------- مؤشر قوة كلمة المرور ---------- */
  function strengthLevel(p) {
    if (!p) return 0;
    if (p.length < 6) return 1;
    const pts = (p.length >= 6 ? 1 : 0) + (p.length >= 10 ? 1 : 0) + (/[a-z]/.test(p) && /[A-Z]/.test(p) ? 1 : 0) +
      (/\d/.test(p) ? 1 : 0) + (/[^A-Za-z0-9]/.test(p) ? 1 : 0);
    return pts <= 1 ? 1 : pts === 2 ? 2 : pts === 3 ? 3 : 4;
  }
  const STRENGTH_KEYS = ['wz_strength_empty', 'wz_strength_weak', 'wz_strength_fair', 'wz_strength_good', 'wz_strength_strong'];

  /* ======================================================================== */
  function create(cfg) {
    const root = cfg.root;
    if (!root) return null;
    if (root.__wizard) return root.__wizard;

    const stepEls = $$('.wz-step', root);
    const ids = stepEls.map((s) => s.dataset.step);
    const N = stepEls.length;
    const draftKey = 'nasaq_wiz_draft_v1:' + cfg.id;
    const stepCfg = {};
    (cfg.steps || []).forEach((s) => { stepCfg[s.id] = s; });
    const touched = new Set();
    const serverErrs = {};   /* name → { value, err, transient } — خطأ جاي من السيرفر على حقل؛ يفضل لحد ما المستخدم يعدّل الحقل (وأخطاء الملفات العابرة تتفك عند التنقل أو إعادة الإرسال) */
    function dropTransient() { Object.keys(serverErrs).forEach((k) => { if (serverErrs[k].transient) delete serverErrs[k]; }); }
    const flags = {};
    let idx = 0, maxReached = 0, busy = false, done = false, redirectTimer = 0, saveTimer = 0, firstShow = true;

    const uid = 'wz' + Math.random().toString(36).slice(2, 7);
    const formEl = root.tagName === 'FORM' ? root : $('form', root);
    const elByName = (name) => root.querySelector('[name="' + name + '"]');
    const val = (name) => { const e = elByName(name); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; };
    const radioVal = (name) => { const e = root.querySelector('[name="' + name + '"]:checked'); return e ? e.value : ''; };

    /* ---------- أخطاء الحقول ---------- */
    function errEl(name) {
      let p = root.querySelector('[data-err-for="' + name + '"]');
      const el = elByName(name);
      if (!p && el) {
        p = document.createElement('p');
        p.className = 'field__error';
        p.setAttribute('data-err-for', name);
        const host = el.closest('.field') || el.parentNode;
        host.appendChild(p);
      }
      if (p) {
        if (!p.id) p.id = uid + '-err-' + name;
        if (!p.hasAttribute('aria-live')) p.setAttribute('aria-live', 'polite');
        if (el && !(el.getAttribute('aria-describedby') || '').split(' ').includes(p.id)) {
          el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + p.id).trim());
        }
      }
      return p;
    }
    function renderErr(p) {
      if (!p) return;
      if (p.dataset.key) {
        let vars = null;
        try { vars = p.dataset.vars ? JSON.parse(p.dataset.vars) : null; } catch (_) { vars = null; }
        p.textContent = tt(p.dataset.key, vars);
      }
    }
    /* e = null | 'key' | ['key', vars] | { raw: 'نص من السيرفر' } */
    function setError(name, e) {
      const p = errEl(name);
      const el = elByName(name);
      if (p) {
        if (!e) { p.dataset.key = ''; p.dataset.vars = ''; p.textContent = ''; }
        else if (e.raw != null) { p.dataset.key = ''; p.dataset.vars = ''; p.textContent = e.raw; }
        else {
          const key = Array.isArray(e) ? e[0] : e;
          const vars = Array.isArray(e) ? e[1] : null;
          p.dataset.key = key; p.dataset.vars = vars ? JSON.stringify(vars) : '';
          p.textContent = tt(key, vars);
        }
      }
      if (el) { if (e) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
    }

    function skipped(el, stepEl) {
      for (let n = el; n && n !== stepEl; n = n.parentElement) if (n.hidden) return true;
      return false;
    }
    function fieldError(el) {
      const spec = (el.dataset.rules || '').split(/\s+/).filter(Boolean);
      const v = el.type === 'file' ? '' : (el.value == null ? '' : el.value);
      for (let i = 0; i < spec.length; i++) {
        const parts = spec[i].split(':');
        const fn = rules[parts[0]];
        if (!fn) continue;
        const res = fn(v, el, parts[1]);
        if (res) return res;
      }
      return null;
    }

    /* يفحص مرحلة. show=true يعرض الأخطاء تحت الحقول. يرجع { ok, firstBad } */
    function checkStep(i, show, opt) {
      const stepEl = stepEls[i];
      let ok = true, firstBad = null;
      $$('[data-rules]', stepEl).forEach((el) => {
        if (skipped(el, stepEl)) return;
        let e = fieldError(el);
        const se = serverErrs[el.name];
        if (se) { if (!e && se.value === el.value) e = se.err; else if (se.value !== el.value) delete serverErrs[el.name]; }
        if (show || touched.has(el.name)) setError(el.name, e);
        if (e) { ok = false; if (!firstBad) firstBad = el; }
      });
      const sc = stepCfg[ids[i]];
      if (sc && sc.validate) {
        const errs = sc.validate(api) || {};
        $$('[data-wz-custom]', stepEl).forEach((p) => {
          const name = p.getAttribute('data-err-for');
          if (errs[name]) { if (show || (opt && opt.showCustom) || p.textContent) setCustom(p, errs[name]); }
          else setCustom(p, null);
        });
        Object.keys(errs).forEach((name) => {
          ok = false;
          if (!firstBad) firstBad = stepEl.querySelector('[data-focus-for="' + name + '"]') || elByName(name);
        });
      }
      return { ok, firstBad };
    }
    function setCustom(p, e) {
      if (!p.id) p.id = uid + '-err-' + p.getAttribute('data-err-for');
      if (!p.hasAttribute('aria-live')) p.setAttribute('aria-live', 'polite');
      if (!e) { p.dataset.key = ''; p.dataset.vars = ''; p.textContent = ''; return; }
      const key = Array.isArray(e) ? e[0] : e;
      const vars = Array.isArray(e) ? e[1] : null;
      p.dataset.key = key; p.dataset.vars = vars ? JSON.stringify(vars) : '';
      p.textContent = tt(key, vars);
    }

    /* ---------- أخطاء المرحلة العامة (من السيرفر) ---------- */
    function stepErrorEl(i) {
      const stepEl = stepEls[i];
      let p = $('[data-wz-step-error]', stepEl);
      if (!p) {
        p = document.createElement('p');
        p.className = 'field__error wz-step-error';
        p.setAttribute('data-wz-step-error', '');
        p.setAttribute('role', 'alert');
        const head = $('.wz-step__head', stepEl);
        if (head) head.after(p); else stepEl.prepend(p);
      }
      return p;
    }
    function clearStepErrors() {
      $$('[data-wz-step-error]', root).forEach((p) => { p.dataset.key = ''; p.dataset.vars = ''; p.textContent = ''; });
    }
    function setStepError(i, e) {
      const p = stepErrorEl(i);
      if (e.raw != null) { p.dataset.key = ''; p.dataset.vars = ''; p.textContent = e.raw; }
      else {
        p.dataset.key = e.key; p.dataset.vars = e.vars ? JSON.stringify(e.vars) : '';
        p.textContent = tt(e.key, e.vars);
      }
    }

    /* ---------- الـ Stepper وشريط التقدّم ---------- */
    const stepperHost = $('[data-wz-stepper]', root);
    let countEl = null, nameEl = null, barFill = null, barEl = null, listEl = null;
    function buildStepper() {
      if (!stepperHost) return;
      stepperHost.classList.add('wz-stepper');
      stepperHost.setAttribute('role', 'group');
      stepperHost.setAttribute('aria-label', tt('wz_progress_label'));
      stepperHost.setAttribute('data-i18n-aria-label', 'wz_progress_label');
      stepperHost.innerHTML =
        '<p class="wz-stepper__count" aria-live="polite"><span data-wz-count></span><span class="wz-stepper__sep" aria-hidden="true"> · </span><strong data-wz-name></strong></p>' +
        '<div class="wz-bar" role="progressbar" aria-valuemin="1" aria-valuemax="' + N + '"><span class="wz-bar__fill"></span></div>' +
        '<ol class="wz-steps"></ol>';
      countEl = $('[data-wz-count]', stepperHost);
      nameEl = $('[data-wz-name]', stepperHost);
      barEl = $('.wz-bar', stepperHost);
      barFill = $('.wz-bar__fill', stepperHost);
      listEl = $('.wz-steps', stepperHost);
      stepEls.forEach((s, i) => {
        const li = document.createElement('li');
        li.className = 'wz-steps__item';
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wz-steps__btn';
        b.setAttribute('data-wz-goto', String(i));
        b.innerHTML = '<span class="wz-steps__dot" aria-hidden="true"></span><span class="wz-steps__label" data-i18n="' + (s.dataset.label || '') + '"></span><span class="sr-only wz-steps__state"></span>';
        li.appendChild(b);
        listEl.appendChild(li);
      });
    }
    function renderStepper() {
      if (!stepperHost || !listEl) return;
      const curLabel = tt(stepEls[idx].dataset.label || '');
      countEl.textContent = tt('wz_step_of', { n: idx + 1, total: N });
      nameEl.textContent = curLabel;
      barEl.setAttribute('aria-valuenow', String(idx + 1));
      barEl.setAttribute('aria-valuetext', tt('wz_step_of', { n: idx + 1, total: N }) + ' — ' + curLabel);
      barFill.style.width = ((idx + 1) / N * 100) + '%';
      $$('.wz-steps__item', listEl).forEach((li, i) => {
        const b = $('.wz-steps__btn', li);
        li.classList.toggle('is-current', i === idx);
        li.classList.toggle('is-done', i < idx);
        $('.wz-steps__dot', li).textContent = i < idx ? '✓' : String(i + 1);
        $('.wz-steps__label', li).textContent = tt(stepEls[i].dataset.label || '');
        $('.wz-steps__state', li).textContent = i < idx ? ' (' + tt('wz_step_done') + ')' : '';
        if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        const canGo = i < idx && !busy && !done;
        b.disabled = !canGo && i !== idx;
        b.setAttribute('aria-disabled', String(b.disabled));
      });
    }

    /* ---------- أزرار التنقل ---------- */
    const btnPrev = $('[data-wz-prev]', root), btnNext = $('[data-wz-next]', root), btnSubmit = $('[data-wz-submit]', root);
    function updateNav() {
      const last = idx === N - 1;
      if (btnPrev) btnPrev.hidden = idx === 0;
      if (btnNext) {
        btnNext.hidden = last;
        const ok = !last && checkStep(idx, false).ok;
        btnNext.setAttribute('aria-disabled', String(!ok));
        btnNext.classList.toggle('is-disabled', !ok);
      }
      if (btnSubmit) btnSubmit.hidden = !last;
      if (btnPrev) btnPrev.disabled = busy;
    }
    function setBusy(on) {
      busy = on;
      root.classList.toggle('is-busy', on);
      root.setAttribute('aria-busy', String(on));
      if (btnSubmit) {
        btnSubmit.disabled = on;
        btnSubmit.classList.toggle('is-loading', on);
        const label = $('[data-wz-submit-label]', btnSubmit) || btnSubmit;
        const key = on ? 'wz_submitting' : (btnSubmit.dataset.label || 'wz_next');
        label.setAttribute('data-i18n', key);
        label.textContent = tt(key);
      }
      updateNav();
      renderStepper();
    }

    /* ---------- الانتقال بين المراحل ---------- */
    const focusables = 'input:not([type=hidden]):not([type=file]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
    function focusFirst(stepEl) {
      const el = $$(focusables, stepEl).find((e) => !skipped(e, stepEl) && !e.closest('.geo'));
      const target = el || $('[data-wz-title]', stepEl);
      if (target) { try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); } }
    }
    function scrollToTop() {
      const target = stepperHost || root;
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }

    function show(n, o) {
      o = o || {};
      if (n < 0 || n >= N) return;
      const dir = n >= idx ? 1 : -1;
      idx = n;
      if (n > maxReached) maxReached = n;
      stepEls.forEach((s, i) => {
        s.hidden = i !== n;
        s.classList.remove('wz-in-fwd', 'wz-in-back');
      });
      const cur = stepEls[n];
      if (!firstShow && !reducedMotion()) {
        /* إعادة تشغيل الأنيميشن */
        void cur.offsetWidth;
        cur.classList.add(dir > 0 ? 'wz-in-fwd' : 'wz-in-back');
      }
      const sc = stepCfg[ids[n]];
      if (sc && sc.onEnter) sc.onEnter(api);
      if ($('[data-wz-summary]', cur)) renderSummary();
      renderStepper();
      updateNav();
      saveDraft();
      if (!o.noFocus && !firstShow) { focusFirst(cur); scrollToTop(); }
      firstShow = false;
    }

    function next() {
      if (busy || done || idx >= N - 1) return;
      dropTransient();
      const r = checkStep(idx, true);
      if (!r.ok) {
        updateNav();
        if (r.firstBad) { try { r.firstBad.focus({ preventScroll: false }); } catch (_) { /* تجاهل */ } }
        return;
      }
      clearStepErrors();
      show(idx + 1);
    }
    function prev() {
      if (busy || done || idx === 0) return;
      dropTransient();
      clearStepErrors();
      show(idx - 1);
    }
    function goTo(id) {
      const n = typeof id === 'number' ? id : ids.indexOf(id);
      if (n < 0 || busy || done) return;
      dropTransient();
      clearStepErrors();
      show(n);
    }

    /* ---------- ملخّص المراجعة ---------- */
    function renderSummary() {
      const host = $('[data-wz-summary]', root);
      if (!host || !cfg.summary) return;
      host.textContent = '';
      const groups = [];
      cfg.summary.forEach((row) => {
        if (row.show && !row.show(api)) return;
        let g = groups.find((x) => x.step === row.step);
        if (!g) { g = { step: row.step, rows: [] }; groups.push(g); }
        g.rows.push(row);
      });
      groups.forEach((g) => {
        const sec = document.createElement('section');
        sec.className = 'wz-sum';
        const head = document.createElement('div');
        head.className = 'wz-sum__head';
        const h = document.createElement('h3');
        const stepEl = stepEls[ids.indexOf(g.step)];
        h.textContent = tt(stepEl ? stepEl.dataset.label : '');
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'link-btn wz-sum__edit';
        edit.setAttribute('data-wz-edit', g.step);
        edit.textContent = tt('wz_edit');
        head.appendChild(h); head.appendChild(edit);
        const dl = document.createElement('dl');
        g.rows.forEach((row) => {
          const wrap = document.createElement('div');
          wrap.className = 'wz-sum__row';
          const dt = document.createElement('dt');
          dt.textContent = tt(row.label);
          const dd = document.createElement('dd');
          let v = row.value(api);
          if (v && typeof v === 'object' && v.key) v = tt(v.key, v.vars);
          if (v == null || String(v).trim() === '') { dd.textContent = tt('wz_not_provided'); dd.classList.add('is-empty'); }
          else dd.textContent = String(v);
          if (row.ltr) dd.setAttribute('dir', 'ltr');
          wrap.appendChild(dt); wrap.appendChild(dd);
          dl.appendChild(wrap);
        });
        sec.appendChild(head); sec.appendChild(dl);
        host.appendChild(sec);
      });
    }

    /* ---------- المسودة (sessionStorage) ---------- */
    function fileNames() {
      const out = {};
      $$('input[type="file"][name]', root).forEach((el) => { if (el.files && el.files[0]) out[el.name] = el.files[0].name; });
      return out;
    }
    function collect() {
      const v = {};
      $$('[name]', root).forEach((el) => {
        if (el.type === 'password' || el.type === 'file' || el.type === 'button' || el.type === 'submit' || el.hasAttribute('data-nodraft')) return;
        if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; return; }
        if (el.type === 'checkbox') { v[el.name] = el.checked; return; }
        v[el.name] = el.value;
      });
      return v;
    }
    function saveDraft() {
      if (done) return;
      try {
        const prevFiles = (readDraft() || {}).files || {};
        const files = Object.assign({}, prevFiles, fileNames());
        sessionStorage.setItem(draftKey, JSON.stringify({
          v: 1, step: ids[idx], values: collect(),
          extra: cfg.draft && cfg.draft.save ? cfg.draft.save(api) : null,
          files, t: Date.now()
        }));
      } catch (_) { /* التخزين غير متاح أو ممتلئ — لا يؤثر على التسجيل */ }
    }
    function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 150); }
    function readDraft() {
      try { const d = JSON.parse(sessionStorage.getItem(draftKey) || 'null'); return d && d.v === 1 ? d : null; } catch (_) { return null; }
    }
    function clearDraft() { try { sessionStorage.removeItem(draftKey); } catch (_) { /* تجاهل */ } }

    function restoreDraft() {
      const d = readDraft();
      if (!d) return false;
      Object.keys(d.values || {}).forEach((name) => {
        const els = $$('[name="' + name + '"]', root);
        els.forEach((el) => {
          if (el.type === 'password' || el.type === 'file' || el.hasAttribute('data-nodraft')) return;
          if (el.type === 'radio') el.checked = el.value === d.values[name];
          else if (el.type === 'checkbox') el.checked = !!d.values[name];
          else if (!el.readOnly) el.value = d.values[name];
        });
      });
      if (cfg.draft && cfg.draft.restore) cfg.draft.restore(d.extra, api);
      let target = Math.max(0, ids.indexOf(d.step));
      let backedUp = false;
      for (let i = 0; i < target; i++) {
        if (!checkStep(i, false).ok) { target = i; backedUp = true; break; }
      }
      /* ملفات كانت مختارة ولم تعد موجودة بعد الـ refresh */
      Object.keys(d.files || {}).forEach((name) => {
        const el = elByName(name);
        if (!el || (el.files && el.files[0])) return;
        const zone = el.closest('.dropzone');
        if (!zone) return;
        let note = $('.wz-file-lost', zone.parentNode);
        if (!note) { note = document.createElement('p'); note.className = 'wz-file-lost'; note.setAttribute('role', 'status'); zone.after(note); }
        note.dataset.name = d.files[name];
        note.textContent = tt('wz_file_lost', { name: d.files[name] });
      });
      return { target, backedUp, saved: ids.indexOf(d.step) };
    }

    function refreshFileNotes() {
      $$('.wz-file-lost', root).forEach((n) => { n.textContent = tt('wz_file_lost', { name: n.dataset.name || '' }); });
    }

    /* ---------- النجاح ---------- */
    function showSuccess(result) {
      done = true;
      clearDraft();
      root.classList.add('is-done');
      if (stepperHost) stepperHost.hidden = true;
      stepEls.forEach((s) => { s.hidden = true; });
      const nav = $('.wz-nav', root); if (nav) nav.hidden = true;
      const notice = $('[data-wz-notice]', root); if (notice) notice.hidden = true;
      const host = $('[data-wz-success]', root);
      if (!host) return;
      host.hidden = false;
      const sc = cfg.success || {};
      if (sc.fill) sc.fill(host, result, api);
      const title = $('[data-wz-title]', host);
      if (title) { title.setAttribute('tabindex', '-1'); try { title.focus({ preventScroll: true }); } catch (_) { /* تجاهل */ } }
      scrollToTop();
      const url = typeof sc.url === 'function' ? sc.url(result, api) : sc.url;
      const link = $('[data-wz-continue]', host);
      if (link && url) link.setAttribute('href', url);
      const cd = $('[data-wz-countdown]', host);
      if (url && sc.delay) {
        let left = Math.round(sc.delay / 1000);
        const paint = () => { if (cd) cd.textContent = tt('wz_redirecting', { n: left }); };
        paint();
        host.__repaintCountdown = paint;
        redirectTimer = setInterval(() => {
          left -= 1;
          if (left <= 0) { clearInterval(redirectTimer); window.location.href = url; return; }
          paint();
        }, 1000);
      }
    }

    /* ---------- الإرسال ---------- */
    async function submit() {
      if (busy || done) return;
      dropTransient();
      for (let i = 0; i < N; i++) {
        const r = checkStep(i, true);
        if (!r.ok) {
          show(i, { noFocus: true });
          if (r.firstBad) { try { r.firstBad.focus(); } catch (_) { /* تجاهل */ } }
          return;
        }
      }
      clearStepErrors();
      setBusy(true);
      try {
        const result = await cfg.submit(api);
        setBusy(false);
        showSuccess(result);
      } catch (err) {
        setBusy(false);
        handleError(err);
      }
    }
    function handleError(err) {
      const e = err instanceof WizardError ? err : null;
      let n = e && e.step ? ids.indexOf(e.step) : idx;
      if (n < 0) n = idx;
      show(n, { noFocus: true });
      const payload = e && e.key ? { key: e.key, vars: e.vars } : { raw: (err && err.message) || '' };
      if (!payload.key && !payload.raw) payload.key = 'wz_err_generic';
      const field = e && e.field ? elByName(e.field) : null;
      if (field) {
        touched.add(field.name);
        const fe = payload.key ? [payload.key, payload.vars] : { raw: payload.raw };
        serverErrs[field.name] = { value: field.value, err: fe, transient: field.type === 'file' };
        setError(field.name, fe);
        try { field.focus(); } catch (_) { /* تجاهل */ }
      } else {
        setStepError(n, payload);
        const p = stepErrorEl(n);
        if (p && p.scrollIntoView) p.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
      updateNav();
    }

    /* ---------- ملفات (Dropzone) ---------- */
    function updateDropzone(input) {
      const zone = input.closest('.dropzone');
      if (!zone) return;
      const label = $('[data-dz-label]', zone);
      const file = input.files && input.files[0];
      zone.classList.toggle('has-file', !!file);
      if (label) {
        if (!label.dataset.key) label.dataset.key = label.getAttribute('data-i18n') || '';
        if (file) { label.removeAttribute('data-i18n'); label.textContent = file.name; }
        else if (label.dataset.key) { label.setAttribute('data-i18n', label.dataset.key); label.textContent = tt(label.dataset.key); }
      }
      const lost = $('.wz-file-lost', zone.parentNode);
      if (lost && file) lost.remove();
    }

    /* ---------- قوة كلمة المرور ---------- */
    $$('[data-wz-strength]', root).forEach((box) => {
      const input = elByName(box.getAttribute('data-for'));
      if (!input) return;
      box.classList.add('wz-strength');
      box.innerHTML = '<span class="wz-strength__label"><span data-i18n="wz_strength_label"></span>: <strong data-wz-strength-text></strong></span>' +
        '<span class="wz-strength__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
      box.id = box.id || uid + '-strength-' + input.name;
      input.setAttribute('aria-describedby', ((input.getAttribute('aria-describedby') || '') + ' ' + box.id).trim());
      const paint = () => {
        const lvl = strengthLevel(input.value);
        box.setAttribute('data-level', String(lvl));
        $('[data-wz-strength-text]', box).textContent = tt(STRENGTH_KEYS[lvl]);
      };
      input.addEventListener('input', paint);
      box.__paint = paint;
      paint();
    });

    /* ---------- الأحداث ---------- */
    root.addEventListener('input', (e) => {
      const el = e.target;
      if (!el || !el.name || busy) return;
      delete serverErrs[el.name];
      if (el.dataset.rules) {
        const shown = root.querySelector('[data-err-for="' + el.name + '"]');
        if (touched.has(el.name) || (shown && shown.textContent)) setError(el.name, fieldError(el));
      }
      /* حقول مرتبطة (تأكيد كلمة المرور) */
      $$('[data-rules~="match:#' + el.id + '"]', root).forEach((o) => { if (touched.has(o.name)) setError(o.name, fieldError(o)); });
      if (el.type !== 'file') { const stepEl = el.closest('.wz-step'); if (stepEl) { const p = $('[data-wz-step-error]', stepEl); if (p && p.textContent) { p.textContent = ''; p.dataset.key = ''; } } }
      updateNav();
      saveSoon();
    });
    root.addEventListener('change', (e) => {
      const el = e.target;
      if (!el || !el.name) return;
      delete serverErrs[el.name];
      if (el.type === 'file') {
        touched.add(el.name);
        setError(el.name, fieldError(el));
        updateDropzone(el);
      } else if (el.dataset && el.dataset.rules) {
        touched.add(el.name);
        setError(el.name, fieldError(el));
      }
      updateNav();
      saveSoon();
    });
    root.addEventListener('focusout', (e) => {
      const el = e.target;
      if (el && el.name && el.dataset && el.dataset.rules && el.type !== 'file') {
        if (el.type === 'password' || String(el.value || '').length || el.type === 'checkbox' || touched.has(el.name)) {
          touched.add(el.name);
          setError(el.name, fieldError(el));
          updateNav();
        }
      }
    });
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const t = e.target;
      if (!t || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A') return;
      if (t.closest && t.closest('.geo')) return;
      e.preventDefault();
      if (idx < N - 1) next();
    });
    root.addEventListener('click', (e) => {
      const goto = e.target.closest('[data-wz-goto]');
      if (goto && root.contains(goto)) { const n = +goto.getAttribute('data-wz-goto'); if (n < idx) goTo(n); return; }
      const edit = e.target.closest('[data-wz-edit]');
      if (edit && root.contains(edit)) { goTo(edit.getAttribute('data-wz-edit')); return; }
      if (e.target.closest('[data-wz-next]')) { e.preventDefault(); next(); return; }
      if (e.target.closest('[data-wz-prev]')) { e.preventDefault(); prev(); }
    });
    if (formEl) formEl.addEventListener('submit', (e) => { e.preventDefault(); if (idx === N - 1) submit(); });

    /* لوحة المفاتيح على الموبايل: نحرّك الحقل المركَّز لمنتصف الشاشة ونترك مساحة تحته */
    root.addEventListener('focusin', (e) => {
      const el = e.target;
      if (!el || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || (el.closest && el.closest('.geo__map'))) return;
      if (!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches)) return;
      setTimeout(() => { if (document.activeElement === el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); }, 280);
    });
    if (window.visualViewport) {
      const vv = window.visualViewport;
      const upd = () => {
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty('--wz-kbd', (kb > 80 ? Math.round(kb) : 0) + 'px');
      };
      vv.addEventListener('resize', upd);
      vv.addEventListener('scroll', upd);
    }

    /* محرّك الترجمة العام (i18n.js) بيتخطّى عناصر <textarea> بالكامل، فنترجم placeholder بتاعتها هنا */
    function textareaPlaceholders() {
      $$('textarea[data-i18n-placeholder]', root).forEach((el) => { el.setAttribute('placeholder', tt(el.getAttribute('data-i18n-placeholder'))); });
    }

    /* تغيير اللغة: نعيد رسم النصوص الديناميكية فقط — الحقول ومحتواها لا تُمَس */
    function onLang() {
      renderStepper();
      textareaPlaceholders();
      $$('[data-err-for],[data-wz-step-error]', root).forEach(renderErr);
      $$('[data-wz-strength]', root).forEach((b) => { if (b.__paint) b.__paint(); });
      if ($('[data-wz-summary]', stepEls[idx])) renderSummary();
      refreshFileNotes();
      const host = $('[data-wz-success]', root);
      if (host && host.__repaintCountdown) host.__repaintCountdown();
      if (btnSubmit) { const label = $('[data-wz-submit-label]', btnSubmit) || btnSubmit; const k = label.getAttribute('data-i18n'); if (k) label.textContent = tt(k); }
    }
    window.addEventListener('nasaq:langchange', onLang);

    /* ---------- واجهة برمجية للإعدادات ---------- */
    const api = {
      root, id: cfg.id, flags, WizardError,
      val, radioVal, digits,
      el: elByName,
      current: () => ids[idx],
      goTo, next, prev, submit,
      setFlag(name, on) {
        flags[name] = !!on;
        $$('[data-hide-if="' + name + '"]', root).forEach((e) => { e.hidden = !!on; });
        $$('[data-show-if="' + name + '"]', root).forEach((e) => { e.hidden = !on; });
        updateNav();
      },
      /* تنبيه من مكوّن خارجي (مثل أداة الموقع) إن القيمة اتغيّرت */
      changed() {
        /* المستخدم لسه معدّل القيمة (مثلاً اختار نقطة على الخريطة) → نعرض سبب الرفض فوراً بدل زر «التالي» معطّل من غير تفسير */
        checkStep(idx, false, { showCustom: true });
        updateNav();
        saveSoon();
      },
      showStepError(stepId, e) { const n = ids.indexOf(stepId); if (n >= 0) setStepError(n, e); },
      refresh: onLang
    };

    /* ---------- التشغيل ---------- */
    buildStepper();
    textareaPlaceholders();
    stepEls.forEach((s) => { s.hidden = true; });
    if (cfg.onReady) cfg.onReady(api);
    const restored = restoreDraft();
    show(restored ? restored.target : 0, { noFocus: true });
    if (restored) {
      const note = $('[data-wz-notice]', root);
      if (note) {
        note.hidden = false;
        note.textContent = tt(restored.backedUp && restored.saved > restored.target ? 'wz_draft_restored_pw' : 'wz_draft_restored');
        note.setAttribute('data-restored', restored.backedUp && restored.saved > restored.target ? 'pw' : '1');
        const prevOnLang = note.__lang;
        if (!prevOnLang) {
          note.__lang = true;
          window.addEventListener('nasaq:langchange', () => {
            note.textContent = tt(note.getAttribute('data-restored') === 'pw' ? 'wz_draft_restored_pw' : 'wz_draft_restored');
          });
        }
      }
    }
    api.restored = !!restored;
    root.__wizard = api;
    return api;
  }

  window.Wizard = { create, WizardError, rules, digits, strengthLevel };
})();
