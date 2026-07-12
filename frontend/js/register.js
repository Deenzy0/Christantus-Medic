document.addEventListener('DOMContentLoaded', () => {
  if (auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const alertEl = document.getElementById('register-alert');
    const successEl = document.getElementById('register-success');
    const btn = document.getElementById('register-btn');

    alertEl.classList.add('hidden');
    successEl?.classList.add('hidden');

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      alertEl.textContent = 'Please fill in all fields.';
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
    const btnText = btn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Creating account...';
    if (!btn.querySelector('.spinner')) {
      btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
    }

    try {
      const data = await api.post('/auth/register', { name, email, password });

      // Show success message with verification instructions
      if (successEl) {
        successEl.innerHTML = `
          <strong>Account created!</strong><br/>
          ${data.message}
        `;
        successEl.classList.remove('hidden');
      } else {
        showToast(data.message, 'success');
      }

      document.getElementById('register-form').reset();
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      if (btnText) btnText.textContent = 'Create Account';
      btn.querySelector('.spinner')?.remove();
    }
  });
});
