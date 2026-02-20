import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Allow admin, doctor, and pharmacist roles
  const professionalRoles = ['admin', 'doctor', 'pharmacist'];
  if (!professionalRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

