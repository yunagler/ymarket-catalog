#!/usr/bin/env node
/**
 * Generate individual category HTML pages from products.json
 * Supports hierarchical categories (parent → children tree)
 * Uses directory-based clean URLs: /category/{slug}/index.html
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CATEGORY_DIR = path.join(ROOT_DIR, 'category');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'products.json');
const SITE_URL = 'https://ymarket.co.il';

// SEO data per category
const CATEGORY_SEO = {
  'חומרי-ניקוי-וכימיקלים': {
    title: 'חומרי ניקוי בסיטונאות למוסדות ועסקים | וואי מרקט',
    h1: 'חומרי ניקוי בסיטונאות למוסדות ועסקים',
    metaDesc: 'מחפשים ספק חומרי ניקוי אמין? ב-YMARKET תמצאו כימיקלים, סבונים וחומרי חיטוי תעשייתיים במחירי סיטונאות ישירות מהיצרן. אספקה מהירה עד 72 שעות.',
    seoText: `<div class="category-seo">
      <h2>חומרי ניקוי מוסדיים בסיטונאות – אספקה מהירה לכל הארץ</h2>
      <p>אנחנו ב-YMARKET מבינים שניהול מלאי חומרי הניקוי במוסד הוא קריטי. לכן אנו מספקים מגוון רחב של כימיקלים, סבונים וחומרי חיטוי בריכוז גבוה המותאמים לשימוש תעשייתי ומוסדי. הקטלוג שלנו כולל אקונומיקה תעשייתית, חומצת מלח, מסירי שומן, נוזלי רצפה ומוצרי ניקוי מקצועיים מבית BLINX ומותגים מובילים נוספים.</p>
      <p>בין אם אתם חברת ניקיון, בית מלון, מסעדה, בית ספר או משרד – אנו מציעים פתרונות ניקוי מותאמים עם מחירי סיטונאות ואספקה תוך 24-72 שעות לכל רחבי ישראל. מינימום הזמנה 1,600 ₪ + מע"מ.</p>
      <p><strong>צריכים הצעת מחיר מותאמת?</strong> <a href="/contact">צרו קשר</a> או שלחו הודעה ב<a href="https://wa.me/972549922492?text=היי, מעוניין בהצעת מחיר לחומרי ניקוי למוסד" target="_blank" rel="noopener">וואטסאפ</a> ונחזור אליכם תוך שעות.</p>
    </div>`,
    faqs: [
      { q: 'יש מינימום הזמנה לחומרי ניקוי?', a: 'כן, מינימום הזמנה 1,600 ₪ + מע"מ. ניתן לשלב מוצרים מכל הקטגוריות בהזמנה אחת.' },
      { q: 'האם אתם מספקים אישורי בטיחות (MSDS) לחומרים?', a: 'בהחלט. אנו מספקים גיליונות בטיחות (MSDS) לכל חומרי הניקוי והכימיקלים שלנו, כנדרש לפי תקנות הבטיחות במוסדות.' },
      { q: 'תוך כמה זמן מגיעה ההזמנה?', a: 'אספקה תוך 24-72 שעות לכל רחבי ישראל, בהתאם לאזור. אזור גוש דן — בדרך כלל למחרת.' },
      { q: 'האם יש הנחות כמות לחומרי ניקוי?', a: 'כן, ללקוחות קבועים ולהזמנות גדולות אנו מציעים מחירונים מותאמים אישית עם הנחות משמעותיות. צרו קשר לקבלת הצעת מחיר.' }
    ]
  },
  'מוצרי-נייר-וניגוב': {
    title: 'מוצרי נייר וניגוב לעסקים - אספקה בסיטונאות | וואי מרקט',
    h1: 'מוצרי נייר וניגוב לעסקים – אספקה בסיטונאות',
    metaDesc: 'כל פתרונות הנייר למשרד ולמוסד במקום אחד: נייר טואלט, מגבות ידיים, מפיות וגלילי תעשייה. איכות ללא פשרות ומחירים הוגנים לעסקים. כנסו לקטלוג.',
    seoText: `<div class="category-seo">
      <h2>מוצרי נייר תעשייתיים לעסקים ומוסדות</h2>
      <p>מוצרי נייר הם מוצר יסוד בכל עסק ומוסד. ב-YMARKET תמצאו מגוון מלא של נייר טואלט מוסדי, מגבות נייר תעשייתיות, מפיות, גלילי ניגוב ומוצרי נייר נוספים – הכל במחירי סיטונאות עם אספקה מהירה.</p>
      <p>אנו עובדים עם מותגים מובילים כמו טורקיש ומציעים פתרונות המותאמים לשירותי ציבור, מטבחים מוסדיים, משרדים ומפעלים. חסכו בעלויות עם רכישה מרוכזת ישירות מהמפיץ.</p>
      <p><strong>צריכים כמות גדולה?</strong> <a href="/contact">לחצו כאן להצעת מחיר מותאמת אישית</a>.</p>
    </div>`,
    faqs: [
      { q: 'מהו ההבדל בין נייר טואלט ביתי למוסדי?', a: 'נייר מוסדי מגיע בגלילים גדולים יותר (ג\'מבו) המתאימים למתקני שירותים ציבוריים, חוסך החלפות תכופות ומפחית עלויות.' },
      { q: 'האם אתם מספקים מתקני תליה לנייר?', a: 'כן, אנו מציעים מתקני נייר טואלט ומגבות ידיים תעשייתיים בנפרד. צרו קשר לפרטים.' }
    ]
  },
  'חד-פעמי-ואירוח': {
    title: 'כלים חד פעמיים בסיטונאות לאירוח ומוסדות | וואי מרקט',
    h1: 'כלים חד פעמיים בסיטונאות לאירוח ומוסדות',
    metaDesc: 'ציוד חד פעמי איכותי לאירועים, משרדים ומוסדות. כוסות, צלחות, סכו"ם ופתרונות אירוח מלאים. חסכו בעלויות התפעול עם רכישה מרוכזת ב-YMARKET.',
    seoText: `<div class="category-seo">
      <h2>כלים חד פעמיים לעסקים – פתרונות אירוח מקצועיים</h2>
      <p>ב-YMARKET תמצאו מבחר רחב של כלים חד פעמיים לאירוח: כוסות חמות וקרות, צלחות, סכו"ם, קשיות, מפיות ואביזרי הגשה. הכל במחירי סיטונאות ובאיכות גבוהה.</p>
      <p>אנו מספקים לקייטרינגים, מסעדות, משרדים, מוסדות חינוך ואירועים פרטיים. הזמינו בכמויות גדולות וחסכו משמעותית בעלויות האירוח השוטפות.</p>
    </div>`,
    faqs: [
      { q: 'האם יש מוצרים חד פעמיים ידידותיים לסביבה?', a: 'כן, אנו מציעים גם כלים מתכלים ומוצרי נייר ממוחזר. צרו קשר לפרטים על הקו הירוק שלנו.' },
      { q: 'מה כולל חבילת אירוח למשרד?', a: 'אנחנו יכולים להרכיב לכם חבילת אירוח שכוללת כוסות, בוחשנים, סוכר, מפיות ועוד – מותאמת למספר העובדים. צרו קשר לקבלת הצעה.' }
    ]
  },
  'אריזות-מזון-ו-Take-Away': {
    title: 'אריזות מזון ופתרונות Take Away למסעדות | וואי מרקט',
    h1: 'אריזות מזון ופתרונות Take Away למסעדות',
    metaDesc: 'שדרגו את מערך המשלוחים שלכם. קופסאות מזון, שקיות ופתרונות אריזה מתקדמים השומרים על טריות. מותאם אישית לצרכי ענף המזון והאירוח.',
    seoText: `<div class="category-seo">
      <h2>אריזות מזון מקצועיות לעסקי מזון ומשלוחים</h2>
      <p>בעידן המשלוחים, אריזות איכותיות הן חלק בלתי נפרד מחוויית הלקוח. ב-YMARKET תמצאו מגוון רחב של קופסאות מזון, מיכלים חד פעמיים, שקיות נשיאה, נייר עטיפה ופתרונות אריזה לכל סוגי המזון.</p>
      <p>אנו מספקים למסעדות, קייטרינגים, פיצריות, מאפיות ועסקי מזון בכל הגדלים. מחירי סיטונאות, איכות מעולה ואספקה מהירה לכל הארץ.</p>
    </div>`,
    faqs: [
      { q: 'האם האריזות מתאימות למיקרוגל?', a: 'חלק מהאריזות שלנו מתאימות לחימום במיקרוגל. בדפי המוצרים הספציפיים מצוין האם האריזה מיקרוגל-safe.' },
      { q: 'האם ניתן לקבל הדפסה/מיתוג על האריזות?', a: 'כרגע אנחנו מספקים אריזות גנריות. לפתרונות מיתוג מותאם צרו קשר ונבדוק אפשרויות.' }
    ]
  },
  'בטיחות-ומיגון-אישי-PPE': {
    title: 'ציוד בטיחות ומיגון אישי לעובדים ומוסדות | וואי מרקט',
    h1: 'ציוד בטיחות ומיגון אישי לעובדים ומוסדות',
    metaDesc: 'שמירה על בטיחות העובדים היא בעדיפות עליונה. כפפות, מסכות, ביגוד מגן וציוד עזרה ראשונה בתקנים המחמירים ביותר. הזמינו עכשיו בסיטונאות.',
    seoText: `<div class="category-seo">
      <h2>ציוד בטיחות ומיגון – עמידה בתקנים לעסקים ומוסדות</h2>
      <p>ב-YMARKET תמצאו ציוד בטיחות ומיגון אישי (PPE) המתאים לכל סוגי העסקים: כפפות חד פעמיות, מסכות הגנה, משקפי מגן, ביגוד מגן וציוד עזרה ראשונה. כל המוצרים עומדים בתקנים הישראליים והבינלאומיים.</p>
      <p>אנו מספקים למפעלים, חברות ניקיון, מוסדות רפואיים, מטבחים מוסדיים ולכל עסק שמחויב בציוד מיגון לעובדים.</p>
    </div>`,
    faqs: [
      { q: 'האם ציוד הבטיחות עומד בתקנים?', a: 'כן, כל ציוד הבטיחות שלנו עומד בתקנים הישראליים ובתקני CE/ISO הרלוונטיים.' },
      { q: 'האם ניתן לקבל ייעוץ לגבי ציוד נדרש?', a: 'בהחלט. צרו קשר ונעזור לכם להרכיב את סל ציוד הבטיחות המתאים לסוג העסק שלכם.' }
    ]
  },
  'קפה-שתייה-וכיבוד': {
    title: 'קפה, שתייה וכיבוד למשרדים ועסקים בסיטונאות | וואי מרקט',
    h1: 'קפה, שתייה וכיבוד למשרדים ועסקים',
    metaDesc: 'קפה, תה, שתייה וכיבוד למשרד ולמוסד במחירי סיטונאות. מותגים מובילים, אספקה שוטפת ומהירה. הזמינו עכשיו ב-YMARKET.',
    seoText: `<div class="category-seo">
      <h2>פתרונות כיבוד למשרדים ומוסדות</h2>
      <p>כיבוד איכותי במשרד משפר את חוויית העובדים והלקוחות. ב-YMARKET תמצאו מגוון קפה, תה, סוכר, חלב, עוגיות ומוצרי כיבוד נוספים – הכל בגדלים מוסדיים ובמחירי סיטונאות.</p>
      <p>אנו מספקים לכל סוגי המשרדים והמוסדות, עם אספקה שוטפת שמבטיחה שפינת הקפה שלכם תמיד מלאה.</p>
    </div>`,
    faqs: []
  },
  'שקיות-ופתרונות-אשפה': {
    title: 'שקיות אשפה ופתרונות פסולת לעסקים בסיטונאות | וואי מרקט',
    h1: 'שקיות אשפה ופתרונות פסולת לעסקים',
    metaDesc: 'שקיות אשפה בכל הגדלים והעוביים לעסקים ומוסדות. שקיות גופיה, שקיות HD, שקיות כבדות. מחירי סיטונאות ואספקה מהירה.',
    seoText: `<div class="category-seo">
      <h2>שקיות אשפה מוסדיות – לכל סוג עסק ומוסד</h2>
      <p>מוצר בסיסי שכל עסק צורך בכמויות. ב-YMARKET תמצאו שקיות אשפה בכל הגדלים: 75×90, 80×120 ועוד, בעוביים שונים המותאמים לשימוש מוסדי כבד. שקיות עם שרוך, עם ידית, ובצבעים לפי סוג פסולת.</p>
      <p>מחירי סיטונאות, משלוח ארצי ואספקה מהירה.</p>
    </div>`,
    faqs: []
  },
  'טקסטיל-מטליות-וסחבות': {
    title: 'מטליות, סחבות וטקסטיל ניקוי לעסקים | וואי מרקט',
    h1: 'מטליות, סחבות וטקסטיל ניקוי לעסקים',
    metaDesc: 'מטליות ניקוי, סחבות רצפה, מגבים וטקסטיל מקצועי לעסקים ומוסדות. איכות תעשייתית במחירי סיטונאות. משלוח ארצי.',
    seoText: `<div class="category-seo">
      <h2>מטליות וטקסטיל ניקוי מקצועי</h2>
      <p>מטליות ניקוי איכותיות הן כלי עבודה חיוני לכל עסק. ב-YMARKET תמצאו מטליות מיקרופייבר, סחבות ספונג׳, מגבים ומוצרי טקסטיל מקצועיים לשימוש תעשייתי ומוסדי.</p>
    </div>`,
    faqs: []
  }
};

function formatPrice(price) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS',
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(price);
}

// Build tree from flat categories list
function buildCategoryTree(flatCategories) {
  const map = new Map();
  flatCategories.forEach(c => map.set(c.id, { ...c, children: [] }));

  const roots = [];
  for (const cat of map.values()) {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(cat);
    } else {
      roots.push(cat);
    }
  }

  // Sort children by sortOrder
  const sortChildren = (cats) => {
    cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    cats.forEach(c => sortChildren(c.children));
  };
  sortChildren(roots);

  return { roots, map };
}

// Get parent category chain for breadcrumb
function getParentChain(category, catMap) {
  const chain = [];
  let current = category;
  while (current.parentId && catMap.has(current.parentId)) {
    current = catMap.get(current.parentId);
    chain.unshift(current);
  }
  return chain;
}

// Build full URL path for a category (nested under parents)
// e.g. /category/אריזות-מזון-ו-Take-Away/גביעים/
function getCategoryUrlPath(category, catMap) {
  const chain = getParentChain(category, catMap);
  const slugs = chain.map(c => c.slug);
  slugs.push(category.slug);
  return '/category/' + slugs.join('/') + '/';
}

// Build filesystem path for a category page
function getCategoryFsPath(category, catMap, categoryDir) {
  const chain = getParentChain(category, catMap);
  const slugs = chain.map(c => c.slug);
  slugs.push(category.slug);
  return path.join(categoryDir, ...slugs);
}

// Build sidebar HTML with tree structure
function buildSidebarHtml(roots, currentSlug, catMap) {
  function renderNode(cat, depth) {
    const isActive = cat.slug === currentSlug;
    const hasChildren = cat.children && cat.children.length > 0;
    const isAncestor = hasChildren && isDescendant(currentSlug, cat, catMap);
    const isOpen = isActive || isAncestor;
    const catUrl = getCategoryUrlPath(cat, catMap);

    let html = `<a href="${catUrl}" class="category-list__item${isActive ? ' active' : ''}" style="${depth > 0 ? `padding-right:${16 + depth * 16}px;font-size:0.9em;` : ''}">`;
    if (hasChildren) {
      html += `<i class="fas fa-chevron-down" style="font-size:0.6em;margin-left:4px;transition:transform 0.2s;${isOpen ? '' : 'transform:rotate(90deg);'}"></i>`;
    }
    html += `<span>${cat.name}</span><span class="category-list__count">${cat.itemCount}</span></a>`;

    if (hasChildren) {
      html += `<div class="category-children" style="${isOpen ? '' : 'display:none;'}">`;
      for (const child of cat.children) {
        html += renderNode(child, depth + 1);
      }
      html += '</div>';
    }

    return html;
  }

  function isDescendant(slug, parent, map) {
    for (const child of parent.children) {
      if (child.slug === slug) return true;
      if (child.children && isDescendant(slug, child, map)) return true;
    }
    return false;
  }

  return roots.map(cat => renderNode(cat, 0)).join('\n');
}

function generateCategoryPage(category, products, allCategories, catMap, treeRoots) {
  const categoryProducts = products.filter(p =>
    p.categorySlug === category.slug ||
    (p.categorySlugs && p.categorySlugs.includes(category.slug))
  );
  const categoryPath = getCategoryUrlPath(category, catMap);
  const categoryUrl = `${SITE_URL}${categoryPath}`;

  const catSeo = CATEGORY_SEO[category.slug] || {};
  // DB SEO fields (from products.json) take priority over hardcoded CATEGORY_SEO, with final fallback to defaults
  const seoDesc = category.metaDescription || catSeo.metaDesc || `${category.name} - ${categoryProducts.length} מוצרים במחירי סיטונאות. וואי מרקט - אספקה חכמה לעסקים ומוסדות. משלוח ארצי.`;
  const h1Text = catSeo.h1 || category.name;
  const pageTitle = category.metaTitle || catSeo.title || `${category.name} | וואי מרקט - אספקה למוסדות ועסקים`;
  const seoContentBlock = category.seoContent || catSeo.seoText || '';
  const categoryImage = category.imageUrl || null;
  const categoryImageAlt = category.imageAlt || category.name;

  // Build breadcrumb with parent chain
  const parentChain = getParentChain(category, catMap);
  let breadcrumbHtml = `<a href="/">דף הבית</a>
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <a href="/catalog">מוצרים</a>`;
  for (const parent of parentChain) {
    const parentUrl = getCategoryUrlPath(parent, catMap);
    breadcrumbHtml += `
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <a href="${parentUrl}">${parent.name}</a>`;
  }
  breadcrumbHtml += `
      <span class="breadcrumb__separator"><i class="fas fa-chevron-left"></i></span>
      <span class="breadcrumb__current">${category.name}</span>`;

  // Breadcrumb JSON-LD
  const breadcrumbItems = [
    { "@type": "ListItem", "position": 1, "name": "דף הבית", "item": SITE_URL + "/" },
    { "@type": "ListItem", "position": 2, "name": "מוצרים", "item": SITE_URL + "/catalog" }
  ];
  parentChain.forEach((parent, i) => {
    const parentUrl = getCategoryUrlPath(parent, catMap);
    breadcrumbItems.push({ "@type": "ListItem", "position": 3 + i, "name": parent.name, "item": `${SITE_URL}${parentUrl}` });
  });
  breadcrumbItems.push({ "@type": "ListItem", "position": 3 + parentChain.length, "name": category.name });

  const productsHtml = categoryProducts.map(p => {
    const imgSrc = p.imageUrl || `/items/${p.id}.jpg`;
    const hasPromo = p.productStatus === 'on_sale' && p.originalPrice;

    let badgeHtml = '';
    if (hasPromo) {
      badgeHtml = `<div class="product-card__badge" style="background:#dc2626;color:#fff;position:absolute;top:8px;right:8px;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;z-index:2">${p.discountPercent ? Math.round(p.discountPercent) + '%-' : (p.promotionLabel || 'מבצע')}</div>`;
    } else if (p.productStatus === 'recommended' || p.isFeatured) {
      badgeHtml = '<div class="product-card__badge" style="background:#16a34a;color:#fff;position:absolute;top:8px;right:8px;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;z-index:2">מומלץ</div>';
    } else if (p.productStatus === 'new') {
      badgeHtml = '<div class="product-card__badge" style="background:#2563eb;color:#fff;position:absolute;top:8px;right:8px;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;z-index:2">חדש</div>';
    } else if (p.productStatus === 'clearance') {
      badgeHtml = '<div class="product-card__badge" style="background:#dc2626;color:#fff;position:absolute;top:8px;right:8px;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;z-index:2">חיסול</div>';
    }

    return `
    <div class="product-card" style="position:relative">
      ${badgeHtml}
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

  // Sidebar with tree structure
  const sidebarHtml = buildSidebarHtml(treeRoots, category.slug, catMap);

  // Show subcategories links if this category has children
  const children = catMap.get(category.id)?.children || [];
  let subcategoriesHtml = '';
  if (children.length > 0) {
    subcategoriesHtml = `<div class="subcategories-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:24px;">
      ${children.map(child => {
        const childUrl = getCategoryUrlPath(child, catMap);
        return `<a href="${childUrl}" class="subcategory-card" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:10px;text-decoration:none;color:#1f2937;transition:all 0.2s;font-size:0.95rem;">
          <i class="fas ${child.icon || 'fa-folder'}" style="color:#1B3A5C;font-size:1.1rem;"></i>
          <span>${child.name}</span>
          <span style="margin-right:auto;color:#9ca3af;font-size:0.8rem;">${child.itemCount}</span>
        </a>`;
      }).join('\n')}
    </div>`;
  }

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
  <title>${pageTitle}</title>
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
  <style>
    .category-seo{margin-top:2.5rem;padding:2rem;background:#fff;border-top:2px solid #e5e7eb;line-height:1.8}
    .category-seo h2{font-size:1.25rem;margin-bottom:1rem;color:var(--color-text,#1f2937)}
    .category-seo p{margin-bottom:1rem;color:var(--color-text-secondary,#4b5563)}
    .category-seo a{color:var(--color-primary,#1B3A5C);text-decoration:underline}
    .category-children{border-right:2px solid #e5e7eb;margin-right:12px;}
    .subcategory-card:hover{background:#eef2ff !important;border-color:#c7d2fe !important;}
  </style>
  <script type="application/ld+json">${jsonLd}</script>
  ${(catSeo.faqs && catSeo.faqs.length > 0) ? `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": catSeo.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }, null, 2)}</script>` : ''}
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  })}</script>
</head>
<body>
  <div class="top-bar"><div class="container"><div class="top-bar__info"><div class="top-bar__item"><i class="fas fa-phone-alt"></i> <a href="tel:037740400">03-7740400</a></div><div class="top-bar__item"><i class="fas fa-envelope"></i> <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div><div class="top-bar__item"><i class="fas fa-clock"></i> <span>א'-ה' 08:00-17:00</span></div></div><div class="top-bar__social"><a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a></div></div></div>

  <header class="header"><div class="container">
    <a href="/" class="header__logo"><img src="/images/logo/logo-dark.png" alt="וואי מרקט" width="98" height="52"></a>
    <nav class="main-nav" aria-label="ניווט ראשי">
      <div class="main-nav__item"><a href="/" class="main-nav__link">דף הבית</a></div>
      <div class="main-nav__item"><a href="/catalog" class="main-nav__link">מוצרים</a></div>
      <div class="main-nav__item"><a href="/about" class="main-nav__link">אודות</a></div>
      <div class="main-nav__item"><a href="/blog" class="main-nav__link">בלוג</a></div>
      <div class="main-nav__item"><a href="/contact" class="main-nav__link">צרו קשר</a></div>
    </nav>
    <div class="header__actions">
      <button class="header__cart-btn" aria-label="עגלת קניות"><i class="fas fa-shopping-cart"></i><span class="cart-count">0</span></button>
      <a href="/login" class="header__login-btn"><i class="fas fa-user"></i> <span>כניסה</span></a>
    </div>
    <button class="mobile-menu-btn" aria-label="תפריט" aria-expanded="false"><i class="fas fa-bars"></i></button>
  </div></header>
  <div class="mobile-overlay"></div>

  <div class="container">
    <nav class="breadcrumb" aria-label="ניווט פירורי לחם">
      ${breadcrumbHtml}
    </nav>
  </div>

  <section class="section">
    <div class="container">
      <div class="catalog-layout">
        <aside class="catalog-sidebar">
          <div class="sidebar-section">
            <h3>קטגוריות</h3>
            <div class="category-list">
              ${sidebarHtml}
              <a href="/catalog" class="category-list__item" style="margin-top:8px;border-top:1px solid #e5e7eb;padding-top:8px;"><span>כל המוצרים</span></a>
            </div>
          </div>
        </aside>
        <div class="catalog-main">
          <div class="catalog-header">
            ${categoryImage ? `<img src="${categoryImage}" alt="${categoryImageAlt}" class="category-hero-img" style="max-height:200px;width:100%;object-fit:cover;border-radius:12px;margin-bottom:1rem;" />` : ''}
            <h1>${h1Text}</h1>
            <p>${categoryProducts.length} מוצרים</p>
          </div>
          ${subcategoriesHtml}
          <div class="products-grid">
            ${productsHtml}
          </div>
          ${seoContentBlock ? `<div class="category-seo">${seoContentBlock}</div>` : ''}
          <div class="category-cta" style="background:var(--color-bg-light,#f8f9fa);border-radius:12px;padding:2rem;margin-top:2rem;text-align:center;">
            <h3 style="margin-bottom:0.5rem;">צריכים כמות גדולה? קבלו הצעת מחיר מותאמת אישית</h3>
            <p style="color:var(--color-text-light,#6b7280);margin-bottom:1rem;">לקוחות עסקיים נהנים ממחירים מיוחדים, אספקה שוטפת ושירות אישי</p>
            <a href="https://wa.me/972549922492?text=היי, אשמח לקבל הצעת מחיר ל${encodeURIComponent(category.name)}" target="_blank" rel="noopener" class="btn btn--whatsapp" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;font-size:1.05rem;"><i class="fab fa-whatsapp"></i> שלחו הודעה בוואטסאפ</a>
            <span style="display:inline-block;margin:0 12px;color:var(--color-text-light);">או</span>
            <a href="tel:037740400" class="btn btn--outline" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;font-size:1.05rem;"><i class="fas fa-phone-alt"></i> 03-7740400</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer"><div class="container">
    <div class="footer__grid">
      <div class="footer__brand"><img src="/images/logo/logo-white.png" alt="וואי מרקט" width="112" height="60"><p>נגלר סחר והפצה — מוצרי צריכה שוטפת לעסקים ומוסדות.</p></div>
      <div class="footer__col"><h4>קישורים</h4><div class="footer__links"><a href="/about">אודות</a><a href="/faq">שאלות ותשובות</a><a href="/contact">צרו קשר</a></div></div>
      <div class="footer__col"><h4>צרו קשר</h4><div class="footer__contact-item"><i class="fas fa-phone-alt"></i><a href="tel:037740400">03-7740400</a></div><div class="footer__contact-item"><i class="fas fa-envelope"></i><a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div></div>
    </div>
    <div class="footer__bottom"><span class="footer__copyright">&copy; 2026 וואי מרקט. כל הזכויות שמורות.</span><div class="footer__legal"><a href="/legal/terms">תקנון</a><a href="/legal/privacy">פרטיות</a><a href="/legal/accessibility">נגישות</a></div></div>
  </div></footer>

  <a href="https://wa.me/972549922492" class="whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
  <script src="/js/main.min.js?v=20260310b"></script>
  <script>
    // Toggle subcategory visibility in sidebar
    document.querySelectorAll('.category-list__item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        var children = this.nextElementSibling;
        if (children && children.classList.contains('category-children')) {
          var icon = this.querySelector('.fa-chevron-down');
          if (icon) {
            if (children.style.display === 'none') {
              children.style.display = '';
              icon.style.transform = '';
            } else if (!this.classList.contains('active')) {
              // Only toggle if not navigating to this category
              e.preventDefault();
              children.style.display = 'none';
              icon.style.transform = 'rotate(90deg)';
            }
          }
        }
      });
    });
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

  if (categories.length === 0) {
    console.log('No categories found.');
    return;
  }

  // Build category tree
  const { roots: treeRoots, map: catMap } = buildCategoryTree(categories);

  // Clean category directory completely
  if (fs.existsSync(CATEGORY_DIR)) {
    cleanDir(CATEGORY_DIR);
  }

  // Track generated slugs to prevent duplicates
  const generatedSlugs = new Set();

  // Generate page for EVERY category (parents and children), one page per slug
  let count = 0;
  for (const category of categories) {
    if (!category.slug) continue;
    if (generatedSlugs.has(category.slug)) {
      console.warn(`Skipping duplicate slug: ${category.slug}`);
      continue;
    }
    generatedSlugs.add(category.slug);

    const treeCategory = catMap.get(category.id);
    const html = generateCategoryPage(treeCategory || category, products, categories, catMap, treeRoots);
    const slugDir = getCategoryFsPath(treeCategory || category, catMap, CATEGORY_DIR);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf-8');
    count++;
  }

  console.log(`Generated ${count} category pages (tree structure) in ${CATEGORY_DIR}`);
}

main();
