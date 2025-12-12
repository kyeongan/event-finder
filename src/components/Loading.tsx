import React from 'react';
import './Loading.css';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p className="loading-message">{message}</p>
    </div>
  );
};
