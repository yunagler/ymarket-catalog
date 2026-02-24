#!/usr/bin/env node
/**
 * Export product catalog from CRM API to static JSON
 * Generates data/products.json for the frontend website
 *
 * Usage: node build/export-catalog.js
 *
 * Connects to the CRM public API endpoint. If CRM is unavailable,
 * falls back to sample data for development.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'products.json');
const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:3000';
const PUBLIC_CATALOG_ENDPOINT = `${CRM_API_URL}/api/public/catalog`;

async function exportFromCRM() {
  try {
    console.log(`Fetching catalog from ${PUBLIC_CATALOG_ENDPOINT}...`);
    const response = await fetch(PUBLIC_CATALOG_ENDPOINT, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.items?.length || 0} items, ${data.categories?.length || 0} categories`);

    return {
      categories: data.categories,
      items: data.items,
    };
  } catch (error) {
    console.error(`CRM API error: ${error.message}`);
    console.log('Falling back to sample data...');
    return generateSampleData();
  }
}

function generateSampleData() {
  const categories = [
    { id: 1, name: 'בטיחות ומיגון אישי', slug: 'safety', icon: 'fa-hard-hat', itemCount: 12 },
    { id: 2, name: 'כלי עבודה וציוד משקי', slug: 'tools', icon: 'fa-tools', itemCount: 15 },
    { id: 3, name: 'שקיות ופתרונות אשפה', slug: 'trash', icon: 'fa-trash-alt', itemCount: 8 },
    { id: 4, name: 'חומרי ניקוי וכימיקלים', slug: 'cleaning', icon: 'fa-spray-can', itemCount: 20 },
    { id: 5, name: 'אריזות מזון ו-Take Away', slug: 'takeaway', icon: 'fa-box-open', itemCount: 18 },
    { id: 6, name: 'טקסטיל, מטליות וסחבות', slug: 'textile', icon: 'fa-tshirt', itemCount: 10 },
    { id: 7, name: 'חד פעמי ואירוח', slug: 'disposable', icon: 'fa-utensils', itemCount: 22 },
    { id: 9, name: 'מוצרי נייר וניגוב', slug: 'paper', icon: 'fa-toilet-paper', itemCount: 25 },
    { id: 10, name: 'קפה, שתייה וכיבוד', slug: 'coffee', icon: 'fa-coffee', itemCount: 14 },
    { id: 11, name: 'ציוד משרדי וכללי', slug: 'office', icon: 'fa-pen', itemCount: 8 },
    { id: 13, name: 'עזרה ראשונה - רפואי', slug: 'medical', icon: 'fa-first-aid', itemCount: 6 },
    { id: 17, name: 'טואלטיקה וטיפוח', slug: 'toiletries', icon: 'fa-pump-soap', itemCount: 7 }
  ];

  const samples = [
    { name: 'נייר טואלט הרקולס 48 גלילים', slug: 'toilet-paper-hercules-48', saleNis: 89.90, categorySlug: 'paper', unit: 'שק', unitsPerPack: 48, productStatus: 'recommended' },
    { name: 'מגבות נייר אוורסט 6 גלילים', slug: 'paper-towels-everest-6', saleNis: 45.00, categorySlug: 'paper', unit: 'חבילה', unitsPerPack: 6 },
    { name: 'סבון ידיים נוזלי 5 ליטר', slug: 'hand-soap-5l', saleNis: 32.00, categorySlug: 'cleaning', unit: 'מיכל', unitsPerPack: 1 },
    { name: 'נוזל כלים מרוכז 4 ליטר', slug: 'dish-soap-4l', saleNis: 28.00, categorySlug: 'cleaning', unit: 'מיכל', unitsPerPack: 1 },
    { name: 'צלחות חד פעמיות 100 יח', slug: 'disposable-plates-100', saleNis: 19.90, categorySlug: 'disposable', unit: 'חבילה', unitsPerPack: 100 },
    { name: 'כוסות פלסטיק 200 מ"ל 100 יח', slug: 'plastic-cups-200ml', saleNis: 15.00, categorySlug: 'disposable', unit: 'שרוול', unitsPerPack: 100 },
    { name: 'מטליות מיקרופייבר 10 יח', slug: 'microfiber-cloths-10', saleNis: 35.00, categorySlug: 'textile', unit: 'חבילה', unitsPerPack: 10 },
    { name: 'שקיות אשפה 75x90 שחור', slug: 'trash-bags-75x90', saleNis: 22.00, categorySlug: 'trash', unit: 'גליל', unitsPerPack: 25 },
    { name: 'כפפות ניטריל M 100 יח', slug: 'nitrile-gloves-m-100', saleNis: 29.90, categorySlug: 'safety', unit: 'קופסה', unitsPerPack: 100 },
    { name: 'קפה שחור טורקי 200 גר', slug: 'turkish-coffee-200g', saleNis: 18.00, categorySlug: 'coffee', unit: 'חבילה', unitsPerPack: 1 },
    { name: 'קופסאות מזון Take Away 50 יח', slug: 'takeaway-boxes-50', saleNis: 42.00, categorySlug: 'takeaway', unit: 'חבילה', unitsPerPack: 50 },
    { name: 'נייר תעשייתי 6 גלילים', slug: 'industrial-paper-6', saleNis: 65.00, categorySlug: 'paper', unit: 'שק', unitsPerPack: 6 },
  ];

  const items = samples.map((p, i) => ({
    id: i + 1,
    ...p,
    categoryName: categories.find(c => c.slug === p.categorySlug)?.name || '',
    imageUrl: `images/products/${i + 1}.jpg`,
    isFeatured: i < 4,
    productStatus: p.productStatus || 'active',
    description: '',
    partNumber: '',
    searchTags: ''
  }));

  return { categories, items };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const data = await exportFromCRM();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Catalog exported to ${OUTPUT_FILE}`);
  console.log(`Categories: ${data.categories.length}`);
  console.log(`Products: ${data.items.length}`);
}

main();
