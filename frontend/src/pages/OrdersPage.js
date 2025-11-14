import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { orderService } from '../services/orderService';
import './OrdersPage.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadOrders = async () => {
      try {
        const response = await orderService.getOrders();
        setOrders(response.data?.orders || []);
      } catch (error) {
        toast.error('Unable to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [token, navigate]);

  const handleViewDetails = (id) => {
    navigate(`/orders/${id}`);
  };

  const handleDownloadInvoice = async (id, orderNumber) => {
    setDownloading(id);
    try {
      const response = await orderService.downloadInvoice(id);
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderNumber}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded.');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to download invoice.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading-state">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Order History</h1>
            <p>Track your purchases and download invoices.</p>
          </div>
          <div className="orders-badge">🧾</div>
        </div>

        {orders.length === 0 ? (
          <Card className="empty-orders-card">
            <h2>No orders yet</h2>
            <p>Browse our products and place your first order today.</p>
            <Button variant="primary" onClick={() => navigate('/medicines')}>
              Shop Medicines
            </Button>
          </Card>
        ) : (
          <Card className="orders-card">
            <div className="orders-table">
              <div className="orders-header">
                <div>Order</div>
                <div>Status</div>
                <div>Payment</div>
                <div>Total</div>
                <div>Date</div>
                <div>Actions</div>
              </div>
              {orders.map((order) => (
                <div className="orders-row" key={order.id}>
                  <div>
                    <div className="order-number">{order.orderNumber}</div>
                    <div className="order-prescription">
                      {order.prescriptionVerified ? 'Prescription Verified' : 'Awaiting Verification'}
                    </div>
                    <div className={`order-priority priority-${order.priority || 'normal'}`}>
                      Priority: {order.priority || 'normal'}
                    </div>
                  </div>
                  <div>
                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                  </div>
                  <div>
                    <span className={`status-badge payment-${order.paymentStatus}`}>
                      {order.paymentStatus}
                    </span>
                    <div className="payment-method">{order.paymentMethod.toUpperCase()}</div>
                  </div>
                  <div>PKR {order.totalAmount.toFixed(2)}</div>
                  <div>{new Date(order.createdAt).toLocaleString()}</div>
                  <div className="orders-actions">
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="primary"
                      onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                      disabled={downloading === order.id}
                    >
                      {downloading === order.id ? 'Downloading...' : 'Invoice'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

