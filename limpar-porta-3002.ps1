Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "LIMPEZA DE PORTA 3002 E REINICIO DO R10" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Passo 1: Encontrar processo na porta 3002
Write-Host "[1] Procurando processo na porta 3002..." -ForegroundColor Yellow
$port = 3002
$connections = netstat -ano | Select-String ":$port"

if ($connections) {
    Write-Host "Conexoes encontradas na porta $port`:" -ForegroundColor Red
    $connections | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Extrair PIDs
    $pids = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Select-Object -Unique
    
    Write-Host "`nMatando processos: $($pids -join ', ')" -ForegroundColor Red
    foreach ($processId in $pids) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "  PID $processId encerrado!" -ForegroundColor Green
        } catch {
            Write-Host "  Erro ao matar PID ${processId}: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Nenhum processo encontrado na porta $port" -ForegroundColor Green
}

# Passo 2: Matar todos os processos Node.js
Write-Host "`n[2] Matando todos os processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Encontrados $($nodeProcesses.Count) processos Node" -ForegroundColor Gray
    $nodeProcesses | ForEach-Object {
        Write-Host "  Matando PID $($_.Id) ($($_.ProcessName))..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "Processos Node encerrados!" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Node encontrado" -ForegroundColor Green
}

# Passo 3: Aguardar liberação da porta
Write-Host "`n[3] Aguardando liberacao da porta..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Passo 4: Verificar se porta está livre
Write-Host "`n[4] Verificando se porta esta livre..." -ForegroundColor Yellow
$stillUsed = netstat -ano | Select-String ":$port"
if ($stillUsed) {
    Write-Host "ATENCAO: Porta $port ainda esta em uso!" -ForegroundColor Red
    $stillUsed | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "Porta $port esta LIVRE!" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRONTO! Agora execute: npm run dev" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
