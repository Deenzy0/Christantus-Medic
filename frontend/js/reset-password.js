document.addEventListener('DOMContentLoaded', () => {
  const token = new URLSearchParams(window.location.search).get('token');

  const formSection = document.getElementById('reset-form-section');
  const successEl = document.getElementById('reset-success');
  const expiredEl = document.getElementById('reset-expired');

  // If no token in URL, show expired state immediately
  if (!token) {
    formSection.classList.add('hidden');
    expiredEl.classList.remove('hidden');
    return;
  }

  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const alertEl = document.getElementById('reset-alert');
    const btn = document.getElementById('reset-btn');

    alertEl.classList.add('hidden');

    if (newPassword.length < 6) {
      alertEl.textContent = 'Password must be at least 6 characters.';
      alertEl.classList.remove('hidden');
      return;
    }

    if (newPassword !== confirmPassword) {
      alertEl.textContent = 'Passwords do not match.';
      alertEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Resetting...';
    if (!btn.querySelector('.spinner')) {
      btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
    }

    try {
      const data = await api.put(`/auth/reset-password/${token}`, { newPassword });

      // Store session — user is logged in after reset
      if (data.token && data.user) {
        auth.setSession(data.token, data.user);
      }

      formSection.classList.add('hidden');
      successEl.classList.remove('hidden');
      showToast('Password reset successfully!', 'success');

      setTimeout(() => {
        window.location.href = data.user?.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
      }, 1800);
    } catch (err) {
      // Token expired or invalid
      if (err.message.toLowerCase().includes('invalid') || err.message.toLowerCase().includes('expired')) {
        formSection.classList.add('hidden');
        expiredEl.classList.remove('hidden');
      } else {
        alertEl.textContent = err.message;
        alertEl.classList.remove('hidden');
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'Reset Password';
        btn.querySelector('.spinner')?.remove();
      }
    }
  });
});
