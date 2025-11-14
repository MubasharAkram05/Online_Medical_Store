import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import './AdminOrdersPage.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [ordersRes, overviewRes] = await Promise.all([
          adminService.getOrders(),
          adminService.getOverview()
        ]);
        setOrders(ordersRes.data?.orders || []);
        setOverview(overviewRes.data || null);
      } catch (error) {
        toast.error('Unable to load order management data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      await adminService.updateOrderStatus(orderId, status);
      toast.success('Order status updated.');
      const response = await adminService.getOrders();
      setOrders(response.data?.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(
    () => orders.filter((order) => (statusFilter ? order.status === statusFilter : true)),
    [orders, statusFilter]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === 'pending'),
    [orders]
  );

  const lowStockProducts = overview?.alerts?.lowStock || [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2 }).format(
      value || 0
    );

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="admin-loading">Loading order management...</div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="orders-header">
        <div>
          <h1>Order Management</h1>
          <p>Monitor customer carts, orders, and stock levels in real-time.</p>
        </div>
        <div className="orders-header__filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>

      <section className="orders-section">
        <h2>Active Carts</h2>
        {pendingOrders.length === 0 ? (
          <div className="empty-card">No active carts at the moment.</div>
        ) : (
          pendingOrders.slice(0, 3).map((order) => (
            <div className="cart-card" key={order.id}>
              <header>
                <div>
                  <h3>User: {order.customer?.name || 'Unknown'}</h3>
                  <p>{order.customer?.email || '—'}</p>
                </div>
                <span className="cart-total">{formatCurrency(order.totalAmount)}</span>
              </header>
              <div className="cart-meta">
                <span>
                  Items: <strong>{order.items?.length || 0}</strong>
                </span>
                <span>
                  Updated:{' '}
                  <strong>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</strong>
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      <section className="orders-section">
        <h2>Low Stock Products</h2>
        {lowStockProducts.length === 0 ? (
          <div className="empty-card">No low stock alerts.</div>
        ) : (
          <div className="low-stock-grid">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div className="low-stock-card" key={product.id}>
                <h3>{product.name}</h3>
                <p>Category: {product.category || '—'}</p>
                <div className="low-stock-meta">
                  <span>Stock: {product.quantity}</span>
                  <span>
                    Expiry:{' '}
                    {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="orders-section">
        <div className="orders-section__header">
          <h2>Orders Management</h2>
          <Button variant="outline" onClick={() => setStatusFilter('')}>
            Clear filters
          </Button>
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-card">No orders match the selected filter.</div>
          ) : (
            filteredOrders.map((order) => (
              <div className="order-card" key={order.id}>
                <header>
                  <div>
                    <h3>Order #{order.orderNumber}</h3>
                    <p>Customer: {order.customer?.name || 'Unknown'}</p>
                    <p>Email: {order.customer?.email || '—'}</p>
                    <p>Placed on: {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="order-status">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className="status-badge">{order.status}</span>
                  </div>
                </header>
                <div className="order-body">
                  <div className="order-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items || []).map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <aside className="order-summary">
                    <div>
                      <span>Total Amount</span>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                    </div>
                    <div>
                      <span>Payment Method</span>
                      <strong>{order.paymentMethod?.toUpperCase() || '—'}</strong>
                    </div>
                    <div>
                      <span>Payment Status</span>
                      <strong className={`payment-${order.paymentStatus}`}>{order.paymentStatus}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{order.priority || 'normal'}</strong>
                    </div>
                    <div>
                      <span>Shipping Address</span>
                      <p>{order.shippingAddress || 'Not provided'}</p>
                    </div>
                    <div className="order-actions">
                      <Button variant="outline" size="small">
                        View Details
                      </Button>
                      <Button variant="secondary" size="small">
                        Edit Order
                      </Button>
                      <Button variant="danger" size="small">
                        Cancel Order
                      </Button>
                    </div>
                  </aside>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminOrdersPage;

