import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import './ShippingInformationModal.css';

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

  const handleSave = (data) => {
    // Form is valid, close modal
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <Card className="shipping-modal">
          <div className="modal-header">
            <div className="header-top">
              <h2>Shipping Information</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>

          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="modal-fullName">Full Name *</label>
                <input
                  id="modal-fullName"
                  {...register('fullName', { required: 'Full name is required' })}
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-email">Email *</label>
                <input
                  id="modal-email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
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

              <div className="form-group">
                <label htmlFor="modal-priority">Order Priority</label>
                <select
                  id="modal-priority"
                  value={priority}
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

              <div className="form-group full-width">
                <label htmlFor="modal-address">Address *</label>
                <input
                  id="modal-address"
                  {...register('address', { required: 'Address is required' })}
                  placeholder="Enter your address"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address.message}</span>}
              </div>

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

          <div className="modal-footer">
            <div className="modal-actions">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
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
