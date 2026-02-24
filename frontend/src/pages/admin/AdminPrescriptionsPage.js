import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import { adminService } from '../../services/adminService';
import './AdminPrescriptionsPage.css';

const FILTER_OPTIONS = ['all', 'pending', 'approved', 'rejected'];
const UPDATE_STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

const formatStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (normalized === 'all') return 'All';
  if (normalized === 'approved' || normalized === 'verified') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  return 'Pending';
};

const normalizeStatus = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (normalized === 'approved' || normalized === 'verified') return 'approved';
  if (normalized === 'rejected') return 'rejected';
  return 'pending';
};

const AdminPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const hasLoadedOnce = useRef(false);

  const loadPrescriptions = async (status, options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setListLoading(true);
      } else {
        setInitialLoading(true);
      }
      const response = await adminService.getPrescriptions(
        status && status !== 'all' ? { status } : undefined
      );
      setPrescriptions(response.data?.prescriptions || []);
    } catch (error) {
      toast.error('Unable to load prescriptions.');
    } finally {
      if (silent) {
        setListLoading(false);
      } else {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    const silent = hasLoadedOnce.current;
    loadPrescriptions(statusFilter, { silent });
    hasLoadedOnce.current = true;
  }, [statusFilter]);

  const handleUpdate = async (id, status) => {
    try {
      setUpdatingId(id);
      const response = await adminService.updatePrescriptionStatus(id, { status });
      const updatedPrescription = response.data?.prescription;
      toast.success('Prescription updated.');

      if (updatedPrescription) {
        setPrescriptions((prev) => {
          const next = prev.map((item) => (item.id === id ? updatedPrescription : item));
          if (statusFilter !== 'all') {
            return next.filter((item) => normalizeStatus(item.status) === statusFilter);
          }
          return next;
        });
      } else {
        await loadPrescriptions(statusFilter, { silent: true });
      }

      if (status === 'approved' && typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
        }, 500);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('prescriptionUpdated'));
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update prescription.');
    } finally {
      setUpdatingId(null);
    }
  };

  const baseUploadsUrl = React.useMemo(() => {
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}/uploads`;
  }, []);

  if (initialLoading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="admin-loading">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

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
              {FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status)}
                </option>
              ))}
            </select>
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
              {listLoading && (
                <tr>
                  <td colSpan={5} className="table-loading">
                    Loading prescriptions...
                  </td>
                </tr>
              )}
              {prescriptions.map((prescription) => {
                const status = normalizeStatus(prescription.status);
                return (
                  <tr key={prescription.id}>
                    <td>
                      <div className="table-title">{prescription.userName}</div>
                      <div className="table-subtitle">{prescription.userEmail}</div>
                    </td>
                    <td>{new Date(prescription.uploadedAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${status}`}>
                        {formatStatusLabel(status)}
                      </span>
                    </td>
                    <td>{prescription.notes || '-'}</td>
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
                        value={status}
                        onChange={(e) => handleUpdate(prescription.id, e.target.value)}
                        disabled={updatingId === prescription.id}
                      >
                        {UPDATE_STATUS_OPTIONS.map((optionStatus) => (
                          <option key={optionStatus} value={optionStatus}>
                            {formatStatusLabel(optionStatus)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {prescriptions.length === 0 && (
            <div className="empty-state">No prescriptions available for this filter.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPrescriptionsPage;
