/* ==========================================================================
   js/onboarding.js — سلوك مشترك لصفحات: auth, become-seller, become-rider,
   application-status. لا يُحمَّل إلا في هذه الصفحات الأربع.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- تابات /auth ---------- */
  function initAuthTabs() {
    const tabs = $$('.tab[data-tab]');
    if (!tabs.length) return;

    function activate(name) {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
      $$('.auth-panel').forEach((p) => { p.hidden = p.id !== 'panel-' + name; });
      /* نؤجّل تركيب خريطة تحديد الموقع لحد ما تبويب "إنشاء حساب" يظهر فعلياً،
         لأن خريطة جوجل التفاعلية ما بتترسمش صح جوه عنصر مخفي (hidden) بمقاس صفر */
      if (name === 'signup') mountSignupGeo();
    }

    tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.tab)));
    $$('[data-switch-tab]').forEach((b) => b.addEventListener('click', () => activate(b.dataset.switchTab)));

    /* الرابط /auth?tab=signup يفتح تبويب إنشاء الحساب مباشرة (من قائمة الحساب في الهيدر) */
    const wanted = new URLSearchParams(location.search).get('tab');
    if (wanted && tabs.some((t) => t.dataset.tab === wanted)) activate(wanted);

    /* موظف دعم مسجّل دخول بالفعل → لوحة الدعم بدل صفحة الدخول */
    try { const cur = JSON.parse(localStorage.getItem('nasaq_session_v1') || 'null'); if (cur && cur.role === 'support') location.replace('/support'); } catch (_) { /* تجاهل */ }
  }

  /* ---------- موقع المستخدم عند التسجيل (داخل نموذج إنشاء الحساب) ---------- */
  let signupGeo = null;
  function mountSignupGeo() {
    if (signupGeo) return;
    const root = $('#panel-signup [data-geo-root]');
    if (!root || !window.Geo) return;
    if (root.closest('[data-wizard]')) return;   /* الأداة بتتركّب من js/signup-wizards.js */
    signupGeo = window.Geo.mount(root, {});
  }

  function formError(form, message) {
    let node = $('.auth-form__error', form);
    if (!node) {
      node = document.createElement('p');
      node.className = 'auth-form__error field__error';
      node.setAttribute('role', 'alert');
      form.insertBefore(node, form.querySelector('button[type="submit"]'));
    }
    node.textContent = message || '';
  }

  function initAuthForms() {
    const loginForm = $('#panel-login form');
    const signupForm = $('#panel-signup form');
    if (!loginForm || !signupForm) return;
    const signupIsWizard = signupForm.hasAttribute('data-wizard');   /* إنشاء الحساب بقى Wizard — المعالج القديم يتخطّاه */

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      formError(loginForm, '');
      const button = $('button[type="submit"]', loginForm);
      button.disabled = true;
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            identifier: $('#login-id', loginForm).value.trim(),
            password: $('#login-pass', loginForm).value
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'بيانات الدخول غير صحيحة.');
        if (window.NasaqCloud) window.NasaqCloud.saveSession(data);
        /* موظف الدعم (حسب الداتا بيس) يروح لصفحة الدعم على طول */
        /* جاي من لوحة البائع/المندوب؟ رجّعه لها ومعاه الجلسة */
        const next = new URLSearchParams(location.search).get('next');
        if ((next === 'seller' || next === 'driver') && window.NasaqLinks) { window.NasaqLinks.go(next, '/'); return; }
        location.href = (data.user && data.user.role === 'support') ? '/support' : '/';
      } catch (error) {
        formError(loginForm, error.message);
      } finally {
        button.disabled = false;
      }
    });

    if (!signupIsWizard) signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      formError(signupForm, '');
      const geoError = $('[data-su-geo-error]', signupForm);
      if (geoError) geoError.textContent = '';
      /* موقع المستخدم إلزامي عند إنشاء الحساب: نأخذه من أداة الخريطة (Geo) المضمَّنة
         في نموذج التسجيل — تحديد يدوي على الخريطة، بحث عن عنوان، أو زر "موقعي الحالي". */
      const geoValue = signupGeo ? signupGeo.getValue() : null;
      if (!geoValue || geoValue.lat == null || geoValue.lng == null) {
        if (geoError) geoError.textContent = 'من فضلك حدّد موقعك على الخريطة (بالضغط عليها، بالبحث عن عنوان، أو بزر "استخدم موقعي الحالي") قبل إنشاء الحساب.';
        return;
      }
      const button = $('button[type="submit"]', signupForm);
      button.disabled = true;
      try {
        const fields = {
          email: $('#su-email', signupForm).value.trim(),
          name: $('#su-name', signupForm).value.trim(),
          phone: $('#su-phone', signupForm).value.trim(),
          password: $('#su-pass', signupForm).value,
          latitude: geoValue.lat,
          longitude: geoValue.lng,
          address: geoValue.formatted || null,
          google_place_id: geoValue.placeId || null
        };
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(fields)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذّر إنشاء الحساب.');
        if (window.NasaqCloud) window.NasaqCloud.saveSession(data);
        location.href = '/';
      } catch (error) {
        formError(signupForm, error.message);
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ---------- مناطق رفع الملفات ---------- */
  function initDropzones() {
    $$('.dropzone').forEach((zone) => {
      if (zone.closest('[data-wizard]')) return;   /* الـ Wizard بيدير الـ dropzones بتاعته */
      const input = $('input[type="file"]', zone);
      const label = $('[data-dz-label]', zone);
      if (!input) return;
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        zone.classList.toggle('has-file', !!file);
        if (label) label.textContent = file ? file.name : label.dataset.default;
      });
    });
  }

  /* ---------- تأكيد كلمة المرور ---------- */
  function passwordsMatch(form) {
    const pass = $('[data-pass]', form);
    const confirm = $('[data-pass-confirm]', form);
    if (!pass || !confirm) return true;
    const ok = pass.value === confirm.value;
    confirm.setAttribute('aria-invalid', String(!ok));
    const err = $('#err-' + confirm.id, form);
    if (err) err.textContent = ok ? '' : 'كلمتا المرور غير متطابقتين';
    return ok;
  }

  /* ---------- تجهيز صور المستندات قبل الرفع ----------
     نتأكد أنها صورة قابلة للقراءة ونصغّرها (حتى 1600px، JPEG) لتخفيف الحجم وضمان حد الـ 5 ميجابايت. */
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذّر قراءة الصورة «' + file.name + '». استخدم JPG أو PNG.')); };
      img.src = url;
    });
  }
  async function prepareImage(file) {
    if (!/^image\//.test(file.type)) throw new Error('الملف «' + file.name + '» ليس صورة.');
    const img = await readImage(file);
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    if (dataUrl.length * 0.75 > 5 * 1024 * 1024) throw new Error('حجم الصورة «' + file.name + '» كبير جداً.');
    return dataUrl;
  }

  /* ---------- إرسال نموذج التاجر / المندوب ----------
     الخطوتان: (1) إنشاء حساب دخول حقيقي عبر Supabase Auth،
     (2) إنشاء سجل المتجر/المندوب بحالة "قيد المراجعة" في قاعدة البيانات.
     المتجر/الحساب لا يعمل فعلياً إلا بعد اعتماد الإدمن له من لوحة الإدارة. */
  function initApplicationForm(formId, kind) {
    const form = $('#' + formId);
    if (!form || form.hasAttribute('data-wizard')) return;   /* الـ Wizard بيتولّى الإرسال (js/signup-wizards.js) */

    /* موقع المتجر على الخريطة (إلزامي لطلبات البائع فقط) — يحدَّد لحظة تقديم الطلب حتى
       يظهر المتجر لاحقاً للمشترين القريبين منه (٥٠ كم فأقل)، لا حسب المحافظة المكتوبة. */
    let sellerGeo = null;
    if (kind === 'seller') {
      const geoRoot = $('[data-geo-root]', form);
      if (geoRoot && window.Geo) sellerGeo = window.Geo.mount(geoRoot, {});
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!passwordsMatch(form)) { $('[data-pass-confirm]', form).focus(); return; }
      const terms = $('#f-terms', form);
      if (terms && !terms.checked) { terms.focus(); return; }
      if (!window.NasaqCloud) { formError(form, 'تعذّر الاتصال بالخادم.'); return; }

      let sellerGeoValue = null;
      if (kind === 'seller') {
        sellerGeoValue = sellerGeo ? sellerGeo.getValue() : null;
        const geoErr = $('#s-geo-error', form);
        if (geoErr) geoErr.textContent = '';
        if (!sellerGeoValue || sellerGeoValue.lat == null || sellerGeoValue.lng == null) {
          if (geoErr) geoErr.textContent = 'حدّد موقع متجرك على الخريطة قبل إرسال الطلب.';
          if ($('[data-geo-root]', form)) $('[data-geo-root]', form).scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const name = ($('[data-field-name]', form) || {}).value || '';
      const phone = ($('[data-field-phone]', form) || {}).value || '';
      const email = ($('[data-field-email]', form) || {}).value || '';
      const password = ($('[data-pass]', form) || {}).value || '';
      const button = $('button[type="submit"]', form);
      if (button) button.disabled = true;
      formError(form, '');

      try {
        /* الصور: نجهّزها قبل إنشاء الحساب حتى يظهر أي خطأ في الصورة قبل التسجيل */
        const prepared = {};
        for (const input of $$('input[type="file"][data-doc]', form)) {
          const file = input.files && input.files[0];
          if (file) prepared[input.dataset.doc] = await prepareImage(file);
        }
        /* لو الحساب اتعمل قبل كده (محاولة سابقة فشلت بعد التسجيل) نكمل بنفس الجلسة بدل إنشاء حساب جديد */
        let current = null;
        try { current = window.sb ? (await window.sb.auth.getUser()).data.user : null; } catch (_) { current = null; }
        if (!(current && current.email && current.email.toLowerCase() === email.trim().toLowerCase())) {
          await window.NasaqCloud.signup({ name, email, phone, password });
        }
        const documents = {};
        for (const key of Object.keys(prepared)) {
          documents[key] = await window.NasaqCloud.uploadDocument(prepared[key], key);
        }
        let application, entityId;
        if (kind === 'seller') {
          const out = await window.NasaqCloud.sellerApplication({
            ownerName: name,
            nationalId: ($('#s-nid', form) || {}).value || '',
            phone,
            storeName: ($('#s-store-name', form) || {}).value || '',
            license: ($('#s-license', form) || {}).value || '',
            address: ($('#s-address', form) || {}).value || '',
            latitude: sellerGeoValue.lat,
            longitude: sellerGeoValue.lng,
            category: 'clothes',
            documents
          });
          application = out && out.application; entityId = out && out.store && out.store.id;
        } else {
          const vehicleEl = $('input[name="vehicle"]:checked', form);
          const out = await window.NasaqCloud.riderApplication({
            name, phone,
            nationalId: ($('#r-nid', form) || {}).value || '',
            city: ($('#r-gov', form) || {}).value || '',
            area: ($('#r-area', form) || {}).value || '',
            coverage: ($('#r-range', form) || {}).value || '',
            vehicle: vehicleEl ? vehicleEl.value : 'motorbike',
            documents
          });
          application = out && out.application; entityId = out && out.rider && out.rider.id;
        }
        sessionStorage.setItem('nasaqApplication', JSON.stringify({
          requestId: (application && application.request_id) || '—',
          accountType: kind === 'seller' ? 'تاجر / صاحب محل' : 'مندوب توصيل',
          name, phone, entityId, submittedAt: Date.now()
        }));
        location.href = '/application-status';
      } catch (error) {
        formError(form, (error && error.message) || 'تعذّر إرسال الطلب، حاول مرة أخرى.');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  /* ---------- صفحة application-status ---------- */
  function initStatusPage() {
    const root = $('#request-details');
    if (!root) return;

    let data;
    try { data = JSON.parse(sessionStorage.getItem('nasaqApplication')); } catch (e) { data = null; }
    if (!data) data = { requestId: 'NSQ-' + new Date().getFullYear() + '-0000', accountType: 'حساب جديد', name: '', phone: '—', submittedAt: Date.now() };

    const minsAgo = Math.max(0, Math.round((Date.now() - data.submittedAt) / 60000));
    $('[data-d-id]').textContent = '#' + data.requestId;
    $('[data-d-type]').textContent = data.accountType;
    $('[data-d-phone]').textContent = data.phone || '—';
    $('[data-d-time]').textContent = minsAgo <= 1 ? 'الآن' : ('منذ ' + minsAgo + ' دقيقة');

    /* ملاحظة: خطوة رمز التحقق (OTP) أدناه عرض تجريبي فقط لعدم ربط مزود SMS/واتساب
       فعلي بعد؛ حالة اعتماد الحساب نفسها حقيقية ومقروءة من قاعدة البيانات. */
    const dest = data.accountType === 'مندوب توصيل' ? '/rider' : '/seller';
    const confirmLink = $('[data-status-dest]');
    if (confirmLink) confirmLink.setAttribute('href', dest);

    /* أرقام OTP */
    const boxes = $$('.otp input');
    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/\D/g, '').slice(0, 1);
        box.classList.toggle('is-filled', !!box.value);
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && boxes[i - 1]) boxes[i - 1].focus();
      });
    });

    /* عداد إعادة الإرسال */
    const timerEl = $('#otp-timer');
    const resendBtn = $('#resend-btn');
    let seconds = 42;
    const tick = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(tick);
        resendBtn.removeAttribute('disabled');
        resendBtn.textContent = 'إرسال الرمز عبر واتساب';
        return;
      }
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      timerEl.textContent = m + ':' + s;
    }, 1000);

    resendBtn.addEventListener('click', () => {
      if (resendBtn.hasAttribute('disabled')) return;
      UI.toast('تم إرسال رمز جديد عبر واتساب');
      seconds = 42;
      resendBtn.setAttribute('disabled', '');
    });

    /* تأكيد الرمز */
    const confirmBtn = $('#confirm-otp-btn');
    confirmBtn.addEventListener('click', () => {
      const code = boxes.map((b) => b.value).join('');
      if (code.length < boxes.length) {
        UI.toast('من فضلك أدخل الرمز كاملاً', { type: 'error' });
        boxes.find((b) => !b.value).focus();
        return;
      }
      $('.status-hero').hidden = true;
      $('.status-list').hidden = true;
      $('.status-details').hidden = true;
      $('.otp-section').hidden = true;
      $('.status-actions').hidden = true;
      $('.status-success').classList.add('is-visible');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAuthTabs();
    initAuthForms();
    initDropzones();
    initApplicationForm('seller-form', 'seller');
    initApplicationForm('rider-form', 'rider');
    initStatusPage();
  });
})();
