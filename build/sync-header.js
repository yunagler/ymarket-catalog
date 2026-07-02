#!/usr/bin/env node
/**
 * Sync Header — replaces the header block (top-bar + header + mobile-overlay + search-overlay)
 * in ALL HTML pages with the canonical header from a single source of truth.
 * Includes mega-menu, sticky behavior, and consistent structure.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// ============================================================
// CANONICAL HEADER — loaded from single source of truth
// ============================================================
const CANONICAL_HEADER = fs.readFileSync(
  path.join(ROOT_DIR, 'includes', 'site-header.html'), 'utf-8'
).trim() + '\n  <div class="mobile-overlay"></div>\n  <div class="search-overlay"><div class="search-overlay__inner"><form action="/catalog" method="get"><input type="search" name="search" class="search-overlay__input" placeholder="\u05D7\u05E4\u05E9\u05D5 \u05DE\u05D5\u05E6\u05E8..." aria-label="\u05D7\u05D9\u05E4\u05D5\u05E9 \u05DE\u05D5\u05E6\u05E8" autocomplete="off"></form></div></div>';

// Match existing header block using a function (more robust than regex for varying whitespace)
function findAndReplaceHeader(content) {
  // Support both old (top-bar) and new (announcement) header formats
  let topBarStart = content.indexOf('<div class="announcement"');
  if (topBarStart === -1) topBarStart = content.indexOf('<div class="top-bar">');
  if (topBarStart === -1) return null;

  // Find the end of the mobile-overlay div
  const mobileOverlayStr = '<div class="mobile-overlay"></div>';
  const mobileOverlayIdx = content.indexOf(mobileOverlayStr, topBarStart);
  if (mobileOverlayIdx === -1) return null;
  let endIdx = mobileOverlayIdx + mobileOverlayStr.length;

  // Check if search-overlay follows
  const afterOverlay = content.slice(endIdx).trimStart();
  if (afterOverlay.startsWith('<div class="search-overlay">')) {
    // Find the closing of search-overlay (it has nested divs: overlay > inner > form)
    const searchStart = content.indexOf('<div class="search-overlay">', endIdx);
    // Count div nesting to find the right closing </div>
    let depth = 0;
    let i = searchStart;
    while (i < content.length) {
      if (content.slice(i).startsWith('<div')) { depth++; i += 4; }
      else if (content.slice(i).startsWith('</div>')) {
        depth--;
        i += 6;
        if (depth === 0) break;
      } else { i++; }
    }
    endIdx = i;
  }

  // Trim leading whitespace before top-bar
  let startIdx = topBarStart;
  while (startIdx > 0 && (content[startIdx - 1] === ' ' || content[startIdx - 1] === '\t' || content[startIdx - 1] === '\n' || content[startIdx - 1] === '\r')) {
    startIdx--;
  }

  return {
    start: startIdx,
    end: endIdx,
    before: content.slice(0, startIdx),
    after: content.slice(endIdx)
  };
}

function getAllHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'build', 'data', 'images', 'css', 'js', 'fonts', 'items'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const htmlFiles = getAllHtmlFiles(ROOT_DIR);
  let updated = 0;
  let skipped = 0;
  let blogFixed = 0;

  for (const filePath of htmlFiles) {
    const rel = path.relative(ROOT_DIR, filePath);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip redirect pages
    if (content.includes('http-equiv="refresh"')) continue;

    // Handle pages that have no header - inject after <body>
    if (!content.includes('class="top-bar"') && !content.includes('class="announcement"')) {
      if (content.includes('<body')) {
        const bodyMatch = content.match(/<body[^>]*>/);
        if (bodyMatch) {
          const insertPos = content.indexOf(bodyMatch[0]) + bodyMatch[0].length;
          content = content.slice(0, insertPos) + '\n' + CANONICAL_HEADER + '\n' + content.slice(insertPos);
          fs.writeFileSync(filePath, content, 'utf-8');
          blogFixed++;
          continue;
        }
      }
      skipped++;
      continue;
    }

    // Replace existing header block
    const match = findAndReplaceHeader(content);
    if (!match) {
      skipped++;
      continue;
    }

    const newContent = match.before + '\n' + CANONICAL_HEADER + match.after;
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      updated++;
    }
  }

  console.log(`Header synced: ${updated} files updated, ${blogFixed} blog pages fixed, ${skipped} skipped`);
}

main();
