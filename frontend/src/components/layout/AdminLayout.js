import React, { useEffect, useRef, useState } from 'react';
// NavLink: Automatically adds an 'active' class when the link matches the current URL
// Outlet: A placeholder where nested child routes are displayed
// useNavigate: A hook to change pages programmatically (via code logic)
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
/**
 * AdminLayout Component
 * Main layout wrapper for all admin/professional pages
 * Contains: info bar, header with navigation, main content area, footer
 * Handles: user authentication display, role based navigation, logout
 * Used as parent route — all admin pages render inside <Outlet />
 */
const AdminLayout = () => {
    // useNavigate hook — for programmatic navigation - used in logout and dropdown menu clicks
  const navigate = useNavigate();
    // menuOpen state — controls profile dropdown visibility
  const [menuOpen, setMenuOpen] = useState(false);
    // ref attached to profile menu container - used to detect clicks outside the menu to close it
  const menuRef = useRef(null);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    user = {};
  }
   // get user role — default to 'patient' if role not found
  const userRole = user.role || 'patient';
  // getRoleCode — converts full role name to short code - Used to display role abbreviation next to user name
  const getRoleCode = (role) => {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'patient') return 'p';
    if (normalizedRole === 'pharmacist') return 'ph';
    if (normalizedRole === 'doctor') return 'dr';
    if (normalizedRole === 'admin') return 'ad';
    return 'us';
  };
//profileDisplayName — builds the display name for header - Shows name with role code in brackets
  const profileDisplayName = user.name
    ? `${user.name} (${getRoleCode(user.role)})`
    : 'Professional';
  /**
   * handleLogout — clears all auth data and redirects to login
   * Removes: token, refreshToken, user from localStorage
   * Then navigates to login page
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };
  /**
   * filteredMainNavLinks — filters main navigation links based on user role
   * Currently only admin can see all navigation links
   * All other roles see no links
   */
  const filteredMainNavLinks = mainNavLinks.filter((link) => {
    if (userRole === 'admin') return true;
    return false;
  });

  const filteredDropdownLinks = dropdownLinks.filter((link) => {
    if (userRole === 'admin') return true;
    return false;
  });
  /**
   * useEffect — handles clicks outside the profile dropdown menu
   * When user clicks anywhere outside the menu — close it
   * Cleanup removes event listener when component unmounts — prevents memory leaks
   */
  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
           // click was outside — close the dropdown
        setMenuOpen(false);
      }
    };
     // add event listener to entire document to detect any click
    document.addEventListener('mousedown', handleOutside);
    // cleanup — remove event listener when component is removed
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);// empty array — only runs once when component mounts

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
        {/* main navigation links — filtered based on user role
            only admin sees these links currently */}
        <nav className="admin-main-nav">
          {filteredMainNavLinks.map((link) => (
            <NavLink key={link.label} to={link.to} 
               // end prop — only mark active on exact path match
              // prevents Home from being active on all pages
            end={link.exact}>
              {/* emoji icon before link label */}
              <span className="nav-icon">{link.icon}</span>
              {link.label}
               {/* show badge only if it has a number value
                  used for notifications like pending orders count */}
              {typeof link.badge === 'number' && <span className="nav-badge">{link.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-user-chip" ref={menuRef}>
          <span className="chip-icon">👤</span>

          {/* profile button — toggles dropdown on click
            prev => !prev toggles between true and false */}
          <button
            type="button"
            className="admin-user-trigger"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {profileDisplayName}
            {/* dropdown arrow icon */}
             <span className="chip-caret">▾</span>
          </button>
           {/* dropdown menu — only rendered when menuOpen is true */}
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
      {/* main content area
          Outlet renders the current matched nested route
          example: /admin/dashboard renders Dashboard component here */}
      <main className="admin-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default AdminLayout;
