document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAuth()) return;

  renderUserCard();
  setupTabs();
  loadOrders();
  setupProfileForm();
  setupPasswordForm();
});

function renderUserCard() {
  const user = auth.getUser();
  if (!user) return;
  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('dashboard-user-card').innerHTML = `
    <div class="dash-avatar">${initials}</div>
    <div class="dash-user-name">${escapeHtml(user.name)}</div>
    <div class="dash-user-email">${escapeHtml(user.email)}</div>
  `;
}

function setupTabs() {
  document.querySelectorAll('.dash-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dash-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.dash-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

async function loadOrders() {
  const list = document.getElementById('orders-list');
  list.innerHTML = `<div class="flex items-center justify-center" style="padding:40px 0;"><div class="spinner spinner-blue"></div></div>`;

  try {
    const { orders } = await api.get('/orders/my-orders');

    if (orders.length === 0) {
      list.innerHTML = `<div class="empty-state">${ICONS.empty}<p>You haven't placed any orders yet.</p><a href="shop.html" class="btn btn-primary mt-3">Start Shopping</a></div>`;
      return;
    }

    const statusBadgeClass = {
      pending: 'badge-amber', processing: 'badge-blue', shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red'
    };

    list.innerHTML = orders.map((order) => `
      <div class="order-card-row">
        <div class="order-card-info">
          <div class="order-num">${escapeHtml(order.orderNumber)}</div>
          <div class="order-meta">${formatDate(order.createdAt)} · ${order.items.length} item${order.items.length > 1 ? 's' : ''}</div>
        </div>
        <div class="order-card-right">
          <span class="order-card-total">${formatNaira(order.totalAmount)}</span>
          <span class="badge ${statusBadgeClass[order.orderStatus] || 'badge-grey'}">${order.orderStatus.toUpperCase()}</span>
          <a href="order-success.html?orderId=${order._id}" class="btn btn-outline btn-sm">View</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Could not load your orders. Please try again.</p></div>`;
  }
}

function setupProfileForm() {
  const user = auth.getUser();
  if (user) {
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = user.phone || '';
    if (user.address) {
      document.getElementById('profile-street').value = user.address.street || '';
      document.getElementById('profile-city').value = user.address.city || '';
      document.getElementById('profile-state').value = user.address.state || '';
    }
  }

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('profile-alert');
    alertEl.classList.add('hidden');

    try {
      const { user: updatedUser } = await api.put('/auth/me', {
        name: document.getElementById('profile-name').value.trim(),
        phone: document.getElementById('profile-phone').value.trim(),
        address: {
          street: document.getElementById('profile-street').value.trim(),
          city: document.getElementById('profile-city').value.trim(),
          state: document.getElementById('profile-state').value.trim(),
          country: 'Nigeria'
        }
      });
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      showToast('Profile updated successfully', 'success');
      renderUserCard();
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
    }
  });
}

function setupPasswordForm() {
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('password-alert');
    alertEl.classList.add('hidden');

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    try {
      const data = await api.put('/auth/change-password', { currentPassword, newPassword });
      auth.setSession(data.token, data.user);
      showToast('Password updated successfully', 'success');
      document.getElementById('password-form').reset();
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
    }
  });
}
