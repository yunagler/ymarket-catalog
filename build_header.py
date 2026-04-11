#!/usr/bin/env python3
"""
build_header.py - Single source of truth for the site header.

Reads includes/site-header.html and replaces the header block
(announcement + info-bar + <header class="header">...</header>)
in every HTML file across the site.

Usage:
    python build_header.py --dry-run        # show what would change (no writes)
    python build_header.py --dry-run --file <path>  # dry-run a single file
    python build_header.py                  # real run, with backup
    python build_header.py --no-backup      # real run, no backup (NOT recommended)
"""

import os
import re
import sys
import io
import shutil
import argparse
from datetime import datetime

# Force UTF-8 on Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(WEBSITE_DIR, "includes", "site-header.html")
BACKUP_DIR = os.path.join(
    WEBSITE_DIR, "backups", f"headers_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}"
)

# Directories to skip
SKIP_DIRS = {"node_modules", "build", "__pycache__", "saleor-ref", "backups", "includes", ".claude"}


def build_pattern():
    """
    Pattern matches the header block:
    - Optional ANNOUNCEMENT comment
    - <div class="announcement">...</div>
    - (whitespace, optional INFO BAR comment)
    - <div class="info-bar">...</div>...  (this anchor not needed; we rely on non-greedy to </header>)
    - (whitespace, optional HEADER comment)
    - <header class="header" ...>...</header>

    We match from <div class="announcement"... to the FIRST </header>
    that appears after <header class="header". Non-greedy .*? ensures we
    stop at the first </header>, and there are no nested <header> tags inside.

    An optional decorative comment (ANNOUNCEMENT / INFO / HEADER banner) right
    before the announcement div is consumed too, so the replacement is clean.
    """
    return re.compile(
        r'(?:[ \t]*<!--[^\n]*?ANNOUNCEMENT[^\n]*?-->[ \t]*\n)?'
        r'[ \t]*<div\s+class="announcement"'
        r'.*?'
        r'<header\s+class="header"[^>]*>'
        r'.*?'
        r'</header>',
        re.DOTALL,
    )


HEADER_PATTERN = build_pattern()


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
    """
    Returns (status, details).
    status in: 'replaced', 'no_header', 'no_change', 'error'
    """
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        return ("error", f"read failed: {e}")

    has_announcement = 'class="announcement"' in content
    has_header = 'class="header"' in content

    if not (has_announcement and has_header):
        return ("no_header", None)

    new_content, n = HEADER_PATTERN.subn(template, content, count=1)
    if n == 0:
        return ("error", "pattern did not match (file has header markers but regex failed)")

    if new_content == content:
        return ("no_change", "already matches template")

    if dry_run:
        return ("replaced", "(dry-run) would write")

    # Backup
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
    ap.add_argument("--dry-run", action="store_true", help="report what would change without writing")
    ap.add_argument("--no-backup", action="store_true", help="skip backup (real run only)")
    ap.add_argument("--file", help="process a single file (for testing)")
    ap.add_argument("--show-diff", action="store_true", help="on dry-run, print a short preview")
    args = ap.parse_args()

    if not os.path.exists(TEMPLATE_PATH):
        print(f"ERROR: template not found at {TEMPLATE_PATH}")
        sys.exit(2)

    template = load_template()
    print(f"Template: {TEMPLATE_PATH} ({len(template)} chars)")
    print(f"Website:  {WEBSITE_DIR}")
    print(f"Mode:     {'DRY-RUN' if args.dry_run else 'LIVE'}")

    if args.file:
        files = [os.path.abspath(args.file)]
    else:
        files = find_html_files()
    print(f"HTML files to scan: {len(files)}")

    backup_root = None
    if not args.dry_run and not args.no_backup:
        backup_root = BACKUP_DIR
        os.makedirs(backup_root, exist_ok=True)
        print(f"Backups:  {backup_root}")
    print()

    counts = {"replaced": 0, "no_header": 0, "no_change": 0, "error": 0}
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
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")

    return 0 if counts["error"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
