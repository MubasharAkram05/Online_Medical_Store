import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import './Auth.css';

const passwordChecksConfig = [
  { key: 'length', text: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'uppercase', text: 'One uppercase letter (A-Z)', test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', text: 'One lowercase letter (a-z)', test: (value) => /[a-z]/.test(value) },
  { key: 'number', text: 'One number (0-9)', test: (value) => /\d/.test(value) },
  {
    key: 'special',
    text: 'One special character (!@#$%^&* etc.)',
    test: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
  }
];

const allowedEmailTlds = ['com', 'net', 'org', 'edu', 'gov', 'pk', 'io', 'co', 'us', 'in'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      role: 'patient'
    }
  });

  const emailValue = watch('email') || '';
  const password = watch('password') || '';

  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const emailHasValidFormat = emailValue ? emailPattern.test(emailValue) : false;
  const emailHasAllowedTld = emailValue
    ? allowedEmailTlds.some((tld) => emailValue.toLowerCase().endsWith(`.${tld}`))
    : false;
  const isEmailValid = emailHasValidFormat && emailHasAllowedTld;

  const passwordChecks = passwordChecksConfig.map((item) => ({
    ...item,
    passed: item.test(password)
  }));
  const passedTotal = passwordChecks.filter((item) => item.passed).length;
  const passwordStrength =
    password.length === 0 ? 'Weak' : passedTotal === passwordChecks.length ? 'Strong' : passedTotal >= 3 ? 'Medium' : 'Weak';

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { name, email, phone, password, role } = data;
      await authService.register({
        name,
        email,
        phone,
        password,
        role: role || 'patient'
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-icon-large">🏥</div>
            <h2>Create Account</h2>
            <p>Join us to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="required-marker">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                placeholder="Enter your full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required-marker">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: emailPattern,
                    message: 'Invalid email address'
                  },
                  validate: {
                    tld: (value) =>
                      allowedEmailTlds.some((tld) => value.toLowerCase().endsWith(`.${tld}`)) ||
                      'Email domain must be .com, .net, .org, .pk, or similar'
                  }
                })}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email.message}</span>}
              {emailValue && (
                <div className={`field-status ${isEmailValid ? 'success' : 'error'}`}>
                  {isEmailValid
                    ? '✓ Valid email address'
                    : !emailHasValidFormat
                      ? 'Please enter a valid email address'
                      : 'Email domain must be .com, .net, .org, .pk, etc.'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required-marker">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: 'Invalid phone number'
                  }
                })}
                placeholder="Enter your phone number"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <select
                id="role"
                {...register('role', {
                  required: 'Role is required'
                })}
                className={errors.role ? 'error' : ''}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
              {errors.role && <span className="error-message">{errors.role.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required-marker">*</span>
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    validate: {
                      strength: (value) =>
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/g.test(
                          value
                        ) ||
                        'Password must include uppercase, lowercase, number, and special character'
                    }
                  })}
                  placeholder="Create a password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password.message}</span>}
              <div className="password-helper">
                <p className={`password-strength-label ${passwordStrength.toLowerCase()}`}>
                  Password Strength: {passwordStrength}
                </p>
                <p className="password-guidelines-title">Password must contain:</p>
                <ul className="password-checklist">
                  {passwordChecks.map((item) => (
                    <li key={item.key} className={`password-check ${item.passed ? 'ok' : ''}`}>
                      <span>{item.passed ? '✓' : '○'}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('terms', {
                    required: 'You must agree to the terms and conditions'
                  })}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms#usage" className="inline-link">
                    Terms and Conditions
                  </Link>
                </span>
              </label>
              {errors.terms && <span className="error-message">{errors.terms.message}</span>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

