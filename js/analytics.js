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
  // Not on local previews/screenshot runs — 127.0.0.1 page views were landing in the
  // production pixel and skewing its funnel.
  const IS_LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
  if (FB_PIXEL_ID && !IS_LOCAL) {
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
  // content_ids = String(Item.id) — the same g:id the Meta catalog feed uses
  // (crm-app/scripts/generate-meta-feed.mjs), so retargeting matches products.
  if (window.YMarketAnalytics) {
    window.YMarketAnalytics.fbViewContent = function(product) {
      if (window.fbq) {
        fbq('track', 'ViewContent', {
          content_ids: [String(product.id)],
          content_name: product.name,
          content_type: 'product',
          value: product.price || 0,
          currency: 'ILS'
        });
      }
    };

    var fbAtcAt = {};  // product id -> when fbAddToCart last fired for it
    window.YMarketAnalytics.fbAddToCart = function(product) {
      fbAtcAt[String(product.id)] = Date.now();
      if (window.fbq) {
        fbq('track', 'AddToCart', {
          content_ids: [String(product.id)],
          content_name: product.name,
          content_type: 'product',
          value: product.price || 0,
          currency: 'ILS',
          contents: [{ id: String(product.id), quantity: product.quantity || 1 }]
        });
      }
    };

    // Product pages only call the GA add_to_cart, so Meta never saw those carts. Bridge
    // it: after the click handler finishes, send the Meta event unless the caller
    // already sent it (catalog/carousels/cart call both, in either order).
    var gaAddToCart = window.YMarketAnalytics.trackAddToCart;
    if (gaAddToCart) {
      window.YMarketAnalytics.trackAddToCart = function(product) {
        gaAddToCart(product);
        setTimeout(function() {
          if (!product || product.id == null) return;
          if (Date.now() - (fbAtcAt[String(product.id)] || 0) > 1000) window.YMarketAnalytics.fbAddToCart(product);
        }, 0);
      };
    }

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
          content_ids: items.map(function(i) { return String(i.id); }),
          num_items: items.length,
          value: total || 0,
          currency: 'ILS'
        });
      }
    };

    // Purchase — eventID must equal the meta_event_id sent with the order, so
    // Meta dedupes this browser event against the server (CAPI) one.
    window.YMarketAnalytics.fbPurchase = function(order) {
      if (window.fbq && order) {
        fbq('track', 'Purchase', {
          content_ids: (order.items || []).map(function(i) { return String(i.id); }),
          contents: (order.items || []).map(function(i) { return { id: String(i.id), quantity: i.quantity || 1 }; }),
          content_type: 'product',
          num_items: (order.items || []).length,
          value: order.value || 0,
          currency: 'ILS'
        }, order.eventId ? { eventID: order.eventId } : undefined);
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
    // a tagged link mid-session (e.g. an ad clicked again) is new acquisition too
    if (isNewSession || utm.source) {
      set(ss, 'ym_landing', location.pathname);
      set(ss, 'ym_utm', JSON.stringify(utm));
      if (document.referrer && document.referrer.indexOf(location.host) === -1) {
        set(ss, 'ym_ext_ref', document.referrer);
      }
    } else {
      try { utm = JSON.parse(get(ss, 'ym_utm') || '{}'); } catch (e) {}
    }

    // Meta click id — kept 90 days (Meta's attribution window) in the _fbc
    // format fb.1.<ms>.<fbclid>, and sent with the order for CAPI matching.
    var fbclid = qp.get('fbclid');
    if (fbclid) {
      set(ls, 'ym_fbc', JSON.stringify({ v: 'fb.1.' + Date.now() + '.' + fbclid, id: fbclid, ts: Date.now() }));
    }
    function cookie(name) {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    }
    function attribution() {
      var fbc = null, fbcId = null;
      try {
        var s = JSON.parse(get(ls, 'ym_fbc') || 'null');
        if (s && Date.now() - s.ts < 90 * 864e5) { fbc = s.v; fbcId = s.id; }
      } catch (e) {}
      return {
        utm_source: utm.source || null, utm_medium: utm.medium || null,
        utm_campaign: utm.campaign || null, utm_content: utm.content || null,
        utm_term: utm.term || null,
        fbclid: fbcId, fbc: cookie('_fbc') || fbc, fbp: cookie('_fbp'),
        landing: get(ss, 'ym_landing') || location.pathname,
        eventId: uuid()
      };
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
      getAttribution: attribution,
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
/* =========================================================================
   WHO + TRIPWIRE — appended verbatim to analytics.js and analytics.min.js.
   (1) ties this browser to a CRM lead/customer and to its Clarity recording;
   (2) reports a store page whose cards are covered, clicks that do nothing,
       repeated clicks that do nothing, and script errors — so a broken button
       raises an alert on the first visitor instead of after a day of losses.
   Reads ym_vid / ym_sid from storage and sends through YMarketAnalyst.track.
   ========================================================================= */
(function () {
  var A = window.YMarketAnalyst;
  if (!A || !A.track || window.__ymWho) return;
  window.__ymWho = 1;
  var ls = window.localStorage, ss = window.sessionStorage;
  function get(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function set(s, k, v) { try { s.setItem(k, v); } catch (e) {} }
  function cookie(n) { var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; }
  // _clck = "<user>^2^..." , _clsk = "<session>^<ts>^..." (older builds use "|")
  function clarity() {
    var u = cookie('_clck'), s = cookie('_clsk');
    return { u: u ? u.split(/[\^|]/)[0] : null, s: s ? s.split(/[\^|]/)[0] : null };
  }
  function ctx() { return { visitorId: get(ls, 'ym_vid'), sessionId: get(ss, 'ym_sid'), clarity: clarity() }; }

  // forms and checkout send this with their own request, so the server can link the visit itself
  var attr = A.getAttribution;
  A.getAttribution = function () { var a = attr ? attr() : {}; var c = ctx(); a.visitorId = c.visitorId; a.sessionId = c.sessionId; a.clarity = c.clarity; return a; };
  A.context = ctx;

  // ---- a personal link we sent (?ymc=…, CRM lib/web-link.ts): known from the first page ----
  (function () {
    var m = /[?&]ymc=([^&#]+)/.exec(location.search);
    if (!m) return;
    var t = m[1];
    try { t = decodeURIComponent(t); } catch (e) {}
    // out of the address bar at once (before the ad/analytics tags read the URL):
    // a link copied from the page must not carry someone's token
    try {
      var u = new URL(location.href); u.searchParams.delete('ymc');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    if (!/^[cl]\d{1,9}\.[A-Za-z0-9_-]{12}$/.test(t) || !window.fetch) return;
    // text/plain: no CORS preflight; the server checks the signature
    fetch('https://app.ymarket.co.il/api/analytics/link', { method: 'POST', mode: 'cors', keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ t: t, web: ctx() }) })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (d) { if (d && d.webRef) A.identify(d.webRef, 'crm_link'); })
      .catch(function () {});
  })();

  // ---- identity: label the Clarity recording while this browser is known ----
  function who() { try { return JSON.parse(get(ls, 'ym_who') || 'null'); } catch (e) { return null; } }
  function tag(w) {
    if (!w || !w.ref || typeof window.clarity !== 'function') return;
    try {
      window.clarity('identify', w.ref, get(ss, 'ym_sid') || undefined, undefined, w.label || w.ref);
      window.clarity('set', 'crm', w.ref);
      if (w.kind) window.clarity('set', 'crm_type', w.kind);
    } catch (e) {}
  }
  // w = { ref: 'lead-6094', kind: 'lead', label: 'ליד 6094 · שם העסק' } — returned by the CRM
  A.identify = function (w, via) {
    if (!w || !w.ref) return;
    var v = { ref: String(w.ref).slice(0, 40), kind: w.kind || null, label: String(w.label || w.ref).slice(0, 80) };
    set(ls, 'ym_who', JSON.stringify(v));
    tag(v);
    A.track('identify', { meta: { ref: v.ref, kind: v.kind, via: via || null, clarity: clarity() } });
  };
  tag(who());
  // a browser the CRM linked without a form (the WhatsApp ref code): ask once a session who it is
  if (!who() && get(ls, 'ym_wref') && !get(ss, 'ym_whoami') && window.fetch) {
    set(ss, 'ym_whoami', '1');
    var vid = get(ls, 'ym_vid');
    if (vid) fetch('https://app.ymarket.co.il/api/analytics/whoami?v=' + encodeURIComponent(vid), { mode: 'cors' })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (d) { if (d && d.webRef) A.identify(d.webRef, 'whoami'); })
      .catch(function () {});
  }

  // once per session, as soon as Clarity has set its cookies: lets the CRM open this visit's recording
  (function sendIds(n) {
    if (get(ss, 'ym_clr')) return;
    var c = clarity();
    if (c.u && c.s) { set(ss, 'ym_clr', '1'); A.track('clarity_ids', { meta: { clarity: c } }); return; }
    if (n < 10) setTimeout(function () { sendIds(n + 1); }, 1500);
  })(0);

  // ---- WhatsApp: a short ref in the prefilled text ties the chat that arrives to this visit ----
  function waRef() {
    var r = get(ls, 'ym_wref');
    if (!r || !/^[A-Z2-9]{5}$/.test(r)) {
      var abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; r = '';
      for (var i = 0; i < 5; i++) r += abc.charAt(Math.floor(Math.random() * abc.length));
      set(ls, 'ym_wref', r);
    }
    return r;
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (!a) return;
    try {
      var u = new URL(a.href, location.href), ref = waRef(), t = u.searchParams.get('text') || 'היי';
      if (t.indexOf('(פנייה ') === -1) { u.searchParams.set('text', t + ' (פנייה ' + ref + ')'); a.href = u.toString(); }
      A.track('whatsapp_click', { meta: { ref: ref, clarity: clarity() } });
    } catch (err) {}
  }, true);

  // ---- tripwire ----
  function desc(el) {
    if (!el || !el.tagName) return null;
    var s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    var c = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (c.length) s += '.' + c.join('.');
    return s.slice(0, 80);
  }
  var sent = {}, budget = 12;
  function report(type, key, meta) {
    if (budget <= 0 || sent[type + key]) return;
    sent[type + key] = 1; budget--;
    meta.clarity = clarity(); meta.vw = window.innerWidth; meta.vh = window.innerHeight; meta.host = location.host;
    A.track(type, { meta: meta });
  }

  // (a) a store/product page whose buttons are covered by something. Checked 2s after load
  // and again when scrolling stops (the first cards are often below the fold) — until two
  // or more buttons could be tested, at most 6 tries.
  var coverTries = 0, coverDone = false, coverTimer = null;
  function coverCheck() {
    if (coverDone || coverTries >= 6) return;
    coverTries++;
    var sel = '.v4-item__img, .v4-q--plus, button.v4-item__pick, .vqty-inc, .vrow__pick, #addAllBtn, .add-to-cart';
    var els = [].slice.call(document.querySelectorAll(sel)), vh = window.innerHeight, tried = 0, covered = 0, by = null;
    for (var i = 0; i < els.length && tried < 4; i++) {
      var r = els[i].getBoundingClientRect(), cy = r.top + r.height / 2;
      if (!r.width || cy < 140 || cy > vh - 120) continue; // clear of the sticky header and the cart bar
      var hit = document.elementFromPoint(r.left + r.width / 2, cy);
      if (!hit) continue;
      tried++;
      if (hit.closest && hit.closest('.cookie-banner, .whatsapp-float, .v4-cartbar, .toast, header')) continue; // known, visible layers
      if (hit !== els[i] && !els[i].contains(hit) && !hit.contains(els[i])) { covered++; by = by || hit; }
    }
    if (tried < 2) return;
    coverDone = true;
    if (covered === tried) report('ui_blocked', '', { by: desc(by), tried: tried, target: desc(els[0]) });
  }
  // this script runs in <head> on most pages — decide once the page is there
  function coverArm() {
    if (!document.querySelector('.v4-item, .vrow, #addAllBtn, .add-to-cart')) return;
    setTimeout(coverCheck, 2000);
    window.addEventListener('scroll', function () {
      if (coverDone) return;
      clearTimeout(coverTimer); coverTimer = setTimeout(coverCheck, 700);
    }, { passive: true });
  }
  if (document.readyState === 'complete') coverArm();
  else window.addEventListener('load', coverArm);

  // (b) clicks with no response: no DOM change, no navigation, no scroll, no focus move within 900ms
  var lastMut = 0, lastScroll = 0, recent = [];
  try { new MutationObserver(function () { lastMut = Date.now(); }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true }); } catch (e) {}
  window.addEventListener('scroll', function () { lastScroll = Date.now(); }, { passive: true, capture: true });
  var INTERACTIVE = 'a[href], button, [role="button"], [data-open], [data-close], label, summary, select, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], [onclick]';
  document.addEventListener('click', function (e) {
    if (!e.isTrusted) return;
    var t = e.target, at = Date.now(), focus0 = document.activeElement, url0 = location.href;
    var ctl = t && t.closest ? t.closest(INTERACTIVE) : null;
    if (ctl && ctl.tagName === 'A') {
      var h = ctl.getAttribute('href') || '';
      // links that leave the page or open elsewhere answer outside this document
      if (ctl.target === '_blank' || /^(tel:|mailto:|https?:\/\/(?!(www\.)?ymarket\.co\.il))/.test(h)) return;
    }
    setTimeout(function () {
      if (document.visibilityState === 'hidden' || location.href !== url0) return;
      if (lastMut >= at || lastScroll >= at || document.activeElement !== focus0) return;
      var hit = { t: at, x: e.clientX, y: e.clientY, el: desc(ctl || t) };
      recent = recent.filter(function (r) { return at - r.t < 2500; });
      recent.push(hit);
      var near = recent.filter(function (r) { return Math.abs(r.x - hit.x) < 40 && Math.abs(r.y - hit.y) < 40; });
      if (near.length >= 3) report('ui_rage_click', hit.el + '@' + Math.round(hit.x / 40) + ',' + Math.round(hit.y / 40), { el: hit.el, n: near.length, text: ((ctl || t).innerText || '').trim().slice(0, 40) });
      else if (ctl) report('ui_dead_click', hit.el, { el: hit.el, text: (ctl.innerText || '').trim().slice(0, 40) });
    }, 900);
  }, true);

  // (c) our own script errors (third-party "Script error." carries nothing useful)
  window.addEventListener('error', function (e) {
    var f = (e && e.filename) || '';
    if (!f || f.indexOf(location.host) === -1 || !e.message || e.message === 'Script error.') return;
    report('js_error', e.message.slice(0, 60), { msg: e.message.slice(0, 160), file: f.replace(/^https?:\/\/[^/]+/, '').slice(0, 80), line: e.lineno || null });
  });
})();
