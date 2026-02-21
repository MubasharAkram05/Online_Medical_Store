import React, { useRef } from 'react';

const WalletPaymentForm = ({ details, onChange }) => {
    const fileInputRef = useRef(null);

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="payment-form-container">
            <h3>Mobile Wallet Payment</h3>
            <div className="bank-details-box">
                <div className="bank-row">
                    <strong>Easypaisa:</strong>
                    <span>0300-1234567</span>
                </div>
                <div className="bank-row">
                    <strong>JazzCash:</strong>
                    <span>0300-7654321</span>
                </div>
                <div className="bank-row">
                    <strong>Account Name:</strong>
                    <span>Online Medical Store</span>
                </div>
            </div>

            <div className="form-group">
                <label>Transaction ID *</label>
                <input
                    type="text"
                    placeholder="Enter wallet transaction ID"
                    value={details.transactionId || ''}
                    onChange={(e) => onChange('transactionId', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Proof of Payment (Screenshot) *</label>
                <div className="file-upload-container">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => onChange('proofFile', e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                    {!details.proofFile ? (
                        <button
                            type="button"
                            className="file-upload-wrapper"
                            onClick={handleBoxClick}
                        >
                            <div className="upload-placeholder">
                                <span className="upload-icon">📸</span>
                                <span className="upload-text">Click to upload screenshot</span>
                            </div>
                        </button>
                    ) : (
                        <div className="file-upload-wrapper success">
                            <div className="file-name">
                                <span>🖼️ {details.proofFile.name}</span>
                                <button
                                    type="button"
                                    className="clear-file-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange('proofFile', null);
                                    }}
                                    title="Remove file"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="form-group">
                <label>Wallet Phone Number</label>
                <input
                    type="tel"
                    placeholder="Phone number used for payment"
                    value={details.phone || ''}
                    onChange={(e) => onChange('phone', e.target.value)}
                />
            </div>
        </div>
    );
};

export default WalletPaymentForm;
