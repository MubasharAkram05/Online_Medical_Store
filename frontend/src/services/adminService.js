import api from '../utils/api';

export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getMedicines: (params) => api.get('/admin/medicines', { params }),
  createMedicine: (data) => api.post('/admin/medicines', data),
  updateMedicine: (id, data) => api.put(`/admin/medicines/${id}`, data),
  deleteMedicine: (id) => api.delete(`/admin/medicines/${id}`),
  adjustMedicineStock: (id, data) => api.patch(`/admin/medicines/${id}/stock`, data),
  getOrders: () => api.get('/admin/orders'),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  getPrescriptions: (params) => api.get('/admin/prescriptions', { params }),
  updatePrescriptionStatus: (id, data) => api.patch(`/admin/prescriptions/${id}`, data),
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  getSuppliers: () => api.get('/admin/suppliers'),
  createSupplier: (data) => api.post('/admin/suppliers', data),
  updateSupplier: (id, data) => api.put(`/admin/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/admin/suppliers/${id}`)
};

