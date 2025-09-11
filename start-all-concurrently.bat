@echo off
title R10 - Sistema Completo
color 0A

echo ======================================
echo    INICIANDO SISTEMA R10 PIAUÍ
echo ======================================
echo.

REM Verificar dependências
if not exist "node_modules" (
    echo 📦 Instalando dependências raiz...
    npm install
)

if not exist "r10-front_full_07ago\node_modules" (
    echo 📦 Instalando dependências frontend...
    cd r10-front_full_07ago
    npm install
    cd ..
)

REM Parar processos anteriores
echo 🛑 Parando processos anteriores...
taskkill /f /im node.exe >nul 2>&1
timeout 3 >nul

REM Criar arquivo de monitoramento
echo 🔥 Iniciando todos os serviços com concurrently...

REM Usar concurrently para gerenciar todos os processos
npx concurrently ^
  --names "BACKEND,FRONTEND,INSTAGRAM" ^
  --prefix "[{name}]" ^
  --prefix-colors "green,cyan,yellow" ^
  --kill-others-on-fail ^
  --restart-tries 5 ^
  "cd server && node server-api-simple.cjs" ^
  "cd r10-front_full_07ago && npm run dev" ^
  "node server.js"

echo.
echo ⚠️ Todos os serviços foram finalizados.
pause
