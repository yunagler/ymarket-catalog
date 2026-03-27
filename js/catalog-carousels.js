/* ===========================================
   Y Market - Catalog Carousels Page
   Groups products by parent category and
   displays Swiper carousels with SEO Q&A
   =========================================== */

(function() {
  'use strict';

  var MAX_PRODUCTS_PER_CAROUSEL = 20;
  var MIN_PRODUCTS_FOR_CATEGORY = 1;
  var salesRanking = {}; // item_id -> rank score (higher = better seller)

  // Icon mapping for parent categories (by slug AND seoSlug)
  var CATEGORY_ICONS = {
    'industrial-cleaning-supplies-wholesale': 'fa-spray-can',
    'bulk-paper-towel-office-supplies': 'fa-toilet-paper',
    'disposable-catering-food-service': 'fa-utensils',
    'food-packaging-delivery-solutions': 'fa-box-open',
    'heavy-duty-garbage-bags-wholesale': 'fa-trash-alt',
    'professional-cleaning-cloths-microfiber': 'fa-tshirt',
    'office-coffee-breakroom-supplies': 'fa-coffee',
    'safety-ppe-equipment-for-business': 'fa-hard-hat',
    'office-supplies-wholesale-business': 'fa-pen',
    'maintenance-technical-equipment-wholesale': 'fa-wrench',
    'warehouse-packaging-supplies-wholesale': 'fa-tape',
    'first-aid-medical-equipment-business': 'fa-first-aid',
    'personal-hygiene-products-wholesale': 'fa-pump-soap',
    'institutional-cleaning-tools-equipment': 'fa-tools',
    'home-delivery-stock-deals': 'fa-home',
    'institutional-textiles-bedding-wholesale': 'fa-bed',
    'reusable-serving-tools': 'fa-wine-glass-alt',
    'ציוד-משרדי-וכללי': 'fa-pen',
    'חד-פעמי-ואירוח': 'fa-utensils',
    'מגשי-קלקר': 'fa-th-large',
    'עזרה-ראשונה-רפואי': 'fa-first-aid',
    'טואלטיקה-וטיפוח-אישי': 'fa-pump-soap',
    'דליים-כפות-אשפה-ומרססים': 'fa-fill-drip',
    'textiles-clothing-living-supplies': 'fa-bed',
    '-כפפות-חדפעמיות': 'fa-hand-paper',
    'מבשמים-ושירותים': 'fa-air-freshener',
    'אריזות-מזון-ו-Take-Away': 'fa-box-open',
    'בטיחות-ומיגון-אישי-PPE': 'fa-hard-hat',
    'ציוד-טכני-ואחזקה': 'fa-wrench',
    'קראפטים': 'fa-box',
    'שקיות-שירות-וחנות': 'fa-shopping-bag',
    'מגשי-פלסטיק': 'fa-th-large',
    'נייר-טואלט': 'fa-toilet-paper',
    'קפה-שתייה-וכיבוד': 'fa-coffee',
    '-מטאטאים-מגבים-ומקלות': 'fa-broom',
    'קרצוף-ורחצה': 'fa-soap',
    'עטיפה-אריזה-ולוגיסטיקה': 'fa-tape',
    'מסירי-שומן-וכימיקלים': 'fa-flask',
    'work-maintenance-tools': 'fa-tools',
    'מיכלים': 'fa-archive',
    'ניירות-רדיד-ועטיפות-מזון': 'fa-scroll',
    'מסכות-פנים-והגנת-נשימה': 'fa-head-side-mask',
    '-כפפות-עבודה-ומגן': 'fa-mitten',
    'גביעים': 'fa-glass-whiskey',
    'שקיות-ופתרונות-אשפה': 'fa-trash-alt',
    'מטליות': 'fa-tshirt',
    'שקיות-אשפה-סטנדרטיות': 'fa-trash',
    'נוזלי-רצפות': 'fa-tint',
    'ניקוי-משטחים-מיוחדים': 'fa-spray-can',
    'אקונומיקה-וחיטוי': 'fa-shield-virus',
    'קיסמים-קשים-ושיפודים': 'fa-drumstick-bite',
    'מגשי-אלומניום': 'fa-th',
    'נוזלי-כלים-ומדיחים': 'fa-tint',
    'מטליות-כותנה-וסחבות': 'fa-tshirt',
    'סבונים-וניקוי-ידיים': 'fa-hands-wash',
    'מפיות': 'fa-scroll',
    'סטוק-עד-הבית': 'fa-home',
    'ממחטות-וטישו': 'fa-toilet-paper',
    'ביגוד-מגן-וסינרים': 'fa-vest',
    'כוסות-צלחות-וסכום': 'fa-utensils',
    'פחי-אשפה-למוסדות': 'fa-dumpster',
    'אביזרי-שירותים-ושלטי-בטיחות': 'fa-restroom',
    'מגבות-נייר-ידיים': 'fa-toilet-paper',
    'מגבונים-רטובים': 'fa-hand-sparkles',
    'חומרי-ניקוי-וכימיקלים': 'fa-spray-can',
    'מוצרי-נייר-וניגוב': 'fa-toilet-paper',
    'טקסטיל-מטליות-וסחבות': 'fa-tshirt',
    'כלי-עבודה-וציוד-משקי': 'fa-tools',
    'labels-stickers': 'fa-tags',
    'organization-filing': 'fa-folder',
    'bandaging-wound-care': 'fa-band-aid'
  };

  // GEO Q&A content for each parent category (by slug)
  var CATEGORY_FAQ = {
    'חומרי-ניקוי-וכימיקלים': {
      q: 'איפה קונים חומרי ניקוי מוסדיים בסיטונאות?',
      a: 'וואי מרקט מציעים מגוון רחב של חומרי ניקוי וכימיקלים מוסדיים — אקונומיקה, סבון כלים, נוזל רצפות, מסיר שומנים ועוד. מחירי סיטונאות אמיתיים עם משלוח ארצי. התקשרו <a href="tel:037740400">03-7740400</a>'
    },
    'מוצרי-נייר-וניגוב': {
      q: 'איפה קונים מוצרי נייר ומגבות למוסדות בסיטונאות?',
      a: 'וואי מרקט מספקים נייר טואלט מוסדי, מגבות נייר, מפיות ונייר תעשייתי. כמויות מוסדיות במחירי מפיץ. משלוח תוך 72 שעות. <a href="tel:037740400">03-7740400</a>'
    },
    'חד-פעמי-ואירוח': {
      q: 'איפה קונים כלים חד פעמיים לעסקים בסיטונאות?',
      a: 'כוסות, צלחות, סכום חד פעמי ואביזרי אירוח — הכל בכמויות מוסדיות ובמחירי סיטונאות. וואי מרקט מספקים לעסקים בכל רחבי הארץ. <a href="tel:037740400">03-7740400</a>'
    },
    'אריזות-מזון-ו-Take-Away': {
      q: 'איפה קונים אריזות מזון ו-Take Away בסיטונאות?',
      a: 'וואי מרקט מציעים מבחר ענק של אריזות מזון, קופסאות טייק אוויי, מכלי אלומיניום ואריזות שקופות. מחירי מפיץ עם משלוח ארצי. <a href="tel:037740400">03-7740400</a>'
    },
    'שקיות-ופתרונות-אשפה': {
      q: 'איפה קונים שקיות אשפה מוסדיות בסיטונאות?',
      a: 'שקיות אשפה כבדות לתעשייה, שקיות שירות, שקיות זבל צבעוניות — הכל במידות מוסדיות ובמחירי סיטונאות. וואי מרקט — משלוח ארצי. <a href="tel:037740400">03-7740400</a>'
    },
    'טקסטיל-מטליות-וסחבות': {
      q: 'איפה קונים מטליות וסחבות מוסדיות בסיטונאות?',
      a: 'מטליות מיקרופייבר, סחבות מוסדיות, מגבוני רצפה ומגבונים רטובים — הכל באיכות מקצועית. וואי מרקט מספקים ישירות לעסקים. <a href="tel:037740400">03-7740400</a>'
    },
    'קפה-שתייה-וכיבוד': {
      q: 'איפה קונים קפה וכיבוד למשרד בסיטונאות?',
      a: 'וואי מרקט מציעים קפה, תה, סוכר, כיבוד יבש ומוצרי שתייה למשרדים ומוסדות. מחירי סיטונאות עם אספקה שוטפת. <a href="tel:037740400">03-7740400</a>'
    },
    'בטיחות-ומיגון-אישי-PPE': {
      q: 'איפה קונים ציוד בטיחות ומיגון (PPE) בסיטונאות?',
      a: 'כפפות, מסכות, ביגוד מגן, משקפי מגן ואביזרי בטיחות — הכל בתקנים מחמירים. וואי מרקט מספקים ציוד PPE לעסקים ומוסדות. <a href="tel:037740400">03-7740400</a>'
    },
    'ציוד-משרדי-וכללי': {
      q: 'איפה קונים ציוד משרדי בסיטונאות לעסקים?',
      a: 'מוצרי משרד, נייר צילום, כלי כתיבה, ציוד כללי ומתכלים — הכל במחירי מפיץ. וואי מרקט מספקים לעסקים בכל הגדלים. <a href="tel:037740400">03-7740400</a>'
    },
    'ציוד-טכני-ואחזקה': {
      q: 'איפה קונים ציוד טכני ואחזקה למוסדות בסיטונאות?',
      a: 'מוצרי אחזקה, שמנים, דבקים, סרטי הדבקה וציוד טכני לעסקים. וואי מרקט — אספקה ארצית תוך 72 שעות. <a href="tel:037740400">03-7740400</a>'
    },
    'עטיפה-אריזה-ולוגיסטיקה': {
      q: 'איפה קונים חומרי אריזה ולוגיסטיקה בסיטונאות?',
      a: 'סרט הדבקה, ניילון נצמד, ניילון מתיחה, קרטונים ואביזרי אריזה — הכל למחסן ולעסק. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'כלי-עבודה-וציוד-משקי': {
      q: 'איפה קונים כלי ניקיון וציוד משקי בסיטונאות?',
      a: 'מגבים, דליים, מקלות מגב, פחי אשפה מוסדיים וכלי עבודה — הכל באיכות תעשייתית. וואי מרקט מספקים לחברות ניקיון ומוסדות. <a href="tel:037740400">03-7740400</a>'
    },
    'עזרה-ראשונה-רפואי': {
      q: 'איפה קונים ציוד עזרה ראשונה ורפואי בסיטונאות?',
      a: 'ערכות עזרה ראשונה, תחבושות, מסכות כירורגיות, כפפות רפואיות ועוד. וואי מרקט — ציוד רפואי בתקנים לעסקים ומוסדות. <a href="tel:037740400">03-7740400</a>'
    },
    'טואלטיקה-וטיפוח-אישי': {
      q: 'איפה קונים מוצרי טואלטיקה וטיפוח למוסדות בסיטונאות?',
      a: 'סבון ידיים, שמפו, קרם גוף, דאודורנט ומוצרי טיפוח — הכל בכמויות מוסדיות. וואי מרקט מספקים לבתי מלון, חדרי כושר ומוסדות. <a href="tel:037740400">03-7740400</a>'
    },
    'סטוק-עד-הבית': {
      q: 'איפה קונים מוצרי צריכה שוטפת בסיטונאות לבית?',
      a: 'חבילות סטוק במחירי מפיץ — שקיות אשפה, נייר טואלט, חומרי ניקוי ועוד. וואי מרקט מביאים את הסיטונאות עד הבית. <a href="tel:037740400">03-7740400</a>'
    },
    'textiles-clothing-living-supplies': {
      q: 'איפה קונים טקסטיל וביגוד מוסדי בסיטונאות?',
      a: 'מצעים, מגבות, ביגוד ומוצרי מגורים למוסדות ובתי מלון. וואי מרקט — מחירי סיטונאות עם אספקה ארצית. <a href="tel:037740400">03-7740400</a>'
    },
    'reusable-serving-tools': {
      q: 'איפה קונים כלי הגשה רב-פעמיים בסיטונאות?',
      a: 'מגשי הגשה, כלי הגשה מנירוסטה ופלסטיק קשיח — הכל לשימוש חוזר באיכות מקצועית. וואי מרקט מספקים לעסקים. <a href="tel:037740400">03-7740400</a>'
    },
    'מגשי-קלקר': {
      q: 'איפה קונים מגשי קלקר למזון בסיטונאות?',
      a: 'מגשי קלקר סופגים וקשיחים בכל הגדלים והצבעים — לאטליזים, מסעדות ועסקי מזון. וואי מרקט — מחירי מפיץ ומשלוח ארצי. <a href="tel:037740400">03-7740400</a>'
    },
    '-כפפות-חדפעמיות': {
      q: 'איפה קונים כפפות חד פעמיות בסיטונאות?',
      a: 'כפפות נטריל, ויניל ולטקס — בכל המידות והצבעים. מאושרות למגע מזון ולשימוש רפואי. וואי מרקט — מחירי מפיץ ישירות. <a href="tel:037740400">03-7740400</a>'
    },
    'מבשמים-ושירותים': {
      q: 'איפה קונים מבשמים ומפיצי ריח למוסדות בסיטונאות?',
      a: 'מפיצי ריח, מבשמי אוויר, סבונים ריחניים ואביזרי שירותים — הכל בכמויות מוסדיות. וואי מרקט מספקים לעסקים ומשרדים. <a href="tel:037740400">03-7740400</a>'
    },
    'דליים-כפות-אשפה-ומרססים': {
      q: 'איפה קונים דליים וכלי ניקיון מוסדיים בסיטונאות?',
      a: 'דליי ניקיון, סחיטות, מרססים, כפות אשפה ואביזרים מקצועיים — הכל לניקיון מוסדי. וואי מרקט — איכות תעשייתית. <a href="tel:037740400">03-7740400</a>'
    },
    'מגשי-פלסטיק': {
      q: 'איפה קונים מגשי פלסטיק לבשר בסיטונאות?',
      a: 'מגשי בשר בצבעים שונים — לבן, שחור, כחול, אדום. עם ובלי ספיגה. וואי מרקט — מגשי פלסטיק לאטליזים ועסקי מזון. <a href="tel:037740400">03-7740400</a>'
    },
    'שקיות-שירות-וחנות': {
      q: 'איפה קונים שקיות גופיה ושירות בסיטונאות?',
      a: 'שקיות גופיה, שקיות חנות ושקיות אריזה בכל הגדלים — לסופרים, חנויות ועסקים. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'קראפטים': {
      q: 'איפה קונים קרפטים וקופסאות למזון בסיטונאות?',
      a: 'קופסאות קרפט, מגשי קרפט ואריזות מזון אקולוגיות — למסעדות ולשירותי קייטרינג. וואי מרקט — אריזות איכותיות במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'נייר-טואלט': {
      q: 'איפה קונים נייר טואלט מוסדי בסיטונאות?',
      a: 'נייר טואלט קומפקט, ג\'מבו, דו-שכבתי וחד-שכבתי — הכל בכמויות מוסדיות. וואי מרקט — מחירי סיטונאות אמיתיים. <a href="tel:037740400">03-7740400</a>'
    },
    '-מטאטאים-מגבים-ומקלות': {
      q: 'איפה קונים מטאטאים ומגבים מוסדיים בסיטונאות?',
      a: 'מטאטאים, מגבי רצפה, מקלות עץ ומתכת — הכל באיכות מקצועית לניקיון מוסדי. וואי מרקט מספקים לחברות ניקיון. <a href="tel:037740400">03-7740400</a>'
    },
    'קרצוף-ורחצה': {
      q: 'איפה קונים ספוגים ומוצרי קרצוף בסיטונאות?',
      a: 'ספוגים, כריות קרצוף, פד סקוטש ואביזרי שפשוף — הכל לשימוש מקצועי במטבחים ומוסדות. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'מסירי-שומן-וכימיקלים': {
      q: 'איפה קונים מסירי שומן וכימיקלים מוסדיים?',
      a: 'מסירי שומן חזקים, חומרי חיטוי תעשייתיים ומנקי משטחים מקצועיים. וואי מרקט — כימיקלים מוסדיים במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'ניירות-רדיד-ועטיפות-מזון': {
      q: 'איפה קונים נייר אפייה ורדיד אלומיניום בסיטונאות?',
      a: 'נייר אפייה, רדיד אלומיניום, ניילון נצמד ושקיות מזון — הכל בגלילים מוסדיים. וואי מרקט — מחירי מפיץ ואספקה ארצית. <a href="tel:037740400">03-7740400</a>'
    },
    'מגשי-אלומניום': {
      q: 'איפה קונים תבניות אלומיניום בסיטונאות?',
      a: 'מגשי אלומיניום בכל הגדלים — 105, 210, גסטרונום, אינגליש קייק ועוד. וואי מרקט — מחירי מפיץ לעסקים ולקייטרינג. <a href="tel:037740400">03-7740400</a>'
    },
    'מיכלים': {
      q: 'איפה קונים מיכלי פלסטיק לסלט ומנות בסיטונאות?',
      a: 'מיכלים שקופים לסלטים, מנות עיקריות וקינוחים — במידות ונפחים שונים. וואי מרקט — אריזות מזון מקצועיות. <a href="tel:037740400">03-7740400</a>'
    },
    'גביעים': {
      q: 'איפה קונים גביעים ומיכלי רוטב בסיטונאות?',
      a: 'גביעי רוטב, גביעי טעימות, כוסות מידה ומיכלים קטנים — הכל לעסקי מזון וקייטרינג. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'מסכות-פנים-והגנת-נשימה': {
      q: 'איפה קונים מסכות פנים בסיטונאות?',
      a: 'מסכות כירורגיות, מסכות N95, מסכות בד ומסכות הגנה — בתקנים מחמירים. וואי מרקט מספקים ציוד הגנה למוסדות. <a href="tel:037740400">03-7740400</a>'
    },
    'ביגוד-מגן-וסינרים': {
      q: 'איפה קונים ביגוד מגן וסינרים בסיטונאות?',
      a: 'סינרים חד פעמיים, חלוקי מגן, כיסויי נעליים וביגוד בטיחות — הכל למוסדות ולעסקים. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'ניקוי-משטחים-מיוחדים': {
      q: 'איפה קונים חומרי ניקוי למשטחים מיוחדים?',
      a: 'מנקי חלונות, נוזלי נירוסטה, מנקי אבנים ומשטחים רגישים — הכל באיכות מקצועית. וואי מרקט — כימיקלים מוסדיים. <a href="tel:037740400">03-7740400</a>'
    },
    'מטליות-כותנה-וסחבות': {
      q: 'איפה קונים מטליות כותנה וסחבות מוסדיות?',
      a: 'סחבות רצפה, מטליות כותנה ומגבוני ניקיון — באיכות מקצועית לניקיון מוסדי. וואי מרקט — אספקה ישירה. <a href="tel:037740400">03-7740400</a>'
    },
    'מטליות': {
      q: 'איפה קונים מטליות מיקרופייבר בסיטונאות?',
      a: 'מטליות מיקרופייבר לרצפות, שולחנות ומשטחים — חיטוי ללא כימיקלים. וואי מרקט — מטליות מקצועיות במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'נוזלי-רצפות': {
      q: 'איפה קונים נוזלי רצפות מוסדיים בסיטונאות?',
      a: 'נוזלי רצפות ריחניים ומחטאים — בגלונים מוסדיים לחברות ניקיון ועסקים. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'אקונומיקה-וחיטוי': {
      q: 'איפה קונים אקונומיקה וחומרי חיטוי בסיטונאות?',
      a: 'אקונומיקה 3.5%, חומרי חיטוי מוסדיים ומחטאי משטחים — הכל בגלונים. וואי מרקט — כימיקלים מוסדיים במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'נוזלי-כלים-ומדיחים': {
      q: 'איפה קונים סבון כלים מוסדי בסיטונאות?',
      a: 'נוזל כלים 18%, סבון מדיח ומנקי כלי מטבח — בגלונים מוסדיים. וואי מרקט — חומרי ניקיון מקצועיים. <a href="tel:037740400">03-7740400</a>'
    },
    'סבונים-וניקוי-ידיים': {
      q: 'איפה קונים סבון ידיים מוסדי בסיטונאות?',
      a: 'סבון ידיים נוזלי, סבון קצף ומחטא ידיים — בגלונים ובאריזות מוסדיות. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'שקיות-אשפה-סטנדרטיות': {
      q: 'איפה קונים שקיות אשפה בסיטונאות?',
      a: 'שקיות זבל בכל הגדלים והעוביים — לבית, למשרד ולתעשייה. וואי מרקט — שקיות אשפה במחירי מפיץ עם אספקה ארצית. <a href="tel:037740400">03-7740400</a>'
    },
    'שקיות-אשפה-כבדות-תעשייה': {
      q: 'איפה קונים שקיות אשפה כבדות לתעשייה?',
      a: 'שקיות אשפה עבות ומחוזקות — לפסולת כבדה, בניין ותעשייה. וואי מרקט — שקיות גורילה ותעשייתיות. <a href="tel:037740400">03-7740400</a>'
    },
    'מגבות-נייר-ידיים': {
      q: 'איפה קונים מגבות נייר ידיים למוסדות בסיטונאות?',
      a: 'מגבות נייר Z-fold, C-fold ורולים — לבתי שימוש מוסדיים ומשרדים. וואי מרקט — מחירי סיטונאות. <a href="tel:037740400">03-7740400</a>'
    },
    'מפיות': {
      q: 'איפה קונים מפיות מוסדיות בסיטונאות?',
      a: 'מפיות לבנות, צבעוניות ומודפסות — בכמויות מוסדיות למסעדות וקייטרינג. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'ממחטות-וטישו': {
      q: 'איפה קונים נייר תעשייתי בסיטונאות?',
      a: 'נייר תעשייתי, ממחטות וטישו — בגלילים מוסדיים לכל סוגי העסקים. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'כוסות-צלחות-וסכום': {
      q: 'איפה קונים כוסות וצלחות חד פעמיות בסיטונאות?',
      a: 'כוסות קרות וחמות, צלחות וסכום חד פעמי — לאירועים, עסקים ומוסדות. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'קיסמים-קשים-ושיפודים': {
      q: 'איפה קונים קיסמים ושיפודים בסיטונאות?',
      a: 'קיסמי שיניים, שיפודי עץ ובמבוק, קשיות שתייה — הכל לעסקי מזון וקייטרינג. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    '-כפפות-עבודה-ומגן': {
      q: 'איפה קונים כפפות עבודה ומגן בסיטונאות?',
      a: 'כפפות עבודה, כפפות גומי ציפוי ניטריל ולטקס — לתעשייה ולעבודה כללית. וואי מרקט — ציוד מגן מקצועי. <a href="tel:037740400">03-7740400</a>'
    },
    'פחי-אשפה-למוסדות': {
      q: 'איפה קונים פחי אשפה מוסדיים בסיטונאות?',
      a: 'פחי אשפה מוסדיים בכל הגדלים — לפנים ולחוץ, עם מכסה ובלי. וואי מרקט — ציוד ניקיון מוסדי. <a href="tel:037740400">03-7740400</a>'
    },
    'אביזרי-שירותים-ושלטי-בטיחות': {
      q: 'איפה קונים אביזרי שירותים ושלטי בטיחות?',
      a: 'מתקני נייר, מתקני סבון, שלטי בטיחות ואביזרים לשירותים. וואי מרקט — אביזרים מוסדיים במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'מגבונים-רטובים': {
      q: 'איפה קונים מגבונים רטובים מוסדיים בסיטונאות?',
      a: 'מגבונים רטובים ריחניים, אנטיבקטריאליים ומגבוני תינוקות — בכמויות מוסדיות. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'work-maintenance-tools': {
      q: 'איפה קונים כלי עבודה ואחזקה בסיטונאות?',
      a: 'כלי עבודה, מברגים, סכיני יפני וציוד אחזקה שוטפת — לעסקים ומוסדות. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'labels-stickers': {
      q: 'איפה קונים מדבקות ותוויות בסיטונאות?',
      a: 'מדבקות סימון, תוויות מחיר ותוויות ברקוד — הכל לעסקים וחנויות. וואי מרקט — ציוד משרדי במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'organization-filing': {
      q: 'איפה קונים ציוד ארגון ותיוק למשרד?',
      a: 'תיקיות, קלסרים, קופסאות ארגון ואביזרי תיוק — הכל למשרד המאורגן. וואי מרקט — ציוד משרדי במחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    },
    'bandaging-wound-care': {
      q: 'איפה קונים חומרי חבישה וטיפול בפצעים?',
      a: 'תחבושות, פלסטרים, גזה וחומרי חיטוי — ציוד עזרה ראשונה לעסקים ומוסדות. וואי מרקט — מחירי מפיץ. <a href="tel:037740400">03-7740400</a>'
    }
  };

  function formatPrice(price) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency', currency: 'ILS',
      minimumFractionDigits: 0, maximumFractionDigits: 2
    }).format(price);
  }

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getWebpUrl(imageUrl, productId, useThumb) {
    var base = imageUrl || '/items/' + productId + '.jpg';
    var suffix = useThumb ? '-thumb.webp' : '.webp';
    return base.replace(/\.jpg$/i, suffix);
  }

  function getCartQty(productId) {
    var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === productId) return cart[i].quantity;
    }
    return 0;
  }

  function setCartQty(product, qty) {
    var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
    if (qty <= 0) {
      cart = cart.filter(function(item) { return item.id !== product.id; });
    } else {
      var found = false;
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === product.id) { cart[i].quantity = qty; found = true; break; }
      }
      if (!found) {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.saleNis || 0,
          unit: product.unit || '',
          imageUrl: getWebpUrl(product.imageUrl, product.id, true),
          slug: product.slug,
          quantity: qty
        });
      }
    }
    localStorage.setItem('ym_cart', JSON.stringify(cart));
    if (window.YMarket) window.YMarket.updateCartBadge();
  }

  function showQtyControls(card, product) {
    var body = card.querySelector('.card-body');
    var btn = card.querySelector('.card-btn');
    if (btn) btn.remove();

    var existingQty = card.querySelector('.card-qty-wrap');
    if (existingQty) existingQty.remove();

    var qty = getCartQty(product.id);
    if (qty <= 0) {
      var newBtn = document.createElement('button');
      newBtn.className = 'card-btn';
      newBtn.dataset.productId = product.id;
      newBtn.innerHTML = '<i class="fas fa-cart-plus"></i> הוסף לעגלה';
      body.appendChild(newBtn);
      return;
    }

    var wrap = document.createElement('div');
    wrap.className = 'card-qty-wrap in-cart';
    wrap.dataset.productId = product.id;

    var plusBtn = document.createElement('button');
    plusBtn.className = 'card-qty-btn plus';
    plusBtn.textContent = '+';

    var valSpan = document.createElement('span');
    valSpan.className = 'card-qty-value';
    valSpan.innerHTML = '<i class="fas fa-check"></i> ' + qty;

    var minusBtn = document.createElement('button');
    minusBtn.className = 'card-qty-btn' + (qty === 1 ? ' remove' : '');
    minusBtn.innerHTML = qty === 1 ? '<i class="fas fa-trash-alt"></i>' : '−';

    wrap.appendChild(plusBtn);
    wrap.appendChild(valSpan);
    wrap.appendChild(minusBtn);
    body.appendChild(wrap);

    // Direct event listeners (bypass Swiper)
    plusBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setCartQty(product, getCartQty(product.id) + 1);
      showQtyControls(card, product);
    });
    minusBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setCartQty(product, getCartQty(product.id) - 1);
      showQtyControls(card, product);
    });
  }

  function addToCart(product, btnElement) {
    var cart = JSON.parse(localStorage.getItem('ym_cart') || '[]');
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) { existing = cart[i]; break; }
    }
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.saleNis || 0,
        unit: product.unit || '',
        imageUrl: getWebpUrl(product.imageUrl, product.id, true),
        slug: product.slug,
        quantity: 1
      });
    }
    localStorage.setItem('ym_cart', JSON.stringify(cart));
    if (window.YMarket) window.YMarket.updateCartBadge();
    if (window.YMarket) window.YMarket.showToast('המוצר נוסף לעגלה');
    if (window.YMarketAnalytics && window.YMarketAnalytics.fbAddToCart) {
      window.YMarketAnalytics.fbAddToCart({ id: product.id, name: product.name, price: product.saleNis || 0, quantity: 1 });
    }
    if (window.YMarketAnalytics && window.YMarketAnalytics.trackAddToCart) {
      window.YMarketAnalytics.trackAddToCart({ id: product.id, name: product.name, price: product.saleNis || 0, quantity: 1 });
    }

    // Switch to green qty controls immediately
    if (btnElement) {
      var card = btnElement.closest('.carousel-product-card');
      showQtyControls(card, product);
    }
  }

  function buildProductCard(product) {
    var imgWebp = getWebpUrl(product.imageUrl, product.id, true);
    var imgFallback = product.imageUrl || '/items/' + product.id + '.jpg';
    var safeName = escHtml(product.name || '');
    var safeSlug = encodeURIComponent(product.slug || '');
    var fallback = 'https://placehold.co/300x300/f0f2f5/5a6577?text=' + encodeURIComponent((product.name || '').substring(0, 15));

    var priceHtml = '';
    if (product.saleNis) {
      priceHtml = '<div class="card-price">' + formatPrice(product.saleNis) + ' <span class="card-price-note">+ מע"מ</span></div>';
    } else {
      priceHtml = '<div class="card-price">צרו קשר</div>';
    }

    var html =
      '<div class="carousel-product-card" data-fallback="' + fallback + '">' +
        '<a href="/products/' + safeSlug + '" class="card-image" aria-label="' + safeName + '">' +
          '<picture>' +
            '<source srcset="' + imgWebp + '" type="image/webp">' +
            '<img src="' + imgFallback + '" alt="' + safeName + '" loading="lazy" width="200" height="200" onerror="this.onerror=null;if(this.parentElement.querySelector(\'source\'))this.parentElement.querySelector(\'source\').remove();this.src=this.closest(\'[data-fallback]\').dataset.fallback;">' +
          '</picture>' +
        '</a>' +
        '<div class="card-body">' +
          '<a href="/products/' + safeSlug + '" class="card-name">' + safeName + '</a>' +
          priceHtml +
          (product.saleNis
            ? (getCartQty(product.id) > 0
              ? '<div class="card-qty-wrap in-cart" data-product-id="' + product.id + '">' +
                  '<button class="card-qty-btn plus" data-action="increase">+</button>' +
                  '<span class="card-qty-value"><i class="fas fa-check"></i> ' + getCartQty(product.id) + '</span>' +
                  '<button class="card-qty-btn' + (getCartQty(product.id) === 1 ? ' remove' : '') + '" data-action="decrease">' + (getCartQty(product.id) === 1 ? '<i class="fas fa-trash-alt"></i>' : '−') + '</button>' +
                '</div>'
              : '<button class="card-btn" data-product-id="' + product.id + '"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>')
            : '') +
        '</div>' +
      '</div>';

    return html;
  }

  function buildFAQSchema(categories) {
    var mainEntity = [];
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      var faq = CATEGORY_FAQ[cat.slug];
      if (!faq) continue;
      mainEntity.push({
        '@type': 'Question',
        'name': faq.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a.replace(/<[^>]+>/g, '') // strip HTML for schema
        }
      });
    }
    if (mainEntity.length === 0) return;

    var schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': mainEntity
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function buildCategorySection(parentCat, products, index) {
    var faq = CATEGORY_FAQ[parentCat.slug] || {
      q: 'איפה קונים ' + parentCat.name + ' בסיטונאות?',
      a: 'וואי מרקט מציעים ' + parentCat.name + ' במחירי סיטונאות עם משלוח ארצי לעסקים ומוסדות. <a href="tel:037740400">03-7740400</a>'
    };

    var icon = CATEGORY_ICONS[parentCat.seoSlug] || CATEGORY_ICONS[parentCat.slug] || 'fa-box';
    var categoryUrl = '/category/' + (parentCat.seoSlug || parentCat.slug) + '/';

    // Limit to MAX_PRODUCTS_PER_CAROUSEL
    var displayProducts = products.slice(0, MAX_PRODUCTS_PER_CAROUSEL);

    var slidesHtml = '';
    for (var i = 0; i < displayProducts.length; i++) {
      slidesHtml += '<div class="swiper-slide">' + buildProductCard(displayProducts[i]) + '</div>';
    }

    var uniqueId = 'catSwiper' + index;

    var sectionHtml =
      '<section class="category-carousel-section" data-category-slug="' + escHtml(parentCat.slug) + '">' +
        '<div class="category-carousel-header">' +
          '<div class="cat-icon"><i class="fas ' + icon + '"></i></div>' +
          '<h2>' + escHtml(parentCat.name) + '</h2>' +
        '</div>' +
        '<div class="category-faq">' +
          '<p class="faq-question">' + escHtml(faq.q) + '</p>' +
          '<p class="faq-answer">' + faq.a + '</p>' +
        '</div>' +
        '<div class="category-swiper-wrap">' +
          '<button class="cat-swiper-prev" id="prev' + uniqueId + '" aria-label="הקודם"><i class="fas fa-chevron-right"></i></button>' +
          '<button class="cat-swiper-next" id="next' + uniqueId + '" aria-label="הבא"><i class="fas fa-chevron-left"></i></button>' +
          '<div class="swiper" id="' + uniqueId + '">' +
            '<div class="swiper-wrapper">' + slidesHtml + '</div>' +
            '<div class="swiper-pagination" id="pag' + uniqueId + '"></div>' +
          '</div>' +
        '</div>' +
        '<a href="' + categoryUrl + '" class="category-view-all">' +
          'לכל המוצרים בקטגוריה <i class="fas fa-arrow-left"></i>' +
        '</a>' +
      '</section>';

    return { html: sectionHtml, id: uniqueId, count: displayProducts.length };
  }

  // ---- Search functionality ----
  function setupSearch(allProducts) {
    var input = document.getElementById('catalogSearchInput');
    var dropdown = document.getElementById('searchResultsDropdown');
    if (!input || !dropdown) return;

    var debounceTimer;
    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      var query = input.value.trim();
      if (query.length < 2) {
        dropdown.classList.remove('active');
        return;
      }
      debounceTimer = setTimeout(function() {
        var results = searchProducts(allProducts, query);
        renderSearchResults(results, dropdown);
      }, 200);
    });

    // Close dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  function searchProducts(products, query) {
    var q = query.toLowerCase();
    var results = [];
    for (var i = 0; i < products.length && results.length < 8; i++) {
      var p = products[i];
      var name = (p.name || '').toLowerCase();
      var tags = (p.searchTags || '').toLowerCase();
      var cat = (p.categoryName || '').toLowerCase();
      if (name.indexOf(q) !== -1 || tags.indexOf(q) !== -1 || cat.indexOf(q) !== -1) {
        results.push(p);
      }
    }
    return results;
  }

  function renderSearchResults(results, dropdown) {
    if (results.length === 0) {
      dropdown.innerHTML = '<div class="search-no-results">לא נמצאו מוצרים</div>';
      dropdown.classList.add('active');
      return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
      var p = results[i];
      var imgSrc = getWebpUrl(p.imageUrl, p.id, true);
      var safeSlug = encodeURIComponent(p.slug || '');
      html +=
        '<a href="/products/' + safeSlug + '" class="search-result-item">' +
          '<img src="' + imgSrc + '" alt="" loading="lazy" width="48" height="48" onerror="this.src=\'https://placehold.co/48x48/f0f2f5/5a6577?text=img\'">' +
          '<div class="result-info">' +
            '<div class="result-name">' + escHtml(p.name) + '</div>' +
            '<div class="result-price">' + (p.saleNis ? formatPrice(p.saleNis) : 'צרו קשר') + '</div>' +
          '</div>' +
        '</a>';
    }
    dropdown.innerHTML = html;
    dropdown.classList.add('active');
  }

  // ---- Main init ----
  async function init() {
    var container = document.getElementById('carouselSections');
    if (!container) return;

    var res, data;
    try {
      res = await fetch('/data/products.json');
      data = await res.json();
    } catch(e) {
      console.warn('Catalog carousels: could not load products.json', e);
      return;
    }

    var allProducts = data.items || [];
    var categories = data.categories || [];

    // Load sales ranking data
    try {
      var salesRes = await fetch('/data/top_selling_items.json');
      var salesData = await salesRes.json();
      var salesItems = salesData.items || salesData;
      for (var si = 0; si < salesItems.length; si++) {
        var sItem = salesItems[si];
        // Score = customers * 100 + quantity (weighted by customer reach)
        salesRanking[sItem.item_id] = (salesItems.length - si) * 1000 + (sItem.customers || 0) * 100 + (sItem.quantity || 0);
      }
    } catch(e) {
      console.warn('Could not load sales ranking', e);
    }

    // Build map of parent categories (parentId is null)
    var parentCats = {};
    var parentMap = {}; // id -> category
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      if (c.parentId === null || c.parentId === undefined) {
        parentMap[c.id] = c;
        parentCats[c.slug] = { cat: c, products: [] };
      }
    }

    // Also map subcategory slug -> parent slug
    var subToParentSlug = {};
    for (var j = 0; j < categories.length; j++) {
      var sub = categories[j];
      if (sub.parentId && parentMap[sub.parentId]) {
        subToParentSlug[sub.slug] = parentMap[sub.parentId].slug;
      }
    }

    // Group products by TOP-LEVEL parent category only
    for (var k = 0; k < allProducts.length; k++) {
      var product = allProducts[k];
      var resolvedSlug = null;

      // Try categorySlugs[1] first (usually the parent), then [0]
      var slugsToTry = [];
      if (product.categorySlugs && product.categorySlugs.length >= 2) {
        slugsToTry.push(product.categorySlugs[1]);
        slugsToTry.push(product.categorySlugs[0]);
      } else if (product.categorySlugs && product.categorySlugs.length === 1) {
        slugsToTry.push(product.categorySlugs[0]);
      } else if (product.categorySlug) {
        slugsToTry.push(product.categorySlug);
      }

      // Resolve to a top-level parent
      for (var si = 0; si < slugsToTry.length; si++) {
        var trySlug = slugsToTry[si];
        if (parentCats[trySlug]) {
          resolvedSlug = trySlug;
          break;
        }
        // If it's a sub-category slug, map to parent
        if (subToParentSlug[trySlug] && parentCats[subToParentSlug[trySlug]]) {
          resolvedSlug = subToParentSlug[trySlug];
          break;
        }
      }

      if (resolvedSlug) {
        parentCats[resolvedSlug].products.push(product);
      }
    }

    // Sort products within each category by sales ranking (best sellers first)
    Object.values(parentCats).forEach(function(entry) {
      entry.products.sort(function(a, b) {
        var scoreA = salesRanking[a.id] || 0;
        var scoreB = salesRanking[b.id] || 0;
        return scoreB - scoreA; // Higher score = better seller = first
      });
    });

    // Calculate total sales revenue per category
    Object.values(parentCats).forEach(function(entry) {
      var totalRevenue = 0;
      entry.products.forEach(function(p) {
        if (salesRanking[p.id]) totalRevenue += salesRanking[p.id];
      });
      entry.salesScore = totalRevenue;
    });

    // Sort parent categories by sales revenue (best selling categories first)
    // Include ALL categories with at least 1 product
    var sortedCats = Object.values(parentCats)
      .filter(function(entry) { return entry.products.length >= 1; })
      .sort(function(a, b) { return b.salesScore - a.salesScore; });

    if (sortedCats.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:2rem;">לא נמצאו קטגוריות להצגה</p>';
      return;
    }

    // Build all sections
    var allHtml = '';
    var swiperInits = [];

    for (var m = 0; m < sortedCats.length; m++) {
      var entry = sortedCats[m];
      var result = buildCategorySection(entry.cat, entry.products, m);
      allHtml += result.html;
      swiperInits.push({ id: result.id, count: result.count });
    }

    container.innerHTML = allHtml;

    // Initialize all Swipers
    for (var n = 0; n < swiperInits.length; n++) {
      (function(si) {
        new Swiper('#' + si.id, {
          slidesPerView: 2,
          spaceBetween: 12,
          direction: 'horizontal',
          loop: false,
          preventClicks: false,
          preventClicksPropagation: false,
          touchStartPreventDefault: false,
          pagination: {
            el: '#pag' + si.id,
            clickable: true
          },
          navigation: {
            prevEl: '#prev' + si.id,
            nextEl: '#next' + si.id
          },
          breakpoints: {
            480: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 3, spaceBetween: 14 },
            768: { slidesPerView: 4, spaceBetween: 16 },
            1024: { slidesPerView: 5, spaceBetween: 18 },
            1280: { slidesPerView: 6, spaceBetween: 20 }
          }
        });
      })(swiperInits[n]);
    }

    // Cart button handlers (delegated)
    container.addEventListener('click', function(e) {
      // "Add to cart" button
      var btn = e.target.closest('.card-btn');
      if (btn) {
        e.preventDefault();
        var productId = parseInt(btn.getAttribute('data-product-id'));
        var product = allProducts.find(function(p) { return p.id === productId; });
        if (product) addToCart(product, btn);
        return;
      }

      // Quantity +/- buttons
      var qtyBtn = e.target.closest('.card-qty-btn');
      if (qtyBtn) {
        e.preventDefault();
        e.stopPropagation();
        var card = qtyBtn.closest('.carousel-product-card');
        var wrap = qtyBtn.closest('.card-qty-wrap');
        var pid = parseInt(wrap.getAttribute('data-product-id') || card.querySelector('[data-product-id]')?.getAttribute('data-product-id'));
        var product = allProducts.find(function(p) { return p.id === pid; });
        if (!product) return;

        var action = qtyBtn.getAttribute('data-action');
        var currentQty = getCartQty(product.id);
        if (action === 'increase') {
          setCartQty(product, currentQty + 1);
        } else if (action === 'decrease') {
          setCartQty(product, currentQty - 1);
        }
        showQtyControls(card, product);
      }
    });

    // Build FAQ schema
    var faqCats = sortedCats.map(function(entry) { return entry.cat; });
    buildFAQSchema(faqCats);

    // Setup search
    setupSearch(allProducts);

    // Update product count
    var countEl = document.getElementById('totalProductCount');
    if (countEl) countEl.textContent = allProducts.length;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
