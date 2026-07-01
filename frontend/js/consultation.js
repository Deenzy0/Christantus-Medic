document.addEventListener('DOMContentLoaded', () => {
  // Prevent booking a date in the past
  const dateInput = document.getElementById('preferredDate');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  // Prefill from logged-in user if available
  const user = auth.getUser();
  if (user) {
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
  }

  document.getElementById('consultation-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertEl = document.getElementById('consult-alert');
    const successEl = document.getElementById('consult-success');
    alertEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const payload = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      consultationType: document.getElementById('consultationType').value,
      preferredDate: document.getElementById('preferredDate').value,
      preferredTime: document.getElementById('preferredTime').value,
      message: document.getElementById('message').value.trim()
    };

    if (!payload.fullName || !payload.email || !payload.phone || !payload.preferredDate || !payload.preferredTime) {
      alertEl.textContent = 'Please fill in all required fields.';
      alertEl.classList.remove('hidden');
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = document.getElementById('consult-submit-btn');
    btn.disabled = true;
    btn.classList.add('is-loading');
    if (!btn.querySelector('.spinner')) btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');

    try {
      const data = await api.post('/consultations', payload);
      successEl.textContent = data.message || 'Consultation booked! We will reach out shortly to confirm.';
      successEl.classList.remove('hidden');
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('consultation-form').reset();
      dateInput.min = today;
      showToast('Consultation request sent!', 'success');
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });
});
