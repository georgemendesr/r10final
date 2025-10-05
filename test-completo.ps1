# Script de teste completo do site R10 Piauí
# Testa: autenticação, reações, posts, banners, analytics

$base = "https://r10piaui.onrender.com"

Write-Host "`n🔍 TESTANDO API R10 PIAUÍ`n" -ForegroundColor Cyan

# 1. SAÚDE DO SISTEMA
Write-Host "1️⃣ SAÚDE DO SISTEMA" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ /api/health - Status: $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ /api/health - ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. CONTEÚDO PÚBLICO
Write-Host "`n2️⃣ CONTEÚDO PÚBLICO" -ForegroundColor Yellow
$publicEndpoints = @(
    @{url="/api/home"; method="GET"},
    @{url="/api/posts?limit=5"; method="GET"},
    @{url="/api/posts/most-read"; method="GET"},
    @{url="/api/banners?position=top-strip"; method="GET"}
)

foreach ($ep in $publicEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$($ep.url)" -UseBasicParsing -TimeoutSec 10
        Write-Host "   ✅ $($ep.url) - Status: $($r.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($ep.url) - ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. REAÇÕES
Write-Host "`n3️⃣ SISTEMA DE REAÇÕES" -ForegroundColor Yellow
$reactionEndpoints = @(
    "/api/posts/1/reactions",
    "/api/reactions/daily"
)

foreach ($ep in $reactionEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -UseBasicParsing -TimeoutSec 10
        Write-Host "   ✅ $ep - Status: $($r.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $ep - ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. AUTENTICAÇÃO
Write-Host "`n4️⃣ AUTENTICAÇÃO" -ForegroundColor Yellow

# Testar login
try {
    $loginBody = @{
        email = "admin@r10.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $login = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ POST /api/auth/login - Status: $($login.StatusCode)" -ForegroundColor Green
    
    # Extrair token
    $loginData = $login.Content | ConvertFrom-Json
    $token = $loginData.token
    
    if ($token) {
        Write-Host "   ✅ Token recebido: $($token.Substring(0, 20))..." -ForegroundColor Green
        
        # Testar rota autenticada
        try {
            $headers = @{
                "Authorization" = "Bearer $token"
            }
            $me = Invoke-WebRequest -Uri "$base/api/auth/me" -Headers $headers -UseBasicParsing -TimeoutSec 10
            Write-Host "   ✅ GET /api/auth/me - Status: $($me.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ GET /api/auth/me - ERRO: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "   ❌ POST /api/auth/login - ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. ROTAS ADMIN (devem retornar 401 sem token)
Write-Host "`n5️⃣ ROTAS PROTEGIDAS (devem retornar 401)" -ForegroundColor Yellow
$protectedEndpoints = @(
    "/api/users",
    "/api/categories",
    "/api/site/analytics"
)

foreach ($ep in $protectedEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -UseBasicParsing -TimeoutSec 10
        Write-Host "   ⚠️ $ep - Status: $($r.StatusCode) (esperado 401!)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Message -like "*401*") {
            Write-Host "   ✅ $ep - 401 Unauthorized (correto)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $ep - ERRO: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n✅ TESTE COMPLETO FINALIZADO`n" -ForegroundColor Cyan
