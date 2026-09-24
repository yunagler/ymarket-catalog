#!/usr/bin/env node
/**
 * Segment offer pages — the landing page a paid ad points to.
 *
 *   node build/generate-offers.js
 *
 * Reads data/offers.json (what is in each kit) and data/products.json (names, prices,
 * images — the single catalog source) and writes offer/<slug>/index.html plus
 * offer/sitemap-offer.xml.
 *
 * Header and footer are inlined from includes/site-header.html / site-footer.html —
 * the same sources build_header.py / build_footer.py distribute, so a later build run
 * finds and refreshes them like on every other page.
 *
 * The main button writes the kit into the ym_cart localStorage cart (same item shape as
 * js/cart.js) and goes to checkout: an ad click becomes an order in three taps. Prices
 * are validated again by /api/b2c/orders, so a stale page can never undercharge.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SITE = 'https://ymarket.co.il'
const WA_NUMBER = '972549922492'
const VAT = 0.18

const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'))
const { offers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/offers.json'), 'utf8'))
const header = fs.readFileSync(path.join(ROOT, 'includes/site-header.html'), 'utf8').trim()
const footer = fs.readFileSync(path.join(ROOT, 'includes/site-footer.html'), 'utf8').trim()
const byId = new Map(products.items.map(i => [i.id, i]))

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const nis = n => '₪' + Number(n).toLocaleString('he-IL', { maximumFractionDigits: 2 })

function buildOffer(o) {
  const lines = o.items.map(({ id, qty }) => {
    const p = byId.get(id)
    if (!p) throw new Error(`offer ${o.slug}: item ${id} is not in products.json`)
    if (!(p.saleNis > 0)) throw new Error(`offer ${o.slug}: item ${id} has no price`)
    return { p, qty, line: Math.round(p.saleNis * qty * 100) / 100 }
  })
  const net = Math.round(lines.reduce((s, l) => s + l.line, 0) * 100) / 100
  const gross = Math.round(net * (1 + VAT) * 100) / 100
  const url = `${SITE}/offer/${o.slug}/`
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`${o.waText} #OFR-${o.slug}`)}`
  const cartItems = lines.map(({ p, qty }) => ({
    id: p.id, name: p.name, price: p.saleNis, unit: p.unit || '', imageUrl: p.imageUrl || '', slug: p.slug || '', quantity: qty,
  }))
  const hero = lines.find(l => l.p.imageUrl)?.p.imageUrl || ''

  const rows = lines.map(({ p, qty, line }) => `
          <li class="ofr-item">
            <img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" width="64" height="64" loading="lazy">
            <div class="ofr-item__name">${p.slug ? `<a href="/products/${encodeURIComponent(p.slug)}">${esc(p.name)}</a>` : esc(p.name)}</div>
            <div class="ofr-item__qty">× ${qty}</div>
            <div class="ofr-item__sum">${nis(line)}</div>
          </li>`).join('')

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(o.title)} | וואי מרקט</title>
  <meta name="description" content="${esc(o.sub)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(o.title)}">
  <meta property="og:description" content="${esc(o.sub)}">
  <meta property="og:url" content="${url}">
  ${hero ? `<meta property="og:image" content="${esc(hero)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/components.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="stylesheet" href="/css/new-header.css?v=202604112025">
  <link rel="stylesheet" href="/css/site-header.css?v=202608152032">
  <style>
    .ofr{max-width:960px;margin:0 auto;padding:32px 16px 64px}
    .ofr-hero{background:#1B3A5C;color:#fff;border-radius:16px;padding:32px 24px;margin-bottom:24px}
    .ofr-hero__seg{color:#C9A227;font-weight:700;font-size:15px;margin-bottom:8px}
    .ofr-hero h1{font-size:clamp(26px,5vw,38px);line-height:1.25;margin:0 0 12px;color:#fff}
    .ofr .ofr-hero p{font-size:17px;line-height:1.7;margin:0;color:#E8EEF5}
    .ofr-grid{display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start}
    @media (max-width:820px){.ofr-grid{grid-template-columns:1fr}}
    .ofr-card{background:#fff;border:1px solid var(--color-border,#e3e7ee);border-radius:16px;padding:20px}
    .ofr-card h2{font-size:20px;margin:0 0 12px;color:#1B3A5C}
    .ofr-pain{list-style:none;margin:0 0 20px;padding:0}
    .ofr-pain li{padding:8px 0;border-bottom:1px solid #eef1f5;color:#44506a}
    .ofr-pain li::before{content:"✕";color:#b3261e;font-weight:700;margin-left:10px}
    .ofr-items{list-style:none;margin:0;padding:0}
    .ofr-item{display:grid;grid-template-columns:64px 1fr auto auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #eef1f5}
    .ofr-item img{object-fit:contain;border-radius:8px;background:#fff}
    .ofr-item__name a{color:inherit}
    .ofr-item__qty{color:#44506a;white-space:nowrap}
    .ofr-item__sum{font-weight:600;white-space:nowrap}
    .ofr-buy{position:sticky;top:16px}
    .ofr-total{display:flex;justify-content:space-between;margin:6px 0;color:#44506a}
    .ofr-total--big{font-size:22px;font-weight:800;color:#1B3A5C;border-top:2px solid #eef1f5;padding-top:10px;margin-top:10px}
    .ofr-promises{list-style:none;padding:0;margin:16px 0}
    .ofr-promises li{padding:6px 0}
    .ofr-promises li::before{content:"✓";color:#C9A227;font-weight:800;margin-left:10px}
    .ofr-cta{display:block;width:100%;text-align:center;margin-top:10px}
    .ofr-note{font-size:13px;color:#6b7690;margin-top:10px;line-height:1.6}
  </style>
</head>
<body>

${header}

  <main class="ofr" id="main-content">
    <section class="ofr-hero">
      <div class="ofr-hero__seg">${esc(o.segment)}</div>
      <h1>${esc(o.headline)}</h1>
      <p>${esc(o.sub)}</p>
    </section>

    <div class="ofr-grid">
      <div>
        <section class="ofr-card" style="margin-bottom:24px">
          <h2>מכירים את זה?</h2>
          <ul class="ofr-pain">${o.pain.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <p style="margin:0;color:#44506a;line-height:1.7">הערכה הזו מגיעה עד העסק, בהזמנה אחת ובחשבונית אחת. אפשר לשנות כמויות ולהוסיף מוצרים לפני התשלום.</p>
        </section>
        <section class="ofr-card">
          <h2>מה בערכה</h2>
          <ul class="ofr-items">${rows}
          </ul>
        </section>
      </div>

      <aside class="ofr-card ofr-buy">
        <h2>${esc(o.title.split('—')[0].trim())}</h2>
        <div class="ofr-total"><span>לפני מע"מ</span><span>${nis(net)}</span></div>
        <div class="ofr-total"><span>מע"מ</span><span>${nis(gross - net)}</span></div>
        <div class="ofr-total ofr-total--big"><span>סה"כ</span><span>${nis(gross)}</span></div>
        <ul class="ofr-promises">
          <li>החיוב רק אחרי האספקה</li>
          <li>חשבונית מס כחוק לכל הזמנה</li>
          <li>משלוח חינם בגוש דן ובכל הזמנה מעל ₪2,000 לפני מע"מ</li>
        </ul>
        <button type="button" class="btn btn--primary btn--lg ofr-cta" id="ofrOrder">להזמין את הערכה</button>
        <a class="btn btn--outline btn--lg ofr-cta" href="${esc(waHref)}" target="_blank" rel="noopener">להתאים את הערכה בוואטסאפ</a>
        <p class="ofr-note">דמי המשלוח מחושבים לפי העיר בקופה, לפני אישור ההזמנה.</p>
      </aside>
    </div>
  </main>

${footer}

  <script src="/js/main.min.js"></script>
  <script src="/js/analytics.min.js"></script>
  <script>
    (function () {
      var KIT = ${JSON.stringify(cartItems)};
      document.getElementById('ofrOrder').addEventListener('click', function () {
        var cart = [];
        try { cart = JSON.parse(localStorage.getItem('ym_cart') || '[]'); } catch (e) {}
        KIT.forEach(function (k) {
          var ex = cart.find(function (c) { return c.id === k.id; });
          if (ex) ex.quantity = Math.max(ex.quantity, k.quantity);
          else cart.push(Object.assign({}, k));
        });
        localStorage.setItem('ym_cart', JSON.stringify(cart));
        var A = window.YMarketAnalytics;
        KIT.forEach(function (k) {
          try { A && A.trackAddToCart && A.trackAddToCart(k); } catch (e) {}
          try { A && A.fbAddToCart && A.fbAddToCart(k); } catch (e) {}
        });
        try { window.YMarketAnalyst && window.YMarketAnalyst.track('offer_add', { meta: { offer: ${JSON.stringify(o.slug)} } }); } catch (e) {}
        location.href = '/checkout';
      });
    })();
  </script>
  <script src="/js/new-header-inject.js" defer></script>
  <script src="/js/search.js?v=2" defer></script>
</body>
</html>
`
}

let written = 0
const urls = []
for (const o of offers) {
  const dir = path.join(ROOT, 'offer', o.slug)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'index.html')
  fs.writeFileSync(file, buildOffer(o), 'utf8')
  // Let the official scripts own the header/footer bytes, so a later site-wide
  // build run reports no_change on these pages instead of rewriting them.
  const { execFileSync } = require('child_process')
  for (const script of ['build_header.py', 'build_footer.py']) {
    execFileSync('python', [script, '--no-backup', '--file', path.relative(ROOT, file)], { cwd: ROOT, stdio: 'ignore' })
  }
  urls.push(`${SITE}/offer/${o.slug}/`)
  written++
}
const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(ROOT, 'offer', 'sitemap-offer.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n', 'utf8')
console.log(`offers: ${written} page(s) → offer/, sitemap → offer/sitemap-offer.xml`)
