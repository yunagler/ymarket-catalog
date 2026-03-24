/* ===========================================
   Y Market - Catalog Page
   Hierarchical category filtering, search, cart
   =========================================== */

(function() {
  'use strict';

  let allProducts = [];
  let categories = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let priceMin = 0;
  let priceMax = Infinity;
  let currentSort = 'name-asc';
  let currentPage = 1;
  var ITEMS_PER_PAGE = 24;

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupEventListeners();
    applyURLParams();
    render();
  });

  // ---- Load Products ----
  async function loadProducts() {
    try {
      const res = await fetch('/data/products.json');
      const data = await res.json();
      allProducts = data.items || [];
      categories = data.categories || [];
    } catch (e) {
      console.warn('Could not load products.json');
    }
  }

  // ---- Category Tree ----
  var categoryMap = {};
  var treeRoots = [];

  function buildCategoryTree(flatCats) {
    categoryMap = {};
    flatCats.forEach(function(c) { categoryMap[c.id] = Object.assign({}, c, { children: [] }); });
    var roots = [];
    Object.keys(categoryMap).forEach(function(id) {
      var cat = categoryMap[id];
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].children.push(cat);
      } else {
        roots.push(cat);
      }
    });
    var sortFn = function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); };
    function sortDeep(arr) { arr.sort(sortFn); arr.forEach(function(c) { if (c.children.length) sortDeep(c.children); }); }
    sortDeep(roots);
    return roots;
  }

  function getDescendantSlugs(cat) {
    var slugs = [cat.slug];
    if (cat.children) {
      cat.children.forEach(function(child) {
        slugs = slugs.concat(getDescendantSlugs(child));
      });
    }
    return slugs;
  }

  function getHierarchicalCount(cat) {
    var slugs = getDescendantSlugs(cat);
    var seen = {};
    var count = 0;
    allProducts.forEach(function(p) {
      if (seen[p.id]) return;
      var match = slugs.indexOf(p.categorySlug) !== -1 ||
        (p.categorySlugs && p.categorySlugs.some(function(s) { return slugs.indexOf(s) !== -1; }));
      if (match) { seen[p.id] = true; count++; }
    });
    return count;
  }

  function findCatBySlug(slug) {
    for (var id in categoryMap) {
      if (categoryMap[id].slug === slug) return categoryMap[id];
    }
    return null;
  }

  function getParentChain(cat) {
    var chain = [];
    var current = cat;
    while (current && current.parentId && categoryMap[current.parentId]) {
      current = categoryMap[current.parentId];
      chain.unshift(current);
    }
    return chain;
  }

  function isDescendantOf(slug, parentCat) {
    if (parentCat.slug === slug) return true;
    for (var i = 0; i < parentCat.children.length; i++) {
      if (isDescendantOf(slug, parentCat.children[i])) return true;
    }
    return false;
  }

  // ---- Build Category Sidebar ----
  function buildCategoryList() {
    var list = document.getElementById('categoryList');
    if (!list) return;

    treeRoots = buildCategoryTree(categories);

    // Clear all except "all" button
    var allItems = list.querySelectorAll('.category-list__item:not([data-category="all"]), .category-children');
    allItems.forEach(function(el) { el.remove(); });

    var totalBtn = list.querySelector('[data-category="all"]');
    if (totalBtn) {
      var count = totalBtn.querySelector('.category-list__count');
      if (count) count.textContent = allProducts.length;
    }

    var activeCat = currentCategory !== 'all' ? findCatBySlug(currentCategory) : null;

    function renderNode(cat, depth, container) {
      var itemCount = getHierarchicalCount(cat);
      var hasChildren = cat.children && cat.children.length > 0;
      var isActive = currentCategory === cat.slug;
      var isAncestor = activeCat && hasChildren && isDescendantOf(currentCategory, cat);
      var isOpen = isActive || isAncestor;

      var link = document.createElement('a');
      link.className = 'category-list__item' + (isActive ? ' active' : '');
      link.href = '#';
      link.dataset.category = cat.slug;
      if (depth > 0) {
        link.style.paddingRight = (16 + depth * 16) + 'px';
        link.style.fontSize = '0.9em';
      }

      var inner = '';
      if (hasChildren) {
        inner += '<i class="fas fa-chevron-down" style="font-size:0.6em;margin-left:4px;transition:transform 0.2s;' + (isOpen ? '' : 'transform:rotate(90deg);') + '"></i>';
      }
      inner += '<span>' + escapeHtml(cat.name) + '</span><span class="category-list__count">' + itemCount + '</span>';
      link.innerHTML = inner;
      container.appendChild(link);

      if (hasChildren) {
        var childContainer = document.createElement('div');
        childContainer.className = 'category-children';
        childContainer.style.display = isOpen ? '' : 'none';
        childContainer.style.borderRight = '2px solid #e5e7eb';
        childContainer.style.marginRight = '12px';
        container.appendChild(childContainer);

        cat.children.forEach(function(child) {
          renderNode(child, depth + 1, childContainer);
        });
      }
    }

    treeRoots.forEach(function(cat) { renderNode(cat, 0, list); });

    var totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) totalCountEl.textContent = allProducts.length;

    // Update "all" button active state
    if (totalBtn) {
      totalBtn.classList.toggle('active', currentCategory === 'all');
    }
  }

  // ---- Breadcrumb ----
  function updateBreadcrumb() {
    var nav = document.querySelector('.breadcrumb');
    if (!nav) return;

    var html = '<a href="/">דף הבית</a>' +
      '<span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>';

    if (currentCategory === 'all') {
      html += '<span class="breadcrumb__current">קטלוג מוצרים</span>';
    } else {
      html += '<a href="/catalog" data-breadcrumb-all>קטלוג מוצרים</a>';
      var cat = findCatBySlug(currentCategory);
      if (cat) {
        var chain = getParentChain(cat);
        chain.forEach(function(ancestor) {
          html += '<span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>' +
            '<a href="#" data-breadcrumb-cat="' + ancestor.slug + '">' + escapeHtml(ancestor.name) + '</a>';
        });
        html += '<span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>' +
          '<span class="breadcrumb__current">' + escapeHtml(cat.name) + '</span>';
      }
    }

    nav.innerHTML = html;

    // Breadcrumb click handlers
    nav.querySelectorAll('[data-breadcrumb-cat]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        selectCategory(el.getAttribute('data-breadcrumb-cat'));
      });
    });
    var allLink = nav.querySelector('[data-breadcrumb-all]');
    if (allLink) {
      allLink.addEventListener('click', function(e) {
        e.preventDefault();
        selectCategory('all');
      });
    }
  }

  // ---- Subcategory Cards ----
  function renderSubcategoryCards() {
    // Remove existing
    var existing = document.getElementById('subcategoriesGrid');
    if (existing) existing.remove();

    if (currentCategory === 'all') return;
    var cat = findCatBySlug(currentCategory);
    if (!cat || !cat.children || cat.children.length === 0) return;

    var grid = document.createElement('div');
    grid.id = 'subcategoriesGrid';
    grid.className = 'subcategories-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:24px;';

    cat.children.forEach(function(child) {
      var count = getHierarchicalCount(child);
      var card = document.createElement('a');
      card.href = '#';
      card.dataset.subcategory = child.slug;
      card.className = 'subcategory-card';
      card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:10px;text-decoration:none;color:#1f2937;transition:all 0.2s;font-size:0.95rem;cursor:pointer;';
      card.innerHTML = '<i class="fas ' + (child.icon || 'fa-folder') + '" style="color:#1B3A5C;font-size:1.1rem;"></i>' +
        '<span>' + escapeHtml(child.name) + '</span>' +
        '<span style="margin-right:auto;color:#9ca3af;font-size:0.8rem;">' + count + '</span>';
      card.addEventListener('click', function(e) {
        e.preventDefault();
        selectCategory(child.slug);
      });
      card.addEventListener('mouseenter', function() { card.style.background = '#eef2ff'; card.style.borderColor = '#c7d2fe'; });
      card.addEventListener('mouseleave', function() { card.style.background = '#f8f9fa'; card.style.borderColor = '#e5e7eb'; });
      grid.appendChild(card);
    });

    var productsGrid = document.getElementById('productsGrid');
    if (productsGrid) productsGrid.parentNode.insertBefore(grid, productsGrid);
  }

  // ---- Select Category ----
  function selectCategory(slug) {
    currentCategory = slug;
    currentPage = 1;
    var url = new URL(window.location);
    if (slug === 'all') {
      url.searchParams.delete('cat');
    } else {
      url.searchParams.set('cat', slug);
    }
    history.pushState(null, '', url);
    updateTitle();
    updateBreadcrumb();
    buildCategoryList();
    renderSubcategoryCards();
    render();

    // Scroll to top of catalog
    var header = document.querySelector('.catalog-header');
    if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Event Listeners ----
  function setupEventListeners() {
    // Category click - inline filtering
    document.getElementById('categoryList')?.addEventListener('click', function(e) {
      var btn = e.target.closest('.category-list__item');
      if (!btn) return;
      e.preventDefault();
      var slug = btn.dataset.category;

      if (slug === 'all') {
        selectCategory('all');
        return;
      }

      if (!slug) return;

      // If this category has children, toggle expand/collapse
      var childContainer = btn.nextElementSibling;
      if (childContainer && childContainer.classList.contains('category-children')) {
        var icon = btn.querySelector('.fa-chevron-down');
        // If already active on this category, just toggle children visibility
        if (currentCategory === slug) {
          if (childContainer.style.display === 'none') {
            childContainer.style.display = '';
            if (icon) icon.style.transform = '';
          } else {
            childContainer.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(90deg)';
          }
          return;
        }
        // Otherwise expand and select
        childContainer.style.display = '';
        if (icon) icon.style.transform = '';
      }

      selectCategory(slug);
    });

    // Search input
    var searchInput = document.getElementById('searchInput');
    var searchTimeout;
    searchInput?.addEventListener('input', function(e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function() {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        render();
        // Facebook Pixel + GA4 - Search
        if (currentSearch.length >= 2) {
          if (window.YMarketAnalytics && window.YMarketAnalytics.fbSearch) {
            window.YMarketAnalytics.fbSearch(currentSearch);
          }
          if (window.YMarketAnalytics && window.YMarketAnalytics.trackSearch) {
            window.YMarketAnalytics.trackSearch(currentSearch);
          }
        }
      }, 300);
    });

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', function(e) {
      currentSort = e.target.value;
      currentPage = 1;
      render();
    });

    // Price filter
    document.getElementById('priceFilterBtn')?.addEventListener('click', function() {
      priceMin = Math.max(0, parseFloat(document.getElementById('priceMin').value) || 0);
      priceMax = Math.max(0, parseFloat(document.getElementById('priceMax').value) || Infinity);
      currentPage = 1;
      render();
    });

    // Mobile filter toggle
    var sidebar = document.getElementById('catalogSidebar');
    var overlay = document.getElementById('catalogOverlay');
    var openSidebar = function() {
      sidebar?.classList.add('open');
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    var closeSidebar = function() {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('active');
      document.body.style.overflow = '';
    };
    document.getElementById('mobileFilterBtn')?.addEventListener('click', openSidebar);
    document.getElementById('closeSidebar')?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // Browser back/forward
    window.addEventListener('popstate', function() {
      applyURLParams();
      render();
    });
  }

  // ---- URL Params ----
  function applyURLParams() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('cat');
    var search = params.get('search');

    if (cat) {
      currentCategory = cat;
    } else {
      currentCategory = 'all';
    }

    if (search) {
      currentSearch = search.replace(/[<>"']/g, '');
      var searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = currentSearch;
    }

    // Rebuild UI for selected category
    buildCategoryList();
    updateTitle();
    updateBreadcrumb();
    renderSubcategoryCards();
  }

  // ---- Update Title ----
  function updateTitle() {
    var titleEl = document.getElementById('catalogTitle');
    if (!titleEl) return;
    if (currentCategory === 'all') {
      titleEl.textContent = 'כל המוצרים';
    } else {
      var cat = findCatBySlug(currentCategory);
      titleEl.textContent = cat ? cat.name : 'מוצרים';
    }
  }

  // ---- Filter & Sort ----
  function getFilteredProducts() {
    var filtered = allProducts;

    // Category filter (includes all descendant categories)
    if (currentCategory !== 'all') {
      var catObj = findCatBySlug(currentCategory);
      var slugs = catObj ? getDescendantSlugs(catObj) : [currentCategory];
      var seen = {};
      filtered = filtered.filter(function(p) {
        if (seen[p.id]) return false;
        var match = slugs.indexOf(p.categorySlug) !== -1 ||
          (p.categorySlugs && p.categorySlugs.some(function(s) { return slugs.indexOf(s) !== -1; }));
        if (match) { seen[p.id] = true; return true; }
        return false;
      });
    }

    // Search
    if (currentSearch) {
      var q = currentSearch.toLowerCase();
      filtered = filtered.filter(function(p) {
        return p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.searchTags || '').toLowerCase().includes(q) ||
          (p.partNumber || '').toLowerCase().includes(q);
      });
    }

    // Price range
    filtered = filtered.filter(function(p) {
      var price = p.saleNis || 0;
      return price >= priceMin && price <= priceMax;
    });

    // Sort
    filtered.sort(function(a, b) {
      switch (currentSort) {
        case 'name-asc': return (a.name || '').localeCompare(b.name || '', 'he');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '', 'he');
        case 'price-asc': return (a.saleNis || 0) - (b.saleNis || 0);
        case 'price-desc': return (b.saleNis || 0) - (a.saleNis || 0);
        default: return 0;
      }
    });

    return filtered;
  }

  // ---- Render Products (with pagination) ----
  function render() {
    var grid = document.getElementById('productsGrid');
    var noResults = document.getElementById('noResults');
    var countEl = document.getElementById('resultCount');
    if (!grid) return;

    var allFiltered = getFilteredProducts();
    var totalProducts = allFiltered.length;
    countEl.textContent = totalProducts;

    if (totalProducts === 0) {
      grid.innerHTML = '';
      noResults.style.display = 'block';
      renderPagination(0, 0);
      return;
    }

    noResults.style.display = 'none';

    // Pagination slice
    var totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    var startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    var pageProducts = allFiltered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    grid.innerHTML = pageProducts.map(function(p) { return renderProductCard(p); }).join('');

    // Attach quantity +/- events
    grid.querySelectorAll('.product-card__qty-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        var input = document.getElementById('qty-' + id);
        if (!input) return;
        var val = parseInt(input.value) || 1;
        if (btn.dataset.action === 'increase') val++;
        else if (val > 1) val--;
        input.value = val;
      });
    });

    // Attach add-to-cart events
    grid.querySelectorAll('.product-card__add-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var id = parseInt(btn.dataset.id);
        var input = document.getElementById('qty-' + id);
        var qty = input ? Math.max(1, parseInt(input.value) || 1) : 1;
        addToCart(id, qty);
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> נוסף';
        setTimeout(function() {
          btn.classList.remove('added');
          btn.innerHTML = '<i class="fas fa-cart-plus"></i> הוסף לעגלה';
        }, 1500);
        if (input) input.value = '1';
      });
    });

    renderPagination(totalPages, totalProducts);
  }

  // ---- Pagination UI ----
  function renderPagination(totalPages, totalProducts) {
    var existing = document.getElementById('catalogPagination');
    if (existing) existing.remove();

    if (totalPages <= 1) return;

    var nav = document.createElement('nav');
    nav.id = 'catalogPagination';
    nav.className = 'pagination';
    nav.setAttribute('aria-label', 'ניווט עמודים');

    var html = '';

    // Prev button
    html += '<button class="pagination__btn pagination__prev" ' + (currentPage <= 1 ? 'disabled' : '') + ' data-page="' + (currentPage - 1) + '"><i class="fas fa-chevron-right"></i> הקודם</button>';

    // Page numbers
    html += '<div class="pagination__pages">';
    var pages = getPaginationRange(currentPage, totalPages);
    for (var i = 0; i < pages.length; i++) {
      if (pages[i] === '...') {
        html += '<span class="pagination__dots">...</span>';
      } else {
        html += '<button class="pagination__page' + (pages[i] === currentPage ? ' active' : '') + '" data-page="' + pages[i] + '">' + pages[i] + '</button>';
      }
    }
    html += '</div>';

    // Next button
    html += '<button class="pagination__btn pagination__next" ' + (currentPage >= totalPages ? 'disabled' : '') + ' data-page="' + (currentPage + 1) + '">הבא <i class="fas fa-chevron-left"></i></button>';

    // Info
    var startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    var endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalProducts);
    html += '<div class="pagination__info">מציג ' + startItem + '-' + endItem + ' מתוך ' + totalProducts + '</div>';

    nav.innerHTML = html;

    // Insert after products grid
    var grid = document.getElementById('productsGrid');
    if (grid) grid.parentNode.insertBefore(nav, grid.nextSibling);

    // Click handlers
    nav.querySelectorAll('[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          render();
          // Scroll to top of catalog
          var header = document.querySelector('.catalog-header');
          if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Generate smart page range: [1, '...', 4, 5, 6, '...', 20]
  function getPaginationRange(current, total) {
    if (total <= 7) {
      var arr = [];
      for (var i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    var pages = [1];
    if (current > 3) pages.push('...');
    var start = Math.max(2, current - 1);
    var end = Math.min(total - 1, current + 1);
    for (var j = start; j <= end; j++) pages.push(j);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  // ---- Product Card HTML ----
  function renderProductCard(p) {
    var price = p.saleNis ? formatPrice(p.saleNis) : '';
    var perUnit = p.saleNis && p.unitsPerPack > 1
      ? formatPrice(p.saleNis / p.unitsPerPack) + ' ליחידה'
      : '';

    var hasPromo = p.productStatus === 'on_sale' && p.originalPrice;
    var promoLabel = p.promotionLabel || 'מבצע';
    var discountText = p.discountPercent ? Math.round(p.discountPercent) + '%-' : '';

    var badgeHtml = '';
    if (hasPromo) {
      badgeHtml = '<span class="product-card__badge product-card__badge--sale">' + (discountText || promoLabel) + '</span>';
    } else if (p.productStatus === 'on_sale') {
      badgeHtml = '<span class="product-card__badge product-card__badge--sale">מבצע</span>';
    } else if (p.productStatus === 'recommended') {
      badgeHtml = '<span class="product-card__badge product-card__badge--recommended">מומלץ</span>';
    } else if (p.productStatus === 'new') {
      badgeHtml = '<span class="product-card__badge product-card__badge--new">חדש</span>';
    } else if (p.productStatus === 'clearance') {
      badgeHtml = '<span class="product-card__badge product-card__badge--sale">חיסול</span>';
    }

    var priceHtml = '';
    if (price) {
      if (hasPromo) {
        priceHtml = '<div class="product-card__price product-card__price--sale">' + price + '</div>' +
          '<div class="product-card__price-original">' + formatPrice(p.originalPrice) + '</div>';
      } else {
        priceHtml = '<div class="product-card__price">' + price + '</div>';
      }
    } else {
      priceHtml = '<div class="product-card__price" style="color:var(--color-text-light)">צרו קשר למחיר</div>';
    }

    var productUrl = p.slug ? '/products/' + encodeURIComponent(p.slug) + '/' : '#';
    var imgSrc = p.imageUrl || 'images/products/placeholder.jpg';
    var safeName = escapeHtml(p.name);
    var safeCategoryName = escapeHtml(p.categoryName || '');
    var fallbackImg = 'https://placehold.co/300x300/f0f2f5/5a6577?text=' + encodeURIComponent((p.name || 'מוצר').substring(0, 15));

    return '<div class="product-card" data-fallback="' + fallbackImg + '">' +
      '<div class="product-card__image">' +
        '<a href="' + productUrl + '" aria-label="' + safeName + '">' +
          '<img src="' + imgSrc + '" alt="' + safeName + '" loading="lazy" onerror="this.onerror=null;this.src=this.closest(\'.product-card\').dataset.fallback;">' +
        '</a>' +
        badgeHtml +
      '</div>' +
      '<div class="product-card__body">' +
        '<div class="product-card__category">' + safeCategoryName + '</div>' +
        '<h3 class="product-card__name"><a href="' + productUrl + '">' + safeName + '</a></h3>' +
        (p.unit ? '<div class="product-card__pack">' + (p.unitsPerPack || '') + ' ' + (p.unit || '') + '</div>' : '') +
        '<div class="product-card__pricing">' +
          priceHtml +
          (perUnit ? '<div class="product-card__price-unit">' + perUnit + '</div>' : '') +
        '</div>' +
        '<div class="product-card__actions">' +
          (price ?
            '<div class="product-card__qty-row">' +
              '<div class="product-card__qty-selector">' +
                '<button class="product-card__qty-btn" data-action="decrease" data-id="' + p.id + '">-</button>' +
                '<input type="number" class="product-card__qty-input" id="qty-' + p.id + '" value="1" min="1" max="999">' +
                '<button class="product-card__qty-btn" data-action="increase" data-id="' + p.id + '">+</button>' +
              '</div>' +
              '<button class="product-card__add-btn" data-id="' + p.id + '"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>' +
            '</div>'
          : '<a href="https://wa.me/972549922492?text=היי, מתעניין ב' + encodeURIComponent(p.name) + '" class="product-card__add-btn" target="_blank"><i class="fab fa-whatsapp"></i> בקשו הצעת מחיר</a>') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- Cart ----
  function addToCart(productId, qty) {
    var quantity = qty || 1;
    var product = allProducts.find(function(p) { return p.id === productId; });
    if (!product) return;

    var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
    var existing = cart.find(function(item) { return item.id === productId; });

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.saleNis,
        unit: product.unit,
        imageUrl: product.imageUrl,
        slug: product.slug,
        quantity: quantity
      });
    }

    localStorage.setItem('ym_cart', JSON.stringify(cart));
    if (window.YMarket) {
      window.YMarket.updateCartBadge();
      window.YMarket.showToast('המוצר נוסף לעגלה');
    }

    // Facebook Pixel - AddToCart
    if (window.YMarketAnalytics && window.YMarketAnalytics.fbAddToCart) {
      window.YMarketAnalytics.fbAddToCart({ id: product.id, name: product.name, price: product.saleNis, quantity: quantity });
    }
    // GA4 - AddToCart
    if (window.YMarketAnalytics && window.YMarketAnalytics.trackAddToCart) {
      window.YMarketAnalytics.trackAddToCart({ id: product.id, name: product.name, price: product.saleNis, quantity: quantity });
    }
  }

  // ---- Escape HTML ----
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---- Format Price ----
  function formatPrice(price) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency', currency: 'ILS',
      minimumFractionDigits: 0, maximumFractionDigits: 2
    }).format(price);
  }

})();
