#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 SCRIPT AUTOMÁTICO DE CORREÇÃO DOS DESTAQUES...');
console.log('⚡ Executando a cada 30 segundos para manter sempre 5 destaques...\n');

const dbPath = path.join(__dirname, 'server', 'noticias.db');

function corrigirDestaques() {
  const db = new sqlite3.Database(dbPath);
  
  // Contar destaques atuais
  db.get("SELECT COUNT(*) as count FROM noticias WHERE posicao = 'destaque'", (err, result) => {
    if (err) {
      console.error('❌ Erro ao contar destaques:', err);
      return;
    }
    
    const destaqueCount = result.count;
    console.log(`📊 Destaques atuais: ${destaqueCount}/5`);
    
    if (destaqueCount < 5) {
      const needed = 5 - destaqueCount;
      console.log(`🔄 Promovendo ${needed} posts de GERAL para DESTAQUE...`);
      
      // Buscar posts gerais mais recentes para promover
      const promoteQuery = `
        UPDATE noticias 
        SET posicao = 'destaque' 
        WHERE id IN (
          SELECT id FROM noticias 
          WHERE posicao = 'geral' 
          ORDER BY created_at DESC 
          LIMIT ?
        )
      `;
      
      db.run(promoteQuery, [needed], function(promoteErr) {
        if (promoteErr) {
          console.error('❌ Erro ao promover posts:', promoteErr);
          return;
        }
        
        console.log(`✅ ${this.changes} posts promovidos para DESTAQUE`);
        console.log('🎉 DESTAQUES CORRIGIDOS! Agora sempre terá 5 notícias.\n');
      });
    } else if (destaqueCount === 5) {
      console.log('✅ Destaques OK! Mantendo 5 notícias.\n');
    } else {
      console.log(`⚠️  MUITOS DESTAQUES (${destaqueCount})! Corrigindo...`);
      
      // Se tiver mais que 5, rebaixar os mais antigos
      const demoteQuery = `
        UPDATE noticias 
        SET posicao = 'geral' 
        WHERE id IN (
          SELECT id FROM noticias 
          WHERE posicao = 'destaque' 
          ORDER BY created_at ASC 
          LIMIT ?
        )
      `;
      
      const excess = destaqueCount - 5;
      db.run(demoteQuery, [excess], function(demoteErr) {
        if (demoteErr) {
          console.error('❌ Erro ao rebaixar posts:', demoteErr);
          return;
        }
        
        console.log(`✅ ${this.changes} posts rebaixados para GERAL`);
        console.log('🎉 DESTAQUES CORRIGIDOS! Agora mantém exatamente 5.\n');
      });
    }
  });
  
  db.close();
}

// Executar imediatamente
corrigirDestaques();

// Executar a cada 30 segundos
setInterval(corrigirDestaques, 30000);

console.log('🚀 Monitor automático dos destaques iniciado!');
console.log('   - Verifica a cada 30 segundos');
console.log('   - Mantém sempre exatamente 5 destaques');
console.log('   - Promove posts gerais quando necessário');
console.log('   - Para parar: Ctrl+C\n');