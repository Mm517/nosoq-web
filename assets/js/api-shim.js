/* ==========================================================================
   js/api-shim.js — يحلّ محل سيرفر الـ Node/Express القديم بالكامل.

   كل ملفات الموقع (cloud.js, admin.js, rider.js, rider-gate.js,
   seller-gate.js, onboarding.js...) كانت أصلاً تتكلم مع الباك إند عبر
   fetch('/api' + path, ...). هذا الملف "يعترض" أي طلب زي ده على مستوى
   المتصفح، وينفّذه مباشرة ضد Supabase (تسجيل دخول حقيقي، جداول، دوال RPC،
   تخزين الصور) — من غير ما يحتاج أي كود تاني في الموقع يتغيّر.

   لازم يتحمّل هذا الملف بعد مكتبة supabase-js وبعد js/nasaq-config.js،
   وقبل أي سكربت تاني بيستخدم fetch('/api...').
   ========================================================================== */
(function () {
  'use strict';

  const realFetch = window.fetch.bind(window);

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[nasaq] مكتبة supabase-js لم تُحمَّل — تأكد من الاتصال بالإنترنت.');
    return;
  }

  const sb = window.supabase.createClient(window.NASAQ_SUPABASE_URL, window.NASAQ_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  window.sb = sb;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

  function jsonResponse(body, status) {
    return new Response(body == null ? null : JSON.stringify(body), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  function okRes(body, status) { return jsonResponse(body, status || 200); }
  function errRes(message, status) { return jsonResponse({ error: message }, status || 400); }
  function numOrNull(v) { const n = Number(v); return v != null && v !== '' && isFinite(n) ? n : null; }

  function translateAuthError(error) {
    const msg = (error && error.message) || '';
    if (/already registered|already exists/i.test(msg)) return 'هذا البريد الإلكتروني مسجَّل من قبل.';
    if (/invalid login credentials/i.test(msg)) return 'بيانات الدخول غير صحيحة.';
    if (/password should be at least/i.test(msg)) return 'كلمة المرور قصيرة جدًا (٦ أحرف على الأقل).';
    if (/rate limit/i.test(msg)) return 'محاولات كثيرة، حاول بعد قليل.';
    return msg || 'حدث خطأ غير متوقع.';
  }

  async function dataUrlToBlob(dataUrl) {
    const res = await realFetch(dataUrl);
    return res.blob();
  }

  /* ---------- الجلسة / الدور الحالي ---------- */
  /* الدور: admin | support | seller | rider | customer.
     موظف الدعم (جدول support_staff في الداتا بيس) بيتعرّف تلقائياً كـ support من أي تسجيل دخول عادي. */
  const roleCache = {};
  async function getRole(userId, fresh) {
    const hit = roleCache[userId];
    if (!fresh && hit && Date.now() - hit.t < 30000) return hit.role;
    let role = null;
    try {
      const { data, error } = await sb.rpc('nasaq_my_role');
      if (!error && data) role = data;
    } catch (_) { /* الدالة لسه متشغّلتش — نكمل بالطريقة القديمة */ }
    if (!role) {
      const { data: adminRow } = await sb.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
      if (adminRow) role = 'admin';
      if (!role) {
        try { const { data: who } = await sb.rpc('support_whoami'); if (who && who.role === 'support') role = 'support'; } catch (_) { /* تجاهل */ }
      }
      if (!role) {
        const { data: mu } = await sb.from('marketplace_users').select('role').eq('external_id', userId).maybeSingle();
        role = (mu && mu.role) || 'customer';
      }
    }
    roleCache[userId] = { role, t: Date.now() };
    return role;
  }

  async function currentSession() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const role = await getRole(user.id);
    const { data: profile } = await sb.from('marketplace_users').select('name,phone').eq('external_id', user.id).maybeSingle();
    return {
      userId: user.id,
      email: user.email,
      role,
      name: (profile && profile.name) || (user.user_metadata && user.user_metadata.name),
      phone: (profile && profile.phone) || (user.user_metadata && user.user_metadata.phone) || null
    };
  }

  function persistLocal(accessToken, sessionUser) {
    try {
      if (accessToken) localStorage.setItem('nasaq_access_token_v1', accessToken);
      if (sessionUser) {
        localStorage.setItem('nasaq_session_v1', JSON.stringify(sessionUser));
        localStorage.setItem('nasaq_cloud_user_v1', sessionUser.userId);
      }
    } catch (_) { /* التخزين غير متاح */ }
  }

  async function syncMarketplaceUser(user, role, extra) {
    extra = extra || {};
    const row = {
      external_id: user.id,
      email: user.email || null,
      name: extra.name || (user.user_metadata && user.user_metadata.name) || (user.email ? user.email.split('@')[0] : 'عميل نَسَق'),
      phone: extra.phone || (user.user_metadata && user.user_metadata.phone) || null,
      role: role || 'customer'
    };
    /* موقع المستخدم (يُرسَل عند التسجيل، أو عند تعديله لاحقاً من الإعدادات) — لا نلمس
       الأعمدة لو مش موجود عشان مانمسحش موقع محفوظ سابقاً في مكالمات تسجيل الدخول العادية. */
    if (extra.latitude != null && extra.longitude != null) {
      row.latitude = Number(extra.latitude);
      row.longitude = Number(extra.longitude);
      row.location_accuracy = extra.location_accuracy != null ? Number(extra.location_accuracy) : null;
      row.location_updated_at = new Date().toISOString();
      row.address = extra.address != null ? String(extra.address).trim() || null : null;
      row.google_place_id = extra.google_place_id != null ? String(extra.google_place_id).trim() || null : null;
    }
    const { error } = await sb.from('marketplace_users').upsert(row, { onConflict: 'external_id' });
    if (error) throw new Error(error.message);
    return row;
  }

  function requestId() {
    return 'NSQ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  /* ---------- الموجّه (router) ---------- */
  const routes = [];
  function on(method, parts, handler) { routes.push({ method, parts: parts.split('/').filter(Boolean), handler }); }

  function matchRoute(method, pathname) {
    const segs = pathname.split('/').filter(Boolean);
    for (const r of routes) {
      if (r.method !== method || r.parts.length !== segs.length) continue;
      const params = {};
      let matched = true;
      for (let i = 0; i < r.parts.length; i++) {
        const p = r.parts[i];
        if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(segs[i]);
        else if (p !== segs[i]) { matched = false; break; }
      }
      if (matched) return { handler: r.handler, params };
    }
    return null;
  }

  /* ===================== AUTH ===================== */
  on('POST', 'auth/signup', async (params, query, body) => {
    const { email, password, name, phone, latitude, longitude, location_accuracy, address, google_place_id } = body || {};
    if (!email || !password || !name || !phone) return errRes('أكمل الاسم والبريد والهاتف وكلمة المرور.');
    const { data, error } = await sb.auth.signUp({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      options: { data: { name: String(name).trim(), phone: String(phone).trim() } }
    });
    if (error) return errRes(translateAuthError(error), 400);
    if (!data.user) return errRes('تعذّر إنشاء الحساب.');
    if (!data.session) {
      /* تأكيد البريد الإلكتروني مفعّل في إعدادات المشروع. Supabase عن قصد
         لا يفرّق في الرد بين "بريد جديد" و"بريد مسجَّل من قبل" (حماية من
         تخمين البريدات المسجَّلة) — لكن نقدر نكتشف الحالة الثانية: لو الحساب
         موجود مسبقاً، data.user.identities بتيجي فاضية []. */
      const alreadyExists = Array.isArray(data.user.identities) && data.user.identities.length === 0;
      if (alreadyExists) return errRes('هذا البريد الإلكتروني مسجَّل بحساب من قبل. سجّل الدخول بدلاً من إنشاء حساب جديد.', 400);
      return errRes('تم إنشاء الحساب. الرجاء تأكيد بريدك الإلكتروني من الرسالة المُرسلة إليك قبل تسجيل الدخول.', 400);
    }
    await syncMarketplaceUser(data.user, 'customer', { name, phone, latitude, longitude, location_accuracy, address, google_place_id });
    const sessionUser = { userId: data.user.id, email: data.user.email, role: 'customer', name: String(name).trim() };
    persistLocal(data.session.access_token, sessionUser);
    return okRes({ access_token: data.session.access_token, user: sessionUser }, 201);
  });

  on('POST', 'auth/login', async (params, query, body) => {
    const { identifier, password } = body || {};
    if (!identifier || !password) return errRes('أدخل بيانات الدخول.');
    let email = String(identifier).trim();
    if (!email.includes('@')) {
      const { data } = await sb.from('marketplace_users').select('email').eq('phone', email).limit(1).maybeSingle();
      if (!data || !data.email) return errRes('لم نعثر على حساب بهذا البريد أو رقم الهاتف.', 401);
      email = data.email;
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: email.toLowerCase(), password: String(password) });
    if (error || !data.user || !data.session) return errRes('بيانات الدخول غير صحيحة.', 401);
    const role = await getRole(data.user.id, true);
    /* موظف الدعم مالوش صف في marketplace_users ولا بنغيّر دوره هناك — حسابه حساب دعم بس */
    if (role !== 'support') await syncMarketplaceUser(data.user, role);
    const sessionUser = { userId: data.user.id, email: data.user.email, role, name: data.user.user_metadata && data.user.user_metadata.name };
    persistLocal(data.session.access_token, sessionUser);
    return okRes({ access_token: data.session.access_token, user: sessionUser, redirect: role === 'support' ? '/support' : null });
  });

  on('GET', 'auth/session', async () => {
    const session = await currentSession();
    if (!session) return errRes('لا توجد جلسة دخول.', 401);
    return okRes({ user: session });
  });

  on('POST', 'auth/logout', async () => {
    await sb.auth.signOut();
    try {
      localStorage.removeItem('nasaq_access_token_v1');
      localStorage.removeItem('nasaq_session_v1');
      localStorage.removeItem('nasaq_admin_access_token_v1');
    } catch (_) { /* تجاهل */ }
    return new Response(null, { status: 204 });
  });

  /* ===================== STORE (عام) ===================== */
  on('GET', 'store/profile', async () => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const { data, error } = await sb.from('marketplace_users').select('external_id,email,name,phone,role,created_at,latitude,longitude,address,google_place_id,location_accuracy,location_updated_at').eq('external_id', session.userId).maybeSingle();
    if (error) return errRes(error.message, 400);
    const profile = data || {
      external_id: session.userId,
      email: session.email || null,
      name: session.name || 'عميل نَسَق',
      phone: session.phone || null,
      role: session.role
    };
    return okRes({ profile });
  });

  on('PATCH', 'store/profile', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    body = body || {};
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    if (name.length < 2) return errRes('اكتب الاسم بالكامل.');
    if (phone.length < 3) return errRes('اكتب رقم هاتف صحيحاً.');
    const row = {
      external_id: session.userId,
      email: session.email || null,
      name,
      phone,
      role: session.role
    };
    /* تعديل الموقع من الإعدادات اختياري: لا نلمس أعمدة الموقع لو الطلب مش شايل
       إحداثيات جديدة (تعديل الاسم/الهاتف وحدهم ميمسحش الموقع المحفوظ). */
    if (body.latitude != null && body.longitude != null) {
      row.latitude = Number(body.latitude);
      row.longitude = Number(body.longitude);
      row.location_accuracy = body.location_accuracy != null ? Number(body.location_accuracy) : null;
      row.location_updated_at = new Date().toISOString();
      row.address = body.address != null ? String(body.address).trim() || null : null;
      row.google_place_id = body.google_place_id != null ? String(body.google_place_id).trim() || null : null;
    }
    const { data, error } = await sb.from('marketplace_users').upsert(row, { onConflict: 'external_id' }).select('external_id,email,name,phone,role,created_at,latitude,longitude,address,google_place_id,location_accuracy,location_updated_at').maybeSingle();
    if (error) return errRes(error.message, 400);
    await sb.auth.updateUser({ data: { name, phone } });
    return okRes({ profile: data || Object.assign({ created_at: null }, row) });
  });

  /* حفظ موقع المشتري فقط (من شريط «حدّد موقعك» / نافذة التوصيل / GPS) في صفّه بـ marketplace_users.
     منفصل عن PATCH store/profile عشان ما يطلبش الاسم والهاتف، ولا يلمس أي عمود غير أعمدة الموقع. */
  on('PATCH', 'store/location', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    body = body || {};
    const lat = Number(body.latitude), lng = Number(body.longitude);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return errRes('إحداثيات الموقع غير صحيحة.');
    if (!(lat >= 21.5 && lat <= 31.95 && lng >= 24.5 && lng <= 37.0)) return errRes('الخدمة متاحة داخل مصر فقط.');
    const acc = body.location_accuracy != null ? Number(body.location_accuracy) : null;
    const patch = {
      latitude: lat,
      longitude: lng,
      location_accuracy: acc != null && isFinite(acc) && acc >= 0 ? acc : null,
      location_updated_at: new Date().toISOString(),
      address: body.address != null ? (String(body.address).trim() || null) : null,
      google_place_id: body.google_place_id != null ? (String(body.google_place_id).trim() || null) : null
    };
    let { data, error } = await sb.from('marketplace_users').update(patch).eq('external_id', session.userId)
      .select('external_id,latitude,longitude,address,google_place_id,location_accuracy,location_updated_at').maybeSingle();
    if (!error && !data) {
      /* حساب مسجَّل بدون صف في marketplace_users (حالة نادرة): ننشئه بالحد الأدنى ثم نحفظ الموقع */
      const ins = Object.assign({ external_id: session.userId, email: session.email || null, name: session.name || 'عميل نَسَق', phone: session.phone || null, role: session.role || 'customer' }, patch);
      const r = await sb.from('marketplace_users').upsert(ins, { onConflict: 'external_id' })
        .select('external_id,latitude,longitude,address,google_place_id,location_accuracy,location_updated_at').maybeSingle();
      data = r.data; error = r.error;
    }
    if (error) return errRes(error.message, 400);
    return okRes({ profile: data || patch });
  });

  on('GET', 'store/orders/mine', async () => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const { data, error } = await sb.from('orders').select('*,order_items(*)').eq('customer_external_id', session.userId).order('created_at', { ascending: false }).limit(50);
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('POST', 'store/users/upsert', async (params, query, body) => {
    body = body || {};
    const session = await currentSession();
    const externalId = session ? session.userId : (body.externalId || ('browser-' + crypto.randomUUID()));
    const row = {
      external_id: externalId,
      email: body.email || null,
      name: body.name || 'عميل نَسَق',
      phone: body.phone || null,
      role: ['customer', 'seller', 'rider'].includes(body.role) ? body.role : 'customer'
    };
    const { data, error } = await sb.from('marketplace_users').upsert(row, { onConflict: 'external_id' }).select().maybeSingle();
    if (error) return errRes(session ? error.message : 'سجّل الدخول أولاً.', 400);
    return okRes(data || row);
  });

  on('POST', 'store/products/upsert', async (params, query, body) => {
    body = body || {};
    const row = {
      legacy_id: Number.isFinite(Number(body.legacyId)) ? Number(body.legacyId) : null,
      store_id: isUuid(body.storeId) ? body.storeId : null,
      seller_external_id: body.sellerExternalId || null,
      name: body.nameAr || body.name || '',
      name_ar: body.nameAr || body.name || '',
      name_en: body.nameEn || null,
      name_de: body.nameDe || null,
      description_ar: body.descriptionAr || body.description || null,
      description_en: body.descriptionEn || null,
      description_de: body.descriptionDe || null,
      slug: body.slug || null,
      category: body.category || 'clothes',
      price: Number(body.price || 0),
      old_price: body.oldPrice == null ? null : Number(body.oldPrice),
      stock: Math.max(0, Number(body.stock || 0)),
      status: ['draft', 'active', 'archived'].includes(body.status) ? body.status : 'active',
      sku: body.sku || null,
      description: body.description || null,
      details: Array.isArray(body.details) ? body.details : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      photos: Array.isArray(body.photos) ? body.photos : [],
      video_url: body.videoUrl || null,
      video_path: body.videoPath || null
    };
    let query_ = sb.from('products');
    let res;
    if (row.legacy_id != null) {
      res = await query_.upsert(row, { onConflict: 'legacy_id' }).select().maybeSingle();
    } else {
      res = await query_.insert(row).select().maybeSingle();
    }
    if (res.error) return errRes(res.error.message, 400);
    return okRes(res.data || row);
  });

  /* رفع فيديو المنتج (bucket عام: product-videos) — MP4/WebM/MOV/OGG حتى 50 ميجابايت */
  on('POST', 'store/uploads/video', async (params, query, body) => {
    body = body || {};
    const { dataUrl, filename } = body;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:video/')) return errRes('ملف الفيديو غير صالح.');
    const match = /^data:(video\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
    const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
    if (!match || !ALLOWED.includes(match[1])) return errRes('صيغة الفيديو غير مدعومة (MP4 أو WebM أو MOV).');
    const contentType = match[1];
    const blob = await dataUrlToBlob(dataUrl);
    if (blob.size > 50 * 1024 * 1024) return errRes('حجم الفيديو أكبر من 50MB.', 413);
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const ext = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/ogg': 'ogv' }[contentType] || 'mp4';
    const safeName = String(filename || 'video').replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = session.userId + '/' + crypto.randomUUID() + '-' + safeName + '.' + ext;
    const { error } = await sb.storage.from('product-videos').upload(path, blob, { contentType, upsert: true });
    if (error) return errRes('تعذّر رفع الفيديو: ' + error.message, 400);
    const { data } = sb.storage.from('product-videos').getPublicUrl(path);
    return okRes({ publicUrl: data.publicUrl, path }, 201);
  });

  /* مزامنة ألوان المنتج (Variants): كل لون باسم + كود لون + كمية مستقلة + صورة أو أكثر.
     تستبدل القائمة كاملة في كل مرة (حذف ثم إعادة إدراج) — أبسط وأضمن اتساقاً من محاولة
     مطابقة كل لون على حدة، وحجم القوائم هنا صغير (8 ألوان كحد أقصى). */
  on('POST', 'store/products/:id/colors', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const productId = params.id;
    if (!isUuid(productId)) return errRes('معرّف المنتج غير صحيح.');
    const { data: prod } = await sb.from('products').select('id,seller_external_id').eq('id', productId).maybeSingle();
    if (!prod) return errRes('المنتج غير موجود.', 404);
    if (prod.seller_external_id !== session.userId && session.role !== 'admin') return errRes('لا تملك صلاحية تعديل هذا المنتج.', 403);
    const colors = Array.isArray(body && body.colors) ? body.colors.slice(0, 8) : [];

    const { error: delErr } = await sb.from('product_colors').delete().eq('product_id', productId);
    if (delErr) return errRes(delErr.message, 400);

    const saved = [];
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i] || {};
      const name = String(c.name || '').trim().slice(0, 30);
      if (!name) continue;
      const { data: colorRow, error: colorErr } = await sb.from('product_colors')
        .insert({ product_id: productId, name, hex: c.hex || null, stock: Math.max(0, Number(c.stock || 0)), sort_order: i })
        .select().maybeSingle();
      if (colorErr || !colorRow) return errRes((colorErr && colorErr.message) || 'تعذّر حفظ اللون «' + name + '».', 400);
      const imgs = Array.isArray(c.images) ? c.images.slice(0, 6) : [];
      const savedImgs = [];
      for (let j = 0; j < imgs.length; j++) {
        let url = imgs[j];
        if (typeof url === 'string' && /^data:image\//.test(url)) {
          const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(url);
          if (!match) continue;
          const blob = await dataUrlToBlob(url);
          if (blob.size > 8 * 1024 * 1024) return errRes('حجم إحدى صور لون «' + name + '» أكبر من 8MB.', 413);
          const ext = match[1].split('/')[1] || 'jpg';
          const path = 'colors/' + productId + '/' + colorRow.id + '/' + crypto.randomUUID() + '.' + ext;
          const { error: upErr } = await sb.storage.from('product-images').upload(path, blob, { contentType: match[1], upsert: true });
          if (upErr) return errRes('تعذّر رفع صورة لون «' + name + '»: ' + upErr.message, 400);
          url = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        }
        if (typeof url !== 'string' || !url) continue;
        const { data: imgRow } = await sb.from('product_images')
          .insert({ product_id: productId, color_id: colorRow.id, public_url: url, sort_order: j })
          .select().maybeSingle();
        if (imgRow) savedImgs.push(imgRow.public_url);
      }
      saved.push({ id: colorRow.id, name: colorRow.name, hex: colorRow.hex, stock: colorRow.stock, images: savedImgs });
    }
    return okRes({ colors: saved }, 201);
  });

  on('GET', 'store/products/:id/colors', async (params) => {
    const productId = params.id;
    if (!isUuid(productId)) return errRes('معرّف المنتج غير صحيح.');
    const { data, error } = await sb.from('product_colors')
      .select('id,name,hex,stock,sort_order,product_images(public_url,sort_order)')
      .eq('product_id', productId).order('sort_order', { ascending: true });
    if (error) return errRes(error.message, 400);
    const colors = (data || []).map((c) => ({
      id: c.id, name: c.name, hex: c.hex, stock: c.stock,
      images: (c.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => i.public_url)
    }));
    return okRes({ colors });
  });

  on('POST', 'store/stores/upsert', async (params, query, body) => {
    body = body || {};
    const session = await currentSession();
    /* موقع المتجر: يُقرأ من latitude/longitude المرسلة مباشرة، أو من داخل address.lat/lng
       (شكل القيمة التي تُرجعها أداة اختيار الموقع Geo.mount). المتجر بلا موقع لن يظهر لأي
       مشترٍ إطلاقًا (لا يمكن حساب مسافته)، لذلك هذا الحقل إلزامي. */
    const lat = numOrNull(body.latitude != null ? body.latitude : (body.address && body.address.lat));
    const lng = numOrNull(body.longitude != null ? body.longitude : (body.address && body.address.lng));
    if (lat == null || lng == null) return errRes('حدّد موقع متجرك على الخريطة قبل الحفظ.', 400);
    const row = {
      owner_external_id: body.ownerExternalId || (session && session.userId),
      name: body.name || '',
      slug: body.slug || ('store-' + crypto.randomUUID().slice(0, 8)),
      category: body.category || null,
      phone: body.phone || null,
      email: body.email || null,
      description: body.description || null,
      logo_url: body.logoUrl || null,
      address: body.address || {},
      latitude: lat,
      longitude: lng
    };
    if (!row.owner_external_id) return errRes('سجّل الدخول أولاً.', 401);
    const { data, error } = await sb.from('stores').upsert(row, { onConflict: 'slug' }).select().maybeSingle();
    if (error) return errRes(error.message, 400);
    return okRes(data || row);
  });

  on('POST', 'store/orders', async (params, query, body) => {
    body = body || {};
    const session = await currentSession();
    const customerExternalId = session ? session.userId : (body.customerExternalId || ('browser-' + crypto.randomUUID()));
    if (session) {
      await syncMarketplaceUser({ id: session.userId, email: body.customer && body.customer.email, user_metadata: {} },
        'customer', { name: (body.customer && body.customer.name) || session.name, phone: body.customer && body.customer.phone });
    }
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const p = {
      order_number: body.orderNumber || undefined,
      customer_external_id: session ? undefined : customerExternalId,
      customer: body.customer || {},
      shipping: Number(body.shipping || 0),
      discount: Number(body.discount || 0),
      payment: body.payment || 'cod',
      method: body.method || 'standard',
      lines: lines.map((line) => ({
        legacy_product_id: Number.isFinite(Number(line.productId)) ? Number(line.productId) : null,
        product_name: line.productName || line.name || '',
        quantity: Math.max(1, Number(line.qty || line.quantity || 1)),
        unit_price: Math.max(0, Number(line.price || line.unitPrice || 0)),
        size: line.size || null,
        color: line.color || null
      }))
    };
    const { data: result, error } = await sb.rpc('create_marketplace_order', { p });
    if (error) return errRes(error.message || 'تعذّر حفظ الطلب.', 400);
    const { data: saved } = await sb.from('orders').select('*,order_items(*)').eq('id', result.id).maybeSingle();
    return okRes(saved || result, 201);
  });

  /* ---------- صور طلبات التقديم (bucket خاص: application-documents) ---------- */
  const DOC_KINDS = ['idPhoto', 'personalPhoto', 'storefrontPhoto', 'licensePhoto'];
  const DOC_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  on('POST', 'store/application-uploads', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('أنشئ حسابك أولاً قبل رفع الصور.', 401);
    body = body || {};
    if (!DOC_KINDS.includes(body.kind)) return errRes('نوع المستند غير معروف.');
    const match = typeof body.dataUrl === 'string' && /^data:(image\/(?:jpeg|png|webp));base64,/.exec(body.dataUrl);
    if (!match) return errRes('صيغة الصورة غير مدعومة (JPG أو PNG أو WEBP).');
    const blob = await dataUrlToBlob(body.dataUrl);
    if (blob.size > 5 * 1024 * 1024) return errRes('حجم الصورة أكبر من 5 ميجابايت.', 413);
    const path = session.userId + '/' + body.kind + '-' + crypto.randomUUID() + '.' + DOC_EXT[match[1]];
    const { error } = await sb.storage.from('application-documents').upload(path, blob, { contentType: match[1], upsert: false });
    if (error) return errRes('تعذّر رفع الصورة: ' + error.message, 400);
    return okRes({ path }, 201);
  });

  /* يقبل فقط مسارات داخل مجلد المستخدم نفسه ومن الأنواع المعروفة */
  function cleanDocuments(documents, userId) {
    const out = {};
    if (!documents || typeof documents !== 'object') return out;
    DOC_KINDS.forEach((k) => {
      const v = documents[k];
      if (typeof v === 'string' && v.startsWith(userId + '/') && !v.includes('..')) out[k] = v;
    });
    return out;
  }

  on('POST', 'store/seller-application', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('أنشئ حسابك أولاً قبل تقديم طلب المتجر.', 401);
    body = body || {};
    if (!body.storeName || !body.phone || !body.address) return errRes('أكمل اسم المتجر ورقم الهاتف والعنوان.');
    const storeLat = numOrNull(body.latitude);
    const storeLng = numOrNull(body.longitude);
    if (storeLat == null || storeLng == null) return errRes('حدّد موقع متجرك على الخريطة قبل إرسال الطلب.');
    await sb.from('marketplace_users').upsert({ external_id: session.userId, role: 'seller' }, { onConflict: 'external_id' });
    const slugBase = String(body.storeName).trim().toLowerCase().replace(/[^a-z0-9أ-ي\s-]/gi, '').replace(/\s+/g, '-').slice(0, 40) || 'store';
    const storeRow = {
      owner_external_id: session.userId,
      name: String(body.storeName).trim(),
      slug: slugBase + '-' + session.userId.slice(-6),
      category: body.category || null,
      phone: String(body.phone).trim(),
      email: session.email,
      description: body.description || null,
      logo_url: body.logoUrl || null,
      address: typeof body.address === 'string' ? { raw: body.address } : (body.address || {}),
      latitude: storeLat,
      longitude: storeLng
    };
    const { data: store, error: storeErr } = await sb.from('stores').upsert(storeRow, { onConflict: 'owner_external_id' }).select().maybeSingle();
    if (storeErr || !store) return errRes((storeErr && storeErr.message) || 'تعذّر إنشاء المتجر.', 400);
    const appRow = {
      request_id: requestId(),
      account_type: 'seller',
      name: body.ownerName || session.name || '',
      phone: String(body.phone).trim(),
      email: session.email,
      status: 'pending',
      user_external_id: session.userId,
      store_id: store.id,
      payload: Object.assign({ nationalId: body.nationalId || null, license: body.license || null }, cleanDocuments(body.documents, session.userId))
    };
    const { data: application } = await sb.from('applications').insert(appRow).select().maybeSingle();
    const newUser = Object.assign({}, session, { role: 'seller' });
    persistLocal(null, newUser);
    return okRes({ store, application, access_token: localStorage.getItem('nasaq_access_token_v1'), user: newUser }, 201);
  });

  on('POST', 'store/rider-application', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('أنشئ حسابك أولاً قبل تقديم طلب الانضمام.', 401);
    body = body || {};
    if (!body.name || !body.phone) return errRes('أكمل الاسم ورقم الهاتف.');
    await sb.from('marketplace_users').upsert({ external_id: session.userId, role: 'rider' }, { onConflict: 'external_id' });
    const riderRow = {
      user_external_id: session.userId,
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      national_id: body.nationalId || null,
      vehicle: ['motorbike', 'scooter', 'car', 'bike'].includes(body.vehicle) ? body.vehicle : 'motorbike',
      city: body.city || null,
      area: body.area || null,
      coverage: body.coverage || null
    };
    const { data: rider, error: riderErr } = await sb.from('riders').upsert(riderRow, { onConflict: 'user_external_id' }).select().maybeSingle();
    if (riderErr || !rider) return errRes((riderErr && riderErr.message) || 'تعذّر إنشاء حساب المندوب.', 400);
    const appRow = {
      request_id: requestId(),
      account_type: 'rider',
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: session.email,
      status: 'pending',
      user_external_id: session.userId,
      rider_id: rider.id,
      payload: cleanDocuments(body.documents, session.userId)
    };
    const { data: application } = await sb.from('applications').insert(appRow).select().maybeSingle();
    const newUser = Object.assign({}, session, { role: 'rider' });
    persistLocal(null, newUser);
    return okRes({ rider, application, access_token: localStorage.getItem('nasaq_access_token_v1'), user: newUser }, 201);
  });

  on('GET', 'store/application-status', async () => {
    const session = await currentSession();
    if (!session) return errRes('لا توجد جلسة دخول.', 401);
    const { data } = await sb.from('applications').select('*').eq('user_external_id', session.userId).order('submitted_at', { ascending: false }).limit(1);
    return okRes({ application: (data && data[0]) || null });
  });

  on('POST', 'store/applications', async (params, query, body) => {
    body = body || {};
    const session = await currentSession();
    const row = {
      request_id: body.requestId || ('NSQ-' + Date.now()),
      account_type: body.accountType || 'seller',
      name: body.name || '',
      phone: body.phone || null,
      email: body.email || null,
      status: 'pending',
      user_external_id: session ? session.userId : null
    };
    const { data, error } = await sb.from('applications').upsert(row, { onConflict: 'request_id' }).select().maybeSingle();
    if (error) return errRes(error.message, 400);
    return okRes(data || row, 201);
  });

  /* الدعم: المسجّل دخوله يمرّ على دالة support_create_ticket (تنشئ التذكرة + أول رسالة +
     إشعار للإدمن)، والزائر بلا حساب يُدرَج مباشرةً في support_tickets كما كان. */
  on('POST', 'store/support', async (params, query, body) => {
    body = body || {};
    const session = await currentSession();
    const priority = ['low', 'normal', 'high', 'urgent'].includes(body.priority) ? body.priority : 'normal';
    if (session) {
      const { data, error } = await sb.rpc('support_create_ticket', {
        p_subject: body.subject || 'استفسار من المتجر',
        p_message: body.message || '',
        p_category: body.category || null,
        p_priority: priority,
        p_origin: ['seller', 'customer', 'rider'].includes(body.source) ? body.source : (session.role === 'seller' ? 'seller' : session.role === 'rider' ? 'rider' : 'customer'),
        p_name: body.name || session.name || null,
        p_email: body.email || session.email || null,
        p_ticket_number: body.ticketNumber || null
      });
      if (error) return errRes(error.message, 400);
      return okRes(data, 201);
    }
    const row = {
      ticket_number: body.ticketNumber || ('SUP-' + Date.now().toString(36).toUpperCase()),
      user_external_id: null,
      email: body.email || null,
      name: body.name || null,
      subject: body.subject || 'استفسار من المتجر',
      message: body.message || '',
      priority,
      source: 'storefront'
    };
    const { data, error } = await sb.from('support_tickets').insert(row).select().maybeSingle();
    if (error) return errRes(error.message, 400);
    return okRes(data || row, 201);
  });

  on('GET', 'support/mine', async () => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const { data, error } = await sb.rpc('support_my_tickets');
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });
  on('POST', 'support/:ticket/reply', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const { data, error } = await sb.rpc('support_user_reply', { p_ticket_number: params.ticket, p_body: (body && body.body) || '', p_attachments: (body && Array.isArray(body.attachments)) ? body.attachments.slice(0, 6) : [] });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });
  on('PATCH', 'support/:ticket/status', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const { data, error } = await sb.rpc('support_user_set_status', { p_ticket_number: params.ticket, p_status: body && body.status });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* موقع الزائر (بلا حساب) — يُحفظ بمعرّف الجهاز في visitor_locations */
  on('POST', 'store/visitor-location', async (params, query, body) => {
    body = body || {};
    const { error } = await sb.rpc('save_visitor_location', {
      p_device: String(body.deviceId || ''), p_lat: Number(body.latitude), p_lng: Number(body.longitude),
      p_address: body.address || null, p_accuracy: body.accuracy != null ? Number(body.accuracy) : null
    });
    if (error) return errRes(error.message, 400);
    return okRes({ ok: true });
  });

  /* عدّادات المشاهدة/السلة (تعمل للزائر أيضاً) */
  on('POST', 'store/track', async (params, query, body) => {
    body = body || {};
    if (!isUuid(body.productUuid)) return okRes({ ok: false });
    await sb.rpc('track_product_event', { p_product: body.productUuid, p_kind: body.kind === 'cart' ? 'cart' : 'view' });
    return okRes({ ok: true });
  });

  on('POST', 'store/uploads', async (params, query, body) => {
    body = body || {};
    const { dataUrl, filename } = body;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return errRes('ملف الصورة غير صالح.');
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
    if (!match) return errRes('صيغة الصورة غير مدعومة.');
    const contentType = match[1];
    const blob = await dataUrlToBlob(dataUrl);
    if (blob.size > 5 * 1024 * 1024) return errRes('حجم الصورة أكبر من 5 ميجابايت.', 413);
    const safeName = String(filename || 'image').replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = new Date().toISOString().slice(0, 10) + '/' + crypto.randomUUID() + '-' + safeName;
    const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType, upsert: true });
    if (error) return errRes('تعذّر رفع الصورة (سجّل الدخول أولاً): ' + error.message, 400);
    const { data } = sb.storage.from('product-images').getPublicUrl(path);
    return okRes({ publicUrl: data.publicUrl, proxyUrl: data.publicUrl }, 201);
  });

  /* ===================== ADMIN ===================== */
  async function requireAdmin() {
    const session = await currentSession();
    if (!session || session.role !== 'admin') return null;
    return session;
  }

  /* الأدمن أو موظف الدعم (يحدّده الأدمن من تبويب «الدعم» ← فريق الدعم) */
  async function staffRole() {
    const session = await currentSession();
    if (!session) return null;
    const { data } = await sb.rpc('support_whoami');
    const role = data && data.role;
    return (role === 'admin' || role === 'support') ? { session, role } : null;
  }
  const staffOnly = () => errRes('هذه الصفحة مخصصة للإدارة والدعم.', 403);

  /* روابط موقَّعة مؤقتة (ساعة) لعرض صور طلبات التقديم للإدمن فقط */
  on('POST', 'admin/application-documents', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const paths = ((body && body.paths) || []).filter((p) => typeof p === 'string' && p && !p.includes('..')).slice(0, 10);
    if (!paths.length) return okRes({ urls: [] });
    const { data, error } = await sb.storage.from('application-documents').createSignedUrls(paths, 3600);
    if (error) return errRes(error.message, 400);
    return okRes({ urls: paths.map((p) => { const hit = (data || []).find((x) => x.path === p); return (hit && hit.signedUrl) || null; }) });
  });

  on('POST', 'admin/auth/login', async (params, query, body) => {
    body = body || {};
    const { data, error } = await sb.auth.signInWithPassword({ email: String(body.email || '').trim().toLowerCase(), password: String(body.password || '') });
    if (error || !data.user) return errRes('فشل دخول الإدمن.', 401);
    const { data: who } = await sb.rpc('support_whoami');
    const role = who && who.role;
    if (role !== 'admin' && role !== 'support') { await sb.auth.signOut(); return errRes('الحساب ليس حساب إدمن أو دعم.', 403); }
    const sessionUser = { userId: data.user.id, email: data.user.email, role, name: data.user.user_metadata && data.user.user_metadata.name };
    return okRes({ access_token: data.session.access_token, user: sessionUser });
  });

  on('GET', 'admin/session', async () => {
    const st = await staffRole();
    if (!st) return errRes('هذه الصفحة مخصصة للإدارة والدعم.', 403);
    return okRes({ user: { email: st.session.email, name: st.session.name, role: st.role } });
  });

  on('GET', 'admin/summary', async () => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data: overview, error } = await sb.rpc('admin_overview');
    if (error) return errRes(error.message, 400);
    return okRes({
      orders: overview.orders.total,
      openOrders: overview.orders.open,
      openTickets: overview.tickets_open,
      products: overview.products_active,
      revenue: overview.orders.revenue
    });
  });

  on('GET', 'admin/orders', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('orders').select('*,order_items(*)').order('created_at', { ascending: false }).limit(1000);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('GET', 'admin/support', async () => {
    if (!(await staffRole())) return staffOnly();
    const { data, error } = await sb.rpc('admin_support_list');
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });
  on('GET', 'admin/support/:ticket', async (params) => {
    if (!(await staffRole())) return staffOnly();
    const { data, error } = await sb.rpc('admin_support_thread', { p_ticket_number: params.ticket });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });
  on('POST', 'admin/support/:ticket/reply', async (params, query, body) => {
    if (!(await staffRole())) return staffOnly();
    const { data, error } = await sb.rpc('admin_support_reply', {
      p_ticket_number: params.ticket, p_body: (body && body.body) || '', p_status: (body && body.status) || 'in_progress',
      p_attachments: (body && Array.isArray(body.attachments)) ? body.attachments.slice(0, 6) : []
    });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });
  /* رفع صورة داخل محادثة (bucket خاص support-files، المسار يبدأ برقم التذكرة) */
  on('POST', 'admin/support/:ticket/upload', async (params, query, body) => {
    if (!(await staffRole())) return staffOnly();
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,/.exec((body && body.dataUrl) || '');
    if (!match) return errRes('صيغة الصورة غير مدعومة (JPG/PNG/WebP/GIF).');
    const blob = await dataUrlToBlob(body.dataUrl);
    if (blob.size > 5 * 1024 * 1024) return errRes('حجم الصورة أكبر من 5 ميجابايت.', 413);
    const ext = match[1].split('/')[1].replace('jpeg', 'jpg');
    const path = params.ticket + '/' + crypto.randomUUID() + '.' + ext;
    const { error } = await sb.storage.from('support-files').upload(path, blob, { contentType: match[1], upsert: false });
    if (error) return errRes('تعذّر رفع الصورة: ' + error.message, 400);
    return okRes({ path }, 201);
  });
  on('POST', 'support/signed', async (params, query, body) => {
    const session = await currentSession();
    if (!session) return errRes('سجّل الدخول أولاً.', 401);
    const paths = ((body && body.paths) || []).filter((p) => typeof p === 'string' && p && !p.includes('..')).slice(0, 30);
    if (!paths.length) return okRes({ urls: {} });
    const { data, error } = await sb.storage.from('support-files').createSignedUrls(paths, 3600);
    if (error) return errRes(error.message, 400);
    const urls = {}; (data || []).forEach((x) => { if (x.path && x.signedUrl) urls[x.path] = x.signedUrl; });
    return okRes({ urls });
  });
  on('PATCH', 'admin/support/:id/status', async (params, query, body) => {
    if (!(await staffRole())) return staffOnly();
    const { data, error } = await sb.rpc('staff_support_set_status', { p_ticket_number: params.id, p_status: body && body.status });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });
  /* فريق الدعم — للأدمن فقط */
  on('GET', 'admin/support-staff', async () => {
    if (!(await requireAdmin())) return errRes('للأدمن فقط.', 403);
    const { data, error } = await sb.rpc('admin_support_staff_list');
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });
  on('POST', 'admin/support-staff', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('للأدمن فقط.', 403);
    const { data, error } = await sb.rpc('admin_support_staff_add', { p_email: (body && body.email) || '', p_name: (body && body.name) || null });
    if (error) return errRes(error.message, 400);
    return okRes(data, 201);
  });
  on('DELETE', 'admin/support-staff/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('للأدمن فقط.', 403);
    const { data, error } = await sb.rpc('admin_support_staff_remove', { p_user_id: params.id });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('PATCH', 'admin/orders/:id/status', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const allowed = ['new', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!allowed.includes(body && body.status)) return errRes('حالة الطلب غير صحيحة.');
    const { data, error } = await sb.from('orders').update({ status: body.status }).eq('id', params.id).select().maybeSingle();
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('GET', 'admin/overview', async () => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_overview');
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('GET', 'admin/stores', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('stores').select('*').order('created_at', { ascending: false }).limit(500);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('GET', 'admin/riders', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('riders').select('*').order('created_at', { ascending: false }).limit(500);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('GET', 'admin/deliveries', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('deliveries').select('*,stores(name),riders(name,phone)').order('requested_at', { ascending: false }).limit(500);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('POST', 'admin/deliveries/:id/assign', async (params, query, body) => {
    const session = await requireAdmin();
    if (!session) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_assign_delivery', { p_delivery: params.id, p_rider: (body && body.riderId) || null, p_admin: session.email });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* إعداد Radius الطلبات القريبة (متر) — الحد الأدنى 1 والأقصى 50000 (50 كم)، الافتراضي 5000 */
  on('GET', 'admin/settings/delivery-radius', async () => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.from('app_settings').select('value_num').eq('key', 'delivery_radius_m').maybeSingle();
    if (error) return errRes(error.message, 400);
    return okRes({ meters: data ? Number(data.value_num) : 5000 });
  });

  on('PUT', 'admin/settings/delivery-radius', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const meters = Number(body && body.meters);
    if (!isFinite(meters) || meters < 1 || meters > 50000) return errRes('النطاق يجب أن يكون بين 1 متر و50000 متر (50 كم).', 400);
    const { data, error } = await sb.rpc('admin_set_delivery_radius', { p_meters: meters });
    if (error) return errRes(error.message, 400);
    return okRes({ meters: Number(data) });
  });

  on('POST', 'admin/stores/:id/review', async (params, query, body) => {
    const session = await requireAdmin();
    if (!session) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const allowed = ['active', 'rejected', 'suspended'];
    if (!allowed.includes(body && body.status)) return errRes('حالة غير صحيحة.');
    const { data, error } = await sb.rpc('admin_review_entity', { p_kind: 'store', p_id: params.id, p_status: body.status, p_note: (body && body.note) || null, p_admin: session.email });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('POST', 'admin/riders/:id/review', async (params, query, body) => {
    const session = await requireAdmin();
    if (!session) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const allowed = ['active', 'rejected', 'suspended'];
    if (!allowed.includes(body && body.status)) return errRes('حالة غير صحيحة.');
    const { data, error } = await sb.rpc('admin_review_entity', { p_kind: 'rider', p_id: params.id, p_status: body.status, p_note: (body && body.note) || null, p_admin: session.email });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });


  /* ---------- Admin Dashboard: طلبات التقديم (Applications) ---------- */
  on('GET', 'admin/applications', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('applications').select('*,stores(name,category,address,phone,logo_url),riders(name,vehicle,city,area,coverage)').order('submitted_at', { ascending: false }).limit(1000);
    if (query.status) q = q.eq('status', query.status);
    if (query.type) q = q.eq('account_type', query.type);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('POST', 'admin/applications/:id/review', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(body && body.status)) return errRes('حالة غير صحيحة.');
    if (body.status === 'rejected' && !(body.reason && String(body.reason).trim())) return errRes('اكتب سبب الرفض.');
    const { data, error } = await sb.rpc('admin_review_application', { p_id: params.id, p_status: body.status, p_reason: (body && body.reason) || null });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ---------- Admin Dashboard: المستخدمون (Users) ---------- */
  on('GET', 'admin/users', async () => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_users_overview');
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('GET', 'admin/users/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data: profile, error } = await sb.from('marketplace_users').select('*').eq('external_id', params.id).maybeSingle();
    if (error) return errRes(error.message, 400);
    if (!profile) return errRes('المستخدم غير موجود.', 404);
    const { data: orders } = await sb.from('orders').select('*,order_items(*)').eq('customer_external_id', params.id).order('created_at', { ascending: false }).limit(100);
    const { data: transactions } = await sb.from('transactions').select('*').eq('customer_external_id', params.id).order('created_at', { ascending: false }).limit(100);
    return okRes({ profile, orders: orders || [], transactions: transactions || [] });
  });

  on('POST', 'admin/users/:id/status', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const allowed = ['active', 'disabled'];
    if (!allowed.includes(body && body.status)) return errRes('حالة غير صحيحة.');
    const { data, error } = await sb.rpc('admin_set_user_status', { p_external_id: params.id, p_status: body.status });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('POST', 'admin/users/:id/delete', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_soft_delete_user', { p_external_id: params.id });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ---------- Admin Dashboard: البائعون (Sellers, extended) ---------- */
  on('GET', 'admin/sellers', async () => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_sellers_overview');
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('GET', 'admin/sellers/:id/earnings', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_seller_earnings', { p_store: params.id });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ---------- Admin Dashboard: السائقون (Riders, extended) ---------- */
  on('GET', 'admin/riders/:id/earnings', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_rider_earnings', { p_rider: params.id });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ---------- Admin Dashboard: المنتجات (Products) ---------- */
  on('GET', 'admin/products', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('products').select('*,stores(name,owner_external_id)').order('added_at', { ascending: false }).limit(1000);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('POST', 'admin/products/:id/review', async (params, query, body) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const allowed = ['active', 'rejected', 'hidden', 'pending', 'archived'];
    if (!allowed.includes(body && body.status)) return errRes('حالة غير صحيحة.');
    if (body.status === 'rejected' && !(body.reason && String(body.reason).trim())) return errRes('اكتب سبب الرفض.');
    const { data, error } = await sb.rpc('admin_review_product', { p_id: params.id, p_status: body.status, p_reason: (body && body.reason) || null });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('DELETE', 'admin/products/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { error } = await sb.from('products').delete().eq('id', params.id);
    if (error) return errRes(error.message, 400);
    return new Response(null, { status: 204 });
  });

  /* ---------- Admin Dashboard: حذف كامل لأي عنصر (طلب/منتج/متجر/سائق/طلب تقديم/محادثة/معاملة/توصيلة) ---------- */
  const PURGE_KINDS = ['order', 'product', 'store', 'rider', 'application', 'ticket', 'transaction', 'delivery'];
  on('DELETE', 'admin/purge/:kind/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    if (!PURGE_KINDS.includes(params.kind)) return errRes('نوع غير مدعوم للحذف.');
    const { data, error } = await sb.rpc('admin_delete_entity', { p_kind: params.kind, p_id: params.id });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ---------- Admin Dashboard: تفاصيل متجر / سائق (بطاقة كاملة) ---------- */
  on('GET', 'admin/stores/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.from('stores').select('*').eq('id', params.id).maybeSingle();
    if (error) return errRes(error.message, 400);
    if (!data) return errRes('المتجر غير موجود.', 404);
    return okRes(data);
  });
  on('GET', 'admin/riders/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.from('riders').select('*').eq('id', params.id).maybeSingle();
    if (error) return errRes(error.message, 400);
    if (!data) return errRes('السائق غير موجود.', 404);
    return okRes(data);
  });

  /* ---------- Admin Dashboard: تفاصيل طلب (Order detail) ---------- */
  on('GET', 'admin/orders/:id', async (params) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data: order, error } = await sb.from('orders').select('*,order_items(*)').eq('id', params.id).maybeSingle();
    if (error) return errRes(error.message, 400);
    if (!order) return errRes('الطلب غير موجود.', 404);
    const { data: storeOrders } = await sb.from('store_orders').select('*,stores(name,phone)').eq('order_id', params.id);
    const { data: delivery } = await sb.from('deliveries').select('*,riders(name,phone)').eq('order_id', params.id).maybeSingle();
    const { data: transactions } = await sb.from('transactions').select('*').eq('order_id', params.id);
    return okRes({ order, storeOrders: storeOrders || [], delivery: delivery || null, transactions: transactions || [] });
  });

  /* ---------- Admin Dashboard: اللوحة المالية والمعاملات ---------- */
  on('GET', 'admin/financial-summary', async () => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    const { data, error } = await sb.rpc('admin_financial_summary');
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('GET', 'admin/transactions', async (params, query) => {
    if (!(await requireAdmin())) return errRes('هذه الصفحة مخصصة للإدمن.', 403);
    let q = sb.from('transactions').select('*,orders(order_number),stores(name),riders(name)').order('created_at', { ascending: false }).limit(1000);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  /* ===================== SELLER ===================== */
  async function requireSeller() {
    const session = await currentSession();
    if (!session || (session.role !== 'seller' && session.role !== 'admin')) return null;
    return session;
  }
  async function myStore(externalId) {
    const { data } = await sb.from('stores').select('*').eq('owner_external_id', externalId).limit(1).maybeSingle();
    return data || null;
  }

  on('GET', 'seller/me', async () => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    return okRes({ store: await myStore(session.userId) });
  });

  on('GET', 'seller/dashboard', async (params, query) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const store = await myStore(session.userId);
    if (!store) return errRes('لا يوجد متجر بعد.', 404);
    const year = Number.isFinite(Number(query.year)) ? Number(query.year) : new Date().getFullYear();
    const { data, error } = await sb.rpc('seller_dashboard', { p_store: store.id, p_year: year });
    if (error) return errRes(error.message, 400);
    return okRes({ store, dashboard: data });
  });

  on('GET', 'seller/products', async (params, query) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const store = await myStore(session.userId);
    if (!store) return okRes([]);
    let q = sb.from('products')
      .select('*,product_colors(id,name,hex,stock,sort_order,product_images(public_url,sort_order))')
      .eq('store_id', store.id).order('added_at', { ascending: false }).limit(500);
    if (query.status) q = q.eq('status', query.status);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  /* طلبات متجر البائع فقط — عبر RPC واحد (seller_list_orders) يرجّع كل الحقول
     المطلوبة جاهزة (اسم المشتري، المنتجات وصورها، اللون، الكمية، السعر وقت
     الطلب، الخصم، الشحن، الإجمالي، طريقة وحالة الدفع، العنوان...). الـ RPC نفسه
     (SECURITY DEFINER) يتحقق إن هذا المتجر مملوك للبائع الحالي، فلا يقدر أي
     بائع يرى طلبات بائع آخر حتى لو غيّر رقم المتجر في الطلب. */
  on('GET', 'seller/orders', async (params, query) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const store = await myStore(session.userId);
    if (!store) return okRes([]);
    const { data, error } = await sb.rpc('seller_list_orders', { p_store: store.id, p_status: query.status || null });
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  /* صفحة تفاصيل طلب كاملة — طلب واحد بكل بياناته + Order Timeline حقيقي من
     order_status_history + الحالات التالية المسموح للبائع الانتقال إليها. */
  on('GET', 'seller/orders/:id', async (params) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const store = await myStore(session.userId);
    if (!store) return errRes('لا يوجد متجر بعد.', 404);
    const { data, error } = await sb.rpc('seller_get_order', { p_store: store.id, p_store_order: params.id });
    if (error) return errRes(error.message, 404);
    return okRes(data);
  });

  on('PATCH', 'seller/orders/:id/status', async (params, query, body) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const store = await myStore(session.userId);
    if (!store) return errRes('لا يوجد متجر بعد.', 404);
    const allowed = ['accepted', 'preparing', 'ready', 'cancelled'];
    if (!allowed.includes(body && body.status)) return errRes('لا يملك البائع صلاحية تعيين هذه الحالة.');
    const { data, error } = await sb.rpc('seller_set_order_status', { p_store: store.id, p_id: params.id, p_status: body.status });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  on('GET', 'seller/stats', async (params, query) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const { data, error } = await sb.rpc('seller_product_stats', { p_days: Number(query.days) || 90 });
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });
  on('GET', 'seller/data', async () => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const { data, error } = await sb.rpc('seller_data_get');
    if (error) return errRes(error.message, 400);
    return okRes(data || {});
  });
  on('PUT', 'seller/data/:key', async (params, query, body) => {
    const session = await requireSeller();
    if (!session) return errRes('هذه الصفحة مخصصة للبائعين.', 403);
    const { data, error } = await sb.rpc('seller_data_set', { p_key: params.key, p_value: (body && body.value) == null ? {} : body.value });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ===================== الإشعارات (مشترك بائع/مشترٍ) ===================== */
  on('GET', 'notifications/mine', async (params, query) => {
    const session = await currentSession();
    if (!session) return errRes('يجب تسجيل الدخول.', 401);
    let q = sb.from('notifications').select('*').eq('user_external_id', session.userId)
      .order('created_at', { ascending: false }).limit(Number(query.limit) || 30);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    const unread = (data || []).filter((n) => !n.read_at).length;
    return okRes({ items: data || [], unread });
  });

  on('PATCH', 'notifications/:id/read', async (params) => {
    const session = await currentSession();
    if (!session) return errRes('يجب تسجيل الدخول.', 401);
    const { error } = await sb.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('id', params.id).eq('user_external_id', session.userId);
    if (error) return errRes(error.message, 400);
    return okRes({ ok: true });
  });

  on('POST', 'notifications/read-all', async () => {
    const session = await currentSession();
    if (!session) return errRes('يجب تسجيل الدخول.', 401);
    const { error } = await sb.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('user_external_id', session.userId).is('read_at', null);
    if (error) return errRes(error.message, 400);
    return okRes({ ok: true });
  });

  /* ===================== RIDER ===================== */
  async function requireRider() {
    const session = await currentSession();
    if (!session || (session.role !== 'rider' && session.role !== 'admin')) return null;
    return session;
  }
  async function myRider(externalId) {
    const { data } = await sb.from('riders').select('*').eq('user_external_id', externalId).limit(1).maybeSingle();
    return data || null;
  }

  on('GET', 'rider/me', async () => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    return okRes({ rider: await myRider(session.userId) });
  });

  on('PATCH', 'rider/online', async (params, query, body) => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const rider = await myRider(session.userId);
    if (!rider) return errRes('لا يوجد حساب مندوب بعد.', 404);
    if (rider.status !== 'active') return errRes('حسابك قيد المراجعة، سيصلك إشعار عند التفعيل.', 403);
    const { data, error } = await sb.from('riders').update({ is_online: !!(body && body.online) }).eq('id', rider.id).select().maybeSingle();
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* تحديث موقع المندوب — يُقبل فقط لمندوب مفعّل وهو متصل (is_online = true) */
  on('PATCH', 'rider/location', async (params, query, body) => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const lat = body && body.latitude, lng = body && body.longitude, acc = body && body.accuracy;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return errRes('إحداثيات الموقع غير صحيحة.', 400);
    }
    const { data, error } = await sb.from('riders').update({
      latitude: lat,
      longitude: lng,
      location_accuracy: (typeof acc === 'number' && isFinite(acc) && acc >= 0) ? acc : null,
      location_updated_at: new Date().toISOString()
    }).eq('user_external_id', session.userId).eq('status', 'active').eq('is_online', true).select('id').maybeSingle();
    if (error) return errRes(error.message, 400);
    if (!data) return errRes('يجب أن تكون متصلاً لإرسال الموقع.', 409);
    return okRes({ ok: true });
  });

  on('GET', 'rider/dashboard', async () => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const rider = await myRider(session.userId);
    if (!rider) return errRes('لا يوجد حساب مندوب بعد.', 404);
    const { data, error } = await sb.rpc('rider_dashboard', { p_rider: rider.id });
    if (error) return errRes(error.message, 400);
    return okRes({ rider, dashboard: data });
  });

  on('GET', 'rider/deliveries/available', async () => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const rider = await myRider(session.userId);
    if (!rider || rider.status !== 'active') return okRes([]);
    const { data, error } = await sb.from('deliveries').select('*,stores(name,phone,address)').eq('status', 'unassigned').order('requested_at', { ascending: true }).limit(100);
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  /* الطلبات المتاحة + بيانات المتجر + قيمة الطلب + Radius الحالي (الفلترة بالمسافة تتم في rider.js بـ GPS السائق) */
  on('GET', 'rider/deliveries/nearby', async () => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const { data, error } = await sb.rpc('rider_nearby_deliveries');
    if (error) return errRes(error.message, 400);
    return okRes(data || { radius_m: 5000, deliveries: [] });
  });

  on('GET', 'rider/deliveries/mine', async (params, query) => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const rider = await myRider(session.userId);
    if (!rider) return okRes([]);
    let q = sb.from('deliveries').select('*,stores(name,phone,address)').eq('rider_id', rider.id).order('requested_at', { ascending: false }).limit(200);
    q = query.status ? q.eq('status', query.status) : q.in('status', ['assigned', 'picked_up', 'out_for_delivery']);
    const { data, error } = await q;
    if (error) return errRes(error.message, 400);
    return okRes(data || []);
  });

  on('POST', 'rider/deliveries/:id/:action', async (params, query, body) => {
    const session = await requireRider();
    if (!session) return errRes('هذه الصفحة مخصصة لمناديب التوصيل.', 403);
    const rider = await myRider(session.userId);
    if (!rider) return errRes('لا يوجد حساب مندوب بعد.', 404);
    const allowed = ['accept', 'release', 'pickup', 'out_for_delivery', 'deliver', 'fail'];
    if (!allowed.includes(params.action)) return errRes('إجراء غير معروف.');
    const { data, error } = await sb.rpc('rider_delivery_action', { p_rider: rider.id, p_delivery: params.id, p_action: params.action, p_note: (body && body.note) || null });
    if (error) return errRes(error.message, 400);
    return okRes(data);
  });

  /* ---------- اعتراض fetch('/api/...') ---------- */
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!url.startsWith('/api/')) return realFetch(input, init);

    const rest = url.slice('/api'.length);
    const [pathname, search] = rest.split('?');
    const query = {};
    if (search) new URLSearchParams(search).forEach((v, k) => { query[k] = v; });
    const method = ((init && init.method) || 'GET').toUpperCase();
    let body = null;
    if (init && init.body) {
      try { body = JSON.parse(init.body); } catch (_) { body = null; }
    }

    const match = matchRoute(method, pathname);
    if (!match) return errRes('مسار غير معروف: ' + method + ' ' + pathname, 404);

    try {
      return await match.handler(match.params, query, body);
    } catch (error) {
      console.error('[nasaq api-shim]', method, pathname, error);
      return errRes((error && error.message) || 'حدث خطأ غير متوقع.', 500);
    }
  };
})();
