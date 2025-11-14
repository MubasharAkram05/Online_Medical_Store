import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { authService } from '../services/authService';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors }
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await authService.getCurrentUser();
        const user = response.data?.user;
        if (user) {
          reset({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || ''
          });
        }
      } catch (error) {
        toast.error('Unable to load profile details.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [token, navigate, reset]);

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try {
      const response = await authService.updateProfile(data);
      const updatedUser = response.data?.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      toast.success(response.data?.message || 'Profile updated successfully.');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password updated successfully.');
      resetPasswordForm();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-state">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Account Settings</h1>
            <p>Manage your personal information and security preferences.</p>
          </div>
          <div className="profile-badge">👤</div>
        </div>

        <div className="profile-grid">
          <Card className="profile-card">
            <h2>Personal Information</h2>
            <form className="profile-form" onSubmit={handleSubmit(onSaveProfile)}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={errors.name ? 'error' : ''}
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                />
                {errors.name && <span className="error-message">{errors.name.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  className={errors.phone ? 'error' : ''}
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Phone must be 10-15 digits'
                    }
                  })}
                />
                {errors.phone && <span className="error-message">{errors.phone.message}</span>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          <Card className="profile-card">
            <h2>Change Password</h2>
            <form className="profile-form" onSubmit={handleSubmitPassword(onChangePassword)}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  className={passwordErrors.currentPassword ? 'error' : ''}
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                {passwordErrors.currentPassword && <span className="error-message">{passwordErrors.currentPassword.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  className={passwordErrors.newPassword ? 'error' : ''}
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                {passwordErrors.newPassword && <span className="error-message">{passwordErrors.newPassword.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className={passwordErrors.confirmPassword ? 'error' : ''}
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === watchPassword('newPassword') || 'Passwords do not match'
                  })}
                />
                {passwordErrors.confirmPassword && <span className="error-message">{passwordErrors.confirmPassword.message}</span>}
              </div>

              <Button
                type="submit"
                variant="outline"
                size="large"
                disabled={changingPassword}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

