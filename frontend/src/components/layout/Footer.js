import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Store Info */}
          <div className="footer-column">
            <div className="footer-logo">
              <div className="logo-icon">🏥</div>
              <span className="logo-text">Medical Store</span>
            </div>
            <p className="footer-description">
              Your trusted partner for all your healthcare needs. We provide authentic medicines 
              and healthcare products with fast delivery.
            </p>
            <div className="social-icons">
              <a href="#" className="social-icon" aria-label="Facebook">📘</a>
              <a href="#" className="social-icon" aria-label="Twitter">🐦</a>
              <a href="#" className="social-icon" aria-label="Instagram">📷</a>
              <a href="#" className="social-icon" aria-label="LinkedIn">💼</a>
              <a href="#" className="social-icon" aria-label="YouTube">📺</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/medicines">Products</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-column">
            <h3 className="footer-heading">Categories</h3>
            <ul className="footer-links">
              <li><Link to="/medicines?category=medicines">Medicines</Link></li>
              <li><Link to="/medicines?category=vitamins">Vitamins</Link></li>
              <li><Link to="/medicines?category=personal-care">Personal Care</Link></li>
              <li><Link to="/medicines?category=baby-care">Baby Care</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="footer-column">
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon">📞</span>
                <span>+92 300 1234567</span>
              </li>
              <li>
                <span className="contact-icon">✉️</span>
                <span>info@medicalstore.com</span>
              </li>
              <li>
                <span className="contact-icon">📍</span>
                <span>123 Medical Street, Karachi, Pakistan</span>
              </li>
              <li>
                <span className="contact-icon">🕐</span>
                <span>Mon-Sat: 9AM - 9PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Online Medical Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

