#!/usr/bin/env node
/**
 * Generate SEO-optimized hero banner images for category pages.
 * Composites 5-6 product images from each category into a professional banner.
 *
 * Output: /images/categories/{seoSlug}.webp
 * Naming: SEO-friendly English slugs (e.g., industrial-cleaning-supplies-wholesale.webp)
 * Alt text: Defined in generate-categories.js from category data
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'products.json');
const ITEMS_DIR = path.join(ROOT_DIR, 'items');
const OUTPUT_DIR = path.join(ROOT_DIR, 'images', 'categories');

// Banner dimensions
const BANNER_W = 1200;
const BANNER_H = 400;
const PRODUCT_SIZE = 240; // each product image square
const BRAND_COLOR = { r: 27, g: 58, b: 92 }; // #1B3A5C

function getDescendantSlugs(category, catMap) {
  const slugs = new Set([category.slug]);
  const children = catMap.get(category.id)?.children || [];
  for (const child of children) {
    for (const s of getDescendantSlugs(child, catMap)) {
      slugs.add(s);
    }
  }
  return slugs;
}

async function generateHeroForCategory(category, products, catMap) {
  const effectiveSlug = category.seoSlug || category.slug;
  const outputPath = path.join(OUTPUT_DIR, `${effectiveSlug}.webp`);

  // Get products for this category
  const descendantSlugs = getDescendantSlugs(category, catMap);
  const categoryProducts = products.filter(p =>
    descendantSlugs.has(p.categorySlug) ||
    (p.categorySlugs && p.categorySlugs.some(s => descendantSlugs.has(s)))
  );

  // Find products that have actual images on disk
  const productsWithImages = [];
  for (const p of categoryProducts) {
    const imgPath = path.join(ITEMS_DIR, `${p.id}.jpg`);
    if (fs.existsSync(imgPath)) {
      productsWithImages.push({ ...p, imgPath });
    }
    if (productsWithImages.length >= 8) break;
  }

  if (productsWithImages.length < 2) {
    return false; // Not enough images for a composite
  }

  // Select 5 representative products (spread evenly across available)
  const selected = [];
  const step = Math.max(1, Math.floor(productsWithImages.length / 5));
  for (let i = 0; i < productsWithImages.length && selected.length < 5; i += step) {
    selected.push(productsWithImages[i]);
  }
  // Fill remaining if needed
  while (selected.length < 5 && selected.length < productsWithImages.length) {
    const next = productsWithImages[selected.length];
    if (next && !selected.find(s => s.id === next.id)) selected.push(next);
    else break;
  }

  try {
    // Create gradient background
    const gradientSvg = `<svg width="${BANNER_W}" height="${BANNER_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${BRAND_COLOR.r},${BRAND_COLOR.g},${BRAND_COLOR.b});stop-opacity:1"/>
          <stop offset="50%" style="stop-color:rgb(${BRAND_COLOR.r + 20},${BRAND_COLOR.g + 30},${BRAND_COLOR.b + 40});stop-opacity:1"/>
          <stop offset="100%" style="stop-color:rgb(${BRAND_COLOR.r + 10},${BRAND_COLOR.g + 15},${BRAND_COLOR.b + 25});stop-opacity:1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect x="0" y="${BANNER_H - 4}" width="100%" height="4" fill="rgba(255,255,255,0.3)"/>
    </svg>`;

    const background = sharp(Buffer.from(gradientSvg))
      .resize(BANNER_W, BANNER_H);

    // Prepare product image overlays
    const composites = [];
    const numProducts = selected.length;
    const totalWidth = numProducts * PRODUCT_SIZE + (numProducts - 1) * 20;
    const startX = Math.max(40, Math.floor((BANNER_W - totalWidth) / 2));
    const yPos = Math.floor((BANNER_H - PRODUCT_SIZE) / 2);

    for (let i = 0; i < numProducts; i++) {
      const p = selected[i];
      try {
        // Resize product image to fit, with white background, rounded effect
        const productImg = await sharp(p.imgPath)
          .resize(PRODUCT_SIZE - 20, PRODUCT_SIZE - 20, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .toBuffer();

        // Add white card effect with shadow (via SVG overlay)
        const cardSize = PRODUCT_SIZE;
        const roundedMask = Buffer.from(
          `<svg width="${cardSize}" height="${cardSize}"><rect x="0" y="0" width="${cardSize}" height="${cardSize}" rx="16" ry="16" fill="white"/></svg>`
        );

        const cardBg = await sharp(roundedMask)
          .resize(cardSize, cardSize)
          .composite([{
            input: productImg,
            left: 10,
            top: 10,
          }])
          .png()
          .toBuffer();

        composites.push({
          input: cardBg,
          left: startX + i * (PRODUCT_SIZE + 20),
          top: yPos,
        });
      } catch (e) {
        // Skip problematic images
      }
    }

    if (composites.length < 2) return false;

    // Compose final image
    await background
      .composite(composites)
      .webp({ quality: 82 })
      .toFile(outputPath);

    return true;
  } catch (err) {
    console.error(`  Error generating hero for ${effectiveSlug}:`, err.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('products.json not found');
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const products = data.items || [];
  const categories = data.categories || [];

  // Build category map
  const catMap = new Map();
  categories.forEach(c => catMap.set(c.id, { ...c, children: [] }));
  for (const cat of catMap.values()) {
    if (cat.parentId && catMap.has(cat.parentId)) {
      catMap.get(cat.parentId).children.push(cat);
    }
  }

  // Only generate for top-level (parent) categories — subcategories inherit
  const topLevel = categories.filter(c => !c.parentId);

  console.log(`Generating hero images for ${topLevel.length} top-level categories...`);

  let generated = 0;
  let skipped = 0;

  for (const cat of topLevel) {
    const effectiveSlug = cat.seoSlug || cat.slug;
    const outputPath = path.join(OUTPUT_DIR, `${effectiveSlug}.webp`);

    // Skip if already exists and is recent (within 24h)
    if (fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < 24) {
        skipped++;
        continue;
      }
    }

    const treeCat = catMap.get(cat.id) || cat;
    const success = await generateHeroForCategory(treeCat, products, catMap);
    if (success) {
      generated++;
      console.log(`  ✅ ${effectiveSlug}.webp`);
    } else {
      skipped++;
    }
  }

  console.log(`Hero images: ${generated} generated, ${skipped} skipped`);
}

main().catch(err => {
  console.error('Hero generation failed:', err);
  process.exit(1);
});
