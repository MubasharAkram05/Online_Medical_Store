import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';
import './Auth.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      token: defaultToken
    }
  });
  const [loading, setLoading] = useState(false);

  const newPassword = watch('password');

  const onSubmit = async ({ token, password }) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Password reset failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-icon-large">🔁</div>
            <h2>Reset Password</h2>
            <p>Enter the token you received and choose a new password</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label htmlFor="token">Reset Token</label>
              <input
                id="token"
                type="text"
                placeholder="Paste your reset token"
                className={errors.token ? 'error' : ''}
                {...register('token', {
                  required: 'Reset token is required'
                })}
              />
              {errors.token && <span className="error-message">{errors.token.message}</span>}
            </div>

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
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className={errors.confirmPassword ? 'error' : ''}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === newPassword || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
            </div>

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

          <div className="auth-footer">
            <p>
              Back to <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

