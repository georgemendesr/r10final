// Script de teste para o sistema de reações
const API_BASE = 'http://localhost:3002';

async function testarSistemaReacoes() {
  console.log('🧪 TESTANDO SISTEMA DE REAÇÕES\n');
  
  const postId = 1; // Usando post ID 1 para teste
  
  // Teste 1: Buscar reações de um post (inicial)
  console.log('📊 Teste 1: Buscar reações iniciais do post', postId);
  try {
    const res1 = await fetch(`${API_BASE}/api/posts/${postId}/reactions`);
    const data1 = await res1.json();
    console.log('✅ Resposta:', JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n---\n');
  
  // Teste 2: Adicionar uma reação "feliz"
  console.log('😊 Teste 2: Adicionar reação "feliz"');
  try {
    const res2 = await fetch(`${API_BASE}/api/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'feliz' })
    });
    const data2 = await res2.json();
    console.log('✅ Resposta:', JSON.stringify(data2, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n---\n');
  
  // Teste 3: Trocar para "surpreso"
  console.log('😲 Teste 3: Trocar reação para "surpreso"');
  try {
    const res3 = await fetch(`${API_BASE}/api/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'surpreso' })
    });
    const data3 = await res3.json();
    console.log('✅ Resposta:', JSON.stringify(data3, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n---\n');
  
  // Teste 4: Remover reação (toggle)
  console.log('🗑️ Teste 4: Remover reação (toggle)');
  try {
    const res4 = await fetch(`${API_BASE}/api/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'surpreso' })
    });
    const data4 = await res4.json();
    console.log('✅ Resposta:', JSON.stringify(data4, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n---\n');
  
  // Teste 5: Buscar agregação diária (últimas 24h)
  console.log('📅 Teste 5: Buscar reações das últimas 24 horas');
  try {
    const res5 = await fetch(`${API_BASE}/api/reactions/daily`);
    const data5 = await res5.json();
    console.log('✅ Resposta:', JSON.stringify(data5, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n✅ TODOS OS TESTES CONCLUÍDOS!\n');
}

// Executar testes
testarSistemaReacoes().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
