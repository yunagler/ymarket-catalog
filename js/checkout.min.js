/* ===========================================
   Y Market - Checkout Page
   Form validation, API order submission
   =========================================== */

(function() {
  'use strict';

  var API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://app.ymarket.co.il';
  // Read config from CRM sync (injected by apply-config), fallback to defaults
  var CONFIG = window.YM_CHECKOUT_CONFIG || {};
  var MIN_ORDER = CONFIG.minOrderAmount || 200;
  var DELIVERY_ZONES = CONFIG.deliveryZones || [];
  var WHATSAPP_NUMBER = '972549922492';

  document.addEventListener('DOMContentLoaded', function() {
    var cart = getCart();
    if (cart.length === 0) {
      window.location.href = 'cart';
      return;
    }
    renderSummary(cart);
    setupForm(cart);
    setupDateMin();
    setupDeliveryZones();
    setupPaymentMethod();
  });

  /** Which of the two checkout paths the buyer picked: 'order' (as always) or 'card'. */
  function getPaymentMethod() {
    var checked = document.querySelector('input[name="paymentMethod"]:checked');
    return checked ? checked.value : 'order';
  }

  /* The button and the PCI note follow the choice, so it is always obvious whether
     this click sends an order or opens step 2/2 (the secure payment page). */
  function setupPaymentMethod() {
    var radios = document.querySelectorAll('input[name="paymentMethod"]');
    if (!radios.length) return;

    function sync() {
      var card = getPaymentMethod() === 'card';
      var btn = document.getElementById('submitOrderBtn');
      if (btn && !btn.disabled) {
        btn.innerHTML = card
          ? '<i class="fas fa-lock"></i> המשיכו לתשלום מאובטח'
          : '<i class="fas fa-check-circle"></i> שלחו הזמנה';
      }
      var note = document.getElementById('pmSecureNote');
      if (note) note.style.display = card ? '' : 'none';
      var saveRow = document.getElementById('pmSaveCardRow');
      if (saveRow) saveRow.style.display = card ? '' : 'none';
    }

    for (var i = 0; i < radios.length; i++) radios[i].addEventListener('change', sync);
    sync();
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('ym_cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency', currency: 'ILS',
      minimumFractionDigits: 0, maximumFractionDigits: 2
    }).format(price);
  }

  function renderSummary(cart) {
    var container = document.getElementById('checkoutItems');
    var totalEl = document.getElementById('checkoutTotal');
    var countEl = document.getElementById('checkoutCount');
    if (!container) return;

    var total = 0;
    var itemCount = 0;
    var html = '';

    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var lineTotal = (item.price || 0) * item.quantity;
      total += lineTotal;
      itemCount += item.quantity;

      html += '<div class="checkout-summary__item">' +
        '<div class="checkout-summary__item-info">' +
          '<div class="checkout-summary__item-name">' + escapeHtml(item.name) + '</div>' +
          '<div class="checkout-summary__item-qty">' + item.quantity + ' x ' + (item.price ? formatPrice(item.price) : '-') + '</div>' +
        '</div>' +
        '<div class="checkout-summary__item-price">' + (lineTotal ? formatPrice(lineTotal) : '-') + '</div>' +
      '</div>';
    }

    container.innerHTML = html;

    // Line items are net (B2B convention). The Merchant feed publishes the GROSS
    // price and Google matches it against what checkout charges, so the total here
    // has to be the gross one — and the old "prices include VAT" note was simply
    // untrue. Rounding the sum, not only the parts, keeps 72 + 12.96 off 84.96000…1
    var VAT_RATE = 0.18;
    var MIN_ORDER_NET = 200;   // mirrors B2C_MIN_ORDER in /api/b2c/orders
    var vat = Math.round(total * VAT_RATE * 100) / 100;
    var gross = Math.round((total + vat) * 100) / 100;

    var subtotalEl = document.getElementById('checkoutSubtotal');
    var vatEl = document.getElementById('checkoutVat');
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (vatEl) vatEl.textContent = formatPrice(vat);
    if (totalEl) totalEl.textContent = formatPrice(gross);

    // Funnel step "reached checkout" was never emitted, so the drop between
    // add_to_cart and a placed order could not be located. Fires once per page
    // render, only with a non-empty cart.
    if (!window.__ymBeginCheckoutSent && itemCount > 0 && window.YMarketAnalyst) {
      window.__ymBeginCheckoutSent = true;
      try { window.YMarketAnalyst.beginCheckout(gross, itemCount); } catch (e) {}
    }

    // The server rejects under-minimum orders at submit; say so before the form is
    // filled rather than after.
    var notice = document.getElementById('checkoutMinNotice');
    if (notice) {
      var short = MIN_ORDER_NET - total;
      if (total > 0 && short > 0) {
        notice.textContent = 'מינימום הזמנה ' + formatPrice(MIN_ORDER_NET) + ' לפני מע"מ — חסרים ' + formatPrice(short);
        notice.style.display = '';
      } else {
        notice.style.display = 'none';
      }
    }
    if (countEl) countEl.textContent = itemCount + ' פריטים';
  }

  function setupDateMin() {
    var dateInput = document.getElementById('co-date');
    if (!dateInput) return;
    var d = new Date();
    d.setDate(d.getDate() + 2);
    // Skip Friday(5) and Saturday(6)
    while (d.getDay() === 5 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    dateInput.min = d.toISOString().split('T')[0];
  }

  function setupForm(cart) {
    var form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      clearErrors();

      var name = getValue('co-name');
      var phone = getValue('co-phone');
      var email = getValue('co-email');
      var businessName = getValue('co-business');
      var address = getValue('co-address');
      var city = getValue('co-city');
      var deliveryDate = getValue('co-date');
      var notes = getValue('co-notes');

      // Validate
      if (!validate(name, phone, address, city, cart)) return;

      var paymentMethod = getPaymentMethod();

      // Disable submit
      var btn = document.getElementById('submitOrderBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = paymentMethod === 'card'
          ? '<span class="spinner"></span> מעבירים לתשלום מאובטח...'
          : '<span class="spinner"></span> שולחים הזמנה...';
      }

      var saveCardEl = document.getElementById('pm-savecard');

      var payload = {
        paymentMethod: paymentMethod,
        saveCard: paymentMethod === 'card' && !!(saveCardEl && saveCardEl.checked),
        customer: {
          name: name,
          phone: phone,
          email: email || undefined,
          businessName: businessName || undefined,
          address: address,
          city: city
        },
        items: cart.map(function(item) {
          return { id: item.id, quantity: item.quantity, price: item.price || 0 };
        }),
        deliveryDate: deliveryDate || undefined,
        notes: [notes, window._ymDeliveryZone ? 'אזור: ' + window._ymDeliveryZone : '', window._ymDeliveryCost ? 'משלוח: ' + window._ymDeliveryCost + '₪' : ''].filter(Boolean).join(' | ') || undefined
      };

      var headers = { 'Content-Type': 'application/json' };
      var csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta) headers['X-CSRF-Token'] = csrfMeta.content;

      // Try API first, fallback to WhatsApp if unavailable
      fetch(API_BASE + '/api/b2c/orders', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
      .then(function(res) {
        return res.json().then(function(data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (!result.ok) {
          // A card buyer must never be silently diverted to WhatsApp: they expect to
          // pay now, the popup is usually blocked (looks like "nothing happened"),
          // and the cart would be cleared without a payment ever being taken.
          // Show why, keep the cart, let them retry.
          if (paymentMethod === 'card') {
            failCard(btn, (result.data && result.data.error) || 'לא הצלחנו לפתוח את עמוד התשלום. נסו שוב בעוד רגע.');
            return;
          }
          // API returned error - fallback to WhatsApp
          sendOrderViaWhatsApp(name, phone, email, businessName, address, city, deliveryDate, notes, cart, paymentMethod);
          return;
        }

        // Success via API
        sessionStorage.setItem('ym_last_order', JSON.stringify({
          orderId: result.data.orderId,
          totalAmount: result.data.totalAmount,
          customerName: name,
          itemCount: cart.length
        }));
        localStorage.removeItem('ym_cart');
        if (window.YMarket) window.YMarket.updateCartBadge();

        // First-party attribution: tie this order back to its session/source
        if (window.YMarketAnalyst) {
          try { window.YMarketAnalyst.orderPlaced(result.data.orderId, result.data.totalAmount); } catch (e) {}
        }

        // Step 2/2 — the secure payment page. The card is entered there, never here.
        // If the link could not be minted we still have a valid order, so fall through
        // to the normal confirmation rather than leaving the buyer on a dead end.
        if (paymentMethod === 'card' && result.data.payUrl) {
          window.location.href = result.data.payUrl;
          return;
        }

        window.location.href = 'order-success';
      })
      .catch(function() {
        if (paymentMethod === 'card') {
          failCard(btn, 'אין כרגע חיבור לשרת התשלומים. נסו שוב בעוד רגע.');
          return;
        }
        // Network error (no backend) - send via WhatsApp
        sendOrderViaWhatsApp(name, phone, email, businessName, address, city, deliveryDate, notes, cart, paymentMethod);
      });
    });
  }

  function validate(name, phone, address, city, cart) {
    var valid = true;

    if (!name) {
      showFieldError('co-name', 'נא להזין שם מלא');
      valid = false;
    }

    var cleanPhone = phone.replace(/[-\s]/g, '');
    if (!cleanPhone || !/^0[0-9]{8,9}$/.test(cleanPhone)) {
      showFieldError('co-phone', 'נא להזין מספר טלפון תקין (למשל 050-1234567)');
      valid = false;
    }

    var emailVal = getValue('co-email');
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showFieldError('co-email', 'נא להזין כתובת אימייל תקינה');
      valid = false;
    }

    if (!address) {
      showFieldError('co-address', 'נא להזין כתובת למשלוח');
      valid = false;
    }

    if (!city) {
      showFieldError('co-city', 'נא להזין עיר');
      valid = false;
    }

    var total = cart.reduce(function(sum, item) {
      return sum + ((item.price || 0) * item.quantity);
    }, 0);
    if (total < MIN_ORDER) {
      showError('סכום הזמנה מינימלי: ' + formatPrice(MIN_ORDER));
      valid = false;
    }

    return valid;
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function showError(msg) {
    var el = document.getElementById('checkoutError');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showFieldError(inputId, msg) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.style.borderColor = 'var(--color-danger)';
    var err = document.createElement('div');
    err.className = 'form-error';
    err.textContent = msg;
    input.parentNode.appendChild(err);
  }

  function clearErrors() {
    document.getElementById('checkoutError').style.display = 'none';
    var errors = document.querySelectorAll('.form-error');
    for (var i = 0; i < errors.length; i++) errors[i].remove();
    var inputs = document.querySelectorAll('.form-input, .form-textarea');
    for (var j = 0; j < inputs.length; j++) inputs[j].style.borderColor = '';
  }

  function resetButton(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = getPaymentMethod() === 'card'
      ? '<i class="fas fa-lock"></i> המשיכו לתשלום מאובטח'
      : '<i class="fas fa-check-circle"></i> שלחו הזמנה';
  }

  /** Card path failed: say why, restore the button, and leave the cart intact. */
  function failCard(btn, msg) {
    showError(msg);
    resetButton(btn);
  }

  function sendOrderViaWhatsApp(name, phone, email, businessName, address, city, deliveryDate, notes, cart, paymentMethod) {
    var lines = ['הזמנה חדשה מהאתר:', ''];
    if (paymentMethod === 'card') lines.push('** הלקוח ביקש לשלם באשראי — יש לשלוח לינק תשלום **', '');
    lines.push('שם: ' + name);
    lines.push('טלפון: ' + phone);
    if (email) lines.push('מייל: ' + email);
    if (businessName) lines.push('עסק: ' + businessName);
    lines.push('כתובת: ' + address + ', ' + city);
    if (deliveryDate) lines.push('תאריך משלוח: ' + deliveryDate);
    if (notes) lines.push('הערות: ' + notes);
    lines.push('');
    lines.push('פריטים:');

    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var lineTotal = (item.price || 0) * item.quantity;
      total += lineTotal;
      lines.push('- ' + item.name + ' x' + item.quantity + (item.price ? ' (' + formatPrice(lineTotal) + ')' : ''));
    }

    if (total > 0) {
      lines.push('');
      lines.push('סה"כ: ' + formatPrice(total));
    }

    var text = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text, '_blank');

    // Save order locally and redirect to success
    sessionStorage.setItem('ym_last_order', JSON.stringify({
      orderId: 'WA-' + Date.now(),
      totalAmount: total,
      customerName: name,
      itemCount: cart.length
    }));
    localStorage.removeItem('ym_cart');
    if (window.YMarket) window.YMarket.updateCartBadge();

    // The WhatsApp fallback runs whenever the order API errors — and until now it
    // recorded nothing at all, so a campaign click that ended in a real order this
    // way was invisible on both sides. No numeric orderId exists here (the order
    // lives only in the WhatsApp thread), so the method is carried in meta.
    if (window.YMarketAnalyst) {
      try { window.YMarketAnalyst.track('order_placed', { value: total, meta: { method: 'whatsapp_fallback' } }); } catch (e) {}
    }

    window.location.href = 'order-success';
  }

  function setupDeliveryZones() {
    if (!DELIVERY_ZONES.length) return;

    var cityInput = document.getElementById('co-city');
    if (!cityInput) return;

    // Create delivery cost display
    var deliveryRow = document.createElement('div');
    deliveryRow.id = 'deliveryCostRow';
    deliveryRow.className = 'checkout-summary__item';
    deliveryRow.style.display = 'none';
    deliveryRow.style.borderTop = '1px solid #e5e7eb';
    deliveryRow.style.paddingTop = '8px';
    deliveryRow.style.marginTop = '8px';
    deliveryRow.innerHTML = '<div class="checkout-summary__item-info"><div class="checkout-summary__item-name">משלוח</div>' +
      '<div class="checkout-summary__item-qty" id="deliveryZoneName" style="font-size:0.75rem;color:#64748B"></div></div>' +
      '<div class="checkout-summary__item-price" id="deliveryCost"></div>';

    var totalEl = document.getElementById('checkoutTotal');
    if (totalEl && totalEl.parentNode) {
      totalEl.parentNode.insertBefore(deliveryRow, totalEl);
    }

    function updateDelivery() {
      var city = (cityInput.value || '').trim();
      if (!city) { deliveryRow.style.display = 'none'; return; }

      var zone = null;
      for (var i = 0; i < DELIVERY_ZONES.length; i++) {
        var z = DELIVERY_ZONES[i];
        for (var j = 0; j < z.cities.length; j++) {
          if (city.indexOf(z.cities[j]) !== -1 || z.cities[j].indexOf(city) !== -1) {
            zone = z; break;
          }
        }
        if (zone) break;
      }

      var cart = getCart();
      var subtotal = cart.reduce(function(s, item) { return s + ((item.price || 0) * item.quantity); }, 0);

      var deliveryCost = 0;
      var zoneName = '';
      if (zone) {
        deliveryCost = (zone.freeAbove && subtotal >= zone.freeAbove) ? 0 : zone.price;
        zoneName = zone.name + (deliveryCost === 0 && zone.price > 0 ? ' (חינם!)' : '');
      } else {
        zoneName = 'אזור לא מזוהה — ייתכן חיוב נוסף';
      }

      document.getElementById('deliveryZoneName').textContent = zoneName;
      document.getElementById('deliveryCost').textContent = deliveryCost > 0 ? formatPrice(deliveryCost) : 'חינם';
      document.getElementById('deliveryCost').style.color = deliveryCost > 0 ? '' : '#22C55E';
      deliveryRow.style.display = '';

      // Update total with delivery
      if (totalEl) totalEl.textContent = formatPrice(subtotal + deliveryCost);

      // Store delivery cost for order submission
      window._ymDeliveryCost = deliveryCost;
      window._ymDeliveryZone = zone ? zone.name : '';
    }

    cityInput.addEventListener('input', updateDelivery);
    cityInput.addEventListener('change', updateDelivery);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

})();
