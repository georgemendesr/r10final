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
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Falha ao registrar Service Worker:', error);
      });
  });
}

// Função global para debug de banners
(window as any).resetBanners = () => {
  console.log('🔄 Resetando banners via console...');
  adsService.resetBanners();
  console.log('✅ Banners resetados! Recarregue a página para ver os banners padrão.');
};

// Função global para verificar banners
(window as any).checkBanners = () => {
  console.log('🔍 Verificando banners...');
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