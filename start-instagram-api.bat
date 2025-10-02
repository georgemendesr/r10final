@echo off
echo ========================================
echo  API de Geracao de Cards Instagram
echo  Porta: 8080
echo ========================================
echo.

REM Ir para o diretório do projeto
cd /d "%~dp0"

REM Definir porta
set PORT=8080
set FORCE_PORT=8080

echo [1/2] Parando processos Node anteriores...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/2] Iniciando servidor Instagram...
echo.
echo      Acesse: http://localhost:8080
echo.

node server.js

pause
