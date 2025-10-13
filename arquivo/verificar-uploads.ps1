# Script para verificar estrutura de pastas de uploads

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   📁 Verificação de Pastas de Uploads               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$arquivoPath = "c:\Users\George Mendes\Desktop\r10final\arquivo"

# Verificar estrutura atual
Write-Host "📂 Estrutura atual de uploads:`n" -ForegroundColor Yellow

if (Test-Path "$arquivoPath\uploads") {
    Write-Host "✅ uploads/ existe" -ForegroundColor Green
    
    if (Test-Path "$arquivoPath\uploads\editor") {
        Write-Host "✅ uploads/editor/ existe" -ForegroundColor Green
        $editorCount = (Get-ChildItem "$arquivoPath\uploads\editor" -Recurse -File).Count
        Write-Host "   📊 Arquivos: $editorCount" -ForegroundColor Gray
    } else {
        Write-Host "❌ uploads/editor/ NÃO existe" -ForegroundColor Red
    }
    
    if (Test-Path "$arquivoPath\uploads\imagens") {
        Write-Host "✅ uploads/imagens/ existe" -ForegroundColor Green
        $imagensCount = (Get-ChildItem "$arquivoPath\uploads\imagens" -Recurse -File).Count
        Write-Host "   📊 Arquivos: $imagensCount" -ForegroundColor Gray
    } else {
        Write-Host "❌ uploads/imagens/ NÃO existe" -ForegroundColor Red
    }
    
    if (Test-Path "$arquivoPath\uploads\noticias") {
        Write-Host "✅ uploads/noticias/ existe" -ForegroundColor Green
        $noticiasCount = (Get-ChildItem "$arquivoPath\uploads\noticias" -Recurse -File).Count
        Write-Host "   📊 Arquivos: $noticiasCount" -ForegroundColor Gray
    } else {
        Write-Host "❌ uploads/noticias/ NÃO existe" -ForegroundColor Red
        Write-Host "`n⚠️  ATENÇÃO: Esta pasta é necessária!" -ForegroundColor Yellow
        Write-Host "   As imagens das notícias estão em: /uploads/noticias/[ID]/[arquivo]" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Pasta uploads/ NÃO existe!" -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Verificar banco de dados
Write-Host "🔍 Verificando caminhos no banco de dados...`n" -ForegroundColor Yellow

cd "$arquivoPath"

$scriptNode = @"
const db = require('sqlite3').verbose();
const dbPath = './arquivo.db';

const database = new db.Database(dbPath);

database.all('SELECT DISTINCT SUBSTR(imagem, 1, INSTR(imagem, \"/\", 10)) as pasta FROM noticias WHERE imagem IS NOT NULL LIMIT 20', (err, rows) => {
    if (err) {
        console.log('Erro:', err);
        process.exit(1);
    }
    
    console.log('📸 Padrões de caminhos encontrados:\n');
    const pastas = new Set();
    rows.forEach(row => {
        if (row.pasta) {
            pastas.add(row.pasta);
        }
    });
    
    pastas.forEach(p => console.log('   ' + p));
    
    database.close();
});
"@

$scriptNode | node

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "💡 INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "`n1. Certifique-se de ter as seguintes pastas:" -ForegroundColor White
Write-Host "   arquivo/uploads/editor/" -ForegroundColor Gray
Write-Host "   arquivo/uploads/imagens/" -ForegroundColor Gray
Write-Host "   arquivo/uploads/noticias/" -ForegroundColor Gray
Write-Host "`n2. Copie as imagens do backup para:" -ForegroundColor White
Write-Host "   - Se vier de 'uploads/noticias/' → arquivo/uploads/noticias/" -ForegroundColor Gray
Write-Host "   - Se vier de 'uploads/editor/' → arquivo/uploads/editor/" -ForegroundColor Gray
Write-Host "   - Se vier de 'uploads/imagens/' → arquivo/uploads/imagens/" -ForegroundColor Gray
Write-Host "`n3. Mantenha a estrutura de subpastas (ex: noticias/1/, noticias/2/, etc.)" -ForegroundColor White
Write-Host "`n4. O servidor já está configurado para servir /uploads/" -ForegroundColor White
Write-Host "`n"
