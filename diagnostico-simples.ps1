# Diagnostico Completo - R10 Piaui
$baseUrl = "https://r10piaui.onrender.com"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTk3NjI5MjYsImV4cCI6MTc1OTc2MzgyNiwic3ViIjoxLCJlbWFpbCI6ImpvYW9AcjEwcGlhdWkuY29tIiwicm9sZSI6ImFkbWluIiwibmFtZSI6Ikpvw6NvIFNpbHZhIn0.dgZBv7L8rRs-F7mMlOnWTb1eg9K4lmrcGZONWb8VFMw"

Write-Host "=== DIAGNOSTICO COMPLETO ===" -ForegroundColor Cyan
Write-Host ""

# 1. TESTAR CRIACAO DE POSTS
Write-Host "1. TESTANDO CRIACAO DE POSTS..." -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    $body = @{
        titulo = "Teste Diagnostico"
        subtitulo = "Teste"
        conteudo = "<p>Teste</p>"
        autor = "Sistema"
        categoria = "geral"
        posicao = "geral"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/posts" -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "  OK - Posts funcionando! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ERRO - Posts NAO funcionando!" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Mensagem: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. VERIFICAR IMAGENS DESTAQUES
Write-Host "2. VERIFICANDO IMAGENS DOS DESTAQUES..." -ForegroundColor Yellow
try {
    $home = Invoke-RestMethod -Uri "$baseUrl/api/home" -UseBasicParsing
    
    Write-Host "  Total de destaques: $($home.destaques.Count)" -ForegroundColor Gray
    
    $broken = 0
    foreach ($post in $home.destaques) {
        $img = $post.imagemUrl
        if (!$img) { $img = $post.imagem_destaque }
        if (!$img) { $img = $post.imagem }
        
        if ($img) {
            try {
                $imgTest = Invoke-WebRequest -Uri $img -Method HEAD -UseBasicParsing -TimeoutSec 3
                Write-Host "  Post $($post.id): OK" -ForegroundColor Green
            } catch {
                Write-Host "  Post $($post.id): IMAGEM QUEBRADA (404)" -ForegroundColor Red
                Write-Host "    Titulo: $($post.titulo)" -ForegroundColor Gray
                Write-Host "    URL: $img" -ForegroundColor Gray
                $broken++
            }
        } else {
            Write-Host "  Post $($post.id): SEM IMAGEM" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    if ($broken -gt 0) {
        Write-Host "  TOTAL DE IMAGENS QUEBRADAS: $broken" -ForegroundColor Red
    } else {
        Write-Host "  Todas as imagens OK!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "  ERRO ao verificar destaques: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. VERIFICAR OG IMAGE
Write-Host "3. VERIFICANDO OG IMAGE..." -ForegroundColor Yellow

$ogPaths = @("/og-image.png", "/r10post.png")
$found = $false

foreach ($path in $ogPaths) {
    try {
        $og = Invoke-WebRequest -Uri "$baseUrl$path" -Method HEAD -UseBasicParsing -TimeoutSec 3
        Write-Host "  OK - Encontrado: $path" -ForegroundColor Green
        $found = $true
    } catch {
        Write-Host "  ERRO - Nao encontrado: $path" -ForegroundColor Red
    }
}

if (!$found) {
    Write-Host "  NENHUMA OG IMAGE ACESSIVEL!" -ForegroundColor Red
}

Write-Host ""

# 4. VERIFICAR SISTEMA
Write-Host "4. STATUS DO SISTEMA..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -UseBasicParsing
    Write-Host "  Sistema: ONLINE" -ForegroundColor Green
    Write-Host "  Database: $($health.database)" -ForegroundColor Gray
    Write-Host "  Path: $($health.path)" -ForegroundColor Gray
} catch {
    Write-Host "  Sistema: OFFLINE" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIM DO DIAGNOSTICO ===" -ForegroundColor Cyan
