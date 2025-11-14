export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  DOCTOR: 'doctor'
};

export const PRESCRIPTION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  BANK: 'bank',
  WALLET: 'wallet',
  COD: 'cod'
};

export const CATEGORIES = [
  { id: 1, name: 'Baby Care', description: 'Baby health and care products' },
  { id: 2, name: 'First Aid', description: 'First aid supplies and equipment' },
  { id: 3, name: 'Medical Devices', description: 'Medical equipment and devices' },
  { id: 4, name: 'Medicines', description: 'Prescription and over-the-counter medicines' },
  { id: 5, name: 'Personal Care', description: 'Personal hygiene and care products' },
  { id: 6, name: 'Vitamins & Supplements', description: 'Health supplements and vitamins' }
];

