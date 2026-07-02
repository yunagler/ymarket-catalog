#!/usr/bin/env python3
"""
Add internal blog links to product pages for SEO.
Inserts a "מדריכים מקצועיים" section before the <footer> element.
Skips pages that already have the section.
"""

import os
import re
import glob

WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_DIR = os.path.join(WEBSITE_DIR, "products")

# Category -> blog links mapping
# Each entry: (hub_url, hub_title, [(article_url, article_title), ...])
CATEGORY_LINKS = {
    "cleaning": (
        "/blog/cleaning-products-hub.html", "מדריך חומרי ניקיון מוסדיים",
        [
            ("/blog/bleach-guide-for-institutions.html", "מדריך אקונומיקה למוסדות"),
            ("/blog/floor-cleaning-products-guide.html", "מדריך ניקוי רצפות"),
            ("/blog/institutional-cleaning-equipment-guide.html", "ציוד ניקיון למוסדות"),
        ]
    ),
    "paper": (
        "/blog/paper-products-guide.html", "מדריך מוצרי נייר מוסדיים",
        [
            ("/blog/jumbo-toilet-paper-guide.html", "מדריך נייר טואלט ג'מבו"),
            ("/blog/paper-towels-for-businesses.html", "מגבות נייר לעסקים"),
            ("/blog/save-paper-costs.html", "חיסכון בעלויות נייר"),
        ]
    ),
    "disposable": (
        "/blog/disposable-items-for-businesses.html", "כלים חד-פעמיים לעסקים",
        [
            ("/blog/restaurant-disposable-equipment.html", "ציוד חד-פעמי למסעדות"),
            ("/blog/complete-guide-institutional-supplies.html", "מדריך אספקה מוסדית"),
        ]
    ),
    "takeaway": (
        "/blog/takeaway-packaging-guide.html", "מדריך אריזות Take Away",
        [
            ("/blog/disposable-items-for-businesses.html", "כלים חד-פעמיים לעסקים"),
            ("/blog/restaurant-disposable-equipment.html", "ציוד חד-פעמי למסעדות"),
        ]
    ),
    "bags": (
        "/blog/institutional-garbage-bags.html", "מדריך שקיות אשפה מוסדיות",
        [
            ("/blog/cleaning-products-hub.html", "חומרי ניקיון מוסדיים"),
            ("/blog/institutional-cleaning-equipment-guide.html", "ציוד ניקיון למוסדות"),
        ]
    ),
    "textile": (
        "/blog/institutional-cleaning-equipment-guide.html", "ציוד ניקיון למוסדות",
        [
            ("/blog/cleaning-products-hub.html", "חומרי ניקיון מוסדיים"),
            ("/blog/floor-cleaning-products-guide.html", "מדריך ניקוי רצפות"),
        ]
    ),
    "office": (
        "/blog/supplies-for-offices.html", "ציוד למשרדים",
        [
            ("/blog/smart-procurement-guide.html", "מדריך רכש חכם"),
            ("/blog/online-ordering-portal-for-businesses.html", "פורטל הזמנות לעסקים"),
        ]
    ),
    "food": (
        "/blog/supplies-for-restaurants.html", "אספקה למסעדות",
        [
            ("/blog/what-to-order-by-business-type.html", "מה להזמין לפי סוג עסק"),
            ("/blog/smart-procurement-guide.html", "מדריך רכש חכם"),
        ]
    ),
    "safety": (
        "/blog/complete-guide-institutional-supplies.html", "מדריך אספקה מוסדית",
        [
            ("/blog/supplies-for-public-institutions.html", "אספקה למוסדות ציבוריים"),
            ("/blog/smart-procurement-guide.html", "מדריך רכש חכם"),
        ]
    ),
    "default": (
        "/blog/cleaning-products-hub.html", "מדריך חומרי ניקיון מוסדיים",
        [
            ("/blog/complete-guide-institutional-supplies.html", "מדריך אספקה מוסדית"),
            ("/blog/smart-procurement-guide.html", "מדריך רכש חכם"),
        ]
    ),
}

# Map categoryName values to our link groups
CATEGORY_MAP = {
    "חומרי ניקוי וכימיקלים": "cleaning",
    "מוצרי נייר וניגוב": "paper",
    "כוסות צלחות וסכום": "disposable",
    "צלחות חד פעמי": "disposable",
    "סכו\\": "disposable",  # truncated in data
    "אריזות מזון ו-Take Away": "takeaway",
    "שקיות ופתרונות אשפה": "bags",
    "טקסטיל, מטליות וסחבות": "textile",
    "כלי כתיבה": "office",
    "ארגון ותיוק": "office",
    "ניירת ופנקסים": "office",
    "ציוד קופה ומחשב": "office",
    "ציוד משרדי וכללי": "office",
    "כלי שולחן ואביזרי משרד": "office",
    "קפה, שתייה וכיבוד": "food",
    "קיסמים ושיפודים": "food",
    "מפות ואירוח שולחן": "disposable",
    "נרות ואירוח מיוחד": "disposable",
    "ניירות, עטיפה ושקיות מזון": "takeaway",
    "גביעים ומיכלי רוטב": "takeaway",
    "מיגון ובטיחות בעבודה (PPE)": "safety",
    "ביגוד מגן וסינרים": "safety",
    "ערכות עזרה ראשונה": "safety",
    "חבישה, חיטוי ואביזרי טיפול": "safety",
    "דפיברילטורים AED ואביזרים": "safety",
    "תיקים רפואיים ותיקי חובש": "safety",
    "ציוד קיבוע ועזרה בשדה": "safety",
    "עזרה ראשונה וציוד רפואי לעסקים": "safety",
    "כלי עבודה וציוד משקי": "default",
    "כלי עבודה ואחזקה": "default",
    "כלי גינון וחצרנות": "default",
    "אריזה לוגיסטית ומחסן": "default",
    "היגיינה כללית ואביזרים": "cleaning",
    "מוצרי שיניים ופה": "cleaning",
    "דאודורנט וטיפוח גוף": "cleaning",
    "מבשמים ושירותים": "cleaning",
    "הדברה ומניעת מזיקים": "cleaning",
    "סוללות וחשמל": "default",
    "מדבקות ותוויות": "office",
    "צביעה וגימור": "default",
    "מצעים ושמיכות": "textile",
    "מגבות וביגוד": "textile",
    "מגבונים אישיים": "paper",
    "ציוד טכני ואחזקה": "default",
    "ציוד מיוחד ולוגיסטיקה": "default",
    "תיקים ואביזרי נשיאה": "default",
    "כלי מטבח רב-פעמיים": "food",
    "אחסון ואביזרי מטבח": "food",
    "צלחות וכלי הגשה רב-פעמיים": "disposable",
    "ריהוט וציוד מוסדי": "default",
    "קרפטים וקופסאות": "default",
    "סטוק עד הבית": "default",
}

LINK_STYLE = 'display:inline-block;background:#e8f0fe;color:#1B3A5C;padding:6px 16px;border-radius:20px;text-decoration:none;font-size:0.85rem;'


def build_blog_section(category_key):
    """Build the HTML for the blog links section."""
    links_data = CATEGORY_LINKS.get(category_key, CATEGORY_LINKS["default"])
    hub_url, hub_title, articles = links_data

    links_html = f'    <a href="{hub_url}" style="{LINK_STYLE}">{hub_title}</a>\n'
    for art_url, art_title in articles:
        links_html += f'    <a href="{art_url}" style="{LINK_STYLE}">{art_title}</a>\n'

    section = f'''<div style="max-width:800px;margin:2rem auto;padding:0 1rem;">
  <h3 style="color:#1B3A5C;font-size:1.1rem;margin-bottom:0.8rem;">&#128214; מדריכים מקצועיים</h3>
  <div style="display:flex;flex-wrap:wrap;gap:8px;">
{links_html}  </div>
</div>
'''
    return section


def extract_category(html):
    """Extract categoryName from PRODUCT JSON var."""
    m = re.search(r'"categoryName"\s*:\s*"([^"]*)"', html)
    if m:
        return m.group(1)
    return ""


def process_file(filepath):
    """Process a single product page. Returns True if modified."""
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # Skip if already has blog links
    if "מדריכים מקצועיים" in html:
        return False

    # Find category
    category_name = extract_category(html)
    category_key = CATEGORY_MAP.get(category_name, "default")

    # Build section
    section = build_blog_section(category_key)

    # Insert before <footer
    footer_idx = html.find("<footer")
    if footer_idx == -1:
        return False

    new_html = html[:footer_idx] + section + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_html)

    return True


def main():
    pattern = os.path.join(PRODUCTS_DIR, "*", "index.html")
    files = glob.glob(pattern)
    print(f"Found {len(files)} product pages")

    updated = 0
    skipped = 0
    errors = 0

    for filepath in sorted(files):
        try:
            if process_file(filepath):
                updated += 1
            else:
                skipped += 1
        except Exception as e:
            errors += 1
            print(f"ERROR: {filepath}: {e}")

    print(f"\nResults:")
    print(f"  Updated: {updated}")
    print(f"  Skipped (already has links or no footer): {skipped}")
    print(f"  Errors: {errors}")
    print(f"  Total: {len(files)}")


if __name__ == "__main__":
    main()
