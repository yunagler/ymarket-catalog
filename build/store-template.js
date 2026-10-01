/**
 * Store frame for category pages ("Wolt-style" stores, approved by Yuval 30/09/2026).
 *
 * Every top-level category is a store with a name, a composed cover and a round badge
 * (data/stores-meta.json). A sub-category is an aisle of its store: same cover and
 * name, and the aisle tabs link to the sibling aisle pages. The SEO parts of the page
 * (H1, JSON-LD, SEO text, FAQ, breadcrumbs) are passed in and kept as they were.
 */
const fs = require('fs');
const path = require('path');

const META_PATH = path.join(__dirname, '..', 'data', 'stores-meta.json');
const META = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, 'utf-8')) : { top: [], stores: {} };

// Products still showing the "photo coming soon" image (the same file copied under many
// names): found by content hash, so the list shrinks by itself as real photos arrive.
// Rails ("most ordered") skip them; data/no-photo.json lets the homepage do the same.
const NO_PHOTO = (() => {
  const crypto = require('crypto');
  const root = path.join(__dirname, '..');
  const dataPath = path.join(root, 'data', 'products.json');
  if (!fs.existsSync(dataPath)) return new Set();
  const items = JSON.parse(fs.readFileSync(dataPath, 'utf-8')).items || [];
  const byHash = new Map(), hashOf = new Map();
  for (const it of items) {
    const rel = String(it.imageUrl || '').split('?')[0].replace(/^\//, '');
    const f = rel && path.join(root, rel);
    if (!f || !fs.existsSync(f)) { hashOf.set(it.id, null); continue; }
    const h = crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
    hashOf.set(it.id, h); byHash.set(h, (byHash.get(h) || 0) + 1);
  }
  const ids = [...hashOf].filter(([, h]) => !h || byHash.get(h) > 2).map(([id]) => id);
  try { fs.writeFileSync(path.join(root, 'data', 'no-photo.json'), JSON.stringify({ ids })); } catch (e) {}
  return new Set(ids);
})();

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = v => '₪' + Number(v).toLocaleString('he-IL', { maximumFractionDigits: 2 });

// A product photo the size a card needs. build/optimize-images.js already made a 258px and a
// 512px WebP next to every /items/*.jpg; the cards showed the 1024px JPG (0.4–2.2MB) in a
// ~170px box — the robot measured 56MB for one store (01/10/2026). The JPG stays as the
// fallback for a browser without WebP. <picture> is display:contents in store-v4.css, so the
// card layout is unchanged.
function pic(src, alt, attrs, sizes = '170px') {
  const m = /^(\/items\/[^?#]+)\.jpg(\?[^#]*)?$/i.exec(src || '');
  if (!m) return `<img src="${esc(src)}" alt="${esc(alt)}" ${attrs}>`;
  // a WebP that fails to load must not leave a broken photo: drop the <source>, the JPG loads
  const img = `<img src="${esc(src)}" alt="${esc(alt)}" ${attrs} onerror="this.onerror=null;var s=this.parentNode.querySelector('source');if(s){s.remove();this.src=this.getAttribute('src')}">`;
  let file = m[1];
  try { file = decodeURIComponent(m[1]); } catch (e) { /* keep raw */ }
  if (!fs.existsSync(path.join(__dirname, '..', file + '-thumb.webp'))) return img;
  const q = m[2] || '';
  return `<picture><source type="image/webp" srcset="${esc(m[1] + '-thumb.webp' + q)} 258w, ${esc(m[1] + '.webp' + q)} 512w" sizes="${sizes}">${img}</picture>`;
}

function storeOf(rootCategory) {
  const key = rootCategory.seoSlug || rootCategory.slug;
  return META.stores[key] || null;
}

function cover(store) {
  const doodles = (store.doodles || []).map((ic, n) => `<i class="fas ${ic} v4-d v4-d${n}" aria-hidden="true"></i>`).join('');
  const imgs = (store.coverImages || []).concat(store.coverImages || []).slice(0, 3);
  const stickers = imgs.map((u, n) => `<span class="v4-stk v4-stk${n}">${pic(u, '', 'loading="eager" width="160" height="160"', '160px')}</span>`).join('');
  return `<div class="v4-sh__cover v4-shop--${store.tone}"><span class="v4-shop__cover">${doodles}${stickers}</span></div>`;
}

function itemCard(p, idx, productImage) {
  const img = productImage(p);
  const name = (p.name || '').trim();
  // link straight to the live page (seoSlug); the Hebrew slug only exists as a redirect stub
  const live = [p.seoSlug, p.slug].find(s => s && fs.existsSync(path.join(__dirname, '..', 'products', s, 'index.html')) && !/location\.replace/.test(fs.readFileSync(path.join(__dirname, '..', 'products', s, 'index.html'), 'utf-8').slice(0, 800))) || p.seoSlug || p.slug;
  const href = `/products/${live}/`;
  const loading = idx < 6 ? 'fetchpriority="high"' : 'loading="lazy"';
  const promo = p.productStatus === 'on_sale' && p.originalPrice;
  const axis = ({ 'צבע': 'צבע', 'מידה': 'מידה', 'נפח': 'נפח', 'גודל': 'גודל', 'סוג': 'סוג' })[p._variantAxis] || 'סוג';
  const item = { id: p.id, name, price: p.saleNis || 0, unit: p.unit || '', imageUrl: img, slug: live, href,
    orig: promo ? p.originalPrice : null, axis: p._isVariantGroup ? axis : null,
    members: p._isVariantGroup ? (p._members || []).filter(m => m.price > 0).map(m => ({ id: m.id, label: m.label, name: m.name, price: m.price, imageUrl: m.imageUrl || img, slug: m.slug, unit: m.unit })) : null };
  let ctl;
  if (p._isVariantGroup && item.members && item.members.length) {
    ctl = `<button type="button" class="v4-item__pick" data-open>בחירת ${axis} · ${item.members.length}</button>`;
  } else if (p.saleNis) {
    const data = esc(JSON.stringify({ id: p.id, name, price: p.saleNis, unit: p.unit || '', imageUrl: img, slug: p.slug }));
    ctl = `<div class="v4-item__ctl" data-p="${data}"><button type="button" class="v4-q v4-q--minus" aria-label="הפחתה">−</button><span class="v4-q__n">0</span><button type="button" class="v4-q v4-q--plus" aria-label="הוספה לסל: ${esc(name)}">+</button></div>`;
  } else {
    ctl = `<a class="v4-item__pick" href="https://wa.me/972549922492?text=${encodeURIComponent('היי, מתעניין ב' + name)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> הצעת מחיר</a>`;
  }
  const price = p.saleNis
    ? `<span class="v4-item__price">${promo ? `<s>${money(p.originalPrice)}</s> ` : ''}${p._isVariantGroup ? 'מ-' : ''}${money(p.saleNis)} <small>לפני מע״מ</small></span>`
    : `<span class="v4-item__price v4-item__price--ask">מחיר לפי הצעה</span>`;
  const openable = p.saleNis ? ` data-item="${esc(JSON.stringify(item))}"` : '';
  return `<article class="v4-item${promo ? ' is-promo' : ''}"${openable}><a class="v4-item__img" href="${href}" data-open>${pic(img, name, `width="200" height="200" ${loading}`)}</a>${ctl}${price}<a class="v4-item__name" href="${href}" data-open>${esc(name)}</a></article>`;
}

/**
 * ctx: { category, root, isRoot, catMap, categoryProducts, h1Text, leadText, breadcrumbHtml, seoHtml,
 *        getCategoryUrlPath, getDescendantSlugs, productImage, categoryName }
 */
function renderStoreMain(ctx) {
  const { category, root, isRoot, catMap, categoryProducts, h1Text, leadText, breadcrumbHtml, seoHtml,
    getCategoryUrlPath, getDescendantSlugs, productImage } = ctx;
  const store = storeOf(root) || { name: root.name, tagline: '', icon: root.icon || 'fa-store', doodles: [], tone: 'navy', coverImages: [] };
  const storeName = store.name;
  const rootUrl = getCategoryUrlPath(root, catMap);
  const aisles = (catMap.get(root.id)?.children || []);
  const inAisle = (p, a) => { const s = getDescendantSlugs(a, catMap); return s.has(p.categorySlug) || (p.categorySlugs || []).some(x => s.has(x)); };

  // aisle tabs: on the store page they jump inside the page; on an aisle page they link to the siblings
  let tabs, sections = '';
  const withPhoto = p => !NO_PHOTO.has(p.id);
  const top = META.top.map(id => categoryProducts.find(p => p.id === id)).filter(Boolean).filter(withPhoto).slice(0, 10);
  const topList = top.length >= 3 ? top : categoryProducts.filter(p => (p.isFeatured || p.productStatus === 'recommended') && withPhoto(p)).slice(0, 10);
  let n = 0;
  if (isRoot) {
    tabs = (topList.length ? `<a href="#aisle-top" class="is-on">הכי מוזמנים</a>` : '') +
      aisles.map(a => `<a href="#aisle-${a.id}">${esc(a.name.trim())}</a>`).join('');
    if (topList.length) sections += `<section class="v4-aisle" id="aisle-top"><h2>הכי מוזמנים ב${esc(storeName)}</h2><p class="v4-aisle__sub">מה שעסקים מזמינים כאן הכי הרבה.</p><div class="v4-rail">${topList.map(p => itemCard(p, n++, productImage)).join('')}</div></section>`;
    const placed = new Set();
    for (const a of aisles) {
      const its = categoryProducts.filter(p => inAisle(p, a));
      its.forEach(p => placed.add(p.id));
      if (its.length) sections += `<section class="v4-aisle" id="aisle-${a.id}"><h2><a href="${getCategoryUrlPath(a, catMap)}">${esc(a.name.trim())}</a> <span>${its.length}</span></h2><div class="v4-grid">${its.map(p => itemCard(p, n++, productImage)).join('')}</div></section>`;
    }
    const rest = categoryProducts.filter(p => !placed.has(p.id));
    if (rest.length) {
      sections += `<section class="v4-aisle" id="aisle-more"><h2>${aisles.length ? 'עוד בחנות' : 'כל המוצרים'} <span>${rest.length}</span></h2><div class="v4-grid">${rest.map(p => itemCard(p, n++, productImage)).join('')}</div></section>`;
      tabs += `<a href="#aisle-more">${aisles.length ? 'עוד בחנות' : 'כל המוצרים'}</a>`;
    }
  } else {
    tabs = `<a href="${rootUrl}" class="v4-tabs__home"><i class="fas fa-store"></i> כל ${esc(storeName)}</a>` +
      aisles.map(a => `<a href="${getCategoryUrlPath(a, catMap)}"${a.id === category.id ? ' class="is-on" aria-current="page"' : ''}>${esc(a.name.trim())}</a>`).join('');
    sections = `<section class="v4-aisle" id="aisle-${category.id}"><h2>${esc(category.name.trim())} <span>${categoryProducts.length}</span></h2><div class="v4-grid">${categoryProducts.map(p => itemCard(p, n++, productImage)).join('')}</div></section>`;
  }

  const count = isRoot ? categoryProducts.length : categoryProducts.length;
  return `
  <main id="main-content" class="v4-storepage${isRoot ? '' : ' is-aisle'}">
    <section class="v4-sh">
      ${cover(store)}
      <div class="v4-wrap v4-sh__head">
        <a class="v4-sh__badge" href="${rootUrl}" aria-label="${esc(storeName)}"><i class="fas ${store.icon}"></i></a>
        <div class="v4-sh__title">
          <nav class="v4-crumbs breadcrumb" aria-label="ניווט פירורי לחם">${breadcrumbHtml}</nav>
          <div class="v4-sh__name">${esc(storeName)} <em>| גת רימון</em>${isRoot ? '' : ` <span class="v4-sh__aisle">· ${esc(category.name.trim())}</span>`}</div>
          <h1 class="v4-sh__h1">${h1Text}</h1>
${leadText ? `          <p class="v4-sh__lead" style="margin:2px 0 6px;color:var(--v4-text)">${esc(leadText)}</p>
` : ''}          <p>${esc(store.tagline)}${store.tagline ? '. ' : ''}${count} מוצרים, יוצאים מהמחסן שלנו.</p>
        </div>
        <ul class="v4-sh__info">
          <li><i class="fas fa-clock"></i><b dir="ltr">24–72</b> שעות בגוש דן ובמרכז</li>
          <li><i class="fas fa-truck-fast"></i>משלוח חינם בגוש דן · לפי אזור בשאר</li>
          <li><i class="fas fa-basket-shopping"></i>מינימום 200 ₪ + מע״מ, מכל החנויות יחד</li>
          <li class="is-gold"><a href="/register"><i class="fas fa-crown"></i>מחירון אישי ב-CASH MARKET</a></li>
        </ul>
      </div>
    </section>
    <div class="v4-tabs"><div class="v4-wrap v4-tabs__in"><div class="v4-tabs__list">${tabs}</div>
      <label class="v4-tabs__search"><i class="fas fa-magnifying-glass"></i><input id="v4StoreFind" type="search" placeholder="חיפוש ב${esc(storeName)}" aria-label="חיפוש בחנות"></label></div></div>
    <div class="v4-wrap v4-aisles">${sections}<p class="v4-empty" id="v4Empty" hidden>לא מצאנו בחנות הזו. <a href="/catalog">חיפוש בכל החנויות</a></p></div>
    <div class="v4-wrap v4-about">${seoHtml}</div>
    <div class="v4-modal" id="v4Modal" hidden>
      <div class="v4-modal__bg" data-close></div>
      <div class="v4-modal__card" role="dialog" aria-modal="true" aria-labelledby="v4MName">
        <button type="button" class="v4-modal__x" data-close aria-label="סגירה">×</button>
        <div class="v4-modal__img"><img id="v4MImg" alt=""></div>
        <div class="v4-modal__body">
          <h3 id="v4MName"></h3>
          <div class="v4-modal__price"><s id="v4MOrig" hidden></s> <b id="v4MPrice"></b> <small>לפני מע״מ</small></div>
          <div class="v4-modal__opts" id="v4MOpts" hidden><strong id="v4MAxis"></strong><div class="v4-modal__chips" id="v4MChips" role="radiogroup"></div></div>
          <a class="v4-modal__more" id="v4MMore" href="#">כל הפרטים בדף המוצר <i class="fas fa-chevron-left"></i></a>
        </div>
        <div class="v4-modal__foot">
          <div class="v4-modal__qty"><button type="button" data-q="-1" aria-label="אחד פחות">−</button><span id="v4MQty">1</span><button type="button" data-q="1" aria-label="עוד אחד">+</button></div>
          <button type="button" class="v4-modal__add" id="v4MAdd">להוסיף להזמנה</button>
        </div>
      </div>
    </div>
    <div class="v4-cartbar" id="v4Cartbar" hidden>
      <div class="v4-cartbar__in">
        <div class="v4-cartbar__txt"><strong id="v4CbCount">0 פריטים</strong><span id="v4CbMsg"></span>
          <div class="v4-cartbar__track"><i id="v4CbFill"></i><b class="v4-cartbar__mk" style="--at:10%" title="מינימום"></b></div></div>
        <a href="/cart" class="v4-btn-gold"><span id="v4CbSum">₪0</span><small class="v4-cb-vat">לפני מע״מ</small> · לסל ולתשלום</a>
      </div>
    </div>
  </main>`;
}

// Cart, aisle scroll-spy and in-store search. Same ym_cart item shape as the catalog.
const STORE_JS = `<script>
(function () {
  var MIN = 200, FREE = 2000;
  function get() { try { return JSON.parse(localStorage.getItem('ym_cart') || '[]') || []; } catch (e) { return []; } }
  function set(c) { try { localStorage.setItem('ym_cart', JSON.stringify(c)); } catch (e) {} }
  function fmt(v) { return '₪' + v.toLocaleString('he-IL', { maximumFractionDigits: 2 }); }
  function paint() {
    var c = get(), n = 0, sum = 0;
    c.forEach(function (i) { n += i.quantity || 0; sum += (i.price || 0) * (i.quantity || 0); });
    document.querySelectorAll('.v4-item__ctl').forEach(function (ctl) {
      var p = JSON.parse(ctl.getAttribute('data-p')), it = c.filter(function (x) { return x.id === p.id; })[0], q = it ? it.quantity : 0;
      ctl.querySelector('.v4-q__n').textContent = q; ctl.classList.toggle('has', q > 0);
    });
    // sized/colored items have no counter, so the pick button shows how many of all their options are in the cart
    document.querySelectorAll('.v4-item[data-item] button.v4-item__pick').forEach(function (pk) {
      var d = JSON.parse(pk.closest('.v4-item').getAttribute('data-item')), ms = d.members || [], q = 0;
      ms.forEach(function (m) { c.forEach(function (x) { if (x.id === m.id) q += x.quantity || 0; }); });
      pk.textContent = q > 0 ? '✓ ' + q + ' בסל' : 'בחירת ' + (d.axis || 'סוג') + ' · ' + ms.length;
      pk.classList.toggle('has', q > 0);
    });
    if (window.YMarket && window.YMarket.updateCartBadge) window.YMarket.updateCartBadge();
    else { var b = document.getElementById('cartBadge'); if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; } }
    var bar = document.getElementById('v4Cartbar'); if (!bar) return; bar.hidden = !n;
    document.getElementById('v4CbCount').textContent = n + (n === 1 ? ' פריט' : ' פריטים');
    document.getElementById('v4CbSum').textContent = fmt(sum);
    document.getElementById('v4CbMsg').textContent = sum < MIN ? 'עוד ' + fmt(MIN - sum) + ' למינימום הזמנה'
      : sum < FREE ? '✓ מינימום · עוד ' + fmt(FREE - sum) + ' למשלוח חינם לכל הארץ' : '✓ משלוח חינם לכל הארץ';
    document.getElementById('v4CbFill').style.width = Math.min(100, sum / FREE * 100) + '%';
    bar.classList.toggle('is-ok', sum >= MIN); document.body.classList.toggle('v4-has-cart', !!n);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.v4-q'); if (!btn) return;
    var ctl = btn.closest('.v4-item__ctl'), p = JSON.parse(ctl.getAttribute('data-p')), c = get();
    var it = c.filter(function (x) { return x.id === p.id; })[0], d = btn.classList.contains('v4-q--plus') ? 1 : -1;
    if (!it && d > 0) { it = { id: p.id, name: p.name, price: p.price, unit: p.unit, imageUrl: p.imageUrl, slug: p.slug, quantity: 0 }; c.push(it); }
    if (it) { it.quantity += d; if (it.quantity <= 0) c = c.filter(function (x) { return x !== it; }); }
    set(c); paint();
    if (d > 0) {
      ctl.classList.remove('pop'); void ctl.offsetWidth; ctl.classList.add('pop');
      var A = window.YMarketAnalytics, ev = { id: p.id, name: p.name, price: p.price, quantity: 1 };
      if (A && A.fbAddToCart) A.fbAddToCart(ev); if (A && A.trackAddToCart) A.trackAddToCart(ev);
    }
  });
  // item window (Wolt-style): photo, options, quantity, "add to order"
  var M = document.getElementById('v4Modal'), cur = null, curArt = null, sel = null, qty = 1, lastFocus = null;
  function inCart(id) { var x = get().filter(function (y) { return y.id === id; })[0]; return x ? x.quantity : 0; }
  function mset() {
    var it = sel || cur, total = (it.price || 0) * qty;
    // the 512px WebP next to the JPG (build/optimize-images.js) — the 1024px JPG only if it is missing
    var mi = document.getElementById('v4MImg'), u = it.imageUrl || '', w = /^\\/items\\/[^?#]+\\.jpg(\\?|#|$)/i.test(u) ? u.replace(/\\.jpg(?=\\?|#|$)/i, '.webp') : u;
    mi.onerror = function () { if (mi.src.indexOf('.webp') > -1 && w !== u) { mi.onerror = null; mi.src = u; } };
    mi.src = w; mi.alt = it.name;
    document.getElementById('v4MName').textContent = sel ? cur.name + ' · ' + sel.label : cur.name;
    document.getElementById('v4MPrice').textContent = fmt(it.price);
    var o = document.getElementById('v4MOrig'); o.hidden = !(cur.orig && !sel); if (cur.orig) o.textContent = fmt(cur.orig);
    document.getElementById('v4MQty').textContent = qty;
    document.getElementById('v4MAdd').textContent = 'להוסיף להזמנה · ' + fmt(total);
    // an option's own page only redirects to the group page, so link the group page and name the option for it to open on
    document.getElementById('v4MMore').href = sel && cur.href ? cur.href + '#size=' + encodeURIComponent(sel.label) : '/products/' + (it.slug || cur.slug) + '/';
  }
  function open(item) {
    cur = item; qty = 1; sel = null; lastFocus = document.activeElement;
    var chips = document.getElementById('v4MChips'), opts = document.getElementById('v4MOpts'); chips.innerHTML = '';
    if (item.members && item.members.length) {
      opts.hidden = false; document.getElementById('v4MAxis').textContent = 'בחרו ' + (item.axis || 'סוג');
      item.members.forEach(function (m, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'v4-chip' + (i ? '' : ' is-on'); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i ? 'false' : 'true');
        b.innerHTML = '<span></span><small></small>'; b.children[0].textContent = m.label; b.children[1].textContent = fmt(m.price);
        var inq = inCart(m.id); if (inq) { var em = document.createElement('em'); em.className = 'v4-chip__in'; em.textContent = inq + ' בסל'; b.appendChild(em); }
        b.addEventListener('click', function () { sel = m; [].forEach.call(chips.children, function (c) { c.classList.toggle('is-on', c === b); c.setAttribute('aria-checked', c === b); }); mset(); });
        chips.appendChild(b);
      });
      sel = item.members[0];
    } else opts.hidden = true;
    mset(); M.hidden = false; document.documentElement.classList.add('v4-lock');
    requestAnimationFrame(function () { M.classList.add('is-on'); document.getElementById('v4MAdd').focus(); });
  }
  function close() { M.classList.remove('is-on'); document.documentElement.classList.remove('v4-lock'); setTimeout(function () { M.hidden = true; }, 220); if (lastFocus) lastFocus.focus(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      var art = t.closest('.v4-item'); if (art && art.getAttribute('data-item')) { e.preventDefault(); curArt = art; open(JSON.parse(art.getAttribute('data-item'))); return; }
    }
    if (e.target.closest('[data-close]')) { close(); return; }
    var q = e.target.closest('.v4-modal__qty [data-q]'); if (q) { qty = Math.max(1, qty + (+q.getAttribute('data-q'))); mset(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !M.hidden) close(); });
  document.getElementById('v4MAdd').addEventListener('click', function () {
    var it = sel || cur, c = get(), x = c.filter(function (y) { return y.id === it.id; })[0];
    if (x) x.quantity += qty; else c.push({ id: it.id, name: sel ? cur.name + ' · ' + sel.label : it.name, price: it.price, unit: it.unit || '', imageUrl: it.imageUrl, slug: it.slug, quantity: qty });
    set(c); paint(); close();
    var fx = curArt && (curArt.querySelector('button.v4-item__pick') || curArt.querySelector('.v4-item__ctl'));
    if (fx) { fx.classList.remove('pop'); void fx.offsetWidth; fx.classList.add('pop'); }
    if (window.YMarket && window.YMarket.showToast) window.YMarket.showToast('נוסף לסל · ' + (sel ? (cur.axis || 'סוג') + ' ' + sel.label + ' · ' : '') + qty + ' יח׳');
    var A = window.YMarketAnalytics, ev = { id: it.id, name: it.name, price: it.price, quantity: qty };
    if (A && A.fbAddToCart) A.fbAddToCart(ev); if (A && A.trackAddToCart) A.trackAddToCart(ev);
  });
  var tabs = [].slice.call(document.querySelectorAll('.v4-tabs__list a[href^="#"]'));
  var secs = tabs.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if (tabs.length) {
    window.addEventListener('scroll', function () {
      var cur = 0; secs.forEach(function (s, i) { if (s && !s.hidden && s.getBoundingClientRect().top < 170) cur = i; });
      tabs.forEach(function (t, i) { t.classList.toggle('is-on', i === cur); });
    }, { passive: true });
    tabs.forEach(function (t) { t.addEventListener('click', function (e) { var s = document.querySelector(t.getAttribute('href')); if (!s) return; e.preventDefault(); scrollTo({ top: s.getBoundingClientRect().top + scrollY - 150, behavior: 'smooth' }); }); });
  }
  var on = document.querySelector('.v4-tabs__list a.is-on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  var find = document.getElementById('v4StoreFind');
  if (find) find.addEventListener('input', function () {
    var q = find.value.trim(), any = false;
    document.querySelectorAll('.v4-aisle').forEach(function (s) {
      var vis = 0; s.querySelectorAll('.v4-item').forEach(function (it) { var m = !q || it.textContent.indexOf(q) > -1; it.hidden = !m; if (m) vis++; });
      s.hidden = !vis; if (vis) any = true;
    });
    document.getElementById('v4Empty').hidden = any;
  });
  paint();
})();
</script>`;

module.exports = { renderStoreMain, STORE_JS, storeOf, pic };
