// Home v4 — motion layer (preview: design-v4.html).
// Runs on top of the homepage scripts; everything degrades to a static page if it fails.
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('v4-js');

  // ── 1. Scroll choreography: section heads and cards build in order as they arrive ──
  var groups = [
    ['.hv-sec__head, .v4-head, .y3-app__head', 0],
    ['.y3-prod', 0.05], ['.y3-store', 0.04], ['.y3-app__list li', 0.06], ['.v4-card', 0.06],
    ['.y3-svc__card', 0.08], ['.v4-faq details', 0.06], ['.y3-quick li', 0.05]
  ];
  var tagged = [];
  groups.forEach(function (g) {
    var seen = new Map();
    document.querySelectorAll(g[0]).forEach(function (el) {
      if (el.closest('.v4-stage')) return;
      var parent = el.parentElement, n = seen.get(parent) || 0;
      seen.set(parent, n + 1);
      el.setAttribute('data-v4', '');
      el.style.setProperty('--d', Math.min(n * g[1], 0.5) + 's');
      tagged.push(el);
    });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    tagged.forEach(function (el) { io.observe(el); });
  } else { tagged.forEach(function (el) { el.classList.add('is-in'); }); }

  // ── 2. Sticky story: the step nearest the reading line drives the stage scene ──
  var stage = document.getElementById('v4Stage');
  var steps = [].slice.call(document.querySelectorAll('.v4-step'));
  if (stage && steps.length) {
    var ticking = false;
    var pick = function () {
      ticking = false;
      var line = window.innerWidth <= 980 ? window.innerHeight * 0.72 : window.innerHeight * 0.5, best = steps[0], bd = 1e9;
      steps.forEach(function (s) {
        var r = s.getBoundingClientRect(), mid = r.top + r.height / 2, d = Math.abs(mid - line);
        if (d < bd) { bd = d; best = s; }
      });
      var n = best.getAttribute('data-step');
      if (stage.getAttribute('data-scene') !== n) {
        stage.setAttribute('data-scene', n);
        steps.forEach(function (s) { s.classList.toggle('is-on', s === best); });
      }
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
    pick();
  }

  // ── 3. Hero products float in layers of depth and follow the pointer ──
  var hero = document.getElementById('hvHero');
  var floats = [].slice.call(document.querySelectorAll('.v4-float'));
  if (hero && floats.length && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      floats.forEach(function (f) {
        var z = parseFloat(f.getAttribute('data-z')) || 1;
        f.style.setProperty('--px', (-x * 34 * z).toFixed(1) + 'px');
        f.style.setProperty('--py', (-y * 26 * z).toFixed(1) + 'px');
      });
    });
    hero.addEventListener('pointerleave', function () { floats.forEach(function (f) { f.style.setProperty('--px', '0px'); f.style.setProperty('--py', '0px'); }); });
  }

  // ── 4. Light follows the pointer across the dark islands ──
  document.querySelectorAll('.v4-island').forEach(function (isl) {
    var g = document.createElement('span'); g.className = 'v4-glow'; isl.insertBefore(g, isl.firstChild);
    isl.addEventListener('pointermove', function (e) {
      var r = isl.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px'); g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ── 5. Add to cart: the product flies into the cart icon ──
  function cartTarget() {
    var b = document.getElementById('cartBadge');
    var el = (b && b.offsetParent) ? b : document.querySelector('.header a[href*="cart"], a[href="/cart"]');
    return el && el.getBoundingClientRect().width ? el : null;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.y3-prod__add'); if (!btn || !btn.animate) return;
    var card = btn.closest('.y3-prod'), img = card && card.querySelector('img'), to = cartTarget();
    if (!img || !to) return;
    var a = img.getBoundingClientRect(), b = to.getBoundingClientRect();
    var fly = img.cloneNode(); fly.className = 'v4-fly'; fly.removeAttribute('loading');
    fly.style.left = (a.left + a.width / 2 - 32) + 'px'; fly.style.top = (a.top + a.height / 2 - 32) + 'px';
    document.body.appendChild(fly);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    fly.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.55 - 90) + 'px) scale(.8) rotate(-12deg)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.25) rotate(-20deg)', opacity: 0.2 }
    ], { duration: 820, easing: 'cubic-bezier(.45,.05,.3,1)' }).onfinish = function () {
      fly.remove(); to.classList.remove('v4-bump'); void to.offsetWidth; to.classList.add('v4-bump');
    };
  });
})();
