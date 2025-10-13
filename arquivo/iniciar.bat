@echo off
echo.
echo ========================================
echo   Arquivo de Noticias - R10 Piaui
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando dependencias...
if not exist "node_modules\" (
    echo.
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo Dependencias OK
)

echo.
echo [2/3] Verificando banco de dados...
if not exist "arquivo.db" (
    echo.
    echo Criando banco e populando com dados de teste...
    call npm run seed
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao criar banco de dados
        pause
        exit /b 1
    )
) else (
    echo Banco de dados OK
)

echo.
echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo   Servidor em: http://localhost:5050
echo   Pressione Ctrl+C para parar
echo ========================================
echo.

call npm start
