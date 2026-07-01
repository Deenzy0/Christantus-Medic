document.addEventListener('DOMContentLoaded', () => {
  if (!auth.requireAuth()) return;

  const items = cart.getItems();
  if (items.length === 0) {
    document.getElementById('checkout-layout').classList.add('hidden');
    document.getElementById('checkout-empty').classList.remove('hidden');
    return;
  }

  renderCheckoutSummary();
  prefillUserInfo();

  document.querySelectorAll('.payment-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });

  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
});

function prefillUserInfo() {
  const user = auth.getUser();
  if (!user) return;
  document.getElementById('fullName').value = user.name || '';
  document.getElementById('phone').value = user.phone || '';
  if (user.address) {
    document.getElementById('street').value = user.address.street || '';
    document.getElementById('city').value = user.address.city || '';
    document.getElementById('state').value = user.address.state || '';
  }
}

function renderCheckoutSummary() {
  const items = cart.getItems();
  const list = document.getElementById('checkout-items-list');

  list.innerHTML = items.map((item) => `
    <div class="checkout-item-row">
      <span class="item-name">${escapeHtml(item.name)}</span>
      <span class="item-qty">×${item.quantity}</span>
      <span class="item-price mono">${formatNaira(item.price * item.quantity)}</span>
    </div>
  `).join('');

  document.getElementById('co-subtotal').textContent = formatNaira(cart.getSubtotal());
  const shipping = cart.getShippingFee();
  document.getElementById('co-shipping').textContent = shipping === 0 ? 'Free' : formatNaira(shipping);
  document.getElementById('co-total').textContent = formatNaira(cart.getTotal());
}

async function placeOrder() {
  const alertEl = document.getElementById('checkout-alert');
  alertEl.classList.add('hidden');

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const street = document.getElementById('street').value.trim();
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const notes = document.getElementById('orderNotes').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

  if (!fullName || !phone || !street || !city || !state) {
    showCheckoutAlert('Please fill in all shipping address fields.');
    return;
  }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.classList.add('is-loading');
  if (!btn.querySelector('.spinner')) btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');

  try {
    const items = cart.getItems().map((i) => ({ productId: i.productId, quantity: i.quantity }));

    const { order } = await api.post('/orders', {
      items,
      shippingAddress: { fullName, phone, street, city, state, country: 'Nigeria' },
      paymentMethod,
      notes
    });

    if (paymentMethod === 'cash_on_delivery') {
      cart.clear();
      showToast('Order placed successfully! Pay on delivery.', 'success');
      window.location.href = `order-success.html?orderId=${order._id}`;
      return;
    }

    // Paystack flow — initialize transaction and redirect to Paystack's hosted page
    const payment = await api.post('/payments/initialize', { orderId: order._id });
    // Keep cart until payment is confirmed, in case the user cancels Paystack
    sessionStorage.setItem('cmc_pending_order', order._id);
    window.location.href = payment.authorizationUrl;
  } catch (err) {
    showCheckoutAlert(err.message);
    btn.disabled = false;
    btn.classList.remove('is-loading');
  }
}

function showCheckoutAlert(message) {
  const el = document.getElementById('checkout-alert');
  el.textContent = message;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
