import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const cartCount = getCartItemsCount();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : null;
  } catch (error) {
    user = null;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/medicines?search=${searchQuery}`);
    }
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
              <span className="promo-text">Free Delivery on orders over Rs. 5000</span>
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
              <span className="logo-text">Medical Store</span>
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
                Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              {isLoggedIn ? (
                <>
                  {user?.role === 'admin' && (
                    <Link to="/admin/dashboard" className="nav-link">Admin</Link>
                  )}
                  <Link to="/orders" className="nav-link">Orders</Link>
                  <Link to="/profile" className="nav-link">Profile</Link>
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

