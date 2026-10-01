
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
