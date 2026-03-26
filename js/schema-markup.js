/**
 * Schema Markup - וואי מרקט
 * Enhanced Organization, WholesaleStore, WebSite, FAQPage, BreadcrumbList, ItemList
 * GEO-optimized for AI search visibility
 * מעודכן: 2026-03-26
 */

(function() {
  'use strict';

  // === @graph Schema - Organization + WholesaleStore + WebSite ===
  const mainGraphSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "WholesaleStore"],
        "@id": "https://ymarket.co.il/#organization",
        "name": "וואי מרקט - נגלר סחר והפצה",
        "alternateName": ["Y Market", "YMarket", "וואי מרקט", "נגלר סחר והפצה"],
        "description": "ספק B2B מוביל של מוצרי צריכה שוטפת לעסקים ומוסדות בישראל. 900+ מוצרים: חומרי ניקוי מוסדיים, מוצרי נייר, כלים חד פעמיים, אריזות מזון, ציוד בטיחות ועוד. משלוח ארצי, מחירי סיטונאות.",
        "url": "https://ymarket.co.il",
        "telephone": "+972-3-7740400",
        "email": "Pm@ymarket.co.il",
        "foundingDate": "2020",
        "founder": {
          "@type": "Person",
          "name": "יובל נגלר",
          "jobTitle": "מנכ\"ל"
        },
        "logo": {
          "@type": "ImageObject",
          "url": "https://ymarket.co.il/images/logo/logo-dark.png",
          "width": 200,
          "height": 60
        },
        "image": "https://ymarket.co.il/images/logo/logo-dark.png",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "פתח תקווה",
          "addressRegion": "מרכז",
          "addressCountry": "IL",
          "postalCode": "4951341"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 32.0853,
          "longitude": 34.8878
        },
        "areaServed": [
          { "@type": "City", "name": "תל אביב" },
          { "@type": "City", "name": "פתח תקווה" },
          { "@type": "City", "name": "ראשון לציון" },
          { "@type": "City", "name": "הרצליה" },
          { "@type": "City", "name": "רמת גן" },
          { "@type": "City", "name": "חולון" },
          { "@type": "City", "name": "גבעתיים" },
          { "@type": "City", "name": "בני ברק" },
          { "@type": "City", "name": "רמת השרון" },
          { "@type": "City", "name": "כפר סבא" },
          { "@type": "City", "name": "רעננה" },
          { "@type": "City", "name": "נתניה" },
          { "@type": "City", "name": "חיפה" },
          { "@type": "City", "name": "ירושלים" },
          { "@type": "City", "name": "באר שבע" },
          { "@type": "City", "name": "אשדוד" },
          { "@type": "City", "name": "אשקלון" },
          { "@type": "City", "name": "מודיעין" },
          { "@type": "City", "name": "אילת" },
          { "@type": "Country", "name": "Israel" }
        ],
        "priceRange": "$$",
        "paymentAccepted": ["Credit Card", "Bank Transfer", "Check"],
        "currenciesAccepted": "ILS",
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
            "opens": "08:00",
            "closes": "17:00"
          }
        ],
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+972-3-7740400",
            "contactType": "sales",
            "availableLanguage": ["Hebrew", "English"],
            "areaServed": "IL"
          },
          {
            "@type": "ContactPoint",
            "telephone": "+972-54-9922492",
            "contactType": "customer service",
            "contactOption": "TollFree",
            "availableLanguage": ["Hebrew"]
          }
        ],
        "sameAs": [
          "https://www.facebook.com/profile.php?id=100083110428101",
          "https://www.instagram.com/ymarket.ai"
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "קטלוג מוצרי צריכה שוטפת למוסדות",
          "numberOfItems": 900,
          "itemListElement": [
            {
              "@type": "OfferCatalog",
              "name": "חומרי ניקוי וכימיקלים מוסדיים",
              "description": "נוזלי רצפות, אקונומיקה, סבון כלים, מסיר שומנים, חומרי חיטוי, נוזל למדיח תעשייתי",
              "numberOfItems": 85,
              "url": "https://ymarket.co.il/category/industrial-cleaning-supplies-wholesale/"
            },
            {
              "@type": "OfferCatalog",
              "name": "מוצרי נייר וניגוב",
              "description": "נייר טואלט מוסדי, גלילי ג'מבו, מגבות נייר, מגבות Z-fold, נייר תעשייתי, מפיות",
              "numberOfItems": 70,
              "url": "https://ymarket.co.il/category/bulk-paper-towel-office-supplies/"
            },
            {
              "@type": "OfferCatalog",
              "name": "כלים חד פעמיים ואירוח",
              "description": "כוסות, צלחות, סכו\"ם חד פעמי, כלים מתכלים, מפות שולחן, כלי הגשה",
              "numberOfItems": 120,
              "url": "https://ymarket.co.il/category/disposable-catering-food-service/"
            },
            {
              "@type": "OfferCatalog",
              "name": "אריזות מזון ו-Take Away",
              "description": "מגשי אלומיניום, תבניות, קופסאות מזון, ניילון נצמד, נייר אפייה, אריזות למשלוחים",
              "numberOfItems": 95,
              "url": "https://ymarket.co.il/category/food-packaging-delivery-solutions/"
            },
            {
              "@type": "OfferCatalog",
              "name": "שקיות ופתרונות אשפה",
              "description": "שקיות אשפה HD ו-LD, שקיות גורילה, שקיות צבעוניות להפרדה, שקיות קשירה, שקיות שקילה",
              "numberOfItems": 60,
              "url": "https://ymarket.co.il/category/heavy-duty-garbage-bags-wholesale/"
            },
            {
              "@type": "OfferCatalog",
              "name": "טקסטיל, מטליות וסחבות",
              "description": "מטליות מיקרופייבר, סחבות רצפה, כריות יפניות, מגבים מקצועיים, דליי סחיטה",
              "numberOfItems": 55,
              "url": "https://ymarket.co.il/category/professional-cleaning-cloths-microfiber/"
            },
            {
              "@type": "OfferCatalog",
              "name": "קפה, שתייה וכיבוד למשרד",
              "description": "קפה, כוסות נייר, בוחשים, קשי שתייה, מכסים, סוכר, תה",
              "numberOfItems": 45,
              "url": "https://ymarket.co.il/category/office-coffee-breakroom-supplies/"
            },
            {
              "@type": "OfferCatalog",
              "name": "בטיחות ומיגון אישי (PPE)",
              "description": "כפפות ניטריל, כפפות ויניל, כפפות לטקס, כיסוי נעליים, סינרים, משקפי מגן, אפודים זוהרים",
              "numberOfItems": 65,
              "url": "https://ymarket.co.il/category/safety-ppe-equipment-for-business/"
            },
            {
              "@type": "OfferCatalog",
              "name": "ציוד משרדי וכללי",
              "description": "נייר A4, מעטפות, דבקים, סרטי הדבקה, מספריים, מהדקים, ציוד כתיבה",
              "numberOfItems": 50,
              "url": "https://ymarket.co.il/category/office-supplies-wholesale-business/"
            },
            {
              "@type": "OfferCatalog",
              "name": "ציוד טכני ואחזקה",
              "description": "כלי עבודה, מברגים, אזיקונים, פנסים, סרטי איטום, ציוד חשמלי בסיסי",
              "numberOfItems": 40,
              "url": "https://ymarket.co.il/category/maintenance-technical-equipment-wholesale/"
            },
            {
              "@type": "OfferCatalog",
              "name": "עטיפה, אריזה ולוגיסטיקה",
              "description": "סרט אריזה, סטרץ', קרטונים, ניילון בועות, סכיני חיתוך, מדבקות",
              "numberOfItems": 35,
              "url": "https://ymarket.co.il/category/warehouse-packaging-supplies-wholesale/"
            },
            {
              "@type": "OfferCatalog",
              "name": "עזרה ראשונה וציוד רפואי",
              "description": "ערכות עזרה ראשונה, פלסטרים, תחבושות, מכשירי החייאה, ארונות תרופות",
              "numberOfItems": 45,
              "url": "https://ymarket.co.il/category/first-aid-medical-equipment-business/"
            },
            {
              "@type": "OfferCatalog",
              "name": "טואלטיקה וטיפוח אישי",
              "description": "סבון ידיים, ג'ל רחצה, שמפו, קרם ידיים, מגבונים, דאודורנט",
              "numberOfItems": 40,
              "url": "https://ymarket.co.il/category/personal-hygiene-products-wholesale/"
            },
            {
              "@type": "OfferCatalog",
              "name": "כלי עבודה וציוד משקי",
              "description": "מגבים, דליים, עגלות ניקיון, שלטי רצפה רטובה, מברשות, את רפת",
              "numberOfItems": 50,
              "url": "https://ymarket.co.il/category/institutional-cleaning-tools-equipment/"
            }
          ]
        },
        "knowsAbout": [
          "מוצרי ניקיון מוסדיים",
          "כלים חד פעמיים לעסקים",
          "מוצרי נייר מוסדי",
          "אריזות מזון לעסקים",
          "ציוד בטיחות PPE",
          "אספקה לעסקים ומוסדות",
          "שקיות אשפה מוסדיות",
          "חומרי ניקוי סיטונאי",
          "ציוד למסעדות",
          "אספקה לחברות ניקיון",
          "מוצרי צריכה שוטפת",
          "ציוד ניקיון למוסדות"
        ],
        "slogan": "אספקה חכמה ומדויקת למוסדות",
        "numberOfEmployees": {
          "@type": "QuantitativeValue",
          "value": 2
        },
        "isicV4": "4649",
        "naics": "424120",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "127",
          "bestRating": "5"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://ymarket.co.il/#website",
        "name": "וואי מרקט - מוצרי צריכה שוטפת לעסקים ומוסדות",
        "alternateName": "Y Market",
        "url": "https://ymarket.co.il",
        "description": "אתר הזמנות B2B למוצרי צריכה שוטפת: חומרי ניקיון, מוצרי נייר, כלים חד פעמיים, אריזות מזון, ציוד בטיחות. 900+ מוצרים, משלוח ארצי, מחירי סיטונאות.",
        "publisher": { "@id": "https://ymarket.co.il/#organization" },
        "inLanguage": "he-IL",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://ymarket.co.il/catalog?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  // === Enhanced FAQPage Schema - 18 שאלות ===
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "מה מינימום ההזמנה בוואי מרקט?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "מינימום הזמנה הוא 1,600 ₪ + מע\"מ ללא עלות משלוח. עלות המשלוח נקבעת לפי אזור האספקה. ניתן להזמין דרך פורטל ההזמנות הדיגיטלי, בטלפון 03-7740400 או דרך WhatsApp 054-9922492."
        }
      },
      {
        "@type": "Question",
        "name": "אילו סוגי עסקים יכולים להזמין מוואי מרקט?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "וואי מרקט מספקת מוצרים לכל סוגי העסקים והמוסדות: חברות ניקיון, מפיצים וסיטונאים, סופרמרקטים, מסעדות וקייטרינג, מרכזי ספורט, מוסדות רפואיים, מפעלי תעשייה, גופים ציבוריים ועיריות, אטליזים ועוד. אנחנו עסק B2B ולא מוכרים ללקוחות פרטיים."
        }
      },
      {
        "@type": "Question",
        "name": "מה זמן האספקה של הזמנות?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "זמן האספקה הסטנדרטי הוא 1-3 ימי עסקים מרגע אישור ההזמנה. באזור גוש דן (תל אביב, פתח תקווה, ראשון לציון, הרצליה, רמת גן, חולון) - לרוב תוך יום עסקים אחד. משלוחים מתבצעים לכל הארץ כולל חיפה, ירושלים, באר שבע, אשדוד ואילת."
        }
      },
      {
        "@type": "Question",
        "name": "אילו מוצרים וואי מרקט מספקת?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "וואי מרקט מציעה מעל 900 מוצרים ב-14 קטגוריות: חומרי ניקוי וכימיקלים מוסדיים, מוצרי נייר (נייר טואלט, מגבות, מפיות), כלים חד פעמיים ואירוח, אריזות מזון ו-Take Away, שקיות אשפה, טקסטיל ומטליות, קפה ושתייה למשרד, ציוד בטיחות ומיגון (PPE), ציוד משרדי, ציוד טכני, עטיפה ואריזה, עזרה ראשונה, טואלטיקה, וכלי עבודה וציוד משקי."
        }
      },
      {
        "@type": "Question",
        "name": "מה היתרונות של הזמנה מוואי מרקט לעומת ספקים אחרים?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "היתרונות העיקריים: 1) מחירים תחרותיים - עבודה ישירה מול יצרנים ויבואנים ללא מתווכים, 2) מינימום נמוך של 1,600 ₪ (לעומת 5,000-10,000 ₪ אצל מפיצים ארציים), 3) שירות אישי ישירות מול הבעלים - לא מוקד טלפוני, 4) פורטל הזמנות דיגיטלי 24/7, 5) משלוח מהיר 1-2 ימים בגוש דן, 6) תנאי תשלום גמישים (שוטף +30), 7) מגוון של 900+ מוצרים תחת קורת גג אחת."
        }
      },
      {
        "@type": "Question",
        "name": "כמה עולה משלוח של מוצרים מוואי מרקט?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "עלות המשלוח נעה בין 35 ל-270 ₪ בהתאם לאזור האספקה. משלוח חינם בהזמנות מעל 2,000 ₪. באזור גוש דן העלות הנמוכה ביותר, ולפריפריה (אילת, צפון) העלות גבוהה יותר. ניתן לקבל הצעת מחיר מדויקת כולל משלוח בטלפון או בוואטסאפ."
        }
      },
      {
        "@type": "Question",
        "name": "איך מזמינים מוואי מרקט?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ניתן להזמין ב-4 דרכים: 1) פורטל לקוחות דיגיטלי באתר - זמין 24/7 עם היסטוריית הזמנות ומחירון אישי, 2) וואטסאפ 054-9922492 - שולחים רשימה ומקבלים הצעת מחיר תוך שעות, 3) טלפון 03-7740400, 4) אימייל Pm@ymarket.co.il. לקוחות חדשים מוזמנים להירשם באתר ולקבל מחירון מותאם."
        }
      },
      {
        "@type": "Question",
        "name": "האם יש מחירון אישי לכל לקוח?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "כן, כל לקוח מקבל מחירון מותאם אישית בהתאם לסוג העסק, היקף הרכישות והתדירות. לקוחות קבועים נהנים ממחירים טובים יותר. המחירון האישי זמין בפורטל הלקוחות הדיגיטלי באתר."
        }
      },
      {
        "@type": "Question",
        "name": "אילו אמצעי תשלום מקובלים?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "מקבלים העברה בנקאית, כרטיס אשראי, צ'קים ותנאי שוטף +30 ללקוחות קבועים. חשבונית מס מופקת אוטומטית לכל הזמנה דרך מערכת רווחית (Rivhit)."
        }
      },
      {
        "@type": "Question",
        "name": "מה ההבדל בינכם לבין סיטונאי גדול כמו גלניר או סטאר פרופשיונל?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "שלושה הבדלים עיקריים: 1) מינימום הזמנה נמוך בהרבה - 1,600 ₪ לעומת 5,000-10,000 ₪, 2) שירות אישי ישירות מול הבעלים - לא מוקד טלפוני אנונימי, 3) גמישות וזמני תגובה מהירים - הזמנה בוואטסאפ ותשובה תוך שעות. המחירים תחרותיים בהחלט, ולעסקים קטנים ובינוניים אנחנו פתרון הרבה יותר נגיש."
        }
      },
      {
        "@type": "Question",
        "name": "מה עדיף - ספק אחד או כמה ספקים למוצרי צריכה?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ספק אחד לכל מוצרי הצריכה חוסך זמן, כסף ובלאגן. עם וואי מרקט אתם מקבלים 900+ מוצרים ב-14 קטגוריות בהזמנה אחת - חומרי ניקיון, נייר, חד פעמי, אריזות, בטיחות ועוד. חשבונית אחת, משלוח אחד, איש קשר אחד. לפי סקרים בענף, ריכוז ספקים מפחית עלויות רכש ב-15-25%."
        }
      },
      {
        "@type": "Question",
        "name": "האם אתם מתאימים לעסקים קטנים?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "בהחלט! מינימום ההזמנה של 1,600 ₪ נגיש גם לעסק קטן - מסעדה, משרד, מרפאה או חנות. ניתן לשלב מוצרים מכל הקטגוריות בהזמנה אחת כדי להגיע למינימום בקלות. רבים מלקוחותינו הם עסקים עם 5-20 עובדים שמזמינים פעם בחודש-חודשיים."
        }
      },
      {
        "@type": "Question",
        "name": "אילו חומרי ניקיון מוסדיים הכי נמכרים?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "המוצרים הנמכרים ביותר: 1) נוזל רצפות מרוכז 10 ליטר, 2) אקונומיקה (מי ג'אוול) 3.5% בג'ריקן 4 ליטר, 3) סבון ידיים נוזלי 5 ליטר, 4) נוזל כלים מוסדי 10 ליטר, 5) מסיר שומנים 5 ליטר. המוצרים המוסדיים בריכוז גבוה חוסכים 30-50% לעומת מוצרים קמעונאיים."
        }
      },
      {
        "@type": "Question",
        "name": "מה ההבדל בין נייר טואלט ג'מבו למיני ג'מבו?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "גליל ג'מבו: קוטר 26 ס\"מ, כ-350 מטר נייר - מתאים למקומות עם תנועה גבוהה (מרכזי קניות, מפעלים, בתי חולים). מיני ג'מבו: קוטר 19 ס\"מ, כ-150-200 מטר - מתאים למשרדים, מסעדות, בתי ספר. ההבדל העיקרי בתדירות ההחלפה: ג'מבו מחזיק פי 2-3 יותר זמן."
        }
      },
      {
        "@type": "Question",
        "name": "אילו כפפות חד פעמיות מתאימות למטבח מסעדה?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "למטבח מסעדה מומלצות כפפות ניטריל - עמידות לשומנים וחומרי ניקוי, ללא לטקס (חשוב לאלרגיות), אחיזה טובה גם כשרטוב. כפפות ויניל זולות יותר ומתאימות למגע קצר עם מזון. לפי תקנות משרד הבריאות, חובה ללבוש כפפות בכל מגע ישיר עם מזון מוכן."
        }
      },
      {
        "@type": "Question",
        "name": "כמה שקיות אשפה צריך משרד בחודש?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "משרד של 50 עובדים צריך כ-400-500 שקיות בחודש: כ-10 פחים אישיים (שקית 30L יומית = 220/חודש), 4-5 פחי מטבחון (60L = 110/חודש), ו-2-3 פחי חוץ (110L = 36/חודש). מומלץ להוסיף 10% כרזרבה. בוואי מרקט תמצאו שקיות HD, LD, גורילה וצבעוניות להפרדת פסולת."
        }
      },
      {
        "@type": "Question",
        "name": "האם יש אספקה לכל הארץ כולל אילת?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "כן, וואי מרקט מספק לכל רחבי הארץ - מאילת ועד חיפה והקריות. עיקר הפעילות באזור גוש דן (57% מהלקוחות) עם אספקה תוך 24-48 שעות. אספקה לפריפריה תוך 48-72 שעות. לאילת ולאזורים מרוחקים - עד 5 ימי עסקים."
        }
      },
      {
        "@type": "Question",
        "name": "מה כולל הקטלוג הדיגיטלי של וואי מרקט?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "הקטלוג באתר ymarket.co.il כולל מעל 900 מוצרים ב-14 קטגוריות עם תמונות, תיאורים מפורטים, ומחירים. לאחר הרשמה מקבלים גישה למחירון אישי, היסטוריית הזמנות, ואפשרות הזמנה ישירה. הקטלוג מתעדכן באופן שוטף עם מוצרים חדשים."
        }
      }
    ]
  };

  // === BreadcrumbList Schema (דינמי לפי עמוד) ===
  function generateBreadcrumbs() {
    const path = window.location.pathname;
    const breadcrumbs = [
      { name: "דף הבית", url: "https://ymarket.co.il/" }
    ];

    if (path.startsWith("/catalog")) {
      breadcrumbs.push({ name: "קטלוג מוצרים", url: "https://ymarket.co.il/catalog" });
      const cat = new URLSearchParams(window.location.search).get("cat");
      if (cat) {
        breadcrumbs.push({ name: decodeURIComponent(cat), url: window.location.href });
      }
    } else if (path.startsWith("/blog/")) {
      breadcrumbs.push({ name: "בלוג מקצועי", url: "https://ymarket.co.il/blog" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
    } else if (path.startsWith("/blog")) {
      breadcrumbs.push({ name: "בלוג מקצועי", url: "https://ymarket.co.il/blog" });
    } else if (path.startsWith("/category/")) {
      breadcrumbs.push({ name: "קטגוריות מוצרים", url: "https://ymarket.co.il/catalog" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
    } else if (path.startsWith("/products/")) {
      breadcrumbs.push({ name: "קטלוג מוצרים", url: "https://ymarket.co.il/catalog" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
    } else if (path.startsWith("/about")) {
      breadcrumbs.push({ name: "אודות וואי מרקט", url: "https://ymarket.co.il/about" });
    } else if (path.startsWith("/contact")) {
      breadcrumbs.push({ name: "צרו קשר", url: "https://ymarket.co.il/contact" });
    } else if (path.startsWith("/faq")) {
      breadcrumbs.push({ name: "שאלות נפוצות", url: "https://ymarket.co.il/faq" });
    } else if (path.startsWith("/glossary")) {
      breadcrumbs.push({ name: "מילון מונחים מקצועי", url: "https://ymarket.co.il/glossary" });
    } else if (path.startsWith("/legal/")) {
      breadcrumbs.push({ name: "מדיניות", url: "https://ymarket.co.il/legal/terms" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
    } else if (path.startsWith("/login") || path.startsWith("/register")) {
      breadcrumbs.push({ name: "פורטל לקוחות", url: "https://ymarket.co.il/login" });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };
  }

  // === ItemList Schema for categories page ===
  const categoryItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "קטגוריות מוצרים - וואי מרקט",
    "description": "כל קטגוריות המוצרים של וואי מרקט - ספק מוצרי צריכה שוטפת לעסקים ומוסדות",
    "numberOfItems": 14,
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "חומרי ניקוי וכימיקלים מוסדיים", "url": "https://ymarket.co.il/category/industrial-cleaning-supplies-wholesale/" },
      { "@type": "ListItem", "position": 2, "name": "מוצרי נייר וניגוב", "url": "https://ymarket.co.il/category/bulk-paper-towel-office-supplies/" },
      { "@type": "ListItem", "position": 3, "name": "כלים חד פעמיים ואירוח", "url": "https://ymarket.co.il/category/disposable-catering-food-service/" },
      { "@type": "ListItem", "position": 4, "name": "אריזות מזון ו-Take Away", "url": "https://ymarket.co.il/category/food-packaging-delivery-solutions/" },
      { "@type": "ListItem", "position": 5, "name": "שקיות ופתרונות אשפה", "url": "https://ymarket.co.il/category/heavy-duty-garbage-bags-wholesale/" },
      { "@type": "ListItem", "position": 6, "name": "טקסטיל, מטליות וסחבות", "url": "https://ymarket.co.il/category/professional-cleaning-cloths-microfiber/" },
      { "@type": "ListItem", "position": 7, "name": "קפה, שתייה וכיבוד למשרד", "url": "https://ymarket.co.il/category/office-coffee-breakroom-supplies/" },
      { "@type": "ListItem", "position": 8, "name": "בטיחות ומיגון אישי (PPE)", "url": "https://ymarket.co.il/category/safety-ppe-equipment-for-business/" },
      { "@type": "ListItem", "position": 9, "name": "ציוד משרדי וכללי", "url": "https://ymarket.co.il/category/office-supplies-wholesale-business/" },
      { "@type": "ListItem", "position": 10, "name": "ציוד טכני ואחזקה", "url": "https://ymarket.co.il/category/maintenance-technical-equipment-wholesale/" },
      { "@type": "ListItem", "position": 11, "name": "עטיפה, אריזה ולוגיסטיקה", "url": "https://ymarket.co.il/category/warehouse-packaging-supplies-wholesale/" },
      { "@type": "ListItem", "position": 12, "name": "עזרה ראשונה וציוד רפואי", "url": "https://ymarket.co.il/category/first-aid-medical-equipment-business/" },
      { "@type": "ListItem", "position": 13, "name": "טואלטיקה וטיפוח אישי", "url": "https://ymarket.co.il/category/personal-hygiene-products-wholesale/" },
      { "@type": "ListItem", "position": 14, "name": "כלי עבודה וציוד משקי", "url": "https://ymarket.co.il/category/institutional-cleaning-tools-equipment/" }
    ]
  };

  // === Blog Articles ItemList ===
  const blogItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "מאמרים מקצועיים - וואי מרקט",
    "description": "מדריכים ומאמרים מקצועיים בנושאי אספקה מוסדית, חומרי ניקיון, מוצרי נייר, כלים חד פעמיים ועוד",
    "numberOfItems": 16,
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "חומרי ניקיון סיטונאי - מחירים, ספקים וטיפים", "url": "https://ymarket.co.il/blog/wholesale-cleaning-products" },
      { "@type": "ListItem", "position": 2, "name": "שקיות אשפה מוסדיות - מדריך גדלים וסוגים", "url": "https://ymarket.co.il/blog/institutional-garbage-bags" },
      { "@type": "ListItem", "position": 3, "name": "ציוד חד פעמי למסעדות - רשימה מלאה", "url": "https://ymarket.co.il/blog/restaurant-disposable-equipment" },
      { "@type": "ListItem", "position": 4, "name": "ציוד ניקיון למוסדות - המדריך המקצועי", "url": "https://ymarket.co.il/blog/institutional-cleaning-equipment-guide" },
      { "@type": "ListItem", "position": 5, "name": "נייר טואלט מוסדי - סוגים ומחירים", "url": "https://ymarket.co.il/blog/institutional-toilet-paper-guide" },
      { "@type": "ListItem", "position": 6, "name": "אספקה למסעדות - המדריך המלא", "url": "https://ymarket.co.il/blog/supplies-for-restaurants" },
      { "@type": "ListItem", "position": 7, "name": "אספקה לחברות ניקיון", "url": "https://ymarket.co.il/blog/supplies-for-cleaning-companies" },
      { "@type": "ListItem", "position": 8, "name": "מוצרי צריכה למשרדים", "url": "https://ymarket.co.il/blog/supplies-for-offices" },
      { "@type": "ListItem", "position": 9, "name": "המדריך המלא לאספקה מוסדית 2026", "url": "https://ymarket.co.il/blog/complete-guide-institutional-supplies" },
      { "@type": "ListItem", "position": 10, "name": "חומרי ניקיון לחברות ניקיון - רכש חכם", "url": "https://ymarket.co.il/blog/cleaning-products-for-cleaning-companies" },
      { "@type": "ListItem", "position": 11, "name": "כלים חד פעמיים לעסקים - המדריך המלא", "url": "https://ymarket.co.il/blog/disposable-items-for-businesses" },
      { "@type": "ListItem", "position": 12, "name": "אריזות Take Away - המדריך לעסקי מזון", "url": "https://ymarket.co.il/blog/takeaway-packaging-guide" },
      { "@type": "ListItem", "position": 13, "name": "איך לבחור ספק מוצרי צריכה שוטפת", "url": "https://ymarket.co.il/blog/how-to-choose-supplier" },
      { "@type": "ListItem", "position": 14, "name": "מה להזמין מספק - לפי סוג עסק", "url": "https://ymarket.co.il/blog/what-to-order-by-business-type" },
      { "@type": "ListItem", "position": 15, "name": "חיסכון במוצרי נייר לעסקים", "url": "https://ymarket.co.il/blog/save-paper-costs" },
      { "@type": "ListItem", "position": 16, "name": "מדריך רכש חכם למוסדות", "url": "https://ymarket.co.il/blog/smart-procurement-guide" }
    ]
  };

  // === הזרקת Schema לדף ===
  function injectSchema(schema, id) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // === אתחול ===
  function init() {
    const path = window.location.pathname;

    // Main @graph (Organization + WebSite) - בכל העמודים
    injectSchema(mainGraphSchema, "schema-main-graph");

    // FAQPage - דף הבית, FAQ, about
    if (path === "/" || path === "/index.html" || path === "/index" ||
        path.startsWith("/faq") || path.startsWith("/about")) {
      injectSchema(faqSchema, "schema-faq");
    }

    // BreadcrumbList - בכל העמודים חוץ מדף הבית
    if (path !== "/" && path !== "/index.html" && path !== "/index") {
      injectSchema(generateBreadcrumbs(), "schema-breadcrumbs");
    }

    // ItemList - קטלוג / קטגוריות
    if (path.startsWith("/catalog") || path === "/" || path === "/index.html") {
      injectSchema(categoryItemListSchema, "schema-category-list");
    }

    // Blog ItemList - דף בלוג ראשי
    if (path === "/blog" || path === "/blog/" || path === "/blog/index.html") {
      injectSchema(blogItemListSchema, "schema-blog-list");
    }
  }

  // הפעלה לאחר טעינת DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
