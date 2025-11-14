import React from 'react';
import './Card.css';

const Card = ({ children, className = '', onClick, ...props }) => {
  const classes = `card ${className}`.trim();
  
  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;

