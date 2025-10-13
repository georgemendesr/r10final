// Teste simples do módulo arquivo
try {
  const arquivoRoutes = require('./arquivo-routes');
  console.log('✅ Módulo carregado com sucesso!');
  console.log('Tipo:', typeof arquivoRoutes);
} catch (err) {
  console.error('❌ Erro ao carregar módulo:', err.message);
  console.error('Stack:', err.stack);
}
