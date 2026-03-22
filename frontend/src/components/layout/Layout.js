import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';
/**
 * Layout Component
 * Main layout wrapper for all public/customer facing pages
 * Provides consistent structure: Header → Page Content → Footer
 * Used as parent route — all public pages render inside <Outlet />
 *
 * Example pages that use this layout:
 * - Home page
 * - Medicines/Products page
 * - Cart page
 * - Order page
 */
const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

