import React, { useEffect, useState } from 'react';
import { listBanners, selectActiveByPosition, recordImpression, recordClick, type Banner } from '../services/bannersApi';
import { NEWS_GENERAL_MAIN_IMAGE_CLASSES } from '../constants/layout';

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
    let cancelled = false;
    async function loadBanner() {
      try {
        const items = await listBanners(false);
        if (cancelled) return;
        const activeBanner = selectActiveByPosition(position, items);
        console.log(`🎯 AdBanner: Banner encontrado para posição ${position}:`, activeBanner);
        setBanner(activeBanner);
        setLoading(false);
        if (!activeBanner) {
          console.log(`❌ AdBanner: Nenhum banner ativo encontrado para posição ${position}`);
          setError('Nenhum banner disponível');
        }
      } catch (err) {
        if (cancelled) return;
        console.error(`💥 AdBanner: Erro ao carregar banner para posição ${position}:`, err);
        setError('Erro ao carregar banner');
        setLoading(false);
      }
    }
    loadBanner();
    return () => {
      cancelled = true;
    };
  }, [position]);

  // Registrar impressão quando o banner for carregado
  useEffect(() => {
    if (banner) {
      console.log(`📊 AdBanner: Registrando impressão do banner ${banner.id}`);
      recordImpression(banner.id);
    }
  }, [banner]);

  const handleBannerClick = async () => {
    if (banner) {
      console.log(`🖱️ AdBanner: Registrando clique do banner ${banner.id}`);
      await recordClick(banner.id);
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

  // Se há erro, mostrar banner de teste COM AS DIMENSÕES CORRETAS
  if (error || !banner) {
    console.log(`🚫 AdBanner: Mostrando banner de teste para posição ${position}`);
    
    // Dimensões específicas por posição
    let testBannerClasses = 'w-full h-20'; // padrão
    
    if (position === 'news-sidebar') {
      testBannerClasses = NEWS_GENERAL_MAIN_IMAGE_CLASSES; // h-48 md:h-64 lg:h-80
    } else if (position === 'super-banner') {
      testBannerClasses = 'w-full max-w-[970px] h-[90px] md:h-[120px]'; // Super banner responsivo
    }
    
    return (
      <div className={`${className} ${testBannerClasses} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg cursor-pointer flex items-center justify-center`}>
        <div className="text-white text-center">
          <div className="text-lg font-bold">BANNER TESTE</div>
          <div className="text-xs opacity-80">{position}</div>
        </div>
      </div>
    );
  }

  const getSizeClasses = (tamanho: Banner['tamanho']) => {
    // Para news-sidebar da seção Geral, SEMPRE usar o tamanho responsivo da imagem principal
    // Ignora o tamanho do banco e força classes responsivas
    if (position === 'news-sidebar') {
      return NEWS_GENERAL_MAIN_IMAGE_CLASSES; // w-full h-48 md:h-64 lg:h-80 (320px desktop)
    }
    
    // Super-banner: largura máxima 970px e altura proporcional
    if (position === 'super-banner') {
      return 'w-full max-w-[970px] h-auto';
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
        const objectFitClass = position === 'news-sidebar' ? 'object-contain' : 'object-cover';
        return (
          <img
            src={banner.imagem}
            alt={banner.titulo}
            className={`${getSizeClasses(banner.tamanho)} ${objectFitClass}`}
            loading="lazy"
            onError={(e) => {
              console.log('❌ AdBanner: Erro ao carregar imagem do banner:', e);
              setError('Erro ao carregar imagem');
            }}
            onLoad={() => console.log('✅ AdBanner: Banner carregado com sucesso:', banner.titulo)}
          />
        );
    }
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