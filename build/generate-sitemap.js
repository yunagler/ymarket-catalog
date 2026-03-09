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
      if (['build', 'node_modules', 'images', 'css', 'js', 'data', '.git', 'items'].includes(entry.name)) continue;
      files.push(...getAllHtmlFiles(fullPath, relPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(relPath);
    }
  }
  return files;
}

function fileToUrl(filePath) {
  // /products/{slug}/index.html → /products/{slug}/
  // /category/{slug}/index.html → /category/{slug}/
  // index.html → /
  if (filePath === 'index.html') return '/';
  if (filePath.endsWith('/index.html')) {
    return '/' + filePath.replace('/index.html', '/');
  }
  return '/' + filePath;
}

function getPriority(filePath) {
  if (filePath === 'index.html') return '1.0';
  if (filePath === 'catalog.html') return '0.9';
  if (filePath.includes('category/') && filePath.endsWith('index.html')) return '0.85';
  if (filePath.includes('products/') && filePath.endsWith('index.html')) return '0.7';
  if (['about.html', 'contact.html', 'faq.html'].includes(filePath)) return '0.8';
  if (filePath.startsWith('blog/')) return '0.6';
  if (filePath.startsWith('legal/')) return '0.3';
  return '0.5';
}

function getChangeFreq(filePath) {
  if (filePath === 'index.html') return 'weekly';
  if (filePath === 'catalog.html') return 'weekly';
  if (filePath.includes('category/')) return 'weekly';
  if (filePath.includes('products/')) return 'monthly';
  if (filePath.startsWith('blog/')) return 'monthly';
  if (filePath.startsWith('legal/')) return 'yearly';
  return 'monthly';
}

function generateSitemap() {
  const htmlFiles = getAllHtmlFiles(ROOT_DIR);
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const file of htmlFiles) {
    const urlPath = fileToUrl(file);
    // Encode Hebrew chars in URL for sitemap
    const encodedPath = urlPath.split('/').map(part => encodeURIComponent(decodeURIComponent(part))).join('/');
    const url = SITE_URL + encodedPath;
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${getChangeFreq(file)}</changefreq>\n`;
    xml += `    <priority>${getPriority(file)}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += '</urlset>\n';

  const outputPath = path.join(ROOT_DIR, 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`Sitemap generated: ${outputPath}`);
  console.log(`Total URLs: ${htmlFiles.length}`);
}

generateSitemap();
