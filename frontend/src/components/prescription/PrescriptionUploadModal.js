import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { prescriptionService } from '../../services/prescriptionService';
import PrescriptionUpload from './PrescriptionUpload';
import Button from '../common/Button';
import { useDialog } from '../../context/DialogContext';
import './PrescriptionUploadModal.css';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const PrescriptionUploadModal = ({ isOpen, onClose, onUploadSuccess, medicine = null }) => {
  const { confirm } = useDialog();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [viewingPrescription, setViewingPrescription] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPrescriptions();
    }
  }, [isOpen]);

  const loadPrescriptions = async () => {
    setFetching(true);
    try {
      // Pass medicine_id to API if provided to filter in backend
      const response = await prescriptionService.list(medicine?.id);
      // Show all prescriptions for the selected scope
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      toast.error('Unable to load prescriptions.');
    } finally {
      setFetching(false);
    }
  };

  const handleUpload = async (formData, reset) => {
    // Append medicineId if context exists
    if (medicine?.id) {
      formData.append('medicineId', medicine.id);
    }

    setLoading(true);
    try {
      const response = await prescriptionService.upload(formData);
      toast.success('Prescription uploaded successfully.');
      setPrescriptions((prev) => [response.data.prescription, ...prev]);
      reset();
      await loadPrescriptions();
      // Notify parent component about successful upload
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prescription) => {
    setEditingId(prescription.id);
    setEditNotes(prescription.notes || '');
    setEditFile(null);
  };

  const handleSaveEdit = async () => {
    try {
      if (editFile) {
        // If new file is uploaded, create a new prescription
        const formData = new FormData();
        formData.append('file', editFile);
        formData.append('notes', editNotes);

        await prescriptionService.upload(formData);
        toast.success('Prescription updated successfully with new file.');

        // Delete the old prescription
        await prescriptionService.delete(editingId);
      } else {
        // Only update notes
        await prescriptionService.update(editingId, editNotes);
        toast.success('Prescription notes updated successfully.');
      }

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
      await prescriptionService.delete(id);
      toast.success('Prescription deleted successfully.');
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Delete failed. Try again.');
    }
  };

  const handleView = (prescription) => {
    setViewingPrescription(prescription);
  };

  const closeViewModal = () => {
    setViewingPrescription(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="prescription-modal-overlay" onClick={onClose}>
        <div className="prescription-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="prescription-modal-header">
            <h2>Upload Prescription</h2>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>

          <div className="prescription-modal-body">
            <div className="upload-section">
              <h3>Upload New Prescription</h3>
              <PrescriptionUpload onUpload={handleUpload} loading={loading} />
            </div>

            <div className="prescriptions-list-section">
              <div className="list-header">
                <h3>Your Prescriptions</h3>
                {fetching && <span className="loading-indicator">Loading...</span>}
              </div>

              {prescriptions.length === 0 ? (
                <div className="empty-state">
                  <p>No prescriptions uploaded yet.</p>
                </div>
              ) : (
                <div className="prescriptions-table">
                  <div className="table-row table-header">
                    <div>File Name</div>
                    <div>Status</div>
                    <div>Notes</div>
                    <div>Uploaded</div>
                    <div>Actions</div>
                  </div>
                  {prescriptions.map((item) => (
                    <div className="table-row" key={item.id}>
                      <div>
                        <div className="file-name">{item.fileName}</div>
                        <div className="file-meta">
                          {item.fileMimeType} · {formatFileSize(item.fileSize)}
                        </div>
                      </div>
                      <div>
                        <span className={`status-badge status-${item.status}`}>
                          {item.status}
                        </span>
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
                        <button
                          onClick={() => handleView(item)}
                          className="action-btn view-btn"
                          title="View Prescription"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="action-btn edit-btn"
                          disabled={editingId !== null && editingId !== item.id}
                          title="Edit Prescription"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="action-btn delete-btn"
                          disabled={item.status === 'approved' || item.status === 'verified'}
                          title="Delete Prescription"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="prescription-modal-footer">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* View Prescription Modal */}
      {viewingPrescription && (
        <div className="view-modal-overlay" onClick={closeViewModal}>
          <div className="view-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h3>Prescription Details</h3>
              <button className="modal-close-btn" onClick={closeViewModal}>×</button>
            </div>
            <div className="view-modal-body">
              <div className="prescription-view-info">
                <div className="info-row">
                  <strong>File Name:</strong>
                  <span>{viewingPrescription.fileName}</span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${viewingPrescription.status}`}>
                    {viewingPrescription.status}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Uploaded:</strong>
                  <span>{new Date(viewingPrescription.uploadedAt).toLocaleString()}</span>
                </div>
                {viewingPrescription.notes && (
                  <div className="info-row">
                    <strong>Notes:</strong>
                    <span>{viewingPrescription.notes}</span>
                  </div>
                )}
              </div>
              <div className="prescription-preview">
                {viewingPrescription.fileMimeType?.startsWith('image/') ? (
                  <img
                    src={viewingPrescription.fileUrl}
                    alt="Prescription"
                    className="prescription-image"
                  />
                ) : (
                  <iframe
                    src={viewingPrescription.fileUrl}
                    title="Prescription Preview"
                    className="prescription-iframe"
                  />
                )}
                <div className="preview-actions">
                  <a
                    href={viewingPrescription.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="open-link-btn"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
            <div className="view-modal-footer">
              <Button variant="outline" onClick={closeViewModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrescriptionUploadModal;
