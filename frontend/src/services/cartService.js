// pre-configured axios instance with base URL and auth headers
import api from '../utils/api';

/**
 * cartService — All cart related API calls in one place
 * Each function returns a Promise
 */
export const cartService = {

  // get current user's cart items
  getCart: () => api.get('/cart'),

  // add item to cart — item: { medicineId, quantity }
  addToCart: (item) => api.post('/cart', item),

  // update cart item quantity by item ID
  updateCartItem: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),

  // remove single item from cart by item ID
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),

  // clear all items from cart
  clearCart: () => api.delete('/cart')

};