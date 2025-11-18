import api from '../utils/api';

export const prescriptionService = {
  upload: (formData) =>
    api.post('/prescriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  list: () => api.get('/prescriptions'),
  update: (id, notes) => api.patch(`/prescriptions/${id}`, { notes }),
  delete: (id) => api.delete(`/prescriptions/${id}`)
};

