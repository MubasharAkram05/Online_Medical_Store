import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { prescriptionService } from '../../services/prescriptionService';
import Button from '../common/Button';
import Card from '../common/Card';
import './PrescriptionModal.css';

const PrescriptionModal = ({
  isOpen,
  onClose,
  onPrescriptionSelect,
  medicine = null
}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrescriptions();
    }
  }, [isOpen, showAll]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      // If showAll is true, we pass null to medicineId to get all user prescriptions
      const response = await prescriptionService.list(showAll ? null : medicine?.id);
      // Only show pending or verified prescriptions
      const filtered = (response.data.prescriptions || []).filter(
        p => p.status === 'verified' || p.status === 'pending'
      );
      setPrescriptions(filtered);
    } catch (error) {
      toast.error('Unable to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleConfirm = () => {
    if (!selectedPrescription) {
      toast.error('Please select a prescription.');
      return;
    }
    // Inform user that even reused prescriptions need admin re-approval
    if (selectedPrescription.status === 'verified') {
      toast.info('This prescription was previously verified. It will be re-validated for this order.');
    }
    onPrescriptionSelect(selectedPrescription);
    onClose();
  };

  const handleUploadNew = () => {
    onClose();
    window.location.href = '/prescriptions/upload';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <Card className="prescription-modal">
          <div className="modal-header">
            <div className="header-top">
              <h2>Select Prescription</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            {medicine && (
              <p>
                Selection for <strong>{medicine.name}</strong>:
              </p>
            )}
            <div className="tab-container">
              <button
                className={`tab-btn ${!showAll ? 'active' : ''}`}
                onClick={() => setShowAll(false)}
              >
                Recommended (for this medicine)
              </button>
              <button
                className={`tab-btn ${showAll ? 'active' : ''}`}
                onClick={() => setShowAll(true)}
              >
                Reuse Previous Prescriptions
              </button>
            </div>
          </div>

          <div className="modal-content">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your prescriptions...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <p>No suitable prescriptions found {showAll ? '' : 'for this specific medicine'}.</p>
                <p className="empty-hint">You can try the <strong>"Reuse Previous"</strong> tab or upload a new one specifically for this product.</p>
              </div>
            ) : (
              <div className="prescription-list">
                {prescriptions.map((prescription) => {
                  const isMatchingMedicine = medicine && String(prescription.medicineId) === String(medicine.id);
                  const isGeneral = !prescription.medicineId;

                  return (
                    <div
                      key={prescription.id}
                      className={`prescription-item ${selectedPrescription?.id === prescription.id ? 'selected' : ''
                        } ${isMatchingMedicine ? 'matching' : ''}`}
                      onClick={() => handleSelect(prescription)}
                    >
                      <div className="prescription-info">
                        <div className="prescription-name-row">
                          <span className="file-icon">📄</span>
                          <span className="prescription-name">{prescription.fileName}</span>
                        </div>
                        <div className="prescription-meta">
                          <span className="meta-tag date">
                            {new Date(prescription.uploadedAt).toLocaleDateString()}
                          </span>
                          <span className={`meta-tag medicine-name ${isMatchingMedicine ? 'match' : ''}`}>
                            {isMatchingMedicine ? '✓ Matches this product' :
                              isGeneral ? 'General Prescription' :
                                `For: ${prescription.medicineName || 'Other Medicine'}`}
                          </span>
                        </div>
                      </div>
                      <div className="prescription-status">
                        <span className={`status-badge-mini status-${prescription.status}`}>
                          {prescription.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="modal-actions">
              <Button variant="outline" onClick={handleUploadNew} className="upload-btn">
                <span>➕</span> Upload for this Medicine
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!selectedPrescription || prescriptions.length === 0}
                className="apply-btn"
              >
                Use Selected Prescription
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrescriptionModal;
