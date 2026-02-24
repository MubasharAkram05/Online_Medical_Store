import axios from 'axios';
import { API_BASE_URL } from './constants';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise = null;

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/admin/login') {
    window.location.href = '/login';
  }
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const { tokens, user } = response.data || {};
        if (!tokens?.accessToken || !tokens?.refreshToken || !user) {
          throw new Error('Invalid refresh response');
        }

        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return tokens.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

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
  async (error) => {
    // Network/connection errors - e.g. backend not running - have no `response`.
    if (!error.response) {
      toast.error('Unable to reach backend server. Is the backend running on port 4000?');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = (error.config?.url || '').toLowerCase();
    const isAuthAttempt =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/auth/refresh');

    if (status === 401 && !isAuthAttempt && !error.config?._retry) {
      try {
        error.config._retry = true;
        const newAccessToken = await refreshAccessToken();
        error.config.headers = {
          ...error.config.headers,
          Authorization: `Bearer ${newAccessToken}`
        };
        return api(error.config);
      } catch (refreshError) {
        clearAuthAndRedirect();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
