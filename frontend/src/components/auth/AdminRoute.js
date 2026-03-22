import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * AdminRoute component to protect routes from non-admin users.
 * Performs two checks:
 * 1. If user is not logged in → redirects to login page
 * 2. If user is logged in but not an admin → redirects to home page
 * Used as a wrapper for nested admin routes in the router configuration.
 */
const AdminRoute = () => {
     // Get the login token from localStorage
    // If token doesn't exist, user is not logged in
  const token = localStorage.getItem('token');
    // Get the raw user data from localStorage
    // This is still a string at this point — not an object yet
  const userRaw = localStorage.getItem('user');

  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (error) {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
     // Second Guard — Admin Role Check
    // If user is logged in but their role is not 'admin'
    // User does not have admin permissions — redirect to home page
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
     // Both guards passed:
    // User is logged in AND has admin role
    // Render the nested admin route that was requested
  return <Outlet />;
};

export default AdminRoute;

