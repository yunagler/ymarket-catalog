#!/usr/bin/env python3
"""
Y Market Image Agent V2.1
=========================
Professional e-commerce product image redesigner.
Processes all product images with category-specific design themes.

Features:
- Removes original category bar (top + bottom)
- Dynamic dark backgrounds with glow effects per category
- Floating particles and bokeh for depth
- Product in clean white container with shadow
- Info panel with product name, category, CTA
- Badge and Y MARKET branding
- Handles both real product photos and text-only placeholders

Usage:
  python3 image_agent.py                  # Process all items
  python3 image_agent.py --batch 10       # Process in batches of 10
  python3 image_agent.py --category "קפה" # Process specific category
  python3 image_agent.py --dry-run        # Just show what would be processed
"""
import json, os, sys, math, random, argparse, shutil
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# ─── Configuration ───
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ITEMS_DIR = os.path.join(BASE_DIR, 'items')
OUTPUT_DIR = os.path.join(BASE_DIR, 'items_designed')
BACKUP_DIR = os.path.join(BASE_DIR, 'items_backup')
PRODUCTS_JSON = os.path.join(BASE_DIR, 'data', 'products.json')
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

SIZE = 800
CROP_TOP = 4      # Remove top accent line from original
CROP_BOTTOM = 55  # Remove bottom category bar from original

# ─── Category Design System ───
CATEGORY_DESIGNS = {
    "בטיחות ומיגון אישי (PPE)": {
        "bg_dark": (15, 12, 8),
        "gradient": [(255, 120, 50), (255, 200, 60)],
        "accent": (255, 120, 50),
        "accent2": (255, 200, 60),
        "glow": (255, 140, 40),
        "badge": "PPE PRO",
    },
    "כלי עבודה וציוד משקי": {
        "bg_dark": (10, 8, 18),
        "gradient": [(100, 126, 234), (118, 75, 162)],
        "accent": (130, 100, 255),
        "accent2": (200, 150, 255),
        "glow": (120, 90, 230),
        "badge": "PRO TOOLS",
    },
    "שקיות ופתרונות אשפה": {
        "bg_dark": (8, 15, 10),
        "gradient": [(45, 52, 54), (0, 184, 148)],
        "accent": (0, 200, 160),
        "accent2": (0, 230, 180),
        "glow": (0, 180, 140),
        "badge": "EXTRA TOUGH",
    },
    "חומרי ניקוי וכימיקלים": {
        "bg_dark": (5, 15, 25),
        "gradient": [(0, 180, 216), (0, 119, 182)],
        "accent": (0, 200, 240),
        "accent2": (100, 220, 255),
        "glow": (0, 160, 220),
        "badge": "CLEANING PRO",
    },
    "אריזות מזון ו-Take Away": {
        "bg_dark": (20, 10, 5),
        "gradient": [(231, 111, 81), (244, 162, 97)],
        "accent": (240, 130, 80),
        "accent2": (255, 180, 120),
        "glow": (230, 120, 70),
        "badge": "FOOD SAFE",
    },
    "טקסטיל, מטליות וסחבות": {
        "bg_dark": (15, 8, 22),
        "gradient": [(131, 56, 236), (199, 125, 255)],
        "accent": (170, 100, 255),
        "accent2": (220, 170, 255),
        "glow": (150, 80, 240),
        "badge": "QUALITY",
    },
    "חד פעמי ואירוח": {
        "bg_dark": (5, 18, 15),
        "gradient": [(6, 214, 160), (17, 138, 178)],
        "accent": (6, 220, 170),
        "accent2": (100, 240, 200),
        "glow": (6, 200, 150),
        "badge": "HOSTING",
    },
    "עטיפה, אריזה ולוגיסטיקה": {
        "bg_dark": (18, 12, 5),
        "gradient": [(188, 108, 37), (221, 161, 94)],
        "accent": (210, 150, 70),
        "accent2": (240, 190, 120),
        "glow": (200, 140, 60),
        "badge": "LOGISTICS",
    },
    "מוצרי נייר וניגוב": {
        "bg_dark": (8, 15, 10),
        "gradient": [(144, 190, 109), (67, 170, 139)],
        "accent": (120, 200, 130),
        "accent2": (180, 230, 170),
        "glow": (100, 180, 110),
        "badge": "SOFT & STRONG",
    },
    "קפה, שתייה וכיבוד": {
        "bg_dark": (15, 10, 5),
        "gradient": [(111, 78, 55), (196, 168, 130)],
        "accent": (200, 170, 130),
        "accent2": (230, 200, 160),
        "glow": (180, 140, 90),
        "badge": "PREMIUM",
    },
    "ציוד משרדי וכללי": {
        "bg_dark": (8, 10, 20),
        "gradient": [(58, 134, 255), (131, 56, 236)],
        "accent": (80, 150, 255),
        "accent2": (140, 180, 255),
        "glow": (60, 130, 250),
        "badge": "OFFICE PRO",
    },
    "ציוד טכני ואחזקה": {
        "bg_dark": (15, 8, 8),
        "gradient": [(230, 57, 70), (69, 123, 157)],
        "accent": (240, 80, 80),
        "accent2": (255, 130, 130),
        "glow": (220, 60, 60),
        "badge": "HEAVY DUTY",
    },
    "עזרה ראשונה - רפואי": {
        "bg_dark": (18, 5, 10),
        "gradient": [(255, 0, 110), (251, 86, 7)],
        "accent": (255, 50, 100),
        "accent2": (255, 120, 150),
        "glow": (240, 40, 90),
        "badge": "MEDICAL",
    },
    "טואלטיקה וטיפוח אישי": {
        "bg_dark": (8, 15, 18),
        "gradient": [(168, 218, 220), (69, 123, 157)],
        "accent": (120, 200, 220),
        "accent2": (180, 230, 240),
        "glow": (100, 190, 210),
        "badge": "HYGIENE PRO",
    },
}

# Default design for items without a known category
DEFAULT_DESIGN = {
    "bg_dark": (12, 12, 18),
    "gradient": [(100, 100, 180), (60, 60, 120)],
    "accent": (120, 120, 200),
    "accent2": (170, 170, 230),
    "glow": (100, 100, 180),
    "badge": "Y MARKET",
}


# ═══════════════════════════════════════════
#  RENDERING ENGINE
# ═══════════════════════════════════════════

def draw_background(canvas, d):
    """Dark gradient background"""
    draw = ImageDraw.Draw(canvas)
    bg = d['bg_dark']
    for y in range(SIZE):
        t = y / SIZE
        r = int(bg[0] * (1 + t * 0.4))
        g = int(bg[1] * (1 + t * 0.4))
        b = int(bg[2] * (1 + t * 0.4))
        draw.line([(0, y), (SIZE, y)], fill=(min(r, 45), min(g, 45), min(b, 45)))
    return canvas


def draw_glow(canvas, d):
    """Central glow + corner accents"""
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    gc = d['glow']

    # Central glow
    cx, cy = SIZE // 2, SIZE // 2 - 50
    for r in range(380, 0, -3):
        alpha = int(30 * (1 - r / 380))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*gc, alpha))

    # Corner accents
    for r in range(220, 0, -4):
        alpha = int(16 * (1 - r / 220))
        draw.ellipse([-r // 2, -r // 2, r, r], fill=(*d['accent'], alpha))
        draw.ellipse([SIZE - r, SIZE - r, SIZE + r // 2, SIZE + r // 2], fill=(*d['accent2'], alpha))

    return Image.alpha_composite(canvas, layer)


def draw_particles(canvas, d, seed=42):
    """Bokeh + sparkles + lines"""
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)

    # Bokeh circles
    for _ in range(18):
        x, y = rng.randint(0, SIZE), rng.randint(0, SIZE)
        r = rng.randint(10, 45)
        alpha = rng.randint(6, 22)
        c = d['accent'] if rng.random() > 0.5 else d['accent2']
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(*c, alpha))

    # Sparkle dots
    for _ in range(35):
        x, y = rng.randint(0, SIZE), rng.randint(0, SIZE)
        s = rng.randint(1, 3)
        alpha = rng.randint(25, 90)
        draw.ellipse([x - s, y - s, x + s, y + s], fill=(255, 255, 255, alpha))

    # Thin lines
    for _ in range(5):
        x1 = rng.randint(0, SIZE)
        y1 = rng.randint(0, SIZE)
        angle = rng.uniform(0, math.pi)
        length = rng.randint(60, 180)
        x2 = int(x1 + length * math.cos(angle))
        y2 = int(y1 + length * math.sin(angle))
        draw.line([(x1, y1), (x2, y2)], fill=(*d['accent'], 18), width=1)

    return Image.alpha_composite(canvas, layer)


def draw_accent_bars(canvas, d):
    """Left stripe + top bar gradient"""
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    c1, c2 = d['accent'], d['accent2']

    # Left stripe
    for y in range(SIZE):
        t = y / SIZE
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        alpha = int(160 * (0.3 + 0.7 * math.sin(t * math.pi)))
        draw.line([(0, y), (5, y)], fill=(r, g, b, alpha))

    # Top bar
    for x in range(SIZE):
        t = x / SIZE
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(x, 0), (x, 4)], fill=(r, g, b, 200))

    return Image.alpha_composite(canvas, layer)


def extract_product(img_path):
    """Load image, crop category bars from top and bottom"""
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    cropped = img.crop((0, CROP_TOP, w, h - CROP_BOTTOM))
    return cropped


def is_placeholder(img):
    """Detect if image is a text-only placeholder (no real product photo)"""
    content = img.crop((50, 50, img.width - 50, img.height - 100))
    pixels = list(content.getdata())[::80]
    if not pixels:
        return True
    avg_r = sum(p[0] for p in pixels) / len(pixels)
    avg_g = sum(p[1] for p in pixels) / len(pixels)
    avg_b = sum(p[2] for p in pixels) / len(pixels)
    # Placeholders are mostly uniform light gray (230+)
    if avg_r > 225 and avg_g > 225 and avg_b > 225:
        variance = max(p[0] for p in pixels) - min(p[0] for p in pixels)
        if variance < 60:
            return True
    return False


def place_product(canvas, product_img, d):
    """Place product with shadow and white container"""
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))

    # Resize product
    pw, ph = product_img.size
    max_sz = 560
    ratio = min(max_sz / pw, max_sz / ph)
    nw, nh = int(pw * ratio), int(ph * ratio)
    product_resized = product_img.resize((nw, nh), Image.LANCZOS)

    px = (SIZE - nw) // 2
    py = 70

    # Shadow
    shadow = Image.new('RGBA', (nw + 50, nh + 50), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([12, 18, nw + 38, nh + 42], radius=22, fill=(0, 0, 0, 45))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=22))
    layer.paste(shadow, (px - 25, py - 12), shadow)

    # White container
    container = Image.new('RGBA', (nw + 20, nh + 20), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(container)
    cdraw.rounded_rectangle([0, 0, nw + 19, nh + 19], radius=18,
                            fill=(255, 255, 255, 245), outline=(*d['accent'], 40), width=1)
    layer.paste(container, (px - 10, py - 10), container)

    # Product
    layer.paste(product_resized, (px, py), product_resized)

    return Image.alpha_composite(canvas, layer)


def draw_info_panel(canvas, name, category, d):
    """Bottom panel with name, category, CTA"""
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    pt = SIZE - 152  # panel top

    # Panel background
    draw.rounded_rectangle([16, pt, SIZE - 16, SIZE - 15], radius=20, fill=(8, 8, 16, 215))
    draw.rounded_rectangle([17, pt + 1, SIZE - 17, SIZE - 16], radius=19, outline=(*d['accent'], 35), width=1)

    # Accent bar
    c1, c2 = d['accent'], d['accent2']
    for y in range(pt + 12, pt + 58):
        t = (y - pt - 12) / 46
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(SIZE - 38, y), (SIZE - 33, y)], fill=(r, g, b, 200))

    # Product name
    nf = ImageFont.truetype(FONT_BOLD, 23)
    disp = name if len(name) < 36 else name[:33] + "..."
    draw.text((SIZE - 50, pt + 14), disp, fill=(255, 255, 255, 240), font=nf, anchor="ra")

    # Category
    cf = ImageFont.truetype(FONT_REG, 13)
    draw.text((SIZE - 50, pt + 46), category, fill=(*d['accent'], 180), font=cf, anchor="ra")

    # CTA button
    bf = ImageFont.truetype(FONT_BOLD, 14)
    btn = "הוסף לעגלה  ←"
    bb = draw.textbbox((0, 0), btn, font=bf)
    bw = bb[2] - bb[0] + 34
    bh = 36
    bx = SIZE - 50 - bw
    by = pt + 80
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=18, fill=(*d['accent'], 215))
    draw.rounded_rectangle([bx + 1, by + 1, bx + bw - 1, by + bh // 2], radius=18, fill=(255, 255, 255, 25))
    draw.text((bx + bw // 2, by + 8), btn, fill=(255, 255, 255, 245), font=bf, anchor="ma")

    # Branding
    sf = ImageFont.truetype(FONT_BOLD, 10)
    draw.text((40, pt + 112), "Y  M A R K E T", fill=(255, 255, 255, 55), font=sf)
    draw.line([(40, pt + 127), (115, pt + 127)], fill=(*d['accent'], 25), width=1)

    return Image.alpha_composite(canvas, layer)


def draw_badge(canvas, d):
    """Top-right category badge"""
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    bf = ImageFont.truetype(FONT_BOLD, 13)
    text = d['badge']
    bb = draw.textbbox((0, 0), text, font=bf)
    tw = bb[2] - bb[0] + 26
    th = 32
    bx = SIZE - tw - 18
    by = 16

    # Shadow
    draw.rounded_rectangle([bx + 2, by + 3, bx + tw + 2, by + th + 3], radius=16, fill=(0, 0, 0, 55))
    # Body
    draw.rounded_rectangle([bx, by, bx + tw, by + th], radius=16, fill=(*d['accent'], 210))
    # Highlight
    draw.rounded_rectangle([bx + 1, by + 1, bx + tw - 1, by + th // 2], radius=16, fill=(255, 255, 255, 30))
    # Text
    draw.text((bx + tw // 2, by + 7), text, fill=(255, 255, 255, 240), font=bf, anchor="ma")

    return Image.alpha_composite(canvas, layer)


def create_designed_image(img_path, product_name, category_name, output_path):
    """Main render pipeline"""
    # Get design config
    d = CATEGORY_DESIGNS.get(category_name, DEFAULT_DESIGN)

    # Use item ID as seed for consistent but varied particles
    seed = hash(os.path.basename(img_path)) % 10000

    # Build canvas
    canvas = Image.new('RGBA', (SIZE, SIZE), (*d['bg_dark'], 255))
    canvas = draw_background(canvas, d)
    canvas = draw_glow(canvas, d)
    canvas = draw_particles(canvas, d, seed=seed)
    canvas = draw_accent_bars(canvas, d)

    # Extract and place product
    product = extract_product(img_path)
    canvas = place_product(canvas, product, d)

    # UI elements
    canvas = draw_info_panel(canvas, product_name, category_name, d)
    canvas = draw_badge(canvas, d)

    # Final: slight contrast boost
    final = canvas.convert('RGB')
    final = ImageEnhance.Contrast(final).enhance(1.05)
    final.save(output_path, quality=93, optimize=True)


# ═══════════════════════════════════════════
#  AGENT CONTROLLER
# ═══════════════════════════════════════════

def load_products():
    with open(PRODUCTS_JSON) as f:
        return json.load(f)


def run_agent(batch_size=10, category_filter=None, dry_run=False, start_from=0):
    """Main agent: process images in batches, pause for feedback"""
    data = load_products()
    items = data['items']

    # Filter by category if specified
    if category_filter:
        items = [i for i in items if category_filter in i.get('categoryName', '')]
        print(f"🔍 Filtered to category containing '{category_filter}': {len(items)} items")

    # Create output dir
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Create backup of originals (first run only)
    if not os.path.exists(BACKUP_DIR) and not dry_run:
        print("📦 Creating backup of original images...")
        os.makedirs(BACKUP_DIR, exist_ok=True)

    total = len(items)
    processed = 0
    skipped = 0
    errors = 0
    batch_count = 0

    print(f"\n{'='*60}")
    print(f"  🎨 Y Market Image Agent V2.1")
    print(f"  📊 Total items: {total}")
    print(f"  📁 Output: {OUTPUT_DIR}")
    print(f"  🔄 Batch size: {batch_size}")
    print(f"{'='*60}\n")

    for idx, item in enumerate(items):
        if idx < start_from:
            continue

        img_file = item['imageUrl'].replace('/items/', '')
        img_path = os.path.join(ITEMS_DIR, img_file)
        output_path = os.path.join(OUTPUT_DIR, img_file)
        cat_name = item.get('categoryName', '')

        if not os.path.exists(img_path):
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY] #{idx:4d} | {item['name'][:40]} | {cat_name}")
            processed += 1
            continue

        try:
            # Backup original if not already done
            backup_path = os.path.join(BACKUP_DIR, img_file)
            if not os.path.exists(backup_path):
                shutil.copy2(img_path, backup_path)

            # Create designed image
            create_designed_image(img_path, item['name'], cat_name, output_path)
            processed += 1
            status = "✅"
        except Exception as e:
            errors += 1
            status = "❌"
            print(f"  {status} ERROR: {e}")

        # Progress
        pct = (idx + 1) / total * 100
        print(f"  {status} [{idx+1:4d}/{total}] {pct:5.1f}% | {item['name'][:40]}")

        # Batch checkpoint
        if processed > 0 and processed % batch_size == 0:
            batch_count += 1
            print(f"\n{'─'*60}")
            print(f"  ⏸️  BATCH #{batch_count} COMPLETE ({processed} images processed)")
            print(f"  📊 Progress: {processed}/{total} | Skipped: {skipped} | Errors: {errors}")
            print(f"  📁 Output in: {OUTPUT_DIR}")
            print(f"{'─'*60}")

            # Interactive mode: ask for feedback
            if sys.stdin.isatty():
                resp = input("\n  👉 Continue? [Y/n/q] ").strip().lower()
                if resp in ('n', 'q', 'quit', 'exit'):
                    print(f"\n  🛑 Stopped at item #{idx+1}. Resume with --start-from {idx+1}")
                    break
            print()

    # Final summary
    print(f"\n{'='*60}")
    print(f"  🏁 AGENT COMPLETE")
    print(f"  ✅ Processed: {processed}")
    print(f"  ⏭️  Skipped: {skipped}")
    print(f"  ❌ Errors: {errors}")
    print(f"  📁 Output: {OUTPUT_DIR}")
    print(f"  💾 Backups: {BACKUP_DIR}")
    print(f"{'='*60}")

    return processed, errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Y Market Image Agent')
    parser.add_argument('--batch', type=int, default=10, help='Batch size before pausing')
    parser.add_argument('--category', type=str, default=None, help='Filter by category name')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be processed')
    parser.add_argument('--start-from', type=int, default=0, help='Skip first N items')
    args = parser.parse_args()

    run_agent(
        batch_size=args.batch,
        category_filter=args.category,
        dry_run=args.dry_run,
        start_from=args.start_from
    )
