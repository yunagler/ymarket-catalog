#!/usr/bin/env node
/**
 * Generate individual product HTML pages from products.json
 * Uses directory-based clean URLs: /products/{slug}/index.html
 * So URL is /products/{slug}/ (no .html extension)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PRODUCTS_DIR = path.join(ROOT_DIR, 'products');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'products.json');
const SITE_URL = 'https://ymarket.co.il';

function formatPrice(price) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS',
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(price);
}

// Footer category IDs and display names (top-level categories to show in footer)
const FOOTER_CATEGORIES = [
  { id: 9, label: 'מוצרי נייר וניגוב' },
  { id: 4, label: 'חומרי ניקוי' },
  { id: 7, label: 'חד פעמי ואירוח' },
  { id: 5, label: 'אריזות Take Away' },
  { id: 10, label: 'קפה, שתייה וכיבוד' },
  { id: 1, label: 'בטיחות ומיגון' },
];

function buildFooterCategoryLinks(categories) {
  return FOOTER_CATEGORIES.map(fc => {
    const cat = categories.find(c => c.id === fc.id);
    const slug = cat ? (cat.seoSlug || cat.slug) : `cat-${fc.id}`;
    return `<a href="/category/${slug}/">${fc.label}</a>`;
  }).join('');
}

// Resolve the correct category URL path using seoSlug when available
function getCategoryUrl(product, categories) {
  if (!product.categorySlug) return '/catalog';
  // Find the category in the data
  const cat = categories.find(c => c.slug === product.categorySlug);
  if (cat && cat.seoSlug) {
    // Build parent chain for nested categories
    const slugs = [];
    let current = cat;
    while (current && current.parentId) {
      const parent = categories.find(c => c.id === current.parentId);
      if (parent) {
        slugs.unshift(parent.seoSlug || parent.slug);
        current = parent;
      } else break;
    }
    slugs.push(cat.seoSlug);
    return '/category/' + slugs.join('/') + '/';
  }
  return '/category/' + product.categorySlug + '/';
}

// Build full parent chain for a category (for breadcrumbs)
function getParentChain(cat, categories) {
  const chain = [];
  let current = cat;
  while (current && current.parentId) {
    const parent = categories.find(c => c.id === current.parentId);
    if (parent) {
      chain.unshift(parent);
      current = parent;
    } else break;
  }
  return chain;
}

// Get full category URL path including all ancestors
function getFullCategoryUrl(cat, categories) {
  const chain = getParentChain(cat, categories);
  const slugs = chain.map(c => c.seoSlug || c.slug);
  slugs.push(cat.seoSlug || cat.slug);
  return '/category/' + slugs.join('/') + '/';
}

function generateProductPage(product, categories, allProducts) {
  const price = product.saleNis ? formatPrice(product.saleNis) : '';
  const unitLabel = product.unit || 'יחידה';
  const perUnit = product.saleNis && product.unitsPerPack > 1
    ? `${formatPrice(product.saleNis / product.unitsPerPack)} ל${unitLabel}`
    : '';
  const hasPromo = product.productStatus === 'on_sale' && product.originalPrice;
  const promoLabel = product.promotionLabel || 'מבצע';
  const categoryName = product.categoryName || '';
  // Use primary category (first in categorySlugs or categorySlug) for canonical breadcrumb
  const primaryCatSlug = product.categorySlug;
  const primaryCat = categories.find(c => c.slug === primaryCatSlug);
  const categoryUrl = primaryCat ? getFullCategoryUrl(primaryCat, categories) : getCategoryUrl(product, categories);
  const parentChain = primaryCat ? getParentChain(primaryCat, categories) : [];
  const imgSrc = product.imageUrl || `/items/${product.id}.jpg`;
  const canonicalSlug = product.seoSlug || product.slug;
  const productUrl = `${SITE_URL}/products/${canonicalSlug}/`;

  // SEO overrides from products.json
  const seo = product.seo || {};
  const pageTitle = seo.title || `${product.name} | וואי מרקט`;
  const h1Text = seo.h1 || product.name;
  const metaDesc = seo.metaDesc || `${product.name} - ${categoryName}. מחירי סיטונאות, משלוח ארצי. וואי מרקט - אספקה לעסקים ומוסדות.`;
  const ogDesc = seo.metaDesc || `${product.name} - ${categoryName}. מחירי סיטונאות, משלוח ארצי.`;
  const specsHtml = (seo.specs && seo.specs.length > 0)
    ? `<div class="product-specs" style="margin: 1.5rem 0;">
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
          ${seo.specs.map(s => `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 0;font-weight:600;color:var(--color-text,#1f2937);width:40%;">${s.label}</td><td style="padding:8px 0;">${s.value}</td></tr>`).join('')}
        </table>
      </div>` : '';
  const bulkCtaHtml = seo.bulkCta
    ? `<div class="product-bulk-cta" style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-top:1rem;">
        <p style="margin:0 0 8px;font-weight:600;color:var(--color-text,#1f2937);"><i class="fas fa-boxes" style="color:var(--color-primary,#1B3A5C);margin-left:6px;"></i> ${seo.bulkCta.title || 'צריכים כמות גדולה?'}</p>
        <p style="margin:0 0 12px;font-size:0.9rem;color:var(--color-text-secondary,#4b5563);">${seo.bulkCta.text || 'קבלו הצעת מחיר מותאמת עם הנחת כמות'}</p>
        <a href="https://wa.me/972549922492?text=${encodeURIComponent(seo.bulkCta.waText || 'היי, אני מעוניין בהצעת מחיר ל' + product.name + ' בכמות גדולה')}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#25D366;color:#fff;padding:8px 20px;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.95rem;"><i class="fab fa-whatsapp"></i> בקשו הצעת מחיר</a>
      </div>` : '';

  const geoContentHtml = seo.geoContent
    ? `<div class="product-geo-content" style="margin-top:1.5rem;padding:24px;background:linear-gradient(135deg,#f8fafc 0%,#f0f4f8 100%);border:1px solid #e2e8f0;border-radius:14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <div style="width:28px;height:28px;border-radius:8px;background:#1B3A5C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">E</div>
          <span style="font-size:0.85rem;font-weight:600;color:#1B3A5C;">מידע מקצועי</span>
        </div>
        <div style="font-size:0.9rem;line-height:1.8;color:#374151;">${seo.geoContent}</div>
      </div>` : '';

  const faqsHtml = (seo.faqs && seo.faqs.length > 0)
    ? `<div class="product-faq" style="margin-top:1.5rem;">
        <h3 style="font-size:1.05rem;font-weight:700;color:#1B3A5C;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><i class="fas fa-question-circle" style="color:#2563eb;"></i> שאלות נפוצות</h3>
        ${seo.faqs.map(f => `
          <details style="margin-bottom:8px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <summary style="padding:12px 16px;cursor:pointer;font-weight:600;font-size:0.9rem;color:#1f2937;list-style:none;display:flex;align-items:center;justify-content:space-between;">
              ${f.question}
              <i class="fas fa-chevron-down" style="font-size:0.7rem;color:#9ca3af;transition:transform 0.2s;"></i>
            </summary>
            <div style="padding:0 16px 14px;font-size:0.88rem;color:#4b5563;line-height:1.7;">${f.answer}</div>
          </details>
        `).join('')}
      </div>` : '';

  // Related products from same category
  const related = allProducts
    .filter(p => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  const relatedHtml = related.map(p => `
    <div class="product-card" style="min-width: 220px;">
      <div class="product-card__image">
        <a href="/products/${p.slug}/" aria-label="${p.name}">
          <img src="${p.imageUrl || '/items/' + p.id + '.jpg'}" alt="${p.name}" loading="lazy"
               onerror="this.src='https://placehold.co/300x300/f0f2f5/5a6577?text=${encodeURIComponent((p.name || '').substring(0,15))}'">
        </a>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name"><a href="/products/${p.slug}/">${p.name}</a></h3>
        ${p.saleNis ? `<div class="product-card__price">${formatPrice(p.saleNis)}</div>` : ''}
      </div>
    </div>
  `).join('');

  const productDescription = product.description || `${product.name} - ${categoryName}`;
  const schemaDescription = seo.isB2BBulk ? `סיטונאות / Wholesale - ${productDescription}` : productDescription;
  // priceValidUntil - end of current year (Google requires this)
  const priceValidUntil = new Date().getFullYear() + '-12-31';
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": schemaDescription,
    "image": `${SITE_URL}${product.imageUrl || '/items/' + product.id + '.jpg'}`,
    "url": productUrl,
    "brand": { "@type": "Brand", "name": "וואי מרקט" },
    "category": categoryName,
    ...(product.partNumber ? { "sku": product.partNumber } : {}),
    ...(seo.gtin ? { "gtin": seo.gtin } : {}),
    ...(seo.mpn ? { "mpn": seo.mpn } : {}),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": {
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "author": { "@type": "Organization", "name": "וואי מרקט - צוות מקצועי" },
      "reviewBody": "מוצר איכותי ומתאים לשימוש מוסדי ועסקי. עומד בסטנדרטים הגבוהים ביותר."
    },
    ...(product.saleNis ? {
      "offers": {
        "@type": "Offer",
        "price": product.saleNis,
        "priceCurrency": "ILS",
        "availability": "https://schema.org/InStock",
        "priceValidUntil": priceValidUntil,
        "url": productUrl,
        "seller": { "@type": "Organization", "name": "וואי מרקט - נגלר סחר והפצה" },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "ILS"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "IL"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 1,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "DAY"
            }
          }
        },
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "IL",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 14,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        }
      }
    } : {})
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${productUrl}">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#1B3A5C">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:type" content="product">
  <meta property="og:image" content="${SITE_URL}${product.imageUrl || '/items/' + product.id + '.jpg'}">
  <meta property="og:url" content="${productUrl}">
  <meta property="og:locale" content="he_IL">
  <meta property="og:site_name" content="וואי מרקט">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${ogDesc}">
  <meta name="twitter:image" content="${SITE_URL}${product.imageUrl || '/items/' + product.id + '.jpg'}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="/css/style.min.css">
  <link rel="stylesheet" href="/css/pages/product-detail.min.css?v=20260310">
  <script type="application/ld+json">${jsonLd}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "דף הבית", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": "מוצרים", "item": SITE_URL + "/catalog" },
      ...parentChain.map((ancestor, i) => ({
        "@type": "ListItem", "position": 3 + i, "name": ancestor.name,
        "item": SITE_URL + getFullCategoryUrl(ancestor, categories)
      })),
      ...(primaryCat ? [{ "@type": "ListItem", "position": 3 + parentChain.length, "name": primaryCat.name, "item": SITE_URL + categoryUrl }] : []),
      { "@type": "ListItem", "position": 3 + parentChain.length + (primaryCat ? 1 : 0), "name": product.name }
    ]
  })}</script>
  ${(seo.faqs && seo.faqs.length > 0) ? `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seo.faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer }
    }))
  })}</script>` : ''}
</head>
<body>
  <div class="top-bar"><div class="container"><div class="top-bar__info"><div class="top-bar__item"><i class="fas fa-phone-alt"></i> <a href="tel:037740400">03-7740400</a></div><div class="top-bar__item"><i class="fas fa-envelope"></i> <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div><div class="top-bar__item"><i class="fas fa-clock"></i> <span>א'-ה' 08:00-17:00</span></div></div><div class="top-bar__social"><a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a><a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a><a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></div></div></div>

  <header class="header"><div class="container">
    <a href="/" class="header__logo"><img src="/images/logo/logo-dark.png" alt="וואי מרקט" width="98" height="52"></a>
    <nav class="main-nav" aria-label="ניווט ראשי">
      <div class="main-nav__item"><a href="/" class="main-nav__link" data-nav="home">דף הבית</a></div>
      <div class="main-nav__item">
        <a href="/catalog" class="main-nav__link" data-nav="catalog">מוצרים <i class="fas fa-chevron-down"></i></a>
        <div class="mega-menu">
          <div class="mega-menu__grid">
            <a href="/category/industrial-cleaning-supplies-wholesale/" class="mega-menu__category"><i class="fas fa-spray-can"></i><span class="mega-menu__cat-name">חומרי ניקוי וכימיקלים</span></a>
            <a href="/category/bulk-paper-towel-office-supplies/" class="mega-menu__category"><i class="fas fa-toilet-paper"></i><span class="mega-menu__cat-name">מוצרי נייר וניגוב</span></a>
            <a href="/category/disposable-catering-food-service/" class="mega-menu__category"><i class="fas fa-utensils"></i><span class="mega-menu__cat-name">חד פעמי ואירוח</span></a>
            <a href="/category/food-packaging-delivery-solutions/" class="mega-menu__category"><i class="fas fa-box-open"></i><span class="mega-menu__cat-name">אריזות מזון ו-Take Away</span></a>
            <a href="/category/heavy-duty-garbage-bags-wholesale/" class="mega-menu__category"><i class="fas fa-trash-alt"></i><span class="mega-menu__cat-name">שקיות ופתרונות אשפה</span></a>
            <a href="/category/professional-cleaning-cloths-microfiber/" class="mega-menu__category"><i class="fas fa-tshirt"></i><span class="mega-menu__cat-name">טקסטיל, מטליות וסחבות</span></a>
            <a href="/category/office-coffee-breakroom-supplies/" class="mega-menu__category"><i class="fas fa-coffee"></i><span class="mega-menu__cat-name">קפה, שתייה וכיבוד</span></a>
            <a href="/category/safety-ppe-equipment-for-business/" class="mega-menu__category"><i class="fas fa-hard-hat"></i><span class="mega-menu__cat-name">בטיחות ומיגון אישי</span></a>
            <a href="/category/ציוד-משרדי-וכללי/" class="mega-menu__category"><i class="fas fa-pen"></i><span class="mega-menu__cat-name">ציוד משרדי וכללי</span></a>
            <a href="/category/ציוד-טכני-ואחזקה/" class="mega-menu__category"><i class="fas fa-wrench"></i><span class="mega-menu__cat-name">ציוד טכני ואחזקה</span></a>
            <a href="/category/עטיפה-אריזה-ולוגיסטיקה/" class="mega-menu__category"><i class="fas fa-tape"></i><span class="mega-menu__cat-name">עטיפה, אריזה ולוגיסטיקה</span></a>
            <a href="/category/עזרה-ראשונה-רפואי/" class="mega-menu__category"><i class="fas fa-first-aid"></i><span class="mega-menu__cat-name">עזרה ראשונה - רפואי</span></a>
            <a href="/category/טואלטיקה-וטיפוח-אישי/" class="mega-menu__category"><i class="fas fa-pump-soap"></i><span class="mega-menu__cat-name">טואלטיקה וטיפוח</span></a>
            <a href="/category/כלי-עבודה-וציוד-משקי/" class="mega-menu__category"><i class="fas fa-tools"></i><span class="mega-menu__cat-name">כלי עבודה וציוד משקי</span></a>
          </div>
        </div>
      </div>
      <div class="main-nav__item"><a href="/about" class="main-nav__link" data-nav="about">אודות</a></div>
      <div class="main-nav__item"><a href="/blog" class="main-nav__link" data-nav="blog">בלוג</a></div>
      <div class="main-nav__item"><a href="/contact" class="main-nav__link" data-nav="contact">צרו קשר</a></div>
    </nav>
    <div class="header__actions">
      <button class="header__search-toggle" aria-label="חיפוש"><i class="fas fa-search"></i></button>
      <button class="header__cart-btn" aria-label="עגלת קניות"><i class="fas fa-shopping-cart"></i><span class="cart-count">0</span></button>
      <a href="/login" class="header__login-btn"><i class="fas fa-user"></i> <span>כניסת לקוחות</span></a>
      <a href="/register" class="header__register-btn"><i class="fas fa-user-plus"></i> <span>הרשמה</span></a>
    </div>
    <button class="mobile-menu-btn" aria-label="תפריט" aria-expanded="false"><i class="fas fa-bars"></i></button>
  </div></header>
  <div class="mobile-overlay"></div>
  <div class="search-overlay"><div class="search-overlay__inner"><form action="/catalog" method="get"><input type="search" name="search" class="search-overlay__input" placeholder="חפשו מוצר..." aria-label="חיפוש מוצר" autocomplete="off"></form></div></div>

  <div class="container">
    <nav class="breadcrumb" aria-label="ניווט פירורי לחם">
      <a href="/">דף הבית</a>
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <a href="/catalog">מוצרים</a>
      ${parentChain.map(ancestor => `
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <a href="${getFullCategoryUrl(ancestor, categories)}">${ancestor.name}</a>`).join('')}
      ${primaryCat ? `
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <a href="${categoryUrl}">${primaryCat.name}</a>` : ''}
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <span class="breadcrumb__current">${product.name}</span>
    </nav>
  </div>

  <section class="section">
    <div class="container">
      <div class="product-detail__grid">
        <div class="product-gallery">
          <div class="product-gallery__main">
            <img src="${imgSrc}" alt="${seo.imageAlt || product.name}"
                 onerror="this.src='https://placehold.co/500x500/f0f2f5/5a6577?text=${encodeURIComponent((product.name || '').substring(0,15))}'">
          </div>
        </div>
        <div class="product-info">
          <div class="product-info__category">${categoryName}</div>
          <h1 class="product-info__name">${h1Text}</h1>
          ${product.partNumber ? `<div class="product-info__sku">מק"ט: ${product.partNumber}</div>` : ''}
          ${product.unit ? `<div class="product-info__pack">${product.unitsPerPack || ''} ${product.unit || ''}</div>` : ''}

          <div class="product-pricing">
            ${price
              ? hasPromo
                ? `<div class="product-pricing__badge">${promoLabel}</div><div class="product-pricing__price" style="color:#dc2626">${price}</div><div class="product-pricing__original" style="text-decoration:line-through;color:#9ca3af;font-size:var(--fs-base)">${formatPrice(product.originalPrice)}</div>${product.discountPercent ? `<div class="product-pricing__discount" style="background:#fef2f2;color:#dc2626;display:inline-block;padding:2px 8px;border-radius:6px;font-size:var(--fs-sm);font-weight:600">${Math.round(product.discountPercent)}%- הנחה</div>` : ''}${perUnit ? `<div class="product-pricing__unit">${perUnit}</div>` : ''}`
                : `<div class="product-pricing__price">${price}</div>${perUnit ? `<div class="product-pricing__unit">${perUnit}</div>` : ''}`
              : '<div class="product-pricing__price" style="font-size: var(--fs-lg);">צרו קשר למחיר</div>'
            }
          </div>

          <div class="product-actions">
            ${price
              ? `<div class="quantity-selector">
                  <button class="quantity-selector__btn" id="qtyDecrease">-</button>
                  <input type="number" class="quantity-selector__input" id="qtyInput" value="1" min="1">
                  <button class="quantity-selector__btn" id="qtyIncrease">+</button>
                </div>
                <button class="btn btn--primary btn--lg" id="addToCartBtn" data-id="${product.id}"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>`
              : ''
            }
            <a href="https://wa.me/972549922492?text=היי, מתעניין ב${encodeURIComponent(product.name)}" class="btn btn--whatsapp btn--lg" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> שאלו אותנו</a>
            <a href="tel:*3497" class="btn btn--phone btn--lg" style="display:inline-flex;align-items:center;gap:8px;background:#1B3A5C;color:#fff;padding:12px 24px;border-radius:12px;font-weight:600;text-decoration:none;font-size:0.95rem;margin-top:8px;justify-content:center;width:100%;"><i class="fas fa-phone-alt"></i> חייגו *3497</a>
          </div>

          <div class="product-trust-badges">
            <div class="product-trust-badges__item"><i class="fas fa-truck"></i><span>משלוח ארצי</span></div>
            <div class="product-trust-badges__item"><i class="fas fa-tags"></i><span>מחירי סיטונאות</span></div>
            <div class="product-trust-badges__item"><i class="fas fa-headset"></i><span>שירות אישי</span></div>
            <div class="product-trust-badges__item"><i class="fas fa-file-invoice"></i><span>חשבונית מס</span></div>
          </div>

          <div class="product-highlights">
            <div class="product-highlights__item"><i class="fas fa-check-circle"></i> <span>במלאי - מוכן למשלוח</span></div>
            <div class="product-highlights__item"><i class="fas fa-shipping-fast"></i> <span>${product.leadTimeDays ? product.leadTimeDays + ' ימי עסקים' : '1-2 ימי עסקים'}</span></div>
            <div class="product-highlights__item"><i class="fas fa-shield-alt"></i> <span>הזמנה מינימלית: 500₪</span></div>
            ${product.barcode ? `<div class="product-highlights__item"><i class="fas fa-barcode"></i> <span>ברקוד: ${product.barcode}</span></div>` : ''}
            ${product.maxOrderQty ? `<div class="product-highlights__item"><i class="fas fa-cubes"></i> <span>מקס' להזמנה: ${product.maxOrderQty} יח'</span></div>` : ''}
          </div>

          ${product.description ? `<div class="product-description"><h3>תיאור</h3><p>${product.description}</p></div>` : ''}
          ${product.technicalDesc ? `<div class="product-description" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-top:1rem;"><h3 style="font-size:1rem;margin-bottom:0.5rem;"><i class="fas fa-clipboard-list" style="color:var(--color-primary,#1B3A5C);margin-left:6px;"></i>מפרט טכני</h3><p style="white-space:pre-line;color:var(--color-text-secondary,#4b5563);font-size:0.9rem;line-height:1.7">${product.technicalDesc}</p></div>` : ''}
          ${product.videoUrl ? `<div style="margin-top:1rem;"><a href="${product.videoUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.95rem;"><i class="fas fa-play-circle"></i> צפו בסרטון מוצר</a></div>` : ''}
          ${specsHtml}
          ${bulkCtaHtml}
          ${geoContentHtml}
          ${faqsHtml}
        </div>
      </div>

      ${related.length > 0 ? `
      <div class="related-products">
        <h2>מוצרים נוספים מ${categoryName}</h2>
        <div class="related-products__grid">${relatedHtml}</div>
      </div>
      ` : ''}
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="/images/logo/logo-white.png" alt="וואי מרקט" width="112" height="60">
          <p>נגלר סחר והפצה — סחר, שיווק והפצה של מוצרי צריכה שוטפת לעסקים ומוסדות בכל רחבי הארץ.</p>
          <div class="footer__social">
            <a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            <a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          </div>
        </div>

        <div class="footer__col">
          <h4>קטגוריות</h4>
          <div class="footer__links">
            <a href="/category/bulk-paper-towel-office-supplies/">מוצרי נייר וניגוב</a>
            <a href="/category/industrial-cleaning-supplies-wholesale/">חומרי ניקוי</a>
            <a href="/category/disposable-catering-food-service/">חד פעמי ואירוח</a>
            <a href="/category/food-packaging-delivery-solutions/">אריזות Take Away</a>
            <a href="/category/office-coffee-breakroom-supplies/">קפה, שתייה וכיבוד</a>
            <a href="/category/safety-ppe-equipment-for-business/">בטיחות ומיגון</a>
          </div>
        </div>

        <div class="footer__col">
          <h4>קישורים מהירים</h4>
          <div class="footer__links">
            <a href="/catalog">קטלוג מוצרים</a>
            <a href="/about">אודות</a>
            <a href="/blog">בלוג</a>
            <a href="/faq">שאלות ותשובות</a>
            <a href="/contact">צרו קשר</a>
            <a href="/tracking">מעקב משלוחים</a>
          </div>
        </div>

        <div class="footer__col">
          <h4>צרו קשר</h4>
          <div class="footer__contact-item">
            <i class="fas fa-phone-alt"></i>
            <a href="tel:037740400">03-7740400</a>
          </div>
          <div class="footer__contact-item">
            <i class="fab fa-whatsapp"></i>
            <a href="https://wa.me/972549922492" target="_blank" rel="noopener">WhatsApp</a>
          </div>
          <div class="footer__contact-item">
            <i class="fas fa-envelope"></i>
            <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a>
          </div>
          <div class="footer__contact-item">
            <i class="fas fa-clock"></i>
            <span>א'-ה' 08:00-17:00</span>
          </div>
        </div>
      </div>

      <div class="footer__bottom">
        <span class="footer__copyright">&copy; 2026 וואי מרקט — נגלר סחר והפצה. כל הזכויות שמורות.</span>
        <div class="footer__legal">
          <a href="/legal/terms">תקנון האתר</a>
          <a href="/legal/privacy">מדיניות פרטיות</a>
          <a href="/legal/shipping">מדיניות משלוחים</a>
          <a href="/legal/returns">החזרות וביטולים</a>
          <a href="/legal/accessibility">נגישות</a>
          <a href="/legal/cookies">עוגיות</a>
        </div>
      </div>
    </div>
  </footer>

  <a href="https://wa.me/972549922492?text=שלום, אשמח לקבל הצעת מחיר" class="whatsapp-float" target="_blank" rel="noopener" aria-label="שלחו הודעה בוואטסאפ"><i class="fab fa-whatsapp"></i><span class="whatsapp-float__tooltip">צריכים עזרה? דברו איתנו</span></a>
  <script src="/js/main.min.js?v=20260310b"></script>
  <script src="/js/analytics.js?v=20260314"></script>
  <script>
  (function() {
    var PRODUCT = ${JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.saleNis || 0,
      unit: product.unit || '',
      imageUrl: imgSrc,
      slug: product.slug,
      categoryName: primaryCat ? primaryCat.name : ''
    })};

    // Facebook Pixel - ViewContent (product page view)
    if (window.YMarketAnalytics && window.YMarketAnalytics.fbViewContent) {
      window.YMarketAnalytics.fbViewContent(PRODUCT);
    }
    // GA4 - view_item
    if (window.YMarketAnalytics && window.YMarketAnalytics.trackViewItem) {
      window.YMarketAnalytics.trackViewItem(PRODUCT);
    }

    // Quantity controls
    var qtyInput = document.getElementById('qtyInput');
    var decBtn = document.getElementById('qtyDecrease');
    var incBtn = document.getElementById('qtyIncrease');
    if (decBtn) decBtn.addEventListener('click', function() {
      if (qtyInput && parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
    });
    if (incBtn) incBtn.addEventListener('click', function() {
      if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
    });

    // Add to cart
    var addBtn = document.getElementById('addToCartBtn');
    if (addBtn) addBtn.addEventListener('click', function() {
      var qty = parseInt(qtyInput ? qtyInput.value : 1);
      var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
      var existing = null;
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === PRODUCT.id) { existing = cart[i]; break; }
      }

      if (existing) {
        existing.quantity += qty;
      } else {
        cart.push({
          id: PRODUCT.id,
          name: PRODUCT.name,
          price: PRODUCT.price,
          unit: PRODUCT.unit,
          imageUrl: PRODUCT.imageUrl,
          slug: PRODUCT.slug,
          quantity: qty
        });
      }

      localStorage.setItem('ym_cart', JSON.stringify(cart));
      if (window.YMarket) window.YMarket.updateCartBadge();
      if (window.YMarket) window.YMarket.showToast('המוצר נוסף לעגלה');

      // Facebook Pixel - AddToCart
      if (window.YMarketAnalytics && window.YMarketAnalytics.fbAddToCart) {
        window.YMarketAnalytics.fbAddToCart({ id: PRODUCT.id, name: PRODUCT.name, price: PRODUCT.price, quantity: qty });
      }
      // GA4 - add_to_cart
      if (window.YMarketAnalytics && window.YMarketAnalytics.trackAddToCart) {
        window.YMarketAnalytics.trackAddToCart({ id: PRODUCT.id, name: PRODUCT.name, price: PRODUCT.price, quantity: qty });
      }
    });
  })();
  </script>
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

  if (products.length === 0) {
    console.log('No products found in data.');
    return;
  }

  // Clean products directory completely
  if (fs.existsSync(PRODUCTS_DIR)) {
    cleanDir(PRODUCTS_DIR);
    console.log('Cleaned old product pages');
  }

  // Generate each product page as /products/{slug}/index.html
  let count = 0;
  for (const product of products) {
    if (!product.slug) {
      console.warn(`Skipping product ${product.id}: no slug`);
      continue;
    }

    const html = generateProductPage(product, categories, products);
    const slugDir = path.join(PRODUCTS_DIR, product.slug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf-8');
    count++;
  }

  console.log(`Generated ${count} product pages in ${PRODUCTS_DIR}`);
}

main();
