@echo off
chcp 65001 > nul
echo ====================================
echo   CORREÇÃO DE IMAGENS - ARQUIVO R10
echo ====================================
echo.

echo [1/4] Parando serviços Node.js...
taskkill /f /im node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ Serviços parados
    timeout /t 2 /nobreak > nul
) else (
    echo ✓ Nenhum serviço rodando
)
echo.

echo [2/4] Executando correção de imagens...
echo (Isso pode demorar alguns minutos)
echo.
cd /d "%~dp0"
node fix-images-from-mysql-dump.cjs > correcao-log.txt 2>&1

if %errorlevel% == 0 (
    echo ✓ Script executado com sucesso!
) else (
    echo ✗ Erro ao executar script
    echo Veja os detalhes em correcao-log.txt
    pause
    exit /b 1
)
echo.

echo [3/4] Verificando resultado...
node verify-karyne.cjs
echo.

echo [4/4] Exibindo resumo...
echo.
type correcao-log.txt | findstr /C:"RESUMO" /C:"Atualizados" /C:"Registros"
echo.

echo ====================================
echo   CORREÇÃO CONCLUÍDA!
echo ====================================
echo.
echo Log completo salvo em: correcao-log.txt
echo.
echo Pressione qualquer tecla para reiniciar os serviços...
pause > nul

echo.
echo Reiniciando serviços...
start "R10 Services" cmd /k "npm run dev"

echo.
echo ✓ Serviços reiniciados!
echo.
echo Acesse: http://localhost:3002/arquivo
echo Procure por: "Karyne do Rodrigão é premiada"
echo.
pause
