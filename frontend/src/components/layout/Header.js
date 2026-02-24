import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartCount = getCartItemsCount();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : null;
  } catch (error) {
    user = null;
  }

  const getRoleCode = (role) => {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'patient') return 'p';
    if (normalizedRole === 'pharmacist') return 'ph';
    if (normalizedRole === 'doctor') return 'dr';
    if (normalizedRole === 'admin') return 'ad';
    return 'us';
  };

  const profileDisplayName = user?.name
    ? `${user.name} (${getRoleCode(user?.role)})`
    : 'Account';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/medicines?search=${searchQuery}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="top-header">
        <div className="container">
          <div className="top-header-content">
            <div className="top-header-left">
              <span className="contact-info">
                <i className="icon">📞</i>
                Call Us: +92 300 1234567
              </span>
              <span className="contact-info">
                <i className="icon">✉️</i>
                Email: info@medicalstore.com
              </span>
            </div>
            <div className="top-header-right">
              <span className="promo-text">
                <i className="icon">🚚</i> Free Delivery on orders over Rs. 5000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="main-header">
        <div className="container">
          <nav className="navbar">
            {/* Logo */}
            <Link to="/" className="logo">
              <div className="logo-icon">🏥</div>
              <div className="logo-text">Medical Store</div>
            </Link>

            {/* Search Bar */}
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search medicines, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <i className="icon">🔍</i>
              </button>
            </form>

            {/* Navigation Links */}
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/medicines" className="nav-link">Products</Link>
              <Link to="/cart" className="nav-link cart-link">
                <span className="cart-icon">🛒</span>
                Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              {isLoggedIn ? (
                <>
                  {user?.role === 'admin' && (
                    <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                  )}
                  <Link to="/orders" className="nav-link">Orders</Link>
                  <div
                    className={`user-menu ${userMenuOpen ? 'open' : ''}`}
                    tabIndex={0}
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                    onFocus={() => setUserMenuOpen(true)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setUserMenuOpen(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="user-trigger"
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                    >
                      {user?.profilePic ? (
                        <img src={user.profilePic} alt="Profile" className="header-profile-pic" />
                      ) : (
                        <span className="user-icon">👤</span>
                      )}
                      <span className="user-name">{profileDisplayName}</span>
                      <span className="caret">▾</span>
                    </button>
                    <div className="user-dropdown">
                      <button type="button" onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}>
                        Settings
                      </button>
                      <button type="button" onClick={() => { setUserMenuOpen(false); navigate('/prescriptions/upload'); }}>
                        Prescriptions
                      </button>
                      <button type="button" className="logout" onClick={() => { setUserMenuOpen(false); handleLogout(); }}>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Login</Link>
                  <Link to="/register" className="btn btn-primary btn-small">Register</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
