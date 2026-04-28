import React from 'react';

const Skeleton = ({ width, height, shape = 'rectangle', className = '', style = {} }) => {
  const inlineStyle = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: shape === 'circle' ? '50%' : 'var(--radius-sm)',
    ...style
  };

  return (
    <div 
      className={`skeleton ${className}`} 
      style={inlineStyle} 
    />
  );
};

export default Skeleton;
