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

  function getCart() {
    return JSON.parse(localStorage.getItem('ym_cart') || '[]');
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

    container.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__image">
          <img src="${item.imageUrl || 'images/products/placeholder.jpg'}" alt="${item.name}" loading="lazy"
               onerror="this.src='https://placehold.co/80x80/f0f2f5/5a6577?text=${encodeURIComponent((item.name || '').substring(0,8))}'">
        </div>
        <div class="cart-item__details">
          <h3 class="cart-item__name">${item.slug ? `<a href="products/${item.slug}.html">${item.name}</a>` : item.name}</h3>
          <div class="cart-item__unit">${item.unit || ''}</div>
          <div class="cart-item__price">${item.price ? formatPrice(item.price) : 'צרו קשר'}</div>
        </div>
        <div class="cart-item__quantity">
          <button class="cart-item__qty-btn" data-action="decrease" data-id="${item.id}">-</button>
          <span class="cart-item__qty-value">${item.quantity}</span>
          <button class="cart-item__qty-btn" data-action="increase" data-id="${item.id}">+</button>
        </div>
        <div class="cart-item__total">${item.price ? formatPrice(item.price * item.quantity) : ''}</div>
        <button class="cart-item__remove" data-id="${item.id}" aria-label="הסר מהעגלה"><i class="fas fa-trash-alt"></i></button>
      </div>
    `).join('');

    updateSummary(cart);
  }

  function updateSummary(cart) {
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const subtotalEl = document.getElementById('cartSubtotal');
    const countEl = document.getElementById('cartItemCount');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (countEl) countEl.textContent = itemCount;
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
