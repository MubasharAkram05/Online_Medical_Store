import React, { useEffect, useRef, useState } from 'react';
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
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [isReceiptPdf, setIsReceiptPdf] = useState(false);
  const receiptInputRef = useRef(null);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreviewUrl('');
      setIsReceiptPdf(false);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(receiptFile);
    setReceiptPreviewUrl(previewUrl);
    setIsReceiptPdf(receiptFile.type === 'application/pdf');

    return () => URL.revokeObjectURL(previewUrl);
  }, [receiptFile]);

  const formatStatus = (status) => {
    if (!status) return '—';
    if (status === 'pending_prescription') return 'Pending Prescription Approval';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const resolveReceiptUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${normalizedPath}`;
  };

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await orderService.getOrderById(id);
        const orderData = response.data?.order || null;
        setOrder(orderData);

        console.log('Order loaded:', orderData);
        console.log('Order status:', orderData?.status);

        const hasPrescriptionItems = orderData?.items?.some(
          item => item.requiresPrescription === true || item.requiresPrescription === 1
        );

        if (orderData && (orderData.status === 'completed' || orderData.status === 'delivered') && hasPrescriptionItems) {
          if (typeof window !== 'undefined') {
            setTimeout(() => window.dispatchEvent(new CustomEvent('prescriptionUpdated')), 500);
            setTimeout(() => window.dispatchEvent(new CustomEvent('prescriptionUpdated')), 2000);
            setTimeout(() => window.dispatchEvent(new CustomEvent('prescriptionUpdated')), 4000);
          }
        }
      } catch (error) {
        toast.error(error.response?.data?.error?.message || 'Unable to load order.');
        navigate('/orders', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const poll = setInterval(fetchOrder, 8000);
    return () => clearInterval(poll);
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

  const handleReceiptUpload = async () => {
    if (!receiptFile) {
      toast.error('Please select a receipt file.');
      return;
    }

    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('proof', receiptFile);
      await orderService.uploadPaymentProof(order.id, formData);
      toast.success('Receipt uploaded successfully. Please wait for admin approval.');

      // Reload order details
      const response = await orderService.getOrderById(order.id);
      setOrder(response.data?.order || null);
      setReceiptFile(null);
      if (receiptInputRef.current) {
        receiptInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to upload receipt.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleReceiptFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP, and PDF files are allowed.');
      event.target.value = '';
      setReceiptFile(null);
      return;
    }

    setReceiptFile(file);
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
        {order?.payment?.status === 'rejected' && (
          <div className="moving-notification">
            <div className="notification-content">
              ⚠️ Your payment receipt was rejected because of invalid details. Please update your valid receipt.
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1>Order {order.orderNumber}</h1>
            <p>Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="header-actions">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
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
              <span className={`status-badge status-${order.status}`}>{formatStatus(order.status)}</span>
            </div>
            <div className="status-meta">
              <div>
                <span className="label">Payment Method</span>
                <span className="value" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {order.paymentMethod.toUpperCase()}
                  <span className={`status-badge payment-${order.payment?.status || (order.paymentMethod === 'card' ? 'completed' : 'pending')}`} style={{ padding: '0.2rem 0.7rem', fontSize: '0.75rem', height: 'fit-content' }}>
                    {formatStatus(order.payment?.status || (order.paymentMethod === 'card' ? 'completed' : 'pending'))}
                  </span>
                </span>
              </div>
              <div>
                <span className="label">Order Prescription</span>
                <span className="value">
                  {order.items.find(item => item.prescriptionId) ? (
                    <div className="order-rx-info">
                      <span className={`status-badge prescription-${order.items.find(item => item.prescriptionId).prescriptionStatus || 'pending'}`}>
                        {order.items.find(item => item.prescriptionId).prescriptionStatus === 'approved' ? '✓ Verified' :
                          order.items.find(item => item.prescriptionId).prescriptionStatus === 'declined' ? '✗ Declined' :
                            '⌛ Pending Verification'}
                      </span>
                      {order.items.find(item => item.prescriptionId).prescriptionName && (
                        <p className="rx-file-name">File: {order.items.find(item => item.prescriptionId).prescriptionName}</p>
                      )}
                    </div>
                  ) : (
                    order.items.some(item => item.requiresPrescription) ? '❌ Missing' : 'Not Required'
                  )}
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
                    <span className="item-name">{item.name} {item.requiresPrescription && <span className="rx-label-mini">Rx</span>}</span>
                    <span className="item-qty">Qty: {item.quantity}</span>
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
                      href={resolveReceiptUrl(order.payment.receiptUrl)}
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

          {order.payment && order.payment.status === 'rejected' && (
            <Card className="detail-card">
              <h2>Re-upload Payment Receipt</h2>
              <p className="rejected-notice">Your payment receipt was rejected. Please upload a valid receipt for approval.</p>
              <div className="receipt-upload-section">
                <input
                  type="file"
                  ref={receiptInputRef}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleReceiptFileChange}
                  className="receipt-file-input"
                  id={`receipt-upload-${order.id}`}
                />
                <div className="receipt-upload-actions">
                  <Button
                    variant="outline"
                    onClick={() => receiptInputRef.current?.click()}
                    className="select-file-btn"
                  >
                    Select File
                  </Button>
                  <span className="selected-file-name">
                    {receiptFile ? receiptFile.name : 'No file selected'}
                  </span>
                </div>
                {receiptPreviewUrl && (
                  <div className="receipt-preview-card">
                    <span className="label">Selected Receipt Preview</span>
                    {isReceiptPdf ? (
                      <iframe
                        src={receiptPreviewUrl}
                        title="Selected receipt preview"
                        className="receipt-preview-frame"
                      />
                    ) : (
                      <img
                        src={receiptPreviewUrl}
                        alt="Selected receipt preview"
                        className="receipt-preview-image"
                      />
                    )}
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={handleReceiptUpload}
                  disabled={uploadingReceipt || !receiptFile}
                >
                  {uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
