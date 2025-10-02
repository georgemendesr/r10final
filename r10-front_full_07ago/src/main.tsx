import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'
import { initializeServices, forceReinitializeServices } from './services/initService'
import { adsService } from './services/adsService'
import { HelmetProvider } from 'react-helmet-async'

// Registrar Service Worker para cache otimizado
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service Worker registration failed silently in production
    });
  });
}

// Função global para debug de banners (somente dev)
if (import.meta.env.DEV) {
  (window as any).resetBanners = () => {
    adsService.resetBanners();
    console.log('✅ Banners resetados! Recarregue a página.');
  };

  (window as any).checkBanners = () => {
    const banners = adsService.getBanners();
    console.log('📊 Total de banners:', banners.length);
    banners.forEach((banner, index) => {
      console.log(`Banner ${index + 1}:`, {
        id: banner.id,
        titulo: banner.titulo,
        posicao: banner.posicao,
        status: banner.status,
        dataInicio: banner.dataInicio,
        dataFim: banner.dataFim
      });
    });
  };
}

// Função global para forçar recriação dos dados de teste
(window as any).forceReinitializeData = () => {
  console.log('🔄 Forçando recriação dos dados de teste...');
  forceReinitializeServices();
  console.log('✅ Dados recriados! Recarregue a página para ver as mudanças.');
};

// Inicializar serviços antes de renderizar o aplicativo
initializeServices();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)