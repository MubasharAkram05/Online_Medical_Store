// pre-configured axios instance with base URL and auth headers
import api from '../utils/api';

/**
 * prescriptionService — All prescription related API calls in one place
 * Each function returns a Promise
 */
export const prescriptionService = {

  // upload prescription image — formData contains image file
  // multipart/form-data required for file upload
  upload: (formData) =>
    api.post('/prescriptions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // get all prescriptions — optionally filter by medicine ID
  // medicineId null → get all, medicineId provided → filter by medicine
  list: (medicineId = null) => {
    const params = medicineId ? { medicineId } : {};
    return api.get('/prescriptions', { params });
  },

  // update prescription notes by ID
  update: (id, notes) => api.patch(`/prescriptions/${id}`, { notes }),

  // delete prescription by ID
  delete: (id) => api.delete(`/prescriptions/${id}`)

};

