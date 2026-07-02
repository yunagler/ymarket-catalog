#!/usr/bin/env python3
"""Audit footer variants across the site."""
import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = r"C:\Users\DELL\ymarket\website"
SKIP = {"node_modules", "build", "__pycache__", "saleor-ref", "backups", "includes", ".claude"}

stats = {
    "total": 0,
    "has_footer_class": 0,      # <footer class="footer">
    "has_footer_grid": 0,       # .footer__grid (canonical structure)
    "has_footer_brand": 0,      # .footer__brand (canonical)
    "has_footer_copyright": 0,  # .footer__copyright (canonical)
    "has_footer_legal": 0,      # .footer__legal (canonical)
    "has_ym2_footer": 0,        # .ym2-footer (new injected)
    "no_footer": 0,
}

variants = {}

for root, dirs, names in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP and not d.startswith(".")]
    for n in names:
        if not n.endswith(".html") or n.endswith(".bak"):
            continue
        p = os.path.join(root, n)
        try:
            with open(p, encoding="utf-8") as f:
                c = f.read()
        except Exception:
            continue
        stats["total"] += 1
        f_class = 'class="footer"' in c
        f_grid = 'class="footer__grid"' in c
        f_brand = 'class="footer__brand"' in c
        f_copyright = 'class="footer__copyright"' in c or 'footer__copyright' in c
        f_legal = 'class="footer__legal"' in c or 'footer__legal' in c
        f_ym2 = 'class="ym2-footer"' in c
        if f_class: stats["has_footer_class"] += 1
        if f_grid: stats["has_footer_grid"] += 1
        if f_brand: stats["has_footer_brand"] += 1
        if f_copyright: stats["has_footer_copyright"] += 1
        if f_legal: stats["has_footer_legal"] += 1
        if f_ym2: stats["has_ym2_footer"] += 1
        if not (f_class or f_ym2):
            stats["no_footer"] += 1

        sig = (f_class, f_grid, f_brand, f_copyright, f_legal, f_ym2)
        variants[sig] = variants.get(sig, 0) + 1

for k, v in stats.items():
    print(f"{k}: {v}")
print()
print("Signatures (footer, grid, brand, copyright, legal, ym2_footer):")
for sig, cnt in sorted(variants.items(), key=lambda x: -x[1]):
    print(f"  {sig} -> {cnt}")
