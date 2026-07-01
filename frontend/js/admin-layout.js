/**
 * Shared admin panel chrome: sidebar navigation + access guard.
 * Included on every admin-*.html page, before the page-specific script.
 */
const ADMIN_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
  products: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="M3.3 7 12 12l8.7-5"></path><path d="M12 22V12"></path></svg>`,
  orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  consultations: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`
};

const ADMIN_NAV_ITEMS = [
  { href: 'admin-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
  { href: 'admin-products.html', label: 'Products', icon: 'products' },
  { href: 'admin-orders.html', label: 'Orders', icon: 'orders' },
  { href: 'admin-users.html', label: 'Users', icon: 'users' },
  { href: 'admin-consultations.html', label: 'Consultations', icon: 'consultations' }
];

function renderAdminShell(activePage) {
  const sidebarEl = document.getElementById('admin-sidebar');
  if (!sidebarEl) return;

  const navHtml = ADMIN_NAV_ITEMS.map(
    (item) => `
    <a href="${item.href}" class="admin-nav-link ${item.href === activePage ? 'active' : ''}">
      ${ADMIN_ICONS[item.icon]} ${item.label}
    </a>`
  ).join('');

  sidebarEl.innerHTML = `
    <div class="admin-brand">
      <span class="brand-mark">${ICONS.cross}</span>
      Admin Panel
    </div>
    <nav class="admin-nav">${navHtml}</nav>
    <div class="admin-sidebar-footer">
      <a href="index.html" class="admin-back-link">${ADMIN_ICONS.back} Back to Storefront</a>
      <button class="btn btn-outline btn-sm btn-block" id="admin-logout-btn" style="border-color:rgba(255,255,255,0.2);color:#fff;">Log out</button>
    </div>
  `;

  document.getElementById('admin-logout-btn')?.addEventListener('click', () => auth.logout());
}

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.requireAdmin()) return;
  const page = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
  renderAdminShell(page);
});
