/* ===========================================
   Y Market - Catalog Page
   Product filtering, search, cart
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
      buildCategoryList();
    } catch (e) {
      console.warn('Could not load products.json, using sample data');
      loadSampleData();
      buildCategoryList();
    }
  }

  // ---- Sample data for development ----
  function loadSampleData() {
    categories = [
      { id: 1, name: 'בטיחות ומיגון אישי', slug: 'בטיחות-ומיגון-אישי-PPE', icon: 'fa-hard-hat', itemCount: 12 },
      { id: 2, name: 'כלי עבודה וציוד משקי', slug: 'כלי-עבודה-וציוד-משקי', icon: 'fa-tools', itemCount: 15 },
      { id: 3, name: 'שקיות ופתרונות אשפה', slug: 'שקיות-ופתרונות-אשפה', icon: 'fa-trash-alt', itemCount: 8 },
      { id: 4, name: 'חומרי ניקוי וכימיקלים', slug: 'חומרי-ניקוי-וכימיקלים', icon: 'fa-spray-can', itemCount: 20 },
      { id: 5, name: 'אריזות מזון ו-Take Away', slug: 'אריזות-מזון-ו-Take-Away', icon: 'fa-box-open', itemCount: 18 },
      { id: 6, name: 'טקסטיל, מטליות וסחבות', slug: 'טקסטיל-מטליות-וסחבות', icon: 'fa-tshirt', itemCount: 10 },
      { id: 7, name: 'חד פעמי ואירוח', slug: 'חד-פעמי-ואירוח', icon: 'fa-utensils', itemCount: 22 },
      { id: 9, name: 'מוצרי נייר וניגוב', slug: 'מוצרי-נייר-וניגוב', icon: 'fa-toilet-paper', itemCount: 25 },
      { id: 10, name: 'קפה, שתייה וכיבוד', slug: 'קפה-שתייה-וכיבוד', icon: 'fa-coffee', itemCount: 14 },
      { id: 11, name: 'ציוד משרדי וכללי', slug: 'ציוד-משרדי-וכללי', icon: 'fa-pen', itemCount: 8 },
      { id: 13, name: 'עזרה ראשונה - רפואי', slug: 'עזרה-ראשונה-רפואי', icon: 'fa-first-aid', itemCount: 6 },
      { id: 17, name: 'טואלטיקה וטיפוח', slug: 'טואלטיקה-וטיפוח-אישי', icon: 'fa-pump-soap', itemCount: 7 }
    ];

    // Sample products
    const samples = [
      { name: 'נייר טואלט הרקולס 48 גלילים', slug: 'toilet-paper-hercules-48', saleNis: 89.90, categorySlug: 'מוצרי-נייר-וניגוב', unit: 'שק', unitsPerPack: 48 },
      { name: 'מגבות נייר אוורסט 6 גלילים', slug: 'paper-towels-everest-6', saleNis: 45.00, categorySlug: 'מוצרי-נייר-וניגוב', unit: 'חבילה', unitsPerPack: 6 },
      { name: 'סבון ידיים נוזלי 5 ליטר', slug: 'hand-soap-5l', saleNis: 32.00, categorySlug: 'חומרי-ניקוי-וכימיקלים', unit: 'מיכל', unitsPerPack: 1 },
      { name: 'נוזל כלים מרוכז 4 ליטר', slug: 'dish-soap-4l', saleNis: 28.00, categorySlug: 'חומרי-ניקוי-וכימיקלים', unit: 'מיכל', unitsPerPack: 1 },
      { name: 'צלחות חד פעמיות 100 יח', slug: 'disposable-plates-100', saleNis: 19.90, categorySlug: 'חד-פעמי-ואירוח', unit: 'חבילה', unitsPerPack: 100 },
      { name: 'כוסות פלסטיק 200 מ"ל 100 יח', slug: 'plastic-cups-200ml', saleNis: 15.00, categorySlug: 'חד-פעמי-ואירוח', unit: 'שרוול', unitsPerPack: 100 },
      { name: 'מטליות מיקרופייבר 10 יח', slug: 'microfiber-cloths-10', saleNis: 35.00, categorySlug: 'טקסטיל-מטליות-וסחבות', unit: 'חבילה', unitsPerPack: 10 },
      { name: 'שקיות אשפה 75x90 שחור', slug: 'trash-bags-75x90', saleNis: 22.00, categorySlug: 'שקיות-ופתרונות-אשפה', unit: 'גליל', unitsPerPack: 25 },
      { name: 'כפפות ניטריל M 100 יח', slug: 'nitrile-gloves-m-100', saleNis: 29.90, categorySlug: 'בטיחות-ומיגון-אישי-PPE', unit: 'קופסה', unitsPerPack: 100 },
      { name: 'קפה שחור טורקי 200 גר', slug: 'turkish-coffee-200g', saleNis: 18.00, categorySlug: 'קפה-שתייה-וכיבוד', unit: 'חבילה', unitsPerPack: 1 },
      { name: 'קופסאות מזון Take Away 50 יח', slug: 'takeaway-boxes-50', saleNis: 42.00, categorySlug: 'אריזות-מזון-ו-Take-Away', unit: 'חבילה', unitsPerPack: 50 },
      { name: 'נייר תעשייתי 6 גלילים', slug: 'industrial-paper-6', saleNis: 65.00, categorySlug: 'מוצרי-נייר-וניגוב', unit: 'שק', unitsPerPack: 6 },
    ];

    allProducts = samples.map((p, i) => ({
      id: i + 1,
      ...p,
      categoryName: categories.find(c => c.slug === p.categorySlug)?.name || '',
      imageUrl: `images/products/${i + 1}.jpg`,
      isFeatured: i < 4,
      productStatus: i === 0 ? 'recommended' : 'active'
    }));
  }

  // ---- Build Category Tree from flat list ----
  function buildCategoryTree(flatCats) {
    var map = {};
    flatCats.forEach(function(c) { map[c.id] = Object.assign({}, c, { children: [] }); });
    var roots = [];
    Object.keys(map).forEach(function(id) {
      var cat = map[id];
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(cat);
      } else {
        roots.push(cat);
      }
    });
    // Sort by sortOrder
    var sortFn = function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); };
    roots.sort(sortFn);
    roots.forEach(function(r) { r.children.sort(sortFn); });
    return roots;
  }

  // ---- Build Category Sidebar ----
  function buildCategoryList() {
    const list = document.getElementById('categoryList');
    if (!list) return;

    const totalBtn = list.querySelector('[data-category="all"]');
    if (totalBtn) {
      const count = totalBtn.querySelector('.category-list__count');
      if (count) count.textContent = allProducts.length;
    }

    const tree = buildCategoryTree(categories);

    function renderNode(cat, depth) {
      const itemCount = allProducts.filter(p => p.categorySlug === cat.slug || (p.categorySlugs && p.categorySlugs.includes(cat.slug))).length;
      const hasChildren = cat.children && cat.children.length > 0;

      const link = document.createElement('a');
      link.className = 'category-list__item';
      link.href = `/category/${cat.slug}/`;
      link.dataset.category = cat.slug;
      if (depth > 0) {
        link.style.paddingRight = (16 + depth * 16) + 'px';
        link.style.fontSize = '0.9em';
      }

      let inner = '';
      if (hasChildren) {
        inner += '<i class="fas fa-chevron-down" style="font-size:0.6em;margin-left:4px;transition:transform 0.2s;transform:rotate(90deg);"></i>';
      }
      inner += `<span>${cat.name}</span><span class="category-list__count">${itemCount}</span>`;
      link.innerHTML = inner;
      list.appendChild(link);

      if (hasChildren) {
        const childContainer = document.createElement('div');
        childContainer.className = 'category-children';
        childContainer.style.display = 'none';
        childContainer.style.borderRight = '2px solid #e5e7eb';
        childContainer.style.marginRight = '12px';

        // Toggle on parent click
        link.addEventListener('click', function(e) {
          if (childContainer.style.display === 'none') {
            childContainer.style.display = '';
            var icon = link.querySelector('.fa-chevron-down');
            if (icon) icon.style.transform = '';
          } else {
            e.preventDefault();
            childContainer.style.display = 'none';
            var icon2 = link.querySelector('.fa-chevron-down');
            if (icon2) icon2.style.transform = 'rotate(90deg)';
          }
        });

        list.appendChild(childContainer);
        const origParent = list;
        // Temporarily redirect appends to childContainer
        cat.children.forEach(function(child) {
          renderNodeInto(child, depth + 1, childContainer);
        });
      }
    }

    function renderNodeInto(cat, depth, container) {
      const itemCount = allProducts.filter(p => p.categorySlug === cat.slug || (p.categorySlugs && p.categorySlugs.includes(cat.slug))).length;
      const hasChildren = cat.children && cat.children.length > 0;

      const link = document.createElement('a');
      link.className = 'category-list__item';
      link.href = `/category/${cat.slug}/`;
      link.dataset.category = cat.slug;
      link.style.paddingRight = (16 + depth * 16) + 'px';
      link.style.fontSize = '0.9em';

      let inner = '';
      if (hasChildren) {
        inner += '<i class="fas fa-chevron-down" style="font-size:0.6em;margin-left:4px;transition:transform 0.2s;transform:rotate(90deg);"></i>';
      }
      inner += `<span>${cat.name}</span><span class="category-list__count">${itemCount}</span>`;
      link.innerHTML = inner;
      container.appendChild(link);

      if (hasChildren) {
        const childContainer = document.createElement('div');
        childContainer.className = 'category-children';
        childContainer.style.display = 'none';
        childContainer.style.borderRight = '2px solid #e5e7eb';
        childContainer.style.marginRight = '12px';

        link.addEventListener('click', function(e) {
          if (childContainer.style.display === 'none') {
            childContainer.style.display = '';
            var icon = link.querySelector('.fa-chevron-down');
            if (icon) icon.style.transform = '';
          } else {
            e.preventDefault();
            childContainer.style.display = 'none';
            var icon2 = link.querySelector('.fa-chevron-down');
            if (icon2) icon2.style.transform = 'rotate(90deg)';
          }
        });

        container.appendChild(childContainer);
        cat.children.forEach(function(child) {
          renderNodeInto(child, depth + 1, childContainer);
        });
      }
    }

    tree.forEach(function(cat) { renderNode(cat, 0); });

    document.getElementById('totalCount').textContent = allProducts.length;
  }

  // ---- Event Listeners ----
  function setupEventListeners() {
    // Category click
    document.getElementById('categoryList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-list__item');
      if (!btn) return;
      e.preventDefault();
      const slug = btn.dataset.category;
      if (slug && slug !== 'all') {
        window.location.href = '/category/' + slug + '/';
      } else {
        document.querySelectorAll('.category-list__item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = 'all';
        const url = new URL(window.location);
        url.searchParams.delete('cat');
        history.pushState(null, '', url);
        updateTitle();
        render();
      }
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        render();
      }, 300);
    });

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      render();
    });

    // Price filter
    document.getElementById('priceFilterBtn')?.addEventListener('click', () => {
      priceMin = Math.max(0, parseFloat(document.getElementById('priceMin').value) || 0);
      priceMax = Math.max(0, parseFloat(document.getElementById('priceMax').value) || Infinity);
      render();
    });

    // Mobile filter toggle
    const sidebar = document.getElementById('catalogSidebar');
    const overlay = document.getElementById('catalogOverlay');
    const openSidebar = () => {
      sidebar?.classList.add('open');
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    const closeSidebar = () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('active');
      document.body.style.overflow = '';
    };
    document.getElementById('mobileFilterBtn')?.addEventListener('click', openSidebar);
    document.getElementById('closeSidebar')?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);
  }

  // ---- URL Params ----
  function applyURLParams() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    const search = params.get('search');

    // Redirect old ?cat= URLs to /category/ clean URLs
    if (cat) {
      window.location.replace('/category/' + encodeURIComponent(cat) + '/');
      return;
    }

    if (search) {
      // Sanitize search input from URL
      currentSearch = search.replace(/[<>"']/g, '');
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = currentSearch;
    }
  }

  // ---- Update Title ----
  function updateTitle() {
    const titleEl = document.getElementById('catalogTitle');
    if (!titleEl) return;
    if (currentCategory === 'all') {
      titleEl.textContent = 'כל המוצרים';
    } else {
      const cat = categories.find(c => c.slug === currentCategory);
      titleEl.textContent = cat ? cat.name : 'מוצרים';
    }
  }

  // ---- Filter & Sort ----
  function getFilteredProducts() {
    let filtered = allProducts;

    // Category filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.categorySlug === currentCategory || (p.categorySlugs && p.categorySlugs.includes(currentCategory)));
    }

    // Search
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.searchTags || '').toLowerCase().includes(q) ||
        (p.partNumber || '').toLowerCase().includes(q)
      );
    }

    // Price range
    filtered = filtered.filter(p => {
      const price = p.saleNis || 0;
      return price >= priceMin && price <= priceMax;
    });

    // Sort
    filtered.sort((a, b) => {
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

  // ---- Render Products ----
  function render() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('resultCount');
    if (!grid) return;

    const products = getFilteredProducts();
    countEl.textContent = products.length;

    if (products.length === 0) {
      grid.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    grid.innerHTML = products.map(p => renderProductCard(p)).join('');

    // Attach quantity +/- events
    grid.querySelectorAll('.product-card__qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const input = document.getElementById('qty-' + id);
        if (!input) return;
        let val = parseInt(input.value) || 1;
        if (btn.dataset.action === 'increase') val++;
        else if (val > 1) val--;
        input.value = val;
      });
    });

    // Attach add-to-cart events
    grid.querySelectorAll('.product-card__add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt(btn.dataset.id);
        const input = document.getElementById('qty-' + id);
        const qty = input ? Math.max(1, parseInt(input.value) || 1) : 1;
        addToCart(id, qty);
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> נוסף';
        setTimeout(() => {
          btn.classList.remove('added');
          btn.innerHTML = '<i class="fas fa-cart-plus"></i> הוסף לעגלה';
        }, 1500);
        if (input) input.value = '1';
      });
    });
  }

  // ---- Product Card HTML ----
  function renderProductCard(p) {
    const price = p.saleNis ? formatPrice(p.saleNis) : '';
    const perUnit = p.saleNis && p.unitsPerPack > 1
      ? `${formatPrice(p.saleNis / p.unitsPerPack)} ליחידה`
      : '';

    // Promotion support
    const hasPromo = p.productStatus === 'on_sale' && p.originalPrice;
    const promoLabel = p.promotionLabel || 'מבצע';
    const discountText = p.discountPercent ? `${Math.round(p.discountPercent)}%-` : '';

    let badgeHtml = '';
    if (hasPromo) {
      badgeHtml = `<span class="product-card__badge product-card__badge--sale">${discountText || promoLabel}</span>`;
    } else if (p.productStatus === 'on_sale') {
      badgeHtml = '<span class="product-card__badge product-card__badge--sale">מבצע</span>';
    } else if (p.productStatus === 'recommended') {
      badgeHtml = '<span class="product-card__badge product-card__badge--recommended">מומלץ</span>';
    } else if (p.productStatus === 'new') {
      badgeHtml = '<span class="product-card__badge product-card__badge--new">חדש</span>';
    } else if (p.productStatus === 'clearance') {
      badgeHtml = '<span class="product-card__badge product-card__badge--sale">חיסול</span>';
    }

    // Price display with strikethrough for promotions
    let priceHtml = '';
    if (price) {
      if (hasPromo) {
        priceHtml = `
          <div class="product-card__price product-card__price--sale">${price}</div>
          <div class="product-card__price-original">${formatPrice(p.originalPrice)}</div>
        `;
      } else {
        priceHtml = `<div class="product-card__price">${price}</div>`;
      }
    } else {
      priceHtml = '<div class="product-card__price" style="color:var(--color-text-light)">צרו קשר למחיר</div>';
    }

    const productUrl = p.slug ? '/products/' + encodeURIComponent(p.slug) + '/' : '#';
    const imgSrc = p.imageUrl || 'images/products/placeholder.jpg';
    const safeName = escapeHtml(p.name);
    const safeCategoryName = escapeHtml(p.categoryName || '');
    const fallbackImg = 'https://placehold.co/300x300/f0f2f5/5a6577?text=' + encodeURIComponent((p.name || 'מוצר').substring(0, 15));

    return `
      <div class="product-card" data-fallback="${fallbackImg}">
        <div class="product-card__image">
          <a href="${productUrl}" aria-label="${safeName}">
            <img src="${imgSrc}" alt="${safeName}" loading="lazy"
                 onerror="this.onerror=null;this.src=this.closest('.product-card').dataset.fallback;">
          </a>
          ${badgeHtml}
        </div>
        <div class="product-card__body">
          <div class="product-card__category">${safeCategoryName}</div>
          <h3 class="product-card__name"><a href="${productUrl}">${safeName}</a></h3>
          ${p.unit ? `<div class="product-card__pack">${p.unitsPerPack || ''} ${p.unit || ''}</div>` : ''}
          <div class="product-card__pricing">
            ${priceHtml}
            ${perUnit ? `<div class="product-card__price-unit">${perUnit}</div>` : ''}
          </div>
          <div class="product-card__actions">
            ${price ? `
              <div class="product-card__qty-row">
                <div class="product-card__qty-selector">
                  <button class="product-card__qty-btn" data-action="decrease" data-id="${p.id}">-</button>
                  <input type="number" class="product-card__qty-input" id="qty-${p.id}" value="1" min="1" max="999">
                  <button class="product-card__qty-btn" data-action="increase" data-id="${p.id}">+</button>
                </div>
                <button class="product-card__add-btn" data-id="${p.id}"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>
              </div>
            ` : `<a href="https://wa.me/972549922492?text=היי, מתעניין ב${encodeURIComponent(p.name)}" class="product-card__add-btn" target="_blank"><i class="fab fa-whatsapp"></i> בקשו הצעת מחיר</a>`}
          </div>
        </div>
      </div>
    `;
  }

  // ---- Cart ----
  function addToCart(productId, qty) {
    var quantity = qty || 1;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
    const existing = cart.find(item => item.id === productId);

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
    window.YMarket?.updateCartBadge();
    window.YMarket?.showToast('המוצר נוסף לעגלה');
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
