# Script para testar upload de imagem
$API_BASE = "https://r10piaui.onrender.com/api"

# Você precisa colocar seu token JWT aqui (pegar do localStorage no navegador)
Write-Host "Para testar o upload, você precisa:"
Write-Host "1. Abrir o site: https://r10piaui.onrender.com/admin"
Write-Host "2. Fazer login"
Write-Host "3. Abrir Console do navegador (F12)"
Write-Host "4. Digitar: localStorage.getItem('token')"
Write-Host "5. Copiar o token e colar aqui"
Write-Host ""
$token = Read-Host "Cole o token aqui"

if (-not $token) {
    Write-Host "❌ Token não fornecido"
    exit
}

# Verificar se há uma imagem de teste
$testImage = "test-upload.jpg"
if (-not (Test-Path $testImage)) {
    Write-Host "⚠️ Crie um arquivo test-upload.jpg para testar"
    exit
}

Write-Host "📤 Testando upload..."

try {
    # Criar form data
    $filePath = Resolve-Path $testImage
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileEnc = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"image`"; filename=`"test.jpg`"",
        "Content-Type: image/jpeg",
        "",
        $fileEnc,
        "--$boundary--"
    ) -join "`r`n"

    $response = Invoke-RestMethod -Uri "$API_BASE/upload" -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } `
        -Body $bodyLines

    Write-Host "✅ Upload bem-sucedido!"
    Write-Host "URL da imagem: $($response.imageUrl)"
} catch {
    Write-Host "❌ Erro no upload:"
    Write-Host $_.Exception.Message
}
