let allConsultations = [];
let activeConsultationId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAdmin()) return;

  await loadConsultations();

  document.getElementById('consult-search').addEventListener('input', renderConsultTable);
  document.getElementById('consult-status-filter').addEventListener('change', renderConsultTable);

  document.getElementById('consult-modal-close').addEventListener('click', closeConsultModal);
  document.getElementById('consult-modal-cancel').addEventListener('click', closeConsultModal);
  document.getElementById('consult-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'consult-modal-overlay') closeConsultModal();
  });
  document.getElementById('consult-save-btn').addEventListener('click', saveConsultationUpdate);
});

async function loadConsultations() {
  const tbody = document.getElementById('consult-table-body');
  try {
    const { consultations } = await api.get('/admin/consultations');
    allConsultations = consultations;
    renderConsultTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">Failed to load consultations.</td></tr>`;
    console.error(err);
  }
}

function renderConsultTable() {
  const tbody = document.getElementById('consult-table-body');
  const search = document.getElementById('consult-search').value.trim().toLowerCase();
  const statusFilter = document.getElementById('consult-status-filter').value;

  let filtered = allConsultations;
  if (search) {
    filtered = filtered.filter((c) => c.fullName.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
  }
  if (statusFilter !== 'All') filtered = filtered.filter((c) => c.status === statusFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--color-ink-soft);">No consultations found.</td></tr>`;
    return;
  }

  const statusBadge = { pending: 'badge-amber', confirmed: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red' };

  tbody.innerHTML = filtered.map((c) => `
    <tr>
      <td>
        <div style="font-weight:600;">${escapeHtml(c.fullName)}</div>
        <div style="font-size:0.78rem;color:var(--color-ink-soft);">${escapeHtml(c.email)} · ${escapeHtml(c.phone)}</div>
      </td>
      <td>${escapeHtml(c.consultationType)}</td>
      <td>${formatDate(c.preferredDate)}</td>
      <td>${escapeHtml(c.preferredTime)}</td>
      <td><span class="badge ${statusBadge[c.status] || 'badge-grey'}">${c.status.toUpperCase()}</span></td>
      <td>
        <button class="table-icon-btn view-consult-btn" data-id="${c._id}" title="View / Update">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.view-consult-btn').forEach((btn) => {
    btn.addEventListener('click', () => openConsultModal(filtered.find((c) => c._id === btn.dataset.id)));
  });
}

function openConsultModal(consultation) {
  if (!consultation) return;
  activeConsultationId = consultation._id;

  document.getElementById('consult-modal-body').innerHTML = `
    <div class="order-detail-row"><span class="label">Full Name</span><span class="value">${escapeHtml(consultation.fullName)}</span></div>
    <div class="order-detail-row"><span class="label">Email</span><span class="value">${escapeHtml(consultation.email)}</span></div>
    <div class="order-detail-row"><span class="label">Phone</span><span class="value">${escapeHtml(consultation.phone)}</span></div>
    <div class="order-detail-row"><span class="label">Type</span><span class="value">${escapeHtml(consultation.consultationType)}</span></div>
    <div class="order-detail-row"><span class="label">Preferred Date</span><span class="value">${formatDate(consultation.preferredDate)}</span></div>
    <div class="order-detail-row"><span class="label">Preferred Time</span><span class="value">${escapeHtml(consultation.preferredTime)}</span></div>
    ${consultation.message ? `<div class="mt-3"><div class="label" style="font-size:0.82rem;color:var(--color-ink-soft);margin-bottom:4px;">Patient Message</div><p style="font-size:0.88rem;">${escapeHtml(consultation.message)}</p></div>` : ''}
  `;

  document.getElementById('consult-status-select').value = consultation.status;
  document.getElementById('consult-admin-note').value = consultation.adminNote || '';

  document.getElementById('consult-modal-overlay').classList.remove('hidden');
}

function closeConsultModal() {
  activeConsultationId = null;
  document.getElementById('consult-modal-overlay').classList.add('hidden');
}

async function saveConsultationUpdate() {
  if (!activeConsultationId) return;

  const status = document.getElementById('consult-status-select').value;
  const adminNote = document.getElementById('consult-admin-note').value.trim();

  try {
    await api.put(`/admin/consultations/${activeConsultationId}`, { status, adminNote });
    showToast('Consultation updated', 'success');
    closeConsultModal();
    await loadConsultations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
