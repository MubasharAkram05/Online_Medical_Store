import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { orderService } from '../services/orderService';
import './OrderDetailPage.css';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadOrder = async () => {
      try {
        const response = await orderService.getOrderById(id);
        setOrder(response.data?.order || null);
      } catch (error) {
        toast.error(error.response?.data?.error?.message || 'Unable to load order.');
        navigate('/orders', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, token, navigate]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const response = await orderService.downloadInvoice(order.id);
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded.');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to download invoice.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="loading-state">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Order {order.orderNumber}</h1>
            <p>Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="header-actions">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              ← Back to Orders
            </Button>
            <Button variant="primary" onClick={handleDownloadInvoice} disabled={downloading}>
              {downloading ? 'Downloading...' : 'Download Invoice'}
            </Button>
          </div>
        </div>

        <div className="order-detail-grid">
          <Card className="detail-card">
            <h2>Order Status</h2>
            <div className="status-section">
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
              <span className={`status-badge payment-${order.payment?.status || (order.paymentMethod === 'cod' ? 'pending' : 'completed')}`}>
                {order.payment?.status || (order.paymentMethod === 'cod' ? 'pending' : 'completed')}
              </span>
            </div>
            <div className="status-meta">
              <div>
                <span className="label">Payment Method</span>
                <span className="value">{order.paymentMethod.toUpperCase()}</span>
              </div>
              <div>
                <span className="label">Prescription</span>
                <span className="value">
                  {order.prescriptionVerified ? 'Verified' : 'Pending verification'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="detail-card">
            <h2>Shipping Details</h2>
            <div className="detail-grid">
              <div>
                <span className="label">Recipient</span>
                <span className="value">{order.fullName}</span>
              </div>
              <div>
                <span className="label">Email</span>
                <span className="value">{order.email}</span>
              </div>
              <div>
                <span className="label">Phone</span>
                <span className="value">{order.phone}</span>
              </div>
              <div className="full-width">
                <span className="label">Address</span>
                <span className="value">{order.address}, {order.city} {order.postalCode}</span>
              </div>
            </div>
          </Card>

          <Card className="detail-card">
            <h2>Order Summary</h2>
            <div className="priority-pill">
              Priority: <span className={`priority-${order.priority || 'normal'}`}>{order.priority || 'normal'}</span>
            </div>
            <div className="items-list">
              {order.items.map((item) => (
                <div className="item-row" key={item.id}>
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                    {item.requiresPrescription && (
                      <span className="item-tag">Requires Prescription</span>
                    )}
                  </div>
                  <div className="item-price">PKR {item.totalPrice.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="totals">
              <div>
                <span>Subtotal</span>
                <span>PKR {order.subtotalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span>Tax</span>
                <span>PKR {order.taxAmount.toFixed(2)}</span>
              </div>
              <div>
                <span>Shipping</span>
                <span>PKR {order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Total</span>
                <span>PKR {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {order.payment && (
            <Card className="detail-card">
              <h2>Payment Details</h2>
              <div className="detail-grid">
                <div>
                  <span className="label">Status</span>
                  <span className="value">{order.payment.status}</span>
                </div>
                <div>
                  <span className="label">Amount</span>
                  <span className="value">PKR {order.payment.amount.toFixed(2)}</span>
                </div>
                {order.payment.transactionId && (
                  <div>
                    <span className="label">Transaction ID</span>
                    <span className="value">{order.payment.transactionId}</span>
                  </div>
                )}
                {order.payment.reference && (
                  <div className="full-width">
                    <span className="label">Reference</span>
                    <span className="value">{order.payment.reference}</span>
                  </div>
                )}
                {order.payment.receiptUrl && (
                  <div className="full-width">
                    <span className="label">Receipt</span>
                    <a
                      href={order.payment.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="receipt-link"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

