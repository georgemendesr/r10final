import React from 'react';
import AdBanner from './AdBanner';

interface InContentAdProps {
  className?: string;
}

const InContentAd: React.FC<InContentAdProps> = ({ className = '' }) => {
  return (
    <div className={`my-8 flex justify-center ${className}`}>
      <div className="max-w-[300px] w-full">
        <AdBanner position="in-content" />
      </div>
    </div>
  );
};

export default InContentAd; 