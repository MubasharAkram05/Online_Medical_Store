import React from 'react';
import './Button.css';
/**
 * Button Component — Reusable button for the entire app
 * Used everywhere instead of plain <button> tag
 * Supports different variants, sizes, and states
 * param {ReactNode} children - Button text or content inside the button
 * param {string} variant - Button style: 'primary' | 'outline' | 'danger' | 'secondary'
 * param {boolean} disabled - Whether button is disabled or not
 * param {string} className - Extra CSS classes to add from parent component
 * param {...any} props - Any other HTML button attributes passed from parent
 */
const Button = ({ 
  children, 
  variant = 'primary',  // default style is primary — blue/main button
  size = 'medium', 
  onClick, 
  disabled = false,
  type = 'button', // default type is button — prevents accidental form submit
  className = '',  // extra classes from parent — empty by default
  ...props   // any other html attributes like id, aria-label etc
}) => {
  const classes = `btn btn-${variant} btn-${size} ${className}`.trim();
  
  return (
        // render native HTML button with all props applied
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props} 
    >
      {children}
    </button>
  );
};

export default Button;

