import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * PrivateRoute component to protect routes from unauthenticated users.
 * If user is not logged in, redirects to login page.
 * After login, redirects back to the page they were trying to access.
 * Used as a wrapper for nested routes in the router configuration.
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
     // Save the current page location
    // So we can redirect back here after successful login
    const location = useLocation();

    if (!token || !user) {
        // Redirect to login but save the current location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // User is logged in
    // Render the nested/child route that was requested
    return <Outlet />;
};

export default PrivateRoute;
