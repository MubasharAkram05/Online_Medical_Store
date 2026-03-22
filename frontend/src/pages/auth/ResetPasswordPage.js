import React, { useMemo, useState } from 'react';
// Link: client-side navigation, useNavigate: programmatic navigation
// useSearchParams: reads URL query parameters
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
// useForm: form state and validation management
import { useForm } from 'react-hook-form';
// toast notifications for success/error messages
import { toast } from 'react-toastify';
// reusable button component
import Button from '../../components/common/Button';
// auth API calls
import { authService } from '../../services/authService';
// auth page styles
import './Auth.css';

/**
 * ResetPasswordPage Component
 * Allows user to reset their password using a token received via email
 * Token can be pre-filled from URL query parameter or manually entered
 * On success — redirects to login page
 * On failure — shows error toast notification
 */
const ResetPasswordPage = () => {

  // programmatic navigation — redirects to login after successful reset
  const navigate = useNavigate();

  // read URL query parameters
  const [searchParams] = useSearchParams();

  // extract token from URL query parameter
  // useMemo prevents re-reading searchParams on every render
  const defaultToken = useMemo(() => searchParams.get('token') || '', [searchParams]);

  // react-hook-form setup
  // token pre-filled from URL if available — user can also paste manually
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { token: defaultToken }
  });

  // loading state — disables button while API call is in progress
  const [loading, setLoading] = useState(false);

  // watch password in real time — used for confirm password validation
  const newPassword = watch('password');

  /**
   * onSubmit — called after react-hook-form validates all fields
   * Sends reset password request to API with token and new password
   * On success — shows toast and redirects to login
   * On failure — shows error toast
   *
   * @param {object} data - Validated form data { token, password }
   */
  const onSubmit = async ({ token, password }) => {
    // show loading state — disable button
    setLoading(true);
    try {
      // send reset password request with token and new password
      await authService.resetPassword(token, password);

      // show success notification and redirect to login
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (error) {
      // show server error message or fallback generic message
      toast.error(error.response?.data?.error?.message || 'Password reset failed. Try again.');
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
            <div className="logo-icon-large">🔁</div>
            <h2>Reset Password</h2>
            <p>Enter the token you received and choose a new password</p>
          </div>

          {/* reset password form — handleSubmit validates before calling onSubmit */}
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">

            {/* reset token field — required
                pre-filled from URL token param if available
                user can also paste token manually */}
            <div className="form-group">
              <label htmlFor="token">Reset Token</label>
              <input
                id="token"
                type="text"
                placeholder="Paste your reset token"
                // add error class if validation fails — red border
                className={errors.token ? 'error' : ''}
                {...register('token', {
                  required: 'Reset token is required'
                })}
              />
              {/* show error message if validation fails */}
              {errors.token && (
                <span className="error-message">{errors.token.message}</span>
              )}
            </div>

            {/* new password field — required, minimum 6 characters */}
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                className={errors.password ? 'error' : ''}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errors.password && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            {/* confirm password field — must match new password field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className={errors.confirmPassword ? 'error' : ''}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  // custom validation — compare with new password field value
                  validate: (value) => value === newPassword || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword.message}</span>
              )}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {/* back to login link */}
          <div className="auth-footer">
            <p>Back to <Link to="/login">Login</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;