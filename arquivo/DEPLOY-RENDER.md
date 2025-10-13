# 🚀 DEPLOY NO RENDER - R10 PIAUÍ ARQUIVO

## 📋 Pré-requisitos

✅ Conta no GitHub  
✅ Conta no Render (https://render.com)  
✅ Banco de dados com URLs do Cloudinary já configuradas  

## 🔧 PASSO 1: Preparar Repositório Git

### 1.1 Inicializar Git (se ainda não inicializou)

```bash
cd "c:\Users\George Mendes\Desktop\r10final\arquivo"
git init
git add .
git commit -m "Initial commit - Arquivo R10 Piauí com 15.927 notícias"
```

### 1.2 Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `r10-arquivo` (ou outro nome)
3. Descrição: "Arquivo histórico R10 Piauí (2014-2025)"
4. **Importante:** Deixe PÚBLICO ou PRIVADO (funciona dos dois jeitos)
5. NÃO adicione README, .gitignore ou license (já existem)
6. Clique em "Create repository"

### 1.3 Conectar e enviar código

```bash
git remote add origin https://github.com/SEU_USUARIO/r10-arquivo.git
git branch -M main
git push -u origin main
```

## 🌐 PASSO 2: Deploy no Render

### 2.1 Criar novo Web Service

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte sua conta GitHub se ainda não conectou
4. Selecione o repositório **r10-arquivo**

### 2.2 Configurações do Deploy

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `r10-arquivo` |
| **Region** | `Oregon (US West)` (mais barato) |
| **Branch** | `main` |
| **Root Directory** | *(deixe vazio)* |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | `Free` |

### 2.3 Variáveis de Ambiente (opcional)

Se quiser, adicione:

```
PORT=5050
NODE_ENV=production
```

*(Mas o Render já configura a PORT automaticamente)*

### 2.4 Criar Web Service

Clique em **"Create Web Service"**

O Render vai:
1. ✅ Clonar seu repositório
2. ✅ Instalar dependências (`npm install`)
3. ✅ Iniciar servidor (`node server.js`)
4. ✅ Gerar URL: `https://r10-arquivo.onrender.com`

## 🔗 PASSO 3: Configurar Rota no Site Principal

Para acessar em **https://r10piaui.onrender.com/arquivo**:

### Opção A: Reverse Proxy (no site principal)

No arquivo `app.js` ou `server.js` do site principal, adicione:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use('/arquivo', createProxyMiddleware({
  target: 'https://r10-arquivo.onrender.com',
  changeOrigin: true,
  pathRewrite: {
    '^/arquivo': '/', // remove /arquivo da URL ao fazer proxy
  },
}));
```

Instale a dependência:
```bash
npm install http-proxy-middleware
```

### Opção B: Redirecionamento Simples

```javascript
app.get('/arquivo*', (req, res) => {
  res.redirect('https://r10-arquivo.onrender.com' + req.path.replace('/arquivo', ''));
});
```

### Opção C: Link Direto (mais simples)

Apenas coloque um link no menu do site principal:

```html
<a href="https://r10-arquivo.onrender.com" target="_blank">Arquivo de Notícias</a>
```

## ⚡ PASSO 4: Testar Deploy

Após o deploy concluir (leva ~3-5 minutos):

1. ✅ Acesse: `https://r10-arquivo.onrender.com`
2. ✅ Verifique se as imagens carregam do Cloudinary
3. ✅ Teste a busca
4. ✅ Abra algumas notícias

## 🔄 Atualizações Futuras

Para atualizar o site no Render:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Render vai fazer deploy automático! 🎉

## ⚠️ IMPORTANTE

### Plano Free do Render:
- ✅ 750 horas/mês grátis
- ⚠️ **Inatividade:** Após 15 minutos sem acessos, o serviço "dorme"
- 🐌 **Primeiro acesso:** Demora ~30 segundos para "acordar"
- 💡 **Solução:** Use um serviço como UptimeRobot para fazer ping a cada 10 minutos

### UptimeRobot (para manter site acordado):
1. Acesse: https://uptimerobot.com
2. Crie conta grátis
3. Adicione monitor HTTP(S)
4. URL: `https://r10-arquivo.onrender.com`
5. Intervalo: 5 minutos

## 📊 Checklist Final

- [ ] Repositório criado no GitHub
- [ ] Código enviado com `git push`
- [ ] Web Service criado no Render
- [ ] Deploy concluído com sucesso
- [ ] Site acessível e funcional
- [ ] Imagens carregando do Cloudinary
- [ ] (Opcional) Configurado proxy no site principal
- [ ] (Opcional) Configurado UptimeRobot

## 🆘 Problemas Comuns

### "Application failed to start"
- Verifique se `package.json` tem o script correto
- Confirme que `node server.js` funciona localmente

### "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para testar

### Imagens não carregam
- Confirme que o banco tem URLs do Cloudinary
- Execute: `node config/check-cloudinary.js`

### Site muito lento no primeiro acesso
- Normal no plano Free do Render
- Configure UptimeRobot para resolver

## 🎯 Resultado Esperado

✅ Site rodando em: `https://r10-arquivo.onrender.com`  
✅ 15.927 notícias acessíveis  
✅ Imagens carregando do Cloudinary  
✅ Busca funcionando  
✅ Totalmente responsivo  

---

**Pronto para fazer o deploy? Siga os passos acima! 🚀**
