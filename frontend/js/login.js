document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (auth.isLoggedIn()) {
    window.location.href = auth.isAdmin() ? 'admin-dashboard.html' : 'dashboard.html';
    return;
  }

  // Pre-fill email if redirected from registration
  const params = new URLSearchParams(window.location.search);
  const prefillEmail = params.get('email');
  if (prefillEmail) {
    document.getElementById('email').value = prefillEmail;
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const alertEl = document.getElementById('login-alert');
    const btn = document.getElementById('login-btn');

    alertEl.classList.add('hidden');
    alertEl.classList.remove('warning');

    if (!email || !password) {
      alertEl.textContent = 'Please enter your email and password.';
      alertEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    const btnText = btn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Logging in...';
    if (!btn.querySelector('.spinner')) {
      btn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
    }

    try {
      auth.setSession(data.token, data.user);

// Show prominent success alert before redirecting
    const alertEl = document.getElementById('login-alert');
      alertEl.style.background = 'var(--color-green-light)';
    alertEl.style.color = 'var(--color-green-dark)';
    alertEl.style.border = '1px solid var(--color-green)';  
    alertEl.textContent = `✓ Login successful! Welcome back, ${data.user.name.split(' ')[0]}. Redirecting...`;
    alertEl.classList.remove('hidden');

showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');

const redirect = params.get('redirect');
      if (redirect && !redirect.includes('login') && !redirect.includes('register')) {
        window.location.href = redirect;
      } else if (data.user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      // Handle unverified email specifically
      if (err.message && err.message.includes('verify your email')) {
        alertEl.innerHTML = `
          ${err.message}
          <br/><br/>
          <a href="verify-email.html" style="color:var(--color-blue);font-weight:600;text-decoration:underline;">
            Resend verification email →
          </a>
        `;
        alertEl.classList.add('warning');
      } else {
        alertEl.textContent = err.message;
      }
      alertEl.classList.remove('hidden');
      btn.disabled = false;
      if (btnText) btnText.textContent = 'Log In';
      btn.querySelector('.spinner')?.remove();
    }
  });
});
