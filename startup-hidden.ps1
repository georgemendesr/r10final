Add-Type -TypeDefinition @"
    using System;
    using System.Diagnostics;
    using System.Runtime.InteropServices;
    public static class User32 {
        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        public const int SW_HIDE = 0;
    }
"@

# Ocultar console
$consoleWindow = (Get-Process -Id $PID).MainWindowHandle
[User32]::ShowWindow($consoleWindow, [User32]::SW_HIDE)

# Ir para diretório do projeto
Set-Location "C:\Users\George Mendes\Desktop\r10final"

# Parar processos existentes
& forever stopall 2>$null
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Iniciar em background
Start-Process -WindowStyle Hidden -FilePath "forever" -ArgumentList "start", "start-all.js", "--silent"
