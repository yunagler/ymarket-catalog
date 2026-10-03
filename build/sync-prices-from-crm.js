#!/usr/bin/env node
/**
 * Nightly price sync: CRM public catalog → data/products.json, prices and offers only.
 *
 * Copies saleNis / originalPrice / discountPercent / promotionLabel / productStatus by
 * item id. Never touches names, slugs, SEO copy or variant fields: those are curated on
 * the site side (SEO program) and a full export would overwrite them.
 * New CRM items and items the CRM no longer exports are reported, not added or removed.
 *
 * Then regenerates only what the new prices touch: the changed product pages
 * (`generate-products.js --slug=`), the price on store-page cards (patched in place),
 * the homepage best-sellers rail,
 * and the agent price list (pricing.md, pricing/*.md, prices.csv).
 * Never runs generate-sitemap.js (it would stamp lastmod on unchanged pages).
 *
 *   node build/sync-prices-from-crm.js              apply + regenerate (CI commits the result)
 *   node build/sync-prices-from-crm.js --dry-run    report only, write nothing
 *   FORCE_REGEN=1 node build/sync-prices-from-crm.js  rebuild every product page
 *                                                     (determinism check, never committed)
 *   SIMULATE=79:101,284:111 …   fake CRM prices to exercise the patching (never committed)
 *
 * Exit: 0 ok · 1 a safety gate stopped the run · 2 the CRM catalog could not be read.
 * In GitHub Actions it writes a step summary and the outputs `changed` and `summary`.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'products.json');
const HOME_PATH = path.join(ROOT, 'index.html');
const CATALOG_URL = process.env.CRM_CATALOG_URL || 'https://app.ymarket.co.il/api/public/catalog';

const FIELDS = ['saleNis', 'originalPrice', 'discountPercent', 'promotionLabel', 'productStatus'];
const MIN_ITEMS = 800;            // a smaller catalog means a broken export
const MAX_PRICE_CHANGE_SHARE = 0.2; // more than this in one night → stop and let a person look
const MAX_UNEXPECTED_PAGES = 10;   // pages that changed although none of their prices did
const ALLOWED = [/^data\/products\.json$/, /^products\//, /^category\//, /^pricing\.md$/, /^pricing\//, /^prices\.csv$/, /^index\.html$/];

const DRY = process.argv.includes('--dry-run');
const FORCE = process.env.FORCE_REGEN === '1' || process.argv.includes('--force-regen');

const summary = [];
const say = (line = '') => { console.log(line); summary.push(line); };

function finish(code, changed, oneLine) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed ? 'true' : 'false'}\nsummary=${(oneLine || '').replace(/\n/g, ' ')}\n`);
  }
  process.exit(code);
}

async function fetchCatalog() {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(90000), headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, attempt * 5000));
    }
  }
  throw lastErr;
}

const norm = v => (v === undefined || v === '' ? null : v);
const same = (a, b) => {
  a = norm(a); b = norm(b);
  if (a === null || b === null) return a === b;
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  return String(a) === String(b);
};
const money = n => (Number.isInteger(n) ? String(n) : Number(n).toFixed(2));

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' });
}

function changedFiles() {
  return git(['-c', 'core.quotepath=false', 'status', '--porcelain', '--untracked-files=all'])
    .split('\n').filter(Boolean)
    .map(l => l.slice(3).replace(/^"|"$/g, ''))
    .map(p => (p.includes(' -> ') ? p.split(' -> ')[1] : p));
}

function node(script, args = []) {
  return execFileSync(process.execPath, [path.join(ROOT, 'build', script), ...args], { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 });
}

// Homepage "most ordered" rail is hand-built HTML: patch the price in each card by item id
function patchHomeRail(priceById) {
  const html = fs.readFileSync(HOME_PATH, 'utf-8');
  const start = html.indexOf('id="y3Rail"');
  if (start < 0) return 0;
  const end = html.indexOf('</section>', start);
  if (end < 0) return 0;
  let patched = 0;
  const rail = html.slice(start, end).replace(/<article class="y3-prod">[\s\S]*?<\/article>/g, card => {
    const m = card.match(/&quot;id&quot;: (\d+)/);
    if (!m || !priceById.has(Number(m[1]))) return card;
    const want = priceById.get(Number(m[1]));
    const shown = card.match(/<span class="y3-prod__price">₪([\d.,]+)<small>/);
    if (!(want > 0) || (shown && Number(shown[1].replace(/,/g, '')) === want)) return card;
    const p = money(want);
    const next = card
      .replace(/(<span class="y3-prod__price">₪)[\d.,]+(<small>)/, `$1${p}$2`)
      .replace(/(&quot;price&quot;: )[\d.]+/, `$1${p}`);
    if (next !== card) patched++;
    return next;
  });
  if (patched) fs.writeFileSync(HOME_PATH, html.slice(0, start) + rail + html.slice(end), 'utf-8');
  return patched;
}

// Store pages are patched in place, card by card, never rebuilt: generate-categories.js
// stamps today's dateModified on every store page, and unchanged pages must keep their date.
// Same escaping and money format as build/store-template.js.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const shekel = v => '₪' + Number(v).toLocaleString('he-IL', { maximumFractionDigits: 2 });
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function listStorePages(dir = path.join(ROOT, 'category'), out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listStorePages(full, out);
    else if (e.name === 'index.html') out.push(full);
  }
  return out;
}

function patchStorePages(changedIds, siteById) {
  const stats = { files: 0, cards: 0, skipped: 0, ldPrices: 0 };
  for (const file of listStorePages()) {
    let html = fs.readFileSync(file, 'utf-8');
    if (!html.includes('class="v4-item"')) continue;
    const before = html;
    html = html.replace(/<article class="v4-item" data-item="([^"]*)">[\s\S]*?<\/article>/g, (card, attr) => {
      let obj;
      try { obj = JSON.parse(unesc(attr)); } catch { stats.skipped++; return card; }
      if (esc(JSON.stringify(obj)) !== attr) { stats.skipped++; return card; } // unknown encoding: leave it
      const isGroup = Array.isArray(obj.members) && obj.members.length > 0;
      let touched = false;
      if (isGroup) {
        for (const m of obj.members) {
          const it = siteById.get(m.id);
          if (changedIds.has(m.id) && it && Number(it.saleNis) > 0 && m.price !== Number(it.saleNis)) { m.price = Number(it.saleNis); touched = true; }
        }
        if (touched) obj.price = Math.min(...obj.members.map(m => m.price).filter(v => v > 0));
      } else if (changedIds.has(obj.id)) {
        const it = siteById.get(obj.id);
        if (it && Number(it.saleNis) > 0) {
          const orig = it.productStatus === 'on_sale' && it.originalPrice ? it.originalPrice : null;
          if (obj.price !== Number(it.saleNis) || obj.orig !== orig) { obj.price = Number(it.saleNis); obj.orig = orig; touched = true; }
        }
      }
      if (!touched) return card;
      stats.cards++;
      let next = card.replace(`data-item="${attr}"`, `data-item="${esc(JSON.stringify(obj))}"`);
      if (!isGroup) {
        next = next.replace(/data-p="([^"]*)"/, (whole, dp) => {
          try {
            const d = JSON.parse(unesc(dp));
            if (esc(JSON.stringify(d)) !== dp) return whole;
            d.price = obj.price;
            return `data-p="${esc(JSON.stringify(d))}"`;
          } catch { return whole; }
        });
        next = next.replace(/<span class="v4-item__price">[\s\S]*?<\/span>/,
          `<span class="v4-item__price">${obj.orig ? `<s>${shekel(obj.orig)}</s> ` : ''}${shekel(obj.price)} <small>לפני מע״מ</small></span>`);
      } else {
        next = next.replace(/(<span class="v4-item__price">(?:<s>[^<]*<\/s> )?מ-)₪[\d.,]+( <small>)/, `$1${shekel(obj.price)}$2`);
      }
      return next;
    });
    // JSON-LD ItemList offers on the same page
    for (const id of changedIds) {
      const it = siteById.get(id);
      if (!it || !(Number(it.saleNis) > 0)) continue;
      for (const slug of new Set([it.slug, it.seoSlug].filter(Boolean))) {
        const rx = new RegExp(`("url": "https://ymarket\\.co\\.il/products/${reEsc(slug)}/",[\\s\\S]{0,500}?"price": )([\\d.]+)`, 'g');
        html = html.replace(rx, (w, head, old) => {
          if (Number(old) === Number(it.saleNis)) return w;
          stats.ldPrices++;
          return head + money(Number(it.saleNis));
        });
      }
    }
    if (html !== before) { fs.writeFileSync(file, html, 'utf-8'); stats.files++; }
  }
  return stats;
}

async function main() {
  say(`## Nightly price sync · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  if (DRY) say('Mode: **dry run** (nothing written)');
  if (!DRY && !process.env.GITHUB_ACTIONS && changedFiles().length) {
    say('❌ The working tree has uncommitted changes. Run this in CI (or a clean checkout), or use --dry-run.');
    return finish(1, false);
  }
  if (FORCE) say('Mode: **force regeneration** of every product and store page (determinism check)');

  let crm;
  try {
    crm = await fetchCatalog();
  } catch (e) {
    say(`❌ CRM catalog unreachable (${CATALOG_URL}): ${e.message}`);
    return finish(2, false);
  }
  const crmItems = Array.isArray(crm.items) ? crm.items : [];
  const SIM = (process.env.SIMULATE || '').split(',').filter(Boolean).map(x => x.split(':').map(Number));
  for (const [id, price] of SIM) {
    const c = crmItems.find(i => i.id === id);
    if (c) { c.saleNis = price; say(`Simulated CRM price: item ${id} → ${price}`); }
  }
  if (crmItems.length < MIN_ITEMS) {
    say(`❌ CRM returned ${crmItems.length} items (expected ≥ ${MIN_ITEMS}) — nothing changed.`);
    return finish(1, false);
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const site = data.items || [];
  const crmById = new Map(crmItems.map(i => [i.id, i]));
  const siteIds = new Set(site.map(i => i.id));

  const changes = [];
  const skippedBadPrice = [];
  let priceChanges = 0;
  let matched = 0;
  for (const item of site) {
    const c = crmById.get(item.id);
    if (!c) continue;
    matched++;
    const crmPrice = Number(c.saleNis);
    if (!(crmPrice > 0)) { skippedBadPrice.push(item); continue; }
    const diff = {};
    for (const f of FIELDS) {
      if (!(f in c)) continue;
      if (!same(item[f], c[f])) diff[f] = { from: norm(item[f]), to: norm(c[f]) };
    }
    if (Object.keys(diff).length) {
      if (diff.saleNis) priceChanges++;
      changes.push({ item, diff });
    }
  }

  const onlyCrm = crmItems.filter(i => !siteIds.has(i.id));
  const onlySite = site.filter(i => !crmById.has(i.id));

  say('');
  say(`CRM ${crmItems.length} items · site ${site.length} · matched ${matched} · **${changes.length} changed** (${priceChanges} price)`);
  if (skippedBadPrice.length) say(`Skipped ${skippedBadPrice.length} items with no valid CRM price (site keeps its price): ${skippedBadPrice.slice(0, 10).map(i => i.id).join(', ')}`);

  if (matched && priceChanges / matched > MAX_PRICE_CHANGE_SHARE) {
    say(`❌ ${priceChanges} of ${matched} prices would change in one night (> ${Math.round(MAX_PRICE_CHANGE_SHARE * 100)}%). Stopped — check the CRM export before publishing.`);
    return finish(1, false);
  }

  if (changes.length) {
    say('');
    say('| id | product | change |');
    say('|---|---|---|');
    for (const { item, diff } of changes.slice(0, 60)) {
      const d = Object.entries(diff).map(([f, v]) => `${f}: ${v.from ?? '—'} → ${v.to ?? '—'}`).join('; ');
      say(`| ${item.id} | ${String(item.name).replace(/\|/g, '/').slice(0, 60)} | ${d} |`);
    }
    if (changes.length > 60) say(`| … | ${changes.length - 60} more | |`);
  }
  if (onlyCrm.length) say(`\nIn the CRM but not on the site (${onlyCrm.length}, not added): ${onlyCrm.slice(0, 20).map(i => `${i.id} ${String(i.name).slice(0, 30)}`).join(' · ')}`);
  if (onlySite.length) say(`On the site but no longer exported by the CRM (${onlySite.length}, not removed): ${onlySite.slice(0, 20).map(i => `${i.id} ${String(i.name).slice(0, 30)}`).join(' · ')}`);

  if (DRY) return finish(0, false, `${changes.length} changed (dry run)`);
  if (!changes.length && !FORCE) {
    say('\nNo price changes — nothing to publish.');
    return finish(0, false, 'no changes');
  }

  // ---- apply
  for (const { item, diff } of changes) {
    for (const [f, v] of Object.entries(diff)) item[f] = v.to;
  }
  if (changes.length) {
    data.pricesSyncedAt = new Date().toISOString();
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8'); // file has no trailing newline
  }

  // ---- regenerate
  const groups = new Map();
  for (const i of site) {
    if (i.variantGroupId == null) continue;
    groups.set(i.variantGroupId, (groups.get(i.variantGroupId) || 0) + 1);
  }
  const groupSlug = new Map((data.variantGroups || []).map(g => [g.id, g.seoSlug]));
  const pageSlugs = new Set();
  for (const { item } of changes) {
    const gid = item.variantGroupId;
    if (gid != null && groups.get(gid) > 1 && groupSlug.get(gid)) pageSlugs.add(groupSlug.get(gid));
    else if (item.seoSlug) pageSlugs.add(item.seoSlug);
  }

  if (FORCE) {
    node('generate-products.js');
  } else {
    for (const slug of pageSlugs) {
      if (!fs.existsSync(path.join(ROOT, 'products', slug, 'index.html'))) continue; // never build a page that was not live
      try { node('generate-products.js', [`--slug=${slug}`]); } catch (e) { say(`⚠️ page ${slug}: ${String(e.stderr || e.message).slice(0, 200)}`); }
    }
  }
  const siteById = new Map(site.map(i => [i.id, i]));
  const storeStats = patchStorePages(new Set(changes.map(c => c.item.id)), siteById);
  const priceById = new Map(site.map(i => [i.id, Number(i.saleNis)]));
  const railPatched = patchHomeRail(priceById);
  require('./generate-pricing').generatePricing();

  // ---- guard: only the expected files may change
  const files = changedFiles();
  const outside = files.filter(f => !ALLOWED.some(rx => rx.test(f)));
  const expectedPages = new Set([...pageSlugs].map(s => `products/${s}/index.html`));
  // Store pages are patched card by card (only cards of changed items), so every store
  // page in the diff is explained by a price change; product pages must still match.
  const unexpectedPages = files.filter(f => f.startsWith('products/') && !expectedPages.has(f));

  say('');
  say(`Regenerated: ${pageSlugs.size} product pages · store pages patched: ${storeStats.files} files / ${storeStats.cards} cards / ${storeStats.ldPrices} schema prices${storeStats.skipped ? ` (${storeStats.skipped} cards skipped: unknown encoding)` : ''} · homepage rail cards: ${railPatched} · price list`);
  say(`Files changed: ${files.length} (product pages ${files.filter(f => f.startsWith('products/')).length}, store pages ${files.filter(f => f.startsWith('category/')).length})`);
  if (outside.length) say(`Outside the allowed set: ${outside.slice(0, 20).join(', ')}`);
  if (unexpectedPages.length) say(`Product pages changed without a price change (${unexpectedPages.length}): ${unexpectedPages.slice(0, 15).join(', ')}`);

  if (FORCE || SIM.length) {
    say('\nForce regeneration / simulation is a measurement only — never committed.');
    return finish(0, false, 'force regeneration (not committed)');
  }
  if (outside.length || unexpectedPages.length > MAX_UNEXPECTED_PAGES) {
    say('\n❌ Regeneration touched more than the new prices explain. Stopped — nothing published.');
    return finish(1, false);
  }

  const oneLine = `${changes.length} items (${priceChanges} prices)`;
  say(`\n✅ Ready to publish: ${oneLine}`);
  return finish(0, true, oneLine);
}

main().catch(e => {
  say(`❌ ${e.stack || e.message}`);
  finish(1, false);
});
