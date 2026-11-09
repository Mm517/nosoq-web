/* ==========================================================================
   js/checkout.js — التحقق من نموذج الشحن والدفع + ملخص الطلب + تأكيد الطلب
   ملاحظة أمان: هذا النموذج واجهة فقط ولا يرسل بيانات البطاقة لأي مكان.
   عند الإطلاق استبدل خطوة placeOrder ببوابة دفع (Stripe / Tap / Moyasar …)
   بحيث تُدخَل بيانات البطاقة في حقول تستضيفها البوابة نفسها.
   ========================================================================== */
(function () {
  'use strict';
  const root = document.getElementById('checkout-root');
  if (!root) return;

  const CFG = window.Store.config;
  const esc = window.Store.esc;
  const money = window.Store.money;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let done = false;

  /* ---------- حالة السلة الفارغة ---------- */
  function showEmpty() {
    root.innerHTML = UI.emptyHTML({
      icon: 'bag', title: 'لا توجد منتجات لإتمام الطلب',
      text: 'سلتك فارغة حالياً. أضف بعض القطع ثم عد لإكمال الشراء.',
      actions: [{ label: 'تصفّح المتجر', href: '/shop', primary: true }]
    });
    root.setAttribute('aria-busy', 'false');
  }
  if (Cart.count() === 0) { showEmpty(); return; }

  const form = $('#checkout-form');
  const errBox = $('#form-errors');
  const payBtn = $('#pay-btn');

  /* تعبئة العنوان تلقائياً من الموقع الذي حدّده العميل (خرائط جوجل / GPS) */
  const savedLoc = UI.loc.details();
  if (savedLoc) {
    [['#f-city', savedLoc.city], ['#f-postal', savedLoc.postal], ['#f-address', [savedLoc.street, savedLoc.area, savedLoc.note].filter(Boolean).join('، ')]].forEach((x) => {
      const el = $(x[0]);
      if (el && x[1] && !el.value) el.value = x[1];
    });
  }

  /* ---------- أدوات ---------- */
  const toLatin = (s) => String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const digits = (s) => toLatin(s).replace(/\D/g, '');
  const method = () => ($('input[name="shipping"]:checked', form) || {}).value || 'standard';
  const payment = () => ($('input[name="payment"]:checked', form) || {}).value || 'card';

  function luhn(num) {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = Number(num[i]);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  }

  /* ---------- قواعد التحقق: تُرجع نص الخطأ أو '' ---------- */
  const rules = {
    'f-name': (v) => (v.trim().length >= 3 ? '' : 'أدخل اسمك الكامل (3 أحرف على الأقل)'),
    'f-email': (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'أدخل بريداً إلكترونياً صحيحاً، مثل name@example.com'),
    'f-phone': (v) => {
      if (!/^[+\d\s()-]+$/.test(toLatin(v).trim())) return 'أدخل رقم جوال يحتوي على أرقام فقط';
      const n = digits(v).length;
      return n >= 8 && n <= 15 ? '' : 'رقم الجوال يجب أن يكون بين 8 و15 رقماً';
    },
    'f-address': (v) => (v.trim().length >= 8 ? '' : 'أدخل العنوان بالتفصيل (الحي، الشارع، رقم المبنى)'),
    'f-city': (v) => (v.trim().length >= 2 ? '' : 'أدخل اسم المدينة'),
    'f-postal': (v) => (!v.trim() || /^[A-Za-z0-9 -]{3,10}$/.test(toLatin(v).trim()) ? '' : 'الرمز البريدي غير صحيح'),
    'f-card': (v) => {
      const n = digits(v);
      if (n.length < 13 || n.length > 19) return 'رقم البطاقة يجب أن يكون بين 13 و19 رقماً';
      return luhn(n) ? '' : 'رقم البطاقة غير صحيح، راجع الأرقام';
    },
    'f-cardname': (v) => (v.trim().length >= 3 ? '' : 'أدخل الاسم كما هو مكتوب على البطاقة'),
    'f-exp': (v) => {
      const m = /^(\d{2})\/(\d{2})$/.exec(toLatin(v).trim());
      if (!m) return 'أدخل تاريخ الانتهاء بصيغة MM/YY';
      const month = Number(m[1]), year = 2000 + Number(m[2]);
      if (month < 1 || month > 12) return 'الشهر يجب أن يكون بين 01 و12';
      return new Date(year, month, 0, 23, 59, 59) >= new Date() ? '' : 'البطاقة منتهية الصلاحية';
    },
    'f-cvv': (v) => (/^\d{3,4}$/.test(digits(v)) && digits(v) === toLatin(v).trim() ? '' : 'رمز CVV مكوّن من 3 أو 4 أرقام'),
    'f-terms': () => ''
  };
  const cardOnly = ['f-card', 'f-cardname', 'f-exp', 'f-cvv'];
  const isActive = (id) => !cardOnly.includes(id) || payment() === 'card';

  const labelOf = (input) => {
    const l = $('label[for="' + input.id + '"]', form);
    return l ? l.textContent.replace('*', '').trim() : input.name;
  };

  function setError(input, msg) {
    const box = $('#err-' + input.id);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (box) box.textContent = msg;
    } else {
      input.removeAttribute('aria-invalid');
      if (box) box.textContent = '';
    }
  }

  function validateField(input) {
    if (!rules[input.id] || !isActive(input.id)) { setError(input, ''); return ''; }
    const msg = rules[input.id](input.value);
    setError(input, msg);
    return msg;
  }

  function validateAll() {
    const errors = [];
    $$('.input[id^="f-"]', form).forEach((input) => {
      const msg = validateField(input);
      if (msg) errors.push({ input, msg });
    });
    const terms = $('#f-terms');
    if (!terms.checked) {
      $('#err-f-terms').textContent = 'يجب الموافقة على الشروط لإتمام الطلب';
      terms.setAttribute('aria-invalid', 'true');
      errors.push({ input: terms, msg: 'يجب الموافقة على الشروط لإتمام الطلب' });
    } else { $('#err-f-terms').textContent = ''; terms.removeAttribute('aria-invalid'); }
    return errors;
  }

  function showErrorSummary(errors) {
    errBox.hidden = false;
    errBox.innerHTML = '<strong>يرجى تصحيح ' + errors.length + (errors.length === 1 ? ' حقل' : ' حقول') + ' قبل المتابعة:</strong><ul>' +
      errors.map((e) => '<li><a href="#' + e.input.id + '">' + esc(labelOf(e.input) || 'الشروط') + ': ' + esc(e.msg) + '</a></li>').join('') + '</ul>';
    errBox.focus();
  }

  /* ---------- تنسيق الإدخال ---------- */
  const fmt = {
    'f-card': (v) => digits(v).slice(0, 19).replace(/(.{4})/g, '$1 ').trim(),
    'f-exp': (v) => { const d = digits(v).slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; },
    'f-cvv': (v) => digits(v).slice(0, 4),
    'f-phone': (v) => toLatin(v).replace(/[^\d+\s()-]/g, '')
  };
  Object.keys(fmt).forEach((id) => {
    const el = $('#' + id);
    if (el) el.addEventListener('input', () => { const f = fmt[id](el.value); if (f !== el.value) el.value = f; });
  });

  /* التحقق عند مغادرة الحقل، وإخفاء الخطأ فور التصحيح */
  $$('.input[id^="f-"]', form).forEach((input) => {
    input.addEventListener('blur', () => { if (input.value || input.getAttribute('aria-invalid')) validateField(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid')) validateField(input); });
  });
  $('#f-terms').addEventListener('change', (e) => { if (e.target.checked) { $('#err-f-terms').textContent = ''; e.target.removeAttribute('aria-invalid'); } });

  errBox.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (t) { t.scrollIntoView({ block: 'center' }); t.focus(); }
  });

  /* ---------- طريقة الدفع والشحن ---------- */
  function syncPayment() {
    const card = payment() === 'card';
    $('#card-fields').hidden = !card;
    if (!card) cardOnly.forEach((id) => setError($('#' + id), ''));
  }
  $$('input[name="payment"]', form).forEach((r) => r.addEventListener('change', syncPayment));
  $$('input[name="shipping"]', form).forEach((r) => r.addEventListener('change', renderSummary));

  /* ---------- ملخص الطلب ---------- */
  function renderSummary() {
    if (done) return;
    if (Cart.count() === 0) { showEmpty(); return; }
    const t = Cart.totals({ method: method() });
    const std = Cart.totals({ method: 'standard' }).shipping;
    const ex = Cart.totals({ method: 'express' }).shipping;
    $('[data-ship-price="standard"]').textContent = std === 0 ? 'مجاني' : money(std);
    $('[data-ship-price="express"]').textContent = ex === 0 ? 'مجاني' : money(ex);
    $('#checkout-summary').innerHTML =
      '<ul class="checkout__items" aria-label="منتجات الطلب">' + Cart.lines().map(UI.miniLineHTML).join('') + '</ul>' +
      UI.summaryHTML(t, { uid: 'co' });
    payBtn.querySelector('[data-pay-total]').textContent = money(t.total);
  }

  /* ---------- إرسال الطلب ---------- */
  function placeOrder() {
    const m = method();
    const totals = Cart.totals({ method: m });
    const lines = Cart.lines();
    const customer = {
      name: $('#f-name').value.trim(), email: $('#f-email').value.trim(), city: $('#f-city').value.trim(),
      phone: $('#f-phone').value.trim(), address: $('#f-address').value.trim()
    };
    const pay = payment();

    payBtn.disabled = true;
    payBtn.querySelector('[data-pay-label]').textContent = 'جارٍ إتمام الطلب…';

    /* تحقق من الكوبون في السيرفر قبل ما نكمّل (الكود/الحد الأدنى/الصلاحية/عدد الاستخدامات) */
    const usedCoupon = totals.coupon && totals.coupon.valid ? totals.coupon.code : null;
    (Cart.verifyCoupon ? Cart.verifyCoupon() : Promise.resolve({ ok: true })).then((v) => {
      if (v && v.ok === false) {
        Cart.removeCoupon();
        payBtn.disabled = false;
        payBtn.querySelector('[data-pay-label]').textContent = 'إتمام الطلب';
        errBox.hidden = false;
        errBox.textContent = (v.message || 'الكوبون غير صالح') + ' — تم إزالته من طلبك، راجع الإجمالي وأكمل.';
        return;
      }
      submit(usedCoupon);
    });

    function submit(couponCode) {
    /* هنا يُستدعى الخادم/بوابة الدفع. نحاكي الانتظار فقط. */
    setTimeout(() => {
      done = true;
      const number = 'NQ-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 90 + 10);
      if (window.Market) window.Market.orders.record({ number, totals, lines, customer, method: m, pay });   // يظهر عند البائع كطلب وارد
      if (couponCode && Cart.redeemCoupon) Cart.redeemCoupon(couponCode);   // عدّاد استخدام الكوبون في السيرفر
      Cart.clear();
      showConfirmation({ number, totals, lines, customer, method: m, pay });
    }, 900);
    }
  }

  function showConfirmation(o) {
    const first = o.customer.name.split(/\s+/)[0];
    const eta = o.method === 'express' ? 'من 1 إلى 2 يوم عمل' : 'من 3 إلى 5 أيام عمل';
    document.title = 'تم استلام طلبك | ' + CFG.name;
    root.innerHTML =
      '<section class="confirm" aria-labelledby="confirm-title">' +
        '<div class="confirm__icon">' + UI.icon('check') + '</div>' +
        '<h1 id="confirm-title" tabindex="-1">شكراً ' + esc(first) + '، تم استلام طلبك</h1>' +
        '<p>أرسلنا تفاصيل الطلب إلى <strong dir="ltr">' + esc(o.customer.email) + '</strong>.</p>' +
        '<p class="confirm__number" dir="ltr">' + o.number + '</p>' +
        '<div class="confirm__box"><dl>' +
          '<div><dt>عدد القطع</dt><dd>' + o.lines.reduce((n, l) => n + l.qty, 0) + '</dd></div>' +
          '<div><dt>التوصيل إلى</dt><dd>' + esc(o.customer.city) + '</dd></div>' +
          '<div><dt>موعد الوصول المتوقع</dt><dd>' + eta + '</dd></div>' +
          '<div><dt>طريقة الدفع</dt><dd>' + (o.pay === 'card' ? 'بطاقة بنكية' : 'الدفع عند الاستلام') + '</dd></div>' +
          '<div class="summary__total"><dt>الإجمالي</dt><dd>' + money(o.totals.total) + '</dd></div></dl></div>' +
        '<a class="btn btn--primary btn--lg" href="/shop">متابعة التسوق</a>' +
      '</section>';
    const h = $('#confirm-title');
    if (h) h.focus();
    window.scrollTo({ top: 0, behavior: UI.reduceMotion() ? 'auto' : 'smooth' });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errors = validateAll();
    if (errors.length) {
      showErrorSummary(errors);
      return;
    }
    errBox.hidden = true;
    placeOrder();
  });

  /* ---------- البداية ---------- */
  syncPayment();
  renderSummary();
  Cart.subscribe(renderSummary);
  root.setAttribute('aria-busy', 'false');
})();
