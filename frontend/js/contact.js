document.addEventListener('DOMContentLoaded', () => {
  const user = auth.getUser();
  if (user) {
    document.getElementById('contactName').value = user.name || '';
    document.getElementById('contactEmail').value = user.email || '';
  }

  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !subject || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    // NOTE: This is a front-end-only confirmation. To make this live, add a
    // backend route (e.g. POST /api/contact) that sends an email via a
    // provider such as Resend, SendGrid, or Nodemailer + SMTP.
    const alertEl = document.getElementById('contact-alert');
    alertEl.textContent = `Thanks, ${name.split(' ')[0]}! Your message has been received. We'll respond to ${email} within 1 business day.`;
    alertEl.classList.remove('hidden');
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    document.getElementById('contact-form').reset();
    showToast('Message sent', 'success');
  });
});
