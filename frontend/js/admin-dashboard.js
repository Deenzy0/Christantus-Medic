document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAdmin()) return;
  await loadDashboardStats();
});

async function loadDashboardStats() {
  const statsGrid = document.getElementById('stats-grid');
  const tbody = document.getElementById('recent-orders-body');

  try {
    const { stats, recentOrders } = await api.get('/admin/dashboard');

    statsGrid.innerHTML = `
      ${statCard('Total Revenue', formatNaira(stats.totalRevenue), 'var(--color-green-light)', 'var(--color-green-dark)', iconRevenue())}
      ${statCard('Total Orders', stats.totalOrders, 'var(--color-blue-light)', 'var(--color-blue)', iconOrders())}
      ${statCard('Pending Orders', stats.pendingOrders, '#FEF3E2', 'var(--color-amber)', iconClock())}
      ${statCard('Registered Customers', stats.totalUsers, '#EDE9FE', '#7C3AED', iconUsers())}
      ${statCard('Total Products', stats.totalProducts, 'var(--color-blue-light)', 'var(--color-blue)', iconBox())}
      ${statCard('Low Stock Alerts', stats.lowStockProducts, '#FDE8ED', 'var(--color-red)', iconAlert())}
      ${statCard('Pending Consultations', stats.pendingConsultations, '#FEF3E2', 'var(--color-amber)', iconHeart())}
    `;

    if (recentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--color-ink-soft);">No orders yet.</td></tr>`;
      return;
    }

    const statusBadgeClass = { pending: 'badge-amber', processing: 'badge-blue', shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red' };

    tbody.innerHTML = recentOrders.map((order) => `
      <tr>
        <td class="mono">${escapeHtml(order.orderNumber)}</td>
        <td>${escapeHtml(order.user?.name || 'Guest')}</td>
        <td>${formatDate(order.createdAt)}</td>
        <td class="mono">${formatNaira(order.totalAmount)}</td>
        <td><span class="badge ${order.paymentStatus === 'paid' ? 'badge-green' : 'badge-amber'}">${order.paymentStatus.toUpperCase()}</span></td>
        <td><span class="badge ${statusBadgeClass[order.orderStatus] || 'badge-grey'}">${order.orderStatus.toUpperCase()}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    statsGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load dashboard stats.</p></div>`;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">Failed to load.</td></tr>`;
    console.error(err);
  }
}

function statCard(label, value, bg, color, icon) {
  return `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-icon" style="background:${bg};color:${color};">${icon}</div>
      </div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function iconRevenue() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`; }
function iconOrders() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`; }
function iconClock() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`; }
function iconUsers() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`; }
function iconBox() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>`; }
function iconAlert() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`; }
function iconHeart() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`; }
