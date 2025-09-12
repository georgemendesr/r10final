// Importar funcoes de inicializacao de outros servicos
import { initService as initPostsService } from './postsService';
import { initializeSettings } from './settingsService';
import { initializeReactionsData } from './reactionsService';
// Removido preload offline para evitar qualquer mock no site
// import { preloadOfflineFromStatic } from './offlineCache';

// Funcao para inicializar todos os servicos
export const initializeServices = async () => {
  console.log('🚀 Inicializando servicos...');
  
  try {
  // Offline desabilitado: site deve usar apenas dados reais da API
    
    // Inicializar configuracoes
    initializeSettings();
    
    // Inicializar conexao com API MySQL
    console.log('🔗 Conectando com API MySQL...');
    await initPostsService();
    
    // Inicializar outros servicos basicos
    console.log('📦 Inicializando outros servicos...');
    initializeReactionsData();
    
    // Migração leve: garantir que a seção R10 Play esteja presente e habilitada no layout
    try {
      const LAYOUT_STORAGE_KEY = 'r10_homepage_layout';
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const hasR10Play = Array.isArray(parsed) && parsed.some((s: any) => s.id === 'r10Play');
        if (!hasR10Play) {
          parsed.push({ id: 'r10Play', name: 'R10 Play', enabled: true });
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(parsed));
          console.log('🎬 R10 Play adicionado ao layout automaticamente.');
        } else {
          // Garantir enabled true
          const updated = parsed.map((s: any) => s.id === 'r10Play' ? { ...s, enabled: true } : s);
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn('Aviso: falha ao migrar layout para incluir R10 Play', e);
    }
    
    console.log('✅ Servicos inicializados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar servicos:', error);
  }
};

// Funcao para testar conexao com API
export const testAPIConnection = async () => {
  try {
    const response = await fetch('http://localhost:8081/health');
    if (response.ok) {
      console.log('✅ API MySQL conectada com sucesso!');
      return true;
    } else {
      console.error('❌ API MySQL nao respondeu corretamente');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexao com API MySQL:', error);
    return false;
  }
};

// Funcao para forcar reinicializacao de todos os servicos
export const forceReinitializeServices = async () => {
  console.log('🔄 Forçando reinicialização de todos os serviços...');
  
  try {
    // Limpar dados existentes se necessário
    localStorage.removeItem('r10_settings');
    localStorage.removeItem('r10_reactions');
    
    // Reinicializar tudo
    await initializeServices();
    
    console.log('✅ Serviços forçadamente reinicializados!');
  } catch (error) {
    console.error('❌ Erro ao forçar reinicialização:', error);
  }
};
