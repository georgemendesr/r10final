@echo off
echo === Corrigindo usuarios do banco de dados ===
echo.
node corrigir-usuarios.cjs
echo.
echo === Pressione qualquer tecla para continuar ===
pause > nul
