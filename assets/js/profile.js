(function () {
  'use strict';
  const root = document.getElementById('profile-root');
  if (!root) return;
  const esc = (value) => {
    const node = document.createElement('span');
    node.textContent = String(value == null ? '' : value);
    return node.innerHTML;
  };
  const roleNames = { customer: 'عميل', seller: 'بائع شريك', rider: 'مندوب توصيل', admin: 'مشرف نَسَق' };
  const roleCopy = {
    seller: ['لوحة البائع', 'أدر متجرك ومنتجاتك وطلباتك', '/seller'],
    rider: ['لوحة المندوب', 'تابع التوصيلات والأرباح اليومية', '/rider'],
    admin: ['لوحة الإدارة', 'شغّل السوق وتابع الدعم والطلبات', '/admin'],
    support: ['لوحة الدعم', 'رد على محادثات العملاء حسب نطاقك', '/support'],
    customer: ['ابدأ البيع معنا', 'حوّل منتجاتك إلى متجر على نَسَق', '/become-seller']
  };
  const ORDER_STATUS = { new: 'جديد', processing: 'قيد المعالجة', shipped: 'تم الشحن', completed: 'مكتمل', cancelled: 'ملغي' };
  function readSession() {
    try { return JSON.parse(localStorage.getItem('nasaq_session_v1') || 'null'); } catch (_) { return null; }
  }
  const CH = () => (window.NIcon ? window.NIcon('chev-left', { size: 18 }) : '');
  function roleLink(account) {
    const item = roleCopy[account.role] || roleCopy.customer;
    return '<a class="profile-role-link" href="' + item[2] + '"><span><strong>' + item[0] + '</strong><br><small>' + item[1] + '</small></span><span aria-hidden="true">' + CH() + '</span></a>';
  }
  function orderMarkupFrom(orders) {
    if (!orders || !orders.length) return '<div class="profile-orders__empty">لا توجد طلبات محفوظة بعد. <a href="/shop">تصفّح المنتجات</a></div>';
    return '<div class="profile-order-list">' + orders.map((order) => {
      const itemsCount = (order.order_items || []).reduce((n, l) => n + Number(l.quantity || 1), 0);
      const total = window.Store ? window.Store.money(order.total || 0) : (order.total || 0);
      return '<div class="profile-order"><span><strong dir="ltr">' + esc(order.order_number || order.id) + '</strong><small>' + itemsCount + ' قطعة</small></span><span><strong>' + esc(total) + '</strong><small>' + esc(ORDER_STATUS[order.status] || order.status || 'قيد المعالجة') + '</small></span></div>';
    }).join('') + '</div>';
  }
  function render(account, orders) {
    if (!account) {
      root.innerHTML = '<section class="profile-card profile-login-card"><h1>حسابك في نَسَق</h1><p class="profile-card__sub">سجّل الدخول لمتابعة طلباتك ومفضلاتك وإدارة مساحتك.</p><a class="btn btn--accent btn--lg" href="/auth">تسجيل الدخول</a><a class="btn btn--ghost btn--lg" href="/auth?tab=signup">إنشاء حساب</a></section>';
      return;
    }
    const name = account.name || (account.email || '').split('@')[0] || 'عميل نَسَق';
    const initials = name.trim().slice(0, 1);
    const orderMarkup = orders === null
      ? '<div class="profile-orders__empty">تعذّر تحميل طلباتك الآن. <a href="javascript:location.reload()">أعد المحاولة</a></div>'
      : orderMarkupFrom(orders);
    const hasLocation = account.latitude != null && account.longitude != null;
    const locationSummary = hasLocation
      ? esc(account.address || (Number(account.latitude).toFixed(5) + ', ' + Number(account.longitude).toFixed(5)))
      : 'لم تحدّد موقعك بعد.';
    root.innerHTML = '<section class="profile-hero"><div class="profile-identity"><div class="profile-avatar" aria-hidden="true">' + esc(initials) + '</div><div><p class="profile-kicker">مرحباً بك في نَسَق</p><h1>' + esc(name) + '</h1><p class="profile-email">' + esc(account.email || '') + '</p></div></div><span class="profile-role">' + esc(roleNames[account.role] || roleNames.customer) + '</span></section>' +
      '<div class="profile-grid"><section class="profile-card"><h2>بيانات الحساب</h2><p class="profile-card__sub">عدّل بياناتك وستظهر في حسابك وكل طلباتك القادمة.</p><form class="profile-form" data-profile-form><div class="profile-fields"><div class="field"><label for="profile-name">الاسم</label><input class="input" id="profile-name" name="name" value="' + esc(name) + '" autocomplete="name" required></div><div class="field"><label for="profile-phone">رقم الهاتف</label><input class="input" id="profile-phone" name="phone" value="' + esc(account.phone || '') + '" autocomplete="tel" dir="ltr" required></div><div class="field"><label for="profile-email">البريد الإلكتروني</label><input class="input" id="profile-email" value="' + esc(account.email || '') + '" dir="ltr" readonly></div></div><p class="profile-form__message" data-profile-message role="status"></p><div class="profile-actions"><button class="btn btn--primary" type="submit">حفظ البيانات</button><a class="btn btn--ghost" href="/shop?wishlist=1">المفضلة</a><a class="btn btn--ghost" href="/cart">سلة التسوق</a><button class="btn btn--quiet" type="button" data-profile-logout>تسجيل الخروج</button></div></form></section>' +
      '<section class="profile-card" data-location-card><h2>موقعك</h2><p class="profile-card__sub" data-location-summary>' + locationSummary + '</p><button class="btn btn--ghost" type="button" data-location-edit-toggle>' + (hasLocation ? 'تعديل الموقع' : 'تحديد الموقع') + '</button><form class="profile-form" data-location-form hidden><div data-geo-root></div><p class="profile-form__message" data-location-message role="status"></p><div class="profile-actions"><button class="btn btn--primary" type="submit">حفظ الموقع</button><button class="btn btn--quiet" type="button" data-location-cancel>إلغاء</button></div></form></section>' +
      '<section class="profile-card"><h2>مساحتك في نَسَق</h2><p class="profile-card__sub">الوصول السريع للأدوات المناسبة لدورك.</p><div class="profile-role-nav">' + roleLink(account) + (account.role === 'customer' ? '<a class="profile-role-link" href="/become-rider"><span><strong>انضم كمندوب توصيل</strong><br><small>قدّم طلبك وابدأ رحلتك مع نَسَق</small></span><span aria-hidden="true">' + CH() + '</span></a>' : '') +
        '<button type="button" class="profile-role-link profile-role-link--btn" data-open-support><span><strong>الدعم والمساعدة</strong><br><small>ابدأ محادثة مع فريق الدعم أو تابع محادثاتك</small></span><span aria-hidden="true">' + CH() + '</span></button>' +
        '</div></section>' +
      '<section class="profile-card profile-orders"><h2>طلباتك</h2><p class="profile-card__sub">آخر الطلبات المرتبطة بحسابك، محدّثة مباشرة من قاعدة البيانات.</p>' + orderMarkup + '</section></div>';
    const supportBtn = root.querySelector('[data-open-support]');
    if (supportBtn) supportBtn.addEventListener('click', () => { if (window.NasaqSupport) window.NasaqSupport.open(); });
    const form = root.querySelector('[data-profile-form]');
    if (form) form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const message = form.querySelector('[data-profile-message]');
      button.disabled = true;
      message.textContent = 'جارٍ حفظ البيانات…';
      try {
        const response = await window.NasaqCloud.request('/store/profile', {
          name: form.elements.name.value,
          phone: form.elements.phone.value
        }, 'PATCH');
        const next = Object.assign({}, account, response.profile || {});
        localStorage.setItem('nasaq_session_v1', JSON.stringify(next));
        render(next, orders);
        const nextMessage = root.querySelector('[data-profile-message]');
        if (nextMessage) nextMessage.textContent = 'تم حفظ بياناتك بنجاح.';
      } catch (error) {
        message.textContent = error.message || 'تعذّر حفظ البيانات.';
        button.disabled = false;
      }
    });
    /* ---------- تعديل الموقع ---------- */
    const locationCard = root.querySelector('[data-location-card]');
    if (locationCard) {
      const toggleBtn = locationCard.querySelector('[data-location-edit-toggle]');
      const form = locationCard.querySelector('[data-location-form]');
      const cancelBtn = locationCard.querySelector('[data-location-cancel]');
      const geoRoot = locationCard.querySelector('[data-geo-root]');
      let geoCtl = null;
      const openForm = () => {
        form.hidden = false;
        toggleBtn.hidden = true;
        /* نركّب أداة الخريطة أول ما النموذج يظهر فعلياً (مش وهو مخفي) عشان خريطة
           جوجل التفاعلية تترسم بمقاس صحيح */
        if (!geoCtl && window.Geo) {
          geoCtl = window.Geo.mount(geoRoot, {
            value: hasLocation ? { lat: account.latitude, lng: account.longitude, formatted: account.address || '', placeId: account.google_place_id || '' } : {}
          });
        }
      };
      const closeForm = () => { form.hidden = true; toggleBtn.hidden = false; };
      toggleBtn.addEventListener('click', openForm);
      cancelBtn.addEventListener('click', closeForm);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const message = form.querySelector('[data-location-message]');
        const geoValue = geoCtl ? geoCtl.getValue() : null;
        if (!geoValue || geoValue.lat == null || geoValue.lng == null) {
          message.textContent = 'من فضلك حدّد موقعك على الخريطة أولاً.';
          return;
        }
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        message.textContent = 'جارٍ حفظ الموقع…';
        try {
          const response = await window.NasaqCloud.request('/store/profile', {
            name: account.name,
            phone: account.phone,
            latitude: geoValue.lat,
            longitude: geoValue.lng,
            address: geoValue.formatted || null,
            google_place_id: geoValue.placeId || null
          }, 'PATCH');
          const next = Object.assign({}, account, response.profile || {});
          localStorage.setItem('nasaq_session_v1', JSON.stringify(next));
          if (window.BuyerLocation) window.BuyerLocation.save({ lat: geoValue.lat, lng: geoValue.lng, address: geoValue.formatted, placeId: geoValue.placeId, details: geoValue, localOnly: true });
          render(next, orders);
        } catch (error) {
          message.textContent = error.message || 'تعذّر حفظ الموقع.';
          button.disabled = false;
        }
      });
    }

    const logout = root.querySelector('[data-profile-logout]');
    if (logout) logout.addEventListener('click', () => {
      const done = () => { if (window.NasaqCloud) window.NasaqCloud.clearSession(); location.href = '/'; };
      if (window.NasaqCloud) window.NasaqCloud.request('/auth/logout', null, 'POST').then(done).catch(done); else done();
    });
  }
  async function boot() {
    let account = readSession();
    let orders = [];
    try {
      if (window.NasaqCloud && account) {
        const response = await window.NasaqCloud.request('/store/profile', null, 'GET');
        if (response && response.profile) {
          account = Object.assign({}, account, response.profile, { userId: account.userId, email: account.email || response.profile.email });
          localStorage.setItem('nasaq_session_v1', JSON.stringify(account));
        }
      }
    } catch (_) {
      /* الصفحة تظل مفيدة بالجلسة المحلية إذا تعذر الاتصال مؤقتاً */
    }
    if (account) {
      try {
        orders = await window.NasaqCloud.request('/store/orders/mine', null, 'GET');
        if (!Array.isArray(orders)) orders = [];
      } catch (_) {
        orders = null; /* يعرض رسالة تعذّر التحميل بدل قائمة فارغة مضلِّلة */
      }
    }
    render(account, orders);
    if (window.NasaqSkeleton) window.NasaqSkeleton.done();
  }
  boot();
})();
