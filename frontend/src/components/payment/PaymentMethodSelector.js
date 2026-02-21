import React from 'react';
import './Payment.css';

const PAYMENT_METHODS = [
    {
        id: 'cod',
        label: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: '💵'
    },
    {
        id: 'card',
        label: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        icon: '💳'
    },
    {
        id: 'bank',
        label: 'Bank Transfer',
        description: 'Transfer directly to our bank account',
        icon: '🏦'
    },
    {
        id: 'wallet',
        label: 'Mobile Wallet',
        description: 'Use Easypaisa or JazzCash',
        icon: '📱'
    }
];

const PaymentMethodSelector = ({ selectedMethod, onSelect }) => {
    return (
        <div className="payment-methods-grid">
            {PAYMENT_METHODS.map((method) => (
                <label
                    key={method.id}
                    className={`payment-method-card ${selectedMethod === method.id ? 'active' : ''}`}
                >
                    <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => onSelect(e.target.value)}
                        className="payment-radio"
                    />
                    <div className="payment-method-content">
                        <span className="payment-method-icon">{method.icon}</span>
                        <div className="payment-method-text">
                            <span className="payment-method-label">{method.label}</span>
                            <span className="payment-method-description">{method.description}</span>
                        </div>
                    </div>
                    {selectedMethod === method.id && <div className="selected-badge">✓</div>}
                </label>
            ))}
        </div>
    );
};

export default PaymentMethodSelector;
