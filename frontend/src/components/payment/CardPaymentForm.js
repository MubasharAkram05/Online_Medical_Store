import React from 'react';

const CardPaymentForm = ({ details, onChange }) => {
    return (
        <div className="payment-form-container">
            <h3>Card Information</h3>
            <div className="form-group">
                <label>Card Number *</label>
                <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={details.cardNumber || ''}
                    onChange={(e) => onChange('cardNumber', e.target.value)}
                    maxLength="19"
                />
            </div>
            <div className="form-grid">
                <div className="form-group">
                    <label>Expiry Date *</label>
                    <input
                        type="text"
                        placeholder="MM/YY"
                        value={details.expiryDate || ''}
                        onChange={(e) => onChange('expiryDate', e.target.value)}
                        maxLength="5"
                    />
                </div>
                <div className="form-group">
                    <label>CVV *</label>
                    <input
                        type="password"
                        placeholder="***"
                        value={details.cvv || ''}
                        onChange={(e) => onChange('cvv', e.target.value)}
                        maxLength="3"
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Cardholder Name *</label>
                <input
                    type="text"
                    placeholder="Name on card"
                    value={details.cardName || ''}
                    onChange={(e) => onChange('cardName', e.target.value)}
                />
            </div>
            <small className="field-hint">
                Your card details are processed securely. We do not store your full card number.
            </small>
        </div>
    );
};

export default CardPaymentForm;
