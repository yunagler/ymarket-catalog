#!/usr/bin/env node
/**
 * Generate individual category HTML pages from products.json
 * Uses directory-based clean URLs: /category/{slug}/index.html
 * So URL is /category/{slug}/ (no .html extension)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CATEGORY_DIR = path.join(ROOT_DIR, 'category');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'products.json');
const SITE_URL = 'https://ymarket.co.il';

function formatPrice(price) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS',
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(price);
}

function generateCategoryPage(category, products, allCategories) {
  const categoryProducts = products.filter(p => p.categorySlug === category.slug);
  const categoryUrl = `${SITE_URL}/category/${category.slug}/`;

  const seoDesc = `${category.name} - ${categoryProducts.length} מוצרים במחירי סיטונאות. וואי מרקט - אספקה חכמה לעסקים ומוסדות. משלוח ארצי.`;

  const productsHtml = categoryProducts.map(p => {
    const imgSrc = p.imageUrl || `/items/${p.id}.jpg`;
    const hasPromo = p.productStatus === 'on_sale' && p.originalPrice;

    return `
    <div class="product-card">
      ${hasPromo ? `<div class="product-card__badge">${p.promotionLabel || 'מבצע'}</div>` : ''}
      <div class="product-card__image">
        <a href="/products/${p.slug}/">
          <img src="${imgSrc}" alt="${p.name}" loading="lazy"
               onerror="this.src='https://placehold.co/300x300/f0f2f5/5a6577?text=${encodeURIComponent((p.name || '').substring(0,15))}'">
        </a>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name"><a href="/products/${p.slug}/">${p.name}</a></h3>
        ${p.unit ? `<div class="product-card__unit">${p.unitsPerPack > 1 ? p.unitsPerPack + ' ' : ''}${p.unit}</div>` : ''}
        ${p.saleNis
          ? hasPromo
            ? `<div class="product-card__price" style="color:#dc2626">${formatPrice(p.saleNis)}</div><div style="text-decoration:line-through;color:#9ca3af;font-size:0.85rem">${formatPrice(p.originalPrice)}</div>`
            : `<div class="product-card__price">${formatPrice(p.saleNis)}</div>`
          : '<div class="product-card__price">צרו קשר</div>'
        }
      </div>
    </div>`;
  }).join('\n');

  const sidebarHtml = allCategories
    .filter(c => c.slug !== category.slug)
    .map(c => `<a href="/category/${c.slug}/" class="category-list__item"><span>${c.name}</span><span class="category-list__count">${c.itemCount}</span></a>`)
    .join('\n');

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": seoDesc,
    "url": categoryUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "וואי מרקט",
      "url": SITE_URL
    },
    "numberOfItems": categoryProducts.length,
    "mainEntity": {
      "@type": "ItemList",
      "name": category.name,
      "numberOfItems": categoryProducts.length,
      "itemListElement": categoryProducts.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${SITE_URL}/products/${p.slug}/`,
        "name": p.name,
      }))
    }
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${category.name} | וואי מרקט - אספקה למוסדות ועסקים</title>
  <meta name="description" content="${seoDesc}">
  <link rel="canonical" href="${categoryUrl}">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#1B3A5C">
  <meta property="og:title" content="${category.name} | וואי מרקט">
  <meta property="og:description" content="${seoDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${categoryUrl}">
  <meta property="og:locale" content="he_IL">
  <meta property="og:site_name" content="וואי מרקט">
  <meta property="og:image" content="${SITE_URL}/images/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${category.name} | וואי מרקט">
  <meta name="twitter:image" content="${SITE_URL}/images/og-image.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="/css/style.min.css">
  <link rel="stylesheet" href="/css/pages/catalog.min.css">
  <script type="application/ld+json">${jsonLd}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "דף הבית", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": "מוצרים", "item": SITE_URL + "/catalog.html" },
      { "@type": "ListItem", "position": 3, "name": category.name }
    ]
  })}</script>
</head>
<body>
  <div class="top-bar"><div class="container"><div class="top-bar__info"><div class="top-bar__item"><i class="fas fa-phone-alt"></i> <a href="tel:0549922492">054-992-2492</a></div><div class="top-bar__item"><i class="fas fa-envelope"></i> <a href="mailto:naglertradesystem@gmail.com">naglertradesystem@gmail.com</a></div></div><div class="top-bar__social"><a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a></div></div></div>

  <header class="header"><div class="container">
    <a href="/" class="header__logo"><img src="/images/logo/logo-hebrew-dark.png" alt="וואי מרקט" width="180" height="48"></a>
    <nav class="main-nav" aria-label="ניווט ראשי">
      <div class="main-nav__item"><a href="/" class="main-nav__link">דף הבית</a></div>
      <div class="main-nav__item"><a href="/catalog.html" class="main-nav__link">מוצרים</a></div>
      <div class="main-nav__item"><a href="/about.html" class="main-nav__link">אודות</a></div>
      <div class="main-nav__item"><a href="/blog.html" class="main-nav__link">בלוג</a></div>
      <div class="main-nav__item"><a href="/contact.html" class="main-nav__link">צרו קשר</a></div>
    </nav>
    <div class="header__actions">
      <button class="header__cart-btn" aria-label="עגלת קניות"><i class="fas fa-shopping-cart"></i><span class="cart-count">0</span></button>
      <a href="/login.html" class="header__login-btn"><i class="fas fa-user"></i> <span>כניסה</span></a>
    </div>
    <button class="mobile-menu-btn" aria-label="תפריט" aria-expanded="false"><i class="fas fa-bars"></i></button>
  </div></header>
  <div class="mobile-overlay"></div>

  <div class="container">
    <nav class="breadcrumb" aria-label="ניווט פירורי לחם">
      <a href="/">דף הבית</a>
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <a href="/catalog.html">מוצרים</a>
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <span class="breadcrumb__current">${category.name}</span>
    </nav>
  </div>

  <section class="section">
    <div class="container">
      <div class="catalog-layout">
        <aside class="catalog-sidebar">
          <div class="sidebar-section">
            <h3>קטגוריות</h3>
            <div class="category-list">
              <a href="/category/${category.slug}/" class="category-list__item active"><span>${category.name}</span><span class="category-list__count">${categoryProducts.length}</span></a>
              ${sidebarHtml}
              <a href="/catalog.html" class="category-list__item"><span>כל המוצרים</span></a>
            </div>
          </div>
        </aside>
        <div class="catalog-main">
          <div class="catalog-header">
            <h1>${category.name}</h1>
            <p>${categoryProducts.length} מוצרים</p>
          </div>
          <div class="products-grid">
            ${productsHtml}
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer"><div class="container">
    <div class="footer__grid">
      <div class="footer__brand"><img src="/images/logo/logo-hebrew-white.png" alt="וואי מרקט" width="160" height="40"><p>נגלר סחר והפצה — מוצרי צריכה שוטפת לעסקים ומוסדות.</p></div>
      <div class="footer__col"><h4>קישורים</h4><div class="footer__links"><a href="/about.html">אודות</a><a href="/faq.html">שאלות ותשובות</a><a href="/contact.html">צרו קשר</a></div></div>
      <div class="footer__col"><h4>צרו קשר</h4><div class="footer__contact-item"><i class="fas fa-phone-alt"></i><a href="tel:0549922492">054-992-2492</a></div><div class="footer__contact-item"><i class="fas fa-envelope"></i><a href="mailto:naglertradesystem@gmail.com">naglertradesystem@gmail.com</a></div></div>
    </div>
    <div class="footer__bottom"><span class="footer__copyright">&copy; 2026 וואי מרקט. כל הזכויות שמורות.</span><div class="footer__legal"><a href="/legal/terms.html">תקנון</a><a href="/legal/privacy.html">פרטיות</a><a href="/legal/accessibility.html">נגישות</a></div></div>
  </div></footer>

  <a href="https://wa.me/972549922492" class="whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
  <script src="/js/main.min.js"></script>
</body>
</html>`;
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanDir(full);
      fs.rmdirSync(full);
    } else {
      fs.unlinkSync(full);
    }
  }
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`Error: ${DATA_PATH} not found.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const products = data.items || [];
  const categories = data.categories || [];

  if (categories.length === 0) {
    console.log('No categories found.');
    return;
  }

  // Clean category directory completely
  if (fs.existsSync(CATEGORY_DIR)) {
    cleanDir(CATEGORY_DIR);
  }

  // Generate each category page as /category/{slug}/index.html
  let count = 0;
  for (const category of categories) {
    if (!category.slug) continue;
    const html = generateCategoryPage(category, products, categories);
    const slugDir = path.join(CATEGORY_DIR, category.slug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf-8');
    count++;
  }

  console.log(`Generated ${count} category pages in ${CATEGORY_DIR}`);
}

main();
