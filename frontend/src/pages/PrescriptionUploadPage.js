import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PrescriptionUpload from '../components/prescription/PrescriptionUpload';
import { prescriptionService } from '../services/prescriptionService';
import { useCart } from '../context/CartContext';
import { useDialog } from '../context/DialogContext';
import './PrescriptionUploadPage.css';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const PrescriptionUploadPage = () => {
  const { confirm } = useDialog();
  const { orderPrescription, setOrderPrescription } = useCart();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [removingIds, setRemovingIds] = useState([]);

  const loadPrescriptions = async () => {
    setFetching(true);
    try {
      const response = await prescriptionService.list();
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      toast.error('Unable to load prescriptions.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const handleUpload = async (formData, reset) => {
    setLoading(true);
    try {
      const response = await prescriptionService.upload(formData);
      toast.success('Prescription uploaded successfully.');
      setPrescriptions((prev) => [response.data.prescription, ...prev]);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prescription) => {
    setEditingId(prescription.id);
    setEditNotes(prescription.notes || '');
  };

  const handleSaveEdit = async () => {
    try {
      if (editFile) {
        // If new file is uploaded, create a new prescription
        const formData = new FormData();
        formData.append('file', editFile);
        formData.append('notes', editNotes);

        await prescriptionService.upload(formData);
        toast.success('New prescription uploaded successfully.');

        // Try to delete old one; if linked to active order, keep it and inform user.
        try {
          await prescriptionService.delete(editingId);
        } catch (deleteError) {
          const message = deleteError.response?.data?.error?.message || '';
          if (message.includes('linked to an active order')) {
            toast.info('New prescription uploaded. Old prescription is linked to an active order and cannot be deleted.');
          } else {
            throw deleteError;
          }
        }
      } else {
        // Only update notes
        await prescriptionService.update(editingId, editNotes);
        toast.success('Prescription notes updated successfully.');
        setPrescriptions((prev) =>
          prev.map((p) =>
            p.id === editingId ? { ...p, notes: editNotes } : p
          )
        );
      }
      
      // Reload prescriptions to get the latest data
      await loadPrescriptions();
      setEditingId(null);
      setEditNotes('');
      setEditFile(null);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Update failed. Try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNotes('');
    setEditFile(null);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Confirmation',
      message: 'Are you sure you want to delete this prescription?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await prescriptionService.delete(id);
      toast.success('Prescription deleted successfully.');
      if (orderPrescription && String(orderPrescription.id) === String(id)) {
        setOrderPrescription(null);
      }
      setRemovingIds((prev) => [...prev, id]);
      setTimeout(() => {
        setPrescriptions((prev) => prev.filter((p) => p.id !== id));
        setRemovingIds((prev) => prev.filter((pid) => pid !== id));
      }, 220);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Delete failed. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prescription Upload</h1>
        <p>Submit prescriptions for medicines that require pharmacist approval.</p>
      </div>

      <PrescriptionUpload onUpload={handleUpload} loading={loading} />

      <div className="prescription-list">
        <div className="list-header">
          <h2>Your Prescriptions</h2>
          {fetching && <span className="loading-indicator">Loading...</span>}
        </div>
        {prescriptions.length === 0 ? (
          <div className="empty-state">
            <p>No prescriptions uploaded yet.</p>
          </div>
        ) : (
          <div className="prescription-table">
            <div className="table-row table-header">
              <div>File</div>
              <div>Status</div>
              <div>Notes</div>
              <div>Uploaded</div>
              <div>Actions</div>
            </div>
            {prescriptions.map((item) => (
              <div
                className={`table-row ${removingIds.includes(item.id) ? 'removing' : ''}`}
                key={item.id}
              >
                <div>
                  <div className="file-name">{item.fileName}</div>
                  <div className="file-meta">
                    {item.fileMimeType} · {formatFileSize(item.fileSize)}
                  </div>
                </div>
                <div>
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                </div>
                <div className="notes-cell">
                  {editingId === item.id ? (
                    <div className="edit-notes">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes..."
                        rows={2}
                      />
                      <div className="file-upload-section">
                        <label className="file-upload-label">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setEditFile(e.target.files[0])}
                            className="file-input"
                          />
                          <span className="file-upload-text">
                            {editFile ? `New file: ${editFile.name}` : 'Choose new file (optional)'}
                          </span>
                        </label>
                        {editFile && (
                          <div className="file-info">
                            <span className="file-size">({formatFileSize(editFile.size)})</span>
                            <button
                              type="button"
                              onClick={() => setEditFile(null)}
                              className="remove-file-btn"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="edit-actions">
                        <button onClick={handleSaveEdit} className="save-btn">
                          Save
                        </button>
                        <button onClick={handleCancelEdit} className="cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span>{item.notes || '—'}</span>
                  )}
                </div>
                <div>{new Date(item.uploadedAt).toLocaleString()}</div>
                <div className="actions-cell">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="view-link"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleEdit(item)}
                    className="edit-btn"
                    disabled={editingId !== null || deletingId === item.id}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="delete-btn"
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionUploadPage;

