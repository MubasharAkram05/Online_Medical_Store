// api utility — pre-configured axios instance with base URL and auth headers
import api from '../utils/api';

/**
 * adminService — All admin related API calls in one place
 * Each function returns a Promise — use async/await or .then() to handle
 * Base URL is set in api utility — these are just the endpoint paths
 */
export const adminService = {

  // ─────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────

  // get admin dashboard overview data
  // returns: total sales, orders, users, medicines summary
  getOverview: () => api.get('/admin/overview'),


  // ─────────────────────────────────────────
  // MEDICINES / PRODUCTS
  // ─────────────────────────────────────────

  // get all medicines — optional params for filtering/pagination
  // params example: { page: 1, limit: 10, search: 'panadol' }
  getMedicines: (params) => api.get('/admin/medicines', { params }),

  // create new medicine
  // data can be FormData (with image file) or plain object (with image URL)
  createMedicine: (data) => {
    // FormData is used when image file is uploaded
    // must set Content-Type to multipart/form-data for file upload
    if (data instanceof FormData) {
      return api.post('/admin/medicines', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    // plain object — no file upload — default Content-Type (application/json)
    return api.post('/admin/medicines', data);
  },

  // update existing medicine by ID
  // data can be FormData (with image file) or plain object
  updateMedicine: (id, data) => {
    // FormData is used when image file is uploaded
    // must set Content-Type to multipart/form-data for file upload
    if (data instanceof FormData) {
      return api.put(`/admin/medicines/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    // plain object — no file upload — default Content-Type (application/json)
    return api.put(`/admin/medicines/${id}`, data);
  },

  // delete medicine by ID
  deleteMedicine: (id) => api.delete(`/admin/medicines/${id}`),

  // adjust medicine stock quantity by ID
  // data example: { quantity: 100, reason: 'restock' }
  adjustMedicineStock: (id, data) => api.patch(`/admin/medicines/${id}/stock`, data),


  // ─────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────

  // get all orders
  getOrders: () => api.get('/admin/orders'),

  // update order status by ID
  // status example: 'pending' | 'processing' | 'delivered' | 'cancelled'
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  // update order details by ID
  // data example: { address: '...', phone: '...' }
  updateOrderDetails: (id, data) => api.patch(`/admin/orders/${id}`, data),

  // approve payment for an order by ID
  approvePayment: (id) => api.patch(`/admin/orders/${id}/approve-payment`),
  rejectPayment: (id) => api.patch(`/admin/orders/${id}/reject-payment`),

  // verify prescription for a specific order item
  // data example: { verified: true, notes: '...' }
  verifyOrderItemPrescription: (orderItemId, data) =>
    api.patch(`/admin/orders/items/${orderItemId}/prescription`, data),

  // verify prescription for an entire order
  // data example: { verified: true, notes: '...' }
  verifyOrderPrescription: (orderId, data) =>
    api.patch(`/admin/orders/${orderId}/prescription/verify`, data),

  // clear/delete order data — bulk delete
  // params example: { before: '2024-01-01', status: 'cancelled' }
  clearOrderData: (params) => api.delete('/admin/orders/clear', { data: params }),


  // ─────────────────────────────────────────
  // PRESCRIPTIONS
  // ─────────────────────────────────────────

  // get all prescriptions — optional params for filtering
  // params example: { status: 'pending', page: 1 }
  getPrescriptions: (params) => api.get('/admin/prescriptions', { params }),

  // preview which prescriptions will be deleted before actual deletion
  // data example: { startDate: '2024-01-01', endDate: '2024-12-31' }
  previewDeletePrescriptionRange: (data) =>
    api.post('/admin/prescriptions/delete-range/preview', data),

  // delete prescriptions in a date range
  // data example: { startDate: '2024-01-01', endDate: '2024-12-31' }
  deletePrescriptionRange: (data) =>
    api.delete('/admin/prescriptions/delete-range', { data }),

  // update prescription status by ID
  // data example: { status: 'approved' | 'rejected', notes: '...' }
  updatePrescriptionStatus: (id, data) =>
    api.patch(`/admin/prescriptions/${id}`, data),


  // ─────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────

  // get sales report data — optional params for date range/filters
  // params example: { startDate: '2024-01-01', endDate: '2024-12-31' }
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),

  // download report as PDF or CSV
  // type example: 'sales' | 'orders' | 'medicines'
  // format example: 'pdf' | 'csv'
  // responseType 'blob' for PDF (binary file), 'text' for CSV
  downloadReport: (type, format, params) => {
    return api.get(`/admin/reports/download/${type}/${format}`, {
      params,
      // pdf needs blob — binary data
      // csv needs text — plain string
      responseType: format === 'pdf' ? 'blob' : 'text'
    });
  },


  // ─────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────

  // get all users
  getUsers: () => api.get('/admin/users'),

  // update user role by ID
  // data example: { role: 'admin' | 'patient' | 'doctor' | 'pharmacist' }
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),

  // delete user by ID
  deleteUser: (id) => api.delete(`/admin/users/${id}`),


  // ─────────────────────────────────────────
  // SUPPLIERS
  // ─────────────────────────────────────────

  // get all suppliers
  getSuppliers: () => api.get('/admin/suppliers'),

  // create new supplier
  // data example: { name: 'MedCo', contact: '...', address: '...' }
  createSupplier: (data) => api.post('/admin/suppliers', data),

  // update supplier by ID
  // data example: { name: 'MedCo Updated', contact: '...' }
  updateSupplier: (id, data) => api.put(`/admin/suppliers/${id}`, data),

  // delete supplier by ID
  deleteSupplier: (id) => api.delete(`/admin/suppliers/${id}`)

};