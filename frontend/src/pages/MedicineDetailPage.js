import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { medicineService } from '../services/medicineService';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import './MedicineDetailPage.css';

const MedicineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState([]);
  const [interactionNotes, setInteractionNotes] = useState([]);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await medicineService.getById(id);
        setMedicine(response.data);
        setInteractionWarnings(response.data.interactionWarnings || []);
        setInteractionNotes(response.data.interactionNotes || []);
      } catch (error) {
        toast.error('Failed to load medicine details');
        navigate('/medicines');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!medicine) return;
    
    if (medicine.requires_prescription) {
      toast.warning('This medicine requires a prescription. Please upload one first.');
      navigate('/prescriptions/upload');
      return;
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
            <p className="medicine-brand">Brand: {medicine.brand || 'Generic'}</p>
            
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

            {medicine.dosageInstructions && (
              <Card className="info-card">
                <h3>Dosage Instructions</h3>
                <p>{medicine.dosageInstructions}</p>
              </Card>
            )}

            {medicine.sideEffects && (
              <Card className="info-card">
                <h3>Possible Side Effects</h3>
                <p>{medicine.sideEffects}</p>
              </Card>
            )}

            {interactionNotes.length > 0 && (
              <Card className="info-card">
                <h3>Interaction Notes</h3>
                <ul className="notes-list">
                  {interactionNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="medicine-details-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{medicine.category || 'N/A'}</span>
              </div>
              {medicine.expiry_date && (
                <div className="detail-item">
                  <span className="detail-label">Expiry Date:</span>
                  <span className="detail-value">
                    {new Date(medicine.expiry_date).toLocaleDateString()}
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
              <Card className="prescription-notice">
                <strong>⚠️ Prescription Required</strong>
                <p>This medicine requires a valid prescription. Please upload your prescription before checkout.</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/prescriptions/upload')}
                >
                  Upload Prescription
                </Button>
              </Card>
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
    </div>
  );
};

export default MedicineDetailPage;

