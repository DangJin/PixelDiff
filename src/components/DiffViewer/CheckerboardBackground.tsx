import React from 'react';

export const CheckerboardBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 z-0 opacity-10 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #000 25%, transparent 25%),
          linear-gradient(-45deg, #000 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #000 75%),
          linear-gradient(-45deg, transparent 75%, #000 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
      }}
    />
  );
};
