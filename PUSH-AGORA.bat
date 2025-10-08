@echo off
setlocal enabledelayedexpansion
echo.
echo ========================================
echo      COMMIT AUTOMATICO R10 PIAUI
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Limpando scripts temporarios...
for %%f in (git-status.js stage-editor.bat) do (
	if exist "%%f" (
		del "%%f" >nul 2>&1
		echo    - Removido %%f
	)
)
echo.

echo [2/6] Adicionando arquivos corretos...
git add PUSH-AGORA.bat
git add src/services/postsService.ts
git add r10-front_full_07ago/src/services/postsService.ts
if errorlevel 1 goto error_add
echo.

echo [3/6] Conferindo staging...
git status -sb
echo.

echo [4/6] Criando commit...
git commit -m "feat(editor): botão de upload direto e suporte base64"
if errorlevel 1 goto error_commit
echo.

echo [5/6] Enviando para GitHub...
git push origin master
if errorlevel 1 goto error_push
echo.

echo [6/6] Processo concluido com sucesso!
echo Render vai publicar sozinho em alguns minutos.
goto end

:error_add
echo.
echo Nao consegui adicionar os arquivos. Confira se o git esta instalado.
goto end

:error_commit
echo.
echo O commit falhou. Provavel motivo: nada para commitar (staging vazio).
echo Veja o status acima e me avise que eu te ajudo a ajustar.
goto end

:error_push
echo.
echo O push falhou. Confira a internet ou se o git esta logado.
goto end

:end
echo.
pause
