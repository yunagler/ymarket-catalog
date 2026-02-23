/* ===========================================
   Y Market - Analytics
   GA4 + Facebook Pixel + Google Ads
   =========================================== */

(function() {
  'use strict';

  // ---- Configuration ----
  // Replace these with your actual IDs
  const GA4_ID = ''; // e.g. 'G-XXXXXXXXXX'
  const FB_PIXEL_ID = ''; // e.g. '1234567890'
  const GADS_ID = ''; // e.g. 'AW-XXXXXXXXX'

  // ---- Google Analytics 4 ----
  if (GA4_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA4_ID);

    // Expose for custom events
    window.YMarketAnalytics = {
      trackEvent: function(eventName, params) {
        gtag('event', eventName, params);
      },
      trackAddToCart: function(product) {
        gtag('event', 'add_to_cart', {
          currency: 'ILS',
          value: product.price || 0,
          items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price || 0,
            quantity: product.quantity || 1
          }]
        });
      },
      trackViewItem: function(product) {
        gtag('event', 'view_item', {
          currency: 'ILS',
          value: product.price || 0,
          items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price || 0
          }]
        });
      },
      trackSearch: function(searchTerm) {
        gtag('event', 'search', { search_term: searchTerm });
      },
      trackContact: function(method) {
        gtag('event', 'generate_lead', { method: method });
      }
    };
  }

  // ---- Facebook Pixel ----
  if (FB_PIXEL_ID) {
    !function(f,b,e,v,n,t,s) {
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', FB_PIXEL_ID);
    fbq('track', 'PageView');
  }

  // ---- Google Ads ----
  if (GADS_ID) {
    const gadsScript = document.createElement('script');
    gadsScript.async = true;
    gadsScript.src = `https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`;
    document.head.appendChild(gadsScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('config', GADS_ID);
  }

  // ---- Track WhatsApp Clicks ----
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href*="wa.me"]');
    if (link) {
      if (window.YMarketAnalytics) {
        window.YMarketAnalytics.trackContact('whatsapp');
      }
      if (window.fbq) {
        fbq('track', 'Contact', { method: 'whatsapp' });
      }
    }
  });

  // ---- Track Phone Clicks ----
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="tel:"]');
    if (link) {
      if (window.YMarketAnalytics) {
        window.YMarketAnalytics.trackContact('phone');
      }
      if (window.fbq) {
        fbq('track', 'Contact', { method: 'phone' });
      }
    }
  });

})();
