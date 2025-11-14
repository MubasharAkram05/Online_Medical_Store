import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleGotoStore = () => {
    navigate('/');
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-logo">🏥</span>
          <div className="admin-brand-text">
            <strong>Medical Store</strong>
            <small>Admin Panel</small>
          </div>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/orders">Order Management</NavLink>
          <NavLink to="/admin/medicines">Product Management</NavLink>
          <NavLink to="/admin/prescriptions">Prescriptions</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/suppliers">Suppliers</NavLink>
        </nav>
        <div className="admin-actions">
          <button type="button" onClick={handleGotoStore} className="btn-outline">
            View Store
          </button>
        </div>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
      <footer className="admin-footer">
        <div className="admin-footer-inner">
          <span>© {new Date().getFullYear()} Online Medical Store. All rights reserved.</span>
          <span>Need help? info@medicalstore.com</span>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;

