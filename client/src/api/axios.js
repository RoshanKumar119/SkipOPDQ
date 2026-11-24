import axios from 'axios';

/**
 * Shared axios instance. Vite proxies /api to the Express server in development.
 * The JWT stored at login is attached to every request.
 */
const api = axios.create({ baseURL: '/api' });

export const TOKEN_KEY = 'skipopdq_token';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Extract a human-friendly message from an axios error. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the SkipOPDQ server. Is the backend running?';
  return fallback;
}

export default api;
