# ========================================
# SCRIPT DE BUILD PARA PRODUÇÃO
# Execute antes de fazer deploy
# ========================================

Write-Host "🚀 Preparando build para produção..." -ForegroundColor Cyan

# 1. Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

# 2. Limpar builds anteriores
Write-Host "`n📦 Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "r10-front_full_07ago\dist") {
    Remove-Item -Recurse -Force "r10-front_full_07ago\dist"
}

# 3. Instalar dependências do frontend (se necessário)
Write-Host "`n📥 Verificando dependências do frontend..." -ForegroundColor Yellow
Set-Location "r10-front_full_07ago"

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# 4. Build do frontend
Write-Host "`n🔨 Buildando frontend para produção..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do frontend!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 5. Verificar se build foi criado
if (-not (Test-Path "dist\index.html")) {
    Write-Host "❌ Build falhou: dist/index.html não encontrado!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# 6. Verificar tamanho do build
$buildSize = (Get-ChildItem -Path "r10-front_full_07ago\dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "`n📊 Tamanho do build: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Green

# 7. Criar pastas necessárias (se não existirem)
Write-Host "`n📁 Criando estrutura de pastas..." -ForegroundColor Yellow
$folders = @("logs", "uploads\tmp", "uploads\imagens", "uploads\editor", "uploads\cards")
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✅ Criado: $folder" -ForegroundColor Green
    }
}

# 8. Verificar arquivos essenciais
Write-Host "`n🔍 Verificando arquivos essenciais..." -ForegroundColor Yellow
$required = @(
    "package.json",
    "server.js",
    "server\server-api-simple.cjs",
    "ecosystem.production.js",
    "optimize-puppeteer.js",
    "card-queue.js",
    "DEPLOY-INTEGRATOR.md"
)

$missing = @()
foreach ($file in $required) {
    if (-not (Test-Path $file)) {
        $missing += $file
        Write-Host "  ❌ Faltando: $file" -ForegroundColor Red
    } else {
        Write-Host "  ✅ OK: $file" -ForegroundColor Green
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n❌ Arquivos faltando! Verifique antes de continuar." -ForegroundColor Red
    exit 1
}

# 9. Verificar .env.production.template
Write-Host "`n🔐 Verificando template de ambiente..." -ForegroundColor Yellow
if (Test-Path ".env.production.template") {
    Write-Host "  ✅ .env.production.template encontrado" -ForegroundColor Green
    Write-Host "  ⚠️  Lembre-se de configurar .env no servidor!" -ForegroundColor Yellow
} else {
    Write-Host "  ⚠️  .env.production.template não encontrado" -ForegroundColor Yellow
}

# 10. Resumo final
Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host (" " * 48) -NoNewline
Write-Host "=" -ForegroundColor Cyan
Write-Host "  ✅ BUILD CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host (" " * 48) -NoNewline
Write-Host "=" -ForegroundColor Cyan

Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Adicionar build ao Git:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Gray
Write-Host "     git commit -m 'build: preparar para produção'" -ForegroundColor Gray
Write-Host "     git push" -ForegroundColor Gray
Write-Host "`n  2. Seguir guia: DEPLOY-INTEGRATOR.md" -ForegroundColor White
Write-Host "`n  3. Configurar .env no servidor com seus tokens" -ForegroundColor White
Write-Host "`n  4. Iniciar com PM2:" -ForegroundColor White
Write-Host "     pm2 start ecosystem.production.js" -ForegroundColor Gray

Write-Host "`n🎉 Boa sorte com o deploy!" -ForegroundColor Green
