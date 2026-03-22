import api from '../utils/api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  refreshToken: (data) => api.post('/auth/refresh', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  requestPasswordReset: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  getCurrentUser: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfilePic: (formData) => api.put('/auth/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProfilePic: () => api.delete('/auth/profile-picture')
};