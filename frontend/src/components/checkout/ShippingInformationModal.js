import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import './ShippingInformationModal.css';

/**
 * ShippingInformationModal Component
 * Modal form for entering shipping/delivery information during checkout
 * Uses react-hook-form for form validation and submission
 *
 * param {boolean} isOpen - Whether the modal is open or closed
 * param {function} onClose - Function to close the modal
 * param {function} register - react-hook-form register function for input validation
 * param {object} errors - react-hook-form errors object for displaying validation errors
 * param {function} watch - react-hook-form watch function to monitor field values
 * param {string} priority - Current selected delivery priority value
 * param {function} onPriorityChange - Function to update priority selection
 * param {function} onSave - Function called after successful form validation
 * param {function} handleSubmit - react-hook-form handleSubmit function
 */

const ShippingInformationModal = ({
  isOpen,
  onClose,
  register,
  errors,
  watch,
  priority,
  onPriorityChange,
  onSave,
  handleSubmit
}) => {
  if (!isOpen) return null;
  /**
   * handleSave — called after react-hook-form validates the form
   * data parameter contains all validated form field values
   * param {object} data - validated form data from react-hook-form
   */
  const handleSave = (data) => {
    // Form is valid, call onSave to proceed with checkout
    onSave();
  };

  return (
     // overlay — dark background behind modal
    // clicking overlay closes the modal
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <Card className="shipping-modal">
          <div className="modal-header">
            <div className="header-top">
              <h2>Shipping Information</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>
      {/* modal body — shipping form fields */}
          <div className="modal-content">
            <div className="form-grid">
                {/* Full Name — required text input */}
              <div className="form-group">
                <label htmlFor="modal-fullName">Full Name *</label>
                <input
                  id="modal-fullName"
                   // register with validation rule — field is required
                  {...register('fullName', { required: 'Full name is required' })}
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'error' : ''}
                />
                {/* show error message if validation fails */}
                {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-email">Email *</label>
                <input
                  id="modal-email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                      // regex pattern for valid email format
                      // example: user@example.com
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="Enter your email"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-phone">Phone Number *</label>
                <input
                  id="modal-phone"
                  type="tel"
                  {...register('phone', {
                    required: 'Phone number is required',
                      // regex pattern for valid phone number format
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  placeholder="Enter your phone number"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone.message}</span>}
              </div>
              {/* Order Priority Dropdown — not required, has default value
                  3 options: normal, high, urgent
                  controlled by parent via priority and onPriorityChange props */}
              <div className="form-group">
                <label htmlFor="modal-priority">Order Priority</label>
                <select
                  id="modal-priority"
                  // controlled input — value comes from parent state
                  value={priority}
                // notify parent when selection changes
                  onChange={(e) => onPriorityChange(e.target.value)}
                >
                  <option value="normal">Normal Delivery (2-4 days)</option>
                  <option value="high">High Priority (within 48 hours)</option>
                  <option value="urgent">Urgent / Critical</option>
                </select>
                <small className="field-hint">
                  Urgent orders are handled with highest priority for medical needs.
                </small>
              </div>

                 {/* Address Field — required */}
              <div className="form-group full-width">
                <label htmlFor="modal-address">Address *</label>
                <input
                  id="modal-address"
                   // register with required validation
                  {...register('address', { required: 'Address is required' })}
                  placeholder="Enter your address"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address.message}</span>}
              </div>

                {/* City Field — required */}
              <div className="form-group">
                <label htmlFor="modal-city">City *</label>
                <input
                  id="modal-city"
                  {...register('city', { required: 'City is required' })}
                  placeholder="Enter your city"
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="error-message">{errors.city.message}</span>}
              </div>

              {/* Postal Code Field — required */}
              <div className="form-group">
                <label htmlFor="modal-postalCode">Postal Code *</label>
                <input
                  id="modal-postalCode"
                  {...register('postalCode', { required: 'Postal code is required' })}
                  placeholder="Enter postal code"
                  className={errors.postalCode ? 'error' : ''}
                />
                {errors.postalCode && <span className="error-message">{errors.postalCode.message}</span>}
              </div>
            </div>
          </div>
          {/* modal footer — action buttons */}
          <div className="modal-footer">
            <div className="modal-actions">
              {/* Cancel button — closes modal without saving
              variant="outline" for secondary styling */}
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>

              {/* Save button — triggers react-hook-form validation
                  handleSubmit validates all fields first
                  if valid → calls handleSave
                  if invalid → shows error messages */}
              <Button variant="primary" onClick={handleSubmit(handleSave)}>
                Save
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShippingInformationModal;
