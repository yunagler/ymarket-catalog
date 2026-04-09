#!/usr/bin/env python3
"""
Replace old unstyled headers with new styled header in all HTML files.
Old header: <div class="top-bar">...</div> + <header class="header">...(main-nav)...</header>
New header: announcement + info-bar + <header class="header" id="header">...(nav)...</header>
"""

import os
import re
import sys

WEBSITE_DIR = r"C:\Users\DELL\ymarket\website"

# New header HTML (from catalog.html, with 'active' removed from nav links)
NEW_HEADER = '''  <div class="announcement"><a href="/register"><i class="fas fa-crown"></i> רוכשים בכמויות מסחריות? הצטרפו למועדון הלקוחות וקבלו מחירון סיטונאי ייעודי <i class="fas fa-chevron-left" style="font-size:0.75em;"></i></a></div>
  <div class="info-bar"><div class="container"><div class="info-bar__group"><div class="info-bar__item"><i class="fas fa-phone-alt"></i> <a href="tel:037740400">03-7740400</a></div><div class="info-bar__item"><i class="fas fa-envelope"></i> <a href="mailto:Pm@ymarket.co.il">Pm@ymarket.co.il</a></div><div class="info-bar__item"><i class="fas fa-clock"></i> <span>א'-ה' 08:00-17:00</span></div></div><div class="info-bar__group info-bar__social"><a href="https://wa.me/972549922492" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a><a href="https://www.facebook.com/profile.php?id=100083110428101" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a><a href="https://www.instagram.com/ymarket.ai" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></div></div></div>
  <header class="header" id="header"><div class="container"><a href="/" class="header__logo"><img src="/images/logo/logo-dark-2x.png" alt="וואי מרקט" height="44" style="height:44px;width:auto;"></a><nav class="nav" aria-label="ניווט ראשי"><div class="nav__item"><a href="/" class="nav__link">דף הבית</a></div><div class="nav__item"><a href="/catalog" class="nav__link">מוצרים</a></div><div class="nav__item"><a href="/about" class="nav__link">אודות</a></div><div class="nav__item"><a href="/blog" class="nav__link">בלוג</a></div><div class="nav__item"><a href="/contact" class="nav__link">צרו קשר</a></div></nav><div class="header__actions"><button class="header__btn" aria-label="חיפוש"><i class="fas fa-search"></i></button><a href="/cart" class="header__btn" aria-label="עגלה" id="cartBtn"><i class="fas fa-shopping-cart"></i><span class="cart-badge" id="cartBadge">0</span></a><a href="/login" class="header__btn header__login"><i class="fas fa-user"></i> <span>כניסה</span></a><a href="/register" class="header__btn header__register"><i class="fas fa-user-plus"></i> <span>הרשמה</span></a></div><button class="mobile-menu-btn" aria-label="תפריט"><i class="fas fa-bars"></i></button></div></header>'''

# Regex to match the old header block:
# Starts with <div class="top-bar"> and ends with </header>
# (the header that contains main-nav, not nav)
# Using DOTALL so . matches newlines
# The pattern matches:
#   1. Optional comment line before top-bar
#   2. <div class="top-bar">...</div>
#   3. Optional whitespace
#   4. <header class="header">...(with main-nav inside)...</header>
OLD_HEADER_PATTERN = re.compile(
    r'[ \t]*(?:<!--[^>]*?header[^>]*?-->\s*)?'  # optional comment
    r'[ \t]*<div\s+class="top-bar">.*?</div>\s*'  # top-bar div (greedy enough to get nested divs)
    r'<header\s+class="header">\s*'  # header opening (WITHOUT id="header")
    r'<div\s+class="container">.*?'  # container
    r'<nav\s+class="main-nav".*?</nav>'  # main-nav (the key identifier)
    r'.*?</header>',  # rest of header
    re.DOTALL
)

# Variant pattern for files with class="main-header" instead of class="header"
OLD_HEADER_PATTERN_V2 = re.compile(
    r'[ \t]*<div\s+class="top-bar">.*?</div>\s*'  # top-bar div
    r'<header\s+class="main-header">.*?'  # main-header opening
    r'<nav\s+class="main-nav">.*?</nav>'  # main-nav
    r'.*?</header>',  # rest of header
    re.DOTALL
)

def process_file(filepath):
    """Process a single HTML file. Returns action taken."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    has_old = 'class="top-bar"' in content
    has_new = 'class="info-bar"' in content

    if not has_old:
        return 'skip_no_old'

    if has_old and has_new:
        # File has both - just remove the old block
        new_content = OLD_HEADER_PATTERN.sub('', content)
        # Clean up extra blank lines left behind
        new_content = re.sub(r'\n{3,}', '\n\n', new_content)
        if new_content == content:
            return 'skip_no_match'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return 'removed_old'

    # File has old but no new - replace old with new
    new_content = OLD_HEADER_PATTERN.sub(NEW_HEADER, content)
    if new_content == content:
        # Try variant pattern (main-header)
        new_content = OLD_HEADER_PATTERN_V2.sub(NEW_HEADER, content)
    if new_content == content:
        return 'skip_no_match'

    # Verify we didn't break the file - check new header is present
    if 'class="info-bar"' not in new_content:
        return 'error_replacement_failed'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return 'replaced'


def main():
    stats = {
        'replaced': 0,
        'removed_old': 0,
        'skip_no_old': 0,
        'skip_no_match': 0,
        'error_replacement_failed': 0,
        'error_exception': 0,
    }

    failed_files = []

    for root, dirs, files in os.walk(WEBSITE_DIR):
        for fname in files:
            if not fname.endswith('.html'):
                continue
            filepath = os.path.join(root, fname)
            try:
                result = process_file(filepath)
                stats[result] = stats.get(result, 0) + 1
                if result == 'skip_no_match':
                    failed_files.append(filepath)
                elif result == 'error_replacement_failed':
                    failed_files.append(filepath)
            except Exception as e:
                stats['error_exception'] += 1
                failed_files.append(f"{filepath}: {e}")

    print("=== Header Replacement Results ===")
    print(f"Replaced (old -> new): {stats['replaced']}")
    print(f"Removed old (had both): {stats['removed_old']}")
    print(f"Skipped (no old header): {stats['skip_no_old']}")
    print(f"Failed regex match: {stats['skip_no_match']}")
    print(f"Replacement errors: {stats['error_replacement_failed']}")
    print(f"Exceptions: {stats['error_exception']}")
    print(f"Total processed: {sum(stats.values())}")

    if failed_files:
        print(f"\n--- Failed files ({len(failed_files)}) ---")
        for f in failed_files[:20]:
            print(f"  {f}")
        if len(failed_files) > 20:
            print(f"  ... and {len(failed_files) - 20} more")

    return 0 if stats['skip_no_match'] == 0 and stats['error_replacement_failed'] == 0 and stats['error_exception'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
