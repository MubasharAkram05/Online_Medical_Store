import api from '../utils/api';

export const orderService = {
  createOrder: (orderData) => api.post('/orders/checkout', orderData),
  getOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  uploadPaymentProof: (id, formData) => api.post(`/orders/${id}/payment-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' })
};

