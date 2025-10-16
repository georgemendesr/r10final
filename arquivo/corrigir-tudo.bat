@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ====================================
echo   CORREÇÃO TOTAL - VERSÃO MELHORADA
echo ====================================
echo.

echo Parando serviços...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Executando correção completa...
node fix-all-images-improved.cjs

echo.
echo ====================================
echo   CONCLUÍDO!
echo ====================================
echo.
pause
