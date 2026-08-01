const plans={
  small:{qty:20,step:5,min:5,max:45},
  carton:{qty:50,step:50,min:50,max:50},
  bulk:{qty:100,step:100,min:100,max:5000}
};
const singleQuantities=[5,10,15,20,25,30,35,40,45];
let plan='bulk';
let quantity=100;

const $=id=>document.getElementById(id);
const trackingKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','ad_id','creative_id'];
const params=new URLSearchParams(location.search);
const tracking=Object.fromEntries(trackingKeys.map(key=>[key,params.get(key)||'']));

function pricingFor(qty){
  if(qty<50)return{goods:qty*10,shipping:59};
  if(qty===50)return{goods:250,shipping:0};
  return{goods:(qty/100)*450,shipping:0};
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
  singleQuantities.forEach(value=>{
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
  });
}

function render(){
  const price=pricingFor(quantity);
  const total=price.goods+price.shipping;
  const regular=quantity*10+59;
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
  $('cartons').textContent=`${quantity/50} קרטונים · משלוח כלול`;
  $('total').textContent=money(total);
  $('unit-price').textContent=`${unit.toFixed(2)} ₪`;
  $('shipping').textContent=price.shipping?`משלוח ${money(price.shipping)} להזמנה · כולל מע״מ`:'משלוח כלול במחיר · כולל מע״מ';
  $('saving-label').textContent=`חיסכון לעומת גלילים בודדים (${money(regular)})`;
  $('saving').textContent=money(saving);
  $('form-quantity').value=String(quantity);
  $('sticky-total').textContent=money(total);
  $('sticky-desc').textContent=`${quantity} גלילים · ${price.shipping?`משלוח ${money(price.shipping)}`:'משלוח כלול'}`;
  $('sticky-saving').textContent=`חיסכון ${money(saving)}`;
  $('final-qty').textContent=`${quantity} גלילים · ${money(total)} כולל מע״מ ומשלוח`;
  $('final-copy').textContent=hasSaving
    ?`${unit.toFixed(2)} ₪ לגליל לפני מע״מ — חיסכון של ${money(saving)} לעומת קנייה בגלילים בודדים.`
    :`${unit.toFixed(2)} ₪ לגליל לפני מע״מ · משלוח ${money(price.shipping)} להזמנה.`;
}

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
      content_ids:['304'],
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
    const response=await fetch(`${apiBase}/api/campaigns/thermal-paper-80x80/orders`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        ...data,
        ...tracking,
        source:'meta_ads',
        checkout_source:'landing_page',
        campaign:'thermal-paper-80x80',
        payment_provider:'PayMe',
        page_version:'claude-design-import-20260801-2',
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
      amount:result.totalAmount
    }));
    if(typeof fbq==='function'){
      fbq('track','Lead',{
        content_name:'נייר טרמי 80x80',
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
      'הזמנת נייר טרמי 80x80',
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

buildSingleOptions();
render();
