# 🚀 UPLOAD DE IMAGENS PARA CLOUDINARY

## 📋 Pré-requisitos
✅ Conta Cloudinary (já criada)
✅ Pastas criadas no Cloudinary:
   - `arquivo/uploads/imagens/`
   - `arquivo/uploads/editor/`

## 🔧 Configuração

### 1. Edite o arquivo `config/upload-cloudinary.js`

Abra o arquivo e substitua as credenciais nas linhas 8-12:

```javascript
cloudinary.config({
  cloud_name: 'SEU_CLOUD_NAME',        // ← Cole aqui
  api_key: 'SUA_API_KEY',              // ← Cole aqui
  api_secret: 'SEU_API_SECRET'         // ← Cole aqui
});
```

### 2. Execute o script

```bash
cd "c:\Users\George Mendes\Desktop\r10final\arquivo"
node config/upload-cloudinary.js
```

## 📊 O que o script faz?

1. **Escaneia as pastas locais**
   - `/uploads/imagens/` (13,786 arquivos)
   - `/uploads/editor/` (28,241 arquivos)

2. **Upload em lotes de 10 imagens**
   - Evita travar ou timeout
   - Mostra progresso em tempo real
   - Salva checkpoint a cada lote

3. **Salva progresso em `upload-progress.json`**
   - Se o processo parar, pode retomar de onde parou
   - Não faz upload duplicado

4. **Atualiza o banco de dados automaticamente**
   - Substitui URLs locais pelas URLs do Cloudinary
   - Ex: `/uploads/imagens/foto.jpg` → `https://res.cloudinary.com/.../foto.jpg`

## ⏱️ Tempo estimado

- **13.786 imagens** em lotes de 10 = ~1.379 lotes
- Com 1 segundo de pausa entre lotes = ~23 minutos por pasta
- **TOTAL: ~1-2 horas** (dependendo da internet)

## 🔄 Retomar upload interrompido

Se o processo parar (internet cair, erro, etc):

```bash
# Apenas execute novamente - ele continua de onde parou!
node config/upload-cloudinary.js
```

## 🆕 Recomeçar do zero

Se quiser ignorar o progresso e recomeçar:

```bash
# Delete o arquivo de progresso
del upload-progress.json

# Execute novamente
node config/upload-cloudinary.js
```

## 📝 Logs

O script mostra em tempo real:
- ✅ Cada arquivo enviado com sucesso
- ❌ Cada arquivo com erro
- 📊 Progresso (X de Y arquivos)
- 🎉 Relatório final com estatísticas

## ⚠️ Observações Importantes

1. **Não feche o terminal durante o upload**
   - O processo pode demorar 1-2 horas
   - Se fechar, pode retomar depois

2. **Verifique sua internet**
   - Upload de ~2.68GB de imagens
   - Recomendado: conexão estável

3. **Limite do Cloudinary**
   - Plano gratuito: 25GB storage + 25GB bandwidth/mês
   - Suas imagens: ~2.68GB (bem dentro do limite)

4. **Backup**
   - O script NÃO deleta as imagens locais
   - Mantenha o backup local até confirmar que tudo funcionou

## 🔍 Verificar resultados

Após o upload, acesse o Cloudinary:
- https://console.cloudinary.com/
- Vá em "Media Library"
- Verifique as pastas `arquivo/uploads/imagens/` e `arquivo/uploads/editor/`

## 🐛 Solução de problemas

### Erro: "Invalid credentials"
- Verifique se copiou corretamente cloud_name, api_key, api_secret
- Certifique-se de não ter espaços extras

### Erro: "Timeout"
- Internet lenta ou instável
- O script vai marcar como falha e continuar
- Pode tentar novamente depois

### Erro: "Quota exceeded"
- Você atingiu o limite do plano gratuito
- Verifique seu uso no dashboard do Cloudinary

## ✅ Após concluir

1. **Teste o site**
   ```bash
   node server.js
   ```
   - Abra http://localhost:5050
   - Verifique se as imagens carregam do Cloudinary

2. **Se tudo estiver OK**
   - Pode deletar a pasta `/uploads` local (faça backup antes!)
   - Economiza espaço no servidor

3. **Importante**
   - O servidor não precisa mais servir arquivos estáticos do `/uploads`
   - Pode remover essa linha do `server.js`:
   ```javascript
   app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
   ```

---

**💡 Dica:** Execute primeiro em uma pasta pequena para testar (comente a pasta editor no array FOLDERS)
