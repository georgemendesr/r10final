# Teste direto de criação de post (sem auth - apenas para debug)
Write-Host "🧪 Testando criação de post diretamente no banco via API..."
Write-Host ""
Write-Host "⚠️ ATENÇÃO: Você precisa do token de admin!"
Write-Host "1. Abra https://r10piaui.onrender.com/admin"
Write-Host "2. Faça login"
Write-Host "3. Pressione F12 → Console"
Write-Host "4. Digite: localStorage.getItem('token')"
Write-Host "5. Copie o token (o texto entre aspas)"
Write-Host ""

$token = Read-Host "Cole o token aqui (ou pressione Enter para pular)"

if (-not $token) {
    Write-Host "❌ Sem token, não posso testar"
    exit
}

Write-Host ""
Write-Host "📝 Criando post de teste..."

$body = @{
    titulo = "TESTE AUTOMATIZADO $(Get-Date -Format 'HH:mm:ss')"
    conteudo = "Conteúdo mínimo de teste"
    categoria = "geral"
    posicao = "geral"
    autor = "Sistema"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://r10piaui.onrender.com/api/posts" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ SUCESSO! Post criado:"
    Write-Host "   ID: $($response.id)"
    Write-Host "   Título: $($response.titulo)"
    Write-Host ""
    Write-Host "Verificando se aparece na listagem..."
    
    Start-Sleep -Seconds 2
    
    $lista = Invoke-RestMethod -Uri "https://r10piaui.onrender.com/api/posts?admin=1&limit=5"
    $ultimo = $lista.posts | Sort-Object id -Descending | Select-Object -First 1
    
    if ($ultimo.id -eq $response.id) {
        Write-Host "✅ POST APARECE NA LISTA!"
        Write-Host "   Último post: ID $($ultimo.id) - $($ultimo.titulo)"
    } else {
        Write-Host "❌ POST NÃO APARECE NA LISTA!"
        Write-Host "   ID criado: $($response.id)"
        Write-Host "   Último na lista: ID $($ultimo.id) - $($ultimo.titulo)"
    }
    
} catch {
    Write-Host "❌ ERRO ao criar post:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)"
    }
}
