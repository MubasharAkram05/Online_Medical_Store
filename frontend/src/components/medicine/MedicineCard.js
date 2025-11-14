import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../../context/CartContext';
import Button from '../common/Button';
import './MedicineCard.css';

const MedicineCard = ({ medicine }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (medicine.requires_prescription) {
      toast.warning('This medicine requires a prescription. Please upload one first.');
      return;
    }
    
    if (medicine.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    addToCart(medicine, 1);
    toast.success(`${medicine.name} added to cart!`);
  };

  return (
    <Link to={`/medicines/${medicine.id}`} className="medicine-card-link">
      <div className="medicine-card">
        <div className="medicine-image">
          <img 
            src={medicine.image || 'https://via.placeholder.com/400x400/20b2aa/ffffff?text=Medicine'} 
            alt={medicine.name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400/20b2aa/ffffff?text=Medicine';
            }}
            loading="lazy"
          />
        </div>
        <div className="medicine-info">
          <h3 className="medicine-name">{medicine.name}</h3>
          <p className="medicine-description">{medicine.description || 'Quality healthcare product'}</p>
          <div className="medicine-details">
            <span className="medicine-price">PKR {medicine.price?.toFixed(2) || '0.00'}</span>
            <span className="medicine-stock">Stock: {medicine.stock ?? 0}</span>
          </div>
          <Button 
            variant="primary" 
            size="small" 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default MedicineCard;

