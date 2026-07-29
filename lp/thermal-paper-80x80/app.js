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
  el('form-quantity').value = quantity;
  el('form-amount').value = total;
  el('shipping').textContent = quantity < 50 ? 'כולל מע״מ ומשלוח 59 ₪' : 'כולל מע״מ ומשלוח';
  el('upgrade').hidden = !(plan === 'small' && quantity >= 20);
}

document.querySelectorAll('.deal').forEach(button => button.addEventListener('click', () => {
  plan = button.dataset.plan;
  quantity = plans[plan].quantity;
  render();
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
  const data = Object.fromEntries(new FormData(event.currentTarget));
  button.disabled = true;
  el('form-message').textContent = 'פותחים תשלום מאובטח…';
  try {
    const apiBase = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://app.ymarket.co.il';
    const response = await fetch(`${apiBase}/api/campaigns/thermal-paper-80x80/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ...tracking, quantity: Number(data.quantity) })
    });
    const result = await response.json();
    if (!response.ok || !result.payUrl) throw new Error(result.error || 'לא הצלחנו לפתוח את התשלום');
    sessionStorage.setItem('thermal_order', JSON.stringify({ orderId: result.orderId, quantity, amount: result.totalAmount }));
    if (typeof fbq === 'function') fbq('track','InitiateCheckout',{content_ids:['304'],content_type:'product',num_items:quantity,value:result.totalAmount,currency:'ILS'});
    location.href = result.payUrl;
  } catch (error) {
    el('form-message').textContent = error.message || 'לא הצלחנו להתחבר לתשלום. נסו שוב.';
    button.disabled = false;
  }
});

render();
