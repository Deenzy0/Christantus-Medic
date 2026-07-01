const shopState = {
  search: '',
  category: 'All',
  sort: '',
  minPrice: '',
  maxPrice: '',
  page: 1
};

let searchDebounceTimer;

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadProducts();

  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      shopState.search = e.target.value.trim();
      shopState.page = 1;
      loadProducts();
    }, 400);
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    shopState.sort = e.target.value;
    shopState.page = 1;
    loadProducts();
  });

  document.getElementById('apply-price-btn').addEventListener('click', () => {
    shopState.minPrice = document.getElementById('min-price').value;
    shopState.maxPrice = document.getElementById('max-price').value;
    shopState.page = 1;
    loadProducts();
  });

  // Pre-fill category from URL if homepage linked here with ?category=
  const urlParams = new URLSearchParams(window.location.search);
  const urlCategory = urlParams.get('category');
  if (urlCategory) shopState.category = urlCategory;

  const urlSearch = urlParams.get('search');
  if (urlSearch) {
    shopState.search = urlSearch;
    document.getElementById('search-input').value = urlSearch;
  }
});

async function loadCategories() {
  try {
    const { categories } = await api.get('/products/categories');
    const list = document.getElementById('category-list');
    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'category-item';
      btn.dataset.category = cat;
      btn.textContent = cat;
      if (cat === shopState.category) btn.classList.add('active');
      list.appendChild(btn);
    });
    list.querySelectorAll('.category-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        list.querySelectorAll('.category-item').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        shopState.category = btn.dataset.category;
        shopState.page = 1;
        loadProducts();
      });
    });
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  const resultsCount = document.getElementById('results-count');
  const pagination = document.getElementById('pagination');

  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="product-card">
      <div class="product-image-wrap" style="background:#eef2f6;"></div>
      <div class="product-card-body">
        <div style="height:10px;width:60%;background:#eef2f6;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:14px;width:90%;background:#eef2f6;border-radius:4px;margin-bottom:10px;"></div>
        <div style="height:30px;background:#eef2f6;border-radius:8px;"></div>
      </div>
    </div>
  `).join('');
  resultsCount.textContent = 'Loading...';

  const params = new URLSearchParams();
  if (shopState.search) params.set('search', shopState.search);
  if (shopState.category && shopState.category !== 'All') params.set('category', shopState.category);
  if (shopState.sort) params.set('sort', shopState.sort);
  if (shopState.minPrice) params.set('minPrice', shopState.minPrice);
  if (shopState.maxPrice) params.set('maxPrice', shopState.maxPrice);
  params.set('page', shopState.page);
  params.set('limit', 9);

  try {
    const data = await api.get(`/products?${params.toString()}`);
    const { products, total, page, pages } = data;

    resultsCount.textContent = `${total} product${total === 1 ? '' : 's'} found`;

    if (products.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${ICONS.empty}<p>No products match your filters. Try adjusting your search.</p></div>`;
      pagination.innerHTML = '';
      return;
    }

    const productsById = {};
    products.forEach((p) => (productsById[p._id] = p));

    grid.innerHTML = products.map(productCardHTML).join('');
    attachAddToCartHandlers(grid, productsById);

    renderPagination(pagination, page, pages);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load products. Is the backend server running?</p></div>`;
    resultsCount.textContent = '';
    console.error(err);
  }
}

function renderPagination(container, currentPage, totalPages) {
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      shopState.page = parseInt(btn.dataset.page, 10);
      loadProducts();
      window.scrollTo({ top: document.querySelector('.shop-body').offsetTop - 100, behavior: 'smooth' });
    });
  });
}
