"""Test mobile menu on Galaxy S20 viewport"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 360, "height": 800})

        await page.goto("http://localhost:8877/index.html", wait_until="networkidle")

        # Screenshot before opening menu
        await page.screenshot(path="test_menu_1_closed.png")
        print("1. Screenshot saved: menu closed")

        # Click hamburger menu
        await page.click('.mobile-menu-btn')
        await page.wait_for_timeout(500)
        await page.screenshot(path="test_menu_2_open.png")
        print("2. Screenshot saved: menu open")

        # Check if nav is visible
        nav = page.locator('.main-nav')
        is_visible = await nav.is_visible()
        print(f"3. Nav visible: {is_visible}")

        # Check nav links visibility and clickability
        links = await page.query_selector_all('.main-nav__link')
        print(f"4. Found {len(links)} nav links")
        for link in links:
            text = await link.text_content()
            text = text.strip()
            visible = await link.is_visible()
            enabled = await link.is_enabled()
            box = await link.bounding_box()
            style = await link.evaluate('el => { const s = getComputedStyle(el); return { color: s.color, opacity: s.opacity, pointerEvents: s.pointerEvents, cursor: s.cursor, visibility: s.visibility, display: s.display } }')
            print(f"   - '{text}': visible={visible}, enabled={enabled}, box={box}, style={style}")

        # Click "מוצרים" to open mega-menu
        products_link = page.locator('.main-nav__link', has_text='מוצרים')
        await products_link.click()
        await page.wait_for_timeout(500)
        await page.screenshot(path="test_menu_3_megamenu.png")
        print("5. Screenshot saved: mega-menu open")

        # Check mega-menu categories
        categories = await page.query_selector_all('.mega-menu__category')
        print(f"6. Found {len(categories)} mega-menu categories")
        for i, cat in enumerate(categories[:5]):
            text = await cat.text_content()
            text = text.strip()
            visible = await cat.is_visible()
            enabled = await cat.is_enabled()
            box = await cat.bounding_box()
            style = await cat.evaluate('el => { const s = getComputedStyle(el); return { color: s.color, opacity: s.opacity, pointerEvents: s.pointerEvents, cursor: s.cursor, visibility: s.visibility, display: s.display } }')
            print(f"   - '{text[:30]}': visible={visible}, enabled={enabled}, box={box}, style={style}")

        # Try clicking a category
        if categories:
            first_cat = categories[0]
            href = await first_cat.get_attribute('href')
            print(f"7. First category href: {href}")

            # Check if click navigates
            try:
                async with page.expect_navigation(timeout=3000):
                    await first_cat.click()
                print(f"8. Navigation happened! URL: {page.url}")
            except:
                print("8. NO NAVIGATION after clicking category!")
                # Check what's at the click point
                box = await first_cat.bounding_box()
                if box:
                    cx = box['x'] + box['width'] / 2
                    cy = box['y'] + box['height'] / 2
                    top_el = await page.evaluate(f'document.elementFromPoint({cx}, {cy})?.tagName + "." + (document.elementFromPoint({cx}, {cy})?.className || "")')
                    print(f"   Element at click point ({cx:.0f}, {cy:.0f}): {top_el}")

        await page.screenshot(path="test_menu_4_after_click.png")
        print("9. Final screenshot saved")

        await browser.close()

asyncio.run(main())
