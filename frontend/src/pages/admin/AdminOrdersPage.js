import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { adminService } from '../../services/adminService';
import { useDialog } from '../../context/DialogContext';
import './AdminOrdersPage.css';

const STATUS_OPTIONS = ['pending', 'pending_prescription', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'completed', 'failed', 'refunded'];
const PRIORITY_OPTIONS = ['normal', 'high', 'urgent'];

const AdminOrdersPage = () => {
  const { confirm, prompt } = useDialog();
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
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [clearingRange, setClearingRange] = useState('custom');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isClearing, setIsClearing] = useState(false);

  const formatStatus = (status) => {
    if (!status) return '—';
    if (status === 'pending_prescription') return 'Pending Prescription Approval';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  // Helper function to determine prescription verification status
  const getPrescriptionStatus = (order) => {
    if (!order.items || order.items.length === 0) {
      return null;
    }

    // Check if order has any prescription-required items
    const hasPrescriptionRequired = order.items.some((item) => {
      return (
        item.requiresPrescription === true ||
        item.requiresPrescription === 1 ||
        item.requires_prescription === true ||
        item.requires_prescription === 1 ||
        item.requiresPrescription === 'true' ||
        item.requires_prescription === 'true'
      );
    });

    if (!hasPrescriptionRequired) {
      return null; // No prescription required
    }

    // Get all prescription-required items
    const prescriptionItems = order.items.filter((item) => {
      return (
        item.requiresPrescription === true ||
        item.requiresPrescription === 1 ||
        item.requires_prescription === true ||
        item.requires_prescription === 1 ||
        item.requiresPrescription === 'true' ||
        item.requires_prescription === 'true'
      );
    });

    if (prescriptionItems.length === 0) {
      return null;
    }

    // Check if any prescription is rejected
    const hasRejected = prescriptionItems.some(
      (item) => item.prescriptionStatus === 'declined' || item.prescriptionStatus === 'rejected'
    );
    if (hasRejected) {
      return { status: 'rejected', label: 'Prescription Rejected' };
    }

    // Check if all prescriptions are approved
    const allApproved = prescriptionItems.every(
      (item) => item.prescriptionStatus === 'approved' || item.prescriptionStatus === 'verified'
    );
    if (allApproved) {
      return { status: 'approved', label: 'Prescription Approved' };
    }

    // Otherwise, it's pending
    return { status: 'pending', label: 'Prescription Verification Pending' };
  };

  const loadOrders = useCallback(async () => {
    const response = await adminService.getOrders();
    const ordersData = response.data?.orders || [];
    setOrders(ordersData);
  }, []);

  const handleRefresh = async () => {
    try {
      setClearingRange('custom');
      setCustomRange({ start: '', end: '' });
      await loadOrders();
      toast.success('Orders refreshed and clear-data selector reset.');
    } catch (error) {
      toast.error('Unable to refresh orders. Please try again.');
    }
  };

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

  const handleUpdateOrder = async (id, data) => {
    setUpdatingId(id);
    try {
      await adminService.updateOrderDetails(id, data);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id ? { ...order, ...data } : order
        )
      );
      toast.success('Order updated successfully!');

      // Update selected order if it's open in modal
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprovePayment = async (orderId) => {
    const isConfirmed = await confirm({
      title: 'Confirmation',
      message: 'Are you sure you want to approve this payment? This will confirm the order automatically.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!isConfirmed) {
      return;
    }

    setUpdatingId(orderId);
    try {
      await adminService.approvePayment(orderId);
      toast.success('Payment approved and order confirmed!');

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, paymentStatus: 'completed', status: 'confirmed' }
            : order
        )
      );

      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          paymentStatus: 'completed',
          status: 'confirmed'
        }));
      }

      setViewingReceipt(null);
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to approve payment.');
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
        p => p.userId === userId
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
    setViewingReceipt(null);
  };

  const handleViewPrescription = (prescription) => {
    setViewingPrescription(prescription);
  };

  const handleOrderItemPrescriptionAction = async (orderItemId, status) => {
    let notes = '';
    if (status === 'declined') {
      notes = await prompt({
        title: 'Rejection Reason',
        message: 'Please enter the reason for rejection:',
        placeholder: 'Reason',
        confirmText: 'Submit',
        cancelText: 'Cancel',
        variant: 'warning'
      });
      if (notes === null) return; // Cancelled
    }

    try {
      setLoadingPrescriptions(true);
      await adminService.verifyOrderItemPrescription(orderItemId, { status, notes });
      toast.success(`Prescription ${status} successfully.`);

      // Refresh order data
      const response = await adminService.getOrders();
      setOrders(response.data.orders);
      if (selectedOrder) {
        const updatedOrder = response.data.orders.find(o => o.id === selectedOrder.id);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
      // Close the preview modal after action
      setViewingPrescription(null);
    } catch (error) {
      console.error('Error updating prescription status:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update prescription status.');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleOrderPrescriptionAction = async (orderId, status) => {
    let notes = '';
    if (status === 'declined') {
      notes = await prompt({
        title: 'Rejection Reason',
        message: 'Please enter the reason for rejection:',
        placeholder: 'Reason',
        confirmText: 'Submit',
        cancelText: 'Cancel',
        variant: 'warning'
      });
      if (notes === null) return; // Cancelled
    }

    try {
      setLoadingPrescriptions(true);
      await adminService.verifyOrderPrescription(orderId, { status, notes });
      toast.success(`Order prescription ${status} successfully.`);

      // Refresh order data
      const response = await adminService.getOrders();
      setOrders(response.data.orders);
      if (selectedOrder) {
        const updatedOrder = response.data.orders.find(o => o.id === selectedOrder.id);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
      // Close the preview modal after action
      setViewingPrescription(null);
    } catch (error) {
      console.error('Error updating order prescription status:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update order prescription status.');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleApprovePrescription = async (prescriptionId) => {
    try {
      setLoadingPrescriptions(true);
      await adminService.updatePrescriptionStatus(prescriptionId, {
        status: 'approved'
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

  const handleCancelOrder = async (order) => {
    if (!order) return;
    if (order.status === 'cancelled') {
      toast.info('Order is already cancelled.');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Confirmation',
      message: `Are you sure you want to cancel Order #${order.orderNumber}?`,
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      variant: 'danger'
    });
    if (isConfirmed) {
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
    () => orders.filter((order) => order.status === 'pending' || order.status === 'pending_prescription'),
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

  const handleClearData = async () => {
    let rangeText = '';
    let params = {};

    if (clearingRange === 'all') {
      rangeText = 'all data';
      params = { days: 'all' };
    } else if (clearingRange === 'custom') {
      if (!customRange.start || !customRange.end) {
        toast.warning('Please select both start and end dates.');
        return;
      }
      rangeText = `data from ${customRange.start} to ${customRange.end}`;
      params = { startDate: customRange.start, endDate: customRange.end };
    } else {
      rangeText = `${clearingRange} days of data`;
      params = { days: clearingRange };
    }

    const isConfirmed = await confirm({
      title: 'Confirmation',
      message: `Are you sure you want to delete ${rangeText}? This action cannot be undone.`,
      confirmText: 'Delete Data',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!isConfirmed) return;

    try {
      setIsClearing(true);
      const response = await adminService.clearOrderData(params);
      toast.success(response.data.message || 'Data cleared successfully.');
      await loadOrders();
    } catch (error) {
      console.error('Clear data error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to clear data.');
    } finally {
      setIsClearing(false);
    }
  };

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
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <div className="clear-data-panel">
            <span className="clear-data-panel__label">🗑️ Clear Data</span>
            <div className="clear-data-daterow">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                className="date-input"
              />
              <span className="date-separator">→</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                className="date-input"
              />
            </div>
            <button
              type="button"
              className="clear-data-confirm-btn"
              onClick={handleClearData}
              disabled={isClearing}
            >
              {isClearing ? (
                <><span className="clear-spinner" />Clearing…</>
              ) : (
                <>🗑️ Delete</>
              )}
            </button>
          </div>
        </div>
      </div>

      <section className="orders-section">
        <h2>Active Carts</h2>
        <div className="active-carts-scroll-area">
          {pendingOrders.length === 0 ? (
            <div className="empty-card">No active carts at the moment.</div>
          ) : (
            pendingOrders.map((order) => (
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
        </div>
      </section>

      <section className="orders-section">
        <div className="orders-section__header">
          <h2>Orders Management</h2>
          <div className="orders-section__actions">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setStatusFilter('')}>
              Clear filters
            </Button>
          </div>
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-card">No orders match the selected filter.</div>
          ) : (
            filteredOrders.map((order) => {
              const prescriptionStatus = getPrescriptionStatus(order);
              return (
              <div className="order-card" key={order.id}>
                <header>
                  <div>
                    <h3>Order #{order.orderNumber}</h3>
                    {prescriptionStatus && (
                      <span className={`prescription-status-badge prescription-${prescriptionStatus.status}`}>
                        {prescriptionStatus.label}
                      </span>
                    )}
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
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                    <span className="status-badge">{formatStatus(order.status)}</span>
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
            );
            })
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
                  <span className={`status-pill status-${selectedOrder.status}`}>{formatStatus(selectedOrder.status)}</span>
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
                {selectedOrder.items.some(item => item.prescriptionId) && (
                  <Card className="order-prescription-admin-card">
                    <div className="rx-admin-header">
                      <h5>📋 Order Prescription</h5>
                    </div>
                    {(() => {
                      const itemWithRx = selectedOrder.items.find(item => item.prescriptionId);
                      return (
                        <div className="rx-admin-body">
                          <div className="rx-file-display">
                            <span>{itemWithRx.prescriptionName}</span>
                            <span className={`pill status-${itemWithRx.prescriptionStatus || 'pending'}`}>
                              {itemWithRx.prescriptionStatus || 'pending'}
                            </span>
                          </div>
                          <div className="rx-admin-actions">
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => handleViewPrescription({
                                id: itemWithRx.prescriptionId,
                                filePath: itemWithRx.prescriptionPath,
                                fileName: itemWithRx.prescriptionName,
                                orderId: selectedOrder.id, // Linked to the whole order
                                status: itemWithRx.prescriptionStatus || 'pending',
                                uploadedAt: itemWithRx.prescriptionUploadedAt,
                                fileMimeType: itemWithRx.file_mime_type,
                                fileUrl: itemWithRx.prescriptionPath ? `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/uploads/prescriptions/${itemWithRx.prescriptionPath.split('/').pop()}` : null
                              })}
                            >
                              View & Verify
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>
                )}
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
                              </div>
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
                    <p className={`status-text-${selectedOrder.paymentStatus}`}>{formatStatus(selectedOrder.paymentStatus)}</p>
                  </div>
                  <div className="payment-method-wrapper">
                    <strong>Payment Method</strong>
                    <span className="payment-method-pill">{selectedOrder.paymentMethod?.toUpperCase()}</span>
                  </div>
                  <div className="verification-details">
                    {selectedOrder.payment?.transactionId && (
                      <p><strong>TX ID:</strong> {selectedOrder.payment.transactionId}</p>
                    )}
                    {selectedOrder.payment?.receiptUrl && (
                      <Button
                        variant="outline"
                        className="view-receipt-btn"
                        onClick={() => setViewingReceipt({
                          url: `${process.env.REACT_APP_API_URL || ''}${selectedOrder.payment.receiptUrl}`,
                          orderId: selectedOrder.id,
                          method: selectedOrder.paymentMethod
                        })}
                      >
                        📄 View Receipt
                      </Button>
                    )}
                  </div>
                  <div className="priority-block">
                    <strong>Priority</strong>
                    <span className={`priority-pill priority-${selectedOrder.priority}`}>
                      {selectedOrder.priority}
                    </span>
                  </div>
                </div>
                <div className="order-modal__actions">
                  {selectedOrder.paymentStatus === 'pending' && selectedOrder.paymentMethod !== 'cod' && (
                    <Button
                      type="button"
                      variant="primary"
                      className="verify-payment-btn"
                      onClick={() => handleApprovePayment(selectedOrder.id)}
                      disabled={updatingId === selectedOrder.id}
                    >
                      ✅ Approve Payment
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={closeOrderModal}>
                    Close
                  </Button>
                </div>
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
                <div className="info-grid">
                  <div className="info-row">
                    <strong>File Name:</strong>
                    <span>{viewingPrescription.fileName}</span>
                  </div>
                  <div className="info-row">
                    <strong>Status:</strong>
                    <span className={`admin-prescription-label status-${viewingPrescription.status || 'pending'}`}>
                      {viewingPrescription.status || 'pending'}
                    </span>
                  </div>
                  <div className="info-row">
                    <strong>Uploaded:</strong>
                    <span>{new Date(viewingPrescription.uploadedAt).toLocaleString()}</span>
                  </div>
                  {viewingPrescription.notes && (
                    <div className="info-row full-width">
                      <strong>Notes:</strong>
                      <span>{viewingPrescription.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="prescription-preview-wrapper">
                <div className="preview-toolbar">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                      window.open(viewingPrescription.fileUrl, '_blank');
                    }}
                  >
                    🔍 Open Fullscreen
                  </Button>
                </div>
                <div className="prescription-preview-content">
                  {viewingPrescription.fileMimeType?.startsWith('image/') ? (
                    <img
                      src={viewingPrescription.fileUrl}
                      alt="Prescription"
                      className="prescription-image-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <iframe
                      src={viewingPrescription.fileUrl}
                      title="Prescription Preview"
                      className="prescription-iframe-full"
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
              </div>
            </div>
            <div className="view-prescription-modal-footer">
              <div className="modal-actions">
                {(viewingPrescription.orderItemId || viewingPrescription.orderId) && (viewingPrescription.status === 'pending' || !viewingPrescription.status) && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (viewingPrescription.orderId) {
                          handleOrderPrescriptionAction(viewingPrescription.orderId, 'approved');
                        } else {
                          handleOrderItemPrescriptionAction(viewingPrescription.orderItemId, 'approved');
                        }
                      }}
                      disabled={loadingPrescriptions}
                    >
                      ✅ Approve Prescription
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (viewingPrescription.orderId) {
                          handleOrderPrescriptionAction(viewingPrescription.orderId, 'declined');
                        } else {
                          handleOrderItemPrescriptionAction(viewingPrescription.orderItemId, 'declined');
                        }
                      }}
                      disabled={loadingPrescriptions}
                    >
                      ❌ Reject Prescription
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setViewingPrescription(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Receipt Modal */}
      {viewingReceipt && (
        <div className="view-prescription-modal-overlay" onClick={() => setViewingReceipt(null)}>
          <div className="view-prescription-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="view-prescription-modal-header">
              <h3>Payment Receipt Preview</h3>
              <button className="modal-close-btn" onClick={() => setViewingReceipt(null)}>×</button>
            </div>
            <div className="view-prescription-modal-body">
              <div className="prescription-preview-wrapper">
                <div className="preview-toolbar">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                      window.open(viewingReceipt.url, '_blank');
                    }}
                  >
                    🔍 Open Fullscreen
                  </Button>
                </div>
                <div className="receipt-preview-container">
                  {viewingReceipt.url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={viewingReceipt.url}
                      title="Receipt PDF"
                      className="prescription-iframe-full"
                    />
                  ) : (
                    <img
                      src={viewingReceipt.url}
                      alt="Payment Receipt"
                      className="prescription-image-full"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="view-prescription-modal-footer">
              <div className="modal-actions">
                <Button variant="outline" onClick={() => setViewingReceipt(null)}>
                  Close
                </Button>
                {selectedOrder?.paymentStatus === 'pending' && (
                  <Button
                    variant="primary"
                    onClick={() => handleApprovePayment(viewingReceipt.orderId)}
                    disabled={updatingId === viewingReceipt.orderId}
                  >
                    ✅ Approve & Confirm Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;

