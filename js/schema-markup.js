/**
 * Schema Markup - וואי מרקט
 * Organization, LocalBusiness, FAQPage, BreadcrumbList
 * מעודכן: 2026-03-10
 */

(function() {
  'use strict';

  // === Organization Schema ===
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://ymarket.co.il/#organization",
    "name": "וואי מרקט - Y Market",
    "alternateName": ["Y Market", "נגלר סחר והפצה", "YMarket"],
    "url": "https://ymarket.co.il",
    "logo": {
      "@type": "ImageObject",
      "url": "https://ymarket.co.il/images/logo/logo-dark.png",
      "width": 200,
      "height": 60
    },
    "image": "https://ymarket.co.il/images/logo/logo-dark.png",
    "description": "וואי מרקט - סחר, שיווק והפצה של מוצרי צריכה שוטפת לעסקים ומוסדות. אספקה חכמה ומדויקת למוסדות.",
    "telephone": "+972-3-7740400",
    "email": "info@ymarket.co.il",
    "foundingDate": "2009",
    "founder": {
      "@type": "Person",
      "name": "יובל נגלר"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "פתח תקווה",
      "addressRegion": "מרכז",
      "addressCountry": "IL"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Israel"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+972-3-7740400",
        "contactType": "sales",
        "availableLanguage": ["Hebrew", "English"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "+972-54-9922492",
        "contactType": "customer service",
        "availableLanguage": ["Hebrew"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/YMarket.co.il",
      "https://www.instagram.com/ymarket.co.il"
    ],
    "knowsAbout": [
      "אספקה לעסקים",
      "ציוד ניקיון סיטונאי",
      "חד פעמי למוסדות",
      "מוצרי ניקיון מוסדיים",
      "נייר טואלט מוסדי",
      "שקיות אשפה מוסדיות",
      "כלים חד פעמיים לעסקים"
    ]
  };

  // === LocalBusiness Schema ===
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://ymarket.co.il/#localbusiness",
    "name": "וואי מרקט - אספקה למוסדות ועסקים",
    "alternateName": "Y Market",
    "image": "https://ymarket.co.il/images/logo/logo-dark.png",
    "url": "https://ymarket.co.il",
    "telephone": "+972-3-7740400",
    "email": "info@ymarket.co.il",
    "priceRange": "₪₪",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "אזור תעשייה",
      "addressLocality": "פתח תקווה",
      "addressRegion": "מרכז",
      "postalCode": "4951341",
      "addressCountry": "IL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 32.0853,
      "longitude": 34.8878
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],
    "areaServed": [
      { "@type": "City", "name": "תל אביב" },
      { "@type": "City", "name": "פתח תקווה" },
      { "@type": "City", "name": "ראשון לציון" },
      { "@type": "City", "name": "הרצליה" },
      { "@type": "City", "name": "רמת גן" },
      { "@type": "City", "name": "חולון" },
      { "@type": "City", "name": "חיפה" },
      { "@type": "City", "name": "ירושלים" },
      { "@type": "City", "name": "באר שבע" },
      { "@type": "City", "name": "אשדוד" },
      { "@type": "City", "name": "אילת" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "קטלוג מוצרים",
      "itemListElement": [
        { "@type": "OfferCatalog", "name": "מוצרי ניקיון מוסדיים" },
        { "@type": "OfferCatalog", "name": "מוצרי נייר תעשייתי" },
        { "@type": "OfferCatalog", "name": "כלים חד פעמיים" },
        { "@type": "OfferCatalog", "name": "מוצרי מזון יבש" },
        { "@type": "OfferCatalog", "name": "ציוד בטיחות ומיגון" },
        { "@type": "OfferCatalog", "name": "טואלטיקה וטיפוח" }
      ]
    },
    "foundingDate": "2009"
  };

  // === FAQPage Schema (5 שאלות בעברית) ===
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
          "text": "וואי מרקט מספקת מוצרים לכל סוגי העסקים והמוסדות: חברות ניקיון, מפיצים וסיטונאים, סופרמרקטים, מסעדות וקייטרינג, מרכזי ספורט, מוסדות רפואיים, מפעלי תעשייה, גופים ציבוריים ועיריות, אטליזים ועוד. אנחנו לא מוכרים ללקוחות פרטיים."
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
          "text": "וואי מרקט מציעה מעל 1,500 מוצרים בקטגוריות: מוצרי ניקיון מוסדיים (חומרי ניקוי, מטליות, שקיות אשפה), מוצרי נייר (נייר טואלט מוסדי, מגבות נייר, מפיות), כלים חד פעמיים (כוסות, צלחות, סכו\"ם, אריזות מזון), מוצרי מזון יבש (שימורים, תבלינים, שמנים), ציוד בטיחות ומיגון אישי, וטואלטיקה."
        }
      },
      {
        "@type": "Question",
        "name": "מה היתרונות של הזמנה מוואי מרקט לעומת ספקים אחרים?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "היתרונות העיקריים: מחירים תחרותיים ללא מתווכים (ישירות מיבואנים ויצרנים), מגוון של 1,500+ מוצרים תחת קורת גג אחת, יועץ מכירות ייעודי לכל לקוח, פורטל הזמנות דיגיטלי 24/7 עם מעקב והיסטוריה, ו-17+ שנות ניסיון בשוק האספקה המוסדית בישראל."
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
      breadcrumbs.push({ name: "בלוג", url: "https://ymarket.co.il/blog" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
    } else if (path.startsWith("/blog")) {
      breadcrumbs.push({ name: "בלוג", url: "https://ymarket.co.il/blog" });
    } else if (path.startsWith("/category/")) {
      breadcrumbs.push({ name: "קטגוריות", url: "https://ymarket.co.il/catalog" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
    } else if (path.startsWith("/about")) {
      breadcrumbs.push({ name: "אודות", url: "https://ymarket.co.il/about" });
    } else if (path.startsWith("/contact")) {
      breadcrumbs.push({ name: "צרו קשר", url: "https://ymarket.co.il/contact" });
    } else if (path.startsWith("/faq")) {
      breadcrumbs.push({ name: "שאלות נפוצות", url: "https://ymarket.co.il/faq" });
    } else if (path.startsWith("/legal/")) {
      breadcrumbs.push({ name: "מדיניות", url: "https://ymarket.co.il/legal/terms" });
      const title = document.querySelector("h1");
      if (title) {
        breadcrumbs.push({ name: title.textContent.trim(), url: window.location.href });
      }
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

    // Organization - בכל העמודים
    injectSchema(organizationSchema, "schema-organization");

    // LocalBusiness - דף הבית, אודות, צרו קשר
    if (path === "/" || path === "/index.html" || path === "/index" ||
        path.startsWith("/about") || path.startsWith("/contact")) {
      injectSchema(localBusinessSchema, "schema-localbusiness");
    }

    // FAQPage - דף FAQ ודף הבית
    if (path === "/" || path === "/index.html" || path === "/index" ||
        path.startsWith("/faq")) {
      injectSchema(faqSchema, "schema-faq");
    }

    // BreadcrumbList - בכל העמודים חוץ מדף הבית
    if (path !== "/" && path !== "/index.html" && path !== "/index") {
      injectSchema(generateBreadcrumbs(), "schema-breadcrumbs");
    }
  }

  // הפעלה לאחר טעינת DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
