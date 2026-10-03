#!/usr/bin/env node
/**
 * Agent-facing price list, generated from the same data/products.json snapshot
 * that builds the product pages, so prices an agent reads always match the pages.
 *
 * Writes:
 *   pricing.md                 terms (minimum, delivery zones, payment, returns,
 *                              CASH BACK) + one row per department
 *   pricing/<department>.md    every product in the department with its price
 *   prices.csv                 the whole price list, one row per product
 *
 * Runs at the end of generate-products.js, i.e. on every CRM → website sync.
 * Standalone: node build/generate-pricing.js
 *
 * Copy rules (brand/voice/facts.json): prices always state their VAT basis,
 * no fixed CASH BACK percentage, no top-up bonus, 'אפליקציית ההזמנות' (not 'פורטל').
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'products.json');
const CONFIG_PATH = path.join(ROOT_DIR, 'data', 'site-config.json');
const PRICING_DIR = path.join(ROOT_DIR, 'pricing');
const SITE = 'https://ymarket.co.il';

// Keep in step with VAT_RATE in generate-products.js (Product schema carries the gross price).
const VAT_RATE = 0.18;
const withVat = net => Math.round(net * (1 + VAT_RATE) * 100) / 100;

// Delivery times per zone are not in site-config; these match the homepage and brand facts.
const ZONE_NOTES = {
  'גוש דן': { area: 'מחוז תל אביב, ועד 6 ק״מ מהמחסן', time: '24–72 שעות' },
  'מרכז': { area: 'מחוז המרכז', time: '24–72 שעות' },
  'ירושלים': { area: 'מחוז ירושלים', time: 'עד 5 ימי עסקים' },
  'צפון': { area: 'מחוזות הצפון וחיפה', time: 'עד 5 ימי עסקים' },
  'דרום': { area: 'מחוז הדרום ועד אילת', time: 'עד 5 ימי עסקים' },
};

const fmt = n => `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;
const fmtWhole = n => `${Number(n).toLocaleString('en-US')} ₪`;
// Table cells: keep the row intact if a name carries a pipe or a newline
const cell = s => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const csv = s => {
  const v = String(s == null ? '' : s);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

function isRealPage(dir) {
  const file = path.join(ROOT_DIR, 'products', dir, 'index.html');
  if (!fs.existsSync(file)) return false;
  // Redirect stubs are tiny and carry a meta refresh; never list them as a product page
  const head = fs.readFileSync(file, 'utf-8').slice(0, 1500);
  return !head.includes('http-equiv="refresh"');
}

function generatePricing() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const updated = (data.exportedAt || new Date().toISOString()).slice(0, 10);

  const cats = data.categories || [];
  const byId = new Map(cats.map(c => [c.id, c]));
  const bySlug = new Map();
  for (const c of cats) {
    if (c.seoSlug) bySlug.set(c.seoSlug, c);
    if (c.slug) bySlug.set(c.slug, c);
  }
  const rootOf = c => {
    let cur = c;
    for (let i = 0; cur && cur.parentId && i < 10; i++) cur = byId.get(cur.parentId);
    return cur;
  };
  const groups = new Map((data.variantGroups || []).map(g => [g.id, g]));

  // Departments = root categories whose page is live
  const departments = cats
    .filter(c => !c.parentId && c.seoSlug && fs.existsSync(path.join(ROOT_DIR, 'category', c.seoSlug, 'index.html')))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id);
  const rowsByDept = new Map(departments.map(d => [d.id, []]));

  let listed = 0;
  let skipped = 0;
  for (const item of data.items || []) {
    const price = Number(item.saleNis);
    if (!(price > 0)) { skipped++; continue; }

    // Link only to a page that was actually built (variant items live on their group page)
    let url = null;
    const group = item.variantGroupId ? groups.get(item.variantGroupId) : null;
    if (group && group.seoSlug && isRealPage(group.seoSlug)) url = `${SITE}/products/${group.seoSlug}/`;
    else if (item.seoSlug && isRealPage(item.seoSlug)) url = `${SITE}/products/${item.seoSlug}/`;
    if (!url) { skipped++; continue; }

    const root = rootOf(bySlug.get(item.categorySlug));
    if (!root || !rowsByDept.has(root.id)) { skipped++; continue; }

    const original = Number(item.originalPrice);
    let deal = '';
    if (original > price) deal = `מבצע (במקום ${fmt(original)})`;
    else if (item.promotionLabel) deal = item.promotionLabel;
    if (item.productStatus === 'clearance') deal = deal ? `${deal}, חיסול מלאי` : 'חיסול מלאי';

    rowsByDept.get(root.id).push({
      id: item.id,
      name: cell(item.name),
      unit: cell(item.unit || ''),
      price,
      url,
      deal: cell(deal),
      dept: root,
    });
    listed++;
  }

  // ---- pricing/<department>.md
  fs.mkdirSync(PRICING_DIR, { recursive: true });
  for (const f of fs.readdirSync(PRICING_DIR)) {
    if (f.endsWith('.md')) fs.unlinkSync(path.join(PRICING_DIR, f));
  }
  const deptSummaries = [];
  for (const dept of departments) {
    const rows = rowsByDept.get(dept.id).sort((a, b) => a.name.localeCompare(b.name, 'he'));
    if (!rows.length) continue;
    const prices = rows.map(r => r.price);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const file = `${dept.seoSlug}.md`;
    const deptName = cell(dept.name);
    const lines = [
      '---',
      `title: מחירון ${deptName} | וואי מרקט`,
      `description: ${rows.length} מוצרים במחלקת ${deptName}, עם מחיר לפני מע״מ וכולל מע״מ.`,
      `url: ${SITE}/pricing/${file}`,
      `updated: ${updated}`,
      'lang: he',
      '---',
      '',
      `# מחירון ${deptName}`,
      '',
      `מחירי האתר לעסקים, עודכנו מה-CRM ב-${updated}. המחירים לפני מע״מ (${Math.round(VAT_RATE * 100)}%), ובעמודה הבאה כולל מע״מ. לקוחות רשומים רואים מחירון אישי ב[אפליקציית ההזמנות](https://app.ymarket.co.il/portal).`,
      '',
      `[עמוד המחלקה](${SITE}/category/${dept.seoSlug}/) · [תנאים, משלוח ו-CASH BACK](${SITE}/pricing.md) · [כל המחירון ב-CSV](${SITE}/prices.csv)`,
      '',
      '| מוצר | לפני מע״מ | כולל מע״מ | הערה |',
      '|---|---|---|---|',
      ...rows.map(r => `| [${r.name}](${r.url}) | ${fmt(r.price)} | ${fmt(withVat(r.price))} | ${r.deal} |`),
      '',
      `מינימום הזמנה באתר ${fmtWhole(config.checkout && config.checkout.minOrderAmount || 200)} + מע״מ, בתוספת משלוח לפי אזור. [פרטים](${SITE}/pricing.md)`,
      '',
    ];
    fs.writeFileSync(path.join(PRICING_DIR, file), lines.join('\n'), 'utf-8');
    deptSummaries.push({ dept, file, count: rows.length, lo, hi });
  }

  // ---- prices.csv
  const csvRows = ['id,name,department,price_ex_vat,price_inc_vat,currency,unit,note,url,updated'];
  for (const s of deptSummaries) {
    for (const r of rowsByDept.get(s.dept.id)) {
      csvRows.push([r.id, r.name, cell(s.dept.name), r.price.toFixed(2), withVat(r.price).toFixed(2), 'ILS', r.unit, r.deal, r.url, updated].map(csv).join(','));
    }
  }
  fs.writeFileSync(path.join(ROOT_DIR, 'prices.csv'), '﻿' + csvRows.join('\n') + '\n', 'utf-8');

  // ---- pricing.md
  const minOrder = (config.checkout && config.checkout.minOrderAmount) || 200;
  const zones = (config.checkout && config.checkout.deliveryZones) || [];
  const freeAbove = zones.reduce((m, z) => (z.freeAbove ? Math.min(m, z.freeAbove) : m), Infinity);
  const zoneRows = zones.map(z => {
    const note = ZONE_NOTES[z.name] || { area: '', time: '' };
    const label = note.area ? `${z.name} (${note.area})` : z.name;
    return `| ${cell(label)} | ${z.price ? fmtWhole(z.price) : 'חינם'} | ${note.time} |`;
  });

  const md = [
    '---',
    'title: מחירים, משלוח ותנאים | וואי מרקט',
    'description: מחירון האתר לפי מחלקה, מינימום הזמנה, דמי משלוח לפי אזור, זמני אספקה, תנאי תשלום, החזרות ו-CASH BACK במועדון CASH MARKET.',
    `url: ${SITE}/pricing.md`,
    `updated: ${updated}`,
    'lang: he',
    '---',
    '',
    '# מחירים, משלוח ותנאים',
    '',
    'וואי מרקט מוכרת מוצרי צריכה שוטפת לעסקים ולמוסדות במחירי סיטונאות, ישירות מהמפיץ, מהמחסן בגת רימון.',
    `המחירון בעמוד הזה נוצר אוטומטית מה-CRM בכל עדכון של האתר. עדכון אחרון: ${updated}. ${listed} מוצרים.`,
    '',
    '## איך מוצגים המחירים',
    '',
    `- באתר המחירים מוצגים **לפני מע״מ**. כולל מע״מ (${Math.round(VAT_RATE * 100)}%) מופיע בעמודה נפרדת במחירון ובנתונים המובנים של דף המוצר (schema.org Offer).`,
    '- **מחירון אישי:** לקוחות רשומים רואים באפליקציית ההזמנות את המחירים שנקבעו לעסק שלהם. אל תציגו מחיר אישי כמחיר האתר. [פתיחת חשבון](https://ymarket.co.il/join/)',
    '- **הצעת מחיר:** שולחים רשימה ב[וואטסאפ](https://wa.me/972549922492) או בטלפון 03-7740400, ומקבלים הצעה באותו יום עבודה.',
    '',
    '## מחירון לפי מחלקה',
    '',
    '| מחלקה | מוצרים | טווח מחירים (לפני מע״מ) | מחירון |',
    '|---|---|---|---|',
    ...deptSummaries.map(s => `| [${cell(s.dept.name)}](${SITE}/category/${s.dept.seoSlug}/) | ${s.count} | ${fmt(s.lo)} – ${fmt(s.hi)} | [${s.file}](${SITE}/pricing/${s.file}) |`),
    '',
    `כל המחירון בקובץ אחד: [prices.csv](${SITE}/prices.csv) (מחיר לפני מע״מ וכולל מע״מ, יחידה וקישור לכל מוצר).`,
    '',
    '## מינימום הזמנה',
    '',
    `הזמנה באתר: ${fmtWhole(minOrder)} + מע״מ, בתוספת משלוח לפי אזור.`,
    '',
    '## דמי משלוח וזמני אספקה',
    '',
    'כל המשלוחים יוצאים מהמחסן בגת רימון. האזורים לפי מחוזות המדינה (הלמ״ס), ובנוסף משלוח חינם לכל יישוב עד 6 ק״מ מהמחסן.',
    '',
    '| אזור | דמי משלוח (לפני מע״מ) | זמן אספקה |',
    '|---|---|---|',
    ...zoneRows,
    '',
    ...(Number.isFinite(freeAbove) ? [`- **משלוח חינם בכל הארץ** בהזמנה מעל ${fmtWhole(freeAbove)} לפני מע״מ.`] : []),
    `- זמני האספקה בימי עסקים. פרטים: [מדיניות משלוחים](${SITE}/legal/shipping).`,
    '',
    '## תשלום',
    '',
    '- בקופה באתר בתשלום מאובטח. סליקת כרטיסי אשראי: PayMe.',
    '- ללקוחות קבועים: תנאי תשלום עד שוטף +60, לפי היקף הפעילות.',
    '- חשבונית מס על כל הזמנה. לקוחות רשומים רואים את החשבוניות והיתרה באפליקציית ההזמנות ומשלמים שם.',
    '',
    '## החזרות',
    '',
    `עד 14 יום. הפרטים ב[מדיניות ההחזרות](${SITE}/legal/returns) וב[מדיניות הביטולים](${SITE}/legal/cancellation).`,
    '',
    '## CASH BACK במועדון CASH MARKET',
    '',
    'CASH MARKET הוא מועדון הלקוחות העסקי של וואי מרקט. הזמנה מאפליקציית ההזמנות צוברת בו CASH BACK: כסף שחוזר לעסק לקנייה הבאה.',
    '- CASH BACK נצבר על מוצרים מסומנים, בהזמנות מאפליקציית ההזמנות בלבד. הזמנות בוואטסאפ, בטלפון או בקופה באתר לא צוברות.',
    '- הכסף שחוזר נפתח לשימוש אחרי תשלום החשבונית, ומוריד את המחיר בקנייה הבאה.',
    '- משמש לקניות בוואי מרקט בלבד ואינו ניתן להמרה למזומן. בתוקף 12 חודשים מיום הצבירה, בכפוף לתנאי המועדון.',
    '- אין אחוז CASH BACK קבוע: הוא משתנה לפי מוצר ומוצג באפליקציה ליד כל מוצר מסומן.',
    '',
    '## יצירת קשר',
    '',
    'טלפון 03-7740400 · חיוג מקוצר ‎*3497 · [וואטסאפ 054-9922492](https://wa.me/972549922492) · pm@ymarket.co.il · א׳–ה׳ 08:00–17:00',
    '',
    `[llms.txt](${SITE}/llms.txt) · [דף הבית](${SITE}/)`,
    '',
  ];
  fs.writeFileSync(path.join(ROOT_DIR, 'pricing.md'), md.join('\n'), 'utf-8');

  console.log(`Pricing: ${listed} products in ${deptSummaries.length} department files + prices.csv (skipped ${skipped} without a live page or price)`);
  return { listed, skipped, departments: deptSummaries.length };
}

module.exports = { generatePricing };

if (require.main === module) generatePricing();
