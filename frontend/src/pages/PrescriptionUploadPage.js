import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PrescriptionUpload from '../components/prescription/PrescriptionUpload';
import { prescriptionService } from '../services/prescriptionService';
import './PrescriptionUploadPage.css';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const PrescriptionUploadPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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
              <div className="table-row" key={item.id}>
                <div>
                  <div className="file-name">{item.fileName}</div>
                  <div className="file-meta">
                    {item.fileMimeType} · {formatFileSize(item.fileSize)}
                  </div>
                </div>
                <div>
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                </div>
                <div className="notes-cell">{item.notes || '—'}</div>
                <div>{new Date(item.uploadedAt).toLocaleString()}</div>
                <div>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="download-link"
                  >
                    View
                  </a>
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

