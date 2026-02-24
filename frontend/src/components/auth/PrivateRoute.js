import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Route protector for general authenticated users
 */
const PrivateRoute = () => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    let user = null;
    try {
        user = userRaw ? JSON.parse(userRaw) : null;
    } catch (error) {
        user = null;
    }
    const location = useLocation();

    if (!token || !user) {
        // Redirect to login but save the current location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
