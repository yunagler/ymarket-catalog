const params = new URLSearchParams(location.search);
const orderId = params.get('order');
const value = Number(params.get('value') || 0);
const ref = document.getElementById('order-ref');

if (orderId) {
  ref.textContent = `מספר הזמנה ${orderId}`;
  ref.hidden = false;
}

const purchaseKey = `thermal_purchase_${orderId || value || 'confirmed'}`;
if (!sessionStorage.getItem(purchaseKey) && typeof fbq === 'function') {
  fbq('track', 'Purchase', {
    content_ids: ['304'],
    content_type: 'product',
    value,
    currency: 'ILS'
  });
  sessionStorage.setItem(purchaseKey, '1');
}

document.getElementById('enter-world').addEventListener('click', () => {
  if (typeof fbq === 'function') fbq('trackCustom', 'BusinessWorldEntered', { source: 'thermal-paper-80x80', order_id: orderId || '' });
});
