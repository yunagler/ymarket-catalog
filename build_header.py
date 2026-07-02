#!/usr/bin/env python3
"""
build_header.py - Single source of truth for the site header.

Reads includes/site-header.html and replaces the header block in every
HTML file across the site. Handles both the NEW format (announcement +
info-bar + header) and the OLD/legacy format (top-bar + header).

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


# --- NEW format: announcement + info-bar + header ---
NEW_HEADER_PATTERN = re.compile(
    r'(?:[ \t]*<!--[^\n]*?(?:ANNOUNCEMENT|Top Bar)[^\n]*?-->[ \t]*\n)?'
    r'[ \t]*<div\s+class="announcement"'
    r'.*?'
    r'<header\s+class="header"[^>]*>'
    r'.*?'
    r'</header>',
    re.DOTALL,
)

# --- OLD/legacy format: top-bar + header (no announcement div) ---
OLD_HEADER_PATTERN = re.compile(
    r'(?:[ \t]*<!--[^\n]*?Top Bar[^\n]*?-->[ \t]*\n)?'
    r'[ \t]*<div\s+class="top-bar"'
    r'.*?'
    r'<header\s+class="header"[^>]*>'
    r'.*?'
    r'</header>',
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
    """
    Returns (status, details).
    status in: 'replaced', 'no_header', 'no_change', 'error'

    Handles three cases:
    1. OLD only (top-bar + header)         -> replace with template
    2. NEW only (announcement + header)    -> replace with template
    3. BOTH (duplicate: old + new)         -> remove old, replace new with template
    """
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        return ("error", f"read failed: {e}")

    has_top_bar = 'class="top-bar"' in content
    has_announcement = 'class="announcement"' in content
    has_header = 'class="header"' in content

    if not has_header:
        return ("no_header", None)
    if not has_top_bar and not has_announcement:
        return ("no_header", None)

    work = content
    detail_parts = []

    # Step 1: If BOTH old and new exist (duplicate), strip the old block first
    if has_top_bar and has_announcement:
        stripped, n = OLD_HEADER_PATTERN.subn('', work, count=1)
        if n > 0:
            # Clean up leftover blank lines from removal
            stripped = re.sub(r'\n{3,}', '\n\n', stripped)
            work = stripped
            detail_parts.append("removed old top-bar header")

    # Step 2: Replace the new-format header (or remaining old-format) with template
    replaced = False

    if 'class="announcement"' in work:
        new_content, n = NEW_HEADER_PATTERN.subn(template, work, count=1)
        if n > 0:
            work = new_content
            replaced = True
            detail_parts.append("replaced new-format header")

    if not replaced and 'class="top-bar"' in work:
        new_content, n = OLD_HEADER_PATTERN.subn(template, work, count=1)
        if n > 0:
            work = new_content
            replaced = True
            detail_parts.append("replaced old-format header")

    if not replaced:
        return ("error", "pattern did not match (file has header markers but regex failed)")

    if work == content:
        return ("no_change", "already matches template")

    detail = "; ".join(detail_parts)

    if dry_run:
        return ("replaced", f"(dry-run) {detail}")

    # Backup
    if backup_root:
        rel = os.path.relpath(path, WEBSITE_DIR)
        backup_path = os.path.join(backup_root, rel)
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        shutil.copy2(path, backup_path)

    with open(path, "w", encoding="utf-8") as f:
        f.write(work)
    return ("replaced", detail)


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
