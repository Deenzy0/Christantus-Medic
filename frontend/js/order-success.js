document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');

  if (!orderId) {
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    const { order } = await api.get(`/orders/${orderId}`);
    renderOrder(order);
  } catch (err) {
    showToast('Could not load order details.', 'error');
    window.location.href = 'dashboard.html';
  }
});

function renderOrder(order) {
  document.getElementById('order-loading').classList.add('hidden');
  document.getElementById('order-detail-section').classList.remove('hidden');

  const statusBadgeClass = {
    pending: 'badge-amber',
    processing: 'badge-blue',
    shipped: 'badge-blue',
    delivered: 'badge-green',
    cancelled: 'badge-red'
  }[order.orderStatus] || 'badge-grey';

  const itemsHtml = order.items.map((item) => `
    <div class="order-item-line">
      <span>${escapeHtml(item.name)} <span class="mono" style="color:var(--color-ink-soft);">×${item.quantity}</span></span>
      <span class="mono">${formatNaira(item.price * item.quantity)}</span>
    </div>
  `).join('');

  document.getElementById('order-detail-card').innerHTML = `
    <div class="order-detail-header">
      <div>
        <div class="order-number mono">${escapeHtml(order.orderNumber)}</div>
        <div class="order-date">Placed on ${formatDate(order.createdAt)}</div>
      </div>
      <span class="badge ${statusBadgeClass}">${order.orderStatus.toUpperCase()}</span>
    </div>

    <div class="order-detail-row"><span class="label">Payment Method</span><span class="value">${order.paymentMethod === 'paystack' ? 'Paystack (Online)' : 'Cash on Delivery'}</span></div>
    <div class="order-detail-row"><span class="label">Payment Status</span><span class="value">${order.paymentStatus.toUpperCase()}</span></div>

    <div class="order-items-table">
      <h4 class="mb-2" style="font-size:0.9rem;">Items</h4>
      ${itemsHtml}
    </div>

    <div class="order-detail-row"><span class="label">Subtotal</span><span class="value mono">${formatNaira(order.itemsTotal)}</span></div>
    <div class="order-detail-row"><span class="label">Shipping</span><span class="value mono">${order.shippingFee === 0 ? 'Free' : formatNaira(order.shippingFee)}</span></div>
    <div class="order-detail-row" style="font-size:1rem;"><span class="label" style="color:var(--color-ink);font-weight:700;">Total</span><span class="value mono" style="color:var(--color-blue);font-size:1.1rem;">${formatNaira(order.totalAmount)}</span></div>

    <h4 class="mt-4 mb-2" style="font-size:0.9rem;">Shipping Address</h4>
    <div class="shipping-address-box">
      ${escapeHtml(order.shippingAddress.fullName)}<br/>
      ${escapeHtml(order.shippingAddress.street)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)}<br/>
      ${escapeHtml(order.shippingAddress.phone)}
    </div>
  `;
}
