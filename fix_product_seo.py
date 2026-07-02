#!/usr/bin/env python3
"""
Fix SEO and GEO issues across all 825 product pages.
Issues fixed:
1. Broken tech specs display (raw JSON -> HTML table)
2. Add analytics.min.js if missing
3. Add GEO/Local SEO to Product schema (areaServed + availableAtOrFrom)
4. Enhance short meta descriptions
5. Add hreflang if missing
6. Fix minimum order display (500 -> 200 + מע"מ)
"""

import os
import re
import json
import html

PRODUCTS_DIR = r"C:\Users\DELL\ymarket\website\products"

# Counters
fixes = {
    "tech_specs": 0,
    "analytics": 0,
    "geo_schema": 0,
    "meta_description": 0,
    "hreflang": 0,
    "min_order": 0,
}
errors = []
processed = 0


def fix_tech_specs(content):
    """Fix #1: Parse raw JSON tech specs and render as HTML table."""
    # Pattern: a <p> tag containing a JSON array [{...},...] inside the tech specs div
    pattern = r'(<p\s+style="[^"]*">)\s*(\[\s*\{["\u0590-\u05FF].*?\}\s*\])\s*(</p>)'

    def replace_json_with_table(m):
        prefix_tag = m.group(1)  # not used - we replace the whole thing
        json_str = m.group(2)
        try:
            # Unescape HTML entities that might be in the JSON
            json_clean = html.unescape(json_str)
            specs = json.loads(json_clean)
            if not isinstance(specs, list) or not specs:
                return m.group(0)
            rows = ""
            for spec in specs:
                label = html.escape(str(spec.get("label", "")))
                value = html.escape(str(spec.get("value", "")))
                rows += f'<tr><td style="font-weight:600;padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#1B3A5C;white-space:nowrap">{label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#4b5563">{value}</td></tr>\n'
            table = f'<table class="spec-table" style="width:100%;border-collapse:collapse;font-size:0.9rem;line-height:1.7">\n{rows}</table>'
            return table
        except (json.JSONDecodeError, TypeError):
            return m.group(0)

    new_content = re.sub(pattern, replace_json_with_table, content, flags=re.DOTALL)
    changed = new_content != content
    return new_content, changed


def fix_analytics(content):
    """Fix #2: Add analytics.min.js before </head> if not present."""
    if "analytics.min.js" in content:
        return content, False
    # Insert before </head>
    analytics_tag = '  <script src="/js/analytics.min.js" defer></script>\n'
    new_content = content.replace("</head>", analytics_tag + "</head>", 1)
    changed = new_content != content
    return new_content, changed


def fix_geo_schema(content):
    """Fix #3: Add areaServed and availableAtOrFrom to offers in Product JSON-LD."""
    if "areaServed" in content:
        return content, False

    # Find the Product JSON-LD script
    pattern = r'(<script\s+type="application/ld\+json">)\s*(\{[^<]*?"@type"\s*:\s*"Product"[^<]*?)\s*(</script>)'

    def add_geo_to_schema(m):
        script_open = m.group(1)
        json_str = m.group(2)
        script_close = m.group(3)
        try:
            data = json.loads(json_str)
            if data.get("@type") != "Product":
                return m.group(0)
            if "offers" in data and isinstance(data["offers"], dict):
                data["offers"]["areaServed"] = {
                    "@type": "Country",
                    "name": "\u05d9\u05e9\u05e8\u05d0\u05dc"  # ישראל
                }
                data["offers"]["availableAtOrFrom"] = {
                    "@type": "Place",
                    "name": "\u05d5\u05d5\u05d0\u05d9 \u05de\u05e8\u05e7\u05d8 - \u05d2\u05ea \u05e8\u05d9\u05de\u05d5\u05df",  # וואי מרקט - גת רימון
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "\u05d2\u05ea \u05e8\u05d9\u05de\u05d5\u05df",  # גת רימון
                        "addressCountry": "IL"
                    }
                }
            # Re-serialize with nice formatting
            new_json = json.dumps(data, ensure_ascii=False, indent=2)
            return f"{script_open}{new_json}{script_close}"
        except (json.JSONDecodeError, TypeError):
            return m.group(0)

    new_content = re.sub(pattern, add_geo_to_schema, content, flags=re.DOTALL)
    changed = new_content != content
    return new_content, changed


def fix_meta_description(content):
    """Fix #4: Enhance short meta descriptions (< 80 chars)."""
    suffix = " | הזמנה אונליין, משלוח ארצי, מחירי סיטונאות. וואי מרקט \u260e 03-7740400"

    pattern = r'(<meta\s+name="description"\s+content=")([^"]*?)(")'

    def enhance_desc(m):
        prefix = m.group(1)
        desc = m.group(2)
        closing = m.group(3)
        if len(desc) < 80 and suffix.strip(" |") not in desc:
            return f'{prefix}{desc}{suffix}{closing}'
        return m.group(0)

    new_content = re.sub(pattern, enhance_desc, content)
    changed = new_content != content
    return new_content, changed


def fix_hreflang(content):
    """Fix #5: Add hreflang if missing."""
    if 'hreflang' in content:
        return content, False

    # Extract canonical URL
    canonical_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', content)
    if not canonical_match:
        return content, False

    canonical_url = canonical_match.group(1)
    hreflang_tag = f'  <link rel="alternate" hreflang="he" href="{canonical_url}">\n'

    # Insert after canonical link
    new_content = content.replace(
        canonical_match.group(0) + ">",
        canonical_match.group(0) + ">\n" + hreflang_tag.rstrip("\n"),
        1
    )
    # If canonical is self-closing without >
    if new_content == content:
        new_content = content.replace(
            canonical_match.group(0),
            canonical_match.group(0) + ">\n" + hreflang_tag.rstrip("\n"),
            1
        )
    # Fallback: insert before </head>
    if new_content == content:
        new_content = content.replace("</head>", hreflang_tag + "</head>", 1)

    changed = new_content != content
    return new_content, changed


def fix_min_order(content):
    """Fix #6: Change minimum order from 500₪ to 200₪ + מע״מ."""
    old = 'הזמנה מינימלית: 500₪'
    new = 'הזמנה מינימלית: 200₪ + מע״מ'
    if old not in content:
        return content, False
    new_content = content.replace(old, new)
    return new_content, True


def process_file(filepath):
    """Apply all fixes to a single product page."""
    global processed
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        errors.append(f"Read error {filepath}: {e}")
        return

    original = content
    page_fixes = []

    content, changed = fix_tech_specs(content)
    if changed:
        page_fixes.append("tech_specs")
        fixes["tech_specs"] += 1

    content, changed = fix_analytics(content)
    if changed:
        page_fixes.append("analytics")
        fixes["analytics"] += 1

    content, changed = fix_geo_schema(content)
    if changed:
        page_fixes.append("geo_schema")
        fixes["geo_schema"] += 1

    content, changed = fix_meta_description(content)
    if changed:
        page_fixes.append("meta_description")
        fixes["meta_description"] += 1

    content, changed = fix_hreflang(content)
    if changed:
        page_fixes.append("hreflang")
        fixes["hreflang"] += 1

    content, changed = fix_min_order(content)
    if changed:
        page_fixes.append("min_order")
        fixes["min_order"] += 1

    if content != original:
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
        except Exception as e:
            errors.append(f"Write error {filepath}: {e}")

    processed += 1


def main():
    print("=" * 60)
    print("  YMarket Product Pages SEO/GEO Fix Script")
    print("=" * 60)
    print(f"\nScanning: {PRODUCTS_DIR}\n")

    # Collect all product page paths
    pages = []
    for entry in os.listdir(PRODUCTS_DIR):
        index_path = os.path.join(PRODUCTS_DIR, entry, "index.html")
        if os.path.isfile(index_path):
            pages.append(index_path)

    print(f"Found {len(pages)} product pages\n")

    for i, page in enumerate(pages):
        process_file(page)
        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/{len(pages)}...")

    # Summary
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print(f"\n  Total pages processed: {processed}")
    print(f"\n  Fixes applied:")
    print(f"    1. Tech specs (JSON -> table):  {fixes['tech_specs']}")
    print(f"    2. Analytics script added:       {fixes['analytics']}")
    print(f"    3. GEO schema added:             {fixes['geo_schema']}")
    print(f"    4. Meta description enhanced:    {fixes['meta_description']}")
    print(f"    5. Hreflang tag added:           {fixes['hreflang']}")
    print(f"    6. Min order fixed (500->200):   {fixes['min_order']}")
    total_fixes = sum(fixes.values())
    print(f"\n  Total fixes: {total_fixes}")

    if errors:
        print(f"\n  Errors ({len(errors)}):")
        for e in errors[:10]:
            print(f"    - {e}")
        if len(errors) > 10:
            print(f"    ... and {len(errors) - 10} more")

    print("\n" + "=" * 60)
    print("  Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
