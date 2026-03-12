/**
 * Shared Header with Mega-Menu
 * Loads on all pages to provide consistent navigation with category dropdown
 */
(function() {
  'use strict';

  // Detect current page for active state
  var currentPath = window.location.pathname.replace(/\/$/, '').split('/').pop() || 'index';
  var isHome = currentPath === 'index' || currentPath === '' || window.location.pathname === '/';
  var isCatalog = currentPath === 'catalog';
  var isAbout = currentPath === 'about';
  var isBlog = currentPath === 'blog' || window.location.pathname.startsWith('/blog');
  var isContact = currentPath === 'contact';

  function getActiveClass(page) {
    if (page === 'index' && isHome) return ' active';
    if (page === 'catalog' && (isCatalog || window.location.pathname.startsWith('/category/'))) return ' active';
    if (page === 'about' && isAbout) return ' active';
    if (page === 'blog' && isBlog) return ' active';
    if (page === 'contact' && isContact) return ' active';
    return '';
  }

  // Default categories (fallback if products.json fails to load)
  var defaultCategories = [
    { name: 'בטיחות ומיגון אישי (PPE)', slug: 'בטיחות-ומיגון-אישי-PPE', seoSlug: 'safety-ppe-equipment-for-business', icon: 'fa-hard-hat', parentId: null, children: [] },
    { name: 'כלי עבודה וציוד משקי', slug: 'כלי-עבודה-וציוד-משקי', seoSlug: null, icon: 'fa-tools', parentId: null, children: [] },
    { name: 'שקיות ופתרונות אשפה', slug: 'שקיות-ופתרונות-אשפה', seoSlug: 'heavy-duty-garbage-bags-wholesale', icon: 'fa-trash-alt', parentId: null, children: [] },
    { name: 'חומרי ניקוי וכימיקלים', slug: 'חומרי-ניקוי-וכימיקלים', seoSlug: 'industrial-cleaning-supplies-wholesale', icon: 'fa-spray-can', parentId: null, children: [] },
    { name: 'אריזות מזון ו-Take Away', slug: 'אריזות-מזון-ו-Take-Away', seoSlug: 'food-packaging-delivery-solutions', icon: 'fa-box-open', parentId: null, children: [] },
    { name: 'טקסטיל, מטליות וסחבות', slug: 'טקסטיל-מטליות-וסחבות', seoSlug: 'professional-cleaning-cloths-microfiber', icon: 'fa-tshirt', parentId: null, children: [] },
    { name: 'חד פעמי ואירוח', slug: 'חד-פעמי-ואירוח', seoSlug: 'disposable-catering-food-service', icon: 'fa-utensils', parentId: null, children: [] },
    { name: 'עטיפה, אריזה ולוגיסטיקה', slug: 'עטיפה-אריזה-ולוגיסטיקה', seoSlug: null, icon: 'fa-tape', parentId: null, children: [] },
    { name: 'מוצרי נייר וניגוב', slug: 'מוצרי-נייר-וניגוב', seoSlug: 'bulk-paper-towel-office-supplies', icon: 'fa-toilet-paper', parentId: null, children: [] },
    { name: 'קפה, שתייה וכיבוד', slug: 'קפה-שתייה-וכיבוד', seoSlug: 'office-coffee-breakroom-supplies', icon: 'fa-coffee', parentId: null, children: [] },
    { name: 'ציוד משרדי וכללי', slug: 'ציוד-משרדי-וכללי', seoSlug: null, icon: 'fa-pen', parentId: null, children: [] },
    { name: 'ציוד טכני ואחזקה', slug: 'ציוד-טכני-ואחזקה', seoSlug: null, icon: 'fa-wrench', parentId: null, children: [] },
    { name: 'עזרה ראשונה - רפואי', slug: 'עזרה-ראשונה-רפואי', seoSlug: null, icon: 'fa-first-aid', parentId: null, children: [] },
    { name: 'טואלטיקה וטיפוח אישי', slug: 'טואלטיקה-וטיפוח-אישי', seoSlug: null, icon: 'fa-pump-soap', parentId: null, children: [] },
    { name: 'סטוק עד הבית', slug: 'סטוק-עד-הבית', seoSlug: null, icon: 'fa-home', parentId: null, children: [] },
  ];

  var iconMap = {
    'fa-box': 'fa-box',
    'fa-hard-hat': 'fa-hard-hat',
    'fa-tools': 'fa-tools',
    'fa-trash-alt': 'fa-trash-alt',
    'fa-spray-can': 'fa-spray-can',
    'fa-box-open': 'fa-box-open',
    'fa-tshirt': 'fa-tshirt',
    'fa-utensils': 'fa-utensils',
    'fa-toilet-paper': 'fa-toilet-paper',
    'fa-coffee': 'fa-coffee',
    'fa-pen': 'fa-pen',
    'fa-wrench': 'fa-wrench',
    'fa-first-aid': 'fa-first-aid',
    'fa-pump-soap': 'fa-pump-soap',
    'fa-tape': 'fa-tape',
    'fa-home': 'fa-home',
  };

  function getCatUrl(cat) {
    return '/category/' + (cat.seoSlug || cat.slug) + '/';
  }

  function buildTree(flatCats) {
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
    var sortFn = function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); };
    roots.sort(sortFn);
    roots.forEach(function(r) { r.children.sort(sortFn); });
    return roots;
  }

  function buildMegaMenuHtml(roots) {
    var html = '<div class="mega-menu"><div class="mega-menu__grid">';
    roots.forEach(function(cat) {
      var url = getCatUrl(cat);
      var icon = cat.icon || 'fa-box';
      var hasChildren = cat.children && cat.children.length > 0;

      html += '<div class="mega-menu__category-group">';
      html += '<a href="' + url + '" class="mega-menu__category">';
      html += '<i class="fas ' + icon + '"></i>';
      html += '<span class="mega-menu__cat-name">' + cat.name + '</span>';
      html += '</a>';

      if (hasChildren) {
        html += '<div class="mega-menu__subcats">';
        cat.children.forEach(function(child) {
          var childUrl = '/category/' + (cat.seoSlug || cat.slug) + '/' + (child.seoSlug || child.slug) + '/';
          html += '<a href="' + childUrl + '" class="mega-menu__subcat">' + child.name + '</a>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function injectHeader(roots) {
    var header = document.querySelector('header.header');
    if (!header) return;

    // Check if mega-menu already exists (e.g. homepage)
    if (header.querySelector('.mega-menu')) return;

    // Find the "מוצרים" nav item
    var navItems = header.querySelectorAll('.main-nav__item');
    var productsItem = null;
    navItems.forEach(function(item) {
      var link = item.querySelector('.main-nav__link');
      if (link && (link.getAttribute('href') === 'catalog' || link.getAttribute('href') === '/catalog')) {
        productsItem = item;
      }
    });

    if (!productsItem) return;

    // Add chevron icon if not present
    var link = productsItem.querySelector('.main-nav__link');
    if (link && !link.querySelector('.fa-chevron-down')) {
      link.innerHTML = link.textContent.trim() + ' <i class="fas fa-chevron-down"></i>';
    }

    // Build and inject mega-menu
    var megaHtml = buildMegaMenuHtml(roots);
    productsItem.insertAdjacentHTML('beforeend', megaHtml);
  }

  function applyActiveStates() {
    var navLinks = document.querySelectorAll('.main-nav__link');
    navLinks.forEach(function(link) {
      link.classList.remove('active');
      var href = (link.getAttribute('href') || '').replace(/^\//, '');
      if (getActiveClass(href).includes('active')) {
        link.classList.add('active');
      }
    });
  }

  // Load categories and build header
  function init() {
    applyActiveStates();

    fetch('/data/products.json')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var cats = data.categories || [];
        var roots = cats.length > 0 ? buildTree(cats) : defaultCategories;
        injectHeader(roots);
      })
      .catch(function() {
        injectHeader(defaultCategories);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
