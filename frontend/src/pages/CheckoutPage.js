import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { medicineService } from '../services/medicineService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PrescriptionModal from '../components/prescription/PrescriptionModal';
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector';
import CardPaymentForm from '../components/payment/CardPaymentForm';
import BankTransferForm from '../components/payment/BankTransferForm';
import WalletPaymentForm from '../components/payment/WalletPaymentForm';
import './CheckoutPage.css';

const DEFAULT_SHIPPING_VALUES = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: ''
};

const getActiveUserId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }
    const parsed = JSON.parse(rawUser);
    return parsed?.id || null;
  } catch (error) {
    return null;
  }
};

const resolveShippingStorageKey = () => {
  const userId = getActiveUserId();
  return userId ? `shipping_user_${userId}` : 'shipping_guest';
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, orderPrescription, getCartTotal, clearCart, removeUnavailableItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [priority, setPriority] = useState('normal');
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: '',
    reference: '',
    receiptUrl: ''
  });

  const [shippingStorageKey, setShippingStorageKey] = useState(() => {
    if (typeof window === 'undefined') {
      return 'shipping_guest';
    }
    return resolveShippingStorageKey();
  });
  const [shippingInitialized, setShippingInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: DEFAULT_SHIPPING_VALUES
  });

  const [interactionWarnings, setInteractionWarnings] = useState([]);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (cartItems.length < 2) {
        setInteractionWarnings([]);
        return;
      }

      try {
        const ids = cartItems.map((item) => item.id);
        const response = await medicineService.checkInteractions(ids);
        setInteractionWarnings(response.data?.warnings || []);
      } catch (error) {
        setInteractionWarnings([]);
        toast.error('Unable to check medicine interactions at the moment.');
      }
    };

    fetchInteractions();
  }, [cartItems]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateStorageKey = () => {
      const nextKey = resolveShippingStorageKey();
      setShippingStorageKey((prevKey) => (prevKey === nextKey ? prevKey : nextKey));
    };

    updateStorageKey();

    const handleFocus = () => updateStorageKey();
    const handleStorage = (event) => {
      if (event.key === 'user') {
        updateStorageKey();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !shippingStorageKey) {
      return;
    }

    setShippingInitialized(false);

    const baseValues = { ...DEFAULT_SHIPPING_VALUES };
    let initialValues = { ...baseValues };

    try {
      const saved = window.localStorage.getItem(shippingStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          initialValues = { ...initialValues, ...parsed };
        }
      } else {
        const rawUser = window.localStorage.getItem('user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          initialValues = {
            ...initialValues,
            fullName: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || ''
          };
        }
      }
    } catch (error) {
      console.error('Error loading shipping info from localStorage:', error);
    }

    reset(initialValues);
    setShippingInitialized(true);
  }, [shippingStorageKey, reset]);

  const watchedShipping = watch();

  useEffect(() => {
    if (!shippingInitialized || typeof window === 'undefined' || !shippingStorageKey) {
      return;
    }

    const handler = window.setTimeout(() => {
      try {
        window.localStorage.setItem(shippingStorageKey, JSON.stringify(watchedShipping));
      } catch (error) {
        console.error('Error saving shipping info to localStorage:', error);
      }
    }, 300);

    return () => window.clearTimeout(handler);
  }, [watchedShipping, shippingStorageKey, shippingInitialized]);

  const subtotal = getCartTotal();
  const shipping = 200;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    setPaymentDetails({
      transactionId: '',
      reference: '',
      receiptUrl: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardName: '',
      phone: ''
    });
  };

  const handlePaymentDetailChange = (key, value) => {
    setPaymentDetails(prev => ({ ...prev, [key]: value }));
  };

  const requiresPrescription = cartItems.some(item => item.requires_prescription);

  const onSubmit = async (data) => {
    if (requiresPrescription && !orderPrescription) {
      toast.error('A physical prescription is required for this order.');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardName) {
        toast.error('Please complete all card details.');
        return;
      }
      if (paymentDetails.cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Invalid card number.');
        return;
      }
    } else if (paymentMethod !== 'cod') {
      if (!paymentDetails.transactionId.trim()) {
        toast.error('Please provide the transaction ID for your payment.');
        return;
      }
      if (!paymentDetails.proofFile) {
        toast.error('Please upload a proof of payment screenshot.');
        return;
      }
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined' && shippingStorageKey) {
        try {
          window.localStorage.setItem(shippingStorageKey, JSON.stringify(data));
        } catch (error) {
          console.error('Error persisting shipping info to localStorage:', error);
        }
      }
      const orderData = {
        ...data,
        payment_method: paymentMethod,
        priority,
        prescription_id: orderPrescription?.id,
        items: cartItems.map((item) => ({
          medicine_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: total,
        payment: paymentMethod === 'cod'
          ? undefined
          : {
            ...paymentDetails,
            transactionId: paymentMethod === 'card'
              ? `CARD-MOCK-${Date.now()}`
              : paymentDetails.transactionId.trim()
          }
      };

      const response = await orderService.createOrder(orderData);

      if (paymentDetails.proofFile) {
        const formData = new FormData();
        formData.append('proof', paymentDetails.proofFile);
        await orderService.uploadPaymentProof(response.data.order.id, formData);
      }

      toast.success(response.data?.message || 'Order placed successfully!');
      clearCart();
      navigate(`/orders/${response.data.order.id}`);
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to place order.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <h2>Your cart is empty</h2>
            <Button variant="primary" onClick={() => navigate('/medicines')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="checkout-page">
        <div className="container">
          <h1 className="page-title">Checkout</h1>

          {interactionWarnings.length > 0 && (
            <Card className="checkout-warning-card">
              <div className="warning-header">
                <span className="warning-icon">⚠️</span>
                <div>
                  <h2>Potential Medicine Interactions Detected</h2>
                  <p>Please consult a medical professional before proceeding.</p>
                </div>
              </div>
              <ul className="warning-list">
                {interactionWarnings.map((warning, index) => (
                  <li key={index}>
                    <span className={`severity ${warning.severity}`}>{warning.severity}</span>
                    <span className="warning-text">
                      {warning.description ||
                        `${warning.medicines?.map((med) => med.name).join(' and ')} may interact.`}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="checkout-form">
            <div className="checkout-container">
              <div className="checkout-main">
                <Card className="checkout-section">
                  <h2>Shipping Information</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        id="fullName"
                        {...register('fullName', { required: 'Full name is required' })}
                        placeholder="Enter your full name"
                        className={errors.fullName ? 'error' : ''}
                      />
                      {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        id="email"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        placeholder="Enter your email"
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-message">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        id="phone"
                        type="tel"
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9]{10,15}$/,
                            message: 'Invalid phone number'
                          }
                        })}
                        placeholder="Enter your phone number"
                        className={errors.phone ? 'error' : ''}
                      />
                      {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="priority">Order Priority</label>
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="normal">Normal Delivery (2-4 days)</option>
                        <option value="high">High Priority (within 48 hours)</option>
                        <option value="urgent">Urgent / Critical</option>
                      </select>
                      <small className="field-hint">
                        Urgent orders are handled with highest priority for medical needs.
                      </small>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="address">Address *</label>
                      <input
                        id="address"
                        {...register('address', { required: 'Address is required' })}
                        placeholder="Enter your address"
                        className={errors.address ? 'error' : ''}
                      />
                      {errors.address && <span className="error-message">{errors.address.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        id="city"
                        {...register('city', { required: 'City is required' })}
                        placeholder="Enter your city"
                        className={errors.city ? 'error' : ''}
                      />
                      {errors.city && <span className="error-message">{errors.city.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="postalCode">Postal Code *</label>
                      <input
                        id="postalCode"
                        {...register('postalCode', { required: 'Postal code is required' })}
                        placeholder="Enter postal code"
                        className={errors.postalCode ? 'error' : ''}
                      />
                      {errors.postalCode && <span className="error-message">{errors.postalCode.message}</span>}
                    </div>
                  </div>
                </Card>

                <Card className="checkout-section">
                  <h2>Payment Method</h2>
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onSelect={handlePaymentMethodChange}
                  />

                  {paymentMethod === 'card' && (
                    <CardPaymentForm
                      details={paymentDetails}
                      onChange={handlePaymentDetailChange}
                    />
                  )}

                  {paymentMethod === 'bank' && (
                    <BankTransferForm
                      details={paymentDetails}
                      onChange={handlePaymentDetailChange}
                    />
                  )}

                  {paymentMethod === 'wallet' && (
                    <WalletPaymentForm
                      details={paymentDetails}
                      onChange={handlePaymentDetailChange}
                    />
                  )}
                </Card>
              </div>

              <div className="checkout-sidebar">
                <Card className="order-summary-card">
                  <h2>Order Summary</h2>

                  <div className="order-items">
                    {cartItems.map((item) => (
                      <div key={item.id} className="order-item-container">
                        <div className="order-item">
                          <div className="order-item-info">
                            <span className="order-item-name">{item.name} {item.requires_prescription && <span className="rx-label-small">Rx</span>}</span>
                            <span className="order-item-qty">Qty: {item.quantity}</span>
                          </div>
                          <span className="order-item-price">
                            PKR {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {requiresPrescription && (
                    <div className="order-rx-summary">
                      <div className="summary-divider"></div>
                      <div className="rx-summary-box">
                        <span className="label">Order Prescription:</span>
                        {orderPrescription ? (
                          <span className="value success">✅ {orderPrescription.fileName}</span>
                        ) : (
                          <span className="value error">❌ Missing!</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="summary-divider"></div>

                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>PKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>PKR {shipping.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax:</span>
                    <span>PKR {tax.toFixed(2)}</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>PKR {total.toFixed(2)}</span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    className="place-order-button"
                    disabled={loading || (requiresPrescription && !orderPrescription)}
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>

                  <button type="button" onClick={() => navigate('/cart')} className="back-to-cart">
                    ← Back to Cart
                  </button>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
