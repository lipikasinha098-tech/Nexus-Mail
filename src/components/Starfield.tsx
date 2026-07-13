import React from 'react';

export const Starfield: React.FC = () => {
  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-none opacity-30"
      style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }}
    />
  );
};

