#!/usr/bin/env node
/**
 * Generate sitemap.xml for ymarket.co.il
 * Supports clean URLs: /products/{slug}/ and /category/{slug}/
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://ymarket.co.il';
const ROOT_DIR = path.join(__dirname, '..');

function getAllHtmlFiles(dir, base = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (['build', 'node_modules', 'images', 'css', 'js', 'data', '.git', '.claude', 'items', 'fonts', 'backups', 'includes'].includes(entry.name)) continue;
      files.push(...getAllHtmlFiles(fullPath, relPath));
    } else if (entry.name.endsWith('.html')) {
      // Skip "301-equivalent" redirect stubs (meta-refresh + noindex) — e.g. old
      // Hebrew slugs and variant-member URLs that now redirect to a canonical page.
      // Listing noindex redirects in the sitemap dilutes crawl signals.
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (/http-equiv="refresh"/i.test(content)) continue; // any meta-refresh = redirect stub → exclude
      } catch { /* unreadable — include by default */ }
      // Strip .html extension for clean URLs
      const clean = relPath.replace(/\.html$/, '');
      // Real mtime — a sitemap that stamps every URL with today's date teaches
      // Google to ignore lastmod entirely, which costs us recrawls on the pages
      // that genuinely changed.
      let lastmod;
      try {
        lastmod = fs.statSync(fullPath).mtime.toISOString().split('T')[0];
      } catch {
        lastmod = new Date().toISOString().split('T')[0];
      }
      files.push({ file: clean, lastmod });
    }
  }
  return files;
}

function fileToUrl(filePath) {
  // /products/{slug}/index.html → /products/{slug}/
  // /category/{slug}/index.html → /category/{slug}/
  // index.html → /
  if (filePath === 'index') return '/';
  if (filePath.endsWith('/index')) {
    return '/' + filePath.replace('/index', '/');
  }
  return '/' + filePath;
}

function getPriority(filePath) {
  if (filePath === 'index') return '1.0';
  if (filePath === 'catalog') return '0.9';
  if (filePath.includes('category/') && filePath.endsWith('index')) return '0.85';
  if (filePath.includes('products/') && filePath.endsWith('index')) return '0.7';
  if (['about', 'contact', 'faq'].includes(filePath)) return '0.8';
  if (filePath.startsWith('blog/')) return '0.6';
  if (filePath.startsWith('legal/')) return '0.3';
  return '0.5';
}

function getChangeFreq(filePath) {
  if (filePath === 'index') return 'weekly';
  if (filePath === 'catalog') return 'weekly';
  if (filePath.includes('category/')) return 'weekly';
  if (filePath.includes('products/')) return 'monthly';
  if (filePath.startsWith('blog/')) return 'monthly';
  if (filePath.startsWith('legal/')) return 'yearly';
  return 'monthly';
}

function buildXml(entries) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const { file, lastmod } of entries) {
    const urlPath = fileToUrl(file);
    // Encode Hebrew chars in URL for sitemap
    const encodedPath = urlPath.split('/').map(part => encodeURIComponent(decodeURIComponent(part))).join('/');
    const url = SITE_URL + encodedPath;
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${getChangeFreq(file)}</changefreq>\n`;
    xml += `    <priority>${getPriority(file)}</priority>\n`;
    xml += `  </url>\n`;
  }
  xml += '</urlset>\n';
  return xml;
}

function generateSitemap() {
  const htmlFiles = getAllHtmlFiles(ROOT_DIR);

  // Filter out non-content files
  const excludePatterns = ['404', 'gallery', 'login', 'register', 'order-success', 'world-cup', 'search', 'cart', 'checkout', 'tracking', 'index-preview', 'index-preview-v2', 'index-v2', 'site-architecture'];
  const filteredFiles = htmlFiles.filter(({ file }) => !excludePatterns.some(p => file === p || file.startsWith(p + '/')));

  const mainPath = path.join(ROOT_DIR, 'sitemap.xml');
  fs.writeFileSync(mainPath, buildXml(filteredFiles), 'utf-8');
  console.log(`Sitemap generated: ${mainPath}`);
  console.log(`Total URLs: ${filteredFiles.length}`);

  // Dedicated products sitemap. robots.txt advertises this file, so it must be
  // regenerated alongside the main one — a stale copy sends Google to slugs that
  // no longer exist (this is exactly what happened after the Hebrew→seoSlug
  // migration: 813 dead URLs served for two months).
  const productFiles = filteredFiles.filter(({ file }) => file.startsWith('products/'));
  const productsPath = path.join(ROOT_DIR, 'sitemap-products.xml');
  fs.writeFileSync(productsPath, buildXml(productFiles), 'utf-8');
  console.log(`Sitemap generated: ${productsPath}`);
  console.log(`Product URLs: ${productFiles.length}`);
}

generateSitemap();
