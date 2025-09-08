import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { SOCIAL, getSocialInfo } from '../config/social';

interface SocialLinksProps {
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  variant?: 'header' | 'footer';
  showLabels?: boolean;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ 
  className = '', 
  iconSize = 'md',
  variant = 'header',
  showLabels = false 
}) => {
  const getSizeClasses = () => {
    switch (iconSize) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const getContainerClasses = () => {
    const base = 'flex items-center space-x-4';
    if (variant === 'footer') {
      return `${base} gap-2`;
    }
    return base;
  };

  const getLinkClasses = () => {
    if (variant === 'footer') {
      return 'w-8 h-8 bg-brand/20 hover:bg-brand/40 rounded-full flex items-center justify-center transition-colors';
    }
    return 'text-gray-600 hover:text-red-600 transition-colors';
  };

  const TikTokIcon = () => (
    <svg className={getSizeClasses()} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.10z"/>
    </svg>
  );

  const socialIcons = {
    facebook: <Facebook className={getSizeClasses()} aria-hidden="true" />,
    instagram: <Instagram className={getSizeClasses()} aria-hidden="true" />,
    youtube: <Youtube className={getSizeClasses()} aria-hidden="true" />,
    tiktok: <TikTokIcon />
  };

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      {showLabels && variant === 'footer' && (
        <span className="text-xs text-gray-400">Siga-nos:</span>
      )}
      
      {Object.entries(SOCIAL).map(([platform, url]) => {
        const socialInfo = getSocialInfo(platform as keyof typeof SOCIAL);
        
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={getLinkClasses()}
            aria-label={socialInfo.name}
            title={socialInfo.name}
            data-e2e={`social-${platform}`}
          >
            {socialIcons[platform as keyof typeof socialIcons]}
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks; 