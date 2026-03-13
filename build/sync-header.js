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
// CANONICAL HEADER — single source of truth for entire site
// All paths are absolute (/) so they work from any directory depth
// Active state is set dynamically by main.js (initActiveNav)
// ============================================================
const CANONICAL_HEADER = `  <div class="top-bar">
    <div class="container">
      <div class="top-bar__info">
        <div class="top-bar__item"><i class="fas fa-phone-alt"></i> <a href="tel:037740400">03-7740400</a></div>
        <div class="top-bar__item"><i class="fas fa-envelope"></i> <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div>
        <div class="top-bar__item"><i class="fas fa-clock"></i> <span>א'-ה' 08:00-17:00</span></div>
      </div>
      <div class="top-bar__social">
        <a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
        <a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      </div>
    </div>
  </div>

  <header class="header">
    <div class="container">
      <a href="/" class="header__logo">
        <img src="/images/logo/logo-dark.png" alt="וואי מרקט" width="98" height="52">
      </a>
      <nav class="main-nav" aria-label="ניווט ראשי">
        <div class="main-nav__item">
          <a href="/" class="main-nav__link" data-nav="home">דף הבית</a>
        </div>
        <div class="main-nav__item">
          <a href="/catalog" class="main-nav__link" data-nav="catalog">מוצרים <i class="fas fa-chevron-down"></i></a>
          <div class="mega-menu">
            <div class="mega-menu__grid">
              <a href="/category/industrial-cleaning-supplies-wholesale/" class="mega-menu__category"><i class="fas fa-spray-can"></i><span class="mega-menu__cat-name">חומרי ניקוי וכימיקלים</span></a>
              <a href="/category/bulk-paper-towel-office-supplies/" class="mega-menu__category"><i class="fas fa-toilet-paper"></i><span class="mega-menu__cat-name">מוצרי נייר וניגוב</span></a>
              <a href="/category/disposable-catering-food-service/" class="mega-menu__category"><i class="fas fa-utensils"></i><span class="mega-menu__cat-name">חד פעמי ואירוח</span></a>
              <a href="/category/food-packaging-delivery-solutions/" class="mega-menu__category"><i class="fas fa-box-open"></i><span class="mega-menu__cat-name">אריזות מזון ו-Take Away</span></a>
              <a href="/category/heavy-duty-garbage-bags-wholesale/" class="mega-menu__category"><i class="fas fa-trash-alt"></i><span class="mega-menu__cat-name">שקיות ופתרונות אשפה</span></a>
              <a href="/category/professional-cleaning-cloths-microfiber/" class="mega-menu__category"><i class="fas fa-tshirt"></i><span class="mega-menu__cat-name">טקסטיל, מטליות וסחבות</span></a>
              <a href="/category/office-coffee-breakroom-supplies/" class="mega-menu__category"><i class="fas fa-coffee"></i><span class="mega-menu__cat-name">קפה, שתייה וכיבוד</span></a>
              <a href="/category/safety-ppe-equipment-for-business/" class="mega-menu__category"><i class="fas fa-hard-hat"></i><span class="mega-menu__cat-name">בטיחות ומיגון אישי</span></a>
              <a href="/category/ציוד-משרדי-וכללי/" class="mega-menu__category"><i class="fas fa-pen"></i><span class="mega-menu__cat-name">ציוד משרדי וכללי</span></a>
              <a href="/category/ציוד-טכני-ואחזקה/" class="mega-menu__category"><i class="fas fa-wrench"></i><span class="mega-menu__cat-name">ציוד טכני ואחזקה</span></a>
              <a href="/category/עטיפה-אריזה-ולוגיסטיקה/" class="mega-menu__category"><i class="fas fa-tape"></i><span class="mega-menu__cat-name">עטיפה, אריזה ולוגיסטיקה</span></a>
              <a href="/category/עזרה-ראשונה-רפואי/" class="mega-menu__category"><i class="fas fa-first-aid"></i><span class="mega-menu__cat-name">עזרה ראשונה - רפואי</span></a>
              <a href="/category/טואלטיקה-וטיפוח-אישי/" class="mega-menu__category"><i class="fas fa-pump-soap"></i><span class="mega-menu__cat-name">טואלטיקה וטיפוח</span></a>
              <a href="/category/כלי-עבודה-וציוד-משקי/" class="mega-menu__category"><i class="fas fa-tools"></i><span class="mega-menu__cat-name">כלי עבודה וציוד משקי</span></a>
            </div>
          </div>
        </div>
        <div class="main-nav__item">
          <a href="/about" class="main-nav__link" data-nav="about">אודות</a>
        </div>
        <div class="main-nav__item">
          <a href="/blog" class="main-nav__link" data-nav="blog">בלוג</a>
        </div>
        <div class="main-nav__item">
          <a href="/contact" class="main-nav__link" data-nav="contact">צרו קשר</a>
        </div>
      </nav>
      <div class="header__actions">
        <button class="header__search-toggle" aria-label="חיפוש"><i class="fas fa-search"></i></button>
        <button class="header__cart-btn" aria-label="עגלת קניות"><i class="fas fa-shopping-cart"></i><span class="cart-count">0</span></button>
        <a href="/login" class="header__login-btn" aria-label="כניסת לקוחות"><i class="fas fa-user"></i> <span>כניסת לקוחות</span></a>
        <a href="/register" class="header__register-btn"><i class="fas fa-user-plus"></i> <span>הרשמה</span></a>
      </div>
      <button class="mobile-menu-btn" aria-label="תפריט" aria-expanded="false"><i class="fas fa-bars"></i></button>
    </div>
  </header>
  <div class="mobile-overlay"></div>
  <div class="search-overlay"><div class="search-overlay__inner"><form action="/catalog" method="get"><input type="search" name="search" class="search-overlay__input" placeholder="חפשו מוצר..." aria-label="חיפוש מוצר" autocomplete="off"></form></div></div>`;

// Match existing header block using a function (more robust than regex for varying whitespace)
function findAndReplaceHeader(content) {
  const topBarStart = content.indexOf('<div class="top-bar">');
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
    if (!content.includes('class="top-bar"')) {
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
