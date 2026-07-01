document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip straight to dashboard
  if (auth.isLoggedIn()) {
    window.location.href = auth.isAdmin() ? 'admin-dashboard.html' : 'dashboard.html';
    return;
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showAlert('login-alert', 'Please fill in both fields.', 'error');
      return;
    }

    const btn = document.getElementById('login-submit-btn');
    setLoading(btn, true);

    try {
      const data = await api.post('/auth/login', { email, password });
      auth.setSession(data.token, data.user);
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');

      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 400);
    } catch (err) {
      showAlert('login-alert', err.message, 'error');
      setLoading(btn, false);
    }
  });
});

function showAlert(id, message, type) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove('hidden');
  el.classList.toggle('success', type === 'success');
}

function clearErrors() {
  document.getElementById('login-alert')?.classList.add('hidden');
  document.querySelectorAll('.form-error').forEach((el) => el.classList.remove('visible'));
}

function setLoading(btn, isLoading) {
  btn.disabled = isLoading;
  btn.classList.toggle('is-loading', isLoading);
  if (isLoading && !btn.querySelector('.spinner')) {
    btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
  }
}
