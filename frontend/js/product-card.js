/**
 * Renders a product card. Shared between the homepage's featured grid
 * and the shop page's product listing.
 */
function productCardHTML(product) {
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const outOfStock = product.stock <= 0;
  const imageUrl = resolveProductImage(product.image);

  return `
    <div class="product-card" data-id="${product._id}">
      <a href="product-detail.html?id=${product._id}" class="product-image-wrap">
        <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'" />
        ${hasDiscount ? `<span class="badge badge-red product-tag">SALE</span>` : ''}
        ${product.requiresPrescription ? `<span class="badge badge-blue product-tag tag-right">Rx</span>` : ''}
        ${outOfStock ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ''}
      </a>
      <div class="product-card-body">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <a href="product-detail.html?id=${product._id}"><h4 class="product-name">${escapeHtml(product.name)}</h4></a>
        <div class="product-price-row">
          <span class="product-price mono">${formatNaira(displayPrice)}</span>
          ${hasDiscount ? `<span class="product-price-old mono">${formatNaira(product.price)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-block btn-sm add-to-cart-btn" ${outOfStock ? 'disabled' : ''} data-id="${product._id}">
          ${outOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  `;
}

// Maps backend placeholder/local paths to real demo images so the storefront
// looks populated even before an admin uploads real product photos.
function resolveProductImage(path) {
  if (!path || path.includes('placeholder')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop';
  }
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return CONFIG.UPLOADS_BASE_URL + path;
  return DEMO_IMAGE_MAP[path] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop';
}

const DEMO_IMAGE_MAP = {
  '/images/products/paracetamol.png': 'https://images.unsplash.com/photo-1550572017-edd951aa8f8b?w=400&h=400&fit=crop',
  '/images/products/amoxicillin.png': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
  '/images/products/vitamin-c.png': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=400&fit=crop',
  '/images/products/bp-monitor.png': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop',
  '/images/products/first-aid-kit.png': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop',
  '/images/products/infant-vitamins.png': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=400&fit=crop',
  '/images/products/glucometer.png': 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&h=400&fit=crop',
  '/images/products/lotion.png': 'https://images.unsplash.com/photo-1556228720-da4e80a78029?w=400&h=400&fit=crop',
  '/images/products/cold-syrup.png': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop',
  '/images/products/n95-masks.png': 'https://images.unsplash.com/photo-1605845981942-6b1da3133214?w=400&h=400&fit=crop',
  '/images/products/omega-3.png': 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=400&h=400&fit=crop',
  '/images/products/sanitizer.png': 'https://images.unsplash.com/photo-1584483720412-ce931f4aefa8?w=400&h=400&fit=crop'
};

function attachAddToCartHandlers(container, productsById) {
  container.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const product = productsById[id];
      if (!product || btn.disabled) return;

      cart.addItem(product, 1);
      showToast(`${product.name} added to cart`, 'success');

      // Brief "Added ✓" confirmation on the button itself, then
      // revert — gives tactile feedback beyond the toast alone.
      const originalText = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.classList.add('btn-added');
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('btn-added');
        btn.disabled = false;
      }, 900);
    });
  });
}
