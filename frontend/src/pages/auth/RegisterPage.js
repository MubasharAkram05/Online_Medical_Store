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
 * passwordChecksConfig — list of password strength rules
 * Each rule has:
 * - key: unique identifier
 * - text: description shown to user
 * - test: function that checks if password passes this rule
 */
const passwordChecksConfig = [
  { key: 'length',    text: 'At least 8 characters',              test: (value) => value.length >= 8 },
  { key: 'uppercase', text: 'One uppercase letter (A-Z)',          test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', text: 'One lowercase letter (a-z)',          test: (value) => /[a-z]/.test(value) },
  { key: 'number',    text: 'One number (0-9)',                    test: (value) => /\d/.test(value) },
  { key: 'special',   text: 'One special character (!@#$%^&* etc.)', test: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) }
];

// allowed email domain extensions
// emails with other TLDs will fail validation
const allowedEmailTlds = ['com', 'net', 'org', 'edu', 'gov', 'pk', 'io', 'co', 'us', 'in'];

/**
 * RegisterPage Component
 * Handles new user registration
 * Features: email TLD validation, password strength checker, role selection
 * On success — redirects to login page
 * On failure — shows error toast notification
 */
const RegisterPage = () => {

  // programmatic navigation — redirects to login after successful registration
  const navigate = useNavigate();

  // loading state — disables button while API call is in progress
  const [loading, setLoading] = useState(false);

  // toggle password visibility — password field
  const [showPassword, setShowPassword] = useState(false);

  // toggle password visibility — confirm password field
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // react-hook-form setup
  // register — connects inputs to form
  // handleSubmit — validates before calling onSubmit
  // errors — validation error messages
  // watch — monitors field values in real time
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    // default role is patient — pre-selects patient in dropdown
    defaultValues: { role: 'patient' }
  });

  // watch email and password in real time — used for live validation UI
  const emailValue = watch('email') || '';
  const password = watch('password') || '';

  // ─────────────────────────────────────────
  // EMAIL VALIDATION
  // ─────────────────────────────────────────

  // regex pattern for valid email format
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  // check if email matches valid format
  const emailHasValidFormat = emailValue ? emailPattern.test(emailValue) : false;

  // check if email ends with an allowed TLD
  const emailHasAllowedTld = emailValue
    ? allowedEmailTlds.some((tld) => emailValue.toLowerCase().endsWith(`.${tld}`))
    : false;

  // email is valid only if both format and TLD are correct
  const isEmailValid = emailHasValidFormat && emailHasAllowedTld;

  // ─────────────────────────────────────────
  // PASSWORD STRENGTH
  // ─────────────────────────────────────────

  // run each password rule test against current password value
  // adds 'passed' boolean to each rule
  const passwordChecks = passwordChecksConfig.map((item) => ({
    ...item,
    passed: item.test(password)
  }));

  // count how many rules passed
  const passedTotal = passwordChecks.filter((item) => item.passed).length;

  // calculate password strength label based on passed rules
  // empty → Weak, all passed → Strong, 3+ passed → Medium, else → Weak
  const passwordStrength =
    password.length === 0        ? 'Weak'   :
    passedTotal === passwordChecks.length ? 'Strong' :
    passedTotal >= 3             ? 'Medium' : 'Weak';

  /**
   * onSubmit — called after react-hook-form validates all fields
   * Sends registration request to API
   * On success — shows toast and redirects to login
   * On failure — shows error toast
   *
   * @param {object} data - Validated form data
   */
  const onSubmit = async (data) => {
    // show loading state — disable button
    setLoading(true);
    try {
      const { name, email, phone, password, role } = data;

      // send registration request — role defaults to patient if not selected
      await authService.register({
        name,
        email,
        phone,
        password,
        role: role || 'patient'
      });

      // show success notification and redirect to login
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      // show server error message or fallback generic message
      toast.error(error.response?.data?.error?.message || 'Registration failed. Please try again.');
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
            <h2>Create Account</h2>
            <p>Join us to get started</p>
          </div>

          {/* registration form — handleSubmit validates before calling onSubmit */}
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">

            {/* full name field — required, minimum 2 characters */}
            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="required-marker">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                placeholder="Enter your full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name.message}</span>}
            </div>

            {/* email field — required, format + TLD validation */}
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
                  // custom TLD validation — only allowed domains accepted
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

              {/* live email status — shown while user is typing */}
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

            {/* phone field — required, 10-15 digits only */}
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

            {/* role dropdown — patient selected by default */}
            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <select
                id="role"
                {...register('role', { required: 'Role is required' })}
                className={errors.role ? 'error' : ''}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
              {errors.role && <span className="error-message">{errors.role.message}</span>}
            </div>

            {/* password field — required, strength validation */}
            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required-marker">*</span>
              </label>
              <div className="password-field">
                {/* type toggles between password and text based on showPassword */}
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: {
                      // regex checks all strength requirements at once
                      strength: (value) =>
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/g.test(value) ||
                        'Password must include uppercase, lowercase, number, and special character'
                    }
                  })}
                  placeholder="Create a password"
                  className={errors.password ? 'error' : ''}
                />
                {/* show/hide password toggle — type="button" prevents form submission */}
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password.message}</span>}

              {/* live password strength indicator */}
              <div className="password-helper">
                {/* strength label — Weak / Medium / Strong */}
                <p className={`password-strength-label ${passwordStrength.toLowerCase()}`}>
                  Password Strength: {passwordStrength}
                </p>
                <p className="password-guidelines-title">Password must contain:</p>

                {/* password rules checklist — each rule shows tick or circle */}
                <ul className="password-checklist">
                  {passwordChecks.map((item) => (
                    // 'ok' class added when rule is passed — green styling
                    <li key={item.key} className={`password-check ${item.passed ? 'ok' : ''}`}>
                      <span>{item.passed ? '✓' : '○'}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* confirm password field — must match password field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    // custom validation — compare with password field value
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {/* show/hide confirm password toggle */}
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword.message}</span>
              )}
            </div>

            {/* terms and conditions checkbox — required */}
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
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          {/* login link — for users who already have an account */}
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

