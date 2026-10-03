#!/usr/bin/env node
/**
 * Copy policy for the catalog texts that come from the CRM export (data/products.json).
 *
 * The category/item SEO texts were mass-generated and carried claims we cannot stand
 * behind: "מעל 200 לקוחות", "חיסכון של עד 30%/40%/50%", "מאושרת למגע מזון" on every
 * packaging item, "אקולוגיה תעשייתית", a nationwide 24-72h / "למחרת" promise, customer
 * names, "עסקים קטנים", and titles the CRM cut off at 60 chars ("| וו...").
 *
 * sanitizeCatalog(data) rewrites those texts in place. It is deterministic and
 * idempotent, and both generators run it on load — so a fresh CRM export cannot put
 * the claims back on the site even before the CRM fields themselves are corrected.
 *
 *   node build/catalog-copy-policy.js           → rewrites data/products.json (same
 *                                                 2-space formatting, UTF-8, no BOM)
 *   node build/catalog-copy-policy.js --check   → only reports what would change
 *
 * CRM fields that hold the same texts (fix there too, or the next export re-imports
 * them and this file keeps having to scrub them):
 *   portal_categories.meta_title / seo_content / geo_content / faq_json
 *   items.technical_desc / geo_content / faq_json (+ item_faqs)
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'products.json');

// Source of truth: legal/shipping.html + index.html delivery zones.
const DELIVERY_LONG = '24–72 שעות בגוש דן ובמרכז, ועד 5 ימי עסקים לשאר הארץ';
const DELIVERY_SHORT = '24–72 שעות בגוש דן ובמרכז · עד 5 ימי עסקים בשאר הארץ';
const RESPONSE_TIME = "מענה באותו יום עבודה, א'–ה' 08:00–17:00";
const TITLE_MAX = 60;
const TITLE_SUFFIX = ' | וואי מרקט';

// ---------------------------------------------------------------------------
// 1. Plain text substitutions, applied to every string in categories and items.
//    Order matters: longer / more specific patterns first.
// ---------------------------------------------------------------------------
const TEXT_RULES = [
  // --- we are a distributor, not a manufacturer (Yuval, 30/09) ---
  [/(ישירה|ישירות|ישיר) מהיצרן/g, '$1 מהמפיץ'],
  // --- delivery time ---
  [/\{"label":"אספקה","value":"1-3 ימי עסקים"\}/g, `{"label":"אספקה","value":"${DELIVERY_SHORT}"}`],
  [/זמן אספקה סטנדרטי: 1-3 ימי עסקים לאזור גוש דן, ועד 5 ימי עסקים לפריפריה\./g, `זמן אספקה: ${DELIVERY_LONG}.`],
  [/אספקה תוך 24-72 שעות לכל רחבי ישראל\. לקוחות באזור גוש דן — בדרך כלל למחרת\. אנו מתחייבים לזמני אספקה אמינים ועקביים\./g, `אספקה תוך ${DELIVERY_LONG}.`],
  [/<li><strong>אספקה ב-24 שעות<\/strong> — הזמנה עד 14:00, אצלכם למחרת בגוש דן<\/li>/g, '<li><strong>אספקה תוך 24–72 שעות</strong> — בגוש דן ובמרכז, ועד 5 ימי עסקים לשאר הארץ</li>'],
  [/אספקה תוך 24-72 שעות לכל רחבי ישראל\.(?: [^."]*למחרת\.)?/g, `אספקה תוך ${DELIVERY_LONG}.`],
  [/24-72 שעות לכל רחבי ישראל(?:, למחרת באזור גוש דן)?/g, DELIVERY_LONG],
  [/1-3 ימי עסקים לגוש דן, ועד 5 ימי עסקים לפריפריה\./g, `${DELIVERY_LONG}.`],
  [/^24-72 שעות בכל הארץ$/g, DELIVERY_SHORT],
  [/24-72 שעות בכל הארץ/g, DELIVERY_LONG],
  [/(, )24-72 שעות$/g, '$124–72 שעות בגוש דן ובמרכז'],
  [/\(24-72 ש'\)/g, '(24–72 שעות בגוש דן ובמרכז)'],
  [/(אספקה(?: מהירה)? (?:תוך )?)24-72 שעות(?![^<.]*(?:גוש דן|במרכז))/g, '$124–72 שעות בגוש דן ובמרכז (עד 5 ימי עסקים לשאר הארץ)'],
  // --- response-time promises ---
  [/ונכין לכם הצעה תוך שעות/g, 'ונחזור אליכם עם הצעה באותו יום עבודה'],
  [/ונחזור אליכם תוך שעות/g, `— ${RESPONSE_TIME}`],
  // --- savings percentages nobody measured ---
  [/(?:,\s*|\s*ל)חיסכון של עד \d+%\s*(?:לעומת|מול)\s*[^.<,]+/g, ''],
  [/\s*מינון נכון חוסך עד \d+% בצריכת חומר\./g, ''],
  [/סבון foam חוסך עד 50% מכמות הסבון/g, 'סבון foam חסכוני יותר בכמות הסבון'],
  // --- blanket food-contact certification on every packaging item ---
  [/,\s*מאושרת למגע מזון/g, ''],
  // --- "קטנים" ---
  [/מתאים גם לעסקים קטנים וגם למוסדות גדולים\?/g, 'מתאים לעסקים ולמוסדות בכל גודל?'],
  [/ממשרד קטן ומינימרקט ועד/g, 'ממשרד ומינימרקט ועד'],
  [/משרדים קטנים/g, 'משרדים עם צריכה נמוכה'],
  // --- customer names and the invented numbers next to them ---
  [/<h3>שקיות למיון — הרגולציה מתקרבת<\/h3>/g, '<h3>שקיות למיון פסולת</h3>'],
  [/עיריות כמו ראשון לציון \(לקוחה שלנו\) כבר דורשות הפרדת פסולת\./g, 'יותר ויותר עסקים ומוסדות מפרידים פסולת לפי סוג.'],
  [/<strong>אנחנו מספקים שקיות בכל הצבעים<\/strong> — תהיו מוכנים לפני שזה הופך לחובה\./g, '<strong>אנחנו מספקים שקיות בכל הצבעים</strong>.'],
  [/מפיצים כמו פליישן ואמנון זדה \(לקוחות שלנו\) צורכים/g, 'מפיצים ומחסנים לוגיסטיים צורכים'],
  [/<strong>פאלט סטרץ' = הנחה של 20-30%<\/strong> מול רכישה בחבילות בודדות\./g, "<strong>רכישה בפאלט = מחיר כמות</strong> לעומת רכישה בחבילות בודדות."],
  [/<h2>מומחיות בניקוי מוסדי — מניסיון של מאות לקוחות<\/h2>/g, '<h2>מומחיות בניקוי מוסדי</h2>'],
  [/חברת ניקיון שמנקה 34 אתרים צריכה/g, 'חברת ניקיון שמנהלת אתרים רבים צריכה'],
  [/<li><strong>מעבדת מינון<\/strong> — אנחנו בודקים את סוג המשטחים שלכם וממליצים על ריכוז מדויק<\/li>/g, '<li><strong>ייעוץ מינון</strong> — נמליץ על ריכוז לפי סוג המשטחים שלכם</li>'],
  [/חלופות גנריות באותה איכות ב-40% פחות/g, 'חלופות גנריות במחיר נמוך יותר'],
  [/ \(כולל מרכז ספורט קריית אונו\)/g, ''],
  // --- per-category template copy stamped on every item of a category (Yuval 01/10: remove) ---
  // "MSDS", "ריכוז גבוה", "אטימות מלאה, עמידות בחום/קור" and "מגוון גדלים" were printed on
  // straws, hand dryers and bleach alike; none of it is a fact about the item.
  [/<p><strong>יתרונות:<\/strong> (?:אטימות מלאה, עמידות בחום\/קור\. אידאלית למשלוחי מזון ול-Take Away\.|ריכוז גבוה, חסכוני בשימוש\. מגיע עם גיליון בטיחות \(MSDS\) בעברית כנדרש בתקנות הבטיחות בעבודה\.|אספקה שוטפת ואמינה, מגוון גדלים ומותגים\.)<\/p>\s*/g, ''],
  [/^(?:אריזות מזון מקצועי — אטימות מלאה|חומרי ניקוי מקצועי — ריכוז גבוה לחיסכון)$/g, ''],
  [/\s*—\s*אטימות מלאה$/g, ''],
  [/ \| אטימות מלאה(?= \|)/g, ''],
  [/\. אטימות מלאה (ל(?:עסקים ומוסדות|מוסדות ועסקים))/g, ' $1'],
  [/, אטימות מלאה\./g, '.'],
  [/ לאטימות מלאה\./g, '.'],
  [/אטימות מלאה, /g, ''],
  // --- standards / approvals / food-contact claims (Yuval 30/09: remove all) ---
  // spec rows inside technicalDesc JSON strings: [{"label":"בטיחות מזון","value":"מאושר למגע מזון"}, …]
  [/,\{"label":"[^"]*","value":"[^"]*(?:מאושר\S* למגע|למגע (?:ישיר )?(?:עם )?מזון|עומד\S* ב?תקנ|תקני (?:ה)?בטיחות)[^"]*"\}/g, ''],
  [/\{"label":"[^"]*","value":"[^"]*(?:מאושר\S* למגע|למגע (?:ישיר )?(?:עם )?מזון|עומד\S* ב?תקנ|תקני (?:ה)?בטיחות)[^"]*"\},?/g, ''],
  [/\s*[—–-]\s*עומד בתקני בטיחות(?=["<]|$)/g, ''],
  [/אישור אמ["״]ר,?\s*/g, ''],
  [/בחירה, מידות, אמ["״]ר ומחיר סיטונאי/g, 'בחירה, מידות ומחיר סיטונאי'],
  [/מתאי(?:ם|מה|מות|מים) למגע (?:ישיר )?(?:עם )?מזון,?\s*/g, ''],
  [/נושא(?:ות|ים|ת)? <strong><\/strong> לשימוש רפואי,\s*/g, ''],
  [/,\s*מתאימות <strong>למגע עם מזון<\/strong> ו(עומדות)/g, ', $1'],
  [/\. הוא מתאים <strong>למגע עם מזון<\/strong> ונושא <strong>כשרות[^<]*<\/strong> — /g, '. '],
  [/<li>(?:(?!<\/li>).)*?(?:עומד(?:ת|ים|ות)? ב?תקנ|מכון התקנים|\bCE\b|\bISO\b|משרד הבריאות)(?:(?!<\/li>).)*?<\/li>\s*/g, ''],
  [/,\s*עומד(?:ת|ים|ות)? בתקני בטיחות ישראליים/g, ''],
  // any remaining sentence (inside a text node) that makes such a claim goes entirely
  [/[^.<>"]*(?:עומד(?:ת|ים|ות)? ב?תקנ|תקני (?:ה)?בטיחות (?:ה)?(?:מזון|המחייבים|ישראליים)|מאושר(?:ת|ים|ות)? למגע|משרד הבריאות|\bCE\b|\bISO\b|מכון התקנים)[^.<>"]*\.\s?/g, ''],
  // --- "כירוגית" (surgical) is a medical-device claim we hold no document for (03/10, same
  //     ruling as the mask group name in 71984e48). Only the website text changes, not the
  //     Rivhit item name; slug / seoSlug / searchTags are skipped (TEXT_SKIP_KEYS) so the legacy
  //     Hebrew URLs keep redirecting and site search still finds the word.
  [/(?<![֐-׿])כירור?גי(?:ת|ות)(?![֐-׿])/g, 'חד פעמית'],
  // "מסכה רפואית" (item 69): its box reads "DISPOSABLE CIVILIAN MASK — NON-MEDICAL" (03/10).
  [/(?<![֐-׿])(ב?)מסכה רפואית(?![֐-׿])/g, '$1מסכה חד פעמית'],
  [/(?<![֐-׿])(ב?)מסכות רפואיות(?![֐-׿])/g, '$1מסכות חד פעמיות'],
  [/לשימוש רפואי, מטבחי ותעשייתי/g, 'לשימוש מטבחי ותעשייתי'],
  [/חד פעמית חד פעמית/g, 'חד פעמית'],
];

// Identifier and search-keyword fields, never visible copy.
const TEXT_SKIP_KEYS = new Set(['slug', 'seoSlug', 'searchTags']);

// FAQ entries and spec rows that exist only to make such a claim are dropped whole.
const CLAIM_RE = /עומד(?:ת|ים|ות)? ב?תקנ|תקני (?:ה)?בטיחות|מאושר(?:ת|ים|ות)? למגע|למגע (?:ישיר )?(?:עם )?מזון|משרד הבריאות|\bCE\b|\bISO\b|מכון התקנים|אמ["״]ר/;
function dropClaimEntries(list) {
  if (!Array.isArray(list)) return list;
  return list.filter(e => !(e && typeof e === 'object' && Object.values(e).some(v => typeof v === 'string' && CLAIM_RE.test(v))));
}

// Meta descriptions are length-limited: they get the short zone wording only.
const META_KEYS = new Set(['metaDescription', 'metaDesc', 'seoMetaDesc']);

function applyTextRules(s, key) {
  if (TEXT_SKIP_KEYS.has(key)) return s;
  let out = s;
  if (META_KEYS.has(key)) out = out.replace(/(אספקה(?: מהירה)? (?:תוך )?)24-72 שעות(?![^<.]*(?:גוש דן|במרכז))/g, '$124–72 שעות בגוש דן ובמרכז');
  for (const [re, rep] of TEXT_RULES) out = out.replace(re, rep);
  return out;
}

function walkStrings(obj, fn, key) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') obj[i] = fn(obj[i], key);
      else if (obj[i] && typeof obj[i] === 'object') walkStrings(obj[i], fn, key);
    }
  } else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') obj[k] = fn(obj[k], k);
      else if (obj[k] && typeof obj[k] === 'object') walkStrings(obj[k], fn, k);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. The generic category template (69 categories): rebuilt from real facts only.
//    Recognised by its fixed "למה וואי מרקט?" list; the audience line is kept.
// ---------------------------------------------------------------------------
const GENERIC_SEO_MARK = '<h3>למה וואי מרקט?</h3>';
const GENERIC_GEO_MARK = '<h2>YMARKET — הספק שמנהלי רכש סומכים עליו</h2>';

function audienceFrom(text, re) {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function rebuildGenericSeo(cat) {
  const src = cat.seoContent;
  const name = (cat.name || '').trim();
  const audience = audienceFrom(src, /שלנו מתאימים במיוחד ל([^.<]+)\./) || 'עסקים ומוסדות';
  const wa = (src.match(/href="(https:\/\/wa\.me\/972549922492[^"]*)"/) || [])[1] || 'https://wa.me/972549922492';
  return `<div class="category-seo">
  <h2>${name} בסיטונאות לעסקים ומוסדות</h2>
  <p>ב-<strong>YMARKET</strong> תמצאו ${name} במחירי סיטונאות לעסקים ומוסדות. אנחנו מפיצים ישירים: ההזמנה יוצאת מהמחסן שלנו בגת רימון, בלי מתווכים בדרך.</p>

  <h3>למי מתאים?</h3>
  <p>${name} שלנו מתאימים במיוחד ל${audience} — לעסקים ולמוסדות בכל גודל.</p>

  <h3>איך זה עובד</h3>
  <ul>
    <li><strong>מחירון אישי</strong> — לקוחות קבועים מקבלים מחירון מותאם ותנאי תשלום של עד שוטף +60</li>
    <li><strong>הזמנה פשוטה</strong> — בפורטל ההזמנות <a href="https://app.ymarket.co.il/portal">app.ymarket.co.il/portal</a>, בוואטסאפ 054-9922492 או בטלפון 03-7740400</li>
    <li><strong>זמני אספקה</strong> — ${DELIVERY_LONG}</li>
    <li><strong>מינימום ומשלוח</strong> — מינימום הזמנה 200 ₪ + מע"מ; משלוח לפי אזור, חינם בגוש דן ובהזמנה מעל 2,000 ₪ לפני מע"מ</li>
  </ul>

  <p><strong>מעוניינים בהצעת מחיר מותאמת?</strong> <a href="/contact">צרו קשר</a> או שלחו הודעה ישירה ב<a href="${wa}" target="_blank" rel="noopener">וואטסאפ</a> — ${RESPONSE_TIME}.</p>
</div>`;
}

function rebuildGenericGeo(cat) {
  const src = cat.geoContent;
  const name = (cat.name || '').trim();
  const audience = audienceFrom(src, /הצרכים הייחודיים של ([^.<]+)\./) || 'עסקים ומוסדות';
  return `<h2>YMARKET — ספק אחד לצריכה השוטפת של העסק</h2>
<p>אנחנו מספקים ${name} ומוצרי צריכה שוטפת ל${audience}. כל לקוח מקבל מחירון אישי ומענה אנושי, וההזמנה יוצאת מהמחסן שלנו בגת רימון.</p>
<ul>
  <li><strong>ספק אחד</strong> — ניקיון, נייר, חד פעמי, אריזות וציוד משרדי בהזמנה אחת ובחשבונית אחת</li>
  <li><strong>שירות אישי</strong> — ${RESPONSE_TIME}</li>
  <li><strong>אספקה</strong> — ${DELIVERY_LONG}</li>
  <li><strong>תנאי תשלום</strong> — ללקוחות קבועים עד שוטף +60</li>
</ul>`;
}

// ---------------------------------------------------------------------------
// 3. Titles the CRM truncated at 60 chars ("... | וו...").
// ---------------------------------------------------------------------------
function isTruncatedTitle(t) {
  return typeof t === 'string' && /(\.\.\.|…)\s*$/.test(t);
}

function buildTitle(cat, byId) {
  const name = (cat.name || '').trim();
  const parent = cat.parentId != null ? byId.get(cat.parentId) : null;
  const candidates = [];
  if (parent) candidates.push(`${name} – ${(parent.name || '').trim()} בסיטונאות${TITLE_SUFFIX}`);
  candidates.push(`${name} בסיטונאות לעסקים ומוסדות${TITLE_SUFFIX}`);
  candidates.push(`${name} בסיטונאות${TITLE_SUFFIX}`);
  candidates.push(`${name}${TITLE_SUFFIX}`);
  return candidates.find(c => c.length <= TITLE_MAX) || candidates[candidates.length - 1];
}

// ---------------------------------------------------------------------------
function sanitizeCatalog(data) {
  const cats = data.categories || [];
  const byId = new Map(cats.map(c => [c.id, c]));
  for (const cat of cats) {
    if (typeof cat.seoContent === 'string' && cat.seoContent.includes(GENERIC_SEO_MARK)) cat.seoContent = rebuildGenericSeo(cat);
    if (typeof cat.geoContent === 'string' && cat.geoContent.includes(GENERIC_GEO_MARK)) cat.geoContent = rebuildGenericGeo(cat);
    if (isTruncatedTitle(cat.metaTitle)) cat.metaTitle = buildTitle(cat, byId);
  }
  for (const cat of cats) if (cat.faqs) cat.faqs = dropClaimEntries(cat.faqs);
  for (const it of data.items || []) {
    if (it.seo && it.seo.faqs) it.seo.faqs = dropClaimEntries(it.seo.faqs);
    if (it.seo && it.seo.specs) it.seo.specs = dropClaimEntries(it.seo.specs);
  }
  walkStrings(cats, applyTextRules);
  walkStrings(data.items || [], applyTextRules);
  walkStrings(data.variantGroups || [], applyTextRules);
  return data;
}

module.exports = { sanitizeCatalog, DELIVERY_LONG, DELIVERY_SHORT, RESPONSE_TIME };

if (require.main === module) {
  const src = fs.readFileSync(DATA_PATH, 'utf-8');
  const hadTrailingNewline = src.endsWith('\n');
  const data = sanitizeCatalog(JSON.parse(src));
  const out = JSON.stringify(data, null, 2) + (hadTrailingNewline ? '\n' : '');
  if (out === src) { console.log('products.json already clean — no change.'); process.exit(0); }
  if (process.argv.includes('--check')) { console.log('products.json WOULD change (run without --check to write).'); process.exit(1); }
  fs.writeFileSync(DATA_PATH, out, 'utf-8');
  console.log('products.json rewritten by catalog copy policy.');
}
