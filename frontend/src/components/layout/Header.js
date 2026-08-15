import React, { useState } from 'react';
// Link: renders anchor tag for client-side navigation without page reload
// useNavigate: programmatically navigate to different pages
import { Link, useNavigate } from 'react-router-dom'; 
import { useCart } from '../../context/CartContext';  // cart context — provides cart item count for badge display
import './Header.css';

const HEADER_FEATURES = [
  { icon: '✓', label: 'Authentic Medicines' },
  { icon: '🚚', label: 'Fast Delivery' },
  { icon: '💊', label: 'Prescription Support' },
  { icon: '🎧', label: '24/7 Support' },
];

/**
 * Header Component
 * Main navigation header shown on all public/customer pages
 * Contains: top info bar, logo, search bar, navigation links, user menu
 * Handles: search, logout, cart count, role based links, user dropdown
 */
const Header = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();   // used to show badge number on cart icon
  const [searchQuery, setSearchQuery] = useState('');   // searchQuery state — stores current value of search input
  const [userMenuOpen, setUserMenuOpen] = useState(false);   // controls user profile dropdown visibility
  const cartCount = getCartItemsCount();   // used to show badge on cart icon
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

  const profileDisplayName = user?.name // name exists — show with role code
    ? `${user.name} (${getRoleCode(user?.role)})`
    : 'Account';
  /**
   * handleSearch — handles search form submission
   * Navigates to medicines page with search query in URL
   * Only searches if query is not empty
   * param {Event} e - Form submit event
   */
  const handleSearch = (e) => {
    e.preventDefault(); // prevent default form submission and page reload
    if (searchQuery.trim()) {
      navigate(`/medicines?search=${searchQuery}`);  // navigate to medicines page with search query
    } 
  };
  /**
   * handleLogout — clears all auth data and redirects to login
   * Removes: token, refreshToken, user from localStorage
   * Then navigates to login page
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');     // redirect to login page after logout
  };

  return (
    <>
      {/* Top Header Bar — continuous right-to-left marquee, never pauses.
          Content is duplicated so the track can loop seamlessly: at
          translateX(-50%) the second copy lines up exactly where the first
          started, so the animation restarts with no visible jump. */}
      <div className="top-header">
        <div className="top-header-marquee">
          <div className="top-header-track">
            {[0, 1].map((copy) => (
              <React.Fragment key={copy}>
                <span className="contact-info">
                  <i className="icon">📞</i>
                  Call Us: +92 300 1234567
                </span>
                <span className="contact-info">
                  <i className="icon">✉️</i>
                  Email: info@medicalstore.com
                </span>
                <span className="promo-text">
                  <i className="icon">🚚</i> Free Delivery on orders over Rs. 5000
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar — sticky, so the features bar right above the
          logo stays visible while scrolling too. */}
      <header className="main-header">
        <div className="header-features-bar">
          {HEADER_FEATURES.map((feature) => (
            <span className="header-feature-item" key={feature.label}>
              <span className="header-feature-icon">{feature.icon}</span>
              <span>{feature.label}</span>
            </span>
          ))}
        </div>
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

                   {/* User Profile Dropdown Menu
                      opens on hover (onMouseEnter) and focus
                      closes on mouse leave (onMouseLeave) and blur */}
                  <div
                    className={`user-menu ${userMenuOpen ? 'open' : ''}`} // add 'open' class when menu is open for CSS styling

                    tabIndex={0} // tabIndex makes div focusable — for keyboard accessibility
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                    onFocus={() => setUserMenuOpen(true)}    // open on keyboard focus

                     // close on blur — but only if focus moved outside the menu
                    // e.currentTarget.contains(e.relatedTarget) checks if
                    // focus moved to a child element inside the menu
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setUserMenuOpen(false);
                      }
                    }}
                  >
                   
                    {/* profile trigger button — toggles dropdown on click */}
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
                  <Link to="/login" className="nav-link">Login</Link> {/* Not logged in — show Login and Register links */}
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
