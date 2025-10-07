@echo off
echo.
echo ========================================
echo   ENVIANDO CORRECAO PARA GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Adicionando arquivo corrigido...
git add r10-front_full_07ago/src/components/PostForm.tsx

echo [2/3] Criando commit...
git commit -m "fix: corrigir PostForm corrompido (resolve build Render)"

echo [3/3] Enviando para GitHub...
git push origin master

echo.
echo ========================================
echo   CONCLUIDO! 
echo   O Render vai fazer deploy automatico
echo ========================================
echo.
pause
