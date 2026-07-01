/**
 * Manages the logged-in user's session in localStorage and
 * provides helpers used across every page (header rendering, route guards).
 */
const auth = {
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  },

  getUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return !!user && user.role === 'admin';
  },

  setSession(token, user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  },

  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      // ignore — clear local session regardless
    }
    this.clearSession();
    window.location.href = 'index.html';
  },

  // Redirect to login if not authenticated. Call at top of protected pages.
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
      return false;
    }
    return true;
  },

  // Redirect to home if not an admin. Call at top of admin pages.
  requireAdmin() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};
