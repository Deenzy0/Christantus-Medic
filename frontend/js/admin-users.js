let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAdmin()) return;

  await loadUsers();

  document.getElementById('user-search').addEventListener('input', renderUsersTable);
  document.getElementById('user-role-filter').addEventListener('change', renderUsersTable);
});

async function loadUsers() {
  const tbody = document.getElementById('users-table-body');
  try {
    const { users } = await api.get('/admin/users');
    allUsers = users;
    renderUsersTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;">Failed to load users.</td></tr>`;
    console.error(err);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  const search = document.getElementById('user-search').value.trim().toLowerCase();
  const roleFilter = document.getElementById('user-role-filter').value;

  let filtered = allUsers;
  if (search) {
    filtered = filtered.filter((u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
  }
  if (roleFilter !== 'All') filtered = filtered.filter((u) => u.role === roleFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--color-ink-soft);">No users found.</td></tr>`;
    return;
  }

  const currentUserId = auth.getUser()?._id;
  const roleBadge = { admin: 'badge-blue', pharmacist: 'badge-green', customer: 'badge-grey' };

  tbody.innerHTML = filtered.map((u) => `
    <tr>
      <td style="font-weight:600;">${escapeHtml(u.name)} ${u._id === currentUserId ? '<span style="font-size:0.7rem;color:var(--color-ink-soft);">(you)</span>' : ''}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <select class="status-select role-select" data-id="${u._id}" ${u._id === currentUserId ? 'disabled' : ''}>
          <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
          <option value="pharmacist" ${u.role === 'pharmacist' ? 'selected' : ''}>Pharmacist</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td><span class="badge ${u.isActive ? 'badge-green' : 'badge-red'}">${u.isActive ? 'Active' : 'Deactivated'}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-icon-btn toggle-active-btn" data-id="${u._id}" data-active="${u.isActive}" title="${u.isActive ? 'Deactivate' : 'Activate'}" ${u._id === currentUserId ? 'disabled' : ''}>
            ${u.isActive
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            }
          </button>
          <button class="table-icon-btn danger delete-user-btn" data-id="${u._id}" title="Delete" ${u._id === currentUserId ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.role-select').forEach((select) => {
    select.addEventListener('change', () => updateUserRole(select.dataset.id, select.value));
  });
  tbody.querySelectorAll('.toggle-active-btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleUserActive(btn.dataset.id, btn.dataset.active === 'true'));
  });
  tbody.querySelectorAll('.delete-user-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
  });
}

async function updateUserRole(userId, role) {
  try {
    await api.put(`/admin/users/${userId}`, { role });
    showToast('User role updated', 'success');
    await loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
    await loadUsers();
  }
}

async function toggleUserActive(userId, currentlyActive) {
  try {
    await api.put(`/admin/users/${userId}`, { isActive: !currentlyActive });
    showToast(`User ${!currentlyActive ? 'activated' : 'deactivated'}`, 'success');
    await loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return;
  try {
    await api.delete(`/admin/users/${userId}`);
    showToast('User deleted', 'success');
    await loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
