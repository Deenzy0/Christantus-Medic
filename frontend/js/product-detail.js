let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    showDetailError();
    return;
  }

  try {
    const { product } = await api.get(`/products/${productId}`);
    currentProduct = product;
    renderProductDetail(product);
    loadRelatedProducts(product.category, product._id);
  } catch (err) {
    console.error(err);
    showDetailError();
  }

  // Quantity stepper
  document.getElementById('qty-minus').addEventListener('click', () => {
    const input = document.getElementById('qty-input');
    input.value = Math.max(1, parseInt(input.value || 1, 10) - 1);
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    const input = document.getElementById('qty-input');
    const max = currentProduct ? currentProduct.stock : 99;
    input.value = Math.min(max, parseInt(input.value || 1, 10) + 1);
  });

  document.getElementById('add-to-cart-detail-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    const qty = parseInt(document.getElementById('qty-input').value, 10) || 1;
    cart.addItem(currentProduct, qty);
    showToast(`${currentProduct.name} added to cart`, 'success');
  });

  document.getElementById('buy-now-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    const qty = parseInt(document.getElementById('qty-input').value, 10) || 1;
    cart.addItem(currentProduct, qty);
    window.location.href = 'cart.html';
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
});

function renderProductDetail(product) {
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-layout').classList.remove('hidden');

  document.title = `${product.name} — Christantus Medical Consult`;
  document.getElementById('breadcrumb-current').textContent = product.name;

  document.getElementById('main-product-image').src = resolveProductImage(product.image);
  document.getElementById('main-product-image').alt = product.name;

  document.getElementById('detail-category').textContent = product.category;
  document.getElementById('detail-name').textContent = product.name;
  document.getElementById('detail-brand').textContent = product.brand || 'Generic';
  document.getElementById('detail-sku').textContent = product.sku || '—';

  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  document.getElementById('detail-price').textContent = formatNaira(hasDiscount ? product.discountPrice : product.price);
  if (hasDiscount) {
    document.getElementById('detail-price-old').textContent = formatNaira(product.price);
    document.getElementById('detail-price-old').classList.remove('hidden');
  }

  const stockBadge = document.getElementById('detail-stock-badge');
  if (product.stock <= 0) {
    stockBadge.innerHTML = `<span class="badge badge-red">Out of Stock</span>`;
    document.getElementById('add-to-cart-detail-btn').disabled = true;
    document.getElementById('buy-now-btn').disabled = true;
  } else if (product.stock <= 10) {
    stockBadge.innerHTML = `<span class="badge badge-amber">Only ${product.stock} left in stock</span>`;
  } else {
    stockBadge.innerHTML = `<span class="badge badge-green">In Stock</span>`;
  }

  if (product.requiresPrescription) {
    document.getElementById('detail-rx-notice').classList.remove('hidden');
  }

  document.getElementById('detail-short-desc').textContent = product.shortDescription || '';

  document.getElementById('tab-description').innerHTML = `<p>${escapeHtml(product.description)}</p>`;
  document.getElementById('tab-dosage').innerHTML = `<p>${escapeHtml(product.dosageInfo) || 'No specific dosage information provided. Please consult a pharmacist before use.'}</p>`;
  document.getElementById('tab-manufacturer').innerHTML = `<p>${escapeHtml(product.manufacturer) || 'Not specified.'}</p>`;

  const qtyInput = document.getElementById('qty-input');
  qtyInput.max = product.stock;
}

async function loadRelatedProducts(category, excludeId) {
  const grid = document.getElementById('related-products');
  try {
    const { products } = await api.get(`/products?category=${encodeURIComponent(category)}&limit=5`);
    const filtered = products.filter((p) => p._id !== excludeId).slice(0, 4);

    if (filtered.length === 0) {
      document.querySelector('.related-section').style.display = 'none';
      return;
    }

    const productsById = {};
    filtered.forEach((p) => (productsById[p._id] = p));
    grid.innerHTML = filtered.map(productCardHTML).join('');
    attachAddToCartHandlers(grid, productsById);
  } catch (err) {
    document.querySelector('.related-section').style.display = 'none';
  }
}

function showDetailError() {
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-error').classList.remove('hidden');
  document.querySelector('.related-section').style.display = 'none';
}
