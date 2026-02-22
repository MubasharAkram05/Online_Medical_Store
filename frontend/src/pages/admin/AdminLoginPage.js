import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          toast.error('You are not authorized to access this panel.');
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError('');
    try {
      const payload = {
        email: data.email.trim(),
        password: data.password
      };
      const response = await authService.login(payload);
      const { tokens, user } = response.data;

      if (user.role !== 'admin') {
        toast.error('Admin access only. Please contact support for assistance.');
        return;
      }

      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      const message =
        error.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">🛡️</div>
          <h2>Admin Portal</h2>
          <p>Sign in with your administrator account to continue.</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="admin@example.com"
              className={errors.email ? 'error' : ''}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </label>

          <label>
            <span>Password</span>
            <div className="admin-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className={errors.password ? 'error' : ''}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              <button
                type="button"
                className="admin-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </label>

          {authError && <div className="auth-error">{authError}</div>}

          <Button type="submit" variant="primary" size="large" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
