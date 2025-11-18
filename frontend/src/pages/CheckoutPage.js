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
  const { cartItems, getCartTotal, clearCart, removeUnavailableItems } = useCart();
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
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medicinesRequiringPrescription, setMedicinesRequiringPrescription] = useState([]);

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

  useEffect(() => {
    const checkPrescriptionRequirements = async () => {
      if (!cartItems.length) return;

      try {
        const medicineIds = cartItems.map(item => item.id);
        const response = await medicineService.getMedicinesByIds(medicineIds);
        const medicines = response.data.medicines || [];
        
        const requiringPrescription = medicines.filter(medicine => 
          medicine.requires_prescription && 
          cartItems.some(item => item.id === medicine.id)
        );

        setMedicinesRequiringPrescription(requiringPrescription);
      } catch (error) {
        console.error('Error checking prescription requirements:', error);
      }
    };

    checkPrescriptionRequirements();
  }, [cartItems]);

  const subtotal = getCartTotal();
  const shipping = 200;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    if (value === 'cod') {
      setPaymentDetails({
        transactionId: '',
        reference: '',
        receiptUrl: ''
      });
    }
  };

  const onSubmit = async (data) => {
    if (medicinesRequiringPrescription.length > 0 && !selectedPrescription) {
      setShowPrescriptionModal(true);
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (paymentMethod !== 'cod' && !paymentDetails.transactionId.trim()) {
      toast.error('Please provide the payment transaction ID.');
      return;
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
        items: cartItems.map((item) => ({
          medicine_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: total,
        prescription_id: selectedPrescription?.id,
        payment: paymentMethod === 'cod'
          ? undefined
          : Object.fromEntries(
              Object.entries(paymentDetails)
                .map(([key, value]) => [key, value.trim()])
                .filter(([, value]) => value)
            )
      };

      const response = await orderService.createOrder(orderData);
      toast.success(response.data?.message || 'Order placed successfully!');

      if (response.data?.warnings?.length) {
        response.data.warnings.forEach((warning) => {
          toast.warning(
            warning.description ||
              `${warning.medicines?.map((med) => med.name).join(' and ')} may interact.`
          );
        });
      }

      clearCart();
      
      // Trigger prescription reload event for medicine detail pages
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
      }
      
      navigate(`/orders/${response.data.order.id}`);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        'Failed to place order. Please try again.';
      toast.error(message);

      const missingMedicineIds = error.response?.data?.error?.missingMedicineIds;
      if (Array.isArray(missingMedicineIds) && missingMedicineIds.length) {
        removeUnavailableItems(missingMedicineIds);
        toast.info('Removed unavailable items from your cart. Please review and try again.');
      }

      const details = error.response?.data?.error?.details;
      if (Array.isArray(details) && details.length) {
        details.forEach((warning) => {
          toast.error(
            warning.description ||
              `${warning.medicines?.map((med) => med.name).join(' and ')} may interact.`
          );
        });
      }
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
            <p>Add items to your cart before checkout.</p>
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
                  <div className="payment-methods">
                    <label className="payment-option">
                      <input
                        type="radio"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      />
                      <div className="payment-option-content">
                        <span className="payment-icon">💵</span>
                        <div>
                          <strong>Cash on Delivery</strong>
                          <p>Pay when you receive your order</p>
                        </div>
                      </div>
                    </label>

                    <label className="payment-option">
                      <input
                        type="radio"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      />
                      <div className="payment-option-content">
                        <span className="payment-icon">💳</span>
                        <div>
                          <strong>Credit/Debit Card</strong>
                          <p>Pay securely with your card</p>
                        </div>
                      </div>
                    </label>

                    <label className="payment-option">
                      <input
                        type="radio"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      />
                      <div className="payment-option-content">
                        <span className="payment-icon">🏦</span>
                        <div>
                          <strong>Bank Transfer</strong>
                          <p>Transfer directly to our bank account</p>
                        </div>
                      </div>
                    </label>

                    <label className="payment-option">
                      <input
                        type="radio"
                        value="wallet"
                        checked={paymentMethod === 'wallet'}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      />
                      <div className="payment-option-content">
                        <span className="payment-icon">📱</span>
                        <div>
                          <strong>Mobile Wallet</strong>
                          <p>Use your preferred mobile wallet</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {paymentMethod !== 'cod' && (
                    <div className="payment-extra">
                      <div className="form-group">
                        <label htmlFor="transactionId">Transaction ID *</label>
                        <input
                          id="transactionId"
                          value={paymentDetails.transactionId}
                          onChange={(e) =>
                            setPaymentDetails((prev) => ({
                              ...prev,
                              transactionId: e.target.value
                            }))
                          }
                          placeholder="Enter provider transaction/reference ID"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="paymentReference">Payment Reference</label>
                        <input
                          id="paymentReference"
                          value={paymentDetails.reference}
                          onChange={(e) =>
                            setPaymentDetails((prev) => ({
                              ...prev,
                              reference: e.target.value
                            }))
                          }
                          placeholder="Optional notes or reference number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="receiptUrl">Receipt URL</label>
                        <input
                          id="receiptUrl"
                          type="url"
                          value={paymentDetails.receiptUrl}
                          onChange={(e) =>
                            setPaymentDetails((prev) => ({
                              ...prev,
                              receiptUrl: e.target.value
                            }))
                          }
                          placeholder="Link to receipt screenshot"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <div className="checkout-sidebar">
                <Card className="order-summary-card">
                  <h2>Order Summary</h2>

                  <div className="order-items">
                    {cartItems.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="order-item-info">
                          <span className="order-item-name">{item.name}</span>
                          <span className="order-item-qty">Qty: {item.quantity}</span>
                        </div>
                        <span className="order-item-price">
                          PKR {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

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

                  {selectedPrescription && (
                    <div className="selected-prescription-info">
                      <span className="prescription-label">Prescription:</span>
                      <span className="prescription-name">{selectedPrescription.fileName}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    className="place-order-button"
                    disabled={loading}
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => navigate('/cart')}
                    className="back-to-cart"
                  >
                    ← Back to Cart
                  </button>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>

      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onPrescriptionSelect={setSelectedPrescription}
        medicinesRequiringPrescription={medicinesRequiringPrescription}
      />
    </>
  );
};

export default CheckoutPage;
