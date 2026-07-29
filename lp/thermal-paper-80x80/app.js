const plans = {
  small: { quantity: 5, step: 5, min: 5, max: 45 },
  carton: { quantity: 50, step: 50, min: 50, max: 50 },
  double: { quantity: 100, step: 50, min: 100, max: 5000 }
};

let plan = 'double';
let quantity = 100;
const tracking = Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].map(key => [key, new URLSearchParams(location.search).get(key) || '']));

const el = id => document.getElementById(id);

function priceFor(qty) {
  if (qty < 50) return qty * 10 + 59;
  const cartons = qty / 50;
  return Math.floor(cartons / 2) * 450 + (cartons % 2 ? 250 : 0);
}

function render() {
  const total = priceFor(quantity);
  document.querySelectorAll('.deal').forEach(button => {
    const active = button.dataset.plan === plan;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-checked', String(active));
  });
  el('quantity').textContent = quantity;
  el('total').textContent = total.toLocaleString('he-IL');
  el('button-total').textContent = total.toLocaleString('he-IL');
  el('unit-price').textContent = (total / 1.18 / quantity).toFixed(2);
  el('form-quantity').value = quantity;
  el('form-amount').value = total;
  el('shipping').textContent = quantity < 50 ? 'כולל מע״מ ומשלוח 59 ₪' : 'כולל מע״מ ומשלוח';
  el('three-ds-note').hidden = total <= 499;
  el('upgrade').hidden = !(plan === 'small' && quantity >= 20);
}

document.querySelectorAll('.deal').forEach(button => button.addEventListener('click', () => {
  plan = button.dataset.plan;
  quantity = plans[plan].quantity;
  render();
}));

document.querySelectorAll('[data-bundles]').forEach(button => button.addEventListener('click', () => {
  plan = 'double';
  quantity = Number(button.dataset.bundles) * 100;
  render();
  document.querySelector('.quantity-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));

el('plus').addEventListener('click', () => {
  const p = plans[plan];
  quantity = Math.min(p.max, quantity + p.step);
  render();
});

el('minus').addEventListener('click', () => {
  const p = plans[plan];
  quantity = Math.max(p.min, quantity - p.step);
  render();
});

el('take-upgrade').addEventListener('click', () => {
  plan = 'carton';
  quantity = 50;
  render();
  document.querySelector('.quantity-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

el('order-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('.pay-button');
  const fallback = el('fallback-order');
  const data = Object.fromEntries(new FormData(event.currentTarget));
  button.disabled = true;
  fallback.hidden = true;
  el('form-message').textContent = 'פותחים תשלום מאובטח…';
  try {
    const apiBase = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://app.ymarket.co.il';
    const response = await fetch(`${apiBase}/api/campaigns/thermal-paper-80x80/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ...tracking, quantity: Number(data.quantity) }),
      keepalive: true
    });
    const result = await response.json();
    if (!response.ok || !result.orderId) throw new Error(result.error || 'לא הצלחנו לשמור את ההזמנה');
    sessionStorage.setItem('thermal_order', JSON.stringify({ orderId: result.orderId, leadId: result.leadId, quantity, amount: result.totalAmount }));
    if (typeof fbq === 'function') fbq('track','InitiateCheckout',{content_ids:['304'],content_type:'product',num_items:quantity,value:result.totalAmount,currency:'ILS'});
    if (typeof fbq === 'function') fbq('track','Lead',{content_name:'נייר טרמי 80x80',value:result.totalAmount,currency:'ILS'});
    if (result.payUrl) {
      location.href = result.payUrl;
      return;
    }

    const savedOrderText = [
      `הזמנה #${result.orderId} מדף נייר טרמי 80×80`,
      `שם: ${data.name}`,
      data.businessName ? `עסק: ${data.businessName}` : '',
      `טלפון: ${data.phone}`,
      `כתובת: ${data.address}, ${data.city}`,
      `כמות: ${quantity} גלילים`,
      `סכום: ${result.totalAmount} ₪ כולל מע״מ ומשלוח`,
      'ההזמנה כבר שמורה ב-CRM. אשמח לקבל קישור PayMe לתשלום.'
    ].filter(Boolean).join('\n');
    fallback.href = `https://wa.me/972549922492?text=${encodeURIComponent(savedOrderText)}`;
    fallback.hidden = false;
    el('form-message').textContent = `הזמנה #${result.orderId} נשמרה ב-CRM. אפשר להשלים את התשלום בוואטסאפ.`;
    button.disabled = false;
  } catch (error) {
    const orderText = [
      'הזמנה מדף נייר תרמי 80×80',
      `שם: ${data.name}`,
      data.businessName ? `עסק: ${data.businessName}` : '',
      `טלפון: ${data.phone}`,
      `כתובת: ${data.address}, ${data.city}`,
      `כמות: ${quantity} גלילים`,
      `סכום: ${priceFor(quantity)} ₪ כולל מע״מ ומשלוח`,
      'אשמח לקבל קישור PayMe לתשלום'
    ].filter(Boolean).join('\n');
    fallback.href = `https://wa.me/972549922492?text=${encodeURIComponent(orderText)}`;
    fallback.hidden = false;
    el('form-message').textContent = 'לא הצלחנו לאשר שההזמנה נשמרה. אפשר להמשיך עכשיו בוואטסאפ ונבדוק אותה מיד.';
    button.disabled = false;
  }
});

render();
