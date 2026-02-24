import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';
import Footer from './Footer';

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

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    user = {};
  }

  const userRole = user.role || 'patient';

  const getRoleCode = (role) => {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'patient') return 'p';
    if (normalizedRole === 'pharmacist') return 'ph';
    if (normalizedRole === 'doctor') return 'dr';
    if (normalizedRole === 'admin') return 'ad';
    return 'us';
  };

  const profileDisplayName = user.name
    ? `${user.name} (${getRoleCode(user.role)})`
    : 'Professional';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredMainNavLinks = mainNavLinks.filter((link) => {
    if (userRole === 'admin') return true;
    if (['doctor', 'pharmacist'].includes(userRole)) {
      return ['Dashboard', 'Order Management'].includes(link.label);
    }
    return false;
  });

  const filteredDropdownLinks = dropdownLinks.filter((link) => {
    if (userRole === 'admin') return true;
    if (['doctor', 'pharmacist'].includes(userRole)) {
      return ['Prescriptions', 'Settings'].includes(link.label);
    }
    return false;
  });

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
          <div className="admin-brand-icon">🏥</div>
          <div className="admin-brand-text">Medical Store</div>
        </div>

        <nav className="admin-main-nav">
          {filteredMainNavLinks.map((link) => (
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
            {profileDisplayName} <span className="chip-caret">▾</span>
          </button>

          {menuOpen && (
            <div className="admin-user-menu">
              {filteredDropdownLinks.map((item) => (
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

      <Footer />
    </div>
  );
};

export default AdminLayout;
