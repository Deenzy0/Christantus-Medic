/**
 * Global configuration for the Christantus Medical Consult frontend.
 * Change API_BASE_URL if your backend runs on a different host/port.
 */
const CONFIG = {
  API_BASE_URL: 'https://christantus-medic.onrender.com/api',
  UPLOADS_BASE_URL: 'https://christantus-medic.onrender.com',
  CURRENCY_SYMBOL: '₦',
  FREE_SHIPPING_THRESHOLD: 50000,
  SHIPPING_FEE: 1500,
  STORAGE_KEYS: {
    TOKEN: 'cmc_token',
    USER: 'cmc_user',
    CART: 'cmc_cart'
  }
};
