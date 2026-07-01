let allProducts = [];
let uploadedImageUrl = null;
let pendingDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAdmin()) return;

  await loadProducts();

  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
  document.getElementById('product-cancel-btn').addEventListener('click', closeProductModal);
  document.getElementById('product-modal-close').addEventListener('click', closeProductModal);
  document.getElementById('product-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'product-modal-overlay') closeProductModal();
  });

  document.getElementById('product-form').addEventListener('submit', saveProduct);

  document.getElementById('image-upload-box').addEventListener('click', () => {
    document.getElementById('product-image-input').click();
  });
  document.getElementById('product-image-input').addEventListener('change', handleImageUpload);

  document.getElementById('product-search').addEventListener('input', renderProductsTable);
  document.getElementById('product-status-filter').addEventListener('change', renderProductsTable);

  document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm-btn').addEventListener('click', confirmDeleteProduct);
});

async function loadProducts() {
  const tbody = document.getElementById('products-table-body');
  try {
    const { products } = await api.get('/admin/products');
    allProducts = products;
    renderProductsTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">Failed to load products.</td></tr>`;
    console.error(err);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  const search = document.getElementById('product-search').value.trim().toLowerCase();
  const filter = document.getElementById('product-status-filter').value;

  let filtered = allProducts;

  if (search) {
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(search) || p.sku?.toLowerCase().includes(search) || p.brand?.toLowerCase().includes(search)
    );
  }
  if (filter === 'active') filtered = filtered.filter((p) => p.isActive);
  if (filter === 'inactive') filtered = filtered.filter((p) => !p.isActive);
  if (filter === 'low-stock') filtered = filtered.filter((p) => p.stock <= 10);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--color-ink-soft);">No products match your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((p) => {
    const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
    return `
    <tr>
      <td>
        <div class="table-product-cell">
          <img class="table-product-thumb" src="${resolveProductImage(p.image)}" alt="" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&h=80&fit=crop'" />
          <div>
            <div class="table-product-name">${escapeHtml(p.name)}</div>
            <div style="font-size:0.76rem;color:var(--color-ink-soft);" class="mono">${escapeHtml(p.sku || '')}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td class="mono">${hasDiscount ? formatNaira(p.discountPrice) + ' <span style="text-decoration:line-through;color:var(--color-ink-soft);">' + formatNaira(p.price) + '</span>' : formatNaira(p.price)}</td>
      <td>
        <span class="badge ${p.stock <= 0 ? 'badge-red' : p.stock <= 10 ? 'badge-amber' : 'badge-green'}">${p.stock}</span>
      </td>
      <td><span class="badge ${p.isActive ? 'badge-green' : 'badge-grey'}">${p.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-icon-btn edit-btn" data-id="${p._id}" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
          </button>
          <button class="table-icon-btn danger delete-btn" data-id="${p._id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = allProducts.find((p) => p._id === btn.dataset.id);
      if (product) openProductModal(product);
    });
  });
  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

function openProductModal(product = null) {
  const form = document.getElementById('product-form');
  form.reset();
  document.getElementById('product-form-alert').classList.add('hidden');
  uploadedImageUrl = product ? product.image : null;

  const preview = document.getElementById('image-preview');
  const box = document.getElementById('image-upload-box');

  if (product) {
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = product._id;
    document.getElementById('form-name').value = product.name;
    document.getElementById('form-category').value = product.category;
    document.getElementById('form-brand').value = product.brand || '';
    document.getElementById('form-price').value = product.price;
    document.getElementById('form-discount-price').value = product.discountPrice || '';
    document.getElementById('form-stock').value = product.stock;
    document.getElementById('form-rx').value = String(product.requiresPrescription);
    document.getElementById('form-short-desc').value = product.shortDescription || '';
    document.getElementById('form-description').value = product.description;
    document.getElementById('form-dosage').value = product.dosageInfo || '';
    document.getElementById('form-manufacturer').value = product.manufacturer || '';
    document.getElementById('form-active').value = String(product.isActive);

    if (product.image && !product.image.includes('placeholder')) {
      preview.src = resolveProductImage(product.image);
      box.classList.add('has-image');
    } else {
      box.classList.remove('has-image');
    }
  } else {
    document.getElementById('product-modal-title').textContent = 'Add Product';
    document.getElementById('product-id').value = '';
    box.classList.remove('has-image');
  }

  document.getElementById('product-modal-overlay').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.add('hidden');
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be under 5MB', 'error');
    return;
  }

  const box = document.getElementById('image-upload-box');
  const preview = document.getElementById('image-preview');

  // Show local preview immediately
  const reader = new FileReader();
  reader.onload = (ev) => {
    preview.src = ev.target.result;
    box.classList.add('has-image');
  };
  reader.readAsDataURL(file);

  // Upload to server
  const formData = new FormData();
  formData.append('image', file);

  try {
    const data = await api.post('/upload/product-image', formData, true);
    uploadedImageUrl = data.imageUrl;
    showToast('Image uploaded', 'success');
  } catch (err) {
    showToast('Image upload failed: ' + err.message, 'error');
  }
}

async function saveProduct(e) {
  e.preventDefault();

  const id = document.getElementById('product-id').value;
  const alertEl = document.getElementById('product-form-alert');
  alertEl.classList.add('hidden');

  const payload = {
    name: document.getElementById('form-name').value.trim(),
    category: document.getElementById('form-category').value,
    brand: document.getElementById('form-brand').value.trim() || 'Generic',
    price: parseFloat(document.getElementById('form-price').value),
    discountPrice: document.getElementById('form-discount-price').value ? parseFloat(document.getElementById('form-discount-price').value) : 0,
    stock: parseInt(document.getElementById('form-stock').value, 10),
    requiresPrescription: document.getElementById('form-rx').value === 'true',
    shortDescription: document.getElementById('form-short-desc').value.trim(),
    description: document.getElementById('form-description').value.trim(),
    dosageInfo: document.getElementById('form-dosage').value.trim(),
    manufacturer: document.getElementById('form-manufacturer').value.trim(),
    isActive: document.getElementById('form-active').value === 'true'
  };

  if (uploadedImageUrl) payload.image = uploadedImageUrl;

  const btn = document.getElementById('product-save-btn');
  btn.disabled = true;
  btn.classList.add('is-loading');
  if (!btn.querySelector('.spinner')) btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');

  try {
    if (id) {
      await api.put(`/admin/products/${id}`, payload);
      showToast('Product updated', 'success');
    } else {
      await api.post('/admin/products', payload);
      showToast('Product created', 'success');
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    alertEl.textContent = err.message;
    alertEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.classList.remove('is-loading');
  }
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById('delete-modal-overlay').classList.remove('hidden');
}
function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal-overlay').classList.add('hidden');
}
async function confirmDeleteProduct() {
  if (!pendingDeleteId) return;
  try {
    await api.delete(`/admin/products/${pendingDeleteId}`);
    showToast('Product deleted', 'success');
    closeDeleteModal();
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
    closeDeleteModal();
  }
}
