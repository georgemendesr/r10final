# Teste local do POST /api/posts
$token = Read-Host "Cole seu token JWT (veja no localStorage do navegador)"

Write-Host "`nTestando POST local (porta 3002)..." -ForegroundColor Yellow

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    titulo = "Teste Local Debug"
    subtitulo = "Teste"
    conteudo = "<p>Conteudo de teste</p>"
    autor = "Sistema"
    categoria = "geral"
    posicao = "geral"
    chapeu = ""
    imagemUrl = $null
} | ConvertTo-Json

Write-Host "Body enviado:" -ForegroundColor Gray
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/posts" -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "SUCESSO!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host $response.Content -ForegroundColor Gray
    
} catch {
    Write-Host "ERRO!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    try {
        $errorBody = $_.ErrorDetails.Message
        if ($errorBody) {
            Write-Host "`nResposta do servidor:" -ForegroundColor Yellow
            Write-Host $errorBody -ForegroundColor Gray
        }
    } catch {}
}
