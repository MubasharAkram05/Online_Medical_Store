import api from '../utils/api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (payload) => api.put('/auth/change-password', payload),
  updateProfilePic: (formData) => api.patch('/auth/profile-pic', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProfilePic: () => api.delete('/auth/profile-pic')
};

