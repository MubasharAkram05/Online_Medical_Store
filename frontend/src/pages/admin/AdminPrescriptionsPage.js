import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import { adminService } from '../../services/adminService';
import { useDialog } from '../../context/DialogContext';
import './AdminPrescriptionsPage.css';

const FILTER_OPTIONS = ['all', 'pending', 'approved', 'rejected'];
const UPDATE_STATUS_OPTIONS = ['pending', 'approved', 'rejected'];
const RANGE_STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected'];

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
  const dialog = useDialog();
  const [prescriptions, setPrescriptions] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [showDeleteRangeModal, setShowDeleteRangeModal] = useState(false);
  const [rangeForm, setRangeForm] = useState({
    fromDate: '',
    toDate: '',
    status: 'all'
  });
  const [rangePreview, setRangePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const resetDeleteRangeState = () => {
    setRangeForm({
      fromDate: '',
      toDate: '',
      status: 'all'
    });
    setRangePreview(null);
    setPreviewLoading(false);
    setDeleteLoading(false);
  };

  const openDeleteRangeModal = () => {
    resetDeleteRangeState();
    setShowDeleteRangeModal(true);
  };

  const closeDeleteRangeModal = () => {
    if (previewLoading || deleteLoading) return;
    setShowDeleteRangeModal(false);
  };

  const handleRangeFieldChange = (field, value) => {
    setRangeForm((prev) => ({ ...prev, [field]: value }));
    setRangePreview(null);
  };

  const handlePreviewRangeDeletion = async () => {
    if (!rangeForm.fromDate || !rangeForm.toDate) return;
    try {
      setPreviewLoading(true);
      const response = await adminService.previewDeletePrescriptionRange({
        fromDate: rangeForm.fromDate,
        toDate: rangeForm.toDate,
        status: rangeForm.status
      });
      setRangePreview(response.data?.summary || null);
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to preview deletion range.';
      await dialog.alert({
        title: 'Error',
        message,
        variant: 'danger',
        confirmText: 'Close'
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteRange = async () => {
    if (!rangePreview || rangePreview.deletableCount < 1) return;
    const confirmed = await dialog.confirm({
      title: 'Confirmation',
      message: `Are you sure you want to delete prescriptions in this date range? ${rangePreview.deletableCount} record(s) will be deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      const response = await adminService.deletePrescriptionRange({
        fromDate: rangeForm.fromDate,
        toDate: rangeForm.toDate,
        status: rangeForm.status
      });
      const summary = response.data?.summary || {};
      const deletedIds = Array.isArray(response.data?.deletedIds) ? response.data.deletedIds : [];

      if (deletedIds.length > 0) {
        setPrescriptions((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
      }

      await loadPrescriptions(statusFilter, { silent: true });

      if ((summary.totalMatched || 0) === 0) {
        await dialog.alert({
          title: 'No Records Found',
          message: 'No prescriptions found for this date range.',
          variant: 'warning',
          confirmText: 'Close'
        });
      } else if ((summary.blockedCount || 0) > 0 && (summary.deletedCount || 0) > 0) {
        await dialog.alert({
          title: 'Partial Deletion',
          message: 'Some prescriptions are linked to active orders and were not deleted.',
          variant: 'warning',
          confirmText: 'Close'
        });
      } else if ((summary.deletedCount || 0) === 0) {
        await dialog.alert({
          title: 'Not Deleted',
          message: 'No prescriptions were deleted for this selection.',
          variant: 'warning',
          confirmText: 'Close'
        });
      } else {
        await dialog.alert({
          title: 'Success',
          message: 'Selected prescriptions deleted successfully.',
          variant: 'success',
          confirmText: 'OK'
        });
      }

      setShowDeleteRangeModal(false);
      resetDeleteRangeState();
    } catch (error) {
      await dialog.alert({
        title: 'Error',
        message: error.response?.data?.error?.message || 'Unable to delete prescriptions in this range.',
        variant: 'danger',
        confirmText: 'Close'
      });
    } finally {
      setDeleteLoading(false);
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
            <button
              type="button"
              className="delete-range-button"
              onClick={openDeleteRangeModal}
            >
              Delete Prescriptions by Date 📅
            </button>
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

      {showDeleteRangeModal && (
        <div className="range-modal-overlay" onClick={closeDeleteRangeModal}>
          <div className="range-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Custom Range</h3>
            <p>Select a date range and optional status filter before deletion.</p>

            <div className="range-form-grid">
              <label>
                <span>From Date</span>
                <input
                  type="date"
                  value={rangeForm.fromDate}
                  onChange={(e) => handleRangeFieldChange('fromDate', e.target.value)}
                />
              </label>
              <label>
                <span>To Date</span>
                <input
                  type="date"
                  value={rangeForm.toDate}
                  onChange={(e) => handleRangeFieldChange('toDate', e.target.value)}
                />
              </label>
              <label className="range-form-full">
                <span>Status</span>
                <select
                  value={rangeForm.status}
                  onChange={(e) => handleRangeFieldChange('status', e.target.value)}
                >
                  {RANGE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {rangePreview && (
              <div className="range-preview-summary">
                <strong>{rangePreview.deletableCount || 0}</strong> of{' '}
                <strong>{rangePreview.totalMatched || 0}</strong> matched prescriptions can be deleted.
                {(rangePreview.blockedCount || 0) > 0 && (
                  <div className="range-preview-note">
                    {rangePreview.blockedCount} linked to active orders will be skipped.
                  </div>
                )}
              </div>
            )}

            <div className="range-modal-actions">
              <button
                type="button"
                className="range-btn range-btn-secondary"
                onClick={closeDeleteRangeModal}
                disabled={previewLoading || deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="range-btn range-btn-primary"
                onClick={handlePreviewRangeDeletion}
                disabled={!rangeForm.fromDate || !rangeForm.toDate || previewLoading || deleteLoading}
              >
                {previewLoading ? 'Checking...' : 'Check Records'}
              </button>
              <button
                type="button"
                className="range-btn range-btn-danger"
                onClick={handleDeleteRange}
                disabled={
                  !rangeForm.fromDate ||
                  !rangeForm.toDate ||
                  !rangePreview ||
                  (rangePreview.deletableCount || 0) < 1 ||
                  previewLoading ||
                  deleteLoading
                }
              >
                {deleteLoading ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptionsPage;
