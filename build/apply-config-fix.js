/**
 * Standalone script to apply site-config.json to ALL HTML files
 * Run: node build/apply-config-fix.js
 */
const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'data', 'site-config.json'), 'utf-8'));

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceDataCount(html, label, value) {
  if (!value) return html;
  const regex = new RegExp('(data-count=")\\d+("[\\s\\S]{0,200}?' + escapeRegex(label) + ')', 'g');
  return html.replace(regex, '$1' + value + '$2');
}

function applyContactInfo(html) {
  const phone = config.business.phone;
  const email = config.business.email;
  const whatsapp = config.business.whatsapp;

  if (phone) {
    const phoneClean = phone.replace(/[^0-9]/g, '');
    // All tel: links
    html = html.replace(/href="tel:[^"]*"/g, `href="tel:${phoneClean}"`);
    // ALL visible Israeli phone numbers anywhere (text, meta, placeholders, etc.)
    html = html.replace(/0\d{1,2}-\d{3,4}-?\d{3,4}/g, phone);
    // Schema telephone
    html = html.replace(/"telephone":\s*"\+972[^"]*"/g, `"telephone": "+972-${phone.replace(/^0/, '').replace(/-/g, '-')}"`);
  }
  if (email) {
    // All mailto: links
    html = html.replace(/href="mailto:[^"]*"/g, `href="mailto:${email}"`);
    // ALL visible email addresses anywhere in the HTML
    html = html.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, email);
  }
  if (whatsapp) {
    html = html.replace(/wa\.me\/\d+/g, `wa.me/${whatsapp}`);
  }
  return html;
}

function applySocialLinks(html) {
  const fb = config.social?.facebook;
  const ig = config.social?.instagram;
  if (fb) {
    html = html.replace(/<a\s+href="#"\s+aria-label="Facebook"/g, `<a href="${fb}" target="_blank" rel="noopener" aria-label="Facebook"`);
  }
  if (ig) {
    html = html.replace(/<a\s+href="#"\s+aria-label="Instagram"/g, `<a href="${ig}" target="_blank" rel="noopener" aria-label="Instagram"`);
  }
  return html;
}

const log = [];

// ==================
// 1. INDEX.HTML
// ==================
const indexPath = path.join(WEBSITE_DIR, 'index');
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

indexHtml = applyContactInfo(indexHtml);
indexHtml = applySocialLinks(indexHtml);

// Trust Strip
if (config.trustStrip && config.trustStrip.length > 0) {
  const trustGridRegex = /(class="trust-strip__grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/;
  const trustItems = config.trustStrip.map(item =>
    `\n        <div class="trust-strip__item animate-on-scroll">\n          <div class="trust-strip__icon"><i class="fas ${item.icon}"></i></div>\n          <div class="trust-strip__text">\n            <strong>${item.title}</strong>\n            <span>${item.subtitle}</span>\n          </div>\n        </div>`
  ).join('');
  indexHtml = indexHtml.replace(trustGridRegex, `$1${trustItems}\n      $2`);
}

// Features
if (config.features && config.features.length > 0) {
  const featuresGridRegex = /(class="features-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/;
  const featureItems = config.features.map(f =>
    `\n        <div class="info-card animate-on-scroll">\n          <div class="info-card__icon"><i class="fas ${f.icon}"></i></div>\n          <h3 class="info-card__title">${f.title}</h3>\n          <p class="info-card__text">${f.text}</p>\n        </div>`
  ).join('');
  indexHtml = indexHtml.replace(featuresGridRegex, `$1${featureItems}\n      $2`);
}

// CTA
const ctaRegex = /(<section class="cta-section section">\s*<div class="container">)[\s\S]*?(<div class="cta-section__actions">)/;
if (ctaRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(ctaRegex, `$1\n      <h2>${config.cta.title || 'מוכנים להזמין?'}</h2>\n      <p>${config.cta.subtitle || ''} מינימום הזמנה ${config.cta.minOrder || ''}.</p>\n      $2`);
}

// Stats
indexHtml = replaceDataCount(indexHtml, 'לקוחות פעילים', config.stats.activeCustomers);
indexHtml = replaceDataCount(indexHtml, 'מוצרים בקטלוג', config.stats.productsInCatalog);
indexHtml = replaceDataCount(indexHtml, 'זמן אספקה', config.stats.deliveryHours);
indexHtml = replaceDataCount(indexHtml, 'שנות ניסיון', config.stats.yearsExperience);
indexHtml = replaceDataCount(indexHtml, 'משלוחים בשנה', config.stats.deliveriesPerYear);
indexHtml = replaceDataCount(indexHtml, 'שביעות רצון', config.stats.satisfactionRate);

// Schema
const orgSchemaRegex = /<script\s+type="application\/ld\+json">\s*\{[\s\S]*?"@type":\s*"Organization"[\s\S]*?\}\s*<\/script>/;
if (orgSchemaRegex.test(indexHtml)) {
  const sameAs = [config.social?.facebook, config.social?.instagram].filter(Boolean);
  const p = config.business.phone;
  const newSchema = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "${config.business.name}",
    "alternateName": "${config.business.nameEn}",
    "url": "https://ymarket.co.il",
    "telephone": "+972-${p.replace(/^0/, '').replace(/-/g, '-')}",
    "email": "${config.business.email}",
    "description": "${config.business.description}",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IL",
      "addressLocality": "${config.business.city}"
    },
    "foundingDate": "${config.business.foundingYear}",
    "sameAs": [${sameAs.map(u => `"${u}"`).join(', ')}]
  }
  </script>`;
  indexHtml = indexHtml.replace(orgSchemaRegex, newSchema);
}

fs.writeFileSync(indexPath, indexHtml, 'utf-8');
log.push('✓ index');

// ==================
// 2. ALL OTHER PAGES
// ==================
const allFiles = ['about', 'contact', 'catalog', 'faq', 'blog', 'login', 'register', 'cart', 'tracking', 'checkout', 'order-success'];
for (const file of allFiles) {
  const fp = path.join(WEBSITE_DIR, file);
  if (!fs.existsSync(fp)) continue;
  const orig = fs.readFileSync(fp, 'utf-8');
  let html = applyContactInfo(orig);
  html = applySocialLinks(html);

  // about.html specific
  if (file === 'about') {
    html = html.replace(/"foundingDate":\s*"\d{4}"/g, `"foundingDate": "${config.business.foundingYear}"`);
    html = replaceDataCount(html, 'לקוחות פעילים', config.stats.activeCustomers);
    html = replaceDataCount(html, 'מוצרים בקטלוג', config.stats.productsInCatalog);
    html = replaceDataCount(html, 'שנות ניסיון', config.stats.yearsExperience);
    // Schema
    if (orgSchemaRegex.test(html)) {
      const p = config.business.phone;
      html = html.replace(orgSchemaRegex, `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "וואי מרקט - נגלר סחר והפצה",
    "url": "https://ymarket.co.il",
    "telephone": "+972-${p.replace(/^0/, '').replace(/-/g, '-')}",
    "email": "${config.business.email}",
    "description": "אספקת מוצרי צריכה שוטפת לעסקים ומוסדות בכל הארץ",
    "areaServed": "IL",
    "foundingDate": "${config.business.foundingYear}"
  }
  </script>`);
    }
  }

  // contact.html specific
  if (file === 'contact') {
    const localBizRegex = /<script\s+type="application\/ld\+json">\s*\{[\s\S]*?"@type":\s*"LocalBusiness"[\s\S]*?\}\s*<\/script>/;
    if (localBizRegex.test(html)) {
      const p = config.business.phone;
      html = html.replace(localBizRegex, `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "וואי מרקט - נגלר סחר והפצה",
    "telephone": "+972-${p.replace(/^0/, '').replace(/-/g, '-')}",
    "email": "${config.business.email}",
    "url": "https://ymarket.co.il",
    "openingHours": "Su-Th 08:00-17:00",
    "areaServed": "IL"
  }
  </script>`);
    }
  }

  // faq.html - min order
  if (file === 'faq') {
    html = html.replace(/1,600\s*₪\s*\+\s*מע"מ/g, config.cta.minOrder);
    // Also in JSON-LD
    html = html.replace(/1,600\s*₪\s*\+\s*מע\\"מ/g, config.cta.minOrder);
  }

  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf-8');
    log.push(`✓ ${file}`);
  } else {
    log.push(`- ${file} (no change)`);
  }
}

// ==================
// 3. LEGAL PAGES
// ==================
const legalDir = path.join(WEBSITE_DIR, 'legal');
if (fs.existsSync(legalDir)) {
  const legalFiles = fs.readdirSync(legalDir).filter(f => f.endsWith(''));
  let legalUpdated = 0;
  for (const file of legalFiles) {
    const fp = path.join(legalDir, file);
    const orig = fs.readFileSync(fp, 'utf-8');
    let html = applyContactInfo(orig);
    html = applySocialLinks(html);
    if (file === 'terms') {
      html = html.replace(/1,600\s*₪\s*\+\s*מע"מ/g, config.cta.minOrder);
    }
    if (html !== orig) {
      fs.writeFileSync(fp, html, 'utf-8');
      legalUpdated++;
    }
  }
  log.push(`✓ legal/ - ${legalUpdated} files`);
}

// ==================
// 4. BLOG POSTS
// ==================
const blogDir = path.join(WEBSITE_DIR, 'blog');
if (fs.existsSync(blogDir)) {
  const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith(''));
  let blogUpdated = 0;
  for (const file of blogFiles) {
    const fp = path.join(blogDir, file);
    const orig = fs.readFileSync(fp, 'utf-8');
    let html = applyContactInfo(orig);
    html = applySocialLinks(html);
    if (html !== orig) {
      fs.writeFileSync(fp, html, 'utf-8');
      blogUpdated++;
    }
  }
  log.push(`✓ blog/ - ${blogUpdated} files`);
}

// ==================
// 5. PRODUCT PAGES
// ==================
const productsDir = path.join(WEBSITE_DIR, 'products');
if (fs.existsSync(productsDir)) {
  const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith(''));
  let prodUpdated = 0;
  for (const file of productFiles) {
    const fp = path.join(productsDir, file);
    const orig = fs.readFileSync(fp, 'utf-8');
    let html = applyContactInfo(orig);
    html = applySocialLinks(html);
    if (html !== orig) {
      fs.writeFileSync(fp, html, 'utf-8');
      prodUpdated++;
    }
  }
  log.push(`✓ products/ - ${prodUpdated} files`);
}

console.log('\n=== APPLY CONFIG RESULTS ===');
log.forEach(l => console.log(l));
console.log(`\nDone! ${log.filter(l => l.startsWith('✓')).length} items updated.`);
