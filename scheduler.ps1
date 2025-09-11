# Script PowerShell para executar R10 completamente oculto
param([switch]$Install, [switch]$Uninstall)

$TaskName = "R10PiauiAutoStart"
$ScriptPath = "C:\Users\George Mendes\Desktop\r10final\start-background.js"

if ($Install) {
    # Criar tarefa agendada para execução oculta
    $Action = New-ScheduledTaskAction -Execute "node" -Argument "$ScriptPath" -WorkingDirectory "C:\Users\George Mendes\Desktop\r10final"
    $Trigger = New-ScheduledTaskTrigger -AtLogOn
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
    
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force
    Write-Host "✅ Tarefa agendada criada! R10 iniciará automaticamente no login."
    
    # Executar agora
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "🚀 R10 iniciado em background!"
}
elseif ($Uninstall) {
    # Remover tarefa agendada
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "❌ Auto-inicialização removida."
}
else {
    Write-Host "Uso:"
    Write-Host "  .\scheduler.ps1 -Install    # Instalar auto-inicialização"
    Write-Host "  .\scheduler.ps1 -Uninstall  # Remover auto-inicialização"
}
