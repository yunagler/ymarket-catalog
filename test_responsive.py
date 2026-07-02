"""
Responsive Testing Script - Y Market Website
Tests all pages across multiple device viewports.
Checks: overflow, small tap targets, hidden buttons, text visibility, z-index conflicts
"""

import asyncio
import json
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8877"

# Pages to test
PAGES = [
    ("index.html", "דף הבית"),
    ("catalog.html", "קטלוג"),
    ("about.html", "אודות"),
    ("contact.html", "צור קשר"),
    ("blog.html", "בלוג"),
    ("faq.html", "שאלות נפוצות"),
    ("cart.html", "עגלת קניות"),
    ("checkout.html", "צ'קאאוט"),
    ("login.html", "כניסה"),
    ("register.html", "הרשמה"),
    ("tracking.html", "מעקב הזמנה"),
    ("products/item-1000.html", "דף מוצר"),
    ("legal/privacy.html", "מדיניות פרטיות"),
    ("legal/terms.html", "תנאי שימוש"),
]

# Device viewports to test
VIEWPORTS = [
    {"name": "iPhone SE", "width": 375, "height": 667, "mobile": True},
    {"name": "iPhone 14", "width": 390, "height": 844, "mobile": True},
    {"name": "iPhone 14 Pro Max", "width": 430, "height": 932, "mobile": True},
    {"name": "Galaxy S20", "width": 360, "height": 800, "mobile": True},
    {"name": "Galaxy S21 Ultra", "width": 412, "height": 915, "mobile": True},
    {"name": "iPad Portrait", "width": 768, "height": 1024, "mobile": False},
    {"name": "iPad Landscape", "width": 1024, "height": 768, "mobile": False},
    {"name": "Desktop 1280", "width": 1280, "height": 800, "mobile": False},
    {"name": "Desktop 1920", "width": 1920, "height": 1080, "mobile": False},
]

# JS to inject for testing
CHECK_OVERFLOW_JS = """
() => {
    const docWidth = document.documentElement.offsetWidth;
    const issues = [];
    document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > docWidth + 2) {
            const style = getComputedStyle(el);
            // Skip intentionally hidden off-screen elements (mobile nav, sidebars)
            if (style.visibility === 'hidden' || style.opacity === '0') return;
            if (style.position === 'fixed' && (style.transform !== 'none' || parseFloat(style.right) < 0)) return;
            // Skip elements inside hidden parents
            const parent = el.closest('[style*="visibility: hidden"], .main-nav:not(.open), .catalog-sidebar:not(.open)');
            if (parent && !parent.classList.contains('open')) return;

            const tag = el.tagName.toLowerCase();
            const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
            const id = el.id ? '#' + el.id : '';
            issues.push({
                element: tag + id + cls,
                overflow: Math.round(rect.right - docWidth) + 'px',
                width: Math.round(rect.width) + 'px'
            });
        }
    });
    return issues;
}
"""

CHECK_SMALL_TAP_TARGETS_JS = """
() => {
    const clickable = document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]');
    const issues = [];
    clickable.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (rect.height > 0 && rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
            if (rect.height < 40 || rect.width < 40) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
                const id = el.id ? '#' + el.id : '';
                const text = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30);
                issues.push({
                    element: tag + id + cls,
                    width: Math.round(rect.width) + 'px',
                    height: Math.round(rect.height) + 'px',
                    text: text
                });
            }
        }
    });
    return issues;
}
"""

CHECK_HIDDEN_BUTTONS_JS = """
() => {
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"], a.btn');
    const issues = [];
    buttons.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
        if (rect.width === 0 || rect.height === 0) return;

        const isOffscreen = rect.bottom < 0 || rect.top > viewportHeight + 500 ||
                           rect.right < 0 || rect.left > viewportWidth;
        const isClipped = false;

        // Check if obscured by another element at the center point
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (centerX >= 0 && centerX <= viewportWidth && centerY >= 0 && centerY <= viewportHeight) {
            const topEl = document.elementFromPoint(centerX, centerY);
            if (topEl && topEl !== el && !el.contains(topEl) && !topEl.closest('button, .btn, a')) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
                const text = (el.textContent || '').trim().slice(0, 30);
                const blockerTag = topEl.tagName.toLowerCase();
                const blockerCls = topEl.className ? ('.' + String(topEl.className).split(' ').slice(0,2).join('.')) : '';
                issues.push({
                    element: tag + cls,
                    text: text,
                    blocked_by: blockerTag + blockerCls,
                    position: `top:${Math.round(rect.top)}, left:${Math.round(rect.left)}`
                });
            }
        }
    });
    return issues;
}
"""

CHECK_TEXT_OVERFLOW_JS = """
() => {
    const issues = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, td, th, li').forEach(el => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) return;

        // Check if text is cut off (scrollWidth > clientWidth without overflow handling)
        if (el.scrollWidth > el.clientWidth + 5 &&
            style.overflow !== 'hidden' &&
            style.textOverflow !== 'ellipsis' &&
            style.whiteSpace === 'nowrap') {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
            const text = (el.textContent || '').trim().slice(0, 40);
            issues.push({
                element: tag + cls,
                text: text,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth
            });
        }
    });
    return issues;
}
"""

CHECK_FONT_SIZE_JS = """
() => {
    const issues = [];
    document.querySelectorAll('p, span, a, li, td, label, button').forEach(el => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 12 && el.textContent.trim().length > 0) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
            const text = (el.textContent || '').trim().slice(0, 30);
            issues.push({
                element: tag + cls,
                fontSize: Math.round(fontSize) + 'px',
                text: text
            });
        }
    });
    return issues;
}
"""

CHECK_ZINDEX_OVERLAP_JS = """
() => {
    const fixedEls = [];
    document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if ((style.position === 'fixed' || style.position === 'sticky') &&
            style.display !== 'none' && style.visibility !== 'hidden') {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
                fixedEls.push({
                    element: el.tagName.toLowerCase() + cls,
                    zIndex: style.zIndex,
                    position: style.position,
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    height: Math.round(rect.height)
                });
            }
        }
    });
    return fixedEls;
}
"""

CHECK_IOS_ZOOM_JS = """
() => {
    const issues = [];
    document.querySelectorAll('input, select, textarea').forEach(el => {
        const style = getComputedStyle(el);
        if (style.display === 'none') return;
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 16) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? ('.' + String(el.className).split(' ').slice(0,2).join('.')) : '';
            const id = el.id ? '#' + el.id : '';
            const type = el.getAttribute('type') || '';
            issues.push({
                element: tag + id + cls,
                type: type,
                fontSize: Math.round(fontSize * 10) / 10 + 'px',
                note: 'iOS will zoom on focus!'
            });
        }
    });
    return issues;
}
"""


async def test_page(page, url, page_name, viewport):
    """Test a single page at a specific viewport."""
    results = {
        "page": page_name,
        "viewport": viewport["name"],
        "resolution": f"{viewport['width']}x{viewport['height']}",
        "issues": {}
    }

    try:
        await page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
        response = await page.goto(f"{BASE_URL}/{url}", wait_until="networkidle", timeout=15000)

        if not response or response.status >= 400:
            results["issues"]["page_error"] = f"HTTP {response.status if response else 'no response'}"
            return results

        # Wait for content to render
        await page.wait_for_timeout(500)

        # Run all checks
        overflow = await page.evaluate(CHECK_OVERFLOW_JS)
        if overflow:
            # Filter out minor overflows and body/html
            overflow = [i for i in overflow if i["element"] not in ("html", "body", "html.") and int(i["overflow"].replace("px","")) > 5]
            if overflow:
                results["issues"]["overflow"] = overflow[:5]  # Top 5

        small_targets = await page.evaluate(CHECK_SMALL_TAP_TARGETS_JS)
        if small_targets and viewport["mobile"]:
            results["issues"]["small_tap_targets"] = small_targets[:8]

        hidden_buttons = await page.evaluate(CHECK_HIDDEN_BUTTONS_JS)
        if hidden_buttons:
            results["issues"]["hidden_buttons"] = hidden_buttons[:5]

        text_overflow = await page.evaluate(CHECK_TEXT_OVERFLOW_JS)
        if text_overflow:
            results["issues"]["text_overflow"] = text_overflow[:5]

        if viewport["mobile"]:
            font_issues = await page.evaluate(CHECK_FONT_SIZE_JS)
            if font_issues:
                results["issues"]["small_fonts"] = font_issues[:5]

            ios_zoom = await page.evaluate(CHECK_IOS_ZOOM_JS)
            if ios_zoom:
                results["issues"]["ios_zoom_risk"] = ios_zoom

        fixed_els = await page.evaluate(CHECK_ZINDEX_OVERLAP_JS)
        if fixed_els:
            results["issues"]["fixed_elements"] = fixed_els

    except Exception as e:
        results["issues"]["error"] = str(e)[:100]

    return results


async def main():
    print("=" * 70)
    print("  Y MARKET - RESPONSIVE TESTING")
    print("  Testing all pages across all device viewports")
    print("=" * 70)

    all_results = []
    total_issues = 0
    critical_issues = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        for page_url, page_name in PAGES:
            print(f"\n{'-' * 50}")
            print(f"  PAGE: {page_name} ({page_url})")
            print(f"{'-' * 50}")

            for viewport in VIEWPORTS:
                result = await test_page(page, page_url, page_name, viewport)
                all_results.append(result)

                issue_count = sum(len(v) if isinstance(v, list) else 1 for v in result["issues"].values())

                if issue_count > 0:
                    total_issues += issue_count
                    icon = "!!" if any(k in result["issues"] for k in ["overflow", "hidden_buttons", "ios_zoom_risk"]) else "!"
                    print(f"  {icon} {viewport['name']:20s} ({viewport['width']}x{viewport['height']}) - {issue_count} issues")

                    for issue_type, issues in result["issues"].items():
                        if issue_type == "fixed_elements":
                            continue  # Info only, not an issue
                        if isinstance(issues, list):
                            for issue in issues[:3]:
                                detail = ""
                                if issue_type == "overflow":
                                    detail = f"overflow {issue['overflow']}"
                                    critical_issues.append(f"[{page_name}][{viewport['name']}] OVERFLOW: {issue['element']} by {issue['overflow']}")
                                elif issue_type == "small_tap_targets":
                                    detail = f"{issue['width']}x{issue['height']} \"{issue.get('text','')[:20]}\""
                                elif issue_type == "hidden_buttons":
                                    detail = f"blocked by {issue['blocked_by']}"
                                    critical_issues.append(f"[{page_name}][{viewport['name']}] HIDDEN: {issue['element']} \"{issue.get('text','')[:20]}\" blocked by {issue['blocked_by']}")
                                elif issue_type == "text_overflow":
                                    detail = f"\"{issue.get('text','')[:20]}\""
                                elif issue_type == "small_fonts":
                                    detail = f"{issue['fontSize']} \"{issue.get('text','')[:20]}\""
                                elif issue_type == "ios_zoom_risk":
                                    detail = f"{issue['fontSize']}"
                                    critical_issues.append(f"[{page_name}][{viewport['name']}] iOS ZOOM: {issue['element']} font {issue['fontSize']}")
                                print(f"      {issue_type}: {issue.get('element','')} {detail}")
                        else:
                            print(f"      {issue_type}: {issues}")
                else:
                    print(f"  OK {viewport['name']:20s} ({viewport['width']}x{viewport['height']})")

        await browser.close()

    # Summary
    print(f"\n{'=' * 70}")
    print(f"  SUMMARY")
    print(f"{'=' * 70}")
    print(f"  Pages tested: {len(PAGES)}")
    print(f"  Viewports tested: {len(VIEWPORTS)}")
    print(f"  Total combinations: {len(PAGES) * len(VIEWPORTS)}")
    print(f"  Total issues found: {total_issues}")

    if critical_issues:
        print(f"\n  CRITICAL ISSUES ({len(critical_issues)}):")
        for ci in critical_issues:
            print(f"    >> {ci}")
    else:
        print(f"\n  NO CRITICAL ISSUES FOUND!")

    # Save detailed results
    with open("test_responsive_results.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\n  Detailed results saved to test_responsive_results.json")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    asyncio.run(main())
