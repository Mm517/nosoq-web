/* ==========================================================================
   js/signup-wizards.js — إعداد رحلات التسجيل الثلاث فوق مكوّن js/wizard.js:
     • مشتري  (/auth          → #signup-wizard)
     • بائع   (/become-seller → #seller-form)
     • مندوب  (/become-rider  → #rider-form)
   نفس مسار الحفظ القديم بالظبط:
     مشتري: POST /api/auth/signup  ← marketplace_users (+ trigger on_auth_user_created)
     بائع/مندوب: NasaqCloud.signup → uploadDocument → sellerApplication / riderApplication
                 ← stores / riders / applications (حالة pending بانتظار موافقة الأدمن)
   كل النصوص تأتي من القاموس (t('wz_...')) — لا نصوص عربية مباشرة هنا.
   ========================================================================== */
(function () {
  'use strict';
  const W = window.Wizard;
  if (!W) return;
  const { WizardError } = W;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const tt = (k, v) => (typeof window.t === 'function' ? window.t(k, v) : k);

  /* حدود مصر التقريبية — نسخة من js/geo.js (الأداة نفسها ترفض أي نقطة خارجها، وده فحص دفاعي إضافي) */
  const EG = { s: 21.5, n: 31.95, w: 24.5, e: 37.0 };
  const inEgypt = (lat, lng) => lat >= EG.s && lat <= EG.n && lng >= EG.w && lng <= EG.e;

  /* ---------- أداة الموقع (Geo.mount) داخل مرحلة ---------- */
  function makeGeo(getWiz) {
    let inst = null, pending = null;
    return {
      mount(root) {
        if (inst || !window.Geo) return;
        const host = $('[data-geo-root]', root);
        if (!host || host.offsetParent === null) return;   /* الخريطة ما بتترسمش صح جوه عنصر مخفي */
        inst = window.Geo.mount(host, {
          value: pending || undefined,
          onChange: () => { const w = getWiz(); if (w) w.changed(); }
        });
      },
      value() { return inst ? inst.getValue() : pending; },
      save() { const v = this.value(); return v && v.lat != null && v.lng != null ? v : null; },
      restore(v) { pending = v || null; }
    };
  }
  function geoErrors(geo, missingKey) {
    const v = geo.value();
    if (!v || v.lat == null || v.lng == null) return { geo: missingKey };
    if (!inEgypt(v.lat, v.lng)) return { geo: 'wz_err_geo_egypt' };
    return null;
  }
  function geoText(v) {
    if (!v || v.lat == null) return '';
    const parts = [v.formatted || [v.street, v.area, v.city].filter(Boolean).join(', ')].filter(Boolean);
    return (parts[0] || '') + (parts[0] ? ' ' : '') + '(' + Number(v.lat).toFixed(5) + ', ' + Number(v.lng).toFixed(5) + ')';
  }

  /* ---------- تجهيز الصور قبل الرفع (نصغّرها ونحوّلها JPEG) ---------- */
  class ImgError extends Error { constructor(key, vars) { super(key); this.key = key; this.vars = vars || null; } }
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new ImgError('wz_err_img_unreadable', { name: file.name })); };
      img.src = url;
    });
  }
  async function prepareImage(file, maxSide) {
    if (!/^image\//.test(file.type)) throw new ImgError('wz_err_file_type');
    const img = await readImage(file);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    if (dataUrl.length * 0.75 > 5 * 1024 * 1024) throw new ImgError('wz_err_img_big', { name: file.name });
    return { file, dataUrl };
  }
  const imgFail = (e, step, field) => new WizardError('', { step, field, key: (e && e.key) || 'wz_err_upload', vars: e && e.vars });

  /* ---------- تحويل رسائل السيرفر إلى (مرحلة + حقل) ---------- */
  const isNetwork = (e) => e instanceof TypeError || /failed to fetch|networkerror|load failed/i.test((e && e.message) || '');
  function accountError(e, stepOf) {
    const msg = (e && e.message) || '';
    if (isNetwork(e)) return new WizardError('', { step: stepOf.email, key: 'wz_err_network' });
    if (/مسجَّل|مسجل|already/i.test(msg)) return new WizardError(msg, { step: stepOf.email, field: 'email' });
    if (/كلمة المرور|password/i.test(msg)) return new WizardError(msg, { step: stepOf.password, field: 'password' });
    if (/الاسم|الهاتف/.test(msg)) return new WizardError(msg, { step: stepOf.email });
    return new WizardError(msg, { step: stepOf.fallback });
  }
  function applicationError(e, isSeller) {
    const msg = (e && e.message) || '';
    if (isNetwork(e)) return new WizardError('', { step: 'review', key: 'wz_err_network' });
    if (/موقع|الخريطة/.test(msg)) return new WizardError(msg, { step: isSeller ? 'location' : 'review' });
    if (isSeller && /المتجر|العنوان/.test(msg)) return new WizardError(msg, { step: /العنوان/.test(msg) ? 'location' : 'store' });
    if (/الاسم|الهاتف|حسابك/.test(msg)) return new WizardError(msg, { step: 'account' });
    return new WizardError(msg, { step: 'review' });
  }

  /* ---------- ملخّص: مساعدات ---------- */
  const fileName = (w, name) => { const el = w.el(name); return el && el.files && el.files[0] ? el.files[0].name : ''; };
  const selectedText = (w, name) => {
    const el = w.el(name);
    const o = el && el.selectedOptions && el.selectedOptions[0];
    return o && o.value ? o.textContent.trim() : '';
  };
  const vehicleText = (w) => {
    const r = w.root.querySelector('input[name="vehicle"]:checked');
    const l = r && r.closest('label');
    return l ? l.textContent.trim() : '';
  };

  /* ====================================================================
     مشتري
     ==================================================================== */
  function initBuyer() {
    const root = $('#signup-wizard');
    if (!root) return;
    let wiz = null;
    const geo = makeGeo(() => wiz);

    wiz = W.create({
      root, id: 'buyer',
      steps: [
        { id: 'location', onEnter: () => geo.mount(root), validate: () => geoErrors(geo, 'wz_err_geo') }
      ],
      summary: [
        { step: 'info', label: 'wz_f_name', value: (w) => w.val('name').trim() },
        { step: 'info', label: 'wz_f_email', value: (w) => w.val('email').trim(), ltr: true },
        { step: 'info', label: 'wz_f_phone', value: (w) => w.digits(w.val('phone')).trim(), ltr: true },
        { step: 'password', label: 'wz_f_password', value: () => ({ key: 'wz_masked' }), ltr: true },
        { step: 'location', label: 'wz_f_location', value: () => geoText(geo.value()) }
      ],
      draft: { save: () => geo.save(), restore: (v) => geo.restore(v) },
      async submit(w) {
        const g = geo.value();
        if (!g || g.lat == null || g.lng == null) throw new WizardError('', { step: 'location', key: 'wz_err_geo' });
        const fields = {
          email: w.val('email').trim(),
          name: w.val('name').trim(),
          phone: w.digits(w.val('phone')).trim(),
          password: w.val('password'),
          latitude: g.lat,
          longitude: g.lng,
          address: g.formatted || null,
          google_place_id: g.placeId || null
        };
        let response, data;
        try {
          response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(fields)
          });
          data = await response.json();
        } catch (e) {
          throw new WizardError('', { step: 'review', key: 'wz_err_network' });
        }
        if (!response.ok) {
          throw accountError(new Error((data && data.error) || ''), { email: 'info', password: 'password', fallback: 'review' });
        }
        if (window.NasaqCloud) window.NasaqCloud.saveSession(data);
        return data;
      },
      success: { url: '/', delay: 4000 }
    });

    /* لو في مسودة محفوظة (refresh) نفتح تبويب «إنشاء حساب» تلقائياً بدل صفحة الدخول */
    if (wiz && wiz.restored) {
      const tab = $('#tab-signup');
      if (tab && !new URLSearchParams(location.search).get('tab')) tab.click();
    }
    /* لو المستخدم فتح تبويب «إنشاء حساب» وهو على مرحلة الموقع، نركّب الخريطة أول ما التبويب يظهر */
    $$('[data-tab="signup"], [data-switch-tab="signup"]').forEach((b) => b.addEventListener('click', () => {
      setTimeout(() => { if (wiz && wiz.current() === 'location') geo.mount(root); }, 0);
    }));
  }

  /* ====================================================================
     بائع / مندوب
     ==================================================================== */
  function customerSession() {
    try {
      const s = JSON.parse(localStorage.getItem('nasaq_session_v1') || 'null');
      if (s && s.email && (!s.role || s.role === 'customer')) return s;
    } catch (_) { /* تجاهل */ }
    return null;
  }

  function initApplicant(kind) {
    const isSeller = kind === 'seller';
    const root = $(isSeller ? '#seller-form' : '#rider-form');
    if (!root) return;
    let wiz = null;
    const geo = isSeller ? makeGeo(() => wiz) : null;
    const uploaded = {};     /* docKey → { file, path } — يمنع إعادة رفع نفس الصورة لو الإرسال اتكرر بعد خطأ */
    let uploadedLogo = null; /* { file, url } */

    function fillCategories() {
      const sel = $('[data-wz-categories]', root);
      if (!sel || sel.options.length) return;
      const list = (window.Products && Array.isArray(window.Products.categories) && window.Products.categories.length)
        ? window.Products.categories.map((c) => ({ id: c.id, name: c.name }))
        : [{ id: 'clothes', name: tt('wz_cat_clothes') }];
      list.forEach((c) => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o); });
      if (list.some((c) => c.id === 'clothes')) sel.value = 'clothes';   /* نفس القيمة الافتراضية القديمة */
    }

    /* مستخدم مسجّل دخول كـ «عميل» → نكمل بحسابه بدون كلمة مرور جديدة */
    function detectSession(w) {
      const s = customerSession();
      if (!s || !window.sb || !window.sb.auth || !window.sb.auth.getSession) return;
      Promise.resolve(window.sb.auth.getSession()).then((res) => {
        const u = res && res.data && res.data.session && res.data.session.user;
        if (!(u && u.email && u.email.toLowerCase() === String(s.email).toLowerCase())) return;
        const email = w.el('email');
        if (email) { email.value = s.email; email.readOnly = true; email.classList.add('wz-readonly'); }
        const nm = w.el('name');
        if (nm && !nm.value && s.name) nm.value = s.name;
        w.setFlag('loggedIn', true);
      }).catch(() => { /* نكمل بالنموذج الكامل */ });
    }

    const summary = [
      { step: 'account', label: 'wz_f_name', value: (w) => w.val('name').trim() },
      { step: 'account', label: 'wz_f_email', value: (w) => w.val('email').trim(), ltr: true },
      { step: 'account', label: 'wz_f_phone', value: (w) => w.digits(w.val('phone')).trim(), ltr: true },
      { step: 'account', label: 'wz_f_password', value: () => ({ key: 'wz_masked' }), ltr: true, show: (w) => !w.flags.loggedIn }
    ];
    if (isSeller) {
      summary.push(
        { step: 'store', label: 'wz_f_store_name', value: (w) => w.val('storeName').trim() },
        { step: 'store', label: 'wz_f_category', value: (w) => selectedText(w, 'category') },
        { step: 'store', label: 'wz_f_description', value: (w) => w.val('description').trim() },
        { step: 'store', label: 'wz_f_license', value: (w) => w.val('license').trim(), ltr: true },
        { step: 'store', label: 'wz_f_logo', value: (w) => fileName(w, 'logo') },
        { step: 'location', label: 'wz_f_address', value: (w) => w.val('address').trim() },
        { step: 'location', label: 'wz_f_store_location', value: () => geoText(geo.value()) },
        { step: 'docs', label: 'wz_f_nid_short', value: (w) => w.digits(w.val('nid')).trim(), ltr: true },
        { step: 'docs', label: 'wz_f_photo_personal', value: (w) => fileName(w, 'doc_personalPhoto') },
        { step: 'docs', label: 'wz_f_photo_storefront', value: (w) => fileName(w, 'doc_storefrontPhoto') }
      );
    } else {
      summary.push(
        { step: 'vehicle', label: 'wz_f_vehicle_short', value: (w) => vehicleText(w) },
        { step: 'vehicle', label: 'wz_f_gov', value: (w) => selectedText(w, 'city') },
        { step: 'vehicle', label: 'wz_f_area', value: (w) => w.val('area').trim() },
        { step: 'vehicle', label: 'wz_f_range', value: (w) => w.val('coverage').trim() },
        { step: 'docs', label: 'wz_f_nid_short', value: (w) => w.digits(w.val('nid')).trim(), ltr: true },
        { step: 'docs', label: 'wz_f_photo_id', value: (w) => fileName(w, 'doc_idPhoto') },
        { step: 'docs', label: 'wz_f_photo_personal', value: (w) => fileName(w, 'doc_personalPhoto') }
      );
    }

    wiz = W.create({
      root, id: kind,
      steps: isSeller ? [
        { id: 'location', onEnter: () => geo.mount(root), validate: () => geoErrors(geo, 'wz_err_geo_store') }
      ] : [],
      summary,
      draft: isSeller ? { save: () => geo.save(), restore: (v) => geo.restore(v) } : null,
      onReady(w) { fillCategories(); detectSession(w); },
      async submit(w) {
        if (!window.NasaqCloud) throw new WizardError('', { step: 'account', key: 'wz_err_cloud' });
        const name = w.val('name').trim();
        const email = w.val('email').trim();
        const phone = w.digits(w.val('phone')).trim();
        const password = w.val('password');

        /* 1) الصور: نجهّزها قبل إنشاء الحساب، فلو في مشكلة في صورة تظهر قبل التسجيل */
        const prepared = {};
        for (const input of $$('input[type="file"][data-doc]', root)) {
          const file = input.files && input.files[0];
          if (!file) continue;
          const key = input.dataset.doc;
          try { prepared[key] = await prepareImage(file, key === 'logo' ? 512 : 1600); }
          catch (e) { throw imgFail(e, key === 'logo' ? 'store' : 'docs', input.name); }
        }

        /* 2) الحساب: لو الحساب اتعمل في محاولة سابقة (نفس الإيميل) نكمل بنفس الجلسة */
        if (!w.flags.loggedIn) {
          let current = null;
          try { current = window.sb ? (await window.sb.auth.getUser()).data.user : null; } catch (_) { current = null; }
          if (!(current && current.email && current.email.toLowerCase() === email.toLowerCase())) {
            try { await window.NasaqCloud.signup({ name, email, phone, password }); }
            catch (e) { throw accountError(e, { email: 'account', password: 'account', fallback: 'account' }); }
          }
        }

        /* 3) رفع المستندات (bucket خاص) */
        const documents = {};
        for (const key of Object.keys(prepared)) {
          if (key === 'logo') continue;
          const cached = uploaded[key];
          if (cached && cached.file === prepared[key].file) { documents[key] = cached.path; continue; }
          try {
            documents[key] = await window.NasaqCloud.uploadDocument(prepared[key].dataUrl, key);
            uploaded[key] = { file: prepared[key].file, path: documents[key] };
          } catch (e) {
            throw isNetwork(e) ? new WizardError('', { step: 'docs', key: 'wz_err_network' }) : new WizardError((e && e.message) || '', { step: 'docs', field: 'doc_' + key });
          }
        }

        /* 4) شعار المتجر (اختياري) → رابط عام */
        let logoUrl = null;
        if (isSeller && prepared.logo) {
          if (uploadedLogo && uploadedLogo.file === prepared.logo.file) logoUrl = uploadedLogo.url;
          else {
            const url = await window.NasaqCloud.uploadImage(prepared.logo.dataUrl, 'store-logo-' + Date.now());
            if (!url || url === prepared.logo.dataUrl) throw new WizardError('', { step: 'store', field: 'logo', key: 'wz_err_logo_upload' });
            uploadedLogo = { file: prepared.logo.file, url }; logoUrl = url;
          }
        }

        /* 5) طلب التقديم نفسه (حالة pending) */
        let application, entityId;
        try {
          if (isSeller) {
            const g = geo.value();
            if (!g || g.lat == null || g.lng == null) throw new WizardError('', { step: 'location', key: 'wz_err_geo_store' });
            const out = await window.NasaqCloud.sellerApplication({
              ownerName: name,
              nationalId: w.digits(w.val('nid')).trim(),
              phone,
              storeName: w.val('storeName').trim(),
              license: w.val('license').trim(),
              address: w.val('address').trim(),
              latitude: g.lat,
              longitude: g.lng,
              category: w.val('category') || 'clothes',
              description: w.val('description').trim() || undefined,
              logoUrl: logoUrl || undefined,
              documents
            });
            application = out && out.application; entityId = out && out.store && out.store.id;
          } else {
            const out = await window.NasaqCloud.riderApplication({
              name, phone,
              nationalId: w.digits(w.val('nid')).trim(),
              city: w.val('city'),
              area: w.val('area').trim(),
              coverage: w.val('coverage').trim(),
              vehicle: w.radioVal('vehicle') || 'motorbike',
              documents
            });
            application = out && out.application; entityId = out && out.rider && out.rider.id;
          }
        } catch (e) {
          throw e instanceof WizardError ? e : applicationError(e, isSeller);
        }

        const requestId = (application && application.request_id) || '—';
        /* نفس شكل البيانات اللي بتقراها /application-status (accountType قيمة بيانات تُقارن هناك، مش نص عرض) */
        try {
          sessionStorage.setItem('nasaqApplication', JSON.stringify({
            requestId,
            accountType: isSeller ? 'تاجر / صاحب محل' : 'مندوب توصيل',
            name, phone, entityId, submittedAt: Date.now()
          }));
        } catch (_) { /* تجاهل */ }
        return { requestId };
      },
      success: {
        url: '/application-status',
        delay: 6000,
        fill(host, result) { const el = $('[data-wz-reqid]', host); if (el) el.textContent = result.requestId; }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initBuyer();
    initApplicant('seller');
    initApplicant('rider');
  });
})();
