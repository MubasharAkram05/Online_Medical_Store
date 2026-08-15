import React from 'react';
// Link: client-side navigation without page reload
import { Link } from 'react-router-dom';
// useLocation: get current page URL info
import { useLocation } from 'react-router-dom';
// toast: show success/error notifications
import { toast } from 'react-toastify';
// cart context — provides addToCart function
import { useCart } from '../../context/CartContext';
// reusable button component
import Button from '../common/Button';
// medicine card specific styles
import './MedicineCard.css';

/**
 * MedicineCard Component
 * Displays a single medicine as a clickable card
 * Shows: image, name, manufacturer, description, price, stock, add to cart button
 * Clicking card → navigates to medicine detail page
 * Clicking "Add to Cart" → adds medicine to cart
 *
 * @param {object} medicine - Medicine data object containing all medicine details
 */
/**
 * getDisplayStats — derives a stable star rating and "sold" count from the
 * medicine id, since the catalogue has no real ratings/sales data yet.
 * Deterministic (same id always produces the same numbers) so cards don't
 * flicker between renders, but these are display placeholders, not real
 * review/sales figures.
 */
const getDisplayStats = (id) => {
  const seed = Number(id) || 0;
  const rating = (4 + ((seed * 37) % 10) / 10).toFixed(1);
  const reviewCount = 20 + ((seed * 53) % 480);
  const soldCount = 30 + ((seed * 91) % 2470);
  const soldLabel = soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount;

  return { rating, reviewCount, soldLabel };
};

const MedicineCard = ({ medicine }) => {

  const { rating, reviewCount, soldLabel } = getDisplayStats(medicine.id);

  // get addToCart function from cart context
  // used to add medicine to cart when button is clicked
  const { addToCart } = useCart();

  // get current page location
  // used to check if we are on the main medicines listing page
  const location = useLocation();

  /**
   * handleAddToCart — handles "Add to Cart" button click
   * Validates stock before adding to cart
   * Shows success or error toast notification
   *
   * @param {Event} e - Click event from button
   */
  const handleAddToCart = (e) => {
    // prevent Link navigation when button is clicked
    // without this — clicking button would also open medicine detail page
    e.preventDefault();

    // stop click from bubbling up to parent Link component
    // extra safety to prevent navigation
    e.stopPropagation();

    // check if medicine is out of stock
    // show error and stop — do not add to cart
    if (medicine.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    // add medicine to cart with quantity 1
    addToCart(medicine, 1);

    // show success notification with medicine name
    toast.success(`${medicine.name} added to cart!`);
  };

  /**
   * handleCardClick — saves scroll position before navigating to detail page
   * Only saves scroll position when on the main medicines listing page (/medicines)
   * This allows restoring scroll position when user comes back to the list
   *
   * @param {Event} e - Click event from Link
   */
  const handleCardClick = (e) => {
    // only save scroll position when on main medicines listing page
    // no need to save scroll on other pages like home or search results
    if (location.pathname !== '/medicines') {
      return;
    }

    // get current scroll position — try all methods for browser compatibility
    const scrollPosition = window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;

    // save scroll position to sessionStorage
    // sessionStorage clears when tab is closed — perfect for this use case
    sessionStorage.setItem('medicinesPageScrollPosition', scrollPosition.toString());

    // flag to indicate scroll position can be restored
    // medicines page checks this flag before restoring scroll
    sessionStorage.setItem('medicinesPageCanRestore', '1');
  };

  return (
    // Link wraps entire card — clicking anywhere on card navigates to detail page
    // onClick saves scroll position before navigating
    <Link
      to={`/medicines/${medicine.id}`}
      className="medicine-card-link"
      onClick={handleCardClick}
    >
      <div className="medicine-card">

        {/* medicine image section */}
        <div className="medicine-image">
          <img
            // use medicine image if available
            // fallback to placeholder if image is null/undefined
            src={medicine.image || 'https://via.placeholder.com/400x400/20b2aa/ffffff?text=Medicine'}
            alt={medicine.name}
            // onError — if image fails to load, show placeholder instead
            // e.target.src replaces broken image with placeholder
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400/20b2aa/ffffff?text=Medicine';
            }}
            // lazy loading — image only loads when it enters the viewport
            // improves page performance when many cards are shown
            loading="lazy"
          />

          {/* prescription badge — only shown if medicine requires prescription */}
          {medicine.requires_prescription && (
            <span className="prescription-badge prescription-required">
              ℞ Prescription Required
            </span>
          )}
        </div>

        {/* medicine information section */}
        <div className="medicine-info">

          {/* medicine name */}
          <h3 className="medicine-name">{medicine.name}</h3>

          {/* manufacturer name — show 'Generic' if not available */}
          <p className="medicine-manufacturer-card">
            {medicine.manufacturer || 'Generic'}
          </p>

          {/* medicine description
              .replace(/<[^>]*>?/gm, '') removes any HTML tags from description
              ReactQuill saves HTML — we show plain text in card */}
          <p className="medicine-description">
            {(medicine.description || 'Quality healthcare product')
              .replace(/<[^>]*>?/gm, '')}
          </p>

          {/* price and stock info */}
          <div className="medicine-details">
            {/* price — toFixed(2) ensures 2 decimal places
                example: 50 → "50.00", 49.9 → "49.90"
                ?. optional chaining — handles if price is null */}
            <span className="medicine-price">
              PKR {medicine.price?.toFixed(2) || '0.00'}
            </span>

            {/* stock count — ?? 0 means show 0 if stock is null/undefined */}
            <span className="medicine-stock">
              Stock: {medicine.stock ?? 0}
            </span>
          </div>

          {/* rating and sold count — display placeholders, see getDisplayStats */}
          <div className="medicine-rating-row">
            <span className="medicine-rating">
              ⭐ {rating} <span className="rating-count">({reviewCount})</span>
            </span>
            <span className="medicine-sold">{soldLabel} sold</span>
          </div>

          {/* Add to Cart button
              onClick calls handleAddToCart
              e.preventDefault inside stops Link navigation */}
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