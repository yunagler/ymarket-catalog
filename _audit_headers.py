#!/usr/bin/env python3
"""Audit header variants across the site."""
import os, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = r"C:\Users\DELL\ymarket\website"
SKIP = ("node_modules", "build", "__pycache__", ".bak", "saleor-ref", "backups", "includes")

stats = {
    "total": 0,
    "with_mega_menu": 0,     # rich header like index.html
    "without_mega_menu": 0,  # simple header like product pages
    "has_info_bar": 0,
    "has_announcement": 0,
    "has_top_bar_legacy": 0,
    "no_header_at_all": 0,
    "has_main_nav": 0,
}

variants = {}  # signature -> count

for root, dirs, files in os.walk(ROOT):
    if any(s in root for s in SKIP):
        continue
    for name in files:
        if not name.endswith(".html"):
            continue
        if name.endswith(".bak"):
            continue
        path = os.path.join(root, name)
        try:
            with open(path, encoding="utf-8") as f:
                c = f.read()
        except Exception:
            continue
        stats["total"] += 1
        has_header = 'class="header"' in c or "class='header'" in c
        has_mega = 'class="mega-menu"' in c
        has_info = 'class="info-bar"' in c
        has_ann = 'class="announcement"' in c
        has_top_bar = 'class="top-bar"' in c
        has_main_nav = 'class="main-nav"' in c

        if has_mega:
            stats["with_mega_menu"] += 1
        elif has_header:
            stats["without_mega_menu"] += 1
        else:
            stats["no_header_at_all"] += 1
        if has_info: stats["has_info_bar"] += 1
        if has_ann: stats["has_announcement"] += 1
        if has_top_bar: stats["has_top_bar_legacy"] += 1
        if has_main_nav: stats["has_main_nav"] += 1

        sig = (has_header, has_mega, has_info, has_ann, has_top_bar, has_main_nav)
        variants[sig] = variants.get(sig, 0) + 1

for k, v in stats.items():
    print(f"{k}: {v}")
print()
print("Signatures (header, mega, info_bar, announcement, top_bar_legacy, main_nav):")
for sig, cnt in sorted(variants.items(), key=lambda x: -x[1]):
    print(f"  {sig} -> {cnt}")
