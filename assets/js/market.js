/* ==========================================================================
   js/market.js — طبقة بيانات منصة البائعين (window.Market)
   المتجر + المنتجات + الطلبات + الإحصائيات + المحفظة + الإعلانات + الدعم + الإشعارات.

   ⚠️ نموذج تجريبي: كل شيء يُحفظ في localStorage داخل متصفح المستخدم فقط.
   لتحويله لمنصة حقيقية متعددة البائعين، استبدل دوال هذا الملف بنداءات لخادم/قاعدة بيانات
   (واجهة الدوال ثابتة، فلا تتغير لوحة البائع ولا المتجر).
   ========================================================================== */
(function () {
  'use strict';

  const CFG = window.Store.config;
  const K = {
    seller: 'nasaq_seller_v1', prods: 'nasaq_sprod_v1', orders: 'nasaq_orders_v1', stats: 'nasaq_stats_v1',
    ads: 'nasaq_ads_v1', wallet: 'nasaq_wallet_v1', tickets: 'nasaq_tickets_v1', notifs: 'nasaq_notifs_v1',
    demoStatus: 'nasaq_demo_status_v1', theme: 'nasaq_theme_v1'
  };
  const CLOUD_KEYS = {}; /* مفتاح التخزين المحلي -> اسمه في seller_data */
  CLOUD_KEYS[K.wallet] = 'wallet'; CLOUD_KEYS[K.ads] = 'ads';

  /* مفاتيح لوحة البائع التي تُحفظ أيضاً في الداتابيس (جدول seller_data) — المحلي مجرد كاش سريع */
  const pushTimers = {};
  function pushSellerData(k) {
    const name = CLOUD_KEYS[k], s = seller.get();
    if (!name || !s || !s.cloudId || !cloud() || !cloud().sellerDataSet) return;
    clearTimeout(pushTimers[k]);
    pushTimers[k] = setTimeout(() => {
      let v = null; try { v = JSON.parse(localStorage.getItem(k)); } catch (_) { /* تجاهل */ }
      cloud().sellerDataSet(name, v == null ? {} : v).catch(() => { /* يُعاد المحاولة عند أول تعديل قادم */ });
    }, 600);
  }
  const ls = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); pushSellerData(k); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { /* تجاهل */ } }
  };

  /* ---------- أدوات ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const parseKey = (k) => { const a = k.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const round2 = (n) => Math.round(n * 100) / 100;
  const uid = (pre) => pre + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 900 + 100);
  const isoNow = () => new Date().toISOString();
  const cloud = () => window.NasaqCloud;

  /* حالات الطلب الحقيقية من قاعدة البيانات (store_orders.status) */
  const STATUS = { new: 'جديد', accepted: 'مقبول', preparing: 'قيد التجهيز', ready: 'جاهز للتوصيل', out_for_delivery: 'مع المندوب', delivered: 'تم التسليم', processing: 'قيد التجهيز', shipped: 'تم الشحن', completed: 'مكتمل', cancelled: 'ملغي', returned: 'مرتجع' };
  const NEXT = { new: 'accepted', accepted: 'preparing', preparing: 'ready' };

  /* ---------- البائع ----------
     المتجر الحقيقي (المعتمد من الإدارة) يُقرأ من Supabase عبر seller-gate.js ثم
     يُنسخ هنا (syncFromCloud) ليبقى شكل بيانات لوحة البائع كما هو. */
  const seller = {
    get: () => ls.get(K.seller, null),
    exists: () => !!ls.get(K.seller, null),
    create(data) {
      const s = Object.assign({ id: uid('s_'), createdAt: isoNow(), returnDays: CFG.returnDays, demo: false, prepDays: 2 }, data);
      ls.set(K.seller, s);
      if (cloud()) {
        cloud().syncStore(s);
      }
      notifs.add({ type: 'welcome', title: 'مرحباً بك في منصة البائعين', text: 'أضف أول منتج لبدء البيع.', href: '#/products/new' });
      return s;
    },
    save(patch) {
      const s = Object.assign(seller.get() || {}, patch);
      return ls.set(K.seller, s) ? s : null;
    },
    /* يُستدعى بعد نجاح seller-gate.js: يربط لوحة البائع بالمتجر الحقيقي المعتمد
       في Supabase (نفس id المتجر الحقيقي uuid) بدل أي متجر محلي وهمي قديم. */
    syncFromCloud(store) {
      if (!store) return null;
      const a = store.address || {};
      const s = {
        id: store.id, cloudId: store.id, name: store.name, slug: store.slug, category: store.category,
        phone: store.phone || '', email: store.email || '', description: store.description || '',
        logo: store.logo_url || '',
        address: Object.assign({ city: a.city || '', area: a.area || '' }, (store.latitude != null && store.longitude != null) ? { lat: store.latitude, lng: store.longitude } : {}),
        latitude: store.latitude != null ? store.latitude : null,
        longitude: store.longitude != null ? store.longitude : null,
        ownerId: store.owner_external_id,
        createdAt: store.created_at || isoNow(), returnDays: CFG.returnDays, demo: false, prepDays: 2
      };
      ls.set(K.seller, s);
      cloudOrders = null; cloudProducts = null; cloudNotifs = null; cloudStats = null; cloudTickets = null;
      sellerDataLoaded = false; loadSellerData();
      return s;
    },
    reset() { Object.keys(K).forEach((k) => { if (K[k] !== K.theme) ls.del(K[k]); }); ls.del('nasaq_orders_v1'); }
  };
  const me = () => seller.get();
  const demoOn = () => false; /* لا بيانات تجريبية عشوائية بعد الآن — المنصة تعمل ببيانات حقيقية فقط */


  /* ---------- بيانات البائع المحفوظة في الداتابيس (المحفظة/الإعلانات) ---------- */
  let sellerDataLoaded = false;
  function loadSellerData() {
    const s = me();
    if (sellerDataLoaded || !cloud() || !s || !s.cloudId || !cloud().sellerDataGet) return;
    sellerDataLoaded = true;
    cloud().sellerDataGet().then((d) => {
      d = d || {};
      let changed = false;
      [[K.wallet, 'wallet'], [K.ads, 'ads']].forEach((pair) => {
        const remote = d[pair[1]];
        const hasRemote = remote && (Array.isArray(remote) ? remote.length : Object.keys(remote).length);
        try {
          if (hasRemote) { localStorage.setItem(pair[0], JSON.stringify(remote)); changed = true; }
          else if (localStorage.getItem(pair[0])) pushSellerData(pair[0]); /* بيانات محلية قديمة: نرفعها مرة واحدة */
        } catch (_) { /* تجاهل */ }
      });
      if (changed) window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
    }).catch(() => { sellerDataLoaded = false; });
  }

  /* ---------- إحصائيات المشاهدة/السلة الحقيقية (product_daily_stats) ---------- */
  let cloudStats = null, cloudStatsLoading = false;
  function loadCloudStats() {
    const s = me();
    if (cloudStatsLoading || !cloud() || !s || !s.cloudId || !cloud().sellerStats) return;
    cloudStatsLoading = true;
    cloud().sellerStats(90).then((rows) => {
      cloudStats = rows || []; cloudStatsLoading = false;
      window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
    }).catch(() => { cloudStats = []; cloudStatsLoading = false; });
  }
  /* day -> {v,c} و productId -> {day -> [v,c]} من الصفوف الحقيقية */
  function cloudStatsIndex() {
    const byDay = {}, byProd = {};
    (cloudStats || []).forEach((r) => {
      const d = byDay[r.day] || (byDay[r.day] = { v: 0, c: 0 });
      d.v += Number(r.views || 0); d.c += Number(r.carts || 0);
      const id = r.product_id != null ? r.product_id : r.product_uuid;
      const p = byProd[id] || (byProd[id] = {});
      p[r.day] = [Number(r.views || 0), Number(r.carts || 0)];
    });
    return { byDay, byProd };
  }

  /* ---------- جسر الطلبات الحقيقية (store_orders من Supabase) ---------- */
  let cloudOrders = null;
  let cloudOrdersLoading = false;
  /* الصف القادم من seller_list_orders/seller_get_order (RPC) جاهز بالفعل بكل
     الحقول المطلوبة (اسم المشتري، صور المنتجات، اللون، السعر وقت الطلب،
     الخصم، الشحن، الإجمالي، طريقة وحالة الدفع...) — لا حاجة لأي JOIN يدوي
     على الواجهة، فقط نلبس الشكل القديم (lines/gross/net) للتوافق مع أماكن
     أخرى في الكود (الإحصائيات)، ونضيف الحقول الجديدة الغنية بجانبها. */
  function mapCloudOrder(row) {
    const items = row.items || [];
    const gross = round2(Number(row.subtotal || 0));
    return {
      id: row.order_number || row.store_order_id, _cloudId: row.store_order_id, orderId: row.order_id,
      createdAt: row.created_at || isoNow(), status: row.status, demo: false,
      lines: items.map((l) => ({ productId: l.product_id, name: l.name, qty: l.quantity, price: Number(l.unit_price || 0), size: l.size, color: l.color, image: l.image })),
      items, customer: Object.assign({ name: '', city: '', phone: '', address: '', email: '' }, row.buyer || {}),
      payment: row.payment_method || 'cod', paymentStatus: row.payment_status || 'pending',
      shippingMethod: row.shipping_method || 'standard',
      subtotal: gross, shipping: Number(row.shipping || 0), discount: Number(row.discount || 0),
      total: row.total != null ? Number(row.total) : round2(gross + Number(row.shipping || 0) - Number(row.discount || 0)),
      itemsCount: row.items_count || items.length, itemsQty: row.items_qty || items.reduce((t, l) => t + Number(l.quantity || 0), 0),
      gross, commission: 0, net: gross
    };
  }
  function loadCloudOrders() {
    const s = me();
    if (cloudOrdersLoading || !cloud() || !s || !s.cloudId) return;
    cloudOrdersLoading = true;
    cloud().request('/seller/orders', null, 'GET').then((rows) => {
      cloudOrders = (rows || []).map(mapCloudOrder);
      cloudOrdersLoading = false;
      window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
    }).catch(() => { cloudOrders = []; cloudOrdersLoading = false; window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready')); });
  }

  /* ---------- جسر منتجات المتجر الحقيقية (products من Supabase) ---------- */
  let cloudProducts = null;
  let cloudProductsLoading = false;
  function mapCloudProduct(row) {
    /* ألوان حقيقية (product_colors مع صورها) لو موجودة، وإلا رجوع للعمود القديم colors
       (جسون بسيط بلا صور/كمية مستقلة) للتوافق مع أي منتج قديم لم يُضَف له ألوان بعد. */
    const realColors = Array.isArray(row.product_colors) && row.product_colors.length
      ? row.product_colors.slice().sort((a, b) => a.sort_order - b.sort_order).map((c) => ({
          id: c.id, name: c.name, hex: c.hex || '#2f45d4', stock: Number(c.stock || 0),
          images: (c.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => i.public_url)
        }))
      : (Array.isArray(row.colors) ? row.colors : []);
    return {
      id: row.legacy_id, uuid: row.id, name: row.name_ar || row.name, nameEn: row.name_en || '', nameDe: row.name_de || '', descriptionEn: row.description_en || '', descriptionDe: row.description_de || '', category: row.category, price: Number(row.price || 0),
      oldPrice: row.old_price == null ? null : Number(row.old_price), stock: Number(row.stock || 0),
      status: row.status, sku: row.sku || '', description: row.description_ar || row.description || '',
      details: Array.isArray(row.details) ? row.details : [], sizes: Array.isArray(row.sizes) ? row.sizes : [],
      colors: realColors, photos: Array.isArray(row.photos) ? row.photos : [],
      video: row.video_url || null, videoUrl: row.video_url || null, videoPath: row.video_path || null,
      addedAt: row.added_at, sellerId: row.store_id
    };
  }
  function loadCloudProducts() {
    const s = me();
    if (cloudProductsLoading || !cloud() || !s || !s.cloudId) return;
    cloudProductsLoading = true;
    cloud().request('/seller/products', null, 'GET').then((rows) => {
      cloudProducts = (rows || []).filter((r) => r.legacy_id != null).map(mapCloudProduct);
      cloudProductsLoading = false;
      window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
    }).catch(() => { cloudProducts = []; cloudProductsLoading = false; window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready')); });
  }

  /* ---------- المنتجات ----------
     كل تعديل هنا يُزامَن فوراً مع Supabase (cloud().syncProduct) فيظهر للعملاء
     على الفور عبر products.js. القائمة المعروضة للبائع تُقرأ من Supabase مباشرة. */
  const products = {
    list() {
      const s = me();
      if (s && s.cloudId) {
        if (cloudProducts === null) loadCloudProducts();
        return (cloudProducts || []).slice();
      }
      return ls.get(K.prods, []);
    },
    get: (id) => products.list().find((p) => p.id === Number(id)),
    nextId: () => Math.max(1000, ...products.list().map((p) => p.id)) + 1,
    /* حفظ محلي فقط (نموذج تجريبي بلا متجر حقيقي بعد) — يبقى للتوافق القديم */
    save(p) {
      const list = ls.get(K.prods, []);
      const i = list.findIndex((x) => x.id === p.id);
      if (i >= 0) list[i] = p; else list.unshift(p);
      const ok = ls.set(K.prods, list);
      if (ok && cloud()) cloud().syncProduct(p);
      return ok;
    },
    /* حفظ حقيقي: يرسل المنتج لـ Supabase أولاً وينتظر الرد (id الحقيقي legacy_id
       عند الإضافة) بدل توليد id محلي عشوائي قد يتعارض مع بائع آخر، ثم يحدّث الكاش
       المحلي ويُعيد رسم الصفحة. يُستخدم فقط عند وجود متجر حقيقي معتمد (s.cloudId). */
    async saveCloud(p) {
      const s = me();
      /* الفيديو: يُرفع أولاً لو كان ملفاً جديداً (data:video/...)، ورابطه الحقيقي هو ما
         يُخزَّن في عمود products.video_url — لا نرسل base64 ضخماً مباشرة لعمود نصي. */
      let videoUrl = p.videoUrl || null, videoPath = p.videoPath || null;
      if (p.video && /^data:video\//.test(p.video)) {
        const up = await cloud().uploadVideo(p.video, 'product-' + (p.id || 'new'));
        videoUrl = up.publicUrl || null; videoPath = up.path || null;
      } else if (p.video) {
        videoUrl = p.video;
      }
      const row = await cloud().syncProduct(Object.assign({}, p, { storeId: s.cloudId, sellerId: s.ownerId, videoUrl, videoPath }));
      /* ألوان المنتج (Variants): تُستبدل كاملة بعد نجاح حفظ المنتج نفسه (نحتاج uuid
         المنتج الحقيقي row.id). كل صورة لون تُرسَل كـ base64 ويرفعها الخادم بنفسه. */
      if (row && row.id && Array.isArray(p.colors)) {
        try { await cloud().syncProductColors(row.id, p.colors); } catch (_) { /* المنتج محفوظ بالفعل حتى لو فشلت مزامنة الألوان */ }
      }
      cloudProducts = null; /* أعد التحميل من المصدر ليعكس السعر/الحالة الحقيقية وألوانه */
      window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
      return row;
    },
    remove(id) {
      const s = me();
      if (s && s.cloudId) {
        const p = products.get(id);
        if (p) products.saveCloud(Object.assign({}, p, { status: 'archived' }));
        return true;
      }
      return ls.set(K.prods, ls.get(K.prods, []).filter((p) => p.id !== Number(id)));
    },
    setStatus(id, status) {
      const s = me();
      const p = products.get(id);
      if (!p) return false;
      if (s && s.cloudId) { products.saveCloud(Object.assign({}, p, { status })); return true; }
      p.status = status;
      return products.save(p);
    },
    /* فحص جودة القائمة: أخطاء (تمنع البيع الجيد) وتحذيرات وعناصر ناجحة */
    quality(p) {
      const checks = [
        { level: 'error', ok: !!(p.photos && p.photos.length), text: 'أضف صورة واحدة على الأقل' },
        { level: 'error', ok: p.price > 0, text: 'حدّد سعراً أكبر من صفر' },
        { level: 'error', ok: p.name && p.name.trim().length >= 8, text: 'اجعل اسم المنتج 8 أحرف أو أكثر' },
        { level: 'error', ok: p.stock > 0, text: 'المخزون صفر، المنتج غير قابل للشراء' },
        { level: 'warn', ok: !!(p.photos && p.photos.length >= 3), text: 'أضف 3 صور أو أكثر لرفع التحويل' },
        { level: 'warn', ok: !!(p.description && p.description.trim().length >= 60), text: 'اكتب وصفاً من 60 حرفاً أو أكثر' },
        { level: 'warn', ok: !!(p.details && p.details.length >= 3), text: 'أضف 3 مواصفات على الأقل' },
        { level: 'warn', ok: p.category !== 'clothes' && p.category !== 'shoes' ? true : !!(p.sizes && p.sizes.length), text: 'حدّد المقاسات المتاحة' },
        { level: 'warn', ok: !!(p.colors && p.colors.length), text: 'أضف لوناً واحداً على الأقل' },
        { level: 'warn', ok: !!(p.photos && p.photos.length) && p.price > 0 && p.stock >= 3, text: 'وفّر مخزوناً 3 قطع أو أكثر' }
      ];
      const errors = checks.filter((c) => c.level === 'error' && !c.ok);
      const warns = checks.filter((c) => c.level === 'warn' && !c.ok);
      const passed = checks.filter((c) => c.ok).length;
      return { errors, warns, passed, total: checks.length, score: Math.round((passed / checks.length) * 100) };
    }
  };

  /* ---------- بيانات تجريبية ثابتة (تُولَّد من التاريخ، لا تُخزَّن) ---------- */
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const DEMO_NAMES = ['أحمد سمير', 'منى خالد', 'يوسف عادل', 'سارة محمود', 'عمر حسن', 'ليلى إبراهيم', 'كريم فتحي', 'هدى ناصر', 'مصطفى علي', 'نور الدين', 'دينا وليد', 'طارق شريف', 'آية مصطفى', 'إسلام رضا'];
  let demoCache = null;

  function demoOrders() {
    const today = dkey();
    if (demoCache && demoCache.day === today) return demoCache.list;
    const cat = window.Products.all().filter((p) => !p.sellerId);
    const weights = cat.map((p) => Math.max(0.5, p.rating * Math.log(p.reviews + 2)));
    const wSum = weights.reduce((a, b) => a + b, 0);
    const pick = (r) => { let x = r() * wSum; for (let i = 0; i < cat.length; i++) { x -= weights[i]; if (x <= 0) return cat[i]; } return cat[0]; };
    const overrides = ls.get(K.demoStatus, {});
    const noon = new Date(); noon.setHours(12, 0, 0, 0);
    const list = [];
    for (let back = 89; back >= 0; back--) {
      const d = addDays(noon, -back), key = dkey(d), r = mulberry32(hash('o' + key));
      const dow = d.getDay(), f = (dow === 5 || dow === 6) ? 1.35 : 1, growth = 0.75 + ((89 - back) / 89) * 0.5;
      const n = Math.max(0, Math.round((1.4 + r() * 2.6) * f * growth));
      for (let i = 0; i < n; i++) {
        const lines = [], k = 1 + (r() < 0.35 ? 1 : 0);
        for (let j = 0; j < k; j++) {
          const p = pick(r);
          lines.push({ productId: p.id, name: p.name, qty: 1 + (r() < 0.25 ? 1 : 0), price: p.price, size: p.sizes[0] || null, color: p.colors[0].name, sellerId: 'demo' });
        }
        const status = back > 6 ? (r() < 0.92 ? 'completed' : 'cancelled') : back > 3 ? (r() < 0.85 ? 'shipped' : 'processing') : back > 1 ? (r() < 0.6 ? 'processing' : 'new') : 'new';
        const t = new Date(d); t.setHours(9 + Math.floor(r() * 12), Math.floor(r() * 60));
        const id = 'NQ-D' + key.replace(/-/g, '').slice(2) + i;
        list.push({
          id, demo: true, createdAt: t.toISOString(), status: overrides[id] || status, lines,
          customer: { name: DEMO_NAMES[Math.floor(r() * DEMO_NAMES.length)], city: CFG.cities[Math.floor(r() * CFG.cities.length)], phone: '01' + String(Math.floor(r() * 1e9)).padStart(9, '0'), address: 'عنوان تجريبي' },
          payment: r() < 0.55 ? 'cod' : 'card'
        });
      }
    }
    demoCache = { day: today, list: list.reverse() };
    return demoCache.list;
  }

  function demoTraffic(key, orderCount) {
    const r = mulberry32(hash('v' + key));
    const v = orderCount ? Math.round((orderCount / (0.02 + 0.012 * r())) * (0.9 + 0.2 * r())) : Math.round(50 + 60 * r());
    return { v, u: Math.round(v * (0.6 + 0.12 * r())), c: Math.round(orderCount * (2.2 + 1.6 * r())) };
  }

  /* ---------- الطلبات ---------- */
  function sellerView(o) {
    const s = me();
    const mine = o.lines.filter((l) => o.demo || (s && l.sellerId === s.id));
    if (!mine.length) return null;
    const gross = round2(mine.reduce((t, l) => t + l.price * l.qty, 0));
    const commission = round2(gross * CFG.commission);
    return Object.assign({}, o, { lines: mine, gross, commission, net: round2(gross - commission) });
  }
  const orders = {
    raw: () => ls.get(K.orders, []),
    /* يُستدعى من صفحة الدفع بعد نجاح الطلب */
    record(o) {
      /* منطق التسجيل المحلي القديم — يبقى فقط كنسخة احتياطية بصفحة "طلباتي" المحلية
         للمشتري نفسه؛ الطلب الحقيقي يُخزَّن في Supabase عبر cloud().syncOrder أدناه
         ويصل تلقائياً لكل من البائع والمندوب والإدارة. */
      const s = me();
      const t = o.totals || {};
      const lines = o.lines.map((l) => ({
        productId: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price,
        size: l.size || null, color: l.color || null, sellerId: l.product.sellerId || 'official'
      }));
      const order = {
        id: o.number, createdAt: isoNow(), status: 'new', lines,
        customer: Object.assign({ phone: '', address: '' }, o.customer),
        shipping: t.shipping || 0, discount: t.discount || 0, total: t.total || 0, payment: o.pay, method: o.method
      };
      const list = orders.raw();
      list.unshift(order);
      ls.set(K.orders, list.slice(0, 500));
      if (cloud()) cloud().syncOrder(order, o);
      const mine = lines.filter((l) => s && l.sellerId === s.id);
      if (!mine.length) return order;
      /* خصم المخزون + تنبيه النفاد */
      const prods = products.list();
      mine.forEach((l) => {
        const p = prods.find((x) => x.id === l.productId);
        if (!p) return;
        p.stock = Math.max(0, p.stock - l.qty);
        if (p.stock === 0) notifs.add({ type: 'stock', title: 'نفد مخزون منتج', text: p.name, href: '#/products/edit/' + p.id });
      });
      ls.set(K.prods, prods);
      const gross = round2(mine.reduce((a, l) => a + l.price * l.qty, 0));
      notifs.add({ type: 'order', title: 'طلب جديد ' + o.number, text: mine.length + ' منتج بقيمة ' + window.Store.money(gross), href: '#/orders/' + o.number });
      return order;
    },
    /* الطلبات الحقيقية لهذا المتجر من Supabase (store_orders)؛ تُحمَّل بالخلفية
       وتُعاد القائمة الحالية فوراً — أول استدعاء يبدأ التحميل ويصدر حدث
       'nasaq:seller-data-ready' عند اكتمالها حتى تُعيد الصفحة رسم نفسها. */
    list() {
      const s = me();
      if (s && s.cloudId) {
        if (cloudOrders === null) loadCloudOrders();
        return (cloudOrders || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return orders.raw().map(sellerView).filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    get: (id) => orders.list().find((o) => o.id === id),
    /* صفحة تفاصيل الطلب الكاملة: تجيب أحدث نسخة من الخادم (لا تعتمد على الكاش
       المحلي) شاملةً Order Timeline الحقيقي (history) والحالات التالية
       المسموح للبائع الانتقال إليها (allowedNext) — مصدرها seller_get_order. */
    async fetchDetail(id) {
      const o = orders.list().find((x) => x.id === id);
      if (!o || !o._cloudId || !cloud()) return o || null;
      const row = await cloud().request('/seller/orders/' + o._cloudId, null, 'GET');
      const mapped = mapCloudOrder(row);
      mapped.history = (row.history || []).map((h) => ({ status: h.status, label: h.label, at: h.at }));
      mapped.allowedNext = row.allowed_next || [];
      return mapped;
    },
    setStatus(id, status) {
      const o = orders.list().find((x) => x.id === id);
      if (o && o._cloudId && cloud()) {
        cloud().request('/seller/orders/' + o._cloudId + '/status', { status }, 'PATCH').then(() => {
          cloudOrders = null; loadCloudOrders();
        }).catch(() => { /* الرسالة تظهر عبر S.toast في مكان الاستدعاء */ });
        o.status = status; /* تحديث تفاؤلي فوري في الواجهة */
        return true;
      }
      const list = orders.raw();
      const raw = list.find((x) => x.id === id);
      if (!raw) return false;
      raw.status = status;
      return ls.set(K.orders, list);
    },
    counts() {
      const c = { all: 0, new: 0, accepted: 0, preparing: 0, ready: 0, out_for_delivery: 0, delivered: 0, cancelled: 0, returned: 0, processing: 0, shipped: 0, completed: 0 };
      orders.list().forEach((o) => { c.all++; if (c[o.status] == null) c[o.status] = 0; c[o.status]++; });
      return c;
    }
  };

  /* ---------- تتبّع الزيارات (للمنتجات المملوكة للبائع فقط) ---------- */
  const track = {
    /* أي زائر يفتح منتجاً أو يضيفه للسلة يُسجَّل في product_daily_stats عبر RPC،
       فيرى البائع أرقاماً حقيقية لمنتجاته (وليس فقط مشاهداته هو لمنتجه). */
    view(p) { if (p && p.uuid && cloud() && cloud().trackEvent) cloud().trackEvent(p.uuid, 'view'); },
    cart(p, qty) { if (p && p.uuid && cloud() && cloud().trackEvent) cloud().trackEvent(p.uuid, 'cart'); }
  };

  const stats = {
    /* سلسلة يومية لآخر n يوماً: مشاهدات، زوار فريدون، إضافات للسلة، طلبات، إيراد (إجمالي المبيعات) */
    series(n, offset) {
      if (cloudStats === null) loadCloudStats();
      const idx = cloudStatsIndex();
      const all = orders.list().filter((o) => o.status !== 'cancelled');
      const byDay = {};
      all.forEach((o) => { const k = dkey(new Date(o.createdAt)); const x = byDay[k] || (byDay[k] = { o: 0, r: 0 }); x.o++; x.r += o.gross; });
      const out = [], end = addDays(new Date(), -(offset || 0));
      for (let i = n - 1; i >= 0; i--) {
        const d = addDays(end, -i), k = dkey(d), rl = idx.byDay[k] || { v: 0, c: 0 };
        const b = byDay[k] || { o: 0, r: 0 };
        /* الزوار الفريدون غير متتبَّعين على مستوى الداتابيس بعد؛ نعرض المشاهدات كتقدير أعلى للزوار */
        out.push({ date: k, dow: d.getDay(), v: rl.v, u: rl.v, c: rl.c, o: b.o, r: round2(b.r) });
      }
      return out;
    },
    summary(n) {
      const sum = (arr) => arr.reduce((a, d) => ({ v: a.v + d.v, u: a.u + d.u, c: a.c + d.c, o: a.o + d.o, r: a.r + d.r }), { v: 0, u: 0, c: 0, o: 0, r: 0 });
      const cur = sum(stats.series(n)), prev = sum(stats.series(n, n));
      const g = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : (a > 0 ? 100 : 0));
      return {
        cur, prev,
        growth: { v: g(cur.v, prev.v), u: g(cur.u, prev.u), c: g(cur.c, prev.c), o: g(cur.o, prev.o), r: g(cur.r, prev.r) },
        conv: cur.v ? round2((cur.o / cur.v) * 100) : 0,
        aov: cur.o ? round2(cur.r / cur.o) : 0
      };
    },
    byProduct(n) {
      const from = addDays(new Date(), -(n - 1)); from.setHours(0, 0, 0, 0);
      if (cloudStats === null) loadCloudStats();
      const idx = cloudStatsIndex();
      const ord = orders.list().filter((o) => o.status !== 'cancelled' && new Date(o.createdAt) >= from);
      const rows = {};
      const row = (id, name) => rows[id] || (rows[id] = { id, name, views: 0, carts: 0, sold: 0, revenue: 0 });
      products.list().forEach((p) => row(p.id, p.name));
      Object.keys(idx.byProd).forEach((id) => {
        Object.keys(idx.byProd[id]).forEach((day) => {
          if (parseKey(day) < from) return;
          const p = window.Products.byId(id); const r = row(Number(id), p ? p.name : 'منتج #' + id);
          r.views += idx.byProd[id][day][0]; r.carts += idx.byProd[id][day][1];
        });
      });
      ord.forEach((o) => o.lines.forEach((l) => { const r = row(l.productId, l.name); r.sold += l.qty; r.revenue += l.price * l.qty; }));
      return Object.keys(rows).map((k) => rows[k]).sort((a, b) => b.revenue - a.revenue || b.views - a.views);
    },
    cities(n) {
      const from = addDays(new Date(), -(n - 1)); from.setHours(0, 0, 0, 0);
      const m = {};
      orders.list().filter((o) => o.status !== 'cancelled' && new Date(o.createdAt) >= from).forEach((o) => { const c = (o.customer && o.customer.city) || 'غير محدد'; m[c] = (m[c] || 0) + 1; });
      return Object.keys(m).map((c) => ({ city: c, n: m[c] })).sort((a, b) => b.n - a.n);
    }
  };

  /* ---------- المحفظة ---------- */
  const wallet = {
    tx: () => ls.get(K.wallet, { tx: [] }).tx,
    _push(t) { const w = ls.get(K.wallet, { tx: [] }); w.tx.unshift(Object.assign({ id: uid('T'), date: isoNow() }, t)); return ls.set(K.wallet, w); },
    summary() {
      let pending = 0, confirmed = 0;
      orders.list().forEach((o) => { if (o.status === 'cancelled') return; if (o.status === 'completed') confirmed += o.net; else pending += o.net; });
      const sum = (type) => wallet.tx().filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);
      return {
        pending: round2(pending), lifetime: round2(confirmed),
        available: round2(confirmed - sum('payout') - sum('ad-earnings')),
        adCredit: round2(sum('topup') - sum('ad-credit')),
        paidOut: round2(sum('payout')), adSpent: round2(sum('ad-earnings') + sum('ad-credit'))
      };
    },
    topup(amount, note) { return wallet._push({ type: 'topup', amount: round2(amount), note: note || 'شحن رصيد الإعلانات' }); },
    payout(amount, method) {
      const s = wallet.summary();
      if (amount < CFG.minPayout) return { ok: false, error: 'أقل مبلغ للسحب ' + window.Store.money(CFG.minPayout) };
      if (amount > s.available) return { ok: false, error: 'المبلغ أكبر من الرصيد المتاح' };
      wallet._push({ type: 'payout', amount: round2(amount), note: method, status: 'processing' });
      notifs.add({ type: 'payout', title: 'تم استلام طلب السحب', text: window.Store.money(amount) + ' عبر ' + method, href: '#/wallet' });
      return { ok: true };
    }
  };

  /* ---------- الإعلانات ---------- */
  const ads = {
    placements: CFG.adPlacements,
    quote(type, days) {
      const pl = CFG.adPlacements[type];
      if (!pl || !(days > 0)) return { perDay: 0, days: 0, subtotal: 0, off: 0, discount: 0, total: 0 };
      const rule = CFG.adDiscounts.find((r) => days >= r.days);
      const subtotal = pl.perDay * days, off = rule ? rule.off : 0;
      return { perDay: pl.perDay, days, subtotal, off, discount: round2(subtotal * off), total: round2(subtotal * (1 - off)) };
    },
    list: () => ls.get(K.ads, []),
    get: (id) => ads.list().find((c) => c.id === id),
    endOf: (c) => dkey(addDays(parseKey(c.start), c.days - 1)),
    statusOf(c) {
      if (c.paused) return 'paused';
      const t = dkey();
      if (t < c.start) return 'scheduled';
      if (t > ads.endOf(c)) return 'ended';
      return 'active';
    },
    create(c, source) {
      const s = me();
      if (!s) return { ok: false, error: 'أنشئ متجرك أولاً' };
      const q = ads.quote(c.type, c.days), w = wallet.summary();
      if (source === 'earnings' ? w.available < q.total : w.adCredit < q.total) return { ok: false, error: 'الرصيد غير كافٍ، اشحن رصيد الإعلانات أو اختر مصدراً آخر' };
      const camp = Object.assign({ id: uid('AD'), sellerId: s.id, paused: false, impressions: 0, clicks: 0, createdAt: isoNow(), total: q.total, perDay: q.perDay, source }, c);
      const list = ads.list(); list.unshift(camp);
      if (!ls.set(K.ads, list)) return { ok: false, error: 'مساحة التخزين ممتلئة، استخدم صورة أصغر' };
      wallet._push({ type: source === 'earnings' ? 'ad-earnings' : 'ad-credit', amount: q.total, note: 'حملة: ' + camp.name });
      notifs.add({ type: 'ad', title: 'تم نشر حملتك', text: camp.name, href: '#/ads' });
      return { ok: true, campaign: camp };
    },
    update(id, patch) { const l = ads.list(), c = l.find((x) => x.id === id); if (!c) return false; Object.assign(c, patch); return ls.set(K.ads, l); },
    /* حملات نشطة الآن لموضع معيّن (للمتجر) */
    active(type, ctx) {
      return ads.list().filter((c) => c.type === type && ads.statusOf(c) === 'active' && (type !== 'category' || !c.category || c.category === (ctx && ctx.category)));
    },
    sponsoredIds() { return new Set(ads.active('product').map((c) => Number(c.productId))); },
    isSponsored(pid) { return ads.sponsoredIds().has(Number(pid)); },
    _seen: new Set(),
    impression(id) { if (ads._seen.has(id)) return; ads._seen.add(id); const l = ads.list(), c = l.find((x) => x.id === id); if (c) { c.impressions++; ls.set(K.ads, l); } },
    click(id) { const l = ads.list(), c = l.find((x) => x.id === id); if (c) { c.clicks++; ls.set(K.ads, l); } },
    /* تنبيه بانتهاء الحملات (مرة واحدة لكل حملة) */
    sweep() {
      const l = ads.list(); let ch = false;
      l.forEach((c) => { if (!c.endNotified && ads.statusOf(c) === 'ended') { c.endNotified = true; ch = true; notifs.add({ type: 'ad', title: 'انتهت حملتك', text: c.name, href: '#/ads' }); } });
      if (ch) ls.set(K.ads, l);
    }
  };

  /* ---------- الدعم ----------
     البائع الحقيقي (s.cloudId): التذاكر ورسائلها محفوظة في الداتابيس (support_tickets +
     support_messages) وتصل للإدمن مباشرة في لوحة الدعم، وردود الإدمن تظهر هنا في نفس المحادثة.
     البائع غير المعتمد بعد: يبقى محلياً كما كان. */
  let cloudTickets = null, cloudTicketsLoading = false, cloudTicketsSig = '';
  function mapTicket(t) {
    const msgs = Array.isArray(t.messages) ? t.messages : [];
    const closed = t.status === 'closed' || t.status === 'resolved';
    return {
      id: t.ticket_number, subject: t.subject || 'بدون موضوع', category: t.category || 'أخرى',
      status: closed ? 'closed' : 'open', rawStatus: t.status, createdAt: t.created_at,
      message: msgs.length ? msgs[0].text : '',
      replies: msgs.slice(1).map((m) => ({ from: m.from === 'support' ? 'support' : 'seller', text: m.text, date: m.date }))
    };
  }
  function loadCloudTickets(force) {
    const s = me();
    if (cloudTicketsLoading || !cloud() || !s || !s.cloudId || !cloud().supportMine) return;
    if (cloudTickets !== null && !force) return;
    cloudTicketsLoading = true;
    cloud().supportMine().then((rows) => {
      const list = (rows || []).map(mapTicket);
      const sig = JSON.stringify(list.map((t) => [t.id, t.rawStatus, t.replies.length]));
      const changed = sig !== cloudTicketsSig;
      cloudTicketsSig = sig; cloudTickets = list; cloudTicketsLoading = false;
      if (changed) window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
    }).catch(() => { if (cloudTickets === null) cloudTickets = []; cloudTicketsLoading = false; });
  }
  const isCloudSeller = () => { const s = me(); return !!(s && s.cloudId && cloud() && cloud().supportMine); };
  const ticketErr = (e) => window.dispatchEvent(new CustomEvent('nasaq:cloud-error', { detail: (e && e.message) || 'تعذّر إرسال الرسالة، حاول مرة أخرى.' }));
  const tickets = {
    list() { if (isCloudSeller()) { loadCloudTickets(); return (cloudTickets || []).slice(); } return ls.get(K.tickets, []); },
    get: (id) => tickets.list().find((t) => t.id === id),
    refresh() { if (isCloudSeller()) loadCloudTickets(true); },
    create(t) {
      const x = Object.assign({ id: 'SL-' + Date.now().toString(36).toUpperCase().slice(-6), status: 'open', createdAt: isoNow(), replies: [] }, t);
      if (isCloudSeller()) {
        const s = me();
        (cloudTickets || (cloudTickets = [])).unshift(x); /* ظهور فوري، ثم تأكيد من الداتابيس */
        cloud().submitSupportRaw({ ticketNumber: x.id, subject: x.subject, message: x.message, category: x.category, source: 'seller', name: s.name, email: s.email, priority: 'normal' })
          .then(() => loadCloudTickets(true))
          .catch((e) => { cloudTickets = (cloudTickets || []).filter((y) => y.id !== x.id); ticketErr(e); window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready')); });
        return x;
      }
      const l = tickets.list(); l.unshift(x); ls.set(K.tickets, l); return x;
    },
    reply(id, text) {
      if (isCloudSeller()) {
        const t = (cloudTickets || []).find((x) => x.id === id); if (!t) return false;
        t.replies.push({ from: 'seller', text, date: isoNow() }); t.status = 'open';
        cloud().supportReply(id, text).then(() => loadCloudTickets(true)).catch(ticketErr);
        return true;
      }
      const l = tickets.list(), t = l.find((x) => x.id === id); if (!t) return false; t.replies.push({ from: 'seller', text, date: isoNow() }); t.status = 'open'; return ls.set(K.tickets, l);
    },
    setStatus(id, status) {
      if (isCloudSeller()) {
        const t = (cloudTickets || []).find((x) => x.id === id); if (!t) return false;
        t.status = status; t.rawStatus = status;
        cloud().supportSetStatus(id, status === 'closed' ? 'closed' : 'open').then(() => loadCloudTickets(true)).catch(ticketErr);
        return true;
      }
      const l = tickets.list(), t = l.find((x) => x.id === id); if (!t) return false; t.status = status; return ls.set(K.tickets, l);
    }
  };
  /* تحديث دوري لردود الإدمن أثناء وجود البائع في صفحة الدعم */
  setInterval(() => { if (!document.hidden && /^#\/support/.test(location.hash)) tickets.refresh(); }, 25000);

  /* ---------- الإشعارات ----------
     لأي بائع حقيقي (s.cloudId): تُقرأ من جدول notifications الحقيقي في
     Supabase — نفس الجدول الذي يكتب فيه الـ trigger إشعاراً عند كل تغيّر
     حالة طلب. لغير الحقيقي (لسه بيجرّب المنصة قبل اعتماد متجره): تبقى محلية. */
  let cloudNotifs = null;
  let cloudNotifsLoading = false;
  function loadCloudNotifs() {
    if (cloudNotifsLoading || !cloud()) return;
    cloudNotifsLoading = true;
    cloud().request('/notifications/mine', null, 'GET').then((res) => {
      cloudNotifs = ((res && res.items) || []).map((n) => ({
        id: n.id, type: n.kind, title: n.title, text: n.body || '',
        href: n.href || '#/orders', date: n.created_at, read: !!n.read_at
      }));
      cloudNotifsLoading = false;
      window.dispatchEvent(new CustomEvent('nasaq:seller-data-ready'));
    }).catch(() => { cloudNotifs = []; cloudNotifsLoading = false; });
  }
  const notifs = {
    list() {
      const s = me();
      if (s && s.cloudId) { if (cloudNotifs === null) loadCloudNotifs(); return (cloudNotifs || []).slice(); }
      return ls.get(K.notifs, []);
    },
    unread() { return notifs.list().filter((n) => !n.read).length; },
    add(n) {
      const s = me();
      if (s && s.cloudId) return; /* الإشعارات الحقيقية تُكتب من الخادم فقط عند حدث فعلي (تغيّر حالة، طلب جديد...) */
      const l = ls.get(K.notifs, []); l.unshift(Object.assign({ id: uid('N'), date: isoNow(), read: false }, n)); ls.set(K.notifs, l.slice(0, 50));
    },
    markRead(id) {
      const s = me();
      if (s && s.cloudId && cloud()) {
        cloud().request('/notifications/' + id + '/read', {}, 'PATCH').catch(() => {});
        if (cloudNotifs) { const n = cloudNotifs.find((x) => x.id === id); if (n) n.read = true; }
        return;
      }
      const l = ls.get(K.notifs, []); const n = l.find((x) => x.id === id); if (n) { n.read = true; ls.set(K.notifs, l); }
    },
    readAll() {
      const s = me();
      if (s && s.cloudId && cloud()) {
        cloud().request('/notifications/read-all', {}, 'POST').catch(() => {});
        if (cloudNotifs) cloudNotifs.forEach((n) => { n.read = true; });
        return;
      }
      const l = ls.get(K.notifs, []); l.forEach((n) => { n.read = true; }); ls.set(K.notifs, l);
    }
  };

  /* ---------- رفع الصور: تصغير وضغط قبل الحفظ (حدّ التخزين المحلي ~5MB) ---------- */
  function image(file, o) {
    o = o || {};
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return reject(new Error('الصيغة غير مدعومة، استخدم PNG أو JPG أو WebP'));
      if (file.size > 10 * 1024 * 1024) return reject(new Error('حجم الصورة أكبر من 10MB'));
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('تعذّرت قراءة الملف'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('الملف ليس صورة صالحة'));
        img.onload = () => {
          const max = o.max || 900, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', o.q || 0.78));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  window.Market = {
    K, ls, STATUS, NEXT, seller, products, orders, track, stats, wallet, ads, tickets, notifs, image,
    demo: { on: demoOn, set(v) { seller.save({ demo: !!v }); demoCache = null; } },
    util: { dkey, parseKey, addDays, round2 }
  };
})();
