# Script para organizar arquivos de debug
# Move arquivos de teste/debug da raiz para scripts/debug

$patterns = @(
    "check-*.js",
    "check-*.mjs",
    "test-*.js",
    "test-*.cjs",
    "debug-*.js",
    "debug-*.mjs",
    "debug-*.cjs",
    "verificar-*.js",
    "verificar-*.cjs",
    "corrigir-*.js",
    "diagnostico-*.js",
    "fix-*.js",
    "fix-*.cjs",
    "fixar-*.cjs",
    "garantir-*.js",
    "inserir-*.js",
    "inserir-*.cjs",
    "investigar-*.js",
    "investigacao-*.js",
    "monitor-*.js",
    "monitor-*.cjs",
    "promover-*.js",
    "proteger-*.js",
    "reorganize-*.js",
    "resetar-*.cjs",
    "restaurar-*.js",
    "testar-*.js",
    "testar-*.cjs",
    "teste-*.js",
    "add-*.js",
    "clean-*.js"
)

$destination = ".\scripts\debug"
$moved = 0
$errors = 0

Write-Host "🔄 Organizando arquivos de debug..." -ForegroundColor Cyan

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Move-Item -Path $file.FullName -Destination $destination -Force
            Write-Host "  ✅ Movido: $($file.Name)" -ForegroundColor Green
            $moved++
        } catch {
            Write-Host "  ❌ Erro ao mover $($file.Name): $_" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""
Write-Host "📊 Resumo:" -ForegroundColor Yellow
Write-Host "  - Arquivos movidos: $moved" -ForegroundColor Green
Write-Host "  - Erros: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "✨ Organização concluída!" -ForegroundColor Cyan
