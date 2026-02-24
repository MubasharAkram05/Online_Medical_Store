import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import { authService } from '../../services/authService';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authService.getCurrentUser();
        setProfile(response.data?.user || null);
      } catch (error) {
        toast.error('Unable to load admin settings.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const roleLabel = (() => {
    const role = (profile?.role || '').toLowerCase();
    if (role === 'patient') return 'Patient';
    if (role === 'doctor') return 'Doctor';
    if (role === 'pharmacist') return 'Pharmacist';
    if (role === 'admin') return 'Admin';
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
  })();

  if (loading) {
    return (
      <div className="admin-settings-page">
        <div className="admin-loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="admin-settings-page">
      <div className="section-header">
        <div>
          <h1>Settings</h1>
          <p>Review your administrator account details and access level.</p>
        </div>
      </div>

      <Card className="admin-settings-card">
        <h2>Account Information</h2>
        <div className="settings-grid">
          <label>
            <span>Full Name</span>
            <input type="text" value={profile?.name || ''} disabled readOnly />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={profile?.email || ''} disabled readOnly />
          </label>
          <label>
            <span>Phone</span>
            <input type="text" value={profile?.phone || ''} disabled readOnly />
          </label>
          <label>
            <span>Role</span>
            <input type="text" value={roleLabel} disabled readOnly />
          </label>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
