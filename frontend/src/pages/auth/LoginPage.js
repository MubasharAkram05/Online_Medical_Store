import React, { useState } from 'react';
// Link: client-side navigation, useNavigate: programmatic navigation
import { Link, useNavigate } from 'react-router-dom';
// useForm: form state and validation management
import { useForm } from 'react-hook-form';
// toast notifications for success/error messages
import { toast } from 'react-toastify';
// auth API calls
import { authService } from '../../services/authService';
// reusable button component
import Button from '../../components/common/Button';
// auth page styles
import './Auth.css';

/**
 * LoginPage Component
 * Handles user login with email and password
 * On success — saves tokens and redirects based on user role
 * On failure — shows error toast notification
 */
const LoginPage = () => {

  // programmatic navigation — used after successful login
  const navigate = useNavigate();

  // loading state — disables button and shows "Logging in..." while API call is in progress
  const [loading, setLoading] = useState(false);

  // showPassword state — toggles password field between text and password type
  const [showPassword, setShowPassword] = useState(false);

  // react-hook-form setup
  // register — connects inputs to form
  // handleSubmit — validates form before calling onSubmit
  // errors — contains validation error messages
  const { register, handleSubmit, formState: { errors } } = useForm();

  /**
   * onSubmit — called after react-hook-form validates all fields
   * Sends login request to API
   * On success — saves auth data and redirects based on role
   * On failure — shows error toast
   *
   * @param {object} data - Validated form data { email, password }
   */
  const onSubmit = async (data) => {
    // show loading state — disable button
    setLoading(true);
    try {
      // send login request to API
      const response = await authService.login(data);
      const { tokens, user } = response.data;

      // save auth tokens and user data to localStorage
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // show success notification
      toast.success('Login successful!');

      // redirect based on user role
      // admin → admin dashboard, others → home page
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      // show server error message or fallback generic message
      toast.error(error.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      // always reset loading state — success or failure
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">

          {/* page header — logo, title, subtitle */}
          <div className="auth-header">
            <div className="logo-icon-large">🏥</div>
            <h2>Welcome Back</h2>
            <p>Login to your account</p>
          </div>

          {/* login form — handleSubmit validates before calling onSubmit */}
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">

            {/* email field — required with pattern validation */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    // regex validates correct email format
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="Enter your email"
                // add error class if validation fails — red border
                className={errors.email ? 'error' : ''}
              />
              {/* show error message if validation fails */}
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            {/* password field — required with minimum length validation */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                {/* type toggles between 'password' and 'text' based on showPassword */}
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  placeholder="Enter your password"
                  // add error class if validation fails — red border
                  className={errors.password ? 'error' : ''}
                />

                {/* show/hide password toggle button
                    type="button" prevents form submission on click */}
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  // aria-label for screen reader accessibility
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {/* show error message if validation fails */}
              {errors.password && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            {/* remember me checkbox and forgot password link */}
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            {/* submit button
                disabled while loading — prevents double submission
                text changes based on loading state */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* register link — for users without an account */}
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;

