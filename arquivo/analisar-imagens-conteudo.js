const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arquivo.db');

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   🔍 Análise de Imagens no Conteúdo                  ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Verificar imagens em /uploads/editor/
db.get(`SELECT COUNT(*) as total FROM noticias WHERE conteudo LIKE '%/uploads/editor/%'`, (err, row) => {
    if (err) {
        console.error('Erro:', err);
        return;
    }
    
    console.log(`📊 Notícias com imagens em /uploads/editor/: ${row.total}`);
    
    // Verificar imagens em /uploads/imagens/
    db.get(`SELECT COUNT(*) as total FROM noticias WHERE conteudo LIKE '%/uploads/imagens/%'`, (err2, row2) => {
        console.log(`📊 Notícias com imagens em /uploads/imagens/: ${row2.total}`);
        
        // Buscar exemplos
        db.all(`SELECT id, titulo, substr(conteudo, 1, 500) as preview 
                FROM noticias 
                WHERE conteudo LIKE '%/uploads/editor/%' 
                LIMIT 3`, (err3, rows) => {
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('📰 Exemplos de notícias com imagens no conteúdo:\n');
            
            rows.forEach((noticia, idx) => {
                console.log(`${idx + 1}. ${noticia.titulo}`);
                
                // Extrair src das imagens
                const imgRegex = /src="([^"]+)"/g;
                let match;
                const imagens = [];
                
                while ((match = imgRegex.exec(noticia.preview)) !== null) {
                    if (match[1].includes('/uploads/')) {
                        imagens.push(match[1]);
                    }
                }
                
                if (imagens.length > 0) {
                    console.log('   Imagens:');
                    imagens.forEach(img => console.log(`   - ${img}`));
                }
                console.log('');
            });
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            console.log('💡 CONCLUSÃO:\n');
            console.log(`✅ Você tem ${row.total} notícias com imagens em /uploads/editor/`);
            console.log(`✅ Você tem ${row2.total} notícias com imagens em /uploads/imagens/`);
            console.log('\n📁 Certifique-se de que essas pastas contêm as imagens:');
            console.log('   - arquivo/uploads/editor/');
            console.log('   - arquivo/uploads/imagens/');
            console.log('   - arquivo/uploads/noticias/');
            console.log('\n✅ O servidor já está configurado para servir todas!\n');
            
            db.close();
        });
    });
});
