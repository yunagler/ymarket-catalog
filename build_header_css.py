#!/usr/bin/env python3
"""
build_header_css.py - Extract index.html's inline <style> to /css/site-header.css
and ensure every HTML page links it in <head>.

This is the CSS counterpart of build_header.py.

- Source of truth: index.html's inline <style> block
- Output: css/site-header.css
- Injection: adds <link rel="stylesheet" href="/css/site-header.css?v=TIMESTAMP">
  right before </head> on all HTML pages that have a header block.

Re-run whenever index.html's inline styles change.
"""

import os
import re
import sys
import io
import shutil
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(WEBSITE_DIR, "index.html")
CSS_OUT = os.path.join(WEBSITE_DIR, "css", "site-header.css")
VERSION = datetime.now().strftime("%Y%m%d%H%M")
LINK_HREF = f"/css/site-header.css?v={VERSION}"
LINK_TAG = f'<link rel="stylesheet" href="{LINK_HREF}">'
# Pattern that matches an existing site-header.css link (any version)
EXISTING_LINK_RE = re.compile(
    r'<link\s+rel="stylesheet"\s+href="/css/site-header\.css(?:\?[^"]*)?"\s*/?>'
)

SKIP_DIRS = {"node_modules", "build", "__pycache__", "saleor-ref", "backups", "includes", ".claude"}


def extract_style():
    with open(INDEX_PATH, encoding="utf-8") as f:
        content = f.read()
    m = re.search(r"<style>(.*?)</style>", content, re.DOTALL)
    if not m:
        raise SystemExit("index.html has no <style> block")
    return m.group(1).strip()


def write_css(style):
    os.makedirs(os.path.dirname(CSS_OUT), exist_ok=True)
    header = (
        "/* site-header.css - Generated from index.html inline <style>.\n"
        "   Source of truth: index.html\n"
        "   Propagated by: build_header_css.py\n"
        f"   Generated: {datetime.now().isoformat()}\n"
        "   DO NOT EDIT DIRECTLY. Edit the inline <style> in index.html, then run build_header_css.py\n"
        "*/\n"
    )
    with open(CSS_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(header + style + "\n")
    print(f"wrote {CSS_OUT} ({len(style)} chars)")


def find_html_files():
    files = []
    for root, dirs, fnames in os.walk(WEBSITE_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for name in fnames:
            if not name.endswith(".html") or name.endswith(".bak"):
                continue
            files.append(os.path.join(root, name))
    return files


def inject_link(content):
    """
    Return (new_content, status).
    status: 'updated' (link injected/refreshed), 'no_head' (no </head> found), 'no_change'.
    """
    has_header_block = 'class="header"' in content and 'class="announcement"' in content
    if not has_header_block:
        return content, "no_header"

    existing = EXISTING_LINK_RE.search(content)
    if existing:
        if existing.group(0) == LINK_TAG:
            return content, "no_change"
        # Replace the old versioned link with the new one
        new_content = EXISTING_LINK_RE.sub(LINK_TAG, content, count=1)
        return new_content, "updated"

    # No existing link - inject right before </head>
    if "</head>" not in content:
        return content, "no_head"

    new_content = content.replace("</head>", f"  {LINK_TAG}\n</head>", 1)
    return new_content, "updated"


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--file", help="process single file")
    ap.add_argument("--skip-extract", action="store_true",
                    help="skip regenerating css/site-header.css, only inject links")
    args = ap.parse_args()

    if not args.skip_extract:
        style = extract_style()
        if not args.dry_run:
            write_css(style)
        else:
            print(f"(dry-run) would write site-header.css ({len(style)} chars)")

    files = [os.path.abspath(args.file)] if args.file else find_html_files()
    print(f"HTML files: {len(files)}")
    print(f"Mode: {'DRY-RUN' if args.dry_run else 'LIVE'}")
    print(f"Link tag: {LINK_TAG}")
    print()

    counts = {"updated": 0, "no_change": 0, "no_header": 0, "no_head": 0, "error": 0}
    errors = []
    for path in files:
        try:
            with open(path, encoding="utf-8") as f:
                c = f.read()
            new_c, status = inject_link(c)
            counts[status] = counts.get(status, 0) + 1
            if status == "updated" and not args.dry_run:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_c)
        except Exception as e:
            counts["error"] += 1
            errors.append((path, str(e)))

    print("=== RESULTS ===")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    if errors:
        print("\nerrors:")
        for p, e in errors[:20]:
            print(f"  {p}: {e}")
    return 0 if counts["error"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
