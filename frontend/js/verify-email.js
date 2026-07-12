document.addEventListener('DOMContentLoaded', async () => {
  const token = new URLSearchParams(window.location.search).get('token');

  const loadingEl = document.getElementById('verify-loading');
  const successEl = document.getElementById('verify-success');
  const errorEl = document.getElementById('verify-error');
  const errorMsgEl = document.getElementById('verify-error-msg');

  if (!token) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorMsgEl.textContent = 'No verification token found. Please use the link from your email.';
    return;
  }

  try {
    const data = await api.get(`/auth/verify-email/${token}`);

    // Store session from the response
    if (data.token && data.user) {
      auth.setSession(data.token, data.user);
    }

    loadingEl.classList.add('hidden');
    successEl.classList.remove('hidden');
    showToast('Email verified! Welcome aboard.', 'success');

    // Redirect to dashboard after a brief moment
    setTimeout(() => {
      window.location.href = data.user?.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    }, 1800);
  } catch (err) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorMsgEl.textContent = err.message || 'This verification link is invalid or has expired.';
  }

  // Resend button handler
  document.getElementById('resend-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('resend-email').value.trim();
    const alertEl = document.getElementById('resend-alert');

    if (!email) {
      alertEl.textContent = 'Please enter your email address.';
      alertEl.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('resend-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const data = await api.post('/auth/resend-verification', { email });
      alertEl.textContent = data.message;
      alertEl.classList.remove('hidden');
      alertEl.classList.add('success');
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Resend Verification Email';
    }
  });
});
