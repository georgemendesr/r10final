# Script para copiar imagens do backup para o arquivo
# Execute este script no PowerShell

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  COPIAR IMAGENS DO BACKUP" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# EDITE AQUI: Coloque o caminho da pasta do backup
$CAMINHO_BACKUP = "D:\Backup"  # <-- ALTERE ESTE CAMINHO

# Caminho de destino (não altere)
$DESTINO = "$PSScriptRoot\uploads"

Write-Host "Origem: $CAMINHO_BACKUP" -ForegroundColor Yellow
Write-Host "Destino: $DESTINO" -ForegroundColor Yellow
Write-Host ""

# Verificar se o backup existe
if (-Not (Test-Path $CAMINHO_BACKUP)) {
    Write-Host "ERRO: Caminho do backup não encontrado!" -ForegroundColor Red
    Write-Host "Edite o script e altere a variável CAMINHO_BACKUP" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Criar pasta uploads se não existir
if (-Not (Test-Path $DESTINO)) {
    Write-Host "Criando pasta uploads..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $DESTINO | Out-Null
}

# Função para copiar pasta
function Copiar-Pasta {
    param(
        [string]$Nome,
        [int]$Prioridade,
        [string]$Descricao
    )
    
    $origem = Join-Path $CAMINHO_BACKUP "uploads\$Nome"
    $destino = Join-Path $DESTINO $Nome
    
    Write-Host ""
    Write-Host "[$Prioridade] Copiando: /uploads/$Nome" -ForegroundColor Cyan
    Write-Host "    $Descricao" -ForegroundColor Gray
    
    if (-Not (Test-Path $origem)) {
        Write-Host "    ⚠ Pasta não encontrada no backup: $origem" -ForegroundColor Yellow
        return
    }
    
    try {
        if (Test-Path $destino) {
            Write-Host "    → Pasta já existe, mesclando arquivos..." -ForegroundColor Yellow
        }
        
        $totalArquivos = (Get-ChildItem -Path $origem -Recurse -File | Measure-Object).Count
        Write-Host "    → Arquivos a copiar: $totalArquivos" -ForegroundColor White
        
        Copy-Item -Path $origem -Destination $DESTINO -Recurse -Force
        
        Write-Host "    ✓ Copiado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "    ✗ Erro ao copiar: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Iniciando cópia das imagens..." -ForegroundColor Green
Write-Host ""

# Copiar em ordem de prioridade
Copiar-Pasta -Nome "imagens" -Prioridade 1 -Descricao "12.825 notícias (80%) - PRIORIDADE MÁXIMA"
Copiar-Pasta -Nome "editor" -Prioridade 2 -Descricao "3.948 notícias no HTML - IMPORTANTE"
Copiar-Pasta -Nome "noticias" -Prioridade 3 -Descricao "3.078 notícias (20%) - OPCIONAL"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  CÓPIA CONCLUÍDA!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "As imagens foram copiadas para:" -ForegroundColor White
Write-Host "  $DESTINO" -ForegroundColor Yellow
Write-Host ""
Write-Host "Agora recarregue o site: http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
