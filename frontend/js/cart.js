/**
 * Shopping cart stored in localStorage so it persists across pages
 * without needing a logged-in session. Cart items reference product
 * id, name, image, price, and quantity only — totals are always
 * re-validated server-side at checkout/order time.
 */
const cart = {
  getItems() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  },

  saveItems(items) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
    this.updateCartBadge();
  },

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existing = items.find((i) => i.productId === product._id);
    const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: unitPrice,
        stock: product.stock,
        quantity: Math.min(quantity, product.stock)
      });
    }
    this.saveItems(items);
  },

  updateQuantity(productId, quantity) {
    let items = this.getItems();
    if (quantity <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const item = items.find((i) => i.productId === productId);
      if (item) item.quantity = Math.min(quantity, item.stock || 99);
    }
    this.saveItems(items);
  },

  removeItem(productId) {
    const items = this.getItems().filter((i) => i.productId !== productId);
    this.saveItems(items);
  },

  clear() {
    this.saveItems([]);
  },

  getTotalCount() {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getShippingFee() {
    const subtotal = this.getSubtotal();
    return subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : CONFIG.SHIPPING_FEE;
  },

  getTotal() {
    return this.getSubtotal() + this.getShippingFee();
  },

  updateCartBadge() {
    const badge = document.querySelector('.cart-count');
    if (!badge) return;
    const count = this.getTotalCount();
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
};
