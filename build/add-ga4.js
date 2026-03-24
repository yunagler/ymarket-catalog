#!/usr/bin/env node
/**
 * Add GA4 tag to ALL HTML pages right after <head> tag
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SKIP_DIRS = ['build', 'node_modules', '.git', 'data', 'fonts'];

const GA4_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MKVGJ3XRK5"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-MKVGJ3XRK5');
</script>`;

function findHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findHtmlFiles(ROOT_DIR);
let updated = 0;
let skipped = 0;
let noHead = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if already has GA4
  if (content.includes('G-MKVGJ3XRK5')) {
    skipped++;
    continue;
  }

  // Find <head> tag and insert GA4 right after it
  const headMatch = content.match(/<head[^>]*>/i);
  if (!headMatch) {
    noHead++;
    console.log(`  NO <head>: ${path.relative(ROOT_DIR, file)}`);
    continue;
  }

  const insertPos = headMatch.index + headMatch[0].length;
  content = content.slice(0, insertPos) + '\n' + GA4_TAG + content.slice(insertPos);

  fs.writeFileSync(file, content, 'utf8');
  updated++;
}

console.log(`\nDone!`);
console.log(`  Updated: ${updated}`);
console.log(`  Already had GA4: ${skipped}`);
console.log(`  No <head> tag: ${noHead}`);
console.log(`  Total files: ${files.length}`);
