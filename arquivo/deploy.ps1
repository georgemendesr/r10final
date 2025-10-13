# 🚀 SCRIPT DE DEPLOY RÁPIDO

Write-Host "🚀 INICIANDO DEPLOY DO ARQUIVO R10 PIAUÍ" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Navegar para o diretório
cd "c:\Users\George Mendes\Desktop\r10final\arquivo"

# Verificar se já é um repositório Git
if (Test-Path ".git") {
    Write-Host "✅ Repositório Git já inicializado" -ForegroundColor Green
} else {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git inicializado!" -ForegroundColor Green
}

Write-Host "`n📝 Adicionando arquivos..." -ForegroundColor Yellow
git add .

Write-Host "`n💾 Criando commit..." -ForegroundColor Yellow
git commit -m "Deploy: Arquivo R10 Piauí com 15.927 notícias e imagens no Cloudinary"

Write-Host "`n" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ COMMIT CRIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 PRÓXIMOS PASSOS:`n" -ForegroundColor Yellow

Write-Host "1️⃣  Criar repositório no GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new`n" -ForegroundColor Gray

Write-Host "2️⃣  Depois de criar, execute:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/SEU_USUARIO/r10-arquivo.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main`n" -ForegroundColor Gray

Write-Host "3️⃣  Deploy no Render:" -ForegroundColor White
Write-Host "   https://dashboard.render.com/select-repo`n" -ForegroundColor Gray

Write-Host "📄 Consulte DEPLOY-RENDER.md para instruções detalhadas!" -ForegroundColor Cyan

Write-Host "`n✨ Pronto para deploy! ✨`n" -ForegroundColor Green
