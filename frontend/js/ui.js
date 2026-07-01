/**
 * Shared UI helpers: toasts, currency formatting, header/footer rendering,
 * and the mobile nav drawer. Included on every page.
 */

function formatNaira(amount) {
  return CONFIG.CURRENCY_SYMBOL + Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

const ICONS = {
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`
};

function renderHeader(activePage = '') {
  const placeholder = document.getElementById('site-header');
  if (!placeholder) return;

  const loggedIn = auth.isLoggedIn();
  const isAdmin = auth.isAdmin();
  const user = auth.getUser();

  const navItem = (href, label) =>
    `<a href="${href}" class="${activePage === href ? 'active' : ''}">${label}</a>`;

  placeholder.innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="brand">
        <span class="brand-mark">${ICONS.cross}</span>
        Christantus Medical
      </a>
      <nav class="nav-links">
        ${navItem('index.html', 'Home')}
        ${navItem('shop.html', 'Shop')}
        ${navItem('consultation.html', 'Consultation')}
        ${navItem('contact.html', 'Contact')}
        ${isAdmin ? navItem('admin-dashboard.html', 'Admin Panel') : ''}
      </nav>
      <div class="header-actions">
        <a href="cart.html" class="icon-btn" aria-label="View cart">
          ${ICONS.cart}
          <span class="cart-count" style="display:none">0</span>
        </a>
        <a href="${loggedIn ? 'dashboard.html' : 'login.html'}" class="icon-btn" aria-label="Account">
          ${ICONS.user}
        </a>
        ${loggedIn ? `<button class="btn btn-ghost btn-sm" id="logout-btn">Log out</button>` : `<a href="register.html" class="btn btn-primary btn-sm">Sign up</a>`}
        <button class="icon-btn mobile-menu-btn" id="mobile-menu-open" aria-label="Open menu">${ICONS.menu}</button>
      </div>
    </div>
    <div class="mobile-drawer-overlay" id="drawer-overlay"></div>
    <div class="mobile-drawer" id="mobile-drawer">
      <button class="icon-btn mobile-drawer-close" id="mobile-menu-close" aria-label="Close menu">${ICONS.close}</button>
      <nav>
        ${navItem('index.html', 'Home')}
        ${navItem('shop.html', 'Shop')}
        ${navItem('consultation.html', 'Consultation')}
        ${navItem('contact.html', 'Contact')}
        ${isAdmin ? navItem('admin-dashboard.html', 'Admin Panel') : ''}
      </nav>
      <div class="drawer-actions">
        ${loggedIn
          ? `<a href="dashboard.html" class="btn btn-outline btn-block">My Dashboard</a><button class="btn btn-ghost btn-block" id="logout-btn-mobile">Log out</button>`
          : `<a href="login.html" class="btn btn-outline btn-block">Log in</a><a href="register.html" class="btn btn-primary btn-block">Sign up</a>`
        }
      </div>
    </div>
  `;

  cart.updateCartBadge();

  document.getElementById('mobile-menu-open')?.addEventListener('click', () => {
    document.getElementById('mobile-drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
  });
  const closeDrawer = () => {
    document.getElementById('mobile-drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
  };
  document.getElementById('mobile-menu-close')?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
  document.getElementById('logout-btn')?.addEventListener('click', () => auth.logout());
  document.getElementById('logout-btn-mobile')?.addEventListener('click', () => auth.logout());
}

function renderFooter() {
  const placeholder = document.getElementById('site-footer');
  if (!placeholder) return;

  placeholder.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <span class="brand-mark">${ICONS.cross}</span>
            Christantus Medical Consult
          </div>
          <p style="max-width:320px;">Licensed pharmacy and consultation platform bringing trusted healthcare products and professional medical advice to your doorstep across Nigeria.</p>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a href="index.html">Home</a>
          <a href="shop.html">Shop</a>
          <a href="consultation.html">Book Consultation</a>
          <a href="contact.html">Contact Us</a>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <a href="login.html">Log In</a>
          <a href="register.html">Create Account</a>
          <a href="dashboard.html">My Orders</a>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <p>📍 14 Niger Bridge Road, Onitsha, Anambra, Nigeria</p>
          <p>📞 +234 803 123 4567</p>
          <p>✉️ care@christantusmedical.com</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Christantus Medical Consult. All rights reserved.</span>
        <span>Registered Pharmacy License No. PCN/2024/00417</span>
      </div>
    </div>
  `;
}

// Initialize header/footer/cart badge on every page load
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  renderHeader(page);
  renderFooter();
  initScrolledHeader();
  initScrollReveal();
});

/**
 * Adds/removes a `.scrolled` class on the header once the page has
 * scrolled past a small threshold — gives the glass navbar a touch
 * more opacity/shadow so it stays legible over busy content below it.
 * Purely additive: style.css already looks correct without this.
 */
function initScrolledHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 12) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Wires up the [data-reveal] scroll-reveal system from style.css.
 * Adds `.reveal-ready` to <html> only once the observer is live, so
 * the CSS fallback (`html:not(.reveal-ready) [data-reveal])` keeps
 * everything visible if this script fails for any reason — content
 * is never permanently hidden by a JS error.
 */
function initScrollReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (targets.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    // Very old browser — skip the animation, but make sure content
    // is still visible immediately (style.css fallback handles this
    // too, but we don't add 'reveal-ready' in that case at all).
    return;
  }

  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

