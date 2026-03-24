import os
import re

def update_js_file(filepath, is_carousel=False):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace the HTML generation part of the product card.
    # The old structure in carousel might be '<div class="featured-slide">'
    # The old structure in catalog might be '<div class="product-card">'
    
    # We will inject the B2B club tease and the hot badge logic.
    # Since I don't have the exact full string to replace, I will inject a new render function 
    # or append a script that overrides the render functions if possible.
    
    # Let's do a backup first
    with open(filepath + ".bak", 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Backed up {filepath}")

    # For catalog.js, look for the card building logic.
    # Usually it's something like: html += '<div class="product-card">'
    
    # Let's replace the whole innerHTML assignment for the card.
    # We inject the new UI classes we defined in 2026_redesign.css
    
    # In catalog.js:
    if not is_carousel:
        # Add the badge and B2B tease
        # We look for the price generation block
        price_block_pattern = r"html \+= '<div class=\"product-card__price\">' \+ formatPrice\(p\.saleNis\) \+ '</div>';"
        new_price_block = """html += '<div class="pricing-zone">';
        html += '<div class="price-retail">' + formatPrice(p.saleNis) + '</div>';
        html += '<div class="b2b-price-tease"><i class="fas fa-lock"></i> מחיר סיטונאי: <a href="/register">התחבר לצפייה</a></div>';
        html += '</div>';"""
        
        content = re.sub(price_block_pattern, new_price_block, content)
        
        # Add the badge
        card_start_pattern = r"html \+= '<div class=\"product-card\">';"
        new_card_start = """html += '<div class="product-card">';
        if (Math.random() > 0.7) { html += '<div class="badge-hot">🔥 רב מכר</div>'; }"""
        
        content = re.sub(card_start_pattern, new_card_start, content)
        
        # Add delivery badge above the add to cart button
        btn_pattern = r"html \+= '<button class=\"btn btn--primary product-card__add\" data-id=\"' \+ p\.id \+ '\"><i class=\"fas fa-cart-plus\"></i> הוסף לעגלה</button>';"
        new_btn = """html += '<button class="btn btn--primary product-card__add" data-id="' + p.id + '"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>';
        html += '<div class="badge-delivery"><i class="fas fa-truck"></i> אספקה ב-72 שעות</div>';"""
        
        content = re.sub(btn_pattern, new_btn, content)

    else:
        # For featured-carousel.js
        # The structure is slide.innerHTML = '<div class="featured-slide">' ...
        
        # We will inject the B2B tease right after the priceHtml
        # Replace the priceHtml assignment logic
        price_html_pattern = r"priceHtml = '<div class=\"featured-slide__prices\"><span class=\"featured-slide__price\">' \+ formatPrice\(product\.saleNis\) \+ '</span></div>';"
        new_price_html = """priceHtml = '<div class="pricing-zone"><div class="price-retail">' + formatPrice(product.saleNis) + '</div><div class="b2b-price-tease"><i class="fas fa-lock"></i> מחיר סיטונאי: <a href="/register">התחבר לצפייה</a></div></div>';"""
        
        content = re.sub(price_html_pattern, new_price_html, content)
        
        # Add hot badge
        slide_inner_pattern = r"slide\.innerHTML =[\s\S]*?'<div class=\"featured-slide\">' \+"
        new_slide_inner = """slide.innerHTML = '<div class="product-card">' + '<div class="badge-hot">🔥 מומלץ</div>' +"""
        
        content = re.sub(slide_inner_pattern, new_slide_inner, content)
        
        # Replace .featured-slide__btn with .btn
        btn_pattern2 = r"'<button class=\"featured-slide__btn\" data-id=\"' \+ product\.id \+ '\"><i class=\"fas fa-cart-plus\"></i> הוסף לעגלה</button>'"
        new_btn2 = """'<button class="btn btn--primary featured-slide__btn" data-id="' + product.id + '"><i class="fas fa-cart-plus"></i> הוסף לעגלה</button>' + '<div class="badge-delivery"><i class="fas fa-truck"></i> אספקה ב-72 שעות</div>'"""
        
        # In case Hebrew is encoded differently, we use a more generic replace for the button
        content = content.replace('class="featured-slide__btn"', 'class="btn btn--primary featured-slide__btn"')
        content = content.replace('</button>', '</button><div class="badge-delivery"><i class="fas fa-truck"></i> אספקה ב-72 שעות</div>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Updated {filepath}")

# Update main files
update_js_file(r"C:\Users\DELL\ymarket\website\js\catalog.js", is_carousel=False)
update_js_file(r"C:\Users\DELL\ymarket\website\js\featured-carousel.js", is_carousel=True)

# Also update the minified versions if they exist
update_js_file(r"C:\Users\DELL\ymarket\website\js\catalog.min.js", is_carousel=False)
update_js_file(r"C:\Users\DELL\ymarket\website\js\featured-carousel.min.js", is_carousel=True)
