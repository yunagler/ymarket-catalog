/* ===========================================
   Y Market - Checkout Page
   Form validation, API order submission
   =========================================== */

(function() {
  'use strict';

  // For local dev, change to http://localhost:3000
  var API_BASE = 'http://localhost:3000';
  var MIN_ORDER = 200;

  document.addEventListener('DOMContentLoaded', function() {
    var cart = getCart();
    if (cart.length === 0) {
      window.location.href = 'cart.html';
      return;
    }
    renderSummary(cart);
    setupForm(cart);
    setupDateMin();
  });

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
    if (totalEl) totalEl.textContent = formatPrice(total);
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

      // Disable submit
      var btn = document.getElementById('submitOrderBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> שולחים הזמנה...';
      }

      var payload = {
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
        notes: notes || undefined
      };

      fetch(API_BASE + '/api/b2c/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) {
        return res.json().then(function(data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (!result.ok) {
          showError(result.data.error || 'שגיאה בשליחת ההזמנה. נסו שוב.');
          resetButton(btn);
          return;
        }

        // Success
        localStorage.setItem('ym_last_order', JSON.stringify({
          orderId: result.data.orderId,
          totalAmount: result.data.totalAmount,
          customerName: name,
          itemCount: cart.length
        }));
        localStorage.removeItem('ym_cart');
        if (window.YMarket) window.YMarket.updateCartBadge();

        window.location.href = 'order-success.html';
      })
      .catch(function() {
        showError('שגיאת רשת. בדקו את החיבור ונסו שוב.');
        resetButton(btn);
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
    btn.innerHTML = '<i class="fas fa-check-circle"></i> שלחו הזמנה';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

})();
