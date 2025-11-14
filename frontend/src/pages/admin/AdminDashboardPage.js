import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import Button from '../../components/common/Button';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const { stats, products } = overview;

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2 }).format(
      value || 0
    );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>Admin Dashboard</h1>
        <p>Monitor store performance and manage your products in one place.</p>
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
        <div className="summary-card">
          <span className="summary-label">Total Revenue</span>
          <span className="summary-value">{formatCurrency(stats.totalRevenue)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Users</span>
          <span className="summary-value">{stats.totalUsers}</span>
        </div>
      </div>

      <div className="admin-dashboard__section">
        <div className="section-header">
          <div>
            <h2>Products Management</h2>
            <p>Review, edit, or remove items from your inventory.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/admin/medicines')}>
            Add Product
          </Button>
        </div>

        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No products found. Start by adding a new product.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="product-name">
                      <span>{product.name}</span>
                      <small>{product.description || '—'}</small>
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>{product.category || '—'}</td>
                    <td>{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—'}</td>
                    <td className="action-cell">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => navigate('/admin/medicines', { state: { editId: product.id } })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => navigate('/admin/medicines', { state: { deleteId: product.id } })}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

