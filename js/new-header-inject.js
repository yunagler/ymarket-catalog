/**
 * YMarket Header/Footer Redesign Injector
 * Replaces old header/footer with new glassmorphism design on ALL pages.
 * Loaded after main.min.js on every page.
 */
(function(){
  'use strict';

  // ── NEW HEADER HTML ──
  var headerHTML = '' +
    '<div class="ym2-announcement">' +
      '<a href="/register"><i class="fas fa-crown"></i> רוכשים בכמויות מסחריות? הצטרפו למועדון הלקוחות וקבלו מחירון סיטונאי ייעודי <i class="fas fa-chevron-left" style="font-size:0.75em;"></i></a>' +
    '</div>' +
    '<div class="ym2-info-bar"><div class="container"><div class="ym2-info-bar__group">' +
      '<div class="ym2-info-bar__item"><i class="fas fa-phone-alt"></i> <a href="tel:037740400">03-7740400</a></div>' +
      '<div class="ym2-info-bar__item"><i class="fas fa-envelope"></i> <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div>' +
      '<div class="ym2-info-bar__item"><i class="fas fa-clock"></i> <span>א\'-ה\' 08:00-17:00</span></div>' +
    '</div><div class="ym2-info-bar__group ym2-info-bar__social">' +
      '<a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>' +
      '<a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>' +
      '<a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>' +
    '</div></div></div>' +
    '<header class="ym2-header" id="ym2Header"><div class="container">' +
      '<a href="/" class="ym2-header__logo"><img src="/images/logo/logo-dark-2x.png" alt="וואי מרקט" height="44" style="height:44px;width:auto;"></a>' +
      '<nav class="ym2-nav" aria-label="ניווט ראשי">' +
        '<a href="/" class="ym2-nav__link" data-nav="home">דף הבית</a>' +
        '<a href="/catalog" class="ym2-nav__link" data-nav="catalog">מוצרים</a>' +
        '<a href="/about" class="ym2-nav__link" data-nav="about">אודות</a>' +
        '<a href="/blog" class="ym2-nav__link" data-nav="blog">בלוג</a>' +
        '<a href="/contact" class="ym2-nav__link" data-nav="contact">צרו קשר</a>' +
      '</nav>' +
      '<div class="ym2-header__actions">' +
        '<button class="ym2-header__btn" aria-label="חיפוש" onclick="if(window.YMarket)YMarket.toggleSearch()"><i class="fas fa-search"></i></button>' +
        '<a href="/cart" class="ym2-header__btn" aria-label="עגלה"><i class="fas fa-shopping-cart"></i><span class="ym2-cart-badge" id="ym2CartBadge">0</span></a>' +
        '<a href="/login" class="ym2-header__btn ym2-header__login"><i class="fas fa-user"></i> <span>כניסה</span></a>' +
        '<a href="/register" class="ym2-header__btn ym2-header__register"><i class="fas fa-user-plus"></i> <span>הרשמה</span></a>' +
      '</div>' +
      '<button class="ym2-mobile-btn" aria-label="תפריט" id="ym2MobileBtn"><i class="fas fa-bars"></i></button>' +
    '</div></header>';

  // ── NEW FOOTER HTML ──
  var footerHTML = '' +
    '<footer class="ym2-footer"><div class="container"><div class="ym2-footer__grid">' +
      '<div class="ym2-footer__brand"><div class="ym2-footer__brand-logo"><img src="/images/logo/logo-white-2x.png" alt="וואי מרקט" height="50" style="height:50px;width:auto;"></div>' +
        '<p>נגלר סחר והפצה — סחר, שיווק והפצה של מוצרי צריכה שוטפת לעסקים ומוסדות בכל רחבי הארץ.</p>' +
        '<div class="ym2-footer__social"><a href="https://wa.me/972549922492" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i></a><a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a><a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a></div></div>' +
      '<div><h3 class="ym2-footer__heading">קטגוריות</h3><div class="ym2-footer__links"><a href="/category/bulk-paper-towel-office-supplies/">מוצרי נייר</a><a href="/category/industrial-cleaning-supplies-wholesale/">חומרי ניקוי</a><a href="/category/disposable-catering-food-service/">חד פעמי</a><a href="/category/food-packaging-delivery-solutions/">אריזות מזון</a><a href="/category/office-coffee-breakroom-supplies/">קפה וכיבוד</a><a href="/category/safety-ppe-equipment-for-business/">בטיחות ומיגון</a><a href="/category/heavy-duty-garbage-bags-wholesale/">שקיות אשפה</a></div></div>' +
      '<div><h3 class="ym2-footer__heading">קישורים</h3><div class="ym2-footer__links"><a href="/catalog">קטלוג</a><a href="/about">אודות</a><a href="/blog">בלוג</a><a href="/faq">שאלות</a><a href="/contact">צרו קשר</a><a href="/tracking">מעקב משלוחים</a></div></div>' +
      '<div><h3 class="ym2-footer__heading">צרו קשר</h3><div class="ym2-footer__contact"><div><i class="fas fa-phone-alt"></i><a href="tel:037740400">03-7740400</a></div><div><i class="fab fa-whatsapp"></i><a href="https://wa.me/972549922492" target="_blank" rel="noopener">WhatsApp</a></div><div><i class="fas fa-envelope"></i><a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div><div><i class="fas fa-clock"></i><span>א\'-ה\' 08:00-17:00</span></div></div></div>' +
    '</div><div class="ym2-footer__bottom"><span>&copy; 2026 וואי מרקט — נגלר סחר והפצה. כל הזכויות שמורות.</span><div class="ym2-footer__legal"><a href="/legal/terms">תקנון</a><a href="/legal/privacy">פרטיות</a><a href="/legal/shipping">משלוחים</a><a href="/legal/returns">החזרות</a><a href="/legal/accessibility">נגישות</a></div></div></div></footer>';

  // ── INJECT ──
  function inject() {
    // Skip pages that already have the new design (index.html, catalog.html)
    if (document.querySelector('.ym2-header') || document.querySelector('.announcement')) return;

    // Replace old header
    var oldTopBar = document.querySelector('.top-bar');
    var oldHeader = document.querySelector('header.header, header');
    var oldMobileOverlay = document.querySelector('.mobile-overlay');
    var oldSearchOverlay = document.querySelector('.search-overlay');

    if (oldTopBar && oldHeader) {
      var wrapper = document.createElement('div');
      wrapper.id = 'ym2-header-wrapper';
      wrapper.innerHTML = headerHTML;
      oldTopBar.parentNode.insertBefore(wrapper, oldTopBar);
      oldTopBar.style.display = 'none';
      oldHeader.style.display = 'none';
      if (oldMobileOverlay) oldMobileOverlay.style.display = 'none';
    }

    // Replace old footer
    var oldFooter = document.querySelector('footer.footer');
    if (oldFooter) {
      var footerWrapper = document.createElement('div');
      footerWrapper.innerHTML = footerHTML;
      oldFooter.parentNode.insertBefore(footerWrapper, oldFooter);
      oldFooter.style.display = 'none';
    }

    // Active nav link
    var path = window.location.pathname;
    document.querySelectorAll('.ym2-nav__link').forEach(function(link) {
      var nav = link.getAttribute('data-nav');
      if ((nav === 'home' && (path === '/' || path === '/index.html')) ||
          (nav === 'catalog' && path.indexOf('/catalog') !== -1) ||
          (nav === 'about' && path.indexOf('/about') !== -1) ||
          (nav === 'blog' && path.indexOf('/blog') !== -1) ||
          (nav === 'contact' && path.indexOf('/contact') !== -1)) {
        link.classList.add('active');
      }
    });

    // Header scroll shadow
    window.addEventListener('scroll', function() {
      var h = document.getElementById('ym2Header');
      if (h) h.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Cart badge sync
    function syncBadge() {
      var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
      var total = 0;
      for (var i = 0; i < cart.length; i++) total += (cart[i].quantity || 0);
      var badge = document.getElementById('ym2CartBadge');
      if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
    }
    syncBadge();
    window.addEventListener('storage', syncBadge);

    // Mobile menu toggle (basic)
    var mobileBtn = document.getElementById('ym2MobileBtn');
    var nav = document.querySelector('.ym2-nav');
    if (mobileBtn && nav) {
      mobileBtn.addEventListener('click', function() {
        nav.classList.toggle('open');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // ═══ GLOBAL: Subtotal display for ALL page types ═══
  // Works on: category pages, product pages, catalog page
  function fmtILS(n) { return new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',minimumFractionDigits:0,maximumFractionDigits:2}).format(n); }

  // Category pages: .product-card__add-btn with data-price
  // After add-to-cart or qty change, inject subtotal
  function addSubtotalToCard(card) {
    if (!card) return;
    var btn = card.querySelector('.product-card__add-btn');
    var qtyWrap = card.querySelector('.card-qty-wrap');
    var existing = card.querySelector('.ym-subtotal');

    // Get price from button data or from price display
    var price = 0;
    if (btn) price = parseFloat(btn.dataset.price) || 0;
    if (!price && qtyWrap) {
      var pid = qtyWrap.dataset.productId || (btn && btn.dataset.id);
      var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
      for (var i = 0; i < cart.length; i++) {
        if (String(cart[i].id) === String(pid)) { price = cart[i].price || 0; break; }
      }
    }

    // Get current qty
    var qtyInput = card.querySelector('.card-qty-input, input[type="number"]');
    var qty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;

    if (qty <= 0 || price <= 0) {
      if (existing) existing.remove();
      return;
    }

    var subtotal = price * qty;
    if (!existing) {
      existing = document.createElement('div');
      existing.className = 'ym-subtotal';
      var actions = card.querySelector('.product-card__actions');
      if (actions) actions.appendChild(existing);
    }
    existing.innerHTML = '<strong>' + fmtILS(subtotal) + '</strong><small>' + qty + ' × ' + fmtILS(price) + '</small>';
  }

  // Product page: quantity-selector with #qtyInput
  function addSubtotalToProductPage() {
    var qtyInput = document.getElementById('qtyInput');
    var priceEl = document.querySelector('.product-pricing__price');
    if (!qtyInput || !priceEl) return;

    var priceText = priceEl.textContent.replace(/[^\d.]/g, '');
    var price = parseFloat(priceText) || 0;
    if (price <= 0) return;

    function updateProductSubtotal() {
      var qty = parseInt(qtyInput.value) || 1;
      var subtotal = price * qty;
      var el = document.getElementById('ym-product-subtotal');
      if (!el) {
        el = document.createElement('div');
        el.id = 'ym-product-subtotal';
        el.className = 'ym-product-subtotal';
        var actions = document.querySelector('.product-actions');
        var addBtn = document.getElementById('addToCartBtn');
        if (addBtn) addBtn.parentNode.insertBefore(el, addBtn);
        else if (actions) actions.appendChild(el);
      }
      if (qty > 1) {
        el.innerHTML = '<span class="ym-ps__total">' + fmtILS(subtotal) + '</span><span class="ym-ps__detail">' + qty + ' × ' + fmtILS(price) + '</span>';
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    }

    qtyInput.addEventListener('input', updateProductSubtotal);
    qtyInput.addEventListener('change', updateProductSubtotal);
    // Also listen for button clicks
    var dec = document.getElementById('qtyDecrease');
    var inc = document.getElementById('qtyIncrease');
    if (dec) dec.addEventListener('click', function() { setTimeout(updateProductSubtotal, 50); });
    if (inc) inc.addEventListener('click', function() { setTimeout(updateProductSubtotal, 50); });
    updateProductSubtotal();
  }

  // Category pages: observe DOM changes for qty controls
  function observeCategoryCards() {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'childList') {
          var card = m.target.closest('.product-card');
          if (card) addSubtotalToCard(card);
        }
      });
    });
    document.querySelectorAll('.product-card__actions').forEach(function(el) {
      observer.observe(el, { childList: true, subtree: true });
    });
    // Also handle clicks on qty buttons
    document.addEventListener('click', function(e) {
      var qtyBtn = e.target.closest('.card-qty-btn');
      if (qtyBtn) {
        setTimeout(function() {
          var card = qtyBtn.closest('.product-card');
          if (card) addSubtotalToCard(card);
        }, 100);
      }
    });
  }

  // Init after DOM ready
  function initSubtotals() {
    addSubtotalToProductPage();
    observeCategoryCards();
    // Initial scan for cards already showing qty
    document.querySelectorAll('.product-card').forEach(addSubtotalToCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubtotals);
  } else {
    setTimeout(initSubtotals, 500); // Wait for page JS to render cards
  }
})();
