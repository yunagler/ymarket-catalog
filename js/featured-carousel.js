/* ===========================================
   Y Market - Featured Products Carousel
   Loads featured items from products.json
   and renders a Swiper carousel on homepage
   =========================================== */

(function() {
  'use strict';

  var section = document.getElementById('featuredProducts');
  var wrapper = document.getElementById('featuredWrapper');
  if (!section || !wrapper) return;

  function formatPrice(price) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency', currency: 'ILS',
      minimumFractionDigits: 0, maximumFractionDigits: 2
    }).format(price);
  }

  function addToCart(product) {
    var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) { existing = cart[i]; break; }
    }

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.saleNis || 0,
        unit: product.unit || '',
        imageUrl: product.imageUrl || '',
        slug: product.slug,
        quantity: 1
      });
    }

    localStorage.setItem('ym_cart', JSON.stringify(cart));
    if (window.YMarket) window.YMarket.updateCartBadge();
    if (window.YMarket) window.YMarket.showToast('המוצר נוסף לעגלה');
  }

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildSlide(product) {
    var imgSrc = product.imageUrl || 'images/products/' + product.id + '.jpg';
    var safeName = escHtml(product.name || '');
    var fallback = 'https://placehold.co/300x300/f0f2f5/5a6577?text=' + encodeURIComponent((product.name || '').substring(0, 15));
    var hasPromo = product.productStatus === 'on_sale' && product.originalPrice;
    var promoLabel = product.promotionLabel || 'מבצע';

    var priceHtml = '';
    if (product.saleNis) {
      if (hasPromo) {
        priceHtml =
          '<div class="featured-slide__promo-badge">' + promoLabel + '</div>' +
          '<div class="featured-slide__prices">' +
            '<span class="featured-slide__price featured-slide__price--sale">' + formatPrice(product.saleNis) + '</span>' +
            '<span class="featured-slide__price-original">' + formatPrice(product.originalPrice) + '</span>' +
          '</div>';
        if (product.discountPercent) {
          priceHtml += '<div class="featured-slide__discount">' + Math.round(product.discountPercent) + '%- הנחה</div>';
        }
      } else {
        priceHtml = '<div class="featured-slide__prices"><span class="featured-slide__price">' + formatPrice(product.saleNis) + '</span></div>';
      }
    } else {
      priceHtml = '<div class="featured-slide__prices"><span class="featured-slide__price">צרו קשר למחיר</span></div>';
    }

    var safeSlug = encodeURIComponent(product.slug || '');
    var slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.dataset.fallback = fallback;
    slide.innerHTML =
      '<div class="featured-slide">' +
        '<a href="products/' + safeSlug + '" class="featured-slide__image" aria-label="' + safeName + '">' +
          '<img src="' + imgSrc + '" alt="' + safeName + '" loading="lazy" onerror="this.onerror=null;this.src=this.closest(\'[data-fallback]\').dataset.fallback;">' +
        '</a>' +
        '<div class="featured-slide__body">' +
          '<div class="featured-slide__category">' + escHtml(product.categoryName || '') + '</div>' +
          '<h3 class="featured-slide__name"><a href="products/' + safeSlug + '">' + safeName + '</a></h3>' +
          priceHtml +
          (product.saleNis
            ? '<button class="featured-slide__btn" data-id="' + product.id + '"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>'
            : '') +
        '</div>' +
      '</div>';

    return slide;
  }

  async function init() {
    try {
      var res = await fetch('data/products.json');
      var data = await res.json();
      var items = (data.items || []).filter(function(item) { return item.isFeatured; });

      if (items.length === 0) return;

      // Build slides
      for (var i = 0; i < items.length; i++) {
        wrapper.appendChild(buildSlide(items[i]));
      }

      // Show section
      section.style.display = '';

      // Init Swiper
      new Swiper('.featured-swiper', {
        slidesPerView: 1,
        spaceBetween: 16,
        loop: items.length > 4,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        pagination: {
          el: '.featured-pagination',
          clickable: true,
        },
        breakpoints: {
          480: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 24 },
        }
      });

      // Add to cart click handlers
      var buttons = section.querySelectorAll('.featured-slide__btn');
      for (var j = 0; j < buttons.length; j++) {
        (function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            var id = parseInt(btn.getAttribute('data-id'));
            var product = items.find(function(p) { return p.id === id; });
            if (product) addToCart(product);
          });
        })(buttons[j]);
      }

    } catch (e) {
      console.warn('Featured carousel: could not load products.json', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
