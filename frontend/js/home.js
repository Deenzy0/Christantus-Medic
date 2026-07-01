document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('featured-products');
  if (!grid) return;

  grid.innerHTML = Array.from({ length: 4 }).map(() => `
    <div class="product-card">
      <div class="product-image-wrap" style="background:linear-gradient(90deg,#eef2f6,#f7fafc,#eef2f6);"></div>
      <div class="product-card-body">
        <div style="height:10px;width:60%;background:#eef2f6;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:14px;width:90%;background:#eef2f6;border-radius:4px;margin-bottom:10px;"></div>
        <div style="height:30px;background:#eef2f6;border-radius:8px;"></div>
      </div>
    </div>
  `).join('');

  try {
    const { products } = await api.get('/products?limit=8&sort=popular');
    const productsById = {};
    products.forEach((p) => (productsById[p._id] = p));

    if (products.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${ICONS.empty}<p>No products available yet. Check back soon.</p></div>`;
      return;
    }

    grid.innerHTML = products.slice(0, 8).map(productCardHTML).join('');
    attachAddToCartHandlers(grid, productsById);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load products. Is the backend server running?</p></div>`;
    console.error(err);
  }
});
