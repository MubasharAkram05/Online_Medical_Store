import api from '../utils/api';

export const prescriptionService = {
  upload: (formData) =>
    api.post('/prescriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  list: () => api.get('/prescriptions')
};

