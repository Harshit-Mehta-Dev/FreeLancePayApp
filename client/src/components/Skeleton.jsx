import React from 'react';

const Skeleton = ({ width, height, shape = 'rectangle', className = '', style = {}, variant = 'glass' }) => {
  const inlineStyle = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: shape === 'circle' ? '50%' : (shape === 'pill' ? '99px' : 'var(--radius-sm)'),
    ...style
  };

  return (
    <div 
      className={`skeleton skeleton-${variant} ${className}`} 
      style={inlineStyle} 
    />
  );
};

export default Skeleton;

