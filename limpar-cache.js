// Script para limpar localStorage antigo/corrompido
// Cole no console do navegador (F12) se o erro 401 persistir

console.log('🧹 Limpando cache de autenticação...');

// Remove dados de autenticação antigos
localStorage.removeItem('r10_auth');
localStorage.removeItem('r10_users');

// Remove qualquer outro item relacionado
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('r10_') || key.startsWith('auth_')) {
    console.log('  Removendo:', key);
    localStorage.removeItem(key);
  }
});

console.log('✅ Cache limpo! Recarregue a página (F5)');
