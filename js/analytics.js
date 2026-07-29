/* ===========================================
   Y Market - Analytics
   GA4 + Clarity + Facebook Pixel + Google Ads
   =========================================== */

(function() {
  'use strict';

  // ---- Configuration ----
  const GA4_ID = 'G-ZSWL6L8MC7';
  const CLARITY_ID = 'vsqkjq40jp';
  const FB_PIXEL_ID = '1465208441826085';
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

  // ---- Facebook Pixel Commerce Events ----
  if (window.YMarketAnalytics) {
    window.YMarketAnalytics.fbViewContent = function(product) {
      if (window.fbq) {
        fbq('track', 'ViewContent', {
          content_ids: ['YM_' + product.id],
          content_name: product.name,
          content_type: 'product',
          value: product.price || 0,
          currency: 'ILS'
        });
      }
    };

    window.YMarketAnalytics.fbAddToCart = function(product) {
      if (window.fbq) {
        fbq('track', 'AddToCart', {
          content_ids: ['YM_' + product.id],
          content_name: product.name,
          content_type: 'product',
          value: product.price || 0,
          currency: 'ILS',
          contents: [{ id: 'YM_' + product.id, quantity: product.quantity || 1 }]
        });
      }
    };

    window.YMarketAnalytics.fbSearch = function(searchTerm) {
      if (window.fbq) {
        fbq('track', 'Search', { search_string: searchTerm });
      }
    };

    window.YMarketAnalytics.fbLead = function(method) {
      if (window.fbq) {
        fbq('track', 'Lead', { content_name: method });
      }
    };

    window.YMarketAnalytics.fbInitiateCheckout = function(items, total) {
      if (window.fbq) {
        fbq('track', 'InitiateCheckout', {
          content_ids: items.map(function(i) { return 'YM_' + i.id; }),
          num_items: items.length,
          value: total || 0,
          currency: 'ILS'
        });
      }
    };
  }

  // ---- Microsoft Clarity ----
  if (CLARITY_ID) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CLARITY_ID);
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

  /* =========================================================================
     FIRST-PARTY LAYER — "The Analyst"
     Mirrors behavioural events into OUR database (app.ymarket.co.il), row by
     row, so every movement between pages — and where it came from — is ours,
     joinable to customers/leads/orders. GA4/Meta above stay untouched.
     ========================================================================= */
  (function () {
    var COLLECT_URL = 'https://app.ymarket.co.il/api/analytics/collect';
    var SESSION_IDLE_MS = 30 * 60 * 1000; // new session after 30m inactivity
    var ss = window.sessionStorage, ls = window.localStorage;

    function uuid() {
      try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
      return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    function get(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
    function set(store, k, v) { try { store.setItem(k, v); } catch (e) {} }

    // durable visitor id (across sessions) + rolling session id (idle-reset)
    var visitorId = get(ls, 'ym_vid') || uuid(); set(ls, 'ym_vid', visitorId);
    var last = parseInt(get(ss, 'ym_sid_ts') || '0', 10);
    var sessionId = get(ss, 'ym_sid');
    var isNewSession = false;
    if (!sessionId || !last || (Date.now() - last) > SESSION_IDLE_MS) {
      sessionId = uuid(); isNewSession = true; set(ss, 'ym_sid', sessionId);
    }
    set(ss, 'ym_sid_ts', String(Date.now()));

    // acquisition — captured once on the session's landing hit, echoed after
    var qp = new URLSearchParams(location.search);
    var utm = {
      source: qp.get('utm_source'), medium: qp.get('utm_medium'),
      campaign: qp.get('utm_campaign'), term: qp.get('utm_term'), content: qp.get('utm_content')
    };
    if (isNewSession) {
      set(ss, 'ym_landing', location.pathname);
      set(ss, 'ym_utm', JSON.stringify(utm));
      if (document.referrer && document.referrer.indexOf(location.host) === -1) {
        set(ss, 'ym_ext_ref', document.referrer);
      }
    } else {
      try { utm = JSON.parse(get(ss, 'ym_utm') || '{}'); } catch (e) {}
    }
    var landing = get(ss, 'ym_landing') || location.pathname;
    var device = (function () {
      var w = window.innerWidth || 1024;
      if (w < 768) return 'mobile';
      if (w < 1024) return 'tablet';
      return 'desktop';
    })();

    // ---- batching + reliable delivery ----
    var queue = [];
    function flush(sync) {
      if (!queue.length) return;
      var batch = queue.splice(0, queue.length);
      var payload = JSON.stringify({
        sessionId: sessionId, visitorId: visitorId,
        landing: landing, device: device, utm: utm, events: batch
      });
      var sent = false;
      try {
        if (navigator.sendBeacon) {
          sent = navigator.sendBeacon(COLLECT_URL, new Blob([payload], { type: 'text/plain' }));
        }
      } catch (e) {}
      if (!sent) {
        try {
          fetch(COLLECT_URL, { method: 'POST', body: payload, keepalive: true, mode: 'cors',
            headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
        } catch (e) {}
      }
    }
    function track(type, props) {
      props = props || {};
      queue.push({
        eventId: uuid(), type: type, ts: Date.now(),
        path: location.pathname, title: document.title,
        from: props.from, referrer: get(ss, 'ym_ext_ref') || null,
        itemId: props.itemId, orderId: props.orderId,
        value: props.value, quantity: props.quantity, meta: props.meta || null
      });
      // page/exit events go out immediately; commerce events micro-batch
      if (type === 'page_view' || type === 'session_start' || type === 'order_placed') flush();
    }

    // expose so page scripts (checkout, catalog) can emit precise events
    window.YMarketAnalyst = {
      track: track,
      productView: function (p) { track('product_view', { itemId: p && p.id, value: p && p.price }); },
      addToCart: function (p) { track('add_to_cart', { itemId: p && p.id, value: p && p.price, quantity: p && p.quantity }); },
      removeFromCart: function (p) { track('remove_from_cart', { itemId: p && p.id, quantity: p && p.quantity }); },
      beginCheckout: function (total, n) { track('begin_checkout', { value: total, quantity: n }); },
      leadSubmit: function (method) { track('lead_submit', { meta: { method: method } }); },
      orderPlaced: function (orderId, total) { track('order_placed', { orderId: orderId, value: total }); },
      search: function (q) { track('search', { meta: { q: (q || '').slice(0, 120) } }); }
    };

    // auto-wire the existing GA/Meta wrappers so page code that already calls
    // YMarketAnalytics also feeds first-party — zero extra work on the pages.
    if (window.YMarketAnalytics) {
      var A = window.YMarketAnalytics;
      var wrap = function (name, fn) { var o = A[name]; A[name] = function () { try { fn.apply(null, arguments); } catch (e) {} if (o) return o.apply(A, arguments); }; };
      wrap('trackAddToCart', function (p) { window.YMarketAnalyst.addToCart(p); });
      wrap('trackViewItem', function (p) { window.YMarketAnalyst.productView(p); });
      wrap('trackSearch', function (q) { window.YMarketAnalyst.search(q); });
      wrap('trackContact', function (m) { window.YMarketAnalyst.leadSubmit(m); });
    }

    // page-to-page flow: remember the last path we were on
    var fromPath = get(ss, 'ym_last_path') || null;
    set(ss, 'ym_last_path', location.pathname);

    if (isNewSession) track('session_start', {});
    track('page_view', { from: fromPath });

    // scroll depth (fires once at 75%) — engagement signal
    var deep = false;
    window.addEventListener('scroll', function () {
      if (deep) return;
      var h = document.documentElement;
      var pct = (h.scrollTop + window.innerHeight) / (h.scrollHeight || 1);
      if (pct >= 0.75) { deep = true; track('scroll_depth', { meta: { pct: 75 } }); }
    }, { passive: true });

    // flush on the way out — sendBeacon survives unload
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
    window.addEventListener('pagehide', function () { flush(true); });
    setInterval(flush, 10000); // safety net for long-lived tabs
  })();

})();
