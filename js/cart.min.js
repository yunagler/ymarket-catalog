/* ===========================================
   Y Market - Cart Page
   Shopping cart management
   =========================================== */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    setupCartEvents();
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('ym_cart') || '[]');
    } catch (e) {
      localStorage.removeItem('ym_cart');
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('ym_cart', JSON.stringify(cart));
    window.YMarket?.updateCartBadge();
  }

  function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyState = document.getElementById('cartEmpty');
    const summaryEl = document.getElementById('cartSummary');
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
      container.style.display = 'none';
      if (summaryEl) summaryEl.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.style.display = 'block';
    if (summaryEl) summaryEl.style.display = 'block';

    // Build cart items using DOM API to prevent XSS
    container.innerHTML = '';
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.dataset.id = item.id;

      var safeName = escapeHtml(item.name);
      var safeUnit = escapeHtml(item.unit || '');
      var fallbackUrl = 'https://placehold.co/80x80/f0f2f5/5a6577?text=' + encodeURIComponent((item.name || '').substring(0, 8));

      row.innerHTML =
        '<div class="cart-item__image">' +
          '<img src="' + escapeHtml(item.imageUrl || 'images/products/placeholder.jpg') + '" alt="' + safeName + '" loading="lazy">' +
        '</div>' +
        '<div class="cart-item__details">' +
          '<h3 class="cart-item__name">' + (item.slug ? '<a href="products/' + encodeURIComponent(item.slug) + '">' + safeName + '</a>' : safeName) + '</h3>' +
          '<div class="cart-item__unit">' + safeUnit + '</div>' +
          '<div class="cart-item__price">' + (item.price ? formatPrice(item.price) : 'צרו קשר') + '</div>' +
        '</div>' +
        '<div class="cart-item__quantity">' +
          '<button class="cart-item__qty-btn" data-action="decrease" data-id="' + item.id + '">-</button>' +
          '<span class="cart-item__qty-value">' + item.quantity + '</span>' +
          '<button class="cart-item__qty-btn" data-action="increase" data-id="' + item.id + '">+</button>' +
        '</div>' +
        '<div class="cart-item__total">' + (item.price ? formatPrice(item.price * item.quantity) : '') + '</div>' +
        '<button class="cart-item__remove" data-id="' + item.id + '" aria-label="הסר מהעגלה"><i class="fas fa-trash-alt"></i></button>';

      // Set image fallback via JS instead of inline onerror
      var img = row.querySelector('img');
      if (img) {
        img.addEventListener('error', function() {
          this.src = fallbackUrl;
        }, { once: true });
      }

      container.appendChild(row);
    });

    updateSummary(cart);
  }

  // Catalogue prices are net (B2B convention). The Merchant feed and the product
  // schema publish the GROSS figure, and Google requires the feed price to match
  // what checkout charges — so the cart has to show the gross total too, not just
  // net line items labelled (wrongly) as VAT-inclusive.
  const VAT_RATE = 0.18;

  // Enforced server-side in /api/b2c/orders (B2C_MIN_ORDER). Surfacing it here
  // stops a shopper filling the whole checkout form only to be refused at submit.
  const MIN_ORDER_NET = 200;

  function updateSummary(cart) {
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const vat = Math.round(subtotal * VAT_RATE * 100) / 100;

    const subtotalEl = document.getElementById('cartSubtotal');
    const vatEl = document.getElementById('cartVat');
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartItemCount');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (vatEl) vatEl.textContent = formatPrice(vat);
    // Round the sum, not just the parts — 72 + 12.96 lands on 84.96000000000001
    // in binary floating point and only the formatter was hiding it.
    if (totalEl) totalEl.textContent = formatPrice(Math.round((subtotal + vat) * 100) / 100);
    if (countEl) countEl.textContent = itemCount;

    const notice = document.getElementById('cartMinNotice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const short = MIN_ORDER_NET - subtotal;
    if (notice) {
      if (subtotal > 0 && short > 0) {
        notice.textContent = 'מינימום הזמנה ' + formatPrice(MIN_ORDER_NET) + ' לפני מע"מ — חסרים ' + formatPrice(short);
        notice.style.display = '';
      } else {
        notice.style.display = 'none';
      }
    }
    // Leave the button usable — WhatsApp ordering has no minimum, and blocking it
    // outright would strand a shopper who arrived from a search result.
    if (checkoutBtn) checkoutBtn.setAttribute('aria-describedby', short > 0 ? 'cartMinNotice' : '');

    renderFreeShippingBar(subtotal);
    loadUpsell(cart);
  }

  // ---- Free-shipping progress ----
  // The threshold lives in crm-app/src/lib/shipping-policy.ts (FREE_SHIPPING_ABOVE_NET)
  // and is read from the shipping-quote API; 2000 is only the offline fallback.
  const API_BASE = 'https://app.ymarket.co.il';
  let freeAboveNet = 2000;
  fetch(API_BASE + '/api/b2c/shipping-quote?itemsNet=0')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(q) {
      if (q && q.freeAboveNet > 0) { freeAboveNet = q.freeAboveNet; renderFreeShippingBar(currentSubtotal()); }
    })
    .catch(function() {});

  function currentSubtotal() {
    return getCart().reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  }

  function renderFreeShippingBar(subtotal) {
    const anchor = document.getElementById('cartMinNotice');
    if (!anchor) return;
    let bar = document.getElementById('cartFreeShip');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'cartFreeShip';
      bar.style.cssText = 'margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);border-radius:8px;background:#EEF3F8;color:#1B3A5C;font-size:var(--fs-sm)';
      bar.innerHTML = '<div id="cartFreeShipText"></div>' +
        '<div style="height:6px;border-radius:3px;background:#D6E0EA;margin-top:6px;overflow:hidden">' +
        '<div id="cartFreeShipFill" style="height:100%;width:0;background:#C9A227;transition:width .3s"></div></div>';
      anchor.parentNode.insertBefore(bar, anchor.nextSibling);
    }
    if (subtotal <= 0) { bar.style.display = 'none'; return; }
    bar.style.display = '';
    const missing = freeAboveNet - subtotal;
    document.getElementById('cartFreeShipText').textContent = missing > 0
      ? 'עוד ' + formatPrice(Math.ceil(missing)) + ' לפני מע"מ — והמשלוח עלינו'
      : 'המשלוח עלינו ✓';
    document.getElementById('cartFreeShipFill').style.width = Math.min(100, subtotal / freeAboveNet * 100) + '%';
  }

  // ---- Upsell: "businesses like you also add" (/api/b2c/recommendations) ----
  let upsellKey = '';
  function loadUpsell(cart) {
    const key = cart.map(i => i.id).sort((a, b) => a - b).join(',');
    if (!key || key === upsellKey) return;
    upsellKey = key;
    fetch(API_BASE + '/api/b2c/recommendations?ids=' + key)
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { renderUpsell((d && d.recommendations) || []); })
      .catch(function() {});
  }

  function renderUpsell(recs) {
    const items = document.getElementById('cartItems');
    if (!items) return;
    let box = document.getElementById('cartUpsell');
    const inCart = new Set(getCart().map(i => i.id));
    recs = recs.filter(r => !inCart.has(r.id));
    if (!recs.length) { if (box) box.style.display = 'none'; return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'cartUpsell';
      box.style.cssText = 'margin-top:var(--space-lg);padding:var(--space-md);border:1px solid var(--color-border);border-radius:12px';
      items.parentNode.insertBefore(box, items.nextSibling);
      box.addEventListener('click', onUpsellClick);
    }
    box.style.display = '';
    box._recs = recs;
    box.innerHTML = '<h3 style="margin:0 0 var(--space-sm);font-size:var(--fs-md);color:#1B3A5C">עסקים כמוך מוסיפים גם</h3>' +
      recs.map(function(r) {
        return '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--color-border)">' +
          '<img src="' + escapeHtml(r.imageUrl) + '" alt="' + escapeHtml(r.name) + '" width="56" height="56" loading="lazy" style="object-fit:contain;border-radius:8px;background:#fff">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:600">' + escapeHtml(r.name) + '</div>' +
          '<div style="color:var(--color-text-secondary);font-size:var(--fs-sm)">' + formatPrice(r.price) + (r.unit ? ' · ' + escapeHtml(r.unit) : '') + ' לפני מע"מ</div></div>' +
          '<button type="button" class="btn btn--outline btn--sm" data-upsell="' + r.id + '">הוספה</button></div>';
      }).join('');
  }

  function onUpsellClick(e) {
    const btn = e.target.closest('[data-upsell]');
    if (!btn) return;
    const box = document.getElementById('cartUpsell');
    const rec = (box._recs || []).find(r => r.id === parseInt(btn.dataset.upsell, 10));
    if (!rec) return;
    const cart = getCart();
    const existing = cart.find(i => i.id === rec.id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: rec.id, name: rec.name, price: rec.price, unit: rec.unit || '', imageUrl: rec.imageUrl, slug: rec.slug, quantity: 1 });
    saveCart(cart);
    const A = window.YMarketAnalytics;
    try { A && A.trackAddToCart && A.trackAddToCart(Object.assign({ quantity: 1 }, rec)); } catch (err) {}
    try { A && A.fbAddToCart && A.fbAddToCart(Object.assign({ quantity: 1 }, rec)); } catch (err) {}
    renderCart();
    window.YMarket?.showToast('נוסף לעגלה');
  }

  function setupCartEvents() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      const removeBtn = e.target.closest('.cart-item__remove');

      if (btn) {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;

        if (action === 'increase') {
          item.quantity += 1;
        } else if (action === 'decrease') {
          item.quantity -= 1;
          if (item.quantity <= 0) {
            const idx = cart.indexOf(item);
            cart.splice(idx, 1);
          }
        }

        saveCart(cart);
        renderCart();
      }

      if (removeBtn) {
        const id = parseInt(removeBtn.dataset.id);
        const cart = getCart().filter(i => i.id !== id);
        saveCart(cart);
        renderCart();
        window.YMarket?.showToast('המוצר הוסר מהעגלה');
      }
    });

    // Clear cart
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
      if (confirm('למחוק את כל המוצרים מהעגלה?')) {
        saveCart([]);
        renderCart();
        window.YMarket?.showToast('העגלה נוקתה');
      }
    });

    // WhatsApp order
    document.getElementById('whatsappOrderBtn')?.addEventListener('click', () => {
      const cart = getCart();
      if (cart.length === 0) return;

      const lines = ['שלום, אשמח להזמין:', ''];
      cart.forEach(item => {
        lines.push(`- ${item.name} x${item.quantity}${item.price ? ` (${formatPrice(item.price * item.quantity)})` : ''}`);
      });

      const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
      if (subtotal > 0) {
        lines.push('', `סה"כ: ${formatPrice(subtotal)}`);
      }

      const text = encodeURIComponent(lines.join('\n'));
      window.open(`https://wa.me/972549922492?text=${text}`, '_blank');
    });
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency', currency: 'ILS',
      minimumFractionDigits: 0, maximumFractionDigits: 2
    }).format(price);
  }

})();
