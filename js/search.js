/* Global Search - works from any page */
(function(){
  // Create search overlay if not exists
  var overlay = document.getElementById('globalSearchOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'globalSearchOverlay';
    overlay.className = 'gsearch-overlay';
    overlay.innerHTML =
      '<div class="gsearch-box">' +
        '<form action="/search" method="get" class="gsearch-form">' +
          '<i class="fas fa-search gsearch-icon"></i>' +
          '<input type="search" name="q" class="gsearch-input" placeholder="חפשו מוצר, קטגוריה או ברקוד..." autocomplete="off" autofocus>' +
          '<button type="button" class="gsearch-close" aria-label="סגור"><i class="fas fa-times"></i></button>' +
        '</form>' +
        '<div class="gsearch-results" id="gsearchResults"></div>' +
        '<div class="gsearch-hint">הקלידו לפחות 2 תווים לחיפוש &bull; Enter למעבר לקטלוג</div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  // Inject CSS
  var style = document.createElement('style');
  style.textContent =
    '.gsearch-overlay{display:none;position:fixed;inset:0;background:rgba(10,22,40,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;align-items:flex-start;justify-content:center;padding-top:min(20vh,160px)}' +
    '.gsearch-overlay.active{display:flex}' +
    '.gsearch-box{width:90%;max-width:640px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(10,22,40,.25);overflow:hidden;animation:gsearchIn .2s ease-out}' +
    '@keyframes gsearchIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}' +
    '.gsearch-form{display:flex;align-items:center;padding:4px 16px;border-bottom:1px solid #e5e9ef}' +
    '.gsearch-icon{color:#94a3b8;font-size:1.1rem;margin-left:12px;flex-shrink:0}' +
    '.gsearch-input{flex:1;border:none;outline:none;font-size:1.1rem;padding:16px 8px;font-family:inherit;background:transparent;color:#0f172a;direction:rtl}' +
    '.gsearch-input::placeholder{color:#94a3b8}' +
    '.gsearch-close{background:none;border:none;color:#94a3b8;font-size:1.2rem;cursor:pointer;padding:8px;border-radius:8px;transition:all .2s;flex-shrink:0}' +
    '.gsearch-close:hover{color:#1B3A5C;background:#f1f5f9}' +
    '.gsearch-results{max-height:360px;overflow-y:auto}' +
    '.gsearch-results a{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9;transition:background .15s;color:#0f172a;text-decoration:none}' +
    '.gsearch-results a:hover{background:#f8fafc}' +
    '.gsearch-results img{width:48px;height:48px;object-fit:contain;border-radius:8px;background:#f8fafc;flex-shrink:0}' +
    '.gsearch-results .gs-name{font-size:.9rem;font-weight:600;color:#112A45}' +
    '.gsearch-results .gs-price{font-size:.8rem;color:#64748b;margin-top:2px}' +
    '.gsearch-results .gs-cat{font-size:.75rem;color:#94a3b8}' +
    '.gsearch-results .gs-none{padding:24px;text-align:center;color:#94a3b8;font-size:.9rem}' +
    '.gsearch-hint{padding:10px 16px;text-align:center;font-size:.75rem;color:#94a3b8;border-top:1px solid #f1f5f9}';
  document.head.appendChild(style);

  // Products cache
  var products = null;
  var loading = false;

  function loadProducts(cb) {
    if (products) return cb(products);
    if (loading) return;
    loading = true;
    fetch('/data/products.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        products = Array.isArray(data) ? data : (data.items || data.products || []);
        loading = false;
        cb(products);
      })
      .catch(function(){
        // Fallback: try catalog page's embedded data
        loading = false;
        products = [];
        cb(products);
      });
  }

  function openSearch() {
    overlay.classList.add('active');
    var input = overlay.querySelector('.gsearch-input');
    if (input) setTimeout(function(){ input.focus(); }, 100);
    loadProducts(function(){}); // preload
  }

  function closeSearch() {
    overlay.classList.remove('active');
    var input = overlay.querySelector('.gsearch-input');
    if (input) input.value = '';
    var results = document.getElementById('gsearchResults');
    if (results) results.innerHTML = '';
  }

  // Search button click
  document.querySelectorAll('.header__btn[aria-label="חיפוש"], .header__search-toggle').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openSearch();
    });
  });

  // Close button
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeSearch();
  });
  var closeBtn = overlay.querySelector('.gsearch-close');
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  // ESC to close
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeSearch();
  });

  // Form submit -> go to catalog
  var form = overlay.querySelector('.gsearch-form');
  if (form) form.addEventListener('submit', function(e){
    e.preventDefault();
    var q = overlay.querySelector('.gsearch-input').value.trim();
    if (q) window.location.href = '/search?q=' + encodeURIComponent(q);
  });

  // Live search
  var input = overlay.querySelector('.gsearch-input');
  var resultsDiv = document.getElementById('gsearchResults');
  var debounce = null;

  if (input) input.addEventListener('input', function(){
    clearTimeout(debounce);
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { resultsDiv.innerHTML = ''; return; }

    debounce = setTimeout(function(){
      loadProducts(function(prods){
        if (!prods.length) {
          // No local products - redirect to catalog on Enter
          resultsDiv.innerHTML = '<div class="gs-none">הקלידו Enter לחיפוש בקטלוג</div>';
          return;
        }
        var results = [];
        for (var i = 0; i < prods.length && results.length < 8; i++) {
          var p = prods[i];
          var name = (p.name || '').toLowerCase();
          var tags = (p.searchTags || '').toLowerCase();
          var catName = (p.categoryName || '').toLowerCase();
          var desc = (p.description || '').toLowerCase();
          if (name.indexOf(q) !== -1 || tags.indexOf(q) !== -1 || catName.indexOf(q) !== -1 || desc.indexOf(q) !== -1) {
            results.push(p);
          }
        }
        if (!results.length) {
          resultsDiv.innerHTML = '<div class="gs-none">לא נמצאו מוצרים — Enter לחיפוש בקטלוג</div>';
          return;
        }
        var html = '';
        results.forEach(function(p){
          var url = p.slug ? ('/products/' + p.slug + '/') : '/catalog?search=' + encodeURIComponent(p.name || '');
          var img = p.imageUrl || p.image || '/images/placeholder.png';
          var price = p.saleNis || p.price;
          var cat = p.categoryName || p.category || '';
          html += '<a href="' + url + '">' +
            '<img src="' + img + '" alt="" loading="lazy" onerror="this.src=\'/images/placeholder.png\'">' +
            '<div><div class="gs-name">' + (p.name || p.title || '') + '</div>' +
            (price ? '<div class="gs-price">₪' + Number(price).toFixed(2) + '</div>' : '') +
            (cat ? '<div class="gs-cat">' + cat + '</div>' : '') +
            '</div></a>';
        });
        resultsDiv.innerHTML = html;
      });
    }, 200);
  });

  // Ctrl+K / Cmd+K shortcut
  document.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('active') ? closeSearch() : openSearch();
    }
  });
})();
