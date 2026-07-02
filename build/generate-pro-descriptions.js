/**
 * Y Market - Professional Product Description Generator v2
 * Combines knowledge-base matching + intelligent name parsing
 * to create accurate, professional Hebrew descriptions.
 *
 * Run: node build/generate-pro-descriptions.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'products.json');
const KB1 = path.join(__dirname, 'product-knowledge.json');
const KB2 = path.join(__dirname, 'product-knowledge-2.json');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const kb1 = JSON.parse(fs.readFileSync(KB1, 'utf8'));
const kb2 = JSON.parse(fs.readFileSync(KB2, 'utf8'));
const knowledge = { ...kb1.productTypes, ...kb2.productTypes };

// ─── Parse product name for specs embedded in the name ───
function parseNameSpecs(name) {
  const specs = {};
  // Dimensions like 75*90, 25x35
  const dimMatch = name.match(/(\d+)\s*[*xX×]\s*(\d+)/);
  if (dimMatch) specs.dimensions = `${dimMatch[1]}×${dimMatch[2]} ס"מ`;

  // Volume in cc/ml
  const volMatch = name.match(/(\d+)\s*(cc|מ"ל|מל|ml)/i);
  if (volMatch) specs.volume = `${volMatch[1]} ${volMatch[2] === 'cc' ? 'מ"ל' : volMatch[2]}`;

  // Weight in grams/kg
  const weightMatch = name.match(/(\d+(?:\.\d+)?)\s*(גר'?|גרם|ק"ג|קילו|קג)/);
  if (weightMatch) specs.weight = `${weightMatch[1]} ${weightMatch[2]}`;

  // Liters
  const literMatch = name.match(/(\d+(?:\.\d+)?)\s*(ליטר|לטר|ל')/);
  if (literMatch) specs.volume = `${literMatch[1]} ליטר`;

  // Quantity per pack
  const qtyMatch = name.match(/(\d+)\s*(יח'?|יחידות|יחידה)/);
  if (qtyMatch) specs.packSize = `${qtyMatch[1]} יחידות`;

  // Size (S/M/L/XL)
  const sizeMatch = name.match(/מידה\s+(XS|S|M|L|XL|XXL)/i);
  if (sizeMatch) specs.size = `מידה ${sizeMatch[1].toUpperCase()}`;

  // Length in meters
  const meterMatch = name.match(/(\d+)\s*(מטר|מ'|מ")/);
  if (meterMatch) specs.length = `${meterMatch[1]} מטר`;

  // Cm
  const cmMatch = name.match(/(\d+)\s*ס"מ/);
  if (cmMatch) specs.sizeCm = `${cmMatch[1]} ס"מ`;

  // Layers/plies
  const plyMatch = name.match(/(\d+)\s*שכבות/);
  if (plyMatch) specs.plies = `${plyMatch[1]} שכבות`;

  // Concentration %
  const concMatch = name.match(/(\d+(?:\.\d+)?)\s*%/);
  if (concMatch) specs.concentration = `ריכוז ${concMatch[1]}%`;

  return specs;
}

// ─── Knowledge base matching ───
function findKnowledge(name) {
  const n = name.toLowerCase();

  const rules = [
    // Cleaning - specific first
    { test: n => /אקונומיקה|היפוכלוריט|כלור/.test(n), key: 'אקונומיקה' },
    { test: n => /חומצ|חומצת מלח/.test(n), key: 'אקונומיקה' },
    { test: n => /אמוניה|אמוניאק/.test(n), key: 'אמוניה' },
    { test: n => /נוזל כלים|סבון כלים|פיירי|fairy/.test(n), key: 'נוזל כלים מוסדי' },
    { test: n => /חלונות|זגוגית/.test(n), key: 'נוזל ניקוי חלונות' },
    { test: n => /רצפות|אורנים|פרקט|שטיפת רצפ/.test(n), key: 'חומר ניקוי רצפות' },
    { test: n => /ג'ל.*ניקוי|ג'רם|כתמים/.test(n), key: 'חומר ניקוי רצפות' },
    { test: n => /סבון ידיים|סבון נוזלי|קצף ידיים/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /אלכוג'ל|חיטוי ידיים|sanitizer/.test(n), key: 'ג\'ל חיטוי ידיים' },
    { test: n => /מרכך כביסה|מרכך/.test(n), key: 'חומר ניקוי רצפות' },
    { test: n => /אבקת כביסה|כביסה/.test(n), key: 'חומר ניקוי רצפות' },

    // Paper
    { test: n => /צץ רץ|מגבת נייר|z-fold|מגבת צץ/.test(n), key: 'מגבת נייר צץ רץ' },
    { test: n => /נייר תעשייתי|קימברלי|גליל תעשייתי/.test(n), key: 'נייר תעשייתי' },
    { test: n => /טואלט|ג'מבו|jumbo/.test(n), key: 'נייר טואלט מוסדי' },
    { test: n => /מפיות|מפית/.test(n), key: 'מפיות נייר' },
    { test: n => /ממחטות|ממחטה/.test(n), key: 'מפיות נייר' },
    { test: n => /נייר סופג/.test(n), key: 'מגבת נייר צץ רץ' },
    { test: n => /כיסוי אסלה/.test(n), key: 'נייר טואלט מוסדי' },
    { test: n => /מגבוני.*לח|מגבונים/.test(n), key: 'מפיות נייר' },

    // PPE - specific before generic
    { test: n => /ניטריל|nitril/.test(n), key: 'כפפות ניטריל' },
    { test: n => /ויטריל|vitril/.test(n), key: 'כפפות ניטריל' },
    { test: n => /ווניל|ויניל|vinyl/.test(n), key: 'כפפות ויניל' },
    { test: n => /לטקס|latex/.test(n), key: 'כפפות ניטריל' },
    { test: n => /kn.?95|מסכ/.test(n), key: 'מסכת KN95' },
    { test: n => /אפוד.*זהור|אפוד.*בטיחות|אפוד.*כתום/.test(n), key: 'אפוד זהור בטיחות' },
    { test: n => /חלוק.*מפעל|חלוק.*חד.?פעמי|סינר/.test(n), key: 'אפוד זהור בטיחות' },
    { test: n => /כפפ/.test(n), key: 'כפפות ויניל' },
    { test: n => /כיסוי נעל|כיסוי ראש|כובע מפעל/.test(n), key: 'אפוד זהור בטיחות' },

    // Disposables
    { test: n => /כוס\s|כוסות/.test(n), key: 'כוסות חד פעמיות' },
    { test: n => /גביע/.test(n), key: 'אריזות מזון Take Away' },
    { test: n => /בוחשן|בוחשנים/.test(n), key: 'בוחשנים' },
    { test: n => /קש\s|קשיות|ארומה/.test(n), key: 'קשיות שתייה' },
    { test: n => /צלחת|צלחות/.test(n), key: 'כוסות חד פעמיות' },
    { test: n => /מכסה|מכסים/.test(n), key: 'אריזות מזון Take Away' },
    { test: n => /קערה|קערות/.test(n), key: 'אריזות מזון Take Away' },
    { test: n => /מגש.*אלומ|מגש.*פויל|תבנית.*אלומ/.test(n), key: 'תבניות אלומיניום' },
    { test: n => /אלומ.*פויל|נייר.*אלומ|פויל/.test(n), key: 'תבניות אלומיניום' },

    // Packaging
    { test: n => /סרט אריזה|סרט הדבקה|tape/.test(n), key: 'סרט אריזה' },
    { test: n => /נילון נצמד|stretch|פוד ראפ/.test(n), key: 'ניילון נצמד' },
    { test: n => /שרינג|כיסוי.*עגלות|כיסוי.*משטח/.test(n), key: 'ניילון נצמד' },
    { test: n => /דפי הפרדה|פרגפלסט/.test(n), key: 'דפי הפרדה' },
    { test: n => /שקיות סנדוויץ|שקיות.*מזון|שקיות.*אוכל/.test(n), key: 'שקיות סנדוויץ\' HD' },
    { test: n => /נילון כיסוי|fresh cover/.test(n), key: 'ניילון נצמד' },

    // Garbage bags
    { test: n => /שקי.*זבל|שקי.*אשפה|גורילה|שקית.*שחור/.test(n), key: 'שקיות אשפה' },
    { test: n => /שקיות גופיה/.test(n), key: 'שקיות אשפה' },

    // Tools
    { test: n => /פח.*שובך|פח.*אשפה|פח.*\d+.*ליטר/.test(n), key: 'פח אשפה מוסדי' },
    { test: n => /מגב\s|אטלס|סיליקון.*להב|מגב.*ס"מ/.test(n), key: 'מגב מוסדי' },
    { test: n => /דלי/.test(n), key: 'דלי שטיפה' },
    { test: n => /מטלי|מיקרופייבר/.test(n), key: 'מטליות מיקרופייבר' },
    { test: n => /כריות? יפני/.test(n), key: 'ספוגית יפנית' },
    { test: n => /ספוגי|ספוג\s/.test(n), key: 'ספוג מלמין' },
    { test: n => /ממרקות|ממרקת/.test(n), key: 'ספוגית יפנית' },
    { test: n => /סחבות|סחבה/.test(n), key: 'מגב מוסדי' },
    { test: n => /רקצוף|קרצוף/.test(n), key: 'ספוגית יפנית' },
    { test: n => /בקבוק מרסס|מרסס/.test(n), key: 'דלי שטיפה' },
    { test: n => /כף אשפה/.test(n), key: 'מגב מוסדי' },
    { test: n => /מברשת.*שירות|מברשת.*טואלט/.test(n), key: 'מגב מוסדי' },
    { test: n => /מקל.*מגב|מקל.*עץ/.test(n), key: 'מגב מוסדי' },

    // Office
    { test: n => /a4|נייר צילום|למדפסת/.test(n), key: 'נייר צילום A4' },
    { test: n => /בלוק/.test(n), key: 'נייר צילום A4' },
    { test: n => /מספריים/.test(n), key: 'נייר צילום A4' },
    { test: n => /דבק.*נייר|דבק.*UHU|סלוטייפ/.test(n), key: 'נייר צילום A4' },
    { test: n => /עט\s|עטים|עט.*כדורי/.test(n), key: 'נייר צילום A4' },
    { test: n => /גומי|מחק/.test(n), key: 'נייר צילום A4' },
    { test: n => /מהדק|סיכות/.test(n), key: 'נייר צילום A4' },
    { test: n => /תיק|תיקייה|קלסר/.test(n), key: 'נייר צילום A4' },
    { test: n => /מחשבון|סרגל/.test(n), key: 'נייר צילום A4' },
    { test: n => /שרוך|תג|badge/.test(n), key: 'נייר צילום A4' },

    // Food & beverage
    { test: n => /קפה|נס קפה|עלית|טורקי|אספרסו/.test(n), key: 'קפה ושתייה' },
    { test: n => /סוכר/.test(n), key: 'קפה ושתייה' },
    { test: n => /תה\s|תה /.test(n), key: 'קפה ושתייה' },
    { test: n => /מים\s|עין גדי|מי עדן/.test(n), key: 'קפה ושתייה' },
    { test: n => /מצת|מצית/.test(n), key: 'קפה ושתייה' },
    { test: n => /מאג.*טרמוס|טרמוס/.test(n), key: 'קפה ושתייה' },

    // Tablecloths
    { test: n => /מפה\s|מפות שולחן|גליל מפה/.test(n), key: 'מפת שולחן חד פעמית' },

    // Candles
    { test: n => /להבונים|נרות חימום|נר חימום/.test(n), key: 'נרות חימום' },

    // Medical
    { test: n => /אלונקה/.test(n), key: 'ציוד רפואי' },
    { test: n => /דפיברילטור|החייאה|aed/.test(n), key: 'ציוד רפואי' },
    { test: n => /אספלנית|פלסטר|תחבושת/.test(n), key: 'ציוד רפואי' },
    { test: n => /ארון.*החייאה|ארון.*מתכת.*רפואי/.test(n), key: 'ציוד רפואי' },
    { test: n => /ערכת עזרה|עזרה ראשונה/.test(n), key: 'ציוד רפואי' },
    { test: n => /אלקטרודות/.test(n), key: 'ציוד רפואי' },

    // Technical
    { test: n => /אזיקונים|cable tie/.test(n), key: 'ציוד טכני' },
    { test: n => /אוזניות נגד רעש/.test(n), key: 'ציוד טכני' },
    { test: n => /את רפת|את שפיכה/.test(n), key: 'ציוד טכני' },
    { test: n => /גומי קוצים|משתנות/.test(n), key: 'אקונומיקה' },
    { test: n => /pvc|גליל.*חדרי/.test(n), key: 'ניילון נצמד' },

    // Toiletries
    { test: n => /דאודורנט|nivea|רול/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /מברשת שיניים|קולגייט|שניים/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /אנטיטוש|דימה|יתושים|תוש/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /מגבון|wipe/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /שמפו|קרם|סבון.*גוף/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /משחת שיניים/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /מקלות אוזניים/.test(n), key: 'סבון ידיים נוזלי' },
    { test: n => /אטבי כביסה/.test(n), key: 'סבון ידיים נוזלי' },

    // Food products
    { test: n => /מלח\s|מלח.*ים/.test(n), key: 'קפה ושתייה' },
    { test: n => /שמן.*זית|שמן.*חמניות|שמן.*קנולה/.test(n), key: 'קפה ושתייה' },
    { test: n => /חומץ|לימון/.test(n), key: 'קפה ושתייה' },
  ];

  for (const rule of rules) {
    if (rule.test(n)) {
      return knowledge[rule.key] || null;
    }
  }
  return null;
}

// ─── Extract flat specs from nested KB specs ───
function flatSpecs(specs) {
  if (!specs || typeof specs !== 'object') return [];
  return Object.entries(specs)
    .filter(([k, v]) => typeof v === 'string' && v.length < 80)
    .map(([k, v]) => v);
}

function getArr(kb, ...fields) {
  for (const f of fields) {
    if (kb[f] && Array.isArray(kb[f]) && kb[f].length > 0) return kb[f];
  }
  return [];
}

// ─── Build description ───
function buildDescription(product, kb) {
  const name = product.name || '';
  const unit = product.unit || '';
  const cat = product.categoryName || '';
  const nameSpecs = parseNameSpecs(name);

  if (!kb) {
    return buildSmartGeneric(product, nameSpecs);
  }

  const material = typeof kb.material === 'string' ? kb.material.split('.')[0].split(',')[0].trim() : '';
  const specs = flatSpecs(kb.specs);
  const uses = getArr(kb, 'uses', 'professionalUseCases');
  const industries = getArr(kb, 'industries');
  const selling = getArr(kb, 'sellingPoints', 'b2bSellingPoints');
  const certs = getArr(kb, 'certifications');

  let desc = '';

  // Opening
  if (material && material.length > 5 && material.length < 80) {
    desc += `${name} – עשוי ${material}. `;
  } else {
    desc += `${name} – מוצר מקצועי לשימוש מוסדי ותעשייתי. `;
  }

  // Name-parsed specs (product-specific)
  const parsedParts = [];
  if (nameSpecs.dimensions) parsedParts.push(`מידות ${nameSpecs.dimensions}`);
  if (nameSpecs.volume) parsedParts.push(nameSpecs.volume);
  if (nameSpecs.weight) parsedParts.push(`משקל ${nameSpecs.weight}`);
  if (nameSpecs.concentration) parsedParts.push(nameSpecs.concentration);
  if (nameSpecs.plies) parsedParts.push(nameSpecs.plies);
  if (nameSpecs.size) parsedParts.push(nameSpecs.size);
  if (nameSpecs.length) parsedParts.push(nameSpecs.length);
  if (parsedParts.length > 0) {
    desc += parsedParts.join(', ') + '. ';
  }

  // KB specs (2 only, avoid duplicating parsed)
  if (specs.length > 0) {
    const filtered = specs.filter(s => {
      // Skip if already in parsed specs
      for (const p of parsedParts) {
        if (s.includes(p) || p.includes(s)) return false;
      }
      return true;
    }).slice(0, 2);
    if (filtered.length > 0) {
      desc += filtered.join('. ') + '. ';
    }
  }

  // Unit
  if (unit) desc += `אריזה: ${unit}. `;

  // Uses
  if (uses.length >= 2) {
    const pick = uses.slice(0, 3);
    desc += `מיועד ל${pick.join(', ')}. `;
  }

  // Industries (rotate)
  if (industries.length >= 2) {
    const idx = (product.id || 0) % Math.max(1, industries.length - 2);
    const pick = industries.slice(idx, idx + 3);
    if (pick.length > 0) desc += `פופולרי ב${pick.join(', ')}. `;
  }

  // Selling point (rotate)
  if (selling.length > 0) {
    const idx = (product.id || 0) % selling.length;
    desc += selling[idx] + '. ';
  }

  desc += 'זמין להזמנה בסיטונאות עם משלוח ארצי מוואי מרקט.';
  return desc.replace(/\s+/g, ' ').trim();
}

// ─── Smart generic (no KB match) - uses name parsing + category ───
function buildSmartGeneric(product, nameSpecs) {
  const name = product.name || '';
  const unit = product.unit || '';
  const cat = product.categoryName || '';

  let desc = `${name} – `;

  // Category-specific opening
  const catOpening = {
    'חומרי ניקוי וכימיקלים': 'חומר ניקוי מקצועי לסביבות מוסדיות',
    'מוצרי נייר וניגוב': 'מוצר נייר מקצועי לצריכה מוסדית',
    'חד פעמי ואירוח': 'כלי חד פעמי איכותי מחומר בטוח למזון',
    'שקיות ופתרונות אשפה': 'שקית חזקה ועמידה לשימוש מוסדי',
    'אריזות מזון ו-Take Away': 'אריזת מזון מקצועית בטוחה למזון',
    'בטיחות ומיגון אישי (PPE)': 'ציוד מיגון מקצועי העומד בתקני בטיחות',
    'טואלטיקה וטיפוח אישי': 'מוצר היגיינה מקצועי לשימוש מוסדי',
    'כלי עבודה וציוד משקי': 'ציוד עבודה מקצועי ועמיד',
    'עטיפה, אריזה ולוגיסטיקה': 'פתרון אריזה מקצועי לעסקים',
    'עזרה ראשונה - רפואי': 'ציוד רפואי מקצועי לעזרה ראשונה',
    'ציוד טכני ואחזקה': 'ציוד טכני מקצועי לאחזקת מבנים',
    'ציוד משרדי וכללי': 'מוצר משרדי איכותי לשימוש יומיומי',
    'טקסטיל, מטליות וסחבות': 'ציוד ניקיון טקסטילי מקצועי',
    'קפה, שתייה וכיבוד': 'מוצר כיבוד איכותי לסביבת עבודה',
  };
  desc += (catOpening[cat] || 'מוצר מקצועי למוסדות ועסקים') + '. ';

  // Add parsed specs from name
  const parsedParts = [];
  if (nameSpecs.dimensions) parsedParts.push(`מידות ${nameSpecs.dimensions}`);
  if (nameSpecs.volume) parsedParts.push(nameSpecs.volume);
  if (nameSpecs.weight) parsedParts.push(`משקל ${nameSpecs.weight}`);
  if (nameSpecs.concentration) parsedParts.push(nameSpecs.concentration);
  if (nameSpecs.plies) parsedParts.push(nameSpecs.plies);
  if (nameSpecs.packSize) parsedParts.push(nameSpecs.packSize);
  if (nameSpecs.size) parsedParts.push(nameSpecs.size);
  if (nameSpecs.length) parsedParts.push(nameSpecs.length);
  if (nameSpecs.sizeCm) parsedParts.push(`${nameSpecs.sizeCm}`);
  if (parsedParts.length > 0) {
    desc += parsedParts.join(', ') + '. ';
  }

  if (unit) desc += `אריזה: ${unit}. `;

  // Category-specific use cases
  const catUses = {
    'חומרי ניקוי וכימיקלים': 'מתאים למשרדים, מסעדות, חברות ניקיון ומוסדות ציבור.',
    'מוצרי נייר וניגוב': 'סופג ועמיד, מתאים לשירותים, מטבחים ואזורי עבודה במוסדות.',
    'חד פעמי ואירוח': 'מתאים למסעדות, קייטרינג, אירועים ומוסדות. עמיד ונוח לשימוש.',
    'שקיות ופתרונות אשפה': 'אטומה לנוזלים, מתאימה למשרדים, מסעדות ומוסדות. עובי מוסדי.',
    'אריזות מזון ו-Take Away': 'מתאימה למסעדות, משלוחים וקייטרינג. שומרת על טריות ומראה מקצועי.',
    'בטיחות ומיגון אישי (PPE)': 'חיוני לכל סביבת עבודה. הגנה אמינה בתעשייה, מזון וניקיון.',
    'טואלטיקה וטיפוח אישי': 'מתאים למלונות, חדרי כושר, משרדים ומוסדות ציבוריים.',
    'כלי עבודה וציוד משקי': 'מיועד למוסדות, חברות ניקיון ועסקים. חומרים עמידים לאורך חיים מרבי.',
    'עטיפה, אריזה ולוגיסטיקה': 'מתאים למחסנים, קווי אריזה וחנויות. חומר איכותי ועמיד.',
    'עזרה ראשונה - רפואי': 'חיוני לכל מקום עבודה. עומד בתקנות בטיחות.',
    'ציוד טכני ואחזקה': 'עמיד ואיכותי לשימוש תעשייתי. מתאים למפעלים ומוסדות.',
    'ציוד משרדי וכללי': 'מתאים למשרדים, מוסדות חינוך וסביבות עבודה.',
    'טקסטיל, מטליות וסחבות': 'עמיד לכביסות חוזרות ולשימוש אינטנסיבי. מתאים לחברות ניקיון ומלונות.',
    'קפה, שתייה וכיבוד': 'מתאים לפינות קפה במשרדים, חדרי ישיבות ומוסדות.',
  };
  desc += (catUses[cat] || 'מתאים לעסקים ומוסדות.') + ' ';

  desc += 'הזמנה בסיטונאות עם משלוח ארצי מוואי מרקט.';
  return desc.replace(/\s+/g, ' ').trim();
}

// ─── Main ───
let updated = 0, skipped = 0, kbMatched = 0, genericFallback = 0;

for (const item of data.items) {
  if (item.seo && item.seo.specs) { skipped++; continue; }

  const kb = findKnowledge(item.name);
  item.description = buildDescription(item, kb);

  if (kb) kbMatched++;
  else genericFallback++;
  updated++;
}

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n=== Professional Description Generator v2 ===`);
console.log(`Total: ${data.items.length}`);
console.log(`Updated: ${updated}`);
console.log(`  KB-matched: ${kbMatched}`);
console.log(`  Smart generic: ${genericFallback}`);
console.log(`Skipped (manual SEO): ${skipped}`);

// Samples
console.log(`\n=== KB-MATCHED SAMPLES ===`);
const kbSamples = data.items.filter(i => {
  const kb = findKnowledge(i.name);
  return kb && (!i.seo || !i.seo.specs);
});
const seenCats = new Set();
for (const s of kbSamples) {
  if (!seenCats.has(s.categoryName) && seenCats.size < 6) {
    seenCats.add(s.categoryName);
    console.log(`\n[${s.name}] (${s.categoryName})`);
    console.log(s.description);
  }
}

console.log(`\n=== SMART GENERIC SAMPLES ===`);
const genSamples = data.items.filter(i => {
  const kb = findKnowledge(i.name);
  return !kb && (!i.seo || !i.seo.specs);
});
const seenCats2 = new Set();
for (const s of genSamples) {
  if (!seenCats2.has(s.categoryName) && seenCats2.size < 6) {
    seenCats2.add(s.categoryName);
    console.log(`\n[${s.name}] (${s.categoryName})`);
    console.log(s.description);
  }
}
