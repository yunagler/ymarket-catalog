#!/usr/bin/env node
/**
 * Sync Footer — replaces the <footer>...</footer> block in ALL HTML pages
 * with the canonical footer from index.html (using absolute paths).
 * Also updates generate-categories.js and generate-products.js templates.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Canonical footer HTML with absolute paths (works from any directory depth)
const CANONICAL_FOOTER = `  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="/images/logo/logo-white.png" alt="וואי מרקט" width="112" height="60">
          <p>נגלר סחר והפצה — סחר, שיווק והפצה של מוצרי צריכה שוטפת לעסקים ומוסדות בכל רחבי הארץ.</p>
          <div class="footer__social">
            <a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            <a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          </div>
        </div>

        <div class="footer__col">
          <h4>קטגוריות</h4>
          <div class="footer__links">
            <a href="/category/bulk-paper-towel-office-supplies/">מוצרי נייר וניגוב</a>
            <a href="/category/industrial-cleaning-supplies-wholesale/">חומרי ניקוי</a>
            <a href="/category/disposable-catering-food-service/">חד פעמי ואירוח</a>
            <a href="/category/food-packaging-delivery-solutions/">אריזות Take Away</a>
            <a href="/category/office-coffee-breakroom-supplies/">קפה, שתייה וכיבוד</a>
            <a href="/category/safety-ppe-equipment-for-business/">בטיחות ומיגון</a>
          </div>
        </div>

        <div class="footer__col">
          <h4>קישורים מהירים</h4>
          <div class="footer__links">
            <a href="/catalog">קטלוג מוצרים</a>
            <a href="/about">אודות</a>
            <a href="/blog">בלוג</a>
            <a href="/faq">שאלות ותשובות</a>
            <a href="/contact">צרו קשר</a>
            <a href="/tracking">מעקב משלוחים</a>
          </div>
        </div>

        <div class="footer__col">
          <h4>צרו קשר</h4>
          <div class="footer__contact-item">
            <i class="fas fa-phone-alt"></i>
            <a href="tel:037740400">03-7740400</a>
          </div>
          <div class="footer__contact-item">
            <i class="fab fa-whatsapp"></i>
            <a href="https://wa.me/972549922492" target="_blank" rel="noopener">WhatsApp</a>
          </div>
          <div class="footer__contact-item">
            <i class="fas fa-envelope"></i>
            <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a>
          </div>
          <div class="footer__contact-item">
            <i class="fas fa-clock"></i>
            <span>א'-ה' 08:00-17:00</span>
          </div>
        </div>
      </div>

      <div class="footer__bottom">
        <span class="footer__copyright">&copy; 2026 וואי מרקט — נגלר סחר והפצה. כל הזכויות שמורות.</span>
        <div class="footer__legal">
          <a href="/legal/terms">תקנון האתר</a>
          <a href="/legal/privacy">מדיניות פרטיות</a>
          <a href="/legal/shipping">מדיניות משלוחים</a>
          <a href="/legal/returns">החזרות וביטולים</a>
          <a href="/legal/accessibility">נגישות</a>
          <a href="/legal/cookies">עוגיות</a>
        </div>
      </div>
    </div>
  </footer>`;

// Regex to match existing footer block (multiline)
const FOOTER_RE = /<footer[\s\S]*?<\/footer>/;

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

  for (const filePath of htmlFiles) {
    const rel = path.relative(ROOT_DIR, filePath);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip redirect pages (meta http-equiv="refresh")
    if (content.includes('http-equiv="refresh"')) {
      continue;
    }

    // Skip files without a footer
    if (!FOOTER_RE.test(content)) {
      skipped++;
      continue;
    }

    const original = content;
    content = content.replace(FOOTER_RE, CANONICAL_FOOTER);

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      updated++;
    }
  }

  console.log(`Footer synced: ${updated} files updated, ${skipped} files skipped (no footer)`);
}

main();
