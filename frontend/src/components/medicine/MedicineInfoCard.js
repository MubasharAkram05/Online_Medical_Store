import React from 'react';
import Card from '../common/Card';

const MedicineInfoCard = ({ title, content, type }) => {
    if (!content) return null;

    const renderContent = () => {
        // Handle Object (Legacy format: { adults: '...', children: '...', elderly: '...' })
        if (typeof content === 'object' && !Array.isArray(content)) {
            return (
                <div className="rich-text-content">
                    <ul>
                        {Object.entries(content).map(([key, value]) => (
                            <li key={key}>
                                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        // Handle Array (Legacy Side Effects format)
        if (Array.isArray(content)) {
            return (
                <div className="rich-text-content">
                    <ul>
                        {content.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            );
        }

        // Handle HTML or Plain Text (Dynamic rendering)
        return (
            <div
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    };

    const getDisclaimer = () => {
        if (type === 'dosage') {
            return (
                <p className="info-card-note">
                    <strong>Important:</strong> Always follow your healthcare provider's instructions. Do not exceed the recommended dosage.
                </p>
            );
        }
        if (type === 'sideEffects') {
            return (
                <p className="info-card-note">
                    <strong>Seek medical attention</strong> if you experience severe side effects or allergic reactions.
                </p>
            );
        }
        return null;
    };

    return (
        <Card className="info-card unified-renderer">
            <h3>{title}</h3>
            <div className="info-card-body">
                {renderContent()}
            </div>
            {getDisclaimer()}
        </Card>
    );
};

export default MedicineInfoCard;
