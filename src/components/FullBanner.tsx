// src/components/FullBanner.tsx
import React from 'react';

const FullBanner: React.FC = () => {
  return (
    <div className="container mx-auto my-8 px-4 max-w-[1250px]">
      <div 
        className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg shadow-md"
        data-e2e="full-banner"
      >
        <p className="text-gray-500 text-lg font-semibold">Espaço para Publicidade (Full Banner)</p>
      </div>
    </div>
  );
};

export default FullBanner;
