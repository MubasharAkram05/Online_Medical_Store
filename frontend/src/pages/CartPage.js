import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { medicineService } from '../services/medicineService';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const [interactionWarnings, setInteractionWarnings] = useState([]);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (cartItems.length < 2) {
        setInteractionWarnings([]);
        return;
      }

      try {
        const ids = cartItems.map((item) => item.id);
        const response = await medicineService.checkInteractions(ids);
        setInteractionWarnings(response.data?.warnings || []);
      } catch (error) {
        setInteractionWarnings([]);
        toast.error('Unable to check medicine interactions at the moment.');
      }
    };

    fetchInteractions();
  }, [cartItems]);

  const handleQuantityChange = (medicineId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
    } else {
      updateQuantity(medicineId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1 className="page-title">Shopping Cart</h1>
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/medicines">
              <Button variant="primary" size="large">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart</h1>

        {interactionWarnings.length > 0 && (
          <Card className="cart-warning-card">
            <div className="warning-header">
              <span className="warning-icon">⚠️</span>
              <div>
                <h2>Potential Medicine Interactions Detected</h2>
                <p>Please review these warnings before proceeding to checkout.</p>
              </div>
            </div>
            <ul className="warning-list">
              {interactionWarnings.map((warning, index) => (
                <li key={index}>
                  <span className={`severity ${warning.severity}`}>{warning.severity}</span>
                  <span className="warning-text">
                    {warning.description ||
                      `${warning.medicines?.map((med) => med.name).join(' and ')} may interact.`}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="cart-container">
          <div className="cart-items">
            <div className="cart-header">
              <h2>Items ({cartItems.length})</h2>
              <button onClick={clearCart} className="clear-cart-btn">
                Clear Cart
              </button>
            </div>

            {cartItems.map((item) => (
              <Card key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <img
                    src={item.image || 'https://via.placeholder.com/200x200/20b2aa/ffffff?text=Product'}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200/20b2aa/ffffff?text=Product';
                    }}
                    loading="lazy"
                  />
                </div>

                <div className="cart-item-info">
                  <Link to={`/medicines/${item.id}`}>
                    <h3 className="cart-item-name">{item.name}</h3>
                  </Link>
                  <p className="cart-item-description">{item.description}</p>
                  <div className="cart-item-price">
                    PKR {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div className="cart-item-quantity">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        handleQuantityChange(item.id, val);
                      }}
                      min="1"
                      max={item.quantity || 999}
                      className="quantity-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="remove-btn"
                    title="Remove from cart"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="cart-summary">
            <Card className="summary-card">
              <h2>Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>PKR {getCartTotal().toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping:</span>
                <span>PKR 200.00</span>
              </div>
              
              <div className="summary-row">
                <span>Tax:</span>
                <span>PKR {(getCartTotal() * 0.05).toFixed(2)}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Total:</span>
                <span>PKR {(getCartTotal() + 200 + getCartTotal() * 0.05).toFixed(2)}</span>
              </div>

              <Button
                variant="primary"
                size="large"
                onClick={handleCheckout}
                className="checkout-button"
              >
                Proceed to Checkout
              </Button>

              <Link to="/medicines" className="continue-shopping">
                ← Continue Shopping
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

