const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   📁 Verificação de Estrutura de Uploads             ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const baseDir = __dirname;

// Verificar pastas
const pastas = [
    'uploads',
    'uploads/editor',
    'uploads/imagens',
    'uploads/noticias'
];

console.log('📂 Verificando estrutura de pastas:\n');

pastas.forEach(pasta => {
    const fullPath = path.join(baseDir, pasta);
    const existe = fs.existsSync(fullPath);
    
    if (existe) {
        console.log(`✅ ${pasta}/ existe`);
        
        // Contar arquivos
        try {
            const files = fs.readdirSync(fullPath);
            const subdirs = files.filter(f => {
                const stat = fs.statSync(path.join(fullPath, f));
                return stat.isDirectory();
            });
            
            if (subdirs.length > 0) {
                console.log(`   📊 ${subdirs.length} subpastas encontradas`);
            }
        } catch (e) {
            console.log(`   ⚠️  Erro ao ler pasta: ${e.message}`);
        }
    } else {
        console.log(`❌ ${pasta}/ NÃO existe`);
        
        if (pasta === 'uploads/noticias') {
            console.log('   ⚠️  ATENÇÃO: Esta pasta é OBRIGATÓRIA!');
        }
    }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Verificar banco de dados
console.log('🔍 Verificando caminhos de imagens no banco...\n');

const db = new sqlite3.Database('./arquivo.db');

db.all(`
    SELECT imagem 
    FROM noticias 
    WHERE imagem IS NOT NULL 
    LIMIT 20
`, (err, rows) => {
    if (err) {
        console.error('❌ Erro ao consultar banco:', err);
        process.exit(1);
    }
    
    const padroes = new Set();
    
    rows.forEach(row => {
        if (row.imagem) {
            // Extrair apenas a parte do diretório principal
            const match = row.imagem.match(/\/uploads\/([^\/]+)\//);
            if (match) {
                padroes.add(`/uploads/${match[1]}/`);
            }
        }
    });
    
    console.log('📸 Padrões de caminhos encontrados:\n');
    padroes.forEach(p => console.log(`   ${p}`));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 INSTRUÇÕES:\n');
    console.log('1. As imagens do banco de dados estão em:');
    padroes.forEach(p => console.log(`   ${p}[ID]/[arquivo]`));
    
    console.log('\n2. Você precisa copiar do seu backup:');
    console.log('   ORIGEM: backup/uploads/noticias/');
    console.log('   DESTINO: arquivo/uploads/noticias/');
    
    console.log('\n3. Mantenha a estrutura de subpastas:');
    console.log('   uploads/noticias/1/imagem.jpg');
    console.log('   uploads/noticias/2/imagem.jpg');
    console.log('   uploads/noticias/3/imagem.jpg');
    console.log('   etc...');
    
    console.log('\n4. O servidor já está configurado! ✅');
    console.log('   As imagens serão acessíveis em: http://localhost:5050/uploads/...');
    
    console.log('\n');
    
    db.close();
});
