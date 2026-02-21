import api from '../utils/api';

export const medicineService = {
  getAll: (params) => api.get('/medicines', { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  search: (query) => api.get('/medicines', { params: { search: query } }),
  getByCategory: (category) => api.get('/medicines', { params: { category } }),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  checkInteractions: (medicineIds) => api.post('/medicines/interactions', { medicineIds }),
  getMedicinesByIds: (ids) => api.get('/medicines', { params: { ids: ids.join(',') } })
};

