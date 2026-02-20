import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { medicineService } from '../services/medicineService';
import { prescriptionService } from '../services/prescriptionService';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PrescriptionUploadModal from '../components/prescription/PrescriptionUploadModal';
import './MedicineDetailPage.css';

const MedicineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const prevLocationRef = useRef(location.pathname);
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState([]);
  const [sideEffects, setSideEffects] = useState([]);
  const [dosageInfo, setDosageInfo] = useState({
    adults: 'Take as directed by your healthcare provider. The usual adult dose is 1-2 tablets every 4-6 hours as needed.',
    children: 'Consult a healthcare provider for appropriate pediatric dosing.',
    elderly: 'Dosage may need adjustment for elderly patients. Consult your doctor.'
  });
  const [loadingEffects, setLoadingEffects] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState(null);

  const fetchSideEffects = async (medicineName) => {
    try {
      setLoadingEffects(true);
      // Mock data - in a real app, this would be an API call
      const mockSideEffects = [
        'Nausea',
        'Headache',
        'Dizziness',
        'Drowsiness',
        'Upset stomach',
        'Dry mouth',
        'Fatigue'
      ];
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSideEffects(mockSideEffects);
    } catch (error) {
      console.error('Error fetching side effects:', error);
      toast.warning('Could not load side effects information');
    } finally {
      setLoadingEffects(false);
    }
  };

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await medicineService.getById(id);
        setMedicine(response.data);
        setInteractionWarnings(response.data.interactionWarnings || []);

        // Set dosage info if available in the response
        if (response.data.dosageInstructions) {
          setDosageInfo(prev => ({
            ...prev,
            ...response.data.dosageInstructions
          }));
        }

        // Set side effects if available, otherwise fetch them
        if (response.data.sideEffects) {
          const effects = Array.isArray(response.data.sideEffects)
            ? response.data.sideEffects
            : typeof response.data.sideEffects === 'string'
              ? response.data.sideEffects.split(',').map(s => s.trim()).filter(Boolean)
              : [];

          if (effects.length > 0) {
            setSideEffects(effects);
          } else {
            fetchSideEffects(response.data.name);
          }
        } else {
          fetchSideEffects(response.data.name);
        }
      } catch (error) {
        console.error('Error fetching medicine:', error);
        toast.error('Failed to load medicine details');
        navigate('/medicines');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id, navigate]);

  const loadPrescriptions = React.useCallback(async () => {
    if (!medicine?.requires_prescription) return;

    setLoadingPrescriptions(true);
    try {
      const response = await prescriptionService.list();
      console.log('All prescriptions from API:', response.data.prescriptions);

      // Filter out expired prescriptions - only show available ones
      const availablePrescriptions = (response.data.prescriptions || []).filter(
        p => p.status !== 'expired' && p.status !== 'rejected'
      );

      console.log('Available prescriptions (after filter):', availablePrescriptions);
      console.log('Expired prescriptions count:', (response.data.prescriptions || []).filter(p => p.status === 'expired').length);

      setPrescriptions(availablePrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoadingPrescriptions(false);
    }
  }, [medicine?.requires_prescription]);

  // Always reload prescriptions when medicine changes or component mounts
  useEffect(() => {
    if (medicine?.requires_prescription) {
      loadPrescriptions();
    }
  }, [medicine?.requires_prescription, loadPrescriptions, id]);

  // Reload prescriptions when user navigates back to this page
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevLocationRef.current;

    // If user navigated away and came back, reload prescriptions
    if (prevPath !== currentPath && currentPath.includes('/medicines/') && medicine?.requires_prescription) {
      // Force reload with delay to ensure backend has updated
      setTimeout(() => {
        loadPrescriptions();
      }, 1000);
    }

    prevLocationRef.current = currentPath;
  }, [location.pathname, medicine?.requires_prescription, loadPrescriptions]);

  // Reload prescriptions when order is placed
  useEffect(() => {
    const handlePrescriptionUpdate = () => {
      console.log('prescriptionUpdated event received');
      if (medicine?.requires_prescription) {
        console.log('Reloading prescriptions due to prescriptionUpdated event');
        // Multiple reload attempts to ensure status is updated
        setTimeout(() => {
          console.log('Reload attempt 1 (1s delay)');
          loadPrescriptions();
        }, 1000);
        setTimeout(() => {
          console.log('Reload attempt 2 (2.5s delay)');
          loadPrescriptions();
        }, 2500);
        setTimeout(() => {
          console.log('Reload attempt 3 (4s delay)');
          loadPrescriptions();
        }, 4000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && medicine?.requires_prescription) {
        console.log('Page visibility changed to visible, reloading prescriptions');
        // Reload when page becomes visible (user comes back from order page)
        setTimeout(() => {
          loadPrescriptions();
        }, 800);
      }
    };

    const handleFocus = () => {
      if (medicine?.requires_prescription) {
        console.log('Window focus, reloading prescriptions');
        // Reload when window gets focus
        setTimeout(() => {
          loadPrescriptions();
        }, 800);
      }
    };

    window.addEventListener('prescriptionUpdated', handlePrescriptionUpdate);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('prescriptionUpdated', handlePrescriptionUpdate);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [medicine?.requires_prescription, loadPrescriptions]);

  const handleAddToCart = () => {
    if (!medicine) return;

    if (medicine.requires_prescription) {
      // Check if user has any prescription (pending or verified)
      if (prescriptions.length === 0) {
        toast.warning('This medicine requires a prescription. Please upload one first.');
        setShowPrescriptionModal(true);
        return;
      }
      // If prescription is pending, show info message
      const verifiedPrescription = prescriptions.find(p => p.status === 'verified');
      if (!verifiedPrescription) {
        toast.info('Your prescription is pending verification. You can proceed with the order, and it will be verified by the pharmacist.');
      }
    }

    if (quantity > medicine.quantity) {
      toast.error('Insufficient stock available');
      return;
    }

    setAddingToCart(true);
    addToCart(medicine, quantity);
    toast.success(`${medicine.name} added to cart!`);
    setAddingToCart(false);
  };

  const handlePrescriptionUploaded = () => {
    loadPrescriptions();
  };

  const handleViewPrescription = (prescription) => {
    setViewingPrescription(prescription);
  };

  const handleEditPrescription = () => {
    setShowPrescriptionModal(true);
  };

  const verifiedPrescription = prescriptions.find(p => p.status === 'verified');
  const hasAnyPrescription = prescriptions.length > 0;

  // Debug logs
  console.log('Current prescriptions state:', prescriptions);
  console.log('hasAnyPrescription:', hasAnyPrescription);
  console.log('verifiedPrescription:', verifiedPrescription);
  console.log('Medicine requires prescription:', medicine?.requires_prescription);

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, Math.min(medicine?.quantity || 1, quantity + delta));
    setQuantity(newQuantity);
  };

  if (loading) {
    return (
      <div className="medicine-detail-page">
        <div className="container">
          <div className="loading">Loading medicine details...</div>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="medicine-detail-page">
        <div className="container">
          <div className="not-found">Medicine not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="medicine-detail-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Products
        </button>

        <div className="medicine-detail-container">
          <div className="medicine-image-section">
            <div className="medicine-image-large">
              <img
                src={medicine.image || 'https://via.placeholder.com/600x600/20b2aa/ffffff?text=Medicine'}
                alt={medicine.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x600/20b2aa/ffffff?text=Medicine';
                }}
                loading="lazy"
              />
            </div>
          </div>

          <div className="medicine-info-section">
            <h1 className="medicine-title">{medicine.name}</h1>
            <p className="medicine-manufacturer">Manufacturer: {medicine.manufacturer || 'Generic'}</p>

            <div className="medicine-price-section">
              <span className="price-large">PKR {medicine.price?.toFixed(2) || '0.00'}</span>
              <span className="stock-info">
                {medicine.quantity > 0 ? (
                  <span className="in-stock">In Stock ({medicine.quantity} available)</span>
                ) : (
                  <span className="out-of-stock">Out of Stock</span>
                )}
              </span>
            </div>

            <div className="medicine-description">
              <h3>Description</h3>
              <p>{medicine.description || 'No description available'}</p>
            </div>

            {/* Dosage Instructions Section */}
            <Card className="info-card">
              <h3>Dosage Instructions</h3>
              <div className="dosage-section">
                <div className="dosage-category">
                  <h4>For Adults:</h4>
                  <p>{dosageInfo.adults}</p>
                </div>
                <div className="dosage-category">
                  <h4>For Children:</h4>
                  <p>{dosageInfo.children}</p>
                </div>
                <div className="dosage-category">
                  <h4>For Elderly:</h4>
                  <p>{dosageInfo.elderly}</p>
                </div>
                <p className="disclaimer">
                  <strong>Important:</strong> Always follow your healthcare provider's instructions. Do not exceed the recommended dosage.
                </p>
              </div>
            </Card>

            {/* Side Effects Section */}
            <Card className="info-card">
              <h3>Possible Side Effects</h3>
              {loadingEffects ? (
                <div className="loading-effects">Loading side effects information...</div>
              ) : sideEffects.length > 0 ? (
                <div className="side-effects-list">
                  <p>Common side effects may include:</p>
                  <ul>
                    {Array.isArray(sideEffects) && sideEffects.map((effect, index) => (
                      <li key={index}>{effect}</li>
                    ))}
                  </ul>
                  <p className="side-effects-note">
                    <strong>Seek medical attention</strong> if you experience severe side effects or allergic reactions.
                  </p>
                </div>
              ) : (
                <p>No specific side effects information available.</p>
              )}
            </Card>

            {/* Drug Interactions Section */}
            {interactionWarnings.length > 0 && (
              <Card className="info-card warning">
                <h3>Drug Interactions</h3>
                <div className="interactions-warning">
                  <p>This medicine may interact with:</p>
                  <ul>
                    {interactionWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                  <p className="interaction-note">
                    <strong>Important:</strong> Inform your doctor about all medications you are currently taking.
                  </p>
                </div>
              </Card>
            )}

            <div className="medicine-details-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{medicine.category || 'N/A'}</span>
              </div>
              {medicine.manufacturingDate && (
                <div className="detail-item">
                  <span className="detail-label">Manufacturing Date:</span>
                  <span className="detail-value">
                    {new Date(medicine.manufacturingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              {medicine.expiryDate && (
                <div className="detail-item">
                  <span className="detail-label">Expiry Date:</span>
                  <span className="detail-value expiry-date">
                    {new Date(medicine.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Prescription Required:</span>
                <span className="detail-value">
                  {medicine.requires_prescription ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {medicine.quantity > 0 && (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(medicine.quantity, val)));
                      }}
                      min="1"
                      max={medicine.quantity}
                      className="quantity-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= medicine.quantity}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={addingToCart || medicine.quantity === 0}
                  className="add-to-cart-button"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            )}

            {medicine.requires_prescription && (
              <>
                {hasAnyPrescription ? (
                  <Card className="prescription-uploaded-notice">
                    <div className="prescription-status-header">
                      <strong>✅ Prescription Uploaded</strong>
                      <span className={`prescription-status-badge ${verifiedPrescription ? 'verified' : 'pending'}`}>
                        {verifiedPrescription ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <p>
                      {verifiedPrescription
                        ? 'Your prescription has been verified. You can now add this medicine to your cart.'
                        : 'Your prescription has been uploaded and is pending verification. You can proceed with your order, and the pharmacist will verify your prescription during processing. Note: After placing an order, you will need to upload a new prescription for future orders.'}
                    </p>
                    <div className="prescription-actions">
                      {verifiedPrescription && (
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleViewPrescription(verifiedPrescription)}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="small"
                        onClick={handleEditPrescription}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => setShowPrescriptionModal(true)}
                      >
                        {verifiedPrescription ? 'Upload New' : 'View Prescriptions'}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="prescription-notice">
                    <strong>⚠️ Prescription Required</strong>
                    <p>This medicine requires a valid prescription. Please upload your prescription before checkout. Note: You will need to upload a new prescription for each new order.</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowPrescriptionModal(true)}
                    >
                      Upload Prescription
                    </Button>
                  </Card>
                )}
              </>
            )}

            {interactionWarnings.length > 0 && (
              <Card className="interaction-alert">
                <strong>⚠️ Interaction Warning</strong>
                <ul>
                  {interactionWarnings.map((warning, index) => (
                    <li key={index}>
                      <span className={`severity ${warning.severity}`}>{warning.severity}</span>
                      <span className="interaction-text">
                        {warning.description ||
                          `${warning.medicines?.map((med) => med.name).join(' and ')} may interact.`}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>

      <PrescriptionUploadModal
        isOpen={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
        }}
        onUploadSuccess={() => {
          loadPrescriptions();
        }}
      />

      {/* View Prescription Modal */}
      {viewingPrescription && (
        <div className="view-prescription-modal-overlay" onClick={() => setViewingPrescription(null)}>
          <div className="view-prescription-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="view-prescription-modal-header">
              <h3>Prescription Details</h3>
              <button className="modal-close-btn" onClick={() => setViewingPrescription(null)}>×</button>
            </div>
            <div className="view-prescription-modal-body">
              <div className="prescription-view-info">
                <div className="info-row">
                  <strong>File Name:</strong>
                  <span>{viewingPrescription.fileName}</span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`prescription-status-badge ${viewingPrescription.status}`}>
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
            <div className="view-prescription-modal-footer">
              <Button variant="outline" onClick={() => setViewingPrescription(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineDetailPage;

