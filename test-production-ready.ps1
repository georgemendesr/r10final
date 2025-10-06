# Script para testar se o sistema está pronto em produção
# Verifica saúde do sistema e tenta criar um post de teste

$baseUrl = "https://r10piaui.onrender.com"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTk3NjI5MjYsImV4cCI6MTc1OTc2MzgyNiwic3ViIjoxLCJlbWFpbCI6ImpvYW9AcjEwcGlhdWkuY29tIiwicm9sZSI6ImFkbWluIiwibmFtZSI6Ikpvw6NvIFNpbHZhIn0.dgZBv7L8rRs-F7mMlOnWTb1eg9K4lmrcGZONWb8VFMw"

Write-Host "`n🔍 VERIFICANDO SISTEMA EM PRODUÇÃO" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Health Check
Write-Host "`n1️⃣ Verificando saúde do sistema..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ Sistema online!" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor Gray
    Write-Host "   Path: $($health.path)" -ForegroundColor Gray
    Write-Host "   Persistent: $($health.persistent)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Sistema offline ou com problemas" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Listar posts
Write-Host "`n2️⃣ Verificando posts existentes..." -ForegroundColor Yellow
try {
    $posts = Invoke-RestMethod -Uri "$baseUrl/api/posts" -Method GET
    $count = if ($posts -is [array]) { $posts.Count } else { 1 }
    Write-Host "✅ Total de posts: $count" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao listar posts: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3. Verificar autenticação
Write-Host "`n3️⃣ Verificando autenticação..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $me = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $headers
    Write-Host "✅ Autenticado como: $($me.name)" -ForegroundColor Green
    Write-Host "   Email: $($me.email)" -ForegroundColor Gray
    Write-Host "   Role: $($me.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro na autenticação" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n⚠️ ATENÇÃO: Token pode estar expirado!" -ForegroundColor Yellow
    Write-Host "   Faça login novamente no sistema para obter um novo token" -ForegroundColor Yellow
    exit 1
}

# 4. Tentar criar post de teste
Write-Host "`n4️⃣ Tentando criar post de teste..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        titulo = "🧪 Teste de Persistência - $(Get-Date -Format 'HH:mm:ss')"
        subtitulo = "Testando banco SQLite persistente no Render"
        conteudo = "<p>Este é um post de teste para verificar se o banco de dados está funcionando corretamente com o disco persistente do Render.</p><p>Se você conseguir ver este post, significa que:</p><ul><li>✅ O banco de dados está no caminho correto</li><li>✅ Os dados estão sendo salvos</li><li>✅ A persistência está funcionando</li></ul>"
        autor = "Sistema de Testes"
        categoria = "geral"
        posicao = "geral"
        chapeu = "TESTE"
        dataPublicacao = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        imagemUrl = $null
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/posts" -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ Post criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($response.id)" -ForegroundColor Gray
    Write-Host "   Título: $($response.titulo)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERRO ao criar post" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    # Tentar ler o corpo da resposta de erro
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "`n📋 Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    } catch {}
    
    exit 1
}

Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
Write-Host "`nAcesse: $baseUrl/admin para ver o post de teste" -ForegroundColor Cyan
Write-Host ""
