import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [isGenerating, setIsGenerating] = useState(false);
  const [salesReport, setSalesReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  const generateReport = async (format) => {
    try {
      setIsGenerating(true);
      toast.info(`Generating ${reportType} report in ${format.toUpperCase()} format...`);

      const response = await adminService.downloadReport(reportType, format, { days: 7 });
      const blob = format === 'pdf' ? response.data : new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${reportType} report downloaded successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate report: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const response = await adminService.getOverview();
        setOverview(response.data);
      } catch (error) {
        toast.error('Unable to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  useEffect(() => {
    const loadReportData = async () => {
      if (reportType === 'sales') {
        try {
          setLoadingReport(true);
          const response = await adminService.getSalesReport({ days: 7 });
          setSalesReport(response.data?.report || []);
        } catch (error) {
          toast.error('Unable to load sales report data.');
          setSalesReport([]);
        } finally {
          setLoadingReport(false);
        }
      } else {
        setSalesReport(null);
      }
    };

    loadReportData();
  }, [reportType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.download-dropdown-wrapper')) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadDropdown]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="admin-loading">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const { stats, alerts } = overview;
  const lowStockProducts = alerts?.lowStock || [];
  const expiringProducts = alerts?.expiring || [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2 }).format(
      value || 0
    );

  const salesSummary = salesReport
    ? {
        totalOrders: salesReport.reduce((sum, day) => sum + (Number(day.orders) || 0), 0),
        totalRevenue: salesReport.reduce((sum, day) => sum + (Number(day.revenue) || 0), 0),
        averageDailyRevenue: salesReport.length > 0
          ? salesReport.reduce((sum, day) => sum + (Number(day.revenue) || 0), 0) / salesReport.length
          : 0,
        days: salesReport.length
      }
    : null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'patient';

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>{userRole === 'admin' ? 'Admin Dashboard' : 'Professional Dashboard'}</h1>
        <p>Monitor store performance and manage your tasks in one place.</p>
      </div>

      <div className="admin-dashboard__cards">
        <div className="summary-card">
          <span className="summary-label">Total Products</span>
          <span className="summary-value">{stats.totalProducts}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Orders</span>
          <span className="summary-value">{stats.totalOrders}</span>
        </div>
        {userRole === 'admin' && (
          <>
            <div className="summary-card">
              <span className="summary-label">Total Revenue</span>
              <span className="summary-value">{formatCurrency(stats.totalRevenue)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Users</span>
              <span className="summary-value">{stats.totalUsers}</span>
            </div>
          </>
        )}
      </div>

      <div className="admin-dashboard__section">
        <div className="section-header">
          <div>
            <h2>Generate Reports</h2>
            <p>Download reports in your preferred format</p>
          </div>
          <div className="report-type-wrapper">
            <label>Select Report Type:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="report-select"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="expiry">Expiry Alerts</option>
            </select>
          </div>
        </div>

        <div className="report-options">
          <div className="report-actions">
            <div className="download-dropdown-wrapper">
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                disabled={isGenerating}
                className="report-button download-main"
              >
                {isGenerating ? 'Generating...' : 'Download Report'}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showDownloadDropdown && (
                <div className="download-dropdown-menu">
                  <button
                    onClick={() => {
                      generateReport('pdf');
                      setShowDownloadDropdown(false);
                    }}
                    disabled={isGenerating}
                    className="download-option pdf"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      generateReport('csv');
                      setShowDownloadDropdown(false);
                    }}
                    disabled={isGenerating}
                    className="download-option csv"
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {reportType === 'sales' && (
          <div className="report-summary-section">
            <h3>Sales Report Summary (Last 7 Days)</h3>
            {loadingReport ? (
              <div className="report-loading">Loading sales data...</div>
            ) : salesSummary ? (
              <>
                <div className="report-summary-cards">
                  <div className="summary-stat-card">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-value">{salesSummary.totalOrders}</span>
                  </div>
                  <div className="summary-stat-card">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-value">{formatCurrency(salesSummary.totalRevenue)}</span>
                  </div>
                  <div className="summary-stat-card">
                    <span className="stat-label">Avg Daily Revenue</span>
                    <span className="stat-value">{formatCurrency(salesSummary.averageDailyRevenue)}</span>
                  </div>
                </div>
                {salesReport.length > 0 && (
                  <div className="sales-details">
                    <h4>Daily Breakdown</h4>
                    <div className="sales-table-wrapper">
                      <table className="sales-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesReport.map((day, index) => (
                            <tr key={index}>
                              <td>{new Date(day.date).toLocaleDateString()}</td>
                              <td>{day.orders}</td>
                              <td>{formatCurrency(day.revenue || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="report-empty">No sales data available.</div>
            )}
          </div>
        )}

        {reportType === 'inventory' && (
          <div className="report-summary-section">
            <h3>Inventory Report - Low Stock Products</h3>
            {lowStockProducts.length === 0 ? (
              <div className="report-empty">No low stock alerts at this time.</div>
            ) : (
              <>
                <div className="inventory-summary-stats">
                  <div className="summary-stat-card">
                    <span className="stat-label">Low Stock Items</span>
                    <span className="stat-value warning">{lowStockProducts.length}</span>
                  </div>
                  <div className="summary-stat-card">
                    <span className="stat-label">Total Stock Value</span>
                    <span className="stat-value">
                      {formatCurrency(
                        lowStockProducts.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="low-stock-grid">
                  {lowStockProducts.map((product) => (
                    <div className="low-stock-card" key={product.id}>
                      <div className="low-stock-card-header">
                        <h4>{product.name}</h4>
                      </div>
                      <div className="low-stock-card-body">
                        <p className="low-stock-category">Category: {product.category || '-'}</p>
                        <div className="low-stock-meta">
                          <span className="low-stock-label">Stock:</span>
                          <span className="low-stock-value">{product.stock}</span>
                          <span className="low-stock-price">Price: {formatCurrency(product.price || 0)}</span>
                          <span className="low-stock-expiry">
                            Expiry: {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {reportType === 'expiry' && (
          <div className="report-summary-section">
            <h3>Expiry Report - Expiring Products (Next 30 Days)</h3>
            {expiringProducts.length === 0 ? (
              <div className="report-empty">No products expiring in the next 30 days.</div>
            ) : (
              <>
                <div className="inventory-summary-stats">
                  <div className="summary-stat-card">
                    <span className="stat-label">Expiring Items</span>
                    <span className="stat-value danger">{expiringProducts.length}</span>
                  </div>
                  <div className="summary-stat-card">
                    <span className="stat-label">Total Stock Value</span>
                    <span className="stat-value">
                      {formatCurrency(
                        expiringProducts.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="low-stock-grid">
                  {expiringProducts.map((product) => (
                    <div className="low-stock-card expiry-card" key={product.id}>
                      <div className="low-stock-card-header">
                        <h4>{product.name}</h4>
                      </div>
                      <div className="low-stock-card-body">
                        <p className="low-stock-category">Category: {product.category || '-'}</p>
                        <div className="low-stock-meta">
                          <span className="low-stock-label">Stock:</span>
                          <span className="low-stock-value">{product.stock}</span>
                          <span className="low-stock-price">Price: {formatCurrency(product.price || 0)}</span>
                          <span className="low-stock-expiry expiry-highlight">
                            Expiry: {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
