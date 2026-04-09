import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import Footer from './Footer';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/medicines', label: 'Products', icon: '💊' },
  { to: '/admin/orders', label: 'Orders', icon: '📋' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/prescriptions', label: 'Prescriptions', icon: '📄' },
  { to: '/admin/suppliers', label: 'Suppliers', icon: '🏭' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const sidebarRef = useRef(null);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    user = {};
  }
  const userRole = user.role || 'patient';
  const isAdmin = userRole === 'admin';

  const getRoleCode = (role) => {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'admin') return 'Admin';
    return role;
  };

  const profileDisplayName = user.name ? user.name : 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isAdmin) return <Outlet />;

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    const link = sidebarLinks.find(l => l.to.includes(path));
    return link ? link.label : 'Dashboard';
  };

  return (
    <div className="admin-wp-shell">
      {/* Top Bar */}
      <div className="wp-admin-bar">
        <button className="wp-menu-toggle" onClick={() => setSidebarOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="wp-logo">
          <span className="wp-logo-icon">W</span>
          <span>Medical Store</span>
        </div>
        <div className="wp-screen-title">{getPageTitle()}</div>
        <div className="wp-user-menu" ref={userMenuRef}>
          <button className="wp-user-toggle" onClick={() => setUserMenuOpen(prev => !prev)}>
            <span className="user-avatar" title={profileDisplayName}>👤</span>
            <span className="user-name">{profileDisplayName}</span>
            <span className="user-caret">▾</span>
          </button>
          {userMenuOpen && (
            <div className="wp-user-dropdown">
              <div className="user-info">
                <span className="user-avatar-large">👤</span>
                <span className="user-details">
                  <strong>{profileDisplayName}</strong>
                  <small>Admin</small>
                </span>
              </div>
              <ul>
                <li><NavLink to="/admin/dashboard">Dashboard</NavLink></li>
                <li><a href="#" onClick={handleLogout}>Log Out</a></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="wp-admin-body" ref={sidebarRef}>
        {/* Sidebar */}
        <aside className={`wp-admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="wp-admin-nav">
            <ul>
              {sidebarLinks.map((link) => (
                <li key={link.to}>
                  <NavLink 
                    to={link.to} 
                    className={({ isActive }) => isActive ? 'active' : ''}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    <span className="nav-label">{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="wp-admin-main">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;

