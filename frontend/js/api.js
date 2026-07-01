/**
 * Thin wrapper around fetch() that automatically attaches the JWT
 * and normalizes error handling across the whole frontend.
 */
const api = {
  async request(endpoint, { method = 'GET', body = null, isFormData = false } = {}) {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);

    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      headers,
      credentials: 'include'
    };

    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
    } catch (networkErr) {
      throw new Error('Could not reach the server. Make sure the backend is running on ' + CONFIG.API_BASE_URL);
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error('Unexpected server response.');
    }

    if (!response.ok) {
      // Auto logout on 401 (expired/invalid token)
      if (response.status === 401) {
        auth.clearSession();
      }
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  post(endpoint, body, isFormData = false) {
    return this.request(endpoint, { method: 'POST', body, isFormData });
  },
  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
