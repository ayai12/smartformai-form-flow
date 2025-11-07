import React from 'react';
import iconImage from './icon.png';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <img 
      src={iconImage}
      alt="SmartFormAI Agents"
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }}
    />
  );
};

export default Logo; 