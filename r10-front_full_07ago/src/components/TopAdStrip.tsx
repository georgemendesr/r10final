import React from 'react';
import AdBanner from './AdBanner';

const TopAdStrip = () => {
  return (
    <div className="w-full bg-gray-100 py-2 flex items-center justify-center">
      <AdBanner 
        position="top-strip" 
        className="mx-auto"
      />
    </div>
  );
};

export default TopAdStrip;