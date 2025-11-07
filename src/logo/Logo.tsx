import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <div 
      className={`logo-container ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div className="logo-gradient-circle">
        <span className="logo-letter">S</span>
      </div>
    </div>
  );
};

export default Logo; 