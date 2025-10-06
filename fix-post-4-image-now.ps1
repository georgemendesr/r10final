# Corrigir imagem do post 4 agora
$API_BASE = "https://r10piaui.onrender.com/api"

# Imagem válida de educação
$newImageUrl = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop"

Write-Host "🔧 Atualizando imagem do post 4..."

# Primeiro vamos testar se a imagem funciona
try {
    $imgTest = Invoke-WebRequest -Uri $newImageUrl -Method Head -UseBasicParsing
    Write-Host "✅ URL de imagem válida (Status: $($imgTest.StatusCode))"
} catch {
    Write-Host "❌ URL de imagem não funciona!"
    exit
}

Write-Host ""
Write-Host "⚠️ ATENÇÃO: Você precisa fazer login no admin primeiro!"
Write-Host "1. Abra https://r10piaui.onrender.com/admin"
Write-Host "2. Faça login"
Write-Host "3. Abra o Console (F12)"
Write-Host "4. Digite: localStorage.getItem('token')"
Write-Host "5. Copie o token (sem aspas)"
Write-Host ""
$token = Read-Host "Cole o token aqui (ou deixe vazio para pular)"

if (-not $token) {
    Write-Host "❌ Token não fornecido. Você pode atualizar manualmente:"
    Write-Host "   1. Edite o post 4 no admin"
    Write-Host "   2. Cole esta URL no campo de imagem: $newImageUrl"
    Write-Host "   3. Salve"
    exit
}

try {
    $body = @{
        imagemUrl = $newImageUrl
        imagemDestaque = $newImageUrl
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_BASE/posts/4" -Method Put `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "✅ Post 4 atualizado com sucesso!"
    Write-Host "Nova URL: $newImageUrl"
    Write-Host ""
    Write-Host "Agora acesse: https://r10piaui.onrender.com"
    Write-Host "A imagem deve aparecer na seção Destaque!"
} catch {
    Write-Host "❌ Erro ao atualizar:"
    Write-Host $_.Exception.Message
}
