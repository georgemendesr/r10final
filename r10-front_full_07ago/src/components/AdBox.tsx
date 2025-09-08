import React from 'react';
import AdBanner from './AdBanner';

const AdBox: React.FC = () => {
  return (
    <div className="flex justify-center">
      <AdBanner position="sidebar-article" />
    </div>
  );
};

export default AdBox;