import React from 'react';
import './Loading.css';
/**
 * Loading Component — Reusable loading spinner
 * Shown while data is being fetched or any async operation is in progress
 * Displays a spinning animation with a customizable message below it
 *
 * param {string} message - Text shown below the spinner
 *                           default is 'Loading...' if not passed
 */
const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;

