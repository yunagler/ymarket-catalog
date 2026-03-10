/* ===========================================
   Y Market - Main JavaScript
   Navigation, Scroll, WhatsApp, Cookies
   =========================================== */

document.addEventListener('DOMContentLoaded', () => {
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

  // Mobile mega-menu toggle
  document.querySelectorAll('.main-nav__item').forEach(item => {
    const link = item.querySelector('.main-nav__link');
    const mega = item.querySelector('.mega-menu');
    if (!mega || !link) return;

    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        item.classList.toggle('open');
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
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = prefix + current.toLocaleString('he-IL') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  });
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
    header.addEventListener('click', () => {
      const item = header.closest('.accordion__item');
      const body = item.querySelector('.accordion__body');
      const content = item.querySelector('.accordion__content');
      const isOpen = item.classList.contains('active');

      // Close all others in same accordion
      item.closest('.accordion')?.querySelectorAll('.accordion__item').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.accordion__body').style.maxHeight = '0';
        }
      });

      item.classList.toggle('active');
      body.style.maxHeight = isOpen ? '0' : content.scrollHeight + 'px';
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

    // Send via WhatsApp
    const lines = [`שלום, שמי ${name}.`, `טלפון: ${phone}`];
    if (email) lines.push(`מייל: ${email}`);
    if (message) lines.push(`\n${message}`);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/972549922492?text=${text}`, '_blank');
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
    // Detect if we're in a subdirectory
    const isSubDir = window.location.pathname.includes('/legal/') ||
                     window.location.pathname.includes('/products/') ||
                     window.location.pathname.includes('/blog/');
    window.location.href = isSubDir ? '../cart' : 'cart';
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
}

/* ---- Toast Notification ---- */
function showToast(message, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
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

/* ---- Expose globals ---- */
window.YMarket = {
  updateCartBadge,
  showToast,
  formatPrice
};
