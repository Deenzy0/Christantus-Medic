const ordersState = { search: '', status: 'All', page: 1 };
let searchDebounce;

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.requireAdmin()) return;

  loadOrders();

  document.getElementById('order-search').addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      ordersState.search = e.target.value.trim().toLowerCase();
      ordersState.page = 1;
      loadOrders();
    }, 350);
  });

  document.getElementById('order-status-filter').addEventListener('change', (e) => {
    ordersState.status = e.target.value;
    ordersState.page = 1;
    loadOrders();
  });

  document.getElementById('order-modal-close').addEventListener('click', closeOrderModal);
  document.getElementById('order-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'order-modal-overlay') closeOrderModal();
  });
});

async function loadOrders() {
  const tbody = document.getElementById('orders-table-body');
  const pagination = document.getElementById('orders-pagination');

  const params = new URLSearchParams();
  if (ordersState.status !== 'All') params.set('status', ordersState.status);
  params.set('page', ordersState.page);
  params.set('limit', 15);

  try {
    const { orders, total, page, pages } = await api.get(`/admin/orders?${params.toString()}`);

    let filtered = orders;
    if (ordersState.search) {
      filtered = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(ordersState.search) ||
          (o.user?.name || '').toLowerCase().includes(ordersState.search) ||
          (o.user?.email || '').toLowerCase().includes(ordersState.search)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;color:var(--color-ink-soft);">No orders found.</td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    const statusBadgeClass = { pending: 'badge-amber', processing: 'badge-blue', shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red' };
    const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    tbody.innerHTML = filtered.map((order) => `
      <tr>
        <td class="mono">${escapeHtml(order.orderNumber)}</td>
        <td>${escapeHtml(order.user?.name || 'Guest')}</td>
        <td>${formatDate(order.createdAt)}</td>
        <td>${order.items.length}</td>
        <td class="mono">${formatNaira(order.totalAmount)}</td>
        <td><span class="badge ${order.paymentStatus === 'paid' ? 'badge-green' : order.paymentStatus === 'failed' ? 'badge-red' : 'badge-amber'}">${order.paymentStatus.toUpperCase()}</span></td>
        <td>
          <select class="status-select status-update" data-id="${order._id}">
            ${statusOptions.map((s) => `<option value="${s}" ${s === order.orderStatus ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="table-icon-btn view-order-btn" data-id="${order._id}" title="View details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.status-update').forEach((select) => {
      select.addEventListener('change', () => updateOrderStatus(select.dataset.id, select.value));
    });
    tbody.querySelectorAll('.view-order-btn').forEach((btn) => {
      btn.addEventListener('click', () => viewOrderDetail(filtered.find((o) => o._id === btn.dataset.id)));
    });

    renderOrdersPagination(pagination, page, pages);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;">Failed to load orders.</td></tr>`;
    console.error(err);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await api.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus });
    showToast(`Order status updated to ${newStatus}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    loadOrders(); // revert dropdown to actual server state
  }
}

function viewOrderDetail(order) {
  if (!order) return;

  const itemsHtml = order.items.map((item) => `
    <div class="order-item-line">
      <span>${escapeHtml(item.name)} <span class="mono" style="color:var(--color-ink-soft);">×${item.quantity}</span></span>
      <span class="mono">${formatNaira(item.price * item.quantity)}</span>
    </div>
  `).join('');

  document.getElementById('order-modal-title').textContent = `Order ${order.orderNumber}`;
  document.getElementById('order-modal-body').innerHTML = `
    <div class="order-detail-row"><span class="label">Customer</span><span class="value">${escapeHtml(order.user?.name || 'Guest')} (${escapeHtml(order.user?.email || '—')})</span></div>
    <div class="order-detail-row"><span class="label">Date</span><span class="value">${formatDate(order.createdAt)}</span></div>
    <div class="order-detail-row"><span class="label">Payment Method</span><span class="value">${order.paymentMethod === 'paystack' ? 'Paystack (Online)' : 'Cash on Delivery'}</span></div>
    <div class="order-detail-row"><span class="label">Payment Status</span><span class="value">${order.paymentStatus.toUpperCase()}</span></div>

    <div class="order-items-table mt-3">
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
    ${order.notes ? `<h4 class="mt-4 mb-2" style="font-size:0.9rem;">Order Notes</h4><p style="font-size:0.88rem;">${escapeHtml(order.notes)}</p>` : ''}
  `;

  document.getElementById('order-modal-overlay').classList.remove('hidden');
}

function closeOrderModal() {
  document.getElementById('order-modal-overlay').classList.add('hidden');
}

function renderOrdersPagination(container, currentPage, totalPages) {
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
      ordersState.page = parseInt(btn.dataset.page, 10);
      loadOrders();
    });
  });
}
