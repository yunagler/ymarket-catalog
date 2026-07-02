#!/usr/bin/env python3
"""
build_footer.py - Single source of truth for the site footer.

Reads includes/site-footer.html and replaces the <footer class="footer">...</footer>
block in every HTML file across the site.

Usage:
    python build_footer.py --dry-run
    python build_footer.py --dry-run --file <path>
    python build_footer.py                    # real run, with backup
    python build_footer.py --no-backup
"""

import os
import re
import sys
import io
import shutil
import argparse
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(WEBSITE_DIR, "includes", "site-footer.html")
BACKUP_DIR = os.path.join(
    WEBSITE_DIR, "backups", f"footers_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}"
)

SKIP_DIRS = {"node_modules", "build", "__pycache__", "saleor-ref", "backups", "includes", ".claude"}

# Pattern to match the footer block, including optional leading comment banner
FOOTER_PATTERN = re.compile(
    r'(?:[ \t]*<!--[^\n]*?FOOTER[^\n]*?-->[ \t]*\n)?'
    r'[ \t]*<footer\s+class="footer">'
    r'.*?'
    r'</footer>',
    re.DOTALL,
)


def load_template():
    with open(TEMPLATE_PATH, encoding="utf-8") as f:
        return f.read().rstrip()


def find_html_files():
    files = []
    for root, dirs, fnames in os.walk(WEBSITE_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for name in fnames:
            if not name.endswith(".html") or name.endswith(".bak"):
                continue
            files.append(os.path.join(root, name))
    return files


def process_file(path, template, dry_run=False, backup_root=None):
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        return ("error", f"read failed: {e}")

    if 'class="footer"' not in content:
        return ("no_footer", None)

    new_content, n = FOOTER_PATTERN.subn(template, content, count=1)
    if n == 0:
        return ("error", "regex did not match despite footer class presence")
    if new_content == content:
        return ("no_change", "already matches template")

    if dry_run:
        return ("replaced", "(dry-run) would write")

    if backup_root:
        rel = os.path.relpath(path, WEBSITE_DIR)
        backup_path = os.path.join(backup_root, rel)
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        shutil.copy2(path, backup_path)

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return ("replaced", "wrote")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-backup", action="store_true")
    ap.add_argument("--file", help="process a single file")
    args = ap.parse_args()

    if not os.path.exists(TEMPLATE_PATH):
        print(f"ERROR: template not found at {TEMPLATE_PATH}")
        sys.exit(2)

    template = load_template()
    print(f"Template: {TEMPLATE_PATH} ({len(template)} chars)")
    print(f"Website:  {WEBSITE_DIR}")
    print(f"Mode:     {'DRY-RUN' if args.dry_run else 'LIVE'}")

    files = [os.path.abspath(args.file)] if args.file else find_html_files()
    print(f"HTML files to scan: {len(files)}")

    backup_root = None
    if not args.dry_run and not args.no_backup:
        backup_root = BACKUP_DIR
        os.makedirs(backup_root, exist_ok=True)
        print(f"Backups:  {backup_root}")
    print()

    counts = {"replaced": 0, "no_footer": 0, "no_change": 0, "error": 0}
    errors = []
    for path in files:
        status, detail = process_file(path, template, dry_run=args.dry_run, backup_root=backup_root)
        counts[status] = counts.get(status, 0) + 1
        if status == "error":
            errors.append((path, detail))

    print("=== RESULTS ===")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    if errors:
        print(f"\n--- ERRORS ({len(errors)}) ---")
        for p, d in errors[:20]:
            print(f"  {p}: {d}")

    return 0 if counts["error"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
