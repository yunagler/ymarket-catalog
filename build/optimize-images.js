#!/usr/bin/env node
/**
 * Image Optimization Script for Y Market Website
 *
 * Scans all JPG files in /items/ directory and creates:
 * 1. WebP version at max 512x512 (quality 80) - for product pages and retina displays
 * 2. Thumbnail WebP at 258x258 (quality 80) - for carousel and catalog cards
 *
 * Original JPG files are kept as fallback.
 *
 * Usage: node build/optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ITEMS_DIR = path.join(__dirname, '..', 'items');
const QUALITY = 80;
const MAX_SIZE = 512;
const THUMB_SIZE = 258;

async function optimizeImage(filePath) {
  const basename = path.basename(filePath, '.jpg');
  const dir = path.dirname(filePath);
  const webpPath = path.join(dir, `${basename}.webp`);
  const thumbPath = path.join(dir, `${basename}-thumb.webp`);

  const originalStats = fs.statSync(filePath);
  const originalSize = originalStats.size;

  const results = { file: basename, originalSize, webpSize: 0, thumbSize: 0, skipped: false };

  try {
    // Create 512x512 WebP
    await sharp(filePath)
      .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(webpPath);

    results.webpSize = fs.statSync(webpPath).size;

    // Create 258x258 thumbnail WebP
    await sharp(filePath)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(thumbPath);

    results.thumbSize = fs.statSync(thumbPath).size;
  } catch (err) {
    console.error(`  ERROR processing ${basename}.jpg: ${err.message}`);
    results.skipped = true;
  }

  return results;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  console.log('=== Y Market Image Optimizer ===\n');
  console.log(`Source directory: ${ITEMS_DIR}`);
  console.log(`WebP quality: ${QUALITY}`);
  console.log(`Max size: ${MAX_SIZE}x${MAX_SIZE}`);
  console.log(`Thumbnail size: ${THUMB_SIZE}x${THUMB_SIZE}\n`);

  // Find all JPG files
  const files = fs.readdirSync(ITEMS_DIR)
    .filter(f => f.toLowerCase().endsWith('.jpg') && !f.includes('-thumb'))
    .map(f => path.join(ITEMS_DIR, f));

  console.log(`Found ${files.length} JPG files to optimize.\n`);

  let totalOriginal = 0;
  let totalWebp = 0;
  let totalThumb = 0;
  let processed = 0;
  let skipped = 0;

  // Process in batches of 20 for memory efficiency
  const BATCH_SIZE = 20;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(f => optimizeImage(f)));

    for (const r of results) {
      if (r.skipped) {
        skipped++;
        continue;
      }
      processed++;
      totalOriginal += r.originalSize;
      totalWebp += r.webpSize;
      totalThumb += r.thumbSize;

      const savings = ((1 - r.webpSize / r.originalSize) * 100).toFixed(1);
      if (processed <= 20 || r.originalSize > 500000) {
        console.log(`  ${r.file}.jpg: ${formatBytes(r.originalSize)} -> WebP: ${formatBytes(r.webpSize)} (${savings}% smaller), Thumb: ${formatBytes(r.thumbSize)}`);
      }
    }

    // Progress update every batch
    const done = Math.min(i + BATCH_SIZE, files.length);
    if (files.length > BATCH_SIZE) {
      process.stdout.write(`  Progress: ${done}/${files.length} files...\r`);
    }
  }

  console.log('\n\n=== SUMMARY ===');
  console.log(`Files processed: ${processed}`);
  console.log(`Files skipped (errors): ${skipped}`);
  console.log(`Total original JPG size: ${formatBytes(totalOriginal)}`);
  console.log(`Total WebP (512px) size: ${formatBytes(totalWebp)} (${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}% savings)`);
  console.log(`Total thumbs (258px) size: ${formatBytes(totalThumb)}`);
  console.log(`Total space saved (WebP vs JPG): ${formatBytes(totalOriginal - totalWebp)}`);
  console.log(`\nWebP + thumb files created in: ${ITEMS_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
