// src/api/client.js
import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'https://meditrack-01.onrender.com/api';

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