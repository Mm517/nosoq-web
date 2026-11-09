/* ==========================================================================
   js/cart.js — السلة (إضافة/حذف/كمية/مجاميع/كوبون) + قائمة الأمنيات
   الحفظ في localStorage. الأحداث: cart:change و wishlist:change على document
   ========================================================================== */
(function () {
  'use strict';

  const CFG = window.Store.config;
  const money = window.Store.money;

  const KEYS = { cart: 'nasaq_cart_v1', wish: 'nasaq_wish_v1', coupon: 'nasaq_coupon_v1' };
  const MAX_QTY = 10;

  /* أكواد الخصم — يُنصح بالتحقق منها في الخادم عند ربط المتجر بباك-إند */
  const COUPONS = {
    NASAQ10: { type: 'percent', value: 10, label: 'خصم 10%' },
    WELCOME50: { type: 'fixed', value: 50, min: 300, label: 'خصم 50 ' + CFG.currency + ' على الطلبات فوق 300' },
    FREESHIP: { type: 'shipping', label: 'شحن مجاني' }
  };

  /* ---------- تخزين آمن ---------- */
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* التخزين غير متاح */ } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { /* تجاهل */ } }
  };
  const round2 = (n) => Math.round(n * 100) / 100;
  const maxQty = (p) => Math.max(0, Math.min(MAX_QTY, p.stock));
  const makeKey = (id, size, color) => [id, size || '-', color || '-'].join('|');
  const fire = (name) => document.dispatchEvent(new CustomEvent(name));

  /* ---------- الحالة ---------- */
  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    list.forEach((it) => {
      const p = it && Products.byId(it.id);
      if (!p || Products.isSoldOut(p)) return;
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), maxQty(p));
      out.push({ key: makeKey(p.id, it.size, it.color), id: p.id, size: it.size || null, color: it.color || null, qty });
    });
    return out;
  }

  let items = sanitize(store.get(KEYS.cart, []));
  let wish = (function () {
    const raw = store.get(KEYS.wish, []);
    return (Array.isArray(raw) ? raw : []).map(Number).filter((id) => Products.byId(id));
  })();

  function commit() {
    store.set(KEYS.cart, items);
    fire('cart:change');
  }

  /* ---------- الكوبون ---------- */
  function couponState(subtotal) {
    const code = store.get(KEYS.coupon, null);
    const def = code && COUPONS[code];
    if (!def) return null;
    if (def.min && subtotal < def.min) {
      return { code, def, valid: false, discount: 0, freeShipping: false, reason: 'يتطلب الكوبون طلباً بقيمة ' + money(def.min) + ' على الأقل' };
    }
    let discount = 0;
    if (def.type === 'percent') discount = round2((subtotal * def.value) / 100);
    if (def.type === 'fixed') discount = Math.min(def.value, subtotal);
    return { code, def, valid: true, discount, freeShipping: def.type === 'shipping', reason: '' };
  }

  /* ---------- واجهة السلة ---------- */
  const Cart = {
    MAX_QTY,
    coupons: COUPONS,
    maxQty,

    add(id, opts) {
      const o = opts || {};
      const p = Products.byId(id);
      if (!p) return { ok: false, message: 'المنتج غير موجود' };
      if (Products.isSoldOut(p)) return { ok: false, message: 'نفدت كمية هذا المنتج' };
      if (p.sizes.length && !o.size) return { ok: false, message: 'يرجى اختيار المقاس أولاً' };
      if (o.size && Products.sizeSoldOut(p, o.size)) return { ok: false, message: 'هذا المقاس غير متوفر حالياً' };

      const size = p.sizes.length ? o.size : null;
      const color = o.color || (p.colors[0] && p.colors[0].name) || null;
      const qty = Math.max(1, parseInt(o.qty, 10) || 1);
      const key = makeKey(p.id, size, color);
      const limit = maxQty(p);

      let it = items.find((x) => x.key === key);
      if (it) {
        if (it.qty >= limit) return { ok: false, message: 'وصلت إلى أقصى كمية متاحة من هذا المنتج (' + limit + ')' };
        it.qty = Math.min(limit, it.qty + qty);
      } else {
        it = { key, id: p.id, size, color, qty: Math.min(limit, qty) };
        items.push(it);
      }
      commit();
      if (window.Market) window.Market.track.cart(p, qty);
      return { ok: true, item: it, product: p };
    },

    remove(key) {
      items = items.filter((x) => x.key !== key);
      commit();
    },

    setQty(key, qty) {
      const it = items.find((x) => x.key === key);
      if (!it) return { ok: false, message: 'المنتج غير موجود في السلة' };
      const p = Products.byId(it.id);
      const limit = maxQty(p);
      qty = parseInt(qty, 10);
      if (!qty || qty < 1) { Cart.remove(key); return { ok: true }; }
      if (qty > limit) {
        it.qty = limit;
        commit();
        return { ok: false, message: 'الكمية المتاحة من هذا المنتج ' + limit + ' فقط' };
      }
      it.qty = qty;
      commit();
      return { ok: true };
    },

    clear() {
      items = [];
      store.del(KEYS.coupon);
      commit();
    },

    /* بنود السلة مع بيانات المنتج والأسعار الحالية */
    lines() {
      return items.map((it) => {
        const p = Products.byId(it.id);
        return Object.assign({}, it, { product: p, unitPrice: p.price, lineTotal: round2(p.price * it.qty) });
      });
    },

    count() { return items.reduce((n, x) => n + x.qty, 0); },

    /* opts.method: 'standard' | 'express' */
    totals(opts) {
      const o = opts || {};
      const ls = Cart.lines();
      const subtotal = round2(ls.reduce((s, l) => s + l.lineTotal, 0));
      const listTotal = round2(ls.reduce((s, l) => s + (l.product.oldPrice || l.product.price) * l.qty, 0));
      const coupon = couponState(subtotal);
      const discount = coupon && coupon.valid ? coupon.discount : 0;
      const method = o.method === 'express' ? 'express' : 'standard';

      let shipping = 0;
      if (subtotal > 0) {
        shipping = method === 'express' ? CFG.shipping.express : (subtotal >= CFG.freeShippingFrom ? 0 : CFG.shipping.standard);
        if (coupon && coupon.valid && coupon.freeShipping) shipping = 0;
      }

      return {
        count: Cart.count(),
        subtotal,
        savings: round2(listTotal - subtotal),          // إجمالي التوفير من أسعار العروض
        coupon,
        discount,
        shipping,
        method,
        total: round2(Math.max(0, subtotal - discount) + shipping),
        freeShippingRemaining: Math.max(0, round2(CFG.freeShippingFrom - subtotal)),
        freeShippingProgress: Math.min(100, Math.round((subtotal / CFG.freeShippingFrom) * 100))
      };
    },

    applyCoupon(input) {
      const code = String(input || '').trim().toUpperCase();
      if (!code) return { ok: false, message: 'أدخل كود الخصم أولاً' };
      const def = COUPONS[code];
      if (!def) return { ok: false, message: 'كود الخصم غير صحيح أو منتهي' };
      const subtotal = Cart.totals().subtotal;
      if (subtotal === 0) return { ok: false, message: 'أضف منتجات إلى السلة قبل تطبيق الكوبون' };
      if (def.min && subtotal < def.min) {
        return { ok: false, message: 'يتطلب الكوبون طلباً بقيمة ' + money(def.min) + ' على الأقل' };
      }
      store.set(KEYS.coupon, code);
      fire('cart:change');
      return { ok: true, message: 'تم تطبيق الكوبون: ' + def.label };
    },

    removeCoupon() {
      store.del(KEYS.coupon);
      fire('cart:change');
    },

    subscribe(fn) { document.addEventListener('cart:change', fn); }
  };

  /* ---------- قائمة الأمنيات ---------- */
  const Wishlist = {
    ids: () => wish.slice(),
    has: (id) => wish.includes(Number(id)),
    count: () => wish.length,
    toggle(id) {
      id = Number(id);
      const i = wish.indexOf(id);
      if (i > -1) wish.splice(i, 1); else wish.push(id);
      store.set(KEYS.wish, wish);
      fire('wishlist:change');
      return i === -1;   // true = أُضيف
    },
    subscribe(fn) { document.addEventListener('wishlist:change', fn); }
  };

  /* مزامنة بين التبويبات */
  window.addEventListener('storage', (e) => {
    if (e.key === KEYS.cart) { items = sanitize(store.get(KEYS.cart, [])); fire('cart:change'); }
    if (e.key === KEYS.coupon) fire('cart:change');
    if (e.key === KEYS.wish) {
      const raw = store.get(KEYS.wish, []);
      wish = (Array.isArray(raw) ? raw : []).map(Number).filter((id) => Products.byId(id));
      fire('wishlist:change');
    }
  });

  window.Cart = Cart;
  window.Wishlist = Wishlist;
})();
