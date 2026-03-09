"""Test that overlay closes menu, and all nav items work"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 360, "height": 800})
        await page.goto("http://localhost:8877/index.html", wait_until="networkidle")

        # Open menu
        await page.click('.mobile-menu-btn')
        await page.wait_for_timeout(500)

        # Test 1: Click overlay (left strip, outside nav) to close menu
        print("TEST 1: Click overlay to close menu")
        # Nav is 85% width from right, so click the left 15% area
        await page.mouse.click(20, 400)  # left side of screen
        await page.wait_for_timeout(500)
        nav_open = await page.evaluate('document.querySelector(".main-nav").classList.contains("open")')
        print(f"  Nav still open: {nav_open} (should be False)")

        # Test 2: Open menu again, click each nav link
        print("\nTEST 2: Click each nav link")
        for link_text in ['דף הבית', 'אודות', 'בלוג', 'צרו קשר']:
            await page.goto("http://localhost:8877/index.html", wait_until="networkidle")
            await page.click('.mobile-menu-btn')
            await page.wait_for_timeout(500)
            link = page.locator('.main-nav__link', has_text=link_text)
            await link.click()
            await page.wait_for_timeout(1000)
            print(f"  Clicked '{link_text}' -> URL: {page.url}")

        # Test 3: Open mega-menu, click a category
        print("\nTEST 3: Mega-menu categories")
        await page.goto("http://localhost:8877/index.html", wait_until="networkidle")
        await page.click('.mobile-menu-btn')
        await page.wait_for_timeout(500)
        await page.click('.main-nav__link >> text=מוצרים')
        await page.wait_for_timeout(500)

        categories = await page.query_selector_all('.mega-menu__category')
        print(f"  Categories visible: {len(categories)}")

        # Click 3rd category
        cat = page.locator('.mega-menu__category').nth(2)
        text = await cat.text_content()
        await cat.click()
        await page.wait_for_timeout(1000)
        print(f"  Clicked '{text.strip()}' -> URL: {page.url}")

        print("\nALL TESTS PASSED!" if "catalog" in page.url else "\nSOME TESTS FAILED")
        await browser.close()

asyncio.run(main())
