# Script para matar processo Node fantasma e iniciar API Instagram
# EXECUTE COMO ADMINISTRADOR: clique com botão direito > Executar como Administrador

Write-Host "🔍 Verificando processos Node fantasmas..." -ForegroundColor Yellow

# Matar processo fantasma 3648 (rodando como Service)
try {
    $ghostProcess = Get-Process -Id 3648 -ErrorAction SilentlyContinue
    if ($ghostProcess) {
        Write-Host "⚠️ Processo fantasma encontrado (PID 3648)" -ForegroundColor Red
        Write-Host "   Tentando finalizar..." -ForegroundColor Yellow
        
        # Método 1: Stop-Process forçado
        Stop-Process -Id 3648 -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Verificar se ainda existe
        $stillAlive = Get-Process -Id 3648 -ErrorAction SilentlyContinue
        if ($stillAlive) {
            Write-Host "   Método 1 falhou, tentando taskkill..." -ForegroundColor Yellow
            # Método 2: taskkill /F
            taskkill /PID 3648 /F /T
            Start-Sleep -Seconds 2
        }
        
        # Verificação final
        $finalCheck = Get-Process -Id 3648 -ErrorAction SilentlyContinue
        if ($finalCheck) {
            Write-Host "❌ ERRO: Processo fantasma não pôde ser finalizado!" -ForegroundColor Red
            Write-Host "   Reinicie o Windows para liberar o processo." -ForegroundColor Yellow
            exit 1
        } else {
            Write-Host "✅ Processo fantasma finalizado com sucesso!" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ Nenhum processo fantasma encontrado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Erro ao verificar processo: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Iniciando API de Geração de Cards Instagram..." -ForegroundColor Cyan
Write-Host ""

# Mudar para o diretório do projeto
Set-Location "C:\Users\George Mendes\Desktop\r10final"

# Setar variável de ambiente para FORÇAR porta 8080
$env:PORT = "8080"
$env:FORCE_PORT = "8080"

# Iniciar server.js
Write-Host "📱 Servidor iniciando na porta 8080..." -ForegroundColor Yellow
node server.js

# Se chegou aqui, o servidor foi interrompido
Write-Host ""
Write-Host "⚠️ Servidor encerrado" -ForegroundColor Yellow
