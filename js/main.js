/* ===========================================
   Y Market - Main JavaScript
   Navigation, Scroll, WhatsApp, Cookies
   =========================================== */

document.addEventListener('DOMContentLoaded', () => {
  initActiveNav();
  initMobileNav();
  initStickyHeader();
  initScrollAnimations();
  animateCounters();
  initCookieConsent();
  initAccordions();
  initSearchOverlay();
  initContactForm();
  initImageFallback();
  initCartButton();
  updateCartBadge();
});

/* ---- Active Navigation Link ---- */
function initActiveNav() {
  const path = window.location.pathname;
  // Remove any hardcoded active class
  document.querySelectorAll('.main-nav__link.active').forEach(el => el.classList.remove('active'));

  // Determine which nav item is active
  let activeNav = null;
  if (path === '/' || path === '/index' || path === '/index.html') {
    activeNav = 'home';
  } else if (path.startsWith('/catalog') || path.startsWith('/category/') || path.startsWith('/products/')) {
    activeNav = 'catalog';
  } else if (path.startsWith('/about')) {
    activeNav = 'about';
  } else if (path.startsWith('/blog')) {
    activeNav = 'blog';
  } else if (path.startsWith('/contact')) {
    activeNav = 'contact';
  }

  if (activeNav) {
    const link = document.querySelector('[data-nav="' + activeNav + '"]');
    if (link) link.classList.add('active');
  }
}

/* ---- Mobile Navigation ---- */
function initMobileNav() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.main-nav');
  const overlay = document.querySelector('.mobile-overlay');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    btn.setAttribute('aria-expanded', String(isOpen));
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
  });

  if (overlay) {
    overlay.addEventListener('click', closeMobileNav);
  }

  // Mobile mega-menu toggle + keyboard support
  document.querySelectorAll('.main-nav__item').forEach(item => {
    const link = item.querySelector('.main-nav__link');
    const mega = item.querySelector('.mega-menu');
    if (!mega || !link) return;

    // Add ARIA attributes
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');
    mega.setAttribute('role', 'menu');

    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const isOpen = item.classList.toggle('open');
        link.setAttribute('aria-expanded', String(isOpen));
      }
    });

    // Keyboard: Enter/Space opens menu, Escape closes
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = item.classList.toggle('open');
        link.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
          const firstLink = mega.querySelector('a');
          if (firstLink) firstLink.focus();
        }
      }
      if (e.key === 'Escape') {
        item.classList.remove('open');
        link.setAttribute('aria-expanded', 'false');
        link.focus();
      }
    });

    // Escape from within mega-menu
    mega.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        item.classList.remove('open');
        link.setAttribute('aria-expanded', 'false');
        link.focus();
      }
    });
  });

  function closeMobileNav() {
    nav.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'fas fa-bars';
  }
}

/* ---- Sticky Header Shadow ---- */
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---- Scroll Animations ---- */
function initScrollAnimations() {
  const els = document.querySelectorAll('.animate-on-scroll');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ---- Counter Animation ---- */
function animateCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  function animateEl(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;

    // Reset to 0 before animating
    el.textContent = prefix + '0' + suffix;

    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = prefix + current.toLocaleString('he-IL') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateEl(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    counters.forEach(el => observer.observe(el));
  } else {
    counters.forEach(animateEl);
  }
}

/* ---- Cookie Consent ---- */
function initCookieConsent() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner || localStorage.getItem('ym_cookies_accepted')) return;

  banner.classList.add('show');

  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => {
    localStorage.setItem('ym_cookies_accepted', 'true');
    banner.classList.remove('show');
  });

  banner.querySelector('[data-cookie-decline]')?.addEventListener('click', () => {
    localStorage.setItem('ym_cookies_accepted', 'essential');
    banner.classList.remove('show');
  });
}

/* ---- FAQ Accordions ---- */
function initAccordions() {
  document.querySelectorAll('.accordion__header').forEach(header => {
    // Set initial ARIA state
    header.setAttribute('aria-expanded', header.closest('.accordion__item')?.classList.contains('active') ? 'true' : 'false');

    header.addEventListener('click', () => {
      const item = header.closest('.accordion__item');
      const body = item.querySelector('.accordion__body');
      const content = item.querySelector('.accordion__content');
      const isOpen = item.classList.contains('active');

      // Read layout property BEFORE any DOM writes (avoid forced reflow)
      const targetHeight = isOpen ? '0' : content.scrollHeight + 'px';

      // Close all others in same accordion (batch writes)
      item.closest('.accordion')?.querySelectorAll('.accordion__item').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.accordion__header')?.setAttribute('aria-expanded', 'false');
          other.querySelector('.accordion__body').style.maxHeight = '0';
        }
      });

      item.classList.toggle('active');
      header.setAttribute('aria-expanded', String(!isOpen));
      body.style.maxHeight = targetHeight;
    });
  });
}

/* ---- Search Overlay ---- */
function initSearchOverlay() {
  const toggleBtn = document.querySelector('.header__search-toggle');
  const overlay = document.querySelector('.search-overlay');
  if (!toggleBtn || !overlay) return;

  toggleBtn.addEventListener('click', () => {
    overlay.classList.add('active');
    const input = overlay.querySelector('input');
    if (input) setTimeout(() => input.focus(), 100);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });

  // Search form submission
  const searchForm = overlay.querySelector('form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchForm.querySelector('input').value.trim();
      if (q) window.location.href = `catalog?search=${encodeURIComponent(q)}`;
    });
  }
}

/* ---- Contact Form ---- */
function initContactForm() {
  const form = document.querySelector('.contact-form form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value.trim();
    const phone = form.querySelector('[name="phone"]')?.value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const message = form.querySelector('[name="message"]')?.value.trim();

    // Validation
    let valid = true;
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.form-input, .form-textarea').forEach(el => el.style.borderColor = '');

    if (!name) { showFieldError(form.querySelector('[name="name"]'), 'נא להזין שם'); valid = false; }
    if (!phone || !/^0[0-9]{8,9}$/.test(phone.replace(/[-\s]/g, ''))) {
      showFieldError(form.querySelector('[name="phone"]'), 'נא להזין מספר טלפון תקין');
      valid = false;
    }

    if (!valid) return;

    const business = form.querySelector('[name="business"]')?.value.trim();
    const submitBtn = form.querySelector('[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שולח...';

    // Send to CRM API
    fetch('https://app.ymarket.co.il/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, business, message }),
    })
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(() => {
        // Show success message
        form.innerHTML = `
          <div style="text-align:center; padding: var(--space-2xl) 0;">
            <i class="fas fa-check-circle" style="font-size:3rem; color:var(--color-success); margin-bottom:var(--space-md);"></i>
            <h3 style="margin-bottom:var(--space-sm);">הפרטים נשלחו בהצלחה!</h3>
            <p style="color:var(--color-text-secondary);">ניצור אתכם קשר בהקדם.</p>
          </div>`;
      })
      .catch(() => {
        // Fallback: open WhatsApp if API fails
        const lines = [`שלום, שמי ${name}.`, `טלפון: ${phone}`];
        if (email) lines.push(`מייל: ${email}`);
        if (message) lines.push(`\n${message}`);
        const text = encodeURIComponent(lines.join('\n'));
        window.open(`https://wa.me/972549922492?text=${text}`, '_blank');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      });
  });

  function showFieldError(input, msg) {
    if (!input) return;
    input.style.borderColor = 'var(--color-danger)';
    const error = document.createElement('div');
    error.className = 'form-error';
    error.textContent = msg;
    input.parentElement.appendChild(error);
    input.addEventListener('input', () => {
      input.style.borderColor = '';
      error.remove();
    }, { once: true });
  }
}

/* ---- Image Fallback ---- */
function initImageFallback() {
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', function() {
      this.src = this.dataset.fallback || 'images/placeholder.svg';
    });
  });
}

/* ---- Cart Button ---- */
function initCartButton() {
  const cartBtn = document.querySelector('.header__cart-btn');
  if (!cartBtn) return;

  cartBtn.addEventListener('click', () => {
    window.location.href = '/cart';
  });
}

/* ---- Cart Badge ---- */
function updateCartBadge() {
  const badge = document.querySelector('.cart-count');
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  badge.textContent = count;
  badge.classList.toggle('has-items', count > 0);

  // Bounce animation
  badge.classList.remove('bounce');
  void badge.offsetWidth; // force reflow
  badge.classList.add('bounce');
}

/* ---- Toast Notification ---- */
function showToast(message, duration = 3500) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + message +
    ' <a href="/cart" class="toast-cart-link"><i class="fas fa-shopping-cart"></i> לעגלה</a>';
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---- Format Currency ---- */
function formatPrice(price) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
}

/* ---- Global Cart Helpers ---- */
function getCartQty(productId) {
  var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === productId) return cart[i].quantity;
  }
  return 0;
}

function setCartQty(productId, qty) {
  var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
  if (qty <= 0) {
    cart = cart.filter(function(item) { return item.id !== productId; });
  } else {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === productId) { cart[i].quantity = qty; break; }
    }
  }
  localStorage.setItem('ym_cart', JSON.stringify(cart));
  updateCartBadge();
}

function showCartQtyControls(btn) {
  var id = parseInt(btn.dataset.id);
  var qty = getCartQty(id);

  var parent = btn.parentElement;
  var existingWrap = parent.querySelector('.ym-qty-wrap');
  if (existingWrap) existingWrap.remove();

  if (qty <= 0) {
    btn.style.display = '';
    btn.classList.remove('added');
    btn.innerHTML = '<i class="fas fa-cart-plus"></i> הוסף לעגלה';
    return;
  }

  btn.style.display = 'none';

  var wrap = document.createElement('div');
  wrap.className = 'ym-qty-wrap';

  var plusBtn = document.createElement('button');
  plusBtn.className = 'ym-qty-btn ym-plus';
  plusBtn.type = 'button';
  plusBtn.textContent = '+';

  var input = document.createElement('input');
  input.type = 'number';
  input.className = 'ym-qty-input';
  input.value = qty;
  input.min = '0';

  var minusBtn = document.createElement('button');
  minusBtn.type = 'button';
  minusBtn.className = 'ym-qty-btn' + (qty === 1 ? ' ym-remove' : '');
  minusBtn.innerHTML = qty === 1 ? '<i class="fas fa-trash-alt"></i>' : '−';

  var check = document.createElement('i');
  check.className = 'fas fa-check ym-check-icon';

  wrap.appendChild(plusBtn);
  wrap.appendChild(check);
  wrap.appendChild(input);
  wrap.appendChild(minusBtn);
  parent.insertBefore(wrap, btn.nextSibling);

  plusBtn.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    setCartQty(id, getCartQty(id) + 1);
    showCartQtyControls(btn);
  });
  minusBtn.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    setCartQty(id, getCartQty(id) - 1);
    showCartQtyControls(btn);
  });
  input.addEventListener('change', function() {
    var val = parseInt(this.value) || 0;
    setCartQty(id, val);
    if (val <= 0) showCartQtyControls(btn);
  });
  input.addEventListener('click', function(e) { e.stopPropagation(); });
  input.addEventListener('focus', function() { this.select(); });
}

/* ---- Expose globals ---- */
window.YMarket = {
  updateCartBadge,
  showToast,
  formatPrice,
  getCartQty,
  setCartQty,
  showCartQtyControls
};
