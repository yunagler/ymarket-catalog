// Every button does its job — run against the live site after each deploy and once a day.
// Real input events (Playwright clicks hit-test like a finger), a fresh empty cart per page.
// Exit code 1 + a summary on any failure; the workflow turns that into an alert in the CRM.
//
//   BASE_URL=https://ymarket.co.il node .github/smoke/site-buttons.mjs [--all]
//
// Default: every store page gets the light check; the safety store gets the full flow.
import { chromium } from 'playwright';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.BASE_URL || 'https://ymarket.co.il').replace(/\/$/, '');
const ROOT = process.env.SITE_ROOT || new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const bust = () => 'smoke=' + Date.now().toString(36);
const fails = [];
const ok = [];
const metrics = []; // per store page: what a visitor waits for — feeds the improvement suggestions
const fail = (where, what) => { fails.push(`${where} — ${what}`); console.log('✗', where, '—', what); };

// store pages = category pages that carry the item window
function storePaths() {
  const out = [];
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = join(dir, e.name), r = rel + e.name + '/';
      const f = join(p, 'index.html');
      if (existsSync(f) && readFileSync(f, 'utf8').includes('id="v4Modal"')) out.push('/category/' + r);
      walk(p, r);
    }
  };
  walk(join(ROOT, 'category'), '');
  return out;
}

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'he-IL' });
  // the robot is not a visitor: keep it out of our analytics, Clarity, and the ad pixels
  await ctx.route(/app\.ymarket\.co\.il\/api\/analytics\//, r => r.fulfill({ status: 204, body: '' }));
  await ctx.route(/clarity\.ms|facebook\.(net|com)|google-analytics|googletagmanager|doubleclick|googleadservices/, r => r.abort());
  // largest paint + layout shift, observed from the first byte
  await ctx.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0;
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.renderTime || e.loadTime || e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 160)));
  return { ctx, page, errors };
}

// light check: nothing covers the cards, the window opens and closes, search filters
async function lightCheck(browser, path) {
  const { ctx, page, errors } = await newPage(browser);
  try {
    await page.goto(`${BASE}${path}?${bust()}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('.v4-item', { timeout: 20000 });
    await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource');
      const bytes = res.reduce((a, r) => a + (r.transferSize || 0), nav.transferSize || 0);
      const broken = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'));
      return { dcl: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0), lcp: Math.round(window.__lcp || 0),
        cls: Math.round((window.__cls || 0) * 1000) / 1000, kb: Math.round(bytes / 1024), requests: res.length + 1, items: document.querySelectorAll('.v4-item').length,
        broken: broken.length, brokenSrc: broken.slice(0, 3) };
    });
    const metric = { path, ...m, modalMs: null };
    metrics.push(metric);
    const hiddenOk = await page.evaluate(() => { const m = document.getElementById('v4Modal'); return !m || (m.hidden && getComputedStyle(m).display === 'none'); });
    if (!hiddenOk) return fail(path, 'חלון המוצר הסגור עדיין פרוס על הדף');
    const card = page.locator('article.v4-item[data-item] .v4-item__img').first();
    if (await card.count()) {
      await card.scrollIntoViewIfNeeded();
      const t0 = Date.now();
      await card.click({ timeout: 8000 }).catch(e => { throw new Error('לחיצה על מוצר נחסמה: ' + String(e.message).split('\n')[0].slice(0, 140)); });
      await page.waitForFunction(() => { const m = document.getElementById('v4Modal'); return m && !m.hidden && m.classList.contains('is-on'); }, null, { timeout: 4000, polling: 20 })
        .catch(() => { throw new Error('לחיצה על מוצר לא פתחה את חלון המוצר'); });
      metric.modalMs = Date.now() - t0;
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => { const m = document.getElementById('v4Modal'); return m.hidden && getComputedStyle(m).display === 'none'; }, null, { timeout: 3000 })
        .catch(() => { throw new Error('Esc לא סגר את חלון המוצר'); });
    }
    const find = page.locator('#v4StoreFind');
    if (await find.count()) {
      const total = await page.locator('.v4-item').count();
      if (total > 3) {
        // a word from one product that some other product doesn't have, so a working filter must hide something
        const word = await page.evaluate(() => {
          const items = [...document.querySelectorAll('.v4-item')].map(i => i.textContent);
          const words = (document.querySelector('.v4-item__name') || {}).textContent || '';
          return words.trim().split(/\s+/).find(w => w.length > 1 && items.some(t => t.indexOf(w) === -1)) || '';
        });
        if (!word) return ok.push(path);
        await find.fill(word);
        await page.waitForTimeout(300);
        const visible = await page.evaluate(() => [...document.querySelectorAll('.v4-item')].filter(i => getComputedStyle(i).display !== 'none').length);
        if (!(visible > 0 && visible < total)) fail(path, `החיפוש בחנות לא סינן ("${word}": ${visible}/${total})`);
      }
    }
    const own = errors.filter(e => !/fbq|gtag|clarity|googletag/i.test(e));
    if (own.length) fail(path, 'שגיאת סקריפט: ' + own[0]);
    ok.push(path);
  } catch (e) {
    fail(path, String(e.message || e).split('\n')[0]);
  } finally { await ctx.close(); }
}

// full flow on the store with sized items: pick a size, add, the card/toast/window show it,
// the product page opens on that size, its own buttons add, the cart links back to that size
async function fullFlow(browser, path) {
  const { ctx, page } = await newPage(browser);
  const where = path + ' (זרימה מלאה)';
  try {
    await page.goto(`${BASE}${path}?${bust()}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const pick = page.locator('article.v4-item button.v4-item__pick').first();
    if (!(await pick.count())) return fail(where, 'אין בחנות מוצר עם בחירת מידה לבדיקה');
    const art = pick.locator('xpath=ancestor::article[1]');
    await pick.scrollIntoViewIfNeeded();
    await pick.click({ timeout: 8000 });
    await page.waitForSelector('#v4MChips .v4-chip', { timeout: 4000 });
    const chips = page.locator('#v4MChips .v4-chip');
    const idx = (await chips.count()) > 1 ? 1 : 0;
    const label = (await chips.nth(idx).locator('span').first().textContent()).trim();
    await chips.nth(idx).click();
    const name = await page.locator('#v4MName').textContent();
    if (!name.includes(label)) fail(where, `בחירת "${label}" לא עדכנה את שם המוצר בחלון`);
    await page.locator('.v4-modal__qty [data-q="1"]').click();
    await page.locator('#v4MAdd').click();
    await page.waitForFunction(() => document.getElementById('v4Modal').hidden, null, { timeout: 3000 }).catch(() => fail(where, 'החלון לא נסגר אחרי הוספה'));
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('ym_cart') || '[]'));
    const line = cart.find(l => l.name && l.name.includes(label));
    if (!line || line.quantity !== 2) fail(where, `הסל לא קיבל 2 יח' של "${label}" (${JSON.stringify(cart.map(l => [l.name, l.quantity]))})`);
    const pill = (await art.locator('button.v4-item__pick').textContent()).trim();
    if (!/✓\s*2\s*בסל/.test(pill)) fail(where, `הכרטיס לא מראה את מה שבסל (מופיע: "${pill}")`);
    const toast = await page.locator('.toast.show').count();
    if (!toast) fail(where, 'לא הופיעה הודעת "נוסף לסל"');
    await pick.click();
    await page.waitForSelector('#v4MChips .v4-chip', { timeout: 4000 });
    const chipText = await chips.nth(idx).textContent();
    if (!/2\s*בסל/.test(chipText)) fail(where, `החלון לא מראה כמה מ-"${label}" כבר בסל`);
    await chips.nth(idx).click();
    const more = await page.locator('#v4MMore').getAttribute('href');
    if (!more || !more.includes('#size=')) fail(where, `"כל הפרטים" לא נושא את המידה (${more})`);
    await page.goto(new URL(more, BASE).toString().replace('#', `?${bust()}#`), { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(500);
    const shown = (await page.locator('#variantLabel').textContent().catch(() => '')).trim();
    if (shown !== label) fail(where, `דף המוצר נפתח על "${shown}" במקום "${label}"`);
    const row = page.locator('.vrow', { has: page.locator('.vrow__label', { hasText: new RegExp('^\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$') }) }).first();
    const qty0 = Number(await row.locator('.vqty').inputValue());
    if (qty0 !== 2) fail(where, `דף המוצר לא מראה את 2 היח' שבסל (מופיע ${qty0})`);
    await row.locator('.vqty-inc').click();
    await page.waitForTimeout(300);
    const qty1 = Number(await row.locator('.vqty').inputValue());
    if (qty1 !== 3) fail(where, `+ בדף המוצר לא הוסיף (מופיע ${qty1})`);
    await page.goto(`${BASE}/cart.html?${bust()}`, { waitUntil: 'load', timeout: 45000 });
    const link = await page.locator('.cart-item__name a').first().getAttribute('href').catch(() => null);
    if (!link || !link.includes('#size=')) fail(where, `הקישור מהסל למוצר לא נושא את המידה (${link})`);
    ok.push(where);
  } catch (e) {
    fail(where, String(e.message || e).split('\n')[0]);
  } finally { await ctx.close(); }
}

// + and − on a plain item
async function plusMinus(browser, path) {
  const { ctx, page } = await newPage(browser);
  const where = path + ' (+/−)';
  try {
    await page.goto(`${BASE}${path}?${bust()}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const ctl = page.locator('.v4-item__ctl').first();
    if (!(await ctl.count())) return;
    await ctl.scrollIntoViewIfNeeded();
    await ctl.locator('.v4-q--plus').click({ timeout: 8000 });
    await ctl.locator('.v4-q--plus').click();
    let n = (await ctl.locator('.v4-q__n').textContent()).trim();
    if (n !== '2') fail(where, `+ פעמיים הראה ${n}`);
    await ctl.locator('.v4-q--minus').click();
    n = (await ctl.locator('.v4-q__n').textContent()).trim();
    if (n !== '1') fail(where, `− הראה ${n}`);
    const bar = await page.locator('#v4Cartbar').isVisible();
    if (!bar) fail(where, 'פס הסל לא הופיע');
    ok.push(where);
  } catch (e) {
    fail(where, String(e.message || e).split('\n')[0]);
  } finally { await ctx.close(); }
}

const browser = await chromium.launch();
try {
  const all = storePaths();
  if (!all.length) throw new Error('no store pages found under category/');
  const FULL = '/category/safety-ppe-equipment-for-business/';
  await fullFlow(browser, FULL);
  await plusMinus(browser, FULL);
  const queue = all.slice();
  const workers = Array.from({ length: 4 }, async () => { while (queue.length) await lightCheck(browser, queue.shift()); });
  await Promise.all(workers);
} finally { await browser.close(); }

// ---- what the robot learned: suggestions to make the stores better ----
// The runner sits abroad, so absolute times are pessimistic for Israel — the ranking (which
// stores are slowest/heaviest) is the useful part; thresholds are set with that in mind.
const sec = ms => (ms / 1000).toFixed(1) + 'ש׳';
const name = p => { let d = p; try { d = decodeURIComponent(p); } catch {} return d.replace(/^\/category\//, '').replace(/\/$/, ''); };
const median = a => { const v = a.filter(x => x > 0).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : 0; };
const ideas = [];
const slow = metrics.filter(x => x.lcp > 3000).sort((a, b) => b.lcp - a.lcp);
if (slow.length) ideas.push(`${slow.length} חנויות מציגות את התוכן הראשי אחרי יותר מ-3 שניות. האיטיות: ${slow.slice(0, 3).map(x => `${name(x.path)} ${sec(x.lcp)}`).join(', ')}. כדאי לבדוק את גודל התמונות הראשונות בעמוד.`);
const heavy = metrics.filter(x => x.kb > 2500).sort((a, b) => b.kb - a.kb);
if (heavy.length) ideas.push(`${heavy.length} חנויות שוקלות יותר מ-2.5MB בטעינה הראשונה. הכבדות: ${heavy.slice(0, 3).map(x => `${name(x.path)} ${(x.kb / 1024).toFixed(1)}MB`).join(', ')}. כדאי לבדוק תמונות שלא עברו דחיסה.`);
const shifty = metrics.filter(x => x.cls > 0.1).sort((a, b) => b.cls - a.cls);
if (shifty.length) ideas.push(`${shifty.length} חנויות זזות בזמן הטעינה (CLS מעל 0.1): ${shifty.slice(0, 3).map(x => `${name(x.path)} ${x.cls}`).join(', ')}. כדאי לבדוק מידות קבועות לתמונות ולבאנרים, כדי שלא יקפצו מתחת לאצבע.`);
const broken = metrics.filter(x => x.broken > 0);
if (broken.length) ideas.push(`תמונות שבורות ב-${broken.length} חנויות: ${broken.slice(0, 3).map(x => `${name(x.path)} (${x.brokenSrc.join(', ')})`).join('; ')}.`);
const slowModal = metrics.filter(x => x.modalMs > 600).sort((a, b) => b.modalMs - a.modalMs);
if (slowModal.length) ideas.push(`חלון המוצר נפתח לאט (מעל 0.6 שניות) ב-${slowModal.length} חנויות: ${slowModal.slice(0, 3).map(x => `${name(x.path)} ${sec(x.modalMs)}`).join(', ')}.`);
const stats = {
  pages: metrics.length, ok: ok.length, failed: fails.length,
  medianLcp: median(metrics.map(x => x.lcp)), medianKb: median(metrics.map(x => x.kb)),
  medianModalMs: median(metrics.map(x => x.modalMs || 0)),
  slowest: [...metrics].sort((a, b) => b.lcp - a.lcp).slice(0, 5).map(x => ({ path: x.path, lcp: x.lcp, kb: x.kb })),
};
writeFileSync('robot-report.json', JSON.stringify({ failures: fails, suggestions: ideas, stats }, null, 1));
if (ideas.length) console.log('\nSUGGESTIONS\n' + ideas.map(i => '• ' + i).join('\n'));
console.log(`\nחציון: תוכן ראשי ${sec(stats.medianLcp)} · ${stats.medianKb}KB · חלון מוצר ${stats.medianModalMs}ms`);

console.log(`\n${ok.length} תקין · ${fails.length} נכשל`);
if (fails.length) {
  console.log('\nFAILURES\n' + fails.join('\n'));
  process.exitCode = 1;
}
