import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector';
import CardPaymentForm from '../components/payment/CardPaymentForm';
import BankTransferForm from '../components/payment/BankTransferForm';
import WalletPaymentForm from '../components/payment/WalletPaymentForm';
import './PaymentPage.css';

const getActiveUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser);
    return parsed?.id || null;
  } catch {
    return null;
  }
};

const resolveShippingStorageKey = () => {
  const userId = getActiveUserId();
  return userId ? `shipping_user_${userId}` : 'shipping_guest';
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cartItems, orderPrescription, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: '',
    reference: '',
    receiptUrl: ''
  });
  const [shippingData, setShippingData] = useState(null);
  const [priority, setPriority] = useState('normal');

  const shippingStorageKey = resolveShippingStorageKey();

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/checkout', { replace: true });
      return;
    }
    try {
      const saved = window.localStorage.getItem(shippingStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fullName) {
          setShippingData(parsed);
          setPriority(parsed.priority || 'normal');
          return;
        }
      }
      toast.error('Please enter shipping information first.');
      navigate('/checkout', { replace: true });
    } catch {
      navigate('/checkout', { replace: true });
    }
  }, [cartItems.length, shippingStorageKey, navigate]);

  const subtotal = getCartTotal();
  const shipping = 200;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;
  const requiresPrescription = cartItems.some((item) => item.requires_prescription);

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
    setPaymentDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (requiresPrescription && !orderPrescription) {
      toast.error('A physical prescription is required for this order.');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!shippingData || !shippingData.fullName) {
      toast.error('Shipping information is missing. Please go back to checkout.');
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
      const orderData = {
        ...shippingData,
        payment_method: paymentMethod,
        priority,
        prescription_id: orderPrescription?.id,
        items: cartItems.map((item) => ({
          medicine_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: total,
        payment:
          paymentMethod === 'cod'
            ? undefined
            : {
                ...paymentDetails,
                transactionId:
                  paymentMethod === 'card' ? `CARD-MOCK-${Date.now()}` : paymentDetails.transactionId.trim()
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

  if (!shippingData) {
    return (
      <div className="payment-page">
        <div className="container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <h1 className="page-title">Payment</h1>
        <div className="payment-layout">
          <Card className="payment-section">
            <h2>Payment Method</h2>
            <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={handlePaymentMethodChange} />

            {paymentMethod === 'card' && (
              <CardPaymentForm details={paymentDetails} onChange={handlePaymentDetailChange} />
            )}
            {paymentMethod === 'bank' && (
              <BankTransferForm details={paymentDetails} onChange={handlePaymentDetailChange} />
            )}
            {paymentMethod === 'wallet' && (
              <WalletPaymentForm details={paymentDetails} onChange={handlePaymentDetailChange} />
            )}

            <Button
              type="button"
              variant="primary"
              size="large"
              className="confirm-order-button"
              disabled={loading || (requiresPrescription && !orderPrescription)}
              onClick={handleConfirmOrder}
            >
              {loading ? 'Placing Order...' : 'Confirm Order'}
            </Button>
          </Card>

          <Card className="payment-order-summary">
            <h2>Order Summary</h2>
            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item-row">
                  <img
                    src={item.image || 'https://placehold.co/56x56/20b2aa/ffffff?text=Product'}
                    alt={item.name}
                    className="order-item-thumb"
                  />
                  <div className="order-item-details">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="order-item-price">PKR {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
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
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Total:</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>
            <Button type="button" variant="outline" className="back-to-checkout-btn" onClick={() => navigate('/checkout')}>
              ← Back to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
