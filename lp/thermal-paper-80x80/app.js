const $=id=>document.getElementById(id);
const trackingKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','ad_id','creative_id'];
const params=new URLSearchParams(location.search);
const tracking=Object.fromEntries(trackingKeys.map(key=>[key,params.get(key)||'']));

// Prices per size approved by Yuval 25/09/2026. MUST match the server table that
// actually charges: crm-app/src/lib/campaigns/thermal-pricing.ts (gross, VAT incl.).
const SMALL_SHIPPING=59;
const SIZES={
  '80x80':{label:'80×80',itemId:304,perCase:50,small:{min:5,max:45,step:5,perRoll:10},bulkMin:100,bulkStep:100,
           cartons:c=>Math.floor(c/2)*450+(c%2?250:0),note:'80 מטר אמיתי בגליל',kind:'למדפסת קופה',img:null},
  '80x40':{label:'80×40',itemId:679,perCase:100,small:{min:10,max:90,step:10,perRoll:7},bulkMin:200,bulkStep:100,
           cartons:c=>c===1?399:c*359,note:'לקופה ולמדפסת קבלות',kind:'למדפסת קופה',img:'../thermal-paper-80x80-bakery/hero.webp'},
  '57x40':{label:'57×40',itemId:678,perCase:100,small:{min:10,max:90,step:10,perRoll:6},bulkMin:200,bulkStep:100,
           cartons:c=>c===1?379:c*339,note:'למסופון אשראי',kind:'למסופון אשראי',img:'../thermal-paper-80x80-bakery/operations.webp'},
  '57x17':{label:'57×17',itemId:677,perCase:100,small:{min:10,max:90,step:10,perRoll:5},bulkMin:200,bulkStep:100,
           cartons:c=>c===1?299:c*269,note:'למסופון אשראי קטן',kind:'למסופון אשראי',img:'../thermal-paper-80x80-bakery/operations.webp'}
};
// ?size=57x40 preselects a size — one ad per size can point at this same page.
let sizeKey=SIZES[params.get('size')]?params.get('size'):'80x80';
let size=SIZES[sizeKey];
let plans;
let plan='bulk';
let quantity;

function plansFor(s){
  return{
    small:{qty:s.small.min*4,step:s.small.step,min:s.small.min,max:s.small.max},
    carton:{qty:s.perCase,step:s.perCase,min:s.perCase,max:s.perCase},
    bulk:{qty:s.bulkMin,step:s.bulkStep,min:s.bulkMin,max:5000}
  };
}

function pricingFor(qty){
  if(qty<size.perCase)return{goods:qty*size.small.perRoll,shipping:SMALL_SHIPPING};
  return{goods:size.cartons(qty/size.perCase),shipping:0};
}

function priceFor(qty){
  const price=pricingFor(qty);
  return price.goods+price.shipping;
}

function money(value){
  return `₪${Math.round(value).toLocaleString('he-IL')}`;
}

function buildSingleOptions(){
  const container=$('single-options');
  container.innerHTML='';
  for(let value=size.small.min;value<=size.small.max;value+=size.small.step){
    const button=document.createElement('button');
    button.type='button';
    button.textContent=String(value);
    button.dataset.quantity=String(value);
    button.setAttribute('aria-label',`${value} גלילים`);
    button.addEventListener('click',()=>{
      plan='small';
      quantity=value;
      render();
    });
    container.appendChild(button);
  }
}

// Hero as authored for 80×80 — restored when 80×80 is picked again.
const HERO={
  title:$('hero-title').innerHTML,   // innerHTML: the authored title has a <br>
  img:$('hero-img').getAttribute('src'),
  alt:$('hero-img').alt,
  caption:$('hero-caption').textContent
};

// The hero follows the chosen size: a photo already published on the site (the catalog
// images for 80×40 / 57×40 / 57×17 are still "התמונה בדרך אליך" placeholders, so the
// bakery-page roll photos are used — no size printed on them, unlike product.png),
// its own title and a per-roll price anchor from the same table that charges. The
// 80×80-only claims (80 mm, 80 m) are hidden for the other sizes.
function renderHero(){
  const is8080=sizeKey==='80x80';
  const dims=size.label.replace('×','x');
  if(is8080)$('hero-title').innerHTML=HERO.title;
  else $('hero-title').textContent=`נייר ${dims} ${size.kind}. מלאי שלא נגמר באמצע יום.`;
  const img=$('hero-img');
  img.src=is8080?HERO.img:size.img;
  img.alt=is8080?HERO.alt:`גליל נייר טרמי ${dims} ${size.kind}`;
  img.style.objectFit=is8080?'':'cover';
  img.style.objectPosition=is8080?'':'center 72%';   // portrait photos: keep the rolls in frame
  $('hero-caption').textContent=is8080?HERO.caption:`נייר טרמי ${dims} ${size.kind}`;
  $('hero-case-count').textContent=String(size.perCase);
  document.querySelectorAll('[data-only-8080]').forEach(el=>{el.hidden=!is8080;});
  const singleNet=size.small.perRoll/1.18;
  const bulkNet=size.cartons(size.bulkMin/size.perCase)/1.18/size.bulkMin;
  $('anchor-single').textContent=`${singleNet.toFixed(2)} ₪ לגליל`;
  $('anchor-bulk-qty').textContent=String(size.bulkMin);
  $('anchor-bulk').textContent=`${bulkNet.toFixed(2)} ₪ לגליל`;
}

function selectSize(key){
  sizeKey=key;
  size=SIZES[key];
  plans=plansFor(size);
  quantity=plans[plan].qty;
  buildSingleOptions();
  $('plan-small-range').textContent=`${size.small.min}–${size.small.max}`;
  $('plan-carton-size').textContent=String(size.perCase);
  $('plan-bulk-min').textContent=String(size.bulkMin);
  $('carton-title').textContent=`קרטון סגור · ${size.perCase} גלילים`;
  $('buy-offer').textContent=`${size.label} · ${size.note}`;
  document.querySelectorAll('[data-size]').forEach(button=>{
    const selected=button.dataset.size===key;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-checked',String(selected));
  });
  renderHero();
  if(typeof fbq==='function'){
    fbq('track','ViewContent',{content_ids:[String(size.itemId)],content_type:'product',content_name:`נייר טרמי ${size.label}`,currency:'ILS'});
  }
  render();
}

function render(){
  const price=pricingFor(quantity);
  const total=price.goods+price.shipping;
  const regular=quantity*size.small.perRoll+SMALL_SHIPPING;
  const saving=Math.max(0,regular-total);
  const unit=price.goods/1.18/quantity;
  const hasSaving=saving>0;

  document.querySelectorAll('[data-plan]').forEach(button=>{
    const selected=button.dataset.plan===plan;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-checked',String(selected));
  });

  document.querySelectorAll('#single-options [data-quantity]').forEach(button=>{
    const selected=Number(button.dataset.quantity)===quantity;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-pressed',String(selected));
  });

  $('single-options').hidden=plan!=='small';
  $('carton-summary').hidden=plan!=='carton';
  $('bulk-stepper').hidden=plan!=='bulk';
  $('saving-card').hidden=!hasSaving;
  $('sticky-saving').hidden=!hasSaving;

  $('quantity').textContent=`${quantity.toLocaleString('he-IL')} גלילים`;
  $('cartons').textContent=`${quantity/size.perCase} קרטונים · משלוח כלול`;
  $('total').textContent=money(total);
  $('unit-price').textContent=`${unit.toFixed(2)} ₪`;
  $('shipping').textContent=price.shipping?`משלוח ${money(price.shipping)} להזמנה · כולל מע״מ`:'משלוח כלול במחיר · כולל מע״מ';
  $('saving-label').textContent=`חיסכון לעומת גלילים בודדים (${money(regular)})`;
  $('saving').textContent=money(saving);
  $('form-quantity').value=String(quantity);
  $('sticky-total').textContent=money(total);
  $('sticky-desc').textContent=`${size.label} · ${quantity} גלילים · ${price.shipping?`משלוח ${money(price.shipping)}`:'משלוח כלול'}`;
  $('sticky-saving').textContent=`חיסכון ${money(saving)}`;
  $('final-qty').textContent=`נייר ${size.label} · ${quantity} גלילים · ${money(total)} כולל מע״מ ומשלוח`;
  $('final-copy').textContent=hasSaving
    ?`${unit.toFixed(2)} ₪ לגליל לפני מע״מ — חיסכון של ${money(saving)} לעומת קנייה בגלילים בודדים.`
    :`${unit.toFixed(2)} ₪ לגליל לפני מע״מ · משלוח ${money(price.shipping)} להזמנה.`;
}

document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>selectSize(button.dataset.size)));

document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{
  plan=button.dataset.plan;
  quantity=plans[plan].qty;
  render();
}));

$('plus').addEventListener('click',()=>{
  const selected=plans[plan];
  quantity=Math.min(selected.max,quantity+selected.step);
  render();
});

$('minus').addEventListener('click',()=>{
  const selected=plans[plan];
  quantity=Math.max(selected.min,quantity-selected.step);
  render();
});

document.querySelectorAll('[data-open-order]').forEach(button=>button.addEventListener('click',()=>{
  if(typeof fbq==='function'){
    fbq('track','InitiateCheckout',{
      content_ids:[String(size.itemId)],
      content_type:'product',
      num_items:quantity,
      value:priceFor(quantity),
      currency:'ILS'
    });
  }
  $('order-dialog').showModal();
}));

document.querySelectorAll('[data-wholesale-cta]').forEach(link=>link.addEventListener('click',()=>{
  if(typeof fbq==='function'){
    fbq('trackCustom','WholesaleIntent',{
      content_ids:['304'],
      content_name:'נייר טרמי 80x80 — משטח 1,800 גלילים',
      content_category:'bakery_chains',
      currency:'ILS'
    });
  }
}));

$('order-dialog').querySelector('.close').addEventListener('click',()=>$('order-dialog').close());
$('order-dialog').addEventListener('click',event=>{
  if(event.target===$('order-dialog'))$('order-dialog').close();
});

$('order-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;

  const button=form.querySelector('.submit');
  const fallback=$('fallback-order');
  const data=Object.fromEntries(new FormData(form));
  button.disabled=true;
  fallback.hidden=true;
  $('form-message').textContent='שומרים הזמנה ופותחים תשלום…';

  try{
    const apiBase=location.hostname==='localhost'||location.hostname==='127.0.0.1'
      ?'http://localhost:3000'
      :'https://app.ymarket.co.il';
    // _fbp/_fbc + the Meta event id shared by the success-page Purchase and the
    // server CAPI Purchase (js/analytics.js getAttribution) — so Meta counts one.
    let attribution={};
    try{attribution=(window.YMarketAnalyst&&window.YMarketAnalyst.getAttribution())||{};}catch(e){}
    const response=await fetch(`${apiBase}/api/campaigns/thermal-paper-80x80/orders`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        ...data,
        ...tracking,
        fbp:attribution.fbp||'',
        fbc:attribution.fbc||'',
        eventId:attribution.eventId||'',
        landing:attribution.landing||location.pathname,
        source:'meta_ads',
        checkout_source:'landing_page',
        campaign:'thermal-paper-80x80',
        payment_provider:'PayMe',
        page_version:'claude-design-import-20260801-2',
        size:sizeKey,
        quantity
      }),
      keepalive:true
    });
    const result=await response.json();
    if(!response.ok||!result.orderId)throw new Error(result.error||'save_failed');

    sessionStorage.setItem('thermal_order',JSON.stringify({
      orderId:result.orderId,
      leadId:result.leadId,
      quantity,
      size:sizeKey,
      itemId:size.itemId,
      amount:result.totalAmount
    }));
    // Not 'Lead': this fires BEFORE payment, and a standard Lead here would teach
    // Meta to find form-fillers instead of buyers. Purchase fires after payment.
    if(typeof fbq==='function'){
      fbq('trackCustom','ThermalOrderStarted',{
        content_ids:[String(size.itemId)],
        value:result.totalAmount,
        currency:'ILS'
      });
    }
    if(result.payUrl){
      location.href=result.payUrl;
      return;
    }
    throw new Error('pay_url_missing');
  }catch(error){
    const message=[
      `הזמנת נייר טרמי ${size.label}`,
      `שם: ${data.name}`,
      data.businessName?`עסק: ${data.businessName}`:'',
      `טלפון: ${data.phone}`,
      `כתובת: ${data.address}, ${data.city}`,
      `כמות: ${quantity} גלילים`,
      `סכום: ${money(priceFor(quantity))}`
    ].filter(Boolean).join('\n');
    fallback.href=`https://wa.me/972549922492?text=${encodeURIComponent(message)}`;
    fallback.hidden=false;
    $('form-message').textContent='לא הצלחנו לפתוח את התשלום. אפשר להשלים את ההזמנה בוואטסאפ.';
    button.disabled=false;
  }
});

selectSize(sizeKey);
