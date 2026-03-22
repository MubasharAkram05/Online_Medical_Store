// axios — HTTP request library
import axios from 'axios';
// base URL for all API requests — example: 'http://localhost:4000/api'
import { API_BASE_URL } from './constants';
// toast notifications for errors
import { toast } from 'react-toastify';

/**
 * api — pre-configured axios instance
 * All service files import this instead of plain axios
 * Automatically adds base URL and default headers to every request
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'  // default — overridden for file uploads
  }
});

// stores ongoing refresh token promise
// prevents multiple refresh calls at the same time
// if 3 requests fail with 401 — only 1 refresh call is made
let refreshPromise = null;

/**
 * clearAuthAndRedirect — clears all auth data and redirects to login
 * Called when refresh token fails or is invalid
 * Does not redirect if already on login page
 */
const clearAuthAndRedirect = () => {
  // remove all auth data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  const currentPath = window.location.pathname;
  // only redirect if not already on login page
  // prevents infinite redirect loop
  if (currentPath !== '/login' && currentPath !== '/admin/login') {
    window.location.href = '/login';
  }
};

/**
 * refreshAccessToken — gets a new access token using refresh token
 * Uses refreshPromise to prevent multiple simultaneous refresh calls
 * If refresh fails — throws error — caller handles redirect
 *
 * @returns {Promise<string>} — new access token
 */
const refreshAccessToken = async () => {
  // get refresh token from localStorage
  const refreshToken = localStorage.getItem('refreshToken');

  // no refresh token — cannot refresh — throw error
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // if refresh is already in progress — return same promise
  // prevents multiple /auth/refresh calls at the same time
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const { tokens, user } = response.data || {};

        // validate response — all fields must be present
        if (!tokens?.accessToken || !tokens?.refreshToken || !user) {
          throw new Error('Invalid refresh response');
        }

        // save new tokens and user data to localStorage
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // return new access token — used to retry failed request
        return tokens.accessToken;
      })
      .finally(() => {
        // clear promise when done — allow future refresh calls
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// ─────────────────────────────────────────
// REQUEST INTERCEPTOR
// Runs before every API request is sent
// ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // attach token to Authorization header
      // backend uses this to identify the logged in user
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // request setup failed — reject with error
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Runs after every API response is received
// Handles errors globally — no need to handle in every service file
// ─────────────────────────────────────────
api.interceptors.response.use(
  // success — return response as is
  (response) => response,

  // error — handle globally
  async (error) => {

    // no response — backend is not running or network issue
    if (!error.response) {
      toast.error('Unable to reach backend server. Is the backend running on port 4000?');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = (error.config?.url || '').toLowerCase();

    // check if failed request was an auth endpoint
    // we should NOT retry auth requests — prevents infinite loop
    const isAuthAttempt =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/auth/refresh');

    // handle 401 Unauthorized error
    // only retry if:
    // 1. status is 401
    // 2. not an auth endpoint
    // 3. not already retried (_retry flag)
    if (status === 401 && !isAuthAttempt && !error.config?._retry) {
      try {
        // mark request as retried — prevents infinite retry loop
        error.config._retry = true;

        // get new access token using refresh token
        const newAccessToken = await refreshAccessToken();

        // update request header with new token
        error.config.headers = {
          ...error.config.headers,
          Authorization: `Bearer ${newAccessToken}`
        };

        // retry the original failed request with new token
        return api(error.config);
      } catch (refreshError) {
        // refresh failed — clear auth data and go to login
        clearAuthAndRedirect();
      }
    }

    // all other errors — reject and let service/component handle
    return Promise.reject(error);
  }
);

export default api;
