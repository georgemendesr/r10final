# 🔍 DIAGNÓSTICO COMPLETO - R10 PIAUÍ
# Verifica todos os problemas reportados

$baseUrl = "https://r10piaui.onrender.com"
$ErrorActionPreference = "Continue"

Write-Host "`n📋 RELATÓRIO DE DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "URL Base: $baseUrl`n" -ForegroundColor Gray

# ============================================================================
# 1. TESTAR CRIAÇÃO DE POSTS
# ============================================================================
Write-Host "`n🔴 PROBLEMA 1: CRIAÇÃO DE NOVAS MATÉRIAS" -ForegroundColor Red
Write-Host "-" * 70 -ForegroundColor Gray

try {
    Write-Host "Testando endpoint POST /api/posts..." -ForegroundColor Yellow
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTk3NjI5MjYsImV4cCI6MTc1OTc2MzgyNiwic3ViIjoxLCJlbWFpbCI6ImpvYW9AcjEwcGlhdWkuY29tIiwicm9sZSI6ImFkbWluIiwibmFtZSI6Ikpvw6NvIFNpbHZhIn0.dgZBv7L8rRs-F7mMlOnWTb1eg9K4lmrcGZONWb8VFMw"
    }
    
    $body = @{
        titulo = "🧪 Teste Diagnóstico $(Get-Date -Format 'HH:mm:ss')"
        subtitulo = "Teste de criação"
        conteudo = "<p>Testando criação de post</p>"
        autor = "Sistema"
        categoria = "geral"
        posicao = "geral"
        chapeu = "TESTE"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/posts" -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "✅ STATUS: $($response.StatusCode) - POST funcionando!" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ID criado: $($data.id)" -ForegroundColor Gray
    Write-Host "   Título: $($data.titulo)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERRO: Criação de posts FALHANDO" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    try {
        $errorBody = $_.ErrorDetails.Message
        if ($errorBody) {
            Write-Host "`n   📄 Resposta do servidor:" -ForegroundColor Yellow
            Write-Host "   $errorBody" -ForegroundColor Gray
        }
    } catch {}
}

# ============================================================================
# 2. VERIFICAR IMAGENS DA SEÇÃO DESTAQUE
# ============================================================================
Write-Host "`n🔴 PROBLEMA 2: IMAGENS QUEBRADAS NA SEÇÃO DESTAQUE" -ForegroundColor Red
Write-Host "-" * 70 -ForegroundColor Gray

try {
    Write-Host "Buscando posts da home..." -ForegroundColor Yellow
    $home = Invoke-RestMethod -Uri "$baseUrl/api/home" -Method GET -UseBasicParsing
    
    Write-Host "`n📊 Posts encontrados:" -ForegroundColor Cyan
    Write-Host "   Super Manchete: $(if($home.hero) { '1 post' } else { 'nenhum' })" -ForegroundColor Gray
    Write-Host "   Destaques: $($home.destaques.Count) posts" -ForegroundColor Gray
    Write-Host "   Geral: $($home.geral.Count) posts" -ForegroundColor Gray
    
    # Verificar imagens dos destaques
    Write-Host "`n🖼️ Verificando imagens dos DESTAQUES:" -ForegroundColor Yellow
    
    $imagensBroken = @()
    
    foreach ($post in $home.destaques) {
        $imageUrl = $null
        
        # Tentar diferentes campos de imagem
        if ($post.imagemUrl) { $imageUrl = $post.imagemUrl }
        elseif ($post.imagem_destaque) { $imageUrl = $post.imagem_destaque }
        elseif ($post.imagem) { $imageUrl = $post.imagem }
        
        $status = "❓ Sem imagem"
        $color = "Gray"
        
        if ($imageUrl) {
            try {
                # Tentar acessar a imagem
                $imgResponse = Invoke-WebRequest -Uri $imageUrl -Method HEAD -UseBasicParsing -TimeoutSec 5
                if ($imgResponse.StatusCode -eq 200) {
                    $status = "✅ OK (200)"
                    $color = "Green"
                } else {
                    $status = "⚠️ $($imgResponse.StatusCode)"
                    $color = "Yellow"
                }
            } catch {
                $status = "❌ 404 QUEBRADA"
                $color = "Red"
                $imagensBroken += @{
                    PostId = $post.id
                    Titulo = $post.titulo
                    ImageUrl = $imageUrl
                }
            }
        }
        
        Write-Host "   Post $($post.id): $status" -ForegroundColor $color
        Write-Host "      Título: $($post.titulo.Substring(0, [Math]::Min(50, $post.titulo.Length)))..." -ForegroundColor Gray
        if ($imageUrl) {
            Write-Host "      URL: $($imageUrl.Substring(0, [Math]::Min(80, $imageUrl.Length)))..." -ForegroundColor Gray
        }
    }
    
    if ($imagensBroken.Count -gt 0) {
        Write-Host "`n❌ TOTAL DE IMAGENS QUEBRADAS: $($imagensBroken.Count)" -ForegroundColor Red
        Write-Host "`n📋 Posts que precisam de correção:" -ForegroundColor Yellow
        foreach ($broken in $imagensBroken) {
            Write-Host "   • Post ID $($broken.PostId): $($broken.Titulo)" -ForegroundColor Red
            Write-Host "     URL quebrada: $($broken.ImageUrl)" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n✅ Todas as imagens dos destaques estão funcionando!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ ERRO ao verificar destaques: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# 3. VERIFICAR OG IMAGE
# ============================================================================
Write-Host "`n🔴 PROBLEMA 3: OG IMAGE (OPEN GRAPH)" -ForegroundColor Red
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "Testando OG Images..." -ForegroundColor Yellow

$ogPaths = @(
    "/og-image.png",
    "/r10post.png",
    "/public/og-image.png"
)

$ogFound = $false

foreach ($path in $ogPaths) {
    try {
        $ogUrl = "$baseUrl$path"
        $ogResponse = Invoke-WebRequest -Uri $ogUrl -Method HEAD -UseBasicParsing -TimeoutSec 5
        
        if ($ogResponse.StatusCode -eq 200) {
            Write-Host "✅ ENCONTRADO: $path" -ForegroundColor Green
            Write-Host "   URL completa: $ogUrl" -ForegroundColor Gray
            Write-Host "   Content-Type: $($ogResponse.Headers['Content-Type'])" -ForegroundColor Gray
            Write-Host "   Tamanho: $([Math]::Round($ogResponse.Headers['Content-Length'] / 1024, 2)) KB" -ForegroundColor Gray
            $ogFound = $true
        }
    } catch {
        Write-Host "❌ NÃO ENCONTRADO: $path (404)" -ForegroundColor Red
    }
}

if (-not $ogFound) {
    Write-Host "`n❌ NENHUMA OG IMAGE ENCONTRADA!" -ForegroundColor Red
    Write-Host "   A imagem precisa estar acessível em uma dessas URLs" -ForegroundColor Yellow
}

# Verificar HTML da página para ver meta tags
try {
    Write-Host "`n🔍 Verificando meta tags OG no HTML..." -ForegroundColor Yellow
    $htmlResponse = Invoke-WebRequest -Uri $baseUrl -Method GET -UseBasicParsing
    $html = $htmlResponse.Content
    
    if ($html -match 'og:image["\s]+content=["\']([^"\']+)["\']') {
        $ogImageUrl = $matches[1]
        Write-Host "✅ Meta tag encontrada: $ogImageUrl" -ForegroundColor Green
        
        # Testar se a URL funciona
        try {
            $testOg = Invoke-WebRequest -Uri $ogImageUrl -Method HEAD -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ URL da OG Image acessível!" -ForegroundColor Green
        } catch {
            Write-Host "❌ URL da OG Image NÃO ACESSÍVEL (404)!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Meta tag og:image NÃO ENCONTRADA no HTML!" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️ Não foi possível analisar o HTML" -ForegroundColor Yellow
}

# ============================================================================
# 4. VERIFICAR HEALTH DO SISTEMA
# ============================================================================
Write-Host "`n📊 STATUS DO SISTEMA" -ForegroundColor Cyan
Write-Host "-" * 70 -ForegroundColor Gray

try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ Sistema ONLINE" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor Gray
    Write-Host "   Path: $($health.path)" -ForegroundColor Gray
    Write-Host "   Persistente: $($health.persistent)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Sistema OFFLINE ou com problemas" -ForegroundColor Red
}

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host "`n" + "=" * 70 -ForegroundColor Gray
Write-Host "📋 RESUMO DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "`nVeja acima os detalhes de cada problema encontrado." -ForegroundColor Yellow
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Corrigir o erro de criação de posts (se houver)" -ForegroundColor Gray
Write-Host "2. Substituir imagens quebradas dos destaques" -ForegroundColor Gray
Write-Host "3. Configurar OG Image corretamente" -ForegroundColor Gray
Write-Host ""
