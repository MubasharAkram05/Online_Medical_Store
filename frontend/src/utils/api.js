import axios from 'axios';
import { API_BASE_URL } from './constants';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network/connection errors - e.g. backend not running - have no `response`.
    if (!error.response) {
      toast.error('Unable to reach backend server. Is the backend running on port 4000?');
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const requestUrl = (error.config?.url || '').toLowerCase();
      const isAuthAttempt =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password');

      if (!isAuthAttempt) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

