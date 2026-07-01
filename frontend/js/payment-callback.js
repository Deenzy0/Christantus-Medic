document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  // Paystack appends ?trxref=...&reference=... to the callback_url we provided
  const reference = params.get('reference') || params.get('trxref');
  const orderId = params.get('orderId');

  const card = document.getElementById('callback-card');

  if (!reference) {
    renderResult(card, false, 'No payment reference found. If you completed payment, check your order history.', orderId);
    return;
  }

  try {
    const data = await api.get(`/payments/verify/${reference}`);
    cart.clear();
    sessionStorage.removeItem('cmc_pending_order');
    renderResult(card, true, 'Your payment was successful and your order is now being processed.', data.order._id);
  } catch (err) {
    renderResult(card, false, err.message || 'We could not verify your payment. If you were charged, contact support with your order reference.', orderId);
  }
});

function renderResult(card, success, message, orderId) {
  card.innerHTML = `
    <div class="callback-icon ${success ? 'success' : 'error'}">
      ${success
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      }
    </div>
    <h2>${success ? 'Payment Successful' : 'Payment Verification Failed'}</h2>
    <p>${escapeHtml(message)}</p>
    <div class="callback-actions">
      ${orderId ? `<a href="order-success.html?orderId=${orderId}" class="btn btn-primary btn-block">View Order Details</a>` : ''}
      <a href="dashboard.html" class="btn btn-outline btn-block">Go to My Orders</a>
      <a href="shop.html" class="btn btn-ghost btn-block">Continue Shopping</a>
    </div>
  `;
}
