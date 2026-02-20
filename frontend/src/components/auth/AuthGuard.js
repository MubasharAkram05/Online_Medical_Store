import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * AuthGuard component to check if user is authenticated.
 * If not authenticated, redirects to login page.
 * Can be used as a wrapper for pages or components.
 */
const AuthGuard = ({ children, roles = [] }) => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const location = useLocation();

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role permissions if roles are specified
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AuthGuard;
