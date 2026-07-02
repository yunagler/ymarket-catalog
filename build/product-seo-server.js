#!/usr/bin/env node
/**
 * Product SEO Management Server
 * API + UI for managing SEO data per product
 * Saves to products.json so generate-products.js picks it up
 *
 * Usage: node product-seo-server.js
 * URL: http://localhost:8877
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8878;
const DATA_PATH = path.join(__dirname, '..', 'data', 'products.json');
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');

let data = null;

function loadData() {
  data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  return data;
}

function saveData() {
  // Create backup before saving
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.copyFileSync(DATA_PATH, path.join(BACKUP_DIR, `products_${timestamp}.json`));

  // Clean old backups (keep last 10)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('products_'))
    .sort()
    .reverse();
  for (const old of backups.slice(10)) {
    fs.unlinkSync(path.join(BACKUP_DIR, old));
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Auto-generate SEO content for a product
function generateSeo(product, categories) {
  const cat = categories.find(c => c.slug === product.categorySlug);
  const categoryName = product.categoryName || (cat ? cat.name : '');
  const name = product.name || '';

  // Build smart title (max ~60 chars)
  let title = `${name}`;
  if (categoryName && title.length + categoryName.length < 50) {
    title += ` - ${categoryName}`;
  }
  title += ' | וואי מרקט';
  if (title.length > 70) title = `${name} | וואי מרקט`;

  // H1 - product name, possibly enriched
  const h1 = name;

  // Meta description (max ~155 chars)
  const parts = [name];
  if (categoryName) parts.push(categoryName);
  if (product.unit) {
    const unitStr = product.unitsPerPack > 1 ? `${product.unitsPerPack} ${product.unit}` : product.unit;
    parts.push(unitStr);
  }
  let metaDesc = parts.join(' - ') + '. מחירי סיטונאות, משלוח ארצי. וואי מרקט - אספקה חכמה לעסקים ומוסדות.';
  if (metaDesc.length > 160) {
    metaDesc = `${name} - ${categoryName}. מחירי סיטונאות, משלוח ארצי. וואי מרקט - אספקה לעסקים ומוסדות.`;
  }
  if (metaDesc.length > 160) {
    metaDesc = `${name} במחירי סיטונאות. משלוח ארצי, שירות אישי. וואי מרקט.`;
  }

  // Specs from available data
  const specs = [];
  if (product.partNumber) specs.push({ label: 'מק"ט', value: product.partNumber });
  if (product.barcode) specs.push({ label: 'ברקוד', value: product.barcode });
  if (product.unit) {
    const unitStr = product.unitsPerPack > 1 ? `${product.unitsPerPack} ${product.unit}` : product.unit;
    specs.push({ label: 'אריזה', value: unitStr });
  }
  if (product.leadTimeDays) specs.push({ label: 'זמן אספקה', value: `${product.leadTimeDays} ימי עסקים` });

  // Bulk CTA
  const bulkCta = {
    title: 'צריכים כמות גדולה?',
    text: `קבלו הצעת מחיר מותאמת ל${name} עם הנחת כמות`,
    waText: `היי, אני מעוניין בהצעת מחיר ל${name} בכמות גדולה`
  };

  return { title, h1, metaDesc, specs, bulkCta };
}

// Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function handleApi(req, res, pathname) {
  const items = data.items || [];
  const categories = data.categories || [];

  // GET /api/stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    const withSeo = items.filter(i => i.seo).length;
    const byCat = {};
    for (const item of items) {
      const cat = item.categoryName || 'ללא קטגוריה';
      if (!byCat[cat]) byCat[cat] = { total: 0, withSeo: 0 };
      byCat[cat].total++;
      if (item.seo) byCat[cat].withSeo++;
    }
    return sendJson(res, { total: items.length, withSeo, withoutSeo: items.length - withSeo, byCategory: byCat });
  }

  // GET /api/products?page=1&limit=50&filter=all|with_seo|without_seo&category=slug&search=text
  if (pathname === '/api/products' && req.method === 'GET') {
    const params = new URL(req.url, `http://localhost:${PORT}`).searchParams;
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '50');
    const filter = params.get('filter') || 'all';
    const category = params.get('category') || '';
    const search = (params.get('search') || '').toLowerCase();

    let filtered = [...items];
    if (filter === 'with_seo') filtered = filtered.filter(i => i.seo);
    if (filter === 'without_seo') filtered = filtered.filter(i => !i.seo);
    if (category) filtered = filtered.filter(i => i.categorySlug === category);
    if (search) filtered = filtered.filter(i =>
      (i.name || '').toLowerCase().includes(search) ||
      (i.partNumber || '').toLowerCase().includes(search) ||
      String(i.id).includes(search)
    );

    const total = filtered.length;
    const start = (page - 1) * limit;
    const pageItems = filtered.slice(start, start + limit).map(i => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      categoryName: i.categoryName,
      categorySlug: i.categorySlug,
      partNumber: i.partNumber,
      saleNis: i.saleNis,
      imageUrl: i.imageUrl,
      hasSeo: !!i.seo,
      seo: i.seo || null
    }));

    return sendJson(res, { items: pageItems, total, page, limit, pages: Math.ceil(total / limit) });
  }

  // GET /api/products/:id
  const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (productMatch && req.method === 'GET') {
    const id = parseInt(productMatch[1]);
    const product = items.find(i => i.id === id);
    if (!product) return sendJson(res, { error: 'Product not found' }, 404);
    return sendJson(res, product);
  }

  // PUT /api/products/:id/seo
  const seoMatch = pathname.match(/^\/api\/products\/(\d+)\/seo$/);
  if (seoMatch && req.method === 'PUT') {
    const id = parseInt(seoMatch[1]);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return sendJson(res, { error: 'Product not found' }, 404);
    const body = await parseBody(req);
    data.items[idx].seo = body;
    saveData();
    return sendJson(res, { success: true, seo: body });
  }

  // DELETE /api/products/:id/seo
  if (seoMatch && req.method === 'DELETE') {
    const id = parseInt(seoMatch[1]);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return sendJson(res, { error: 'Product not found' }, 404);
    delete data.items[idx].seo;
    saveData();
    return sendJson(res, { success: true });
  }

  // POST /api/products/:id/generate-seo
  const genMatch = pathname.match(/^\/api\/products\/(\d+)\/generate-seo$/);
  if (genMatch && req.method === 'POST') {
    const id = parseInt(genMatch[1]);
    const product = items.find(i => i.id === id);
    if (!product) return sendJson(res, { error: 'Product not found' }, 404);
    const seo = generateSeo(product, categories);
    return sendJson(res, seo);
  }

  // POST /api/bulk-generate - generate + save SEO for products without it
  if (pathname === '/api/bulk-generate' && req.method === 'POST') {
    const body = await parseBody(req);
    const overwrite = body.overwrite || false;
    const categoryFilter = body.category || '';
    let count = 0;
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!overwrite && item.seo) continue;
      if (categoryFilter && item.categorySlug !== categoryFilter) continue;
      data.items[i].seo = generateSeo(item, categories);
      count++;
    }
    if (count > 0) saveData();
    return sendJson(res, { success: true, generated: count });
  }

  // POST /api/bulk-update - update specific SEO field for multiple products
  if (pathname === '/api/bulk-update' && req.method === 'POST') {
    const body = await parseBody(req);
    const { ids, field, value } = body;
    if (!ids || !field) return sendJson(res, { error: 'ids and field required' }, 400);
    let count = 0;
    for (const id of ids) {
      const idx = data.items.findIndex(i => i.id === id);
      if (idx === -1) continue;
      if (!data.items[idx].seo) data.items[idx].seo = generateSeo(data.items[idx], categories);
      if (field === 'bulkCta') {
        data.items[idx].seo.bulkCta = value;
      } else {
        data.items[idx].seo[field] = value;
      }
      count++;
    }
    if (count > 0) saveData();
    return sendJson(res, { success: true, updated: count });
  }

  // GET /api/categories
  if (pathname === '/api/categories' && req.method === 'GET') {
    const cats = categories.map(c => ({ slug: c.slug, name: c.name, id: c.id, parentId: c.parentId }));
    return sendJson(res, cats);
  }

  return sendJson(res, { error: 'Not found' }, 404);
}

// Serve the UI
function serveUI(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHtml());
}

function getHtml() {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SEO Manager - וואי מרקט</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Heebo', sans-serif; background: #f1f5f9; color: #1e293b; }
.header { background: #1B3A5C; color: #fff; padding: 16px 24px; display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 100; }
.header h1 { font-size: 1.3rem; font-weight: 600; }
.header .stats { margin-right: auto; display: flex; gap: 20px; font-size: 0.9rem; opacity: 0.9; }
.header .stats span { display: flex; align-items: center; gap: 6px; }
.container { max-width: 1400px; margin: 0 auto; padding: 20px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.toolbar input, .toolbar select { padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.9rem; }
.toolbar input[type=search] { width: 280px; }
.btn { padding: 8px 18px; border: none; border-radius: 8px; font-family: inherit; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
.btn-primary { background: #1B3A5C; color: #fff; }
.btn-primary:hover { background: #112A45; }
.btn-success { background: #16a34a; color: #fff; }
.btn-success:hover { background: #15803d; }
.btn-warning { background: #f59e0b; color: #fff; }
.btn-warning:hover { background: #d97706; }
.btn-danger { background: #dc2626; color: #fff; }
.btn-danger:hover { background: #b91c1c; }
.btn-outline { background: #fff; color: #1B3A5C; border: 1px solid #1B3A5C; }
.btn-outline:hover { background: #f0f7ff; }
.btn-sm { padding: 5px 12px; font-size: 0.82rem; }

.table-wrap { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { background: #f8fafc; padding: 12px 14px; text-align: right; font-weight: 600; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }
tr:hover { background: #f8fafc; }
.seo-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.seo-yes { background: #dcfce7; color: #16a34a; }
.seo-no { background: #fef2f2; color: #dc2626; }
.product-img { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
.pagination { display: flex; gap: 8px; justify-content: center; margin-top: 20px; align-items: center; }
.pagination button { padding: 6px 14px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; font-family: inherit; }
.pagination button.active { background: #1B3A5C; color: #fff; border-color: #1B3A5C; }
.pagination button:disabled { opacity: 0.5; cursor: default; }

/* Modal */
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; justify-content: center; align-items: flex-start; padding-top: 40px; overflow-y: auto; }
.modal-overlay.active { display: flex; }
.modal { background: #fff; border-radius: 16px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; margin-bottom: 40px; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #fff; border-radius: 16px 16px 0 0; z-index: 10; }
.modal-header h2 { font-size: 1.1rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
.modal-body { padding: 24px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem; color: #374151; }
.form-group label small { font-weight: 400; color: #9ca3af; }
.form-group input, .form-group textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.9rem; }
.form-group textarea { min-height: 80px; resize: vertical; }
.form-group .char-count { text-align: left; font-size: 0.78rem; color: #9ca3af; margin-top: 4px; }
.form-group .char-count.warn { color: #f59e0b; }
.form-group .char-count.over { color: #dc2626; }

.specs-editor { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
.spec-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.spec-row input { flex: 1; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.85rem; }
.spec-row button { padding: 4px 8px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-start; position: sticky; bottom: 0; background: #fff; border-radius: 0 0 16px 16px; }

.preview-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-top: 12px; }
.preview-box .google-preview { font-family: Arial, sans-serif; }
.preview-box .google-title { color: #1a0dab; font-size: 18px; font-weight: 400; margin-bottom: 4px; cursor: pointer; }
.preview-box .google-url { color: #006621; font-size: 14px; margin-bottom: 4px; direction: ltr; text-align: left; }
.preview-box .google-desc { color: #545454; font-size: 13px; line-height: 1.5; }

.progress-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin: 8px 0; }
.progress-bar .fill { height: 100%; background: #16a34a; transition: width 0.3s; border-radius: 3px; }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; background: #1e293b; color: #fff; border-radius: 10px; font-size: 0.9rem; z-index: 300; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.toast.show { opacity: 1; }
</style>
</head>
<body>

<div class="header">
  <i class="fas fa-search-dollar" style="font-size:1.5rem;"></i>
  <h1>Product SEO Manager</h1>
  <div class="stats">
    <span id="statsTotal"><i class="fas fa-box"></i> --</span>
    <span id="statsWithSeo"><i class="fas fa-check-circle" style="color:#4ade80"></i> --</span>
    <span id="statsWithoutSeo"><i class="fas fa-times-circle" style="color:#f87171"></i> --</span>
  </div>
</div>

<div class="container">
  <div class="toolbar">
    <input type="search" id="searchInput" placeholder="חיפוש מוצר (שם, מק&quot;ט, ID)..." oninput="debounceSearch()">
    <select id="filterSelect" onchange="loadProducts()">
      <option value="all">הכל</option>
      <option value="without_seo">ללא SEO</option>
      <option value="with_seo">עם SEO</option>
    </select>
    <select id="categorySelect" onchange="loadProducts()">
      <option value="">כל הקטגוריות</option>
    </select>
    <div style="margin-right:auto"></div>
    <button class="btn btn-success" onclick="bulkGenerate(false)"><i class="fas fa-magic"></i> יצירת SEO אוטומטי (חסרים)</button>
    <button class="btn btn-warning" onclick="if(confirm('לדרוס SEO קיים לכל המוצרים?')) bulkGenerate(true)"><i class="fas fa-sync"></i> ריענון הכל</button>
    <button class="btn btn-primary" onclick="runBuild()"><i class="fas fa-hammer"></i> Build Pages</button>
  </div>

  <div class="progress-bar" id="progressBar" style="display:none"><div class="fill" id="progressFill"></div></div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:50px"></th>
          <th>מוצר</th>
          <th>קטגוריה</th>
          <th>מק"ט</th>
          <th>מחיר</th>
          <th>SEO</th>
          <th>Title</th>
          <th style="width:140px">פעולות</th>
        </tr>
      </thead>
      <tbody id="productsBody"></tbody>
    </table>
  </div>

  <div class="pagination" id="pagination"></div>
</div>

<!-- Edit Modal -->
<div class="modal-overlay" id="editModal">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modalTitle">עריכת SEO</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;gap:16px;margin-bottom:20px;align-items:center;">
        <img id="modalImg" src="" style="width:60px;height:60px;border-radius:8px;object-fit:cover;">
        <div>
          <div id="modalProductName" style="font-weight:600;font-size:1.05rem;"></div>
          <div id="modalProductInfo" style="color:#64748b;font-size:0.85rem;"></div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-right:auto;" onclick="generateForCurrent()"><i class="fas fa-magic"></i> יצירה אוטומטית</button>
      </div>

      <div class="form-group">
        <label>Title <small>(60-70 תווים)</small></label>
        <input type="text" id="seoTitle" oninput="updateCharCount(this, 70); updatePreview()">
        <div class="char-count" id="seoTitleCount"></div>
      </div>

      <div class="form-group">
        <label>H1</label>
        <input type="text" id="seoH1" oninput="updatePreview()">
      </div>

      <div class="form-group">
        <label>Meta Description <small>(150-160 תווים)</small></label>
        <textarea id="seoMetaDesc" rows="3" oninput="updateCharCount(this, 160); updatePreview()"></textarea>
        <div class="char-count" id="seoMetaDescCount"></div>
      </div>

      <div class="preview-box">
        <div style="font-size:0.8rem;font-weight:600;color:#64748b;margin-bottom:8px;">תצוגה מקדימה בגוגל:</div>
        <div class="google-preview">
          <div class="google-title" id="previewTitle"></div>
          <div class="google-url" id="previewUrl"></div>
          <div class="google-desc" id="previewDesc"></div>
        </div>
      </div>

      <div class="form-group" style="margin-top:18px;">
        <label>מפרט טכני (Specs)</label>
        <div class="specs-editor" id="specsEditor"></div>
        <button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="addSpec()"><i class="fas fa-plus"></i> הוסף שורה</button>
      </div>

      <div class="form-group">
        <label>Bulk CTA - כותרת</label>
        <input type="text" id="bulkCtaTitle" placeholder="צריכים כמות גדולה?">
      </div>
      <div class="form-group">
        <label>Bulk CTA - טקסט</label>
        <input type="text" id="bulkCtaText" placeholder="קבלו הצעת מחיר מותאמת עם הנחת כמות">
      </div>
      <div class="form-group">
        <label>Bulk CTA - הודעת WhatsApp</label>
        <input type="text" id="bulkCtaWaText" placeholder="היי, אני מעוניין בהצעת מחיר ל...">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveSeo()"><i class="fas fa-save"></i> שמירה</button>
      <button class="btn btn-outline" onclick="closeModal()">ביטול</button>
      <button class="btn btn-danger btn-sm" style="margin-right:auto;" onclick="deleteSeo()"><i class="fas fa-trash"></i> מחק SEO</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let currentProductId = null;
let searchTimer = null;
let currentPage = 1;

async function api(path, options = {}) {
  const res = await fetch('/api/' + path.replace(/^\\/api\\//, ''), options);
  return res.json();
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadProducts(); }, 300);
}

async function loadStats() {
  const stats = await api('stats');
  document.getElementById('statsTotal').innerHTML = '<i class="fas fa-box"></i> ' + stats.total + ' מוצרים';
  document.getElementById('statsWithSeo').innerHTML = '<i class="fas fa-check-circle" style="color:#4ade80"></i> ' + stats.withSeo + ' עם SEO';
  document.getElementById('statsWithoutSeo').innerHTML = '<i class="fas fa-times-circle" style="color:#f87171"></i> ' + stats.withoutSeo + ' ללא SEO';
}

async function loadCategories() {
  const cats = await api('categories');
  const select = document.getElementById('categorySelect');
  const parentCats = cats.filter(c => !c.parentId);
  const childCats = cats.filter(c => c.parentId);
  for (const cat of parentCats) {
    select.innerHTML += '<option value="' + cat.slug + '">' + cat.name + '</option>';
    const children = childCats.filter(c => c.parentId === cat.id);
    for (const child of children) {
      select.innerHTML += '<option value="' + child.slug + '">&nbsp;&nbsp;' + child.name + '</option>';
    }
  }
}

async function loadProducts() {
  const search = document.getElementById('searchInput').value;
  const filter = document.getElementById('filterSelect').value;
  const category = document.getElementById('categorySelect').value;
  const result = await api('products?page=' + currentPage + '&limit=50&filter=' + filter + '&category=' + encodeURIComponent(category) + '&search=' + encodeURIComponent(search));

  const tbody = document.getElementById('productsBody');
  tbody.innerHTML = '';

  for (const item of result.items) {
    const imgSrc = item.imageUrl || '/items/' + item.id + '.jpg';
    const seoTitle = item.seo ? item.seo.title : '';
    const truncTitle = seoTitle.length > 40 ? seoTitle.substring(0, 40) + '...' : seoTitle;
    tbody.innerHTML += '<tr>' +
      '<td><img class="product-img" src="' + imgSrc + '" onerror="this.src=\\'https://placehold.co/40x40/f0f2f5/5a6577?text=?\\'"></td>' +
      '<td><strong>' + (item.name || '') + '</strong><br><small style="color:#9ca3af">ID: ' + item.id + '</small></td>' +
      '<td>' + (item.categoryName || '') + '</td>' +
      '<td>' + (item.partNumber || '-') + '</td>' +
      '<td>' + (item.saleNis ? '\\u20aa' + item.saleNis : '-') + '</td>' +
      '<td><span class="seo-badge ' + (item.hasSeo ? 'seo-yes' : 'seo-no') + '">' + (item.hasSeo ? 'V' : 'X') + '</span></td>' +
      '<td style="font-size:0.8rem;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + truncTitle + '</td>' +
      '<td>' +
        '<button class="btn btn-primary btn-sm" onclick="editProduct(' + item.id + ')"><i class="fas fa-edit"></i></button> ' +
        '<button class="btn btn-outline btn-sm" onclick="quickGenerate(' + item.id + ')"><i class="fas fa-magic"></i></button>' +
      '</td>' +
      '</tr>';
  }

  // Pagination
  const pag = document.getElementById('pagination');
  pag.innerHTML = '';
  if (result.pages > 1) {
    pag.innerHTML += '<button ' + (currentPage <= 1 ? 'disabled' : '') + ' onclick="goPage(' + (currentPage - 1) + ')"><i class="fas fa-chevron-right"></i></button>';
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(result.pages, currentPage + 3);
    for (let i = start; i <= end; i++) {
      pag.innerHTML += '<button class="' + (i === currentPage ? 'active' : '') + '" onclick="goPage(' + i + ')">' + i + '</button>';
    }
    pag.innerHTML += '<button ' + (currentPage >= result.pages ? 'disabled' : '') + ' onclick="goPage(' + (currentPage + 1) + ')"><i class="fas fa-chevron-left"></i></button>';
    pag.innerHTML += '<span style="color:#64748b;font-size:0.85rem;">עמוד ' + currentPage + ' מתוך ' + result.pages + ' (' + result.total + ' מוצרים)</span>';
  }
}

function goPage(p) {
  currentPage = p;
  loadProducts();
}

async function editProduct(id) {
  currentProductId = id;
  const product = await api('products/' + id);

  document.getElementById('modalTitle').textContent = 'עריכת SEO - ' + product.name;
  document.getElementById('modalImg').src = product.imageUrl || '/items/' + id + '.jpg';
  document.getElementById('modalProductName').textContent = product.name;
  document.getElementById('modalProductInfo').textContent = (product.categoryName || '') + ' | ' + (product.partNumber || '') + ' | ' + (product.unit || '');

  const seo = product.seo || {};
  document.getElementById('seoTitle').value = seo.title || '';
  document.getElementById('seoH1').value = seo.h1 || '';
  document.getElementById('seoMetaDesc').value = seo.metaDesc || '';
  document.getElementById('bulkCtaTitle').value = (seo.bulkCta || {}).title || '';
  document.getElementById('bulkCtaText').value = (seo.bulkCta || {}).text || '';
  document.getElementById('bulkCtaWaText').value = (seo.bulkCta || {}).waText || '';

  // Specs
  renderSpecs(seo.specs || []);

  updateCharCount(document.getElementById('seoTitle'), 70);
  updateCharCount(document.getElementById('seoMetaDesc'), 160);
  updatePreview();

  document.getElementById('editModal').classList.add('active');
}

function renderSpecs(specs) {
  const editor = document.getElementById('specsEditor');
  editor.innerHTML = '';
  for (const spec of specs) {
    addSpecRow(spec.label, spec.value);
  }
  if (specs.length === 0) addSpecRow('', '');
}

function addSpecRow(label, value) {
  const editor = document.getElementById('specsEditor');
  const row = document.createElement('div');
  row.className = 'spec-row';
  row.innerHTML = '<input type="text" placeholder="שם" value="' + (label || '') + '">' +
    '<input type="text" placeholder="ערך" value="' + (value || '') + '">' +
    '<button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
  editor.appendChild(row);
}

function addSpec() { addSpecRow('', ''); }

function getSpecs() {
  const rows = document.querySelectorAll('#specsEditor .spec-row');
  const specs = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0].value.trim() && inputs[1].value.trim()) {
      specs.push({ label: inputs[0].value.trim(), value: inputs[1].value.trim() });
    }
  });
  return specs;
}

function getSeoData() {
  const seo = {
    title: document.getElementById('seoTitle').value,
    h1: document.getElementById('seoH1').value,
    metaDesc: document.getElementById('seoMetaDesc').value,
    specs: getSpecs()
  };
  const ctaTitle = document.getElementById('bulkCtaTitle').value;
  const ctaText = document.getElementById('bulkCtaText').value;
  const ctaWa = document.getElementById('bulkCtaWaText').value;
  if (ctaTitle || ctaText || ctaWa) {
    seo.bulkCta = { title: ctaTitle, text: ctaText, waText: ctaWa };
  }
  return seo;
}

async function saveSeo() {
  if (!currentProductId) return;
  const seo = getSeoData();
  await api('products/' + currentProductId + '/seo', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seo)
  });
  showToast('SEO saved!');
  closeModal();
  loadProducts();
  loadStats();
}

async function deleteSeo() {
  if (!currentProductId || !confirm('למחוק את נתוני ה-SEO למוצר זה?')) return;
  await api('products/' + currentProductId + '/seo', { method: 'DELETE' });
  showToast('SEO deleted');
  closeModal();
  loadProducts();
  loadStats();
}

async function generateForCurrent() {
  if (!currentProductId) return;
  const seo = await api('products/' + currentProductId + '/generate-seo', { method: 'POST' });
  document.getElementById('seoTitle').value = seo.title || '';
  document.getElementById('seoH1').value = seo.h1 || '';
  document.getElementById('seoMetaDesc').value = seo.metaDesc || '';
  document.getElementById('bulkCtaTitle').value = (seo.bulkCta || {}).title || '';
  document.getElementById('bulkCtaText').value = (seo.bulkCta || {}).text || '';
  document.getElementById('bulkCtaWaText').value = (seo.bulkCta || {}).waText || '';
  renderSpecs(seo.specs || []);
  updateCharCount(document.getElementById('seoTitle'), 70);
  updateCharCount(document.getElementById('seoMetaDesc'), 160);
  updatePreview();
  showToast('SEO generated - review and save');
}

async function quickGenerate(id) {
  const seo = await api('products/' + id + '/generate-seo', { method: 'POST' });
  await api('products/' + id + '/seo', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seo)
  });
  showToast('SEO generated & saved for product ' + id);
  loadProducts();
  loadStats();
}

async function bulkGenerate(overwrite) {
  const category = document.getElementById('categorySelect').value;
  showProgress(true);
  const result = await api('bulk-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overwrite, category })
  });
  showProgress(false);
  showToast(result.generated + ' products updated');
  loadProducts();
  loadStats();
}

async function runBuild() {
  showToast('Running build... (check terminal)');
  // The build is run from terminal, just notify
  try {
    const res = await fetch('/api/build', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Build complete!');
  } catch(e) {
    showToast('Run manually: node generate-products.js');
  }
}

function closeModal() {
  document.getElementById('editModal').classList.remove('active');
  currentProductId = null;
}

function updateCharCount(el, max) {
  const len = el.value.length;
  const countEl = el.parentElement.querySelector('.char-count');
  if (!countEl) return;
  countEl.textContent = len + '/' + max;
  countEl.className = 'char-count' + (len > max ? ' over' : len > max * 0.9 ? ' warn' : '');
}

function updatePreview() {
  const title = document.getElementById('seoTitle').value || 'כותרת המוצר | וואי מרקט';
  const desc = document.getElementById('seoMetaDesc').value || 'תיאור המוצר...';
  const slug = currentProductId ? '' : '';
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewUrl').textContent = 'https://ymarket.co.il/products/...';
  document.getElementById('previewDesc').textContent = desc;
}

function showProgress(show) {
  const bar = document.getElementById('progressBar');
  const fill = document.getElementById('progressFill');
  bar.style.display = show ? 'block' : 'none';
  if (show) { fill.style.width = '0%'; setTimeout(() => fill.style.width = '100%', 50); }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Keyboard shortcut to close modal
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Init
loadStats();
loadCategories();
loadProducts();
</script>
</body>
</html>`;
}

// Main server
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname;

  // Reload data on each request to stay in sync
  loadData();

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    if (pathname.startsWith('/api/')) {
      // Build endpoint
      if (pathname === '/api/build' && req.method === 'POST') {
        const { execSync } = require('child_process');
        try {
          execSync('node generate-products.js', { cwd: __dirname, timeout: 30000 });
          return sendJson(res, { message: 'Build completed successfully!' });
        } catch (e) {
          return sendJson(res, { message: 'Build error: ' + e.message }, 500);
        }
      }
      return await handleApi(req, res, pathname);
    }

    // Serve product images
    if (pathname.startsWith('/items/')) {
      const imgPath = path.join(__dirname, '..', pathname);
      if (fs.existsSync(imgPath)) {
        const ext = path.extname(imgPath).toLowerCase();
        const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        return res.end(fs.readFileSync(imgPath));
      }
    }

    // UI for everything else
    return serveUI(res);
  } catch (err) {
    console.error(err);
    sendJson(res, { error: err.message }, 500);
  }
});

loadData();
server.listen(PORT, () => {
  console.log(`\n  Product SEO Manager running at http://localhost:${PORT}`);
  console.log(`  Products: ${(data.items || []).length}`);
  console.log(`  With SEO: ${(data.items || []).filter(i => i.seo).length}`);
  console.log(`  Categories: ${(data.categories || []).length}\n`);
});
