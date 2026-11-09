/* Nasaq cloud sync.
   The storefront keeps its existing local UI state for instant interactions,
   while this bridge mirrors users, stores, products, orders, applications, and
   image URLs to the Supabase-backed API. */
(function () {
  'use strict';

  const USER_KEY = 'nasaq_cloud_user_v1';
  const TOKEN_KEY = 'nasaq_access_token_v1';
  const SESSION_KEY = 'nasaq_session_v1';
  const getSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
  };
  const getUserId = () => {
    try {
      const session = getSession();
      if (session && session.userId) return session.userId;
      let id = localStorage.getItem(USER_KEY);
      if (!id) {
        id = 'browser-' + crypto.randomUUID();
        localStorage.setItem(USER_KEY, id);
      }
      return id;
    } catch (_) {
      return 'browser-session';
    }
  };

  async function request(path, body, method) {
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch('/api' + path, {
      method: method || 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: body == null ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
    if (!response.ok) throw new Error((data && data.error) || 'تعذّر الاتصال بالخادم');
    return data;
  }

  const safe = (promise) => promise.catch((err) => {
    window.dispatchEvent(new CustomEvent('nasaq:cloud-error', { detail: err.message }));
    return null;
  });

  async function syncUser(data) {
    return request('/store/users/upsert', Object.assign({
      externalId: getUserId(), role: 'customer', name: 'عميل نَسَق'
    }, data || {}));
  }

  async function uploadImage(dataUrl, filename) {
    if (!/^data:image\//.test(dataUrl || '')) return dataUrl;
    const out = await request('/store/uploads', { dataUrl, filename: filename || 'product-image' });
    return out && (out.publicUrl || out.proxyUrl) || dataUrl;
  }

  /* رفع فيديو المنتج (bucket عام: product-videos)؛ يُرجع الرابط كما هو لو لم يكن data: أصلاً */
  async function uploadVideo(dataUrl, filename) {
    if (!/^data:video\//.test(dataUrl || '')) return { publicUrl: dataUrl, path: null };
    const out = await request('/store/uploads/video', { dataUrl, filename: filename || 'product-video' });
    return out || { publicUrl: null, path: null };
  }

  /* مزامنة ألوان المنتج (Variants): يستبدل القائمة كاملة في قاعدة البيانات، ويرفع أي
     صورة جديدة (data:) قبل الحفظ. يُستدعى بعد نجاح حفظ المنتج نفسه (نحتاج uuid المنتج). */
  async function syncProductColors(productUuid, colors) {
    const out = await request('/store/products/' + productUuid + '/colors', { colors: colors || [] });
    return (out && out.colors) || [];
  }

  /* رفع صورة مستند من طلب تقديم (بطاقة / صورة شخصية / واجهة محل) إلى bucket خاص.
     يُرجع مسار الملف (وليس رابطاً عاماً) ليُحفظ داخل طلب التقديم. */
  async function uploadDocument(dataUrl, kind) {
    const out = await request('/store/application-uploads', { dataUrl, kind });
    if (!out || !out.path) throw new Error('تعذّر رفع الصورة.');
    return out.path;
  }

  async function syncProduct(p) {
    const photos = [];
    for (let i = 0; i < (p.photos || []).length; i++) {
      photos.push(await uploadImage(p.photos[i], 'product-' + (p.id || 'new') + '-' + i));
    }
    return request('/store/products/upsert', {
      legacyId: Number.isFinite(Number(p.id)) ? Number(p.id) : null,
      storeId: p.storeId || null,
      sellerExternalId: p.sellerId || (p.seller && p.seller.id) || null,
      name: p.name || '',
      nameAr: p.name || '', nameEn: p.nameEn || '', nameDe: p.nameDe || '',
      descriptionAr: p.description || '', descriptionEn: p.descriptionEn || '', descriptionDe: p.descriptionDe || '',
      slug: p.slug || null,
      category: p.category || 'clothes',
      price: Number(p.price || 0),
      oldPrice: p.oldPrice == null ? null : Number(p.oldPrice),
      stock: Number(p.stock || 0),
      status: p.status || 'active',
      sku: p.sku || null,
      description: p.description || null,
      details: Array.isArray(p.details) ? p.details : [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      /* العمود القديم colors (jsonb) للتوافق فقط: بلا صور (تُرفع وتُخزَّن بشكل حقيقي عبر
         syncProductColors بعد نجاح هذا الحفظ) لتفادي إرسال صور base64 ضخمة مرتين. */
      colors: Array.isArray(p.colors) ? p.colors.map((c) => ({ name: c.name, hex: c.hex, stock: Number(c.stock || 0) })) : [],
      photos,
      videoUrl: p.videoUrl || null,
      videoPath: p.videoPath || null
    });
  }

  async function syncOrder(order, source) {
    const customer = (order && order.customer) || {};
    /* مزامنة ملف العميل فقط لو مسجّل دخول فعلاً؛ عميل زائر (بدون حساب) لا يملك
       جلسة Supabase حقيقية فتفشل RLS هنا — وتفشل معها مزامنة الطلب كله لو لم
       نتجاهل الخطأ، فيختفي الطلب عن البائع والمندوب والإدارة رغم دفعه فعلياً. */
    if (getSession()) {
      try {
        await syncUser({
          email: customer.email || null,
          name: customer.name || 'عميل نَسَق',
          phone: customer.phone || null,
          role: 'customer'
        });
      } catch (_) { /* لا نمنع حفظ الطلب بسبب فشل تحديث الملف الشخصي فقط */ }
    }
    return request('/store/orders', {
      orderNumber: order.id,
      customerExternalId: getUserId(),
      customer,
      shipping: Number(order.shipping || 0),
      discount: Number(order.discount || 0),
      total: Number(order.total || 0),
      payment: order.payment || (source && source.pay) || 'cod',
      method: order.method || (source && source.method) || 'standard',
      lines: (order.lines || []).map(function (line) {
        return {
          productId: line.productId || null,
          productUuid: line.productUuid || null,
          productName: line.name || line.productName || '',
          quantity: Number(line.qty || line.quantity || 1),
          unitPrice: Number(line.price || line.unitPrice || 0),
          size: line.size || null,
          color: line.color || null,
          sellerExternalId: line.sellerId || line.sellerExternalId || null
        };
      })
    });
  }

  async function syncStore(s) {
    if (!s) return null;
    await syncUser({ externalId: s.id, name: s.name, email: s.email, phone: s.phone, role: 'seller' });
    const logo = s.logo ? await uploadImage(s.logo, 'store-logo-' + s.slug) : null;
    return request('/store/stores/upsert', {
      ownerExternalId: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category || null,
      phone: s.phone || null,
      email: s.email || null,
      description: s.description || null,
      logoUrl: logo,
      address: s.address || {},
      latitude: (s.address && s.address.lat != null) ? s.address.lat : (s.latitude != null ? s.latitude : null),
      longitude: (s.address && s.address.lng != null) ? s.address.lng : (s.longitude != null ? s.longitude : null)
    });
  }

  async function submitApplication(data) {
    return request('/store/applications', data);
  }

  /* تسجيل حساب جديد عبر Supabase Auth (بريد + كلمة مرور)، يُستخدم كخطوة أولى
     قبل تقديم طلب بائع أو مندوب، حتى يكون لصاحب الطلب حساب دخول فوراً. */
  async function signup(fields) {
    const out = await request('/auth/signup', fields);
    if (out) window.NasaqCloud.saveSession(out);
    return out;
  }

  async function sellerApplication(data) {
    const out = await request('/store/seller-application', data);
    if (out && out.access_token) window.NasaqCloud.saveSession(out);
    return out;
  }

  async function riderApplication(data) {
    const out = await request('/store/rider-application', data);
    if (out && out.access_token) window.NasaqCloud.saveSession(out);
    return out;
  }

  async function applicationStatus() {
    return request('/store/application-status', null, 'GET');
  }

  async function submitSupport(data) {
    return request('/store/support', data);
  }

  /* ---- الدعم (تذاكر حقيقية في قاعدة البيانات) ---- */
  const supportMine = () => request('/support/mine', null, 'GET');
  const supportReply = (ticket, body) => request('/support/' + encodeURIComponent(ticket) + '/reply', { body });
  const supportSetStatus = (ticket, status) => request('/support/' + encodeURIComponent(ticket) + '/status', { status }, 'PATCH');

  /* ---- موقع الزائر (بلا حساب) يُحفظ بمعرّف جهاز ثابت ---- */
  const DEVICE_KEY = 'nasaq_device_id_v1';
  function deviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id) { id = 'dev-' + crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
      return id;
    } catch (_) { return 'dev-' + Math.random().toString(36).slice(2, 12); }
  }
  const saveVisitorLocation = (loc) => request('/store/visitor-location', {
    deviceId: deviceId(), latitude: loc.lat, longitude: loc.lng, address: loc.address || null, accuracy: loc.accuracy != null ? loc.accuracy : null
  });

  /* ---- عدّادات المشاهدة/السلة (fire-and-forget؛ لا تُظهر أخطاء للمشتري) ---- */
  const seenViews = new Set();
  function trackEvent(productUuid, kind) {
    if (!productUuid) return;
    const key = kind + ':' + productUuid;
    if (kind === 'view') {
      try { if (sessionStorage.getItem('nq_v_' + productUuid)) return; sessionStorage.setItem('nq_v_' + productUuid, '1'); } catch (_) { if (seenViews.has(key)) return; seenViews.add(key); }
    }
    request('/store/track', { productUuid, kind }).catch(() => {});
  }

  /* ---- بيانات لوحة البائع المحفوظة ---- */
  const sellerStats = (days) => request('/seller/stats?days=' + (days || 90), null, 'GET');
  const sellerDataGet = () => request('/seller/data', null, 'GET');
  const sellerDataSet = (key, value) => request('/seller/data/' + encodeURIComponent(key), { value }, 'PUT');

  window.NasaqCloud = {
    getUserId, request,
    getSession,
    saveSession(data) {
      if (!data) return;
      try {
        if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
        if (data.user) localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        if (data.user && data.user.userId) localStorage.setItem(USER_KEY, data.user.userId);
      } catch (_) { /* التخزين غير متاح */ }
    },
    clearSession() {
      try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSION_KEY); } catch (_) { /* تجاهل */ }
      if (window.BuyerLocation && window.BuyerLocation.clear) window.BuyerLocation.clear();
    },
    token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } },
    syncUser: (data) => safe(syncUser(data)),
    syncProduct: (p) => safe(syncProduct(p)),
    syncOrder: (o, source) => safe(syncOrder(o, source)),
    syncStore: (s) => safe(syncStore(s)),
    submitApplication: (data) => safe(submitApplication(data)),
    submitSupport: (data) => safe(submitSupport(data)),
    /* هذه الثلاثة لا تُغلَّف بـ safe() عمداً: الصفحة التي تستدعيها تحتاج أن
       تعرض رسالة الخطأ نفسها للمستخدم (مثلاً بريد مسجَّل من قبل). */
    signup: (fields) => signup(fields),
    sellerApplication: (data) => sellerApplication(data),
    riderApplication: (data) => riderApplication(data),
    uploadDocument: (dataUrl, kind) => uploadDocument(dataUrl, kind),
    applicationStatus: () => applicationStatus(),
    uploadImage: (dataUrl, filename) => safe(uploadImage(dataUrl, filename)),
    /* رفع الفيديو وألوان المنتج: كانت مستدعاة من market.js لكن غير مُصدَّرة (فيفشل الحفظ) — لا تُغلَّف بـ safe()
       لأن البائع لازم يشوف رسالة الخطأ الحقيقية (حجم الفيديو، صيغة غير مدعومة...). */
    uploadVideo: (dataUrl, filename) => uploadVideo(dataUrl, filename),
    syncProductColors: (productUuid, colors) => syncProductColors(productUuid, colors),
    submitSupportRaw: (data) => submitSupport(data),
    supportMine, supportReply, supportSetStatus,
    saveVisitorLocation: (loc) => safe(saveVisitorLocation(loc)),
    deviceId, trackEvent, sellerStats, sellerDataGet, sellerDataSet
  };
})();