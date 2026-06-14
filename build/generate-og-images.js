// Generate lightweight Open Graph preview images (items/og/<name>.jpg) from each
// product image. ~600x600 max, mozjpeg q70 → small files for fast/reliable WhatsApp
// & social link previews, WITHOUT touching the full-res main image (lightbox zoom).
// Idempotent + resumable: skips images already generated (pass --force to rebuild all).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ITEMS = path.join(__dirname, '..', 'items');
const OG = path.join(ITEMS, 'og');
const FORCE = process.argv.includes('--force');
const MAX = 600;

fs.mkdirSync(OG, { recursive: true });
const files = fs.readdirSync(ITEMS).filter(f => /\.jpg$/i.test(f) && fs.statSync(path.join(ITEMS, f)).isFile());

(async () => {
  let done = 0, skip = 0, err = 0, bytesIn = 0, bytesOut = 0;
  for (const f of files) {
    const src = path.join(ITEMS, f);
    const out = path.join(OG, f);
    if (!FORCE && fs.existsSync(out)) { skip++; continue; }
    try {
      await sharp(src)
        .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70, mozjpeg: true })
        .toFile(out);
      bytesIn += fs.statSync(src).size;
      bytesOut += fs.statSync(out).size;
      done++;
      if (done % 100 === 0) console.log('  ...' + done + ' generated');
    } catch (e) { err++; }
  }
  const kb = n => Math.round(n / 1024);
  console.log(`OG done: generated=${done} skipped=${skip} errors=${err}`);
  if (done) console.log(`  avg in=${kb(bytesIn / done)}KB -> out=${kb(bytesOut / done)}KB`);
})();
