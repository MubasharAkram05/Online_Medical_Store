import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import './AdminPrescriptionsPage.css';

const STATUS_OPTIONS = ['pending', 'verified', 'rejected', 'expired'];

const AdminPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [updatingId, setUpdatingId] = useState(null);

  const loadPrescriptions = async (status) => {
    try {
      setLoading(true);
      const response = await adminService.getPrescriptions(status ? { status } : undefined);
      setPrescriptions(response.data?.prescriptions || []);
    } catch (error) {
      toast.error('Unable to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions(statusFilter);
  }, [statusFilter]);

  const handleUpdate = async (id, status) => {
    try {
      setUpdatingId(id);
      await adminService.updatePrescriptionStatus(id, { status });
      toast.success('Prescription updated.');
      await loadPrescriptions(statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update prescription.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="admin-loading">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

  const baseUploadsUrl = React.useMemo(() => {
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return apiBase.replace(/\/api$/, '');
  }, []);

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Prescription Verification</h1>
            <p>Review and update prescription submissions.</p>
          </div>
          <div className="filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button variant="outline" size="small" onClick={() => loadPrescriptions(statusFilter)}>
              Refresh
            </Button>
          </div>
        </div>

        <Card className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td>
                    <div className="table-title">{prescription.userName}</div>
                    <div className="table-subtitle">{prescription.userEmail}</div>
                  </td>
                  <td>{new Date(prescription.uploadedAt).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${prescription.status}`}>
                      {prescription.status}
                    </span>
                  </td>
                  <td>{prescription.notes || '—'}</td>
                  <td className="table-actions">
                    <a
                      className="link-button"
                      href={`${baseUploadsUrl}/${prescription.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                    <select
                      value={prescription.status}
                      onChange={(e) => handleUpdate(prescription.id, e.target.value)}
                      disabled={updatingId === prescription.id}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {prescriptions.length === 0 && (
            <div className="empty-state">No prescriptions in this status.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPrescriptionsPage;

