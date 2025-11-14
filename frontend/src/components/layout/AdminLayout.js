import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const mainNavLinks = [
  { to: '/', label: 'Home', exact: true, icon: '🏠' },
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/medicines', label: 'Products Management', icon: '💊' },
  { to: '/admin/orders', label: 'Order Management', icon: '📋' }
];

const dropdownLinks = [
  { label: 'User Profile', to: '/admin/users' },
  { label: 'Prescriptions', to: '/admin/prescriptions' },
  { label: 'Suppliers', to: '/admin/suppliers' },
  { label: 'Settings', to: '/admin/settings' }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleGotoStore = () => navigate('/');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="admin-shell">
      <div className="admin-info-bar">
        <div className="admin-info-left">
          <span>📞 Call Us: +92 300 1234567</span>
          <span>✉️ Email: info@medicalstore.com</span>
        </div>
        <div className="admin-info-right">🚚 Free Delivery on orders over Rs. 5000</div>
      </div>

      <header className="admin-header">
        <div className="admin-brand-block">
          <div className="admin-brand-icon">
            <span className="brand-square brand-square--teal" />
            <span className="brand-square brand-square--pink" />
            <span className="brand-square brand-square--white" />
            <span className="brand-square brand-square--red" />
          </div>
          <div className="admin-brand-text">
            <span className="brand-primary">Medical</span>
            <span className="brand-accent">Store</span>
          </div>
        </div>

        <form
          className="admin-search"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input type="search" placeholder="Search medicines, products..." />
          <button type="submit">🔍</button>
        </form>

        <nav className="admin-main-nav">
          {mainNavLinks.map((link) => (
            <NavLink key={link.label} to={link.to} end={link.exact}>
              <span className="nav-icon">{link.icon}</span>
              {link.label}
              {typeof link.badge === 'number' && <span className="nav-badge">{link.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-user-chip" ref={menuRef}>
          <span className="chip-icon">👤</span>
          <button
            type="button"
            className="admin-user-trigger"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            Admin User <span className="chip-caret">▾</span>
          </button>

          {menuOpen && (
            <div className="admin-user-menu">
              {dropdownLinks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.to);
                  }}
                >
                  {item.label}
                </button>
              ))}
              <hr />
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="admin-content">
        <Outlet />
      </main>

      <footer className="admin-footer">
        <div className="admin-footer-grid">
          <div>
            <div className="admin-footer-brand">Medical Store</div>
            <p>Your trusted partner for all your healthcare needs. We provide authentic medicines and healthcare products with fast delivery.</p>
            <div className="admin-footer-socials">
              <span>Fb</span>
              <span>Tw</span>
              <span>Ig</span>
              <span>Ln</span>
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li>Home</li>
              <li>Products</li>
              <li>Cart</li>
              <li>My Orders</li>
            </ul>
          </div>
          <div>
            <h4>Categories</h4>
            <ul>
              <li>Medicines</li>
              <li>Vitamins</li>
              <li>Personal Care</li>
              <li>Baby Care</li>
            </ul>
          </div>
          <div>
            <h4>Contact Us</h4>
            <ul className="contact-list">
              <li>📞 +92 300 1234567</li>
              <li>✉️ info@medicalstore.com</li>
              <li>📍 123 Medical Street, Karachi, Pakistan</li>
              <li>🕘 Mon-Sat: 9AM - 9PM</li>
            </ul>
          </div>
        </div>
        <div className="admin-footer-bottom">
          © {new Date().getFullYear()} Online Medical Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;

