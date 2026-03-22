// pre-configured axios instance with base URL and auth headers
import api from '../utils/api';

/**
 * medicineService — All medicine related API calls in one place
 * Each function returns a Promise
 */
export const medicineService = {

  // get all medicines — params for search/filter/pagination
  getAll: (params) => api.get('/medicines', { params }),

  // get single medicine by ID
  getById: (id) => api.get(`/medicines/${id}`),

  // search medicines by name or keyword
  search: (query) => api.get('/medicines', { params: { search: query } }),

  // get medicines filtered by category
  getByCategory: (category) => api.get('/medicines', { params: { category } }),

  // create new medicine — data: { name, price, stock, ... }
  create: (data) => api.post('/medicines', data),

  // update medicine by ID
  update: (id, data) => api.put(`/medicines/${id}`, data),

  // delete medicine by ID
  delete: (id) => api.delete(`/medicines/${id}`),

  // check drug interactions between multiple medicines
  // medicineIds: array of medicine IDs — [1, 2, 3]
  checkInteractions: (medicineIds) =>
    api.post('/medicines/interactions', { medicineIds }),

  // get multiple medicines by their IDs
  // ids joined as comma separated string — '1,2,3'
  getMedicinesByIds: (ids) =>
    api.get('/medicines', { params: { ids: ids.join(',') } })

};