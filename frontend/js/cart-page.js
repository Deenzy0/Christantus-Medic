document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

function renderCart() {
  const items = cart.getItems();
  const layout = document.getElementById('cart-layout');
  const emptyState = document.getElementById('cart-empty');
  const list = document.getElementById('cart-items-list');

  if (items.length === 0) {
    layout.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  layout.classList.remove('hidden');
  emptyState.classList.add('hidden');

  list.innerHTML = items.map((item) => `
    <div class="cart-item-card" data-id="${item.productId}">
      <div class="cart-item-image">
        <img src="${resolveProductImage(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop'" />
      </div>
      <div class="cart-item-info">
        <h4>${escapeHtml(item.name)}</h4>
        <span class="cart-item-price mono">${formatNaira(item.price)}</span>
        ${item.quantity >= (item.stock || 99) ? `<div class="cart-item-stock-warning">Max available stock reached</div>` : ''}
      </div>
      <div class="cart-qty-stepper">
        <button class="qty-decrease" data-id="${item.productId}">−</button>
        <span>${item.quantity}</span>
        <button class="qty-increase" data-id="${item.productId}">+</button>
      </div>
      <button class="cart-item-remove" data-id="${item.productId}">Remove</button>
    </div>
  `).join('');

  list.querySelectorAll('.qty-increase').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = cart.getItems().find((i) => i.productId === btn.dataset.id);
      if (item) cart.updateQuantity(btn.dataset.id, item.quantity + 1);
      renderCart();
    });
  });
  list.querySelectorAll('.qty-decrease').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = cart.getItems().find((i) => i.productId === btn.dataset.id);
      if (item) cart.updateQuantity(btn.dataset.id, item.quantity - 1);
      renderCart();
    });
  });
  list.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      cart.removeItem(btn.dataset.id);
      showToast('Item removed from cart', 'info');
      renderCart();
    });
  });

  updateSummary();
}

function updateSummary() {
  const subtotal = cart.getSubtotal();
  const shipping = cart.getShippingFee();
  const total = cart.getTotal();

  document.getElementById('summary-subtotal').textContent = formatNaira(subtotal);
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Free' : formatNaira(shipping);
  document.getElementById('summary-total').textContent = formatNaira(total);

  const hint = document.getElementById('free-shipping-hint');
  if (shipping > 0) {
    const remaining = CONFIG.FREE_SHIPPING_THRESHOLD - subtotal;
    hint.textContent = `Add ${formatNaira(remaining)} more for free shipping`;
  } else {
    hint.textContent = '🎉 You qualify for free shipping!';
  }
}
