document.addEventListener('DOMContentLoaded', () => {
  if (auth.isLoggedIn()) {
    window.location.href = auth.isAdmin() ? 'admin-dashboard.html' : 'dashboard.html';
    return;
  }

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('register-alert').classList.add('hidden');
    document.querySelectorAll('.form-error').forEach((el) => el.classList.remove('visible'));

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    let hasError = false;

    if (name.length < 2) {
      fieldError('name-error', 'Please enter your full name.');
      hasError = true;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      fieldError('email-error', 'Please enter a valid email address.');
      hasError = true;
    }
    if (password.length < 6) {
      fieldError('password-error', 'Password must be at least 6 characters.');
      hasError = true;
    }
    if (password !== confirmPassword) {
      fieldError('confirm-password-error', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('register-submit-btn');
    btn.disabled = true;
    btn.classList.add('is-loading');
    if (!btn.querySelector('.spinner')) btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');

    try {
      const data = await api.post('/auth/register', { name, email, password, phone });
      auth.setSession(data.token, data.user);
      showToast(`Welcome, ${data.user.name.split(' ')[0]}! Your account is ready.`, 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
    } catch (err) {
      const alertEl = document.getElementById('register-alert');
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });
});

function fieldError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
}
