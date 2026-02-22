import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { medicineService } from '../services/medicineService';
import { prescriptionService } from '../services/prescriptionService';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PrescriptionModal from '../components/prescription/PrescriptionModal';
import MedicineInfoCard from '../components/medicine/MedicineInfoCard';
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

  // Force scroll to top when page loads
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    
    // Use requestAnimationFrame to ensure it happens after any async rendering
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    };

    requestAnimationFrame(() => {
      scrollToTop();
      // Double-check after a short delay to catch any delayed renders
      setTimeout(scrollToTop, 100);
    });

    // Monitor for a brief period to catch any delayed scrolls (only if scroll position changes)
    let lastScrollY = 0;
    const scrollMonitor = setInterval(() => {
      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollY > 0 && currentScrollY !== lastScrollY) {
        window.scrollTo(0, 0);
      }
      lastScrollY = currentScrollY;
    }, 100);

    // Clean up after 1 second
    const cleanup = setTimeout(() => {
      clearInterval(scrollMonitor);
    }, 1000);

    return () => {
      clearInterval(scrollMonitor);
      clearTimeout(cleanup);
    };
  }, [id]);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await medicineService.getById(id);
        setMedicine(response.data);
        setInteractionWarnings(response.data.interactionWarnings || []);
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

  const handleAddToCart = () => {
    if (!medicine) return;

    if (quantity > medicine.quantity) {
      toast.error('Insufficient stock available');
      return;
    }

    setAddingToCart(true);
    addToCart(medicine, Number(quantity));
    toast.success(`${medicine.name} added to cart!`);

    // Proactively warn about prescription if required, though it will be handled in cart
    if (medicine.requires_prescription) {
      toast.info('This medicine requires a prescription. Please upload it in the cart.');
    }

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
        <button 
          onClick={() => {
            navigate('/medicines');
          }} 
          className="back-button"
        >
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
              <div
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: medicine.description || 'No description available' }}
              />
            </div>

            {/* Dosage Instructions Section */}
            <MedicineInfoCard
              title="Dosage Instructions"
              content={medicine.dosageInstructions}
              type="dosage"
            />

            {/* Side Effects Section */}
            <MedicineInfoCard
              title="Possible Side Effects"
              content={medicine.sideEffects}
              type="sideEffects"
            />

            {/* Drug Interactions Section */}
            {interactionWarnings.length > 0 && typeof interactionWarnings[0] === 'string' && (
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
                  {medicine.requires_prescription ? (
                    <span className="rx-required-label">Yes (Upload in Cart)</span>
                  ) : 'No'}
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

            {interactionWarnings.length > 0 && typeof interactionWarnings[0] === 'object' && (
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

