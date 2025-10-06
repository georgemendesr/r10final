import React, { useEffect, useState } from 'react';
import { adsService, Banner } from '../services/adsService';
import { HERO_MAIN_IMAGE_HEIGHT_CLASSES, NEWS_GENERAL_MAIN_IMAGE_CLASSES } from '../constants/layout';

interface AdBannerProps {
  position: Banner['posicao'];
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`🔍 AdBanner: Iniciando busca para posição ${position}`);
    setLoading(true);
    setError(null);
    
    try {
      // Buscar banner ativo para a posição
      const activeBanner = adsService.getActiveBanner(position);
      console.log(`🎯 AdBanner: Banner encontrado para posição ${position}:`, activeBanner);
      
      setBanner(activeBanner);
      setLoading(false);

      if (activeBanner) {
        // Registrar impressão simples
        adsService.registerImpression(activeBanner.id);
        console.log(`📊 AdBanner: Impressão registrada para banner ${activeBanner.id}`);
      } else {
        console.log(`❌ AdBanner: Nenhum banner ativo encontrado para posição ${position}`);
        setError('Nenhum banner disponível');
      }
    } catch (err) {
      console.error(`💥 AdBanner: Erro ao carregar banner para posição ${position}:`, err);
      setError('Erro ao carregar banner');
      setLoading(false);
    }
  }, [position]);

  const handleBannerClick = () => {
    if (banner) {
      adsService.registerClick(banner.id);
      window.open(banner.link, '_blank', 'noopener,noreferrer');
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className={`${className} bg-gray-200 rounded-lg animate-pulse`}>
        <div className="w-full h-20 flex items-center justify-center">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  // Se há erro, mostrar banner de teste
  if (error || !banner) {
    console.log(`🚫 AdBanner: Mostrando banner de teste para posição ${position}`);
    return (
      <div className={`${className} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg cursor-pointer`}>
        <div className="w-full h-20 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-lg font-bold">BANNER TESTE</div>
            <div className="text-xs opacity-80">{position}</div>
          </div>
        </div>
      </div>
    );
  }

  const getSizeClasses = (tamanho: Banner['tamanho']) => {
    // Para news-sidebar, usar EXATAMENTE as mesmas classes da imagem principal da seção geral
    if (position === 'news-sidebar') {
      return `${NEWS_GENERAL_MAIN_IMAGE_CLASSES} rounded-xl overflow-hidden`;
    }
    
    switch (tamanho) {
      case '728x90':
        return 'w-[728px] h-[90px] max-w-full';
      case '300x250':
        return 'w-[300px] h-[250px]';
      case '160x600':
        return 'w-[160px] h-[600px]';
      case '320x50':
        return 'w-[320px] h-[50px] max-w-full';
      case '970x250':
        return 'w-[970px] h-[250px] max-w-full';
      case '300x600':
        return 'w-[300px] h-[600px]';
      default:
        return 'w-full h-auto';
    }
  };

  const renderBannerContent = () => {
    console.log(`🎨 AdBanner: Renderizando banner ${banner.id} do tipo ${banner.tipo}`);

    const inner = (() => {
      switch (banner.tipo) {
        case 'html':
          return (
            <div
              className={getSizeClasses(banner.tamanho)}
              dangerouslySetInnerHTML={{ __html: banner.conteudoHtml || '' }}
            />
          );
        case 'video':
          return (
            <video
              className={`${getSizeClasses(banner.tamanho)} object-cover`}
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={banner.imagem} type="video/mp4" />
            </video>
          );
        case 'gif':
        case 'imagem':
        default:
          return (
            <img
              src={banner.imagem}
              alt={banner.titulo}
              className={`${getSizeClasses(banner.tamanho)} object-cover`}
              loading="lazy"
              onError={(e) => {
                console.log('❌ AdBanner: Erro ao carregar imagem do banner:', e);
                setError('Erro ao carregar imagem');
              }}
              onLoad={() => console.log('✅ AdBanner: Banner carregado com sucesso:', banner.titulo)}
            />
          );
      }
    })();

    if (position === 'news-sidebar') {
      return (
        <div className={`${NEWS_GENERAL_MAIN_IMAGE_CLASSES} rounded-xl overflow-hidden flex items-stretch`}>
          {inner}
        </div>
      );
    }

    return inner;
  };

  console.log(`🎯 AdBanner: Renderizando banner final para posição ${position}:`, banner);

  return (
    <div 
      id={`banner-${banner.id}`}
      className={`ad-banner ${className}`}
      onClick={handleBannerClick}
      data-position={position}
      data-banner-id={banner.id}
      style={{ cursor: 'pointer' }}
    >
      {renderBannerContent()}
    </div>
  );
};

export default AdBanner;