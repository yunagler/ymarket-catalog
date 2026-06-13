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

// Load header from single source of truth
const SITE_HEADER = fs.readFileSync(path.join(ROOT_DIR, 'includes', 'site-header.html'), 'utf-8').trim();

// Render the legacy `technicalDesc` field. It is stored as a JSON string like
// [{"label":"...","value":"..."}]. Older code printed it raw, leaking JSON onto
// the page. Parse it into a real spec table; fall back to plain text if not JSON.
function renderTechSpecs(technicalDesc) {
  const wrapOpen = '<div class="product-description" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-top:1rem;"><h3 style="font-size:1rem;margin-bottom:0.5rem;"><i class="fas fa-clipboard-list" style="color:var(--color-primary,#1B3A5C);margin-left:6px;"></i>מפרט טכני</h3>';
  const wrapClose = '</div>';
  let specs = null;
  try {
    const parsed = JSON.parse(technicalDesc);
    if (Array.isArray(parsed) && parsed.length && parsed[0] && 'label' in parsed[0]) specs = parsed;
  } catch (e) { /* not JSON, treat as text */ }
  if (specs) {
    const rows = specs.map(s =>
      `<tr><td style="font-weight:600;padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#1B3A5C;white-space:nowrap">${s.label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#4b5563">${s.value}</td></tr>`
    ).join('');
    return `${wrapOpen}<table style="width:100%;border-collapse:collapse;font-size:0.9rem;line-height:1.7">${rows}</table>${wrapClose}`;
  }
  return `${wrapOpen}<p style="white-space:pre-line;color:var(--color-text-secondary,#4b5563);font-size:0.9rem;line-height:1.7">${technicalDesc}</p>${wrapClose}`;
}

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

function generateProductPage(product, categories, allProducts, group) {
  // group (optional): { name, axis, variants: [items sorted by variantSortOrder] }
  // When present, this page is a UNIFIED variant page (one page for S/M/L/XL etc.)
  const isGroup = !!(group && group.variants && group.variants.length > 1);
  const groupAxis = (group && group.axis) || 'מידה';
  const axisWord = groupAxis === 'צבע' ? 'צבע' : groupAxis === 'מידה' ? 'מידה' : 'וריאנט';
  const variantData = isGroup ? group.variants.map(v => {
    const vJpg = v.imageUrl || `/items/${v.id}.jpg`;
    return {
      id: v.id,
      label: v.variantLabel || v.name,
      name: v.name,
      price: v.saleNis || 0,
      unit: v.unit || '',
      img: vJpg.replace(/\.jpg$/i, '.webp'),
      imgJpg: vJpg,
      slug: v.slug,
    };
  }) : [];
  const groupPrices = variantData.map(v => v.price).filter(p => p > 0);
  const gMin = groupPrices.length ? Math.min(...groupPrices) : 0;
  const gMax = groupPrices.length ? Math.max(...groupPrices) : 0;
  const groupPriceLabel = gMin === gMax ? formatPrice(gMin) : `${formatPrice(gMin)} - ${formatPrice(gMax)}`;

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
  const imgSrcJpg = product.imageUrl || `/items/${product.id}.jpg`;
  const imgSrc = imgSrcJpg.replace(/\.jpg$/i, '.webp');
  const imgSrcThumb = imgSrcJpg.replace(/\.jpg$/i, '-thumb.webp');
  const canonicalSlug = isGroup ? (group.seoSlug || product.seoSlug || product.slug) : (product.seoSlug || product.slug);
  const productUrl = `${SITE_URL}/products/${canonicalSlug}/`;

  // SEO overrides from products.json
  const seo = product.seo || {};
  const pageTitle = isGroup ? `${group.name} | וואי מרקט` : (seo.title || `${product.name} | וואי מרקט`);
  const h1Text = isGroup ? group.name : (seo.h1 || product.name);
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

  // ===== Variant group: pricing block, selector + quantity matrix, cart script =====
  // Pricing headline (JS updates it when a variant pill is selected)
  // Compact price line for group pages — replaces the bulky site price banner.
  const unitWord = variantData[0] && variantData[0].unit ? 'ל' + variantData[0].unit : 'ליחידה';
  const axisPlural = axisWord === 'צבע' ? 'צבעים' : axisWord === 'מידה' ? 'מידות' : 'וריאנטים';
  const countWord = `${variantData.length} ${axisPlural}`;
  // The price is now the header of the selection card (connected as one unit) — no
  // separate floating price line under the title.
  const compactPriceHtml = '';

  const pricingHtml = isGroup
    ? ''
    : (price
        ? hasPromo
          ? `<div class="product-pricing__badge">${promoLabel}</div><div class="product-pricing__price" style="color:#dc2626">${price}</div><div class="product-pricing__original" style="text-decoration:line-through;color:#9ca3af;font-size:var(--fs-base)">${formatPrice(product.originalPrice)}</div>${product.discountPercent ? `<div class="product-pricing__discount" style="background:#fef2f2;color:#dc2626;display:inline-block;padding:2px 8px;border-radius:6px;font-size:var(--fs-sm);font-weight:600">${Math.round(product.discountPercent)}%- הנחה</div>` : ''}${perUnit ? `<div class="product-pricing__unit">${perUnit}</div>` : ''}`
          : `<div class="product-pricing__price">${price}</div>${perUnit ? `<div class="product-pricing__unit">${perUnit}</div>` : ''}`
        : '<div class="product-pricing__price" style="font-size: var(--fs-lg);">צרו קשר למחיר</div>');

  // Actions block — ONE clean list per variant (thumbnail switches hero; no
  // redundant pill row). Each row: image + label + unit price + stepper + line total.
  const variantMatrixHtml = isGroup ? `
    <div class="vgroup">
      <div class="vgroup__bar">
        <div class="vgroup__price">
          <span id="variantPrice">${formatPrice(variantData[0].price)}</span>
          <span class="vgroup__pnote">${unitWord} · ${groupAxis} <bdi dir="ltr" id="variantLabel">${variantData[0].label}</bdi></span>
        </div>
        <div class="vgroup__hint"><i class="fas fa-hand-pointer"></i> בחרו ${axisPlural} וכמויות</div>
      </div>
      ${variantData.map((v, i) => `
        <div class="vrow${i === 0 ? ' is-active' : ''}" data-idx="${i}">
          <button type="button" class="vrow__pick" data-idx="${i}" aria-label="הצג ${v.label}">
            <picture><source srcset="${v.img}" type="image/webp"><img src="${v.imgJpg}" alt="${v.label}" loading="lazy" onerror="this.onerror=null;var s=this.parentElement.querySelector('source');if(s)s.remove();this.style.opacity=0.2"></picture>
          </button>
          <div class="vrow__meta">
            <span class="vrow__label">${v.label}</span>
            <span class="vrow__price">${formatPrice(v.price)}${v.unit ? ' / ' + v.unit : ' ליח׳'}</span>
          </div>
          <div class="vrow__stepper">
            <button type="button" class="vqty-dec" data-idx="${i}" aria-label="הפחת">−</button>
            <input type="number" class="vqty" data-idx="${i}" value="0" min="0" inputmode="numeric" aria-label="כמות ${v.label}">
            <button type="button" class="vqty-inc" data-idx="${i}" aria-label="הוסף">+</button>
          </div>
          <div class="vrow__sum vline-total" data-idx="${i}"></div>
        </div>`).join('')}
    </div>` : '';

  // Card CSS now lives in the master file css/pages/product-detail.css (shared by
  // group + single pages). No inline <style> needed.
  const secondaryBtns = (waText) => `<div class="vgroup-secondary">
           <a href="https://wa.me/972549922492?text=${encodeURIComponent('היי, מתעניין ב' + waText)}" class="btn btn--whatsapp" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> שאלו אותנו</a>
           <a href="tel:*3497" class="btn btn--phone"><i class="fas fa-phone-alt"></i> חייגו *3497</a>
         </div>`;

  const actionsHtml = isGroup
    ? `<div class="vgroup-actions">
         ${variantMatrixHtml}
         <button class="btn btn--primary btn--lg vgroup-add" id="addAllBtn" disabled><i class="fas fa-cart-plus"></i> <span id="addAllLabel">בחרו כמות מהמידות</span></button>
         ${secondaryBtns(group.name)}
       </div>`
    : price
    // Single SKU — same card as a variant group, with one row
    ? `<div class="vgroup-actions">
         <div class="vgroup">
           <div class="vgroup__bar">
             <div class="vgroup__price"><span>${price}</span><span class="vgroup__pnote">${product.unit ? 'ל' + product.unit : 'ליחידה'}${perUnit ? ' · ' + perUnit : ''}</span></div>
             <div class="vgroup__hint"><i class="fas fa-cubes"></i> בחרו כמות</div>
           </div>
           <div class="vrow is-active">
             <div class="vrow__pick"><picture><source srcset="${imgSrcThumb}" type="image/webp"><img src="${imgSrcJpg}" alt="${(seo.imageAlt || h1Text).replace(/"/g,'&quot;')}" onerror="this.onerror=null;var s=this.parentElement.querySelector('source');if(s)s.remove();this.style.opacity=.2"></picture></div>
             <div class="vrow__meta"><span class="vrow__label">${product.unit || 'יחידה'}</span><span class="vrow__price">${price}${product.unit ? ' / ' + product.unit : ''}</span></div>
             <div class="vrow__stepper">
               <button type="button" id="qtyDecrease" aria-label="הפחת">−</button>
               <input type="number" class="vqty" id="qtyInput" value="1" min="1" inputmode="numeric" aria-label="כמות">
               <button type="button" id="qtyIncrease" aria-label="הוסף">+</button>
             </div>
             <div class="vrow__sum" id="lineTotal">${price}</div>
           </div>
         </div>
         <button class="btn btn--primary btn--lg vgroup-add" id="addToCartBtn" data-id="${product.id}"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>
         ${secondaryBtns(product.name)}
       </div>`
    // No price — contact CTA only
    : `<div class="vgroup-actions">
         <div class="product-pricing__price" style="font-size:var(--fs-lg);margin-bottom:8px;">צרו קשר למחיר</div>
         ${secondaryBtns(product.name)}
       </div>`;

  // Related products from same category (exclude this product and same-group siblings)
  const related = allProducts
    .filter(p => p.categorySlug === product.categorySlug && p.id !== product.id
      && !(isGroup && p.variantGroupId === group.id))
    .slice(0, 4);

  const relatedHtml = related.map(p => {
    const rJpg = p.imageUrl || `/items/${p.id}.jpg`;
    const rThumb = rJpg.replace(/\.jpg$/i, '-thumb.webp');
    const rSlug = p.seoSlug || p.slug;  // English link when available, Hebrew name preserved as text
    return `
    <div class="product-card" style="min-width: 220px;">
      <div class="product-card__image">
        <a href="/products/${rSlug}/" aria-label="${p.name}">
          <picture>
            <source srcset="${rThumb}" type="image/webp">
            <img src="${rJpg}" alt="${p.name}" loading="lazy" width="258" height="258"
                 onerror="this.onerror=null;var s=this.parentElement.querySelector('source');if(s)s.remove();this.src='https://placehold.co/300x300/f0f2f5/5a6577?text=${encodeURIComponent((p.name || '').substring(0,15))}'">
          </picture>
        </a>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name"><a href="/products/${rSlug}/">${p.name}</a></h3>
        ${p.saleNis ? `<div class="product-card__price">${formatPrice(p.saleNis)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const productDescription = product.description || `${product.name} - ${categoryName}`;
  const schemaDescription = seo.isB2BBulk ? `סיטונאות / Wholesale - ${productDescription}` : productDescription;
  // priceValidUntil - end of current year (Google requires this)
  const priceValidUntil = new Date().getFullYear() + '-12-31';
  const schemaBase = {
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
    // NOTE: aggregateRating/review are ONLY emitted when real review data exists
    // in seo.rating. Fabricated ratings violate Google's structured-data policy
    // and risk a manual action. Do not hardcode fake reviews here.
    ...(seo.rating && seo.rating.count ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": String(seo.rating.value),
        "reviewCount": String(seo.rating.count),
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {}),
    ...(product.saleNis ? {
      "offers": {
        "@type": "Offer",
        "price": product.saleNis,
        "priceCurrency": "ILS",
        "availability": "https://schema.org/InStock",
        "priceValidUntil": priceValidUntil,
        "url": productUrl,
        "areaServed": { "@type": "Country", "name": "ישראל" },
        "availableAtOrFrom": { "@type": "Place", "name": "וואי מרקט - גת רימון", "address": { "@type": "PostalAddress", "addressLocality": "גת רימון", "addressCountry": "IL" } },
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
  };

  // Variant groups emit a ProductGroup with hasVariant (correct schema.org modeling)
  const jsonLd = JSON.stringify(isGroup ? {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "name": group.name,
    "description": schemaDescription,
    "image": `${SITE_URL}${variantData[0].imgJpg}`,
    "url": productUrl,
    "brand": { "@type": "Brand", "name": "וואי מרקט" },
    "category": categoryName,
    "variesBy": groupAxis === 'צבע' ? "https://schema.org/color" : "https://schema.org/size",
    "hasVariant": variantData.map(v => ({
      "@type": "Product",
      "name": v.name,
      "image": `${SITE_URL}${v.imgJpg}`,
      "url": productUrl,
      ...(v.price ? {
        "offers": {
          "@type": "Offer",
          "price": v.price,
          "priceCurrency": "ILS",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": priceValidUntil,
          "url": productUrl
        }
      } : {})
    }))
  } : schemaBase, null, 2);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${productUrl}">
  <link rel="alternate" hreflang="he" href="${productUrl}">
  <link rel="alternate" hreflang="x-default" href="${productUrl}">
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
  <link rel="stylesheet" href="/css/site-header.css">
  <link rel="stylesheet" href="/css/pages/product-detail.min.css?v=20260613b">
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
  ${SITE_HEADER}
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
      <span class="breadcrumb__current">${h1Text}</span>
    </nav>
  </div>

  <section class="section">
    <div class="container">
      <div class="product-detail__grid">
        <div class="product-gallery">
          <div class="product-gallery__main">
            <picture>
              <source srcset="${imgSrc}" type="image/webp" id="mainProductSource">
              <img src="${imgSrcJpg}" alt="${seo.imageAlt || h1Text}" id="mainProductImg"
                   onerror="this.onerror=null;var s=this.parentElement.querySelector('source');if(s)s.remove();this.src='https://placehold.co/500x500/f0f2f5/5a6577?text=${encodeURIComponent((h1Text || '').substring(0,15))}'">
            </picture>
          </div>
        </div>
        <div class="product-info">
          <div class="product-info__category">${categoryName}</div>
          <h1 class="product-info__name">${h1Text}</h1>
          ${!isGroup && product.partNumber ? `<div class="product-info__sku">מק"ט: ${product.partNumber}</div>` : ''}
          ${!isGroup && product.unit ? `<div class="product-info__pack">${product.unitsPerPack || ''} ${product.unit || ''}</div>` : ''}
          ${isGroup ? compactPriceHtml : ''}

          <div class="product-actions">
            ${actionsHtml}
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
            <div class="product-highlights__item"><i class="fas fa-shield-alt"></i> <span>הזמנה מינימלית: 200₪ + מע״מ</span></div>
            ${product.barcode ? `<div class="product-highlights__item"><i class="fas fa-barcode"></i> <span>ברקוד: ${product.barcode}</span></div>` : ''}
            ${product.maxOrderQty ? `<div class="product-highlights__item"><i class="fas fa-cubes"></i> <span>מקס' להזמנה: ${product.maxOrderQty} יח'</span></div>` : ''}
          </div>

          ${product.description ? `<div class="product-description"><h3>תיאור</h3><p>${product.description}</p></div>` : ''}
          ${(!(seo.specs && seo.specs.length) && product.technicalDesc) ? renderTechSpecs(product.technicalDesc) : ''}
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
  <script src="/js/search.js?v=20260613"></script>
  <script>
  (function() {
    var PRODUCT = ${JSON.stringify({
      id: product.id,
      name: isGroup ? group.name : product.name,
      price: product.saleNis || 0,
      unit: product.unit || '',
      imageUrl: imgSrc,
      slug: canonicalSlug,
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
  })();
  </script>
  ${isGroup ? `<script>
  (function() {
    // ===== Variant group: selector switches hero, matrix adds one cart line per size =====
    var VARIANTS = ${JSON.stringify(variantData)};
    function fmt(n){ return '‏' + Math.round(n*100)/100 + ' ‏₪'; }
    var rows = document.querySelectorAll('.vrow');
    var mainImg = document.getElementById('mainProductImg');
    var mainSrc = document.getElementById('mainProductSource');
    var priceEl = document.getElementById('variantPrice');
    var labelEl = document.getElementById('variantLabel');
    function selectVariant(idx) {
      var v = VARIANTS[idx];
      if (!v) return;
      rows.forEach(function(r){ r.classList.toggle('is-active', parseInt(r.dataset.idx) === idx); });
      if (mainSrc) { mainSrc.srcset = v.img; }
      if (priceEl) { priceEl.textContent = fmt(v.price); }
      // Bidi-safe label inside <bdi dir="ltr"> — only its text changes, no control chars
      if (labelEl) { labelEl.textContent = v.label; }
      // Subtle animations: crossfade hero, pulse price
      if (mainImg) { mainImg.src = v.imgJpg; mainImg.classList.remove('vfade'); void mainImg.offsetWidth; mainImg.classList.add('vfade'); }
      var vpWrap = document.querySelector('.vgroup__price'); if (vpWrap) { vpWrap.classList.remove('vpulse'); void vpWrap.offsetWidth; vpWrap.classList.add('vpulse'); }
    }
    // Tapping a variant's thumbnail previews it in the main image
    document.querySelectorAll('.vrow__pick').forEach(function(b){ b.addEventListener('click', function(){ selectVariant(parseInt(b.dataset.idx)); }); });

    // Quantity matrix
    var qtyInputs = document.querySelectorAll('.vqty');
    function lineTotalEl(idx){ return document.querySelector('.vline-total[data-idx="'+idx+'"]'); }
    function refreshTotals() {
      var totalUnits = 0, totalPrice = 0, selected = 0;
      VARIANTS.forEach(function(v, i){
        var input = document.querySelector('.vqty[data-idx="'+i+'"]');
        var q = Math.max(0, parseInt(input && input.value) || 0);
        var lt = lineTotalEl(i);
        if (q > 0) {
          selected++; totalUnits += q; totalPrice += q * v.price;
          var t = fmt(q * v.price);
          if (lt && lt.textContent !== t) { lt.textContent = t; lt.classList.remove('vsumin'); void lt.offsetWidth; lt.classList.add('vsumin'); }
        } else if (lt) { lt.textContent = ''; }
      });
      var btn = document.getElementById('addAllBtn');
      var label = document.getElementById('addAllLabel');
      if (label) label.textContent = selected === 0 ? 'בחרו כמות מהמידות' : ('הוספה לעגלה · ' + totalUnits + ' פריטים · ' + fmt(totalPrice));
      if (btn) btn.disabled = selected === 0;
    }
    document.querySelectorAll('.vqty-dec').forEach(function(b){ b.addEventListener('click', function(){
      var i = b.dataset.idx; var input = document.querySelector('.vqty[data-idx="'+i+'"]');
      if (input) { input.value = Math.max(0, (parseInt(input.value)||0) - 1); refreshTotals(); }
    }); });
    document.querySelectorAll('.vqty-inc').forEach(function(b){ b.addEventListener('click', function(){
      var i = b.dataset.idx; var input = document.querySelector('.vqty[data-idx="'+i+'"]');
      if (input) { input.value = (parseInt(input.value)||0) + 1; refreshTotals(); }
    }); });
    qtyInputs.forEach(function(input){ input.addEventListener('input', refreshTotals); });

    // Add all selected variants to cart (one line per variant, keyed by id)
    var addAll = document.getElementById('addAllBtn');
    if (addAll) addAll.addEventListener('click', function(){
      var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
      var added = 0, addedUnits = 0;
      VARIANTS.forEach(function(v, i){
        var input = document.querySelector('.vqty[data-idx="'+i+'"]');
        var q = Math.max(0, parseInt(input && input.value) || 0);
        if (q <= 0) return;
        var existing = null;
        for (var k = 0; k < cart.length; k++) { if (cart[k].id === v.id) { existing = cart[k]; break; } }
        if (existing) { existing.quantity += q; }
        else { cart.push({ id: v.id, name: v.name, price: v.price, unit: v.unit, imageUrl: v.img, slug: v.slug, quantity: q }); }
        added++; addedUnits += q;
        if (window.YMarketAnalytics && window.YMarketAnalytics.trackAddToCart) {
          window.YMarketAnalytics.trackAddToCart({ id: v.id, name: v.name, price: v.price, quantity: q });
        }
      });
      if (added === 0) return;
      localStorage.setItem('ym_cart', JSON.stringify(cart));
      if (window.YMarket) {
        window.YMarket.updateCartBadge();
        window.YMarket.showToast(addedUnits + ' פריטים נוספו לעגלה');
      }
      // Reset inputs after adding
      qtyInputs.forEach(function(input){ input.value = 0; });
      refreshTotals();
    });

    selectVariant(0);
    refreshTotals();
  })();
  </script>` : `<script>
  (function() {
    var PRODUCT = ${JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.saleNis || 0,
      unit: product.unit || '',
      imageUrl: imgSrc,
      slug: product.slug,
    })};
    // Quantity controls
    var qtyInput = document.getElementById('qtyInput');
    var decBtn = document.getElementById('qtyDecrease');
    var incBtn = document.getElementById('qtyIncrease');
    var lineTotalEl = document.getElementById('lineTotal');
    function fmtPrice(n){ return '‏' + (Math.round(n*100)/100).toLocaleString('he-IL') + ' ‏₪'; }
    function updateLineTotal(){
      if (!lineTotalEl) return;
      var q = Math.max(1, parseInt(qtyInput && qtyInput.value) || 1);
      lineTotalEl.textContent = fmtPrice(q * PRODUCT.price);
      lineTotalEl.classList.remove('vsumin'); void lineTotalEl.offsetWidth; lineTotalEl.classList.add('vsumin');
    }
    if (decBtn) decBtn.addEventListener('click', function() {
      if (qtyInput && parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
      updateLineTotal();
    });
    if (incBtn) incBtn.addEventListener('click', function() {
      if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
      updateLineTotal();
    });
    if (qtyInput) qtyInput.addEventListener('input', updateLineTotal);

    // Add to cart
    var addBtn = document.getElementById('addToCartBtn');
    if (addBtn) {
      addBtn.dataset.id = PRODUCT.id;
      addBtn.dataset.name = PRODUCT.name;
      addBtn.dataset.price = PRODUCT.price;
      addBtn.dataset.unit = PRODUCT.unit || '';
      addBtn.dataset.img = PRODUCT.imageUrl;
      addBtn.dataset.slug = PRODUCT.slug;

      addBtn.addEventListener('click', function() {
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
            id: PRODUCT.id, name: PRODUCT.name, price: PRODUCT.price,
            unit: PRODUCT.unit, imageUrl: PRODUCT.imageUrl, slug: PRODUCT.slug,
            quantity: qty
          });
        }
        localStorage.setItem('ym_cart', JSON.stringify(cart));
        if (window.YMarket) {
          window.YMarket.updateCartBadge();
          window.YMarket.showToast('המוצר נוסף לעגלה');
          window.YMarket.showCartQtyControls(addBtn);
        }
        if (window.YMarketAnalytics && window.YMarketAnalytics.fbAddToCart) {
          window.YMarketAnalytics.fbAddToCart({ id: PRODUCT.id, name: PRODUCT.name, price: PRODUCT.price, quantity: qty });
        }
        if (window.YMarketAnalytics && window.YMarketAnalytics.trackAddToCart) {
          window.YMarketAnalytics.trackAddToCart({ id: PRODUCT.id, name: PRODUCT.name, price: PRODUCT.price, quantity: qty });
        }
      });

      // Show qty if already in cart
      if (window.YMarket && window.YMarket.getCartQty(PRODUCT.id) > 0) {
        window.YMarket.showCartQtyControls(addBtn);
      }
    }
  })();
  </script>`}
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

// Static "301-equivalent" redirect page left at an old Hebrew product URL after it
// migrates to an English seoSlug. Keeps the already-indexed Hebrew URL alive and
// consolidates signals to the new URL via canonical + meta-refresh.
function buildRedirectStub(targetPath, name) {
  const safeName = (name || '').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${safeName} | וואי מרקט</title>
  <link rel="canonical" href="${SITE_URL}${targetPath}">
  <meta http-equiv="refresh" content="0; url=${targetPath}">
  <meta name="robots" content="noindex, follow">
  <script>location.replace('${targetPath}');</script>
</head>
<body>
  <p>הדף עבר לכתובת חדשה. <a href="${targetPath}">המשך לעמוד המוצר ←</a></p>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`Error: ${DATA_PATH} not found.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  let products = data.items || [];
  const categories = data.categories || [];
  const variantGroupDefs = data.variantGroups || []; // [{id,name,axis,seoSlug}]

  if (products.length === 0) {
    console.log('No products found in data.');
    return;
  }

  // Build variant-group lookups from the FULL item set
  const allProducts = products;
  const groupDefById = new Map(variantGroupDefs.map(g => [g.id, g]));
  const groupMembers = new Map(); // groupId -> [items], sorted by variantSortOrder
  for (const p of allProducts) {
    if (p.variantGroupId == null) continue;
    if (!groupDefById.has(p.variantGroupId)) continue;
    const arr = groupMembers.get(p.variantGroupId) || [];
    arr.push(p);
    groupMembers.set(p.variantGroupId, arr);
  }
  for (const arr of groupMembers.values()) {
    arr.sort((a, b) => (a.variantSortOrder ?? 0) - (b.variantSortOrder ?? 0));
  }
  // Only groups with 2+ members get a unified page; singletons render normally
  const activeGroupIds = new Set([...groupMembers.entries()].filter(([, m]) => m.length > 1).map(([id]) => id));
  // Resolve the group context object passed to generateProductPage
  const groupContext = (gid) => {
    const def = groupDefById.get(gid);
    const members = groupMembers.get(gid);
    return { id: gid, name: def.name, axis: def.axis, seoSlug: def.seoSlug || (members[0].seoSlug || members[0].slug), variants: members };
  };

  // Optional single-page mode: `--slug=<slug>` regenerates ONE product page
  // without wiping the products directory. Matches an item slug OR a group slug.
  const slugArg = process.argv.find(a => a.startsWith('--slug='));
  let onlyGroupId = null; // when single-page mode targets a group
  if (slugArg) {
    const wanted = decodeURIComponent(slugArg.slice('--slug='.length));
    const matchedGroup = variantGroupDefs.find(g => g.seoSlug === wanted && activeGroupIds.has(g.id));
    if (matchedGroup) {
      onlyGroupId = matchedGroup.id;
      products = groupMembers.get(matchedGroup.id);
      console.log(`Single-page mode: regenerating variant group "${wanted}" (${products.length} variants, no clean)`);
    } else {
      products = products.filter(p => p.slug === wanted || p.seoSlug === wanted);
      if (products.length === 0) {
        console.error(`No product found with slug "${wanted}"`);
        process.exit(1);
      }
      console.log(`Single-page mode: regenerating only "${wanted}" (no clean)`);
    }
  } else {
    // Full build: clean products directory completely
    if (fs.existsSync(PRODUCTS_DIR)) {
      cleanDir(PRODUCTS_DIR);
      console.log('Cleaned old product pages');
    }
  }

  // Write a unified group page at its canonical slug + redirect stubs for members.
  const generatedGroups = new Set();
  function generateGroup(gid) {
    if (generatedGroups.has(gid)) return;
    generatedGroups.add(gid);
    const ctx = groupContext(gid);
    const rep = ctx.variants[0];
    const html = generateProductPage(rep, categories, allProducts, ctx);
    const groupDir = path.join(PRODUCTS_DIR, ctx.seoSlug);
    fs.mkdirSync(groupDir, { recursive: true });
    fs.writeFileSync(path.join(groupDir, 'index.html'), html, 'utf-8');
    // Redirect each member's own URLs (English seoSlug + Hebrew slug) → group page
    const target = `/products/${ctx.seoSlug}/`;
    for (const m of ctx.variants) {
      for (const memberSlug of [m.seoSlug, m.slug]) {
        if (!memberSlug || memberSlug === ctx.seoSlug) continue;
        const d = path.join(PRODUCTS_DIR, memberSlug);
        fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(path.join(d, 'index.html'), buildRedirectStub(target, m.name), 'utf-8');
      }
    }
    return ctx.variants.length;
  }

  // Generate each product page as /products/{slug}/index.html
  let count = 0, groupCount = 0;
  for (const product of products) {
    // Grouped variant → defer to unified group page (generated once)
    const gid = product.variantGroupId;
    if (gid != null && activeGroupIds.has(gid)) {
      if (!generatedGroups.has(gid)) { generateGroup(gid); groupCount++; }
      continue;
    }

    if (!product.slug) {
      console.warn(`Skipping product ${product.id}: no slug`);
      continue;
    }

    // URL/directory = English seoSlug when present (Hebrew product NAME is preserved
    // in the page content regardless). Falls back to the Hebrew slug.
    const dirSlug = product.seoSlug || product.slug;
    const html = generateProductPage(product, categories, allProducts);
    const slugDir = path.join(PRODUCTS_DIR, dirSlug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf-8');
    count++;

    // Migrated to an English URL? leave a redirect stub at the old Hebrew URL.
    if (product.seoSlug && product.seoSlug !== product.slug) {
      const oldDir = path.join(PRODUCTS_DIR, product.slug);
      fs.mkdirSync(oldDir, { recursive: true });
      fs.writeFileSync(path.join(oldDir, 'index.html'),
        buildRedirectStub(`/products/${product.seoSlug}/`, product.name), 'utf-8');
    }
  }

  console.log(`Generated ${count} product pages + ${groupCount} variant-group pages in ${PRODUCTS_DIR}`);
}

main();
