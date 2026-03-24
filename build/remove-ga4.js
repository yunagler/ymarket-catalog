#!/usr/bin/env node
/**
 * Remove the injected GA4 tag (G-MKVGJ3XRK5) from ALL HTML pages.
 * The correct GA4 (G-ZSWL6L8MC7) is loaded via analytics.min.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SKIP_DIRS = ['build', 'node_modules', '.git', 'data', 'fonts'];

const GA4_BLOCK = `<!-- Google tag (gtag.js) -->
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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('G-MKVGJ3XRK5')) {
    skipped++;
    continue;
  }

  // Remove the GA4 block with possible variations of whitespace
  let newContent = content.replace(/\n?<!-- Google tag \(gtag\.js\) -->\n<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-MKVGJ3XRK5"><\/script>\n<script>\n\s*window\.dataLayer = window\.dataLayer \|\| \[\];\n\s*function gtag\(\)\{dataLayer\.push\(arguments\);\}\n\s*gtag\('js', new Date\(\)\);\n\s*gtag\('config', 'G-MKVGJ3XRK5'\);\n<\/script>/g, '');

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    updated++;
  } else {
    console.log(`  PATTERN NOT MATCHED: ${path.relative(ROOT_DIR, file)}`);
    skipped++;
  }
}

console.log(`\nDone!`);
console.log(`  Removed GA4 tag from: ${updated} files`);
console.log(`  Skipped: ${skipped} files`);
console.log(`  Total: ${files.length} files`);
