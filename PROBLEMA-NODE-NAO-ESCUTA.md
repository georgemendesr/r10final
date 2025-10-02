# 🚨 PROBLEMA CRÍTICO: Node.js não consegue aceitar conexões

**Data**: 2 de outubro de 2025  
**Sintoma**: Servidores Express dizem que estão rodando, mas `curl` não consegue conectar  
**Gravidade**: ⚠️ **CRÍTICO** - Nenhum servidor Node.js funciona

---

## 🔍 **DIAGNÓSTICO**

### **Testes Realizados**:

1. ✅ Servidor Express com porta **8080** + `0.0.0.0`: **FALHOU**
2. ✅ Servidor Express com porta **8080** + `127.0.0.1`: **FALHOU**
3. ✅ Servidor Express com porta **9999** + `localhost`: **FALHOU**

**Conclusão**: Problema **NÃO é específico da porta 8080**! É um problema sistêmico do Node.js/Windows.

---

### **Evidências**:

```powershell
# Servidor diz que está rodando:
✅ Servidor rodando em:
   - Local: http://localhost:8080
   - Address object: { address: '0.0.0.0', family: 'IPv4', port: 8080 }

# Mas curl não consegue conectar:
PS> curl.exe http://localhost:8080/health
curl: (7) Failed to connect to localhost port 8080 after 2232 ms: Could not connect to server

# netstat não mostra porta escutando:
PS> netstat -ano | findstr :8080 | findstr LISTENING
(vazio)
```

---

## 🎯 **CAUSAS POSSÍVEIS**

### 1️⃣ **Firewall/Antivírus bloqueando Node.js**

**Windows Defender** ou **antivírus de terceiros** pode estar bloqueando conexões locais do `node.exe`.

**Como verificar**:
- Firewall do Windows → Aplicativos permitidos → Procurar `node.exe`
- Antivírus → Exceções → Verificar se `node.exe` está bloqueado

---

### 2️⃣ **Processo fantasma PID 9268 corrompido**

```powershell
PS> taskkill /F /PID 9268
ERRO: o processo "node.exe" com PID 9268 não pôde ser finalizado.
Razão: Acesso negado.
```

Esse processo **não pode ser morto** e pode estar interferindo com a pilha de rede do Windows.

**Solução**: Reiniciar o Windows (FORÇADO com esse PID travado).

---

### 3️⃣ **Loopback adapter desabilitado/corrompido**

O adaptador de rede loopback (`127.0.0.1`, `localhost`) pode estar com problema.

**Como verificar**:
```powershell
Test-NetConnection -ComputerName localhost -Port 3002
Test-NetConnection -ComputerName 127.0.0.1 -Port 3002
```

Se ambos falharem, o loopback está com problema.

---

### 4️⃣ **Política de segurança do Windows bloqueando bind**

Windows 10/11 pode ter políticas de segurança que impedem aplicações de fazer `bind()` em portas.

---

### 5️⃣ **IPv6 vs IPv4 mismatch**

Node.js pode estar tentando escutar em IPv6 (`::1`) enquanto curl está tentando IPv4 (`127.0.0.1`).

**Evidência**:
```javascript
Address object: { address: '::1', family: 'IPv6', port: 9999 }
```

Mas especificamos `'localhost'` que deveria resolver para IPv4 primeiro.

---

## ✅ **SOLUÇÕES (EM ORDEM DE PRIORIDADE)**

### **SOLUÇÃO 1: Liberar Node.js no Firewall do Windows**

1. **Abra o Firewall do Windows**:
   ```
   Windows + R → firewall.cpl → Enter
   ```

2. **Clique em "Permitir um aplicativo ou recurso através do Firewall do Windows"**

3. **Clique em "Alterar configurações"** (canto superior direito)

4. **Clique em "Permitir outro aplicativo..."**

5. **Procurar**: `C:\Program Files\nodejs\node.exe`

6. **Marque as caixas**:
   - ✅ Privada
   - ✅ Pública

7. **Clique em "Adicionar"**

8. **Reinicie o terminal** e teste novamente

---

### **SOLUÇÃO 2: Matar processo fantasma (PID 9268)**

#### Opção A: Forçar com privilégios de administrador

```powershell
# Abrir PowerShell como Administrador
# Executar:
taskkill /F /PID 9268
```

#### Opção B: Usar Process Explorer (Sysinternals)

1. Baixe: https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer
2. Execute como Administrador
3. Encontre PID 9268
4. Right-click → Kill Process Tree

#### Opção C: Reiniciar Windows

Se nada funcionar, o processo travado está interferindo com a pilha TCP/IP.

```powershell
Restart-Computer -Force
```

---

### **SOLUÇÃO 3: Resetar pilha TCP/IP do Windows**

Execute como **Administrador**:

```powershell
# Resetar Winsock
netsh winsock reset

# Resetar TCP/IP
netsh int ip reset

# Resetar Firewall
netsh advfirewall reset

# Limpar cache DNS
ipconfig /flushdns

# Renovar IP
ipconfig /release
ipconfig /renew

# REINICIAR WINDOWS (OBRIGATÓRIO)
Restart-Computer -Force
```

---

### **SOLUÇÃO 4: Desabilitar IPv6 temporariamente**

Se o problema for mismatch IPv6/IPv4:

```powershell
# Desabilitar IPv6
Disable-NetAdapterBinding -Name "*" -ComponentID ms_tcpip6

# Testar servidores novamente

# Reabilitar IPv6 (se não resolver)
Enable-NetAdapterBinding -Name "*" -ComponentID ms_tcpip6
```

---

### **SOLUÇÃO 5: Forçar Node.js a usar apenas IPv4**

No seu `server.js`, substitua:

```javascript
// ANTES:
app.listen(PORT, '0.0.0.0', () => { ... });

// DEPOIS (FORÇAR IPv4):
const server = app.listen(PORT, '0.0.0.0', () => { ... });
server.on('listening', () => {
  const addr = server.address();
  console.log(`Listening on ${addr.address}:${addr.port} (${addr.family})`);
});
```

Ou use `127.0.0.1` explicitamente:

```javascript
app.listen(PORT, '127.0.0.1', () => { ... });
```

---

### **SOLUÇÃO 6: Verificar antivírus de terceiros**

Se você tem **Avast**, **AVG**, **Norton**, **Kaspersky**, etc:

1. Abra o painel do antivírus
2. Procure por **"Exceções"** ou **"Aplicações confiáveis"**
3. Adicione: `C:\Program Files\nodejs\node.exe`
4. Reinicie o terminal

---

### **SOLUÇÃO 7: Criar regra específica no Firewall**

Execute como **Administrador**:

```powershell
# Permitir Node.js entrada
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Protocol TCP

# Permitir Node.js saída
New-NetFirewallRule -DisplayName "Node.js Server Out" -Direction Outbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Protocol TCP
```

---

## 🧪 **TESTE DEFINITIVO**

Após aplicar as soluções, teste com este script:

```javascript
// test-definitivo.js
const http = require('http');
const PORT = 8765; // Porta aleatória

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('FUNCIONOU!\n');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Servidor rodando em http://127.0.0.1:${PORT}`);
  console.log(`⏳ Testando em 2 segundos...`);
  
  setTimeout(() => {
    const http2 = require('http');
    http2.get(`http://127.0.0.1:${PORT}/`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ✅ ✅ SUCESSO! Resposta: ${data.trim()}`);
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error(`❌ FALHOU:`, err.message);
      process.exit(1);
    });
  }, 2000);
});

server.on('error', (err) => {
  console.error(`❌ ERRO AO INICIAR:`, err);
  process.exit(1);
});
```

**Teste**:
```powershell
node test-definitivo.js
```

**Se funcionar**:
```
✅ Servidor rodando em http://127.0.0.1:8765
⏳ Testando em 2 segundos...
✅ ✅ ✅ SUCESSO! Resposta: FUNCIONOU!
```

**Se falhar**:
```
❌ FALHOU: connect ECONNREFUSED 127.0.0.1:8765
```

---

## 📋 **CHECKLIST DE DIAGNÓSTICO**

Execute estas verificações em ordem:

```powershell
# 1. Verificar se há processos Node.js travados
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, StartTime, CPU

# 2. Verificar regras de firewall para Node.js
Get-NetFirewallApplicationFilter -Program "*node.exe*" | Get-NetFirewallRule

# 3. Verificar se loopback está funcionando
Test-NetConnection -ComputerName localhost -Port 80 -InformationLevel Detailed

# 4. Verificar interfaces de rede
Get-NetAdapter | Where-Object {$_.Status -eq "Up"}

# 5. Verificar rotas
Get-NetRoute -DestinationPrefix "127.0.0.0/8"

# 6. Verificar TCP/IP está OK
netsh interface ipv4 show interfaces
```

---

## 🎯 **RECOMENDAÇÃO FINAL**

Com base nos testes:

1. ⚠️ **REINICIAR O WINDOWS** (para matar PID 9268)
2. ⚠️ **Liberar Node.js no Firewall**
3. ⚠️ **Resetar pilha TCP/IP se necessário**
4. ✅ **Testar com `test-definitivo.js`**

Se **NADA** funcionar:
- Pode ser bug do Node.js na sua versão
- Considere reinstalar Node.js
- Ou use Docker para isolar o ambiente

---

## 📞 **SUPORTE**

Se após todas as tentativas o problema persistir, isso indica:
- **Corrupção do Windows**
- **Malware/rootkit**
- **Bug do Node.js (versão específica)**

Próximos passos:
1. Verificar integridade do Windows: `sfc /scannow`
2. Reinstalar Node.js
3. Testar em outro usuário do Windows
4. Usar WSL2 (Windows Subsystem for Linux) como workaround
