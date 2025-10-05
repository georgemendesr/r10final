Param(
    [string]$Message = "deploy: atualiza backend e front (subtitulo, seed banners, clear endpoint)",
    [switch]$Force
)

Write-Host "==> Verificando alterações..." -ForegroundColor Cyan
$changes = git status --porcelain
if (-not $changes) {
    if (-not $Force) {
        Write-Host "Nenhuma alteração para enviar." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "--force usado: prosseguindo mesmo sem mudanças" -ForegroundColor Yellow
    }
}

Write-Host "==> Adicionando alterações" -ForegroundColor Cyan
git add .

Write-Host "==> Criando commit" -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Host "Commit falhou (talvez nenhuma mudança staged)." -ForegroundColor Yellow
}

Write-Host "==> Fazendo push" -ForegroundColor Cyan
git push origin master
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push falhou" -ForegroundColor Red
  exit 1
}

Write-Host "==> Push enviado. Verifique o painel do Render para acompanhar o deploy." -ForegroundColor Green
