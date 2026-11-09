/* ==========================================================================
   js/buyer-location.js — موقع المشتري (window.BuyerLocation)

   مصدر واحد للموقع يخدم: فلترة المتاجر (٥٠ كم)، عنوان التوصيل في الهيدر،
   وصفحة «حسابي». هدفه: المستخدم يحدّد موقعه مرة واحدة بس.

   الترتيب (get متزامن لأن products.js بيبني الكتالوج بطلب XHR متزامن قبل الرسم):
   1) مسجّل دخول  → الموقع من صفّه في marketplace_users (السيرفر). لو السيرفر مش
      متاح لحظياً يُستخدم آخر نسخة محفوظة لنفس الحساب.
   2) مسجّل دخول وحسابه بلا موقع (حسابات قديمة) لكن فيه موقع محفوظ على الجهاز
      (زائر / نافذة التوصيل) → يُستخدم فوراً ويُرفع للسيرفر تلقائياً مرة واحدة،
      فمش هيتطلب منه تاني ولا من أي جهاز آخر.
   3) زائر → من الجهاز (localStorage).

   أي تحديد جديد (GPS / خريطة / بحث) يمرّ على save(): يُكتب محلياً فوراً،
   ولو المستخدم مسجّل دخول يُحفظ في السيرفر كمان.

   لازم يتحمّل بعد js/nasaq-config.js وقبل js/products.js (بشكل متزامن، بدون defer).
   ========================================================================== */
(function () {
  'use strict';

  const CACHE_KEY = 'nasaq_buyer_loc_v1';   /* آخر موقع معروف + الحساب صاحبه */
  const GUEST_KEY = 'nasaq_guest_loc_v1';   /* موقع الجهاز (زائر) */
  const SESSION_KEY = 'nasaq_session_v1';
  const LOC_KEY = 'nasaq_loc_v1', LOC2 = 'nasaq_loc_v2'; /* نفس مفاتيح عنوان التوصيل في ui.js */
  const SYNC_FLAG = 'nasaq_loc_synced_v1';

  function readJSON(k) {
    try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; }
  }
  function writeJSON(k, v) {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* تجاهل */ }
  }
  function getSession() { return readJSON(SESSION_KEY); }
  function valid(v) {
    return !!v && typeof v.lat === 'number' && typeof v.lng === 'number' && isFinite(v.lat) && isFinite(v.lng) &&
      Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180;
  }
  const num = (x) => (x == null || x === '' ? NaN : Number(x));

  /* اسم مختصر للهيدر من العنوان الكامل (لحين ما يجي اسم المدينة/الحي من Geo) */
  function shortLabel(address) {
    if (!address) return '';
    const parts = String(address).split(/[،,]/).map((x) => x.trim())
      .filter((x) => x && !/^\d+$/.test(x) && !/^(مصر|egypt)$/i.test(x));
    return parts[0] || '';
  }

  /* موقع محفوظ على الجهاز (زائر أو نافذة التوصيل) */
  function readDevice() {
    const g = readJSON(GUEST_KEY);
    if (valid(g)) return { lat: g.lat, lng: g.lng, address: g.address || '', placeId: g.placeId || '' };
    const d = readJSON(LOC2);
    if (d && valid({ lat: num(d.lat), lng: num(d.lng) })) {
      return { lat: Number(d.lat), lng: Number(d.lng), address: d.formatted || '', placeId: d.placeId || '' };
    }
    return null;
  }

  /* قراءة صف المستخدم من marketplace_users — طلب متزامن خفيف؛ null لو فشل، وfalse لو الصف بلا موقع */
  function fetchProfileLocation(userId) {
    try {
      const xhr = new XMLHttpRequest();
      const url = window.NASAQ_SUPABASE_URL + '/rest/v1/marketplace_users?select=latitude,longitude,address,google_place_id&external_id=eq.' +
        encodeURIComponent(userId) + '&limit=1';
      xhr.open('GET', url, false);
      xhr.setRequestHeader('apikey', window.NASAQ_SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', 'Bearer ' + window.NASAQ_SUPABASE_ANON_KEY);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        const row = (JSON.parse(xhr.responseText || '[]') || [])[0];
        if (row && row.latitude != null && row.longitude != null) {
          return { lat: Number(row.latitude), lng: Number(row.longitude), address: row.address || '', placeId: row.google_place_id || '' };
        }
        return false;
      }
    } catch (err) {
      console.error('[nasaq] تعذّر قراءة موقع الحساب:', err);
    }
    return null;
  }

  /* يضمن إن عنوان التوصيل في الهيدر (LOC2) يعكس الموقع الفعلي، على أي جهاز */
  function hydrateDelivery(v) {
    const d = readJSON(LOC2);
    const sameSpot = d && valid({ lat: num(d.lat), lng: num(d.lng) }) &&
      Math.abs(Number(d.lat) - v.lat) < 1e-5 && Math.abs(Number(d.lng) - v.lng) < 1e-5;
    if (sameSpot && (d.city || d.area)) return;
    const label = shortLabel(v.address);
    writeJSON(LOC2, Object.assign({}, sameSpot ? d : {}, { lat: v.lat, lng: v.lng, formatted: v.address || '', placeId: v.placeId || '', area: (sameSpot && d.area) || label }));
    try { if (label) localStorage.setItem(LOC_KEY, label); } catch (_) { /* تجاهل */ }
    refineLabel(v);
  }

  /* تحسين اسم المكان في الخلفية (مدينة/حي حقيقيين) بدون ما نعطّل الصفحة */
  function refineLabel(v, tries) {
    tries = tries || 0;
    if (!window.Geo || !window.Geo.reverse) { if (tries < 8) setTimeout(() => refineLabel(v, tries + 1), 1000); return; }
    window.Geo.reverse(v.lat, v.lng).then((a) => {
      if (!a || !(a.city || a.area)) return;
      const d = readJSON(LOC2) || {};
      if (Math.abs(Number(d.lat) - v.lat) > 1e-5 || Math.abs(Number(d.lng) - v.lng) > 1e-5) return; /* اتغيّر الموقع في الأثناء */
      writeJSON(LOC2, Object.assign({}, d, { city: a.city || '', area: a.area || d.area || '', region: a.region || '', country: a.country || '', countryCode: a.countryCode || '', formatted: d.formatted || a.formatted || '' }));
      try { localStorage.setItem(LOC_KEY, a.city || a.area || ''); } catch (_) { /* تجاهل */ }
      document.dispatchEvent(new CustomEvent('location:change'));
    }).catch(() => { /* اختياري */ });
  }

  /* رفع موقع الجهاز لحساب مسجَّل ما عندوش موقع على السيرفر */
  function pushToServer(userId, v) {
    const flag = userId + ':' + v.lat + ',' + v.lng;
    try { if (sessionStorage.getItem(SYNC_FLAG) === flag) return Promise.resolve(null); } catch (_) { /* تجاهل */ }
    const wait = window.NasaqCloud ? Promise.resolve() : new Promise((r) => window.addEventListener('DOMContentLoaded', r, { once: true }));
    return wait.then(() => {
      if (!window.NasaqCloud) return null;
      return window.NasaqCloud.request('/store/location', {
        latitude: v.lat, longitude: v.lng, location_accuracy: v.accuracy != null ? v.accuracy : null,
        address: v.address || null, google_place_id: v.placeId || null
      }, 'PATCH');
    }).then((res) => {
      try { sessionStorage.setItem(SYNC_FLAG, flag); } catch (_) { /* تجاهل */ }
      return res;
    });
  }

  /* الموقع الحالي {lat,lng,address,placeId,source} أو null لو غير معروف. متزامن. */
  function get() {
    const session = getSession();
    if (session && session.userId) {
      const fromServer = fetchProfileLocation(session.userId);
      if (fromServer && valid(fromServer)) {
        writeJSON(CACHE_KEY, Object.assign({ userId: session.userId }, fromServer));
        hydrateDelivery(fromServer);
        return Object.assign({ source: 'profile' }, fromServer);
      }
      if (fromServer === null) { /* السيرفر مش متاح: آخر نسخة لنفس الحساب */
        const c = readJSON(CACHE_KEY);
        if (c && c.userId === session.userId && valid(c)) return Object.assign({ source: 'cache' }, c);
      }
      /* الحساب بلا موقع على السيرفر: نستخدم موقع الجهاز ونرفعه له تلقائياً */
      const dev = readDevice();
      if (dev) {
        pushToServer(session.userId, dev).catch((e) => console.error('[nasaq] تعذّر رفع الموقع للسيرفر:', e));
        hydrateDelivery(dev);
        return Object.assign({ source: 'device' }, dev);
      }
      return null;
    }
    const guest = readDevice();
    if (guest) { hydrateDelivery(guest); pushVisitor(guest); return Object.assign({ source: 'guest' }, guest); }
    return null;
  }

  /* رفع موقع الجهاز لجدول visitor_locations (الزائر بلا حساب، أو أي جهاز) — مرة لكل موقع في الجلسة */
  function pushVisitor(loc) {
    try {
      const key = 'nasaq_vloc_sent_v1', sig = loc.lat.toFixed(5) + ',' + loc.lng.toFixed(5);
      if (sessionStorage.getItem(key) === sig) return;
      const send = () => {
        if (!window.NasaqCloud || !window.NasaqCloud.saveVisitorLocation) return;
        sessionStorage.setItem(key, sig);
        window.NasaqCloud.saveVisitorLocation({ lat: loc.lat, lng: loc.lng, address: loc.address || '', accuracy: loc.accuracy });
      };
      if (window.NasaqCloud) send(); else setTimeout(send, 1200);
    } catch (_) { /* تجاهل */ }
  }

  /* حفظ موقع جديد: محلياً فوراً + على السيرفر لو مسجّل دخول. يرجع Promise. */
  function save(v) {
    const loc = {
      lat: Number(v.lat), lng: Number(v.lng), address: v.address || v.formatted || '', placeId: v.placeId || '',
      accuracy: v.accuracy != null ? Number(v.accuracy) : null
    };
    if (!valid(loc)) return Promise.reject(new Error('إحداثيات الموقع غير صحيحة.'));
    if (!(loc.lat >= 21.5 && loc.lat <= 31.95 && loc.lng >= 24.5 && loc.lng <= 37.0)) return Promise.reject(new Error('الخدمة متاحة داخل مصر فقط.'));
    writeJSON(GUEST_KEY, { lat: loc.lat, lng: loc.lng, address: loc.address, placeId: loc.placeId });
    writeJSON(LOC2, Object.assign({}, v.details || {}, { lat: loc.lat, lng: loc.lng, formatted: loc.address, placeId: loc.placeId }));
    try { const t = (v.details && (v.details.city || v.details.area)) || shortLabel(loc.address); if (t) localStorage.setItem(LOC_KEY, t); } catch (_) { /* تجاهل */ }
    const session = getSession();
    writeJSON(CACHE_KEY, Object.assign({ userId: session && session.userId ? session.userId : null }, loc));
    document.dispatchEvent(new CustomEvent('location:change'));
    if (!v.localOnly) pushVisitor(loc); /* الموقع يُحفظ في الداتابيس للزائر أيضاً */
    if (v.localOnly || !(session && session.userId)) return Promise.resolve(loc);
    if (!window.NasaqCloud) return Promise.reject(new Error('تعذّر الاتصال بالخادم لحفظ الموقع.'));
    return window.NasaqCloud.request('/store/location', {
      latitude: loc.lat, longitude: loc.lng, location_accuracy: loc.accuracy,
      address: loc.address || null, google_place_id: loc.placeId || null
    }, 'PATCH').then(() => {
      try { sessionStorage.setItem(SYNC_FLAG, session.userId + ':' + loc.lat + ',' + loc.lng); } catch (_) { /* تجاهل */ }
      return loc;
    });
  }

  /* زر «استخدم موقعي الحالي»: GPS ← عنوان ← حفظ (جهاز + سيرفر) */
  function locate() {
    if (!window.Geo) return Promise.reject(new Error('أداة تحديد الموقع غير متاحة الآن.'));
    return window.Geo.locate().then((p) =>
      (window.Geo.reverse ? window.Geo.reverse(p.lat, p.lng).catch(() => null) : Promise.resolve(null)).then((a) =>
        save({ lat: p.lat, lng: p.lng, accuracy: p.accuracy, address: a && a.formatted, placeId: a && a.placeId, details: a || {} })));
  }

  /* تسجيل الخروج: نمسح موقع الجهاز حتى لا يظهر لشخص آخر يستخدم نفس الجهاز */
  function clear() {
    [CACHE_KEY, GUEST_KEY, LOC2, LOC_KEY].forEach((k) => { try { localStorage.removeItem(k); } catch (_) { /* تجاهل */ } });
    try { sessionStorage.removeItem(SYNC_FLAG); } catch (_) { /* تجاهل */ }
  }

  /* أسماء قديمة محفوظة للتوافق */
  const setGuestLocation = (lat, lng) => { const v = { lat: Number(lat), lng: Number(lng) }; writeJSON(GUEST_KEY, v); return v; };

  window.BuyerLocation = { get, save, locate, clear, shortLabel, locateGuest: locate, setGuestLocation, clearGuest: clear };
})();
