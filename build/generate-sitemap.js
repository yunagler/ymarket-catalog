#!/usr/bin/env node
/**
 * Generate sitemap.xml for ymarket.co.il
 * Scans all HTML files and product pages
 *
 * Usage: node build/generate-sitemap.js
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
      // Skip build, node_modules, images, css, js, data directories
      if (['build', 'node_modules', 'images', 'css', 'js', 'data', '.git'].includes(entry.name)) continue;
      files.push(...getAllHtmlFiles(fullPath, relPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(relPath);
    }
  }
  return files;
}

function getPriority(filePath) {
  if (filePath === 'index.html') return '1.0';
  if (filePath === 'catalog.html') return '0.9';
  if (filePath.startsWith('category/')) return '0.85';
  if (filePath.startsWith('products/')) return '0.7';
  if (['about.html', 'contact.html', 'faq.html'].includes(filePath)) return '0.8';
  if (filePath.startsWith('blog/')) return '0.6';
  if (filePath.startsWith('legal/')) return '0.3';
  return '0.5';
}

function getChangeFreq(filePath) {
  if (filePath === 'index.html') return 'weekly';
  if (filePath === 'catalog.html') return 'weekly';
  if (filePath.startsWith('category/')) return 'weekly';
  if (filePath.startsWith('products/')) return 'monthly';
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
    const url = file === 'index.html' ? SITE_URL + '/' : `${SITE_URL}/${file}`;
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
