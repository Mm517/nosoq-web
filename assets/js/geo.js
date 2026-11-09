/* ==========================================================================
   js/geo.js — تحديد الموقع بالتفصيل (window.Geo)

   وضعان:
   1) مفتاح Google Maps موجود (Store.config.googleMapsKey): خريطة جوجل تفاعلية، دبوس قابل للسحب،
      نقرة على الخريطة لتحديد نقطة، بحث عن عنوان (Geocoding API)، وتفاصيل العنوان من Google.
   2) بدون مفتاح: زر «موقعي الحالي» (GPS المتصفح) + معاينة خريطة جوجل (iframe) + تفاصيل العنوان
      من OpenStreetMap Nominatim + بحث عن عنوان. لا يحتاج أي إعداد.

   العنوان الناتج: { lat, lng, formatted, country, countryCode, region, city, area, street,
                     houseNumber, postal }
   ========================================================================== */
(function () {
  'use strict';

  const CFG = window.Store.config;
  const esc = window.Store.esc;
  const lang = () => { try { return (localStorage.getItem('nasaq_lang_v1') || 'ar').split('-')[0]; } catch (_) { return 'ar'; } };
  const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };   // القاهرة
  let uidN = 0;
  /* مصر فقط: حدود تقريبية + التحقق من كود الدولة */
  const EG = { s: 21.5, n: 31.95, w: 24.5, e: 37.0 };
  const inEgypt = (lat, lng) => lat >= EG.s && lat <= EG.n && lng >= EG.w && lng <= EG.e;
  const EG_MSG = 'الخدمة متاحة داخل مصر فقط. اختر موقعاً داخل مصر.';
  const isEgyptAddr = (a) => !a.countryCode || String(a.countryCode).toUpperCase() === 'EG';

  const s = (v) => (v == null ? '' : String(v));
  const norm = (a) => ({
    lat: Math.round(Number(a.lat) * 1e6) / 1e6, lng: Math.round(Number(a.lng) * 1e6) / 1e6,
    formatted: s(a.formatted), country: s(a.country), countryCode: s(a.countryCode), region: s(a.region),
    city: s(a.city), area: s(a.area), street: s(a.street), houseNumber: s(a.houseNumber), postal: s(a.postal),
    placeId: s(a.placeId)
  });

  /* ---------- أدوات بسيطة ---------- */
  const mapLink = (lat, lng) => 'https://www.google.com/maps?q=' + lat + ',' + lng;
  const embedURL = (lat, lng) => 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&z=16&output=embed&hl=' + lang();

  function locate() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('متصفحك لا يدعم تحديد الموقع، ابحث عن عنوانك يدوياً.'));
      if (window.isSecureContext === false) return reject(new Error('تحديد الموقع يعمل فقط على اتصال آمن (https). ابحث عن عنوانك يدوياً.'));
      navigator.geolocation.getCurrentPosition(
        (p) => inEgypt(p.coords.latitude, p.coords.longitude)
          ? resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy })
          : reject(new Error('موقعك الحالي خارج مصر. الخدمة متاحة داخل مصر فقط، اختر عنواناً داخل مصر.')),
        (e) => reject(new Error(e.code === 1 ? 'تم رفض إذن الموقع. فعّله من إعدادات المتصفح أو ابحث عن عنوانك.'
          : e.code === 3 ? 'انتهت مهلة تحديد الموقع، حاول مرة أخرى.' : 'تعذّر تحديد موقعك الآن، حاول لاحقاً أو ابحث عن عنوانك.')),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    });
  }

  /* متابعة الموقع باستمرار (watchPosition) — تُرجع دالة لإيقاف المتابعة.
     onErr يُستدعى بأخطاء فيها fatal=true لو كان الخطأ دائمًا (غير مدعوم / غير آمن / تم رفض الإذن)،
     أما أخطاء المهلة وعدم توفر الموقع مؤقتًا فتُتجاهل لأن المتصفح يواصل المحاولة تلقائيًا. */
  function watch(onPos, onErr) {
    const fail = (msg, code) => { if (onErr) onErr(Object.assign(new Error(msg), { fatal: true, code: code })); return function () {}; };
    if (!navigator.geolocation) return fail('متصفحك لا يدعم تحديد الموقع.', 0);
    if (window.isSecureContext === false) return fail('تحديد الموقع يعمل فقط على اتصال آمن (https).', 0);
    const id = navigator.geolocation.watchPosition(
      (p) => onPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, timestamp: p.timestamp }),
      (e) => { if (e.code === 1 && onErr) onErr(Object.assign(new Error('تم رفض إذن الموقع. فعّله من إعدادات المتصفح ليتم تحديث موقعك.'), { fatal: true, code: 1 })); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
    return function () { navigator.geolocation.clearWatch(id); };
  }

  /* ---------- OpenStreetMap Nominatim (بدون مفتاح) ---------- */
  function fromNominatim(j, lat, lng) {
    const a = j.address || {};
    return norm({
      lat: lat != null ? lat : j.lat, lng: lng != null ? lng : j.lon, formatted: j.display_name,
      country: a.country, countryCode: (a.country_code || '').toUpperCase(), region: a.state || a.governorate || a.region,
      city: a.city || a.town || a.village || a.municipality || a.county,
      area: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.district,
      street: a.road || a.pedestrian || a.footway, houseNumber: a.house_number, postal: a.postcode
    });
  }
  async function nomReverse(lat, lng) {
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=' + lang() + '&lat=' + lat + '&lon=' + lng);
    if (!r.ok) throw new Error('خدمة العناوين غير متاحة الآن');
    return fromNominatim(await r.json(), lat, lng);
  }
  async function nomSearch(q) {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=eg&accept-language=' + lang() + '&q=' + encodeURIComponent(q));
    if (!r.ok) throw new Error('خدمة البحث غير متاحة الآن');
    return (await r.json()).map((j) => fromNominatim(j, parseFloat(j.lat), parseFloat(j.lon))).filter((a) => inEgypt(a.lat, a.lng) && isEgyptAddr(a));
  }

  /* ---------- Google Maps ---------- */
  function fromGoogle(res, lat, lng) {
    const comp = {};
    (res.address_components || []).forEach((c) => c.types.forEach((t) => { if (!comp[t]) comp[t] = c; }));
    const g = function () { for (let i = 0; i < arguments.length; i++) if (comp[arguments[i]]) return comp[arguments[i]].long_name; return ''; };
    return norm({
      lat, lng, formatted: res.formatted_address, country: g('country'), countryCode: comp.country ? comp.country.short_name : '',
      region: g('administrative_area_level_1'), city: g('locality', 'administrative_area_level_2', 'postal_town'),
      area: g('sublocality_level_1', 'sublocality', 'neighborhood'), street: g('route'), houseNumber: g('street_number'), postal: g('postal_code'),
      placeId: res.place_id
    });
  }

  let gPromise = null;
  function loadGoogle() {
    if (!CFG.googleMapsKey) return Promise.reject(new Error('no-key'));
    if (window.google && window.google.maps && window.google.maps.importLibrary) return Promise.resolve();
    if (gPromise) return gPromise;
    gPromise = new Promise((resolve, reject) => {
      window.__nqMapsReady = resolve;
      window.gm_authFailure = () => { gPromise = null; reject(new Error('auth')); };
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(CFG.googleMapsKey) + '&loading=async&language=' + lang() + '&callback=__nqMapsReady';
      sc.onerror = () => { gPromise = null; reject(new Error('load')); };
      document.head.appendChild(sc);
    });
    return gPromise;
  }

  /* ---------- Leaflet + OpenStreetMap (مجاني بدون مفتاح) ---------- */
  const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  let lPromise = null;
  function loadLeaflet() {
    if (window.L && window.L.map) return Promise.resolve();
    if (lPromise) return lPromise;
    lPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = LEAFLET + 'leaflet.min.css';
      document.head.appendChild(css);
      const sc = document.createElement('script');
      sc.src = LEAFLET + 'leaflet.min.js';
      sc.onload = () => resolve();
      sc.onerror = () => { lPromise = null; reject(new Error('load')); };
      document.head.appendChild(sc);
    });
    return lPromise;
  }

  /* ---------- واجهة اختيار الموقع ---------- */
  const FIELDS = [
    ['city', 'المدينة'], ['area', 'الحي / المنطقة'], ['street', 'الشارع'], ['note', 'رقم المبنى / علامة مميزة'],
    ['region', 'المحافظة / الولاية'], ['postal', 'الرمز البريدي']
  ];

  function mount(el, opts) {
    opts = opts || {};
    const id = ++uidN;
    let point = opts.value && opts.value.lat != null ? { lat: opts.value.lat, lng: opts.value.lng } : null;
    let base = Object.assign({ country: '', countryCode: '', formatted: '', placeId: '' }, opts.value || {});
    let map = null, moveG = null, mode = CFG.googleMapsKey ? 'google' : 'leaflet', reqId = 0, timer = 0;

    el.innerHTML =
      '<div class="geo">' +
        '<div class="geo__bar">' +
          '<button type="button" class="btn btn--primary btn--sm geo__locate" data-geo-locate>' + window.UI.icon('pin') + 'استخدم موقعي الحالي</button>' +
          '<div class="geo__search" role="search" data-geo-form>' +
            '<label class="sr-only" for="geo-q-' + id + '">ابحث عن عنوان</label>' +
            '<input class="input" id="geo-q-' + id + '" data-geo-q type="search" placeholder="ابحث عن عنوان أو حي أو معلم…" autocomplete="off">' +
            '<button class="btn btn--ghost btn--sm" type="button" data-geo-go>بحث</button>' +
          '</div>' +
        '</div>' +
        '<ul class="geo__sugg" data-geo-sugg hidden></ul>' +
        '<p class="geo__msg" data-geo-msg role="status"></p>' +
        '<div class="geo__map" data-geo-map><p class="geo__hint">اضغط «استخدم موقعي الحالي» أو ابحث عن عنوانك لعرض الخريطة.</p></div>' +
        '<p class="geo__coords" data-geo-coords hidden><span dir="ltr" data-geo-latlng></span><a data-geo-link target="_blank" rel="noopener">افتح في خرائط جوجل</a></p>' +
        '<div class="geo__fields">' + FIELDS.map((f) =>
          '<div class="field"><label class="label" for="geo-' + f[0] + '-' + id + '">' + f[1] + '</label>' +
          '<input class="input" id="geo-' + f[0] + '-' + id + '" data-geo-f="' + f[0] + '" type="text" autocomplete="off" value="' + esc((opts.value || {})[f[0]] || '') + '"></div>').join('') + '</div>' +
        '<p class="geo__by" data-geo-by></p>' +
      '</div>';

    const q = (sel) => el.querySelector(sel);
    const msg = q('[data-geo-msg]'), box = q('[data-geo-map]'), sugg = q('[data-geo-sugg]');
    const field = (k) => q('[data-geo-f="' + k + '"]');
    const say = (t, err) => { msg.textContent = t || ''; msg.classList.toggle('is-error', !!err); };
    const by = q('[data-geo-by]');
    by.textContent = mode === 'google' ? 'الخريطة: Google Maps (تفاعلية)' : 'الخريطة: OpenStreetMap — التوصيل داخل مصر فقط. اسحب الدبوس أو اضغط على الخريطة لتحديد موقعك.';

    function emit() { if (opts.onChange) opts.onChange(getValue()); }
    function getValue() {
      const v = Object.assign({}, base, { lat: point ? point.lat : null, lng: point ? point.lng : null });
      FIELDS.forEach((f) => { v[f[0]] = field(f[0]).value.trim(); });
      return v;
    }
    function fill(a) {
      base = Object.assign({}, base, { formatted: a.formatted, country: a.country, countryCode: a.countryCode, placeId: a.placeId || '' });
      ['city', 'area', 'street', 'region', 'postal'].forEach((k) => { field(k).value = a[k] || ''; });
      if (a.houseNumber && !field('note').value) field('note').value = a.houseNumber;
      emit();
    }
    function showCoords() {
      if (!point) return;
      q('[data-geo-coords]').hidden = false;
      q('[data-geo-latlng]').textContent = point.lat.toFixed(5) + ', ' + point.lng.toFixed(5);
      q('[data-geo-link]').href = mapLink(point.lat, point.lng);
    }

    /* رسم/تحريك الخريطة */
    function showMap() {
      if (!point) return;
      if ((mode === 'google' || mode === 'leaflet') && map) { moveG(point.lat, point.lng); return; }
      if (mode === 'embed') {
        clearTimeout(timer);
        timer = setTimeout(() => {
          box.innerHTML = '<iframe title="خريطة الموقع المحدد" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + embedURL(point.lat, point.lng) + '"></iframe>';
        }, 250);
      }
    }

    async function reverse() {
      const my = ++reqId;
      say('جارٍ جلب تفاصيل العنوان…');
      try {
        let a = null;
        if (mode === 'google' && map && map.__geocoder) {
          /* Geocoding API ممكن تكون مش مفعّلة/مقيّدة على المفتاح: نجرّب جوجل وبعدين نرجع لـ OpenStreetMap تلقائياً */
          try {
            const r = await map.__geocoder.geocode({ location: { lat: point.lat, lng: point.lng }, language: lang() });
            if (r.results && r.results.length) a = fromGoogle(r.results[0], point.lat, point.lng);
          } catch (ge) { console.warn('[geo] Google Geocoding فشل، نستخدم OpenStreetMap:', ge && (ge.code || ge.message)); }
        }
        if (!a) a = await nomReverse(point.lat, point.lng);
        if (a && !isEgyptAddr(a)) { if (my === reqId) say(EG_MSG, true); return; }
        if (my !== reqId) return;
        fill(a);
        const qi = q('[data-geo-q]'); if (qi && a.formatted) qi.value = a.formatted;
        say('تم تحديد العنوان. راجع التفاصيل وعدّلها إن لزم.');
      } catch (e) {
        if (my !== reqId) return;
        /* فشل جلب العنوان لموقع جديد: نمسح formatted/placeId القديمين حتى لا يُحفظا مرتبطين بإحداثيات مختلفة */
        base = Object.assign({}, base, { formatted: '', placeId: '' });
        emit();
        say('تعذّر جلب تفاصيل العنوان تلقائياً. اكتب التفاصيل يدوياً.', true);
      }
    }

    function setPoint(lat, lng, o) {
      if (!inEgypt(lat, lng)) {
        say(EG_MSG, true);
        if (o && o.fromMap && point && moveG) moveG(point.lat, point.lng);   /* رجّع الدبوس لآخر موقع صحيح */
        return;
      }
      point = { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
      showCoords();
      if (!(o && o.fromMap)) showMap();
      if (o && o.address) { fill(o.address); say('تم تحديد العنوان. راجع التفاصيل وعدّلها إن لزم.'); } else reverse();
    }

    /* زر موقعي الحالي */
    const locBtn = q('[data-geo-locate]');
    locBtn.addEventListener('click', async () => {
      locBtn.disabled = true; say('جارٍ تحديد موقعك…');
      try { const p = await locate(); setPoint(p.lat, p.lng); }
      catch (e) { say(e.message, true); }
      locBtn.disabled = false;
    });

    /* البحث عن عنوان */
    /* ليس <form> عمداً: الأداة تُوضع داخل نماذج أخرى (إنشاء المتجر) والمتصفح يحذف النماذج المتداخلة */
    q('[data-geo-go]').addEventListener('click', () => runSearch());
    q('[data-geo-q]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(typeTimer); runSearch(); } });
    /* اقتراحات أثناء الكتابة (بعد توقف ٧٠٠ مللي ثانية) */
    let typeTimer = 0;
    q('[data-geo-q]').addEventListener('input', (e) => {
      clearTimeout(typeTimer);
      const t = e.target.value.trim();
      if (t.length < 3) { sugg.hidden = true; return; }
      typeTimer = setTimeout(runSearch, 700);
    });
    async function runSearch() {
      const text = q('[data-geo-q]').value.trim();
      if (text.length < 3) { say('اكتب 3 أحرف على الأقل للبحث.', true); return; }
      say('جارٍ البحث…'); sugg.hidden = true;
      try {
        let list = [];
        if (mode === 'google' && map && map.__geocoder) {
          try {
            const r = await map.__geocoder.geocode({ address: text, language: lang(), componentRestrictions: { country: 'EG' } });
            list = (r.results || []).slice(0, 5).map((x) => fromGoogle(x, x.geometry.location.lat(), x.geometry.location.lng())).filter((a) => inEgypt(a.lat, a.lng));
          } catch (ge) { console.warn('[geo] Google Geocoding فشل، نستخدم OpenStreetMap:', ge && (ge.code || ge.message)); }
        }
        if (!list.length) list = await nomSearch(text);
        if (!list.length) { say('لم نجد هذا العنوان. جرّب كتابته بشكل مختلف.', true); return; }
        say('اختر العنوان الصحيح من النتائج:');
        sugg.innerHTML = list.map((a, i) => '<li><button type="button" data-geo-pick="' + i + '">' + esc(a.formatted || (a.city + ' ' + a.area)) + '</button></li>').join('');
        sugg.hidden = false;
        sugg.__list = list;
      } catch (err) { say('تعذّر البحث الآن، حاول لاحقاً.', true); }
    }
    sugg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-geo-pick]'); if (!b) return;
      const a = sugg.__list[Number(b.dataset.geoPick)];
      sugg.hidden = true; say('');
      const qi = q('[data-geo-q]'); if (qi && a.formatted) qi.value = a.formatted;
      setPoint(a.lat, a.lng, { address: a });
    });
    el.addEventListener('input', (e) => { if (e.target.matches('[data-geo-f]')) emit(); });

    /* خريطة جوجل التفاعلية */
    async function buildGoogle() {
      await loadGoogle();
      const gm = window.google.maps;
      const { Map: GMap } = await gm.importLibrary('maps');
      const geo = await gm.importLibrary('geocoding');
      let advanced = null;
      try { advanced = (await gm.importLibrary('marker')).AdvancedMarkerElement; } catch (_) { advanced = null; }
      box.innerHTML = '';
      const start = point || DEFAULT_CENTER;
      map = new GMap(box, { center: start, zoom: point ? 16 : 11, mapId: 'DEMO_MAP_ID', mapTypeControl: false, restriction: { latLngBounds: { north: EG.n + 0.5, south: EG.s - 0.5, west: EG.w - 0.5, east: EG.e + 0.5 }, strictBounds: false }, streetViewControl: false, fullscreenControl: false, gestureHandling: 'greedy' });
      map.__geocoder = new geo.Geocoder();
      const marker = advanced
        ? new advanced({ map, position: start, gmpDraggable: true })
        : new gm.Marker({ map, position: start, draggable: true });
      const pos = () => { const p = advanced ? marker.position : marker.getPosition(); return { lat: typeof p.lat === 'function' ? p.lat() : p.lat, lng: typeof p.lng === 'function' ? p.lng() : p.lng }; };
      moveG = (lat, lng) => {
        const ll = { lat, lng };
        if (advanced) { marker.position = ll; marker.map = map; } else { marker.setPosition(ll); marker.setMap(map); }
        map.setCenter(ll); map.setZoom(16);
      };
      marker.addListener('dragend', () => { const p = pos(); setPoint(p.lat, p.lng, { fromMap: true }); });
      map.addListener('click', (e) => { const ll = e.latLng.toJSON ? e.latLng.toJSON() : { lat: e.latLng.lat(), lng: e.latLng.lng() }; moveG(ll.lat, ll.lng); setPoint(ll.lat, ll.lng, { fromMap: true }); });
      if (!point) { if (advanced) marker.map = null; else marker.setMap(null); }
      showCoords();
    }
    async function buildLeaflet() {
      await loadLeaflet();
      const L = window.L;
      box.innerHTML = '';
      const start = point || DEFAULT_CENTER;
      map = L.map(box, { center: [start.lat, start.lng], zoom: point ? 16 : 11, zoomControl: true, attributionControl: true, minZoom: 5, maxBounds: [[EG.s - 0.5, EG.w - 0.5], [EG.n + 0.5, EG.e + 0.5]], maxBoundsViscosity: 0.9 });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
      const marker = L.marker([start.lat, start.lng], { draggable: true });
      if (point) marker.addTo(map);
      moveG = (lat, lng) => { marker.setLatLng([lat, lng]); if (!map.hasLayer(marker)) marker.addTo(map); map.setView([lat, lng], 16); };
      marker.on('dragend', () => { const p = marker.getLatLng(); setPoint(p.lat, p.lng, { fromMap: true }); });
      map.on('click', (e) => { moveG(e.latlng.lat, e.latlng.lng); setPoint(e.latlng.lat, e.latlng.lng, { fromMap: true }); });
      setTimeout(() => map && map.invalidateSize(), 300);   /* النافذة بتفتح بعد التحميل */
      showCoords();
    }
    function toEmbed(why) {
      mode = 'embed'; map = null;
      by.textContent = why === 'auth' ? 'مفتاح Google Maps غير صالح، نعرض المعاينة العادية.' : 'تعذّر تحميل خرائط جوجل، نعرض المعاينة العادية.';
      box.innerHTML = '<p class="geo__hint">اضغط «استخدم موقعي الحالي» أو ابحث عن عنوانك لعرض الخريطة.</p>';
      if (point) showMap();
    }

    if (mode === 'google') buildGoogle().catch((e) => toEmbed(e && e.message));
    else if (mode === 'leaflet') buildLeaflet().catch((e) => toEmbed(e && e.message));
    else if (point) { showCoords(); showMap(); }

    return {
      getValue,
      locate: () => locBtn.click(),
      setValue(v) { base = Object.assign(base, v); point = v && v.lat != null ? { lat: v.lat, lng: v.lng } : point; FIELDS.forEach((f) => { field(f[0]).value = (v && v[f[0]]) || ''; }); showCoords(); showMap(); }
    };
  }

  window.Geo = { locate, watch, reverse: nomReverse, search: nomSearch, mount, mapLink, embedURL, loadGoogle, fromGoogle, fromNominatim };
})();
