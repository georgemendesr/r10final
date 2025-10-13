const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arquivo.db');

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   🔍 Análise Completa de Imagens no Banco            ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// 1. Contar todas as notícias
db.get('SELECT COUNT(*) as total FROM noticias', (err, row) => {
    console.log(`📊 Total de notícias: ${row.total}\n`);
    
    // 2. Contar notícias com imagem
    db.get('SELECT COUNT(*) as total FROM noticias WHERE imagem IS NOT NULL AND imagem != ""', (err, row) => {
        console.log(`📸 Notícias com campo imagem preenchido: ${row.total}\n`);
        
        // 3. Analisar todos os padrões de caminhos
        db.all('SELECT DISTINCT imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != "" ORDER BY imagem LIMIT 50', (err, rows) => {
            console.log('📁 PRIMEIROS 50 CAMINHOS DE IMAGENS ÚNICOS:\n');
            
            const padroes = {
                noticias: 0,
                editor: 0,
                imagens: 0,
                outros: 0
            };
            
            rows.forEach((row, idx) => {
                console.log(`${(idx + 1).toString().padStart(2, '0')}. ${row.imagem}`);
                
                if (row.imagem.includes('/noticias/')) padroes.noticias++;
                else if (row.imagem.includes('/editor/')) padroes.editor++;
                else if (row.imagem.includes('/imagens/')) padroes.imagens++;
                else padroes.outros++;
            });
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            // 4. Contar por padrão (todos os registros)
            console.log('📊 CONTAGEM POR PADRÃO (TODOS OS REGISTROS):\n');
            
            db.get(`SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%/noticias/%'`, (err, row) => {
                console.log(`   /uploads/noticias/  : ${row.total} notícias`);
                
                db.get(`SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%/editor/%'`, (err, row) => {
                    console.log(`   /uploads/editor/    : ${row.total} notícias`);
                    
                    db.get(`SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%/imagens/%'`, (err, row) => {
                        console.log(`   /uploads/imagens/   : ${row.total} notícias`);
                        
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                        
                        // 5. Analisar imagens dentro do conteúdo HTML
                        console.log('🔍 ANALISANDO IMAGENS DENTRO DO CONTEÚDO HTML:\n');
                        
                        db.all(`SELECT id, titulo, conteudo FROM noticias WHERE conteudo LIKE '%<img%src=%' LIMIT 10`, (err, rows) => {
                            console.log(`   Encontradas ${rows.length} notícias com tags <img> no conteúdo\n`);
                            
                            if (rows.length > 0) {
                                console.log('   EXEMPLOS:\n');
                                rows.forEach((row, idx) => {
                                    const imgMatches = row.conteudo.match(/src=["']([^"']+)["']/gi);
                                    if (imgMatches && imgMatches.length > 0) {
                                        console.log(`   ${idx + 1}. ${row.titulo.substring(0, 50)}...`);
                                        imgMatches.slice(0, 2).forEach(match => {
                                            const src = match.match(/src=["']([^"']+)["']/i)[1];
                                            console.log(`      → ${src}`);
                                        });
                                    }
                                });
                            }
                            
                            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                            
                            // 6. Contar imagens em conteúdo por padrão
                            console.log('📊 CONTAGEM DE IMAGENS NO CONTEÚDO HTML:\n');
                            
                            db.get(`SELECT COUNT(*) as total FROM noticias WHERE conteudo LIKE '%/uploads/editor/%'`, (err, row) => {
                                console.log(`   Conteúdo com /uploads/editor/  : ${row.total} notícias`);
                                
                                db.get(`SELECT COUNT(*) as total FROM noticias WHERE conteudo LIKE '%/uploads/imagens/%'`, (err, row) => {
                                    console.log(`   Conteúdo com /uploads/imagens/ : ${row.total} notícias`);
                                    
                                    db.get(`SELECT COUNT(*) as total FROM noticias WHERE conteudo LIKE '%/uploads/noticias/%'`, (err, row) => {
                                        console.log(`   Conteúdo com /uploads/noticias/: ${row.total} notícias`);
                                        
                                        console.log('\n╚═══════════════════════════════════════════════════════╝\n');
                                        
                                        db.close();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
