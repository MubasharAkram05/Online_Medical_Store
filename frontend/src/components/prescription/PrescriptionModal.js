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
  medicinesRequiringPrescription = [] 
}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPrescriptions();
    }
  }, [isOpen]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await prescriptionService.list();
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      toast.error('Unable to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (prescription) => {
    if (prescription.status !== 'verified') {
      toast.warning('Only verified prescriptions can be used for checkout.');
      return;
    }
    setSelectedPrescription(prescription);
  };

  const handleConfirm = () => {
    if (!selectedPrescription) {
      toast.error('Please select a prescription.');
      return;
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
            <h2>Select Prescription</h2>
            <p>
              The following medicines require a prescription:
              <strong>
                {medicinesRequiringPrescription.map(m => m.name).join(', ')}
              </strong>
            </p>
          </div>

          <div className="modal-content">
            {loading ? (
              <div className="loading-state">Loading prescriptions...</div>
            ) : prescriptions.length === 0 ? (
              <div className="empty-state">
                <p>No prescriptions found.</p>
                <p>Please upload a prescription first.</p>
              </div>
            ) : (
              <div className="prescription-list">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className={`prescription-item ${
                      selectedPrescription?.id === prescription.id ? 'selected' : ''
                    }`}
                    onClick={() => handleSelect(prescription)}
                  >
                    <div className="prescription-info">
                      <div className="prescription-name">{prescription.fileName}</div>
                      <div className="prescription-meta">
                        Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="prescription-status">
                      <span className={`status-badge status-${prescription.status}`}>
                        {prescription.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="modal-actions">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleUploadNew}>
                Upload New Prescription
              </Button>
              <Button 
                variant="primary" 
                onClick={handleConfirm}
                disabled={!selectedPrescription || prescriptions.length === 0}
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrescriptionModal;
