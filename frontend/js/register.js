document.addEventListener('DOMContentLoaded', () => {
  if (auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone')?.value.trim() || '';
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const alertEl = document.getElementById('register-alert');
    const btn = document.getElementById('register-btn');
    const btnText = btn.querySelector('.btn-text');

    alertEl.classList.add('hidden');
    alertEl.style.background = '';
    alertEl.style.color = '';
    alertEl.style.border = '';

    if (!name || !email || !password || !confirmPassword) {
      alertEl.textContent = 'Please fill in all required fields.';
      alertEl.classList.remove('hidden');
      return;
    }
    if (password.length < 6) {
      alertEl.textContent = 'Password must be at least 6 characters.';
      alertEl.classList.remove('hidden');
      return;
    }
    if (password !== confirmPassword) {
      alertEl.textContent = 'Passwords do not match.';
      alertEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    if (btnText) btnText.textContent = 'Creating account...';
    if (!btn.querySelector('.spinner')) {
      btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
    }

    try {
      const data = await api.post('/auth/register', { name, email, password, phone });

      alertEl.style.background = 'var(--color-green-light)';
      alertEl.style.color = 'var(--color-green-dark)';
      alertEl.style.border = '1px solid var(--color-green)';
      alertEl.innerHTML = `
        <strong>✓ Account created successfully!</strong><br/>
        ${data.message || 'Please check your email to verify your account before logging in.'}
      `;
      alertEl.classList.remove('hidden');

      showToast('Account created! Check your email.', 'success');
      document.getElementById('register-form').reset();

    } catch (err) {
      alertEl.style.background = '';
      alertEl.style.color = '';
      alertEl.style.border = '';
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      if (btnText) btnText.textContent = 'Create Account';
      btn.querySelector('.spinner')?.remove();
    }
  });
});