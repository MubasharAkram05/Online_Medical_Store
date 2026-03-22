import React from 'react';
import './Card.css';
/**
 * Card Component — Reusable container with card styling
 * Used throughout the app to wrap content in a styled box
 * param {ReactNode} children - Any content inside the card
 * param {string} className - Extra CSS classes from parent component
 * param {...any} props - Any other HTML div attributes passed from parent
 */
const Card = ({ children, className = '', onClick, ...props }) => {
    /**
   * Combines base 'card' class with any extra classes from parent
   * Example outputs:
   * card ${card}
   * card ${card shipping-modal}
   * card ${card product-card}
   */
  const classes = `card ${className}`.trim();
  
  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;

