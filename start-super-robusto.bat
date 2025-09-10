@echo off
title R10 PIAUI - INICIADOR ROBUSTO
color 0A

echo =====================================================
echo           R10 PIAUI - INICIADOR SUPER ROBUSTO
echo =====================================================
echo.

REM Mata processos anteriores
echo [LIMPEZA] Finalizando processos Node.js anteriores...
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 >nul

REM Limpa o console
cls

echo =====================================================
echo           R10 PIAUI - INICIANDO SERVICOS
echo =====================================================
echo.

echo [1/4] Verificando diretorios...
if not exist "r10-front_full_07ago" (
    echo ERRO: Pasta r10-front_full_07ago nao encontrada!
    pause
    exit /b 1
)

if not exist "server" (
    echo ERRO: Pasta server nao encontrada!
    pause
    exit /b 1
)

echo [2/4] Instalando dependencias se necessario...
cd r10-front_full_07ago
call npm install --silent >nul 2>&1
cd ..

echo [3/4] Iniciando Backend API (porta 3002)...
start "R10-Backend-API" cmd /k "echo ===== BACKEND API ===== && cd /d %~dp0 && node server/server-api-simple.cjs"
timeout /t 3

echo [4/4] Iniciando Frontend (porta 5175)...
start "R10-Frontend-Vite" cmd /k "echo ===== FRONTEND VITE ===== && cd /d %~dp0r10-front_full_07ago && npm run dev"
timeout /t 5

echo [EXTRA] Iniciando Instagram Publisher (porta 8080)...
start "R10-Instagram" cmd /k "echo ===== INSTAGRAM PUBLISHER ===== && cd /d %~dp0 && node server.js"
timeout /t 3

echo.
echo =====================================================
echo   TODOS OS SERVICOS INICIADOS!
echo.
echo   Frontend:  http://localhost:5175
echo   Backend:   http://localhost:3002  
echo   Instagram: http://localhost:8080
echo =====================================================
echo.

echo Aguardando 10 segundos para estabilizar...
timeout /t 10

echo Abrindo navegador...
start http://localhost:5175

echo.
echo =====================================================
echo  SERVICOS RODANDO EM JANELAS SEPARADAS
echo  Para parar: feche as janelas dos servicos
echo  Para reiniciar: execute este arquivo novamente
echo =====================================================
echo.
pause
