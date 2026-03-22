import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * AuthGuard component to check if user is authenticated.
 * If not authenticated, redirects to login page.
 * Can be used as a wrapper for pages or components.
 */
const AuthGuard = ({ children, roles = [] }) => {
       // Get the login token from localStorage
      // If token doesn't exist, user is logged out
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
    // Save the current page location
    // So we can redirect back here after login
    const location = useLocation();

   /* First Guard — Authentication Check
    * If token doesn't exist OR user doesn't exist
    * User is not logged in — redirect to login page
    * Pass current location in state so we can
    * redirect back to this page after successful login
    */
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role permissions if roles are specified
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    /* Both guards passed:
    * User is logged in and has the correct role
    * Render the wrapped child component
    */
    return children;
};

export default AuthGuard;
