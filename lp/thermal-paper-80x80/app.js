const plans={small:{qty:5,step:5,min:5,max:45},carton:{qty:50,step:50,min:50,max:50},bulk:{qty:100,step:100,min:100,max:5000}};
let plan='bulk',quantity=100;
const $=id=>document.getElementById(id);
const trackingKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','ad_id','creative_id'];
const params=new URLSearchParams(location.search);
const tracking=Object.fromEntries(trackingKeys.map(k=>[k,params.get(k)||'']));

function priceFor(q){if(q<50)return q*10+59;if(q===50)return 250;return(q/100)*450;}
function money(n){return `₪${Math.round(n).toLocaleString('he-IL')}`;}
function render(){
  const total=priceFor(quantity),regular=quantity*10+59,saving=Math.max(0,regular-total),unit=total/1.18/quantity;
  document.querySelectorAll('[data-plan]').forEach(b=>{const on=b.dataset.plan===plan;b.classList.toggle('active',on);b.setAttribute('aria-checked',String(on));});
  $('quantity').textContent=`${quantity.toLocaleString('he-IL')} גלילים`;
  $('cartons').textContent=quantity<50?'חבילה · משלוח 59 ₪':`${quantity/50} קרטונים · משלוח כלול`;
  $('total').textContent=money(total); $('unit-price').textContent=`${unit.toFixed(2)} ₪`;
  $('shipping').textContent=quantity<50?'כולל מע״מ · משלוח 59 ₪':'משלוח כלול במחיר · כולל מע״מ';
  $('saving-label').textContent=`חיסכון לעומת גלילים בודדים (${money(regular)})`; $('saving').textContent=money(saving);
  $('form-quantity').value=quantity; $('sticky-total').textContent=money(total); $('sticky-desc').textContent=`${quantity} גלילים · ${quantity<50?'משלוח 59 ₪':'משלוח כלול'}`; $('sticky-saving').textContent=`חיסכון ${money(saving)}`;
  $('final-qty').textContent=`${quantity} גלילים · ${money(total)} כולל מע״מ${quantity<50?'':' ומשלוח'}`; $('final-copy').textContent=`${unit.toFixed(2)} ₪ לגליל לפני מע״מ — חיסכון של ${money(saving)} לעומת קנייה בגלילים בודדים.`;
}
document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{plan=b.dataset.plan;quantity=plans[plan].qty;render();}));
$('plus').addEventListener('click',()=>{const p=plans[plan];quantity=Math.min(p.max,quantity+p.step);render();});
$('minus').addEventListener('click',()=>{const p=plans[plan];quantity=Math.max(p.min,quantity-p.step);render();});
document.querySelectorAll('[data-open-order]').forEach(b=>b.addEventListener('click',()=>{if(typeof fbq==='function')fbq('track','InitiateCheckout',{content_ids:['304'],content_type:'product',num_items:quantity,value:priceFor(quantity),currency:'ILS'});$('order-dialog').showModal();}));
$('order-dialog').querySelector('.close').addEventListener('click',()=>$('order-dialog').close());
$('order-dialog').addEventListener('click',e=>{if(e.target===$('order-dialog'))$('order-dialog').close();});
$('order-form').addEventListener('submit',async e=>{
  e.preventDefault(); const button=e.currentTarget.querySelector('.submit'),fallback=$('fallback-order'),data=Object.fromEntries(new FormData(e.currentTarget)); button.disabled=true; fallback.hidden=true; $('form-message').textContent='שומרים הזמנה ופותחים תשלום…';
  try{const apiBase=location.hostname==='localhost'?'http://localhost:3000':'https://app.ymarket.co.il';const response=await fetch(`${apiBase}/api/campaigns/thermal-paper-80x80/orders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,...tracking,source:'meta_ads',checkout_source:'landing_page',campaign:'thermal-paper-80x80',payment_provider:'PayMe',page_version:'claude-design-20260801',quantity}),keepalive:true});const result=await response.json();if(!response.ok||!result.orderId)throw new Error(result.error||'save_failed');sessionStorage.setItem('thermal_order',JSON.stringify({orderId:result.orderId,leadId:result.leadId,quantity,amount:result.totalAmount}));if(typeof fbq==='function')fbq('track','Lead',{content_name:'נייר טרמי 80x80',value:result.totalAmount,currency:'ILS'});if(result.payUrl){location.href=result.payUrl;return;}throw new Error('pay_url_missing');}
  catch(error){const msg=[`הזמנת נייר טרמי 80x80`, `שם: ${data.name}`,data.businessName?`עסק: ${data.businessName}`:'',`טלפון: ${data.phone}`,`כתובת: ${data.address}, ${data.city}`,`כמות: ${quantity} גלילים`,`סכום: ${money(priceFor(quantity))}`].filter(Boolean).join('\n');fallback.href=`https://wa.me/972549922492?text=${encodeURIComponent(msg)}`;fallback.hidden=false;$('form-message').textContent='לא הצלחנו לפתוח את התשלום. אפשר להשלים את ההזמנה בוואטסאפ.';button.disabled=false;}
});
render();
