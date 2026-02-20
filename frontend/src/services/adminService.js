import api from '../utils/api';

export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getMedicines: (params) => api.get('/admin/medicines', { params }),
  createMedicine: (data) => {
    // If data is FormData, send with proper headers
    if (data instanceof FormData) {
      return api.post('/admin/medicines', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/admin/medicines', data);
  },
  updateMedicine: (id, data) => {
    // If data is FormData, send with proper headers
    if (data instanceof FormData) {
      return api.put(`/admin/medicines/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.put(`/admin/medicines/${id}`, data);
  },
  deleteMedicine: (id) => api.delete(`/admin/medicines/${id}`),
  adjustMedicineStock: (id, data) => api.patch(`/admin/medicines/${id}/stock`, data),
  getOrders: () => api.get('/admin/orders'),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  updateOrderDetails: (id, data) => api.patch(`/admin/orders/${id}`, data),
  getPrescriptions: (params) => api.get('/admin/prescriptions', { params }),
  updatePrescriptionStatus: (id, data) => api.patch(`/admin/prescriptions/${id}`, data),
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  downloadReport: (type, format, params) => {
    return api.get(`/admin/reports/download/${type}/${format}`, {
      params,
      responseType: format === 'pdf' ? 'blob' : 'text'
    });
  },
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSuppliers: () => api.get('/admin/suppliers'),
  createSupplier: (data) => api.post('/admin/suppliers', data),
  updateSupplier: (id, data) => api.put(`/admin/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/admin/suppliers/${id}`)
};

