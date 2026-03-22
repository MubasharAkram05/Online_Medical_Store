import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { medicineService } from '../services/medicineService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PrescriptionModal from '../components/prescription/PrescriptionModal';
import ShippingInformationModal from '../components/checkout/ShippingInformationModal';
import { useDialog } from '../context/DialogContext';
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
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [priority, setPriority] = useState('normal');
  const { alert } = useDialog();

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
          if (parsed.priority) setPriority(parsed.priority);
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
        window.localStorage.setItem(
          shippingStorageKey,
          JSON.stringify({ ...watchedShipping, priority })
        );
      } catch (error) {
        console.error('Error saving shipping info to localStorage:', error);
      }
    }, 300);

    return () => window.clearTimeout(handler);
  }, [watchedShipping, priority, shippingStorageKey, shippingInitialized]);

  const subtotal = getCartTotal();
  const shipping = 200;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;
  const requiresPrescription = cartItems.some(item => item.requires_prescription);

  const handleShippingModalSave = () => {
    // Form validation is handled by react-hook-form
    setShowShippingModal(false);
    toast.success('Shipping information saved');
  };

  const validateShippingInfo = () => {
    const shipping = watchedShipping;
    const missingFields = [];

    if (!shipping.fullName || shipping.fullName.trim() === '') {
      missingFields.push('Full Name');
    }
    if (!shipping.email || shipping.email.trim() === '') {
      missingFields.push('Email');
    }
    if (!shipping.phone || shipping.phone.trim() === '') {
      missingFields.push('Phone Number');
    }
    if (!shipping.address || shipping.address.trim() === '') {
      missingFields.push('Address');
    }
    if (!shipping.city || shipping.city.trim() === '') {
      missingFields.push('City');
    }
    if (!shipping.postalCode || shipping.postalCode.trim() === '') {
      missingFields.push('Postal Code');
    }

    return missingFields;
  };

  const handleProcessToPay = async () => {
    const missingFields = validateShippingInfo();

    if (missingFields.length > 0) {
      await alert({
        title: 'Shipping Information Incomplete',
        message: `Please fill in the following required fields:\n\n${missingFields.join('\n')}`,
        confirmText: 'OK'
      });
      setShowShippingModal(true);
      return;
    }

    // All validation passed, proceed to payment
    navigate('/checkout/payment');
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

          <div className="checkout-form">
            <div className="checkout-container">
              <div className="checkout-main">
                <div className="checkout-actions-section">
                  <Button
                    type="button"
                    variant="primary"
                    size="large"
                    onClick={() => setShowShippingModal(true)}
                    className="shipping-info-button"
                  >
                    📦 Shipping Information
                  </Button>

                  <Card className="order-summary-card-main">
                    <h2>Order Summary</h2>

                    <div className="order-items">
                      {cartItems.map((item) => (
                        <div key={item.id} className="order-item-container">
                          <div className="order-item">
                            <div className="order-item-image-wrap">
                              <img
                                src={item.image || 'https://placehold.co/80x80/20b2aa/ffffff?text=Product'}
                                alt={item.name}
                                className="order-item-image"
                              />
                            </div>
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
                  </Card>

                  <Button
                    type="button"
                    variant="primary"
                    size="large"
                    onClick={handleProcessToPay}
                    className="process-to-pay-button"
                  >
                    Process to Pay
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <ShippingInformationModal
            isOpen={showShippingModal}
            onClose={() => setShowShippingModal(false)}
            register={register}
            errors={errors}
            watch={watch}
            priority={priority}
            onPriorityChange={setPriority}
            onSave={handleShippingModalSave}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
      <button type="button" onClick={() => navigate('/cart')} className="back-to-cart-fixed">
        ← Back to Cart
      </button>
    </>
  );
};

export default CheckoutPage;
