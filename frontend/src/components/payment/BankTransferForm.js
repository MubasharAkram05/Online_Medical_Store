import React, { useRef } from 'react';

const BankTransferForm = ({ details, onChange }) => {
    const fileInputRef = useRef(null);

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="payment-form-container">
            <h3>Bank Details</h3>
            <div className="bank-details-box">
                <div className="bank-row">
                    <strong>Bank Name:</strong>
                    <span>Medical Trust Bank</span>
                </div>
                <div className="bank-row">
                    <strong>Account Title:</strong>
                    <span>Online Medical Store</span>
                </div>
                <div className="bank-row">
                    <strong>Account Number:</strong>
                    <span>1234-5678-9012-3456</span>
                </div>
                <div className="bank-row">
                    <strong>IBAN:</strong>
                    <span>PK89MTB1234567890123456</span>
                </div>
            </div>

            <div className="form-group">
                <label>Proof of Payment (Screenshot/Receipt) *</label>
                <div className="file-upload-container">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.pdf"
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
                                <span className="upload-icon">📁</span>
                                <span className="upload-text">Click to upload screenshot or receipt</span>
                            </div>
                        </button>
                    ) : (
                        <div className="file-upload-wrapper success">
                            <div className="file-name">
                                <span>📄 {details.proofFile.name}</span>
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
                <p className="field-hint">Upload a screenshot of your successful transfer</p>
            </div>

            <div className="form-group">
                <label>Transaction ID *</label>
                <input
                    type="text"
                    placeholder="Enter bank transaction reference"
                    value={details.transactionId || ''}
                    onChange={(e) => onChange('transactionId', e.target.value)}
                />
                <small className="field-hint">
                    Please enter the reference number from your bank transfer confirmation.
                </small>
            </div>
        </div>
    );
};

export default BankTransferForm;
