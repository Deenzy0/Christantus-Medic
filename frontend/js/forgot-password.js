document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (auth.isLoggedIn()) {
    window.location.href = auth.isAdmin() ? 'admin-dashboard.html' : 'dashboard.html';
    return;
  }

  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const alertEl = document.getElementById('forgot-alert');
    const successEl = document.getElementById('forgot-success');
    const btn = document.getElementById('forgot-btn');

    alertEl.classList.add('hidden');
    successEl.classList.add('hidden');

    if (!email) {
      alertEl.textContent = 'Please enter your email address.';
      alertEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Sending...';
    if (!btn.querySelector('.spinner')) {
      btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
    }

    try {
      const data = await api.post('/auth/forgot-password', { email });
      successEl.textContent = data.message;
      successEl.classList.remove('hidden');
      document.getElementById('forgot-form').reset();
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Send Reset Link';
      btn.querySelector('.spinner')?.remove();
    }
  });
});
