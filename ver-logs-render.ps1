# Script para buscar logs do Render via API
# IMPORTANTE: Substitua YOUR_API_KEY pela sua chave da Render

Write-Host "Para ver os logs do servidor, acesse:" -ForegroundColor Yellow
Write-Host "https://dashboard.render.com/web/YOUR_SERVICE_ID/logs" -ForegroundColor Cyan
Write-Host ""
Write-Host "OU execute este comando para ver logs em tempo real:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Instrucoes:" -ForegroundColor White
Write-Host "1. Va em https://dashboard.render.com" -ForegroundColor Gray
Write-Host "2. Clique no servico r10piaui" -ForegroundColor Gray
Write-Host "3. Clique em 'Logs' no menu lateral" -ForegroundColor Gray
Write-Host "4. Procure por linhas com 'POST /api/posts' e 'ERRO'" -ForegroundColor Gray
Write-Host "5. Copie o stack trace completo e me envie" -ForegroundColor Gray
Write-Host ""
Write-Host "O erro 500 significa que o codigo esta quebrando no servidor." -ForegroundColor Red
Write-Host "Preciso ver o log para identificar a linha exata do problema." -ForegroundColor Red
