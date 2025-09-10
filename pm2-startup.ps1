# Script para iniciar PM2 automaticamente
Set-Location "c:\Users\George Mendes\Desktop\r10final"

# Aguarda um pouco para o sistema carregar
Start-Sleep -Seconds 10

# Inicia o PM2 com os processos salvos
pm2 resurrect

# Aguarda um pouco e verifica se está tudo rodando
Start-Sleep -Seconds 5
pm2 status
