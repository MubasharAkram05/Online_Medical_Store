import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import './AdminOrdersPage.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'completed', 'failed', 'refunded'];
const PRIORITY_OPTIONS = ['normal', 'high', 'urgent'];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [editForm, setEditForm] = useState(null);
  const [userPrescriptions, setUserPrescriptions] = useState([]);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const loadOrders = useCallback(async () => {
    const response = await adminService.getOrders();
    const ordersData = response.data?.orders || [];
    // Debug: Check if requiresPrescription is present
    if (ordersData.length > 0 && ordersData[0].items) {
      console.log('Sample order item:', ordersData[0].items[0]);
    }
    setOrders(ordersData);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const overviewRes = await adminService.getOverview();
        setOverview(overviewRes.data || null);
        await loadOrders();
      } catch (error) {
        toast.error('Unable to load order management data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      await adminService.updateOrderStatus(orderId, status);
      toast.success('Order status updated.');
      await loadOrders();
      
      // Trigger prescription reload event if order is completed/delivered
      if (status === 'completed' || status === 'delivered') {
        console.log('Order completed/delivered, triggering prescriptionUpdated event');
        if (typeof window !== 'undefined') {
          // Multiple events to ensure update
          setTimeout(() => {
            console.log('Dispatching prescriptionUpdated event (1s)');
            window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
          }, 1000);
          setTimeout(() => {
            console.log('Dispatching prescriptionUpdated event (3s)');
            window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
          }, 3000);
          setTimeout(() => {
            console.log('Dispatching prescriptionUpdated event (5s)');
            window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
          }, 5000);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const loadUserPrescriptions = async (userId) => {
    if (!userId) return;
    setLoadingPrescriptions(true);
    try {
      const response = await adminService.getPrescriptions({});
      console.log('All prescriptions from API:', response.data?.prescriptions);
      // Filter prescriptions for this specific user
      const userPrescs = (response.data?.prescriptions || []).filter(
        p => p.userId === userId && p.status !== 'expired'
      );
      console.log('Filtered user prescriptions:', userPrescs);
      console.log('Latest prescription status:', userPrescs[0]?.status);
      setUserPrescriptions(userPrescs);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      toast.error('Unable to load prescriptions.');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const openOrderModal = (order, mode = 'view') => {
    setSelectedOrder(order);
    setModalMode(mode);
    
    // Load user prescriptions when modal opens
    if (order.customer?.id) {
      loadUserPrescriptions(order.customer.id);
    }
    
    if (mode === 'edit') {
      setEditForm({
        paymentStatus: order.paymentStatus || 'pending',
        priority: order.priority || 'normal',
        shippingAddress: order.shippingAddress || '',
        shippingCity: order.shippingCity || '',
        shippingPostalCode: order.shippingPostalCode || '',
        items: (order.items || []).map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          requiresPrescription: item.requiresPrescription
        }))
      });
    } else {
      setEditForm(null);
    }
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setModalMode('view');
    setEditForm(null);
    setUserPrescriptions([]);
    setViewingPrescription(null);
  };

  const handleViewPrescription = (prescription) => {
    setViewingPrescription(prescription);
  };

  const handleApprovePrescription = async (prescriptionId) => {
    try {
      setLoadingPrescriptions(true);
      await adminService.updatePrescriptionStatus(prescriptionId, {
        status: 'verified'
      });
      toast.success('Prescription approved successfully.');
      
      // Reload prescriptions in modal - with delay to ensure backend has updated
      if (selectedOrder?.customer?.id) {
        // Immediate reload
        await loadUserPrescriptions(selectedOrder.customer.id);
        // Reload again after delay to ensure backend has updated
        setTimeout(async () => {
          await loadUserPrescriptions(selectedOrder.customer.id);
        }, 500);
        setTimeout(async () => {
          await loadUserPrescriptions(selectedOrder.customer.id);
        }, 1500);
      }
      
      // Trigger event to update prescription status everywhere
      if (typeof window !== 'undefined') {
        console.log('Prescription approved, triggering prescriptionUpdated event');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
        }, 500);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to approve prescription.');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleCancelOrder = (order) => {
    if (!order) return;
    if (order.status === 'cancelled') {
      toast.info('Order is already cancelled.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to cancel Order #${order.orderNumber}?`);
    if (confirmed) {
      handleStatusChange(order.id, 'cancelled');
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemQuantityChange = (itemId, value) => {
    const numericValue = Number(value);
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity: Number.isNaN(numericValue) ? '' : numericValue } : item
      )
    }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!selectedOrder || !editForm) return;

    if (editForm.items.some((item) => !item.quantity || Number(item.quantity) < 1)) {
      toast.error('Quantity must be at least 1 for all items.');
      return;
    }

    try {
      setUpdatingId(selectedOrder.id);
      await adminService.updateOrderDetails(selectedOrder.id, {
        paymentStatus: editForm.paymentStatus,
        priority: editForm.priority,
        shippingAddress: editForm.shippingAddress,
        city: editForm.shippingCity,
        postalCode: editForm.shippingPostalCode,
        items: editForm.items.map((item) => ({
          id: item.id,
          quantity: Number(item.quantity)
        }))
      });
      toast.success('Order updated successfully.');
      await loadOrders();
      closeOrderModal();
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


  const derivedTotals = useMemo(() => {
    if (!selectedOrder) {
      return { subtotal: 0, tax: 0, shipping: 0, total: 0 };
    }

    const shipping = selectedOrder.shippingFee || 0;

    if (modalMode === 'edit' && editForm?.items) {
      const subtotal = editForm.items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + price * quantity;
      }, 0);

      const baselineSubtotal = selectedOrder.subtotalAmount || 0;
      const baselineTax = selectedOrder.taxAmount || 0;
      const taxRate = baselineSubtotal > 0 ? baselineTax / baselineSubtotal : 0;
      const tax = taxRate ? subtotal * taxRate : baselineTax;
      const total = subtotal + tax + shipping;

      return { subtotal, tax, shipping, total };
    }

    return {
      subtotal: selectedOrder.subtotalAmount || 0,
      tax: selectedOrder.taxAmount || 0,
      shipping,
      total:
        selectedOrder.totalAmount ||
        (selectedOrder.subtotalAmount || 0) + (selectedOrder.taxAmount || 0) + shipping
    };
  }, [selectedOrder, modalMode, editForm]);

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
          <Button variant="outline" onClick={loadOrders}>
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
                  {(order.items || []).map((item) => {
                    const needsPrescription = 
                      item.requiresPrescription === true || 
                      item.requiresPrescription === 1 || 
                      item.requires_prescription === true || 
                      item.requires_prescription === 1 ||
                      item.requiresPrescription === 'true' ||
                      item.requires_prescription === 'true';
                    
                    return (
                    <tr key={item.id}>
                        <td>
                          {item.name}
                          {needsPrescription && (
                            <span className="prescription-badge">Prescription Required</span>
                          )}
                        </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
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
                    <p>User: {order.customer?.name || 'Unknown'}</p>
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
                        {(order.items || []).map((item) => {
                          // Debug: Log item data
                          if (item.name && (item.requiresPrescription || item.requires_prescription)) {
                            console.log('Item with prescription:', item.name, item);
                          }
                          
                          const needsPrescription = 
                            item.requiresPrescription === true || 
                            item.requiresPrescription === 1 || 
                            item.requires_prescription === true || 
                            item.requires_prescription === 1 ||
                            item.requiresPrescription === 'true' ||
                            item.requires_prescription === 'true';
                          
                          return (
                          <tr key={item.id}>
                              <td>
                                {item.name}
                                {needsPrescription && (
                                  <span className="prescription-badge">Prescription Required</span>
                                )}
                              </td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(item.totalPrice)}</td>
                          </tr>
                          );
                        })}
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
                      {order.shippingCity && (
                        <small>
                          {order.shippingCity}, {order.shippingPostalCode}
                        </small>
                      )}
                    </div>
                    <div className="order-actions">
                      <Button variant="outline" size="small" onClick={() => openOrderModal(order, 'view')}>
                        View Details
                      </Button>
                      <Button variant="secondary" size="small" onClick={() => openOrderModal(order, 'edit')}>
                        Edit Order
                      </Button>
                      <Button variant="danger" size="small" onClick={() => handleCancelOrder(order)}>
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

      {selectedOrder && (
        <div className="order-modal">
          <div className="order-modal__backdrop" onClick={closeOrderModal} />
          <div className="order-modal__card">
            <header className="order-modal__header">
              <div>
                <h3>
                  Order #{selectedOrder.orderNumber}{' '}
                  <span className={`status-pill status-${selectedOrder.status}`}>{selectedOrder.status}</span>
                </h3>
                <p>Placed on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'}</p>
              </div>
              <button type="button" className="order-modal__close" onClick={closeOrderModal}>
                ✕
              </button>
            </header>

            <div className="order-modal__body">
              <div className="order-modal__section">
                <h4>Order details</h4>
                <div className="user-details-row">
                  <div className="user-detail">
                    <span className="user-detail__label">Name</span>
                    <strong>{selectedOrder.recipient?.name || selectedOrder.customer?.name || '—'}</strong>
                  </div>
                  <div className="user-detail">
                    <span className="user-detail__label">Email</span>
                    <strong>{selectedOrder.recipient?.email || selectedOrder.customer?.email || '—'}</strong>
                  </div>
                  <div className="user-detail">
                    <span className="user-detail__label">Number</span>
                    <strong>{selectedOrder.recipient?.phone || selectedOrder.customer?.phone || '—'}</strong>
                  </div>
                </div>
              </div>
              <div className="order-modal__section">
                <h4>Shipping</h4>
                {modalMode === 'edit' && editForm ? (
                  <>
                    <label>
                      Address
                      <textarea
                        value={editForm.shippingAddress}
                        onChange={(e) => handleEditFieldChange('shippingAddress', e.target.value)}
                        placeholder="Full address"
                      />
                    </label>
                    <div className="order-modal__grid">
                      <label>
                        City
                        <input
                          type="text"
                          value={editForm.shippingCity}
                          onChange={(e) => handleEditFieldChange('shippingCity', e.target.value)}
                          placeholder="City"
                        />
                      </label>
                      <label>
                        Postal Code
                        <input
                          type="text"
                          value={editForm.shippingPostalCode}
                          onChange={(e) => handleEditFieldChange('shippingPostalCode', e.target.value)}
                          placeholder="Postal Code"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{selectedOrder.shippingAddress || 'No address provided.'}</p>
                    {selectedOrder.shippingCity && (
                      <p>
                        {selectedOrder.shippingCity}, {selectedOrder.shippingPostalCode}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="order-modal__section">
                <h4>Items</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(modalMode === 'edit' && editForm ? editForm.items : selectedOrder.items || []).map((item) => {
                      const quantity = Number(item.quantity) || 0;
                      const totalAmount =
                        modalMode === 'edit' && editForm ? item.unitPrice * quantity : item.totalPrice;
                      const needsPrescription = 
                        item.requiresPrescription === true || 
                        item.requiresPrescription === 1 || 
                        item.requires_prescription === true || 
                        item.requires_prescription === 1 ||
                        item.requiresPrescription === 'true' ||
                        item.requires_prescription === 'true';
                      
                      const latestPrescription = userPrescriptions.length > 0 ? userPrescriptions[0] : null;
                      
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="product-name-cell">
                              <div>
                                {item.name}
                                {needsPrescription && (
                                  <span className={`prescription-badge ${latestPrescription?.status === 'verified' ? 'prescription-approved' : ''}`}>
                                    {latestPrescription?.status === 'verified' ? '✓ Prescription Approved' : 'Prescription Required'}
                                  </span>
                                )}
                              </div>
                              {needsPrescription && latestPrescription && modalMode === 'view' && (
                                <div className="prescription-actions-row">
                                  <Button
                                    variant="outline"
                                    size="small"
                                    onClick={() => handleViewPrescription(latestPrescription)}
                                  >
                                    View Prescription
                                  </Button>
                                  {latestPrescription.status === 'pending' && (
                                    <Button
                                      variant="primary"
                                      size="small"
                                      onClick={() => handleApprovePrescription(latestPrescription.id)}
                                      disabled={loadingPrescriptions}
                                    >
                                      Approve
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {modalMode === 'edit' && editForm ? (
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                                className="item-qty-input"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td>{formatCurrency(totalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="order-modal__totals">
                  <div className="order-modal__totals-row">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(derivedTotals.subtotal)}</strong>
                  </div>
                  <div className="order-modal__totals-row">
                    <span>Tax</span>
                    <strong>{formatCurrency(derivedTotals.tax)}</strong>
                  </div>
                  <div className="order-modal__totals-row">
                    <span>Shipping</span>
                    <strong>{formatCurrency(derivedTotals.shipping)}</strong>
                  </div>
                  <div className="order-modal__totals-row total">
                    <span>Total</span>
                    <strong>{formatCurrency(derivedTotals.total)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {modalMode === 'edit' && editForm ? (
              <form className="order-modal__footer" onSubmit={handleEditSubmit}>
                <div className="order-modal__grid">
                  <label>
                    Payment Status
                    <select
                      value={editForm.paymentStatus}
                      onChange={(e) => handleEditFieldChange('paymentStatus', e.target.value)}
                    >
                      {PAYMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select
                      value={editForm.priority}
                      onChange={(e) => handleEditFieldChange('priority', e.target.value)}
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="order-modal__actions">
                  <Button type="button" variant="outline" onClick={closeOrderModal}>
                    Close
                  </Button>
                  <Button type="submit" variant="primary" disabled={updatingId === selectedOrder.id}>
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="order-modal__footer">
                <div className="order-modal__grid payment-summary">
                  <div>
                    <strong>Payment Status</strong>
                    <p>{selectedOrder.paymentStatus}</p>
                  </div>
                  <div className="payment-method-wrapper">
                    <strong>Payment Method</strong>
                    <span className="payment-method-pill">{selectedOrder.paymentMethod?.toUpperCase()}</span>
                  </div>
                  <div className="priority-block">
                    <strong>Priority</strong>
                    <span className={`priority-pill priority-${selectedOrder.priority}`}>
                      {selectedOrder.priority}
                    </span>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={closeOrderModal}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {viewingPrescription && (
        <div className="view-prescription-modal-overlay" onClick={() => setViewingPrescription(null)}>
          <div className="view-prescription-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="view-prescription-modal-header">
              <h3>Prescription Details</h3>
              <button className="modal-close-btn" onClick={() => setViewingPrescription(null)}>×</button>
            </div>
            <div className="view-prescription-modal-body">
              <div className="prescription-view-info">
                <div className="info-row">
                  <strong>File Name:</strong>
                  <span>{viewingPrescription.fileName}</span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`prescription-status-badge ${viewingPrescription.status}`}>
                    {viewingPrescription.status}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Uploaded:</strong>
                  <span>{new Date(viewingPrescription.uploadedAt).toLocaleString()}</span>
                </div>
                {viewingPrescription.notes && (
                  <div className="info-row">
                    <strong>Notes:</strong>
                    <span>{viewingPrescription.notes}</span>
                  </div>
                )}
              </div>
              <div className="prescription-preview">
                <div className="prescription-preview-content">
                  {viewingPrescription.fileMimeType?.startsWith('image/') ? (
                    <img
                      src={viewingPrescription.fileUrl}
                      alt="Prescription"
                      className="prescription-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <iframe
                      src={viewingPrescription.fileUrl}
                      title="Prescription Preview"
                      className="prescription-iframe"
                      onError={() => {
                        console.error('Failed to load prescription in iframe');
                      }}
                    />
                  )}
                  <div className="prescription-fallback" style={{ display: 'none' }}>
                    <p>Unable to display prescription in preview.</p>
                    <Button
                      variant="primary"
                      onClick={() => {
                        window.open(viewingPrescription.fileUrl, '_blank');
                      }}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
                <div className="preview-actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(viewingPrescription.fileUrl, '_blank');
                    }}
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
            <div className="view-prescription-modal-footer">
              <Button variant="outline" onClick={() => setViewingPrescription(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;

