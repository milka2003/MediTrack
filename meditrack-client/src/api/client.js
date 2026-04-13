// src/api/client.js
import axios from 'axios';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);
const defaultUrl = isLocalhost ? 'http://localhost:5000/api' : 'https://meditrack-02.onrender.com/api';

export const API_URL = process.env.REACT_APP_API_URL || defaultUrl;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      // Forbidden → optional UX: show message or redirect
      console.warn('Forbidden');
    }
    return Promise.reject(err);
  }
);

export default api;