# 🎥 Guia Completo: Configurar API do YouTube para R10 Play

## 📋 O que você precisa

1. **Conta Google** (a mesma do seu canal R10 Piauí)
2. **10 minutos** do seu tempo
3. **Chave da API** (vamos criar agora!)

---

## 🚀 Passo a Passo COMPLETO

### **PASSO 1: Criar Projeto no Google Cloud**

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. No topo da página, clique em **"Selecionar projeto"**
4. Clique em **"NOVO PROJETO"**
5. Preencha:
   - **Nome do projeto**: `R10 Play API`
   - **Local**: Deixe como está
6. Clique em **"CRIAR"**
7. Aguarde alguns segundos até o projeto ser criado

---

### **PASSO 2: Ativar a API do YouTube**

1. Com o projeto criado, no menu lateral esquerdo, clique em **"APIs e serviços"** → **"Biblioteca"**
2. Na barra de busca, digite: `YouTube Data API v3`
3. Clique no resultado **"YouTube Data API v3"**
4. Clique no botão azul **"ATIVAR"**
5. Aguarde a ativação (10-20 segundos)

---

### **PASSO 3: Criar Credenciais (Chave da API)**

1. Após ativar, você será redirecionado automaticamente
2. Se não for redirecionado, vá em **"APIs e serviços"** → **"Credenciais"**
3. Clique no botão **"+ CRIAR CREDENCIAIS"** (no topo)
4. Selecione **"Chave de API"**
5. Uma janela popup aparecerá com sua chave! **NÃO FECHE AINDA!**
6. **COPIE A CHAVE** (ela parece com isso: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
7. Clique em **"RESTRINGIR CHAVE"** (por segurança)

---

### **PASSO 4: Restringir a Chave (Segurança)**

1. Na página de edição da chave:
   - **Nome da chave**: `R10 Play - YouTube API Key`
   
2. Em **"Restrições de aplicativo"**, selecione:
   - **Referenciadores HTTP (sites)**
   
3. Clique em **"ADICIONAR UM ITEM"** e adicione seus domínios:
   ```
   https://r10piaui.onrender.com/*
   http://localhost:5175/*
   http://localhost:3002/*
   ```

4. Em **"Restrições de API"**, selecione:
   - **Restringir chave**
   - Marque apenas: ✅ **YouTube Data API v3**

5. Clique em **"SALVAR"**

---

### **PASSO 5: Pegar o ID do seu Canal**

#### **Opção 1 - Pelo Studio (Mais Fácil):**
1. Acesse: https://studio.youtube.com/
2. No menu lateral, clique em **"Configurações"**
3. Vá na aba **"Canal"**
4. Copie o **"ID do canal"** (começa com `UC...`)

#### **Opção 2 - Pela URL do Canal:**
1. Acesse seu canal no YouTube
2. A URL será algo como: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxx`
3. Copie a parte `UCxxxxxxxxxxxxxxxxxxx`

---

### **PASSO 6: Configurar no Render.com**

1. Acesse: https://dashboard.render.com/
2. Clique no seu serviço **r10piaui**
3. Vá em **"Environment"** (menu lateral esquerdo)
4. Clique em **"Add Environment Variable"**

Adicione **DUAS** variáveis:

#### **Variável 1:**
- **Key**: `VITE_YOUTUBE_API_KEY`
- **Value**: Cole a chave que você copiou (ex: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### **Variável 2:**
- **Key**: `VITE_YOUTUBE_CHANNEL_ID`
- **Value**: Cole o ID do canal (ex: `UCxxxxxxxxxxxxxxxxxxx`)

5. Clique em **"Save Changes"**
6. O Render vai fazer **redeploy automático** (~2 minutos)

---

## ✅ Testar se Funcionou

Após o deploy:

1. Acesse: https://r10piaui.onrender.com/
2. Role até a seção **R10 Play**
3. Você deve ver seus vídeos REAIS do YouTube!

### **Se não aparecer:**

Abra o console do navegador (F12 → Console) e veja se há erros.

---

## 🔐 Limites da API (Gratuito)

- **10.000 unidades/dia** (quota gratuita)
- Buscar vídeos = 100 unidades
- Buscar estatísticas = 1 unidade
- **Você tem mais de 100 buscas por dia de folga!**

### **Monitorar Uso:**

1. Acesse: https://console.cloud.google.com/apis/dashboard
2. Selecione projeto **"R10 Play API"**
3. Veja o gráfico de uso em tempo real

---

## 🚨 Problemas Comuns

### **❌ Erro: "API key not valid"**
**Solução:** 
- Verifique se copiou a chave corretamente (sem espaços)
- Aguarde 5 minutos após criar (demora propagar)

### **❌ Erro: "The request cannot be completed"**
**Solução:**
- Certifique-se que ativou a **YouTube Data API v3**
- Vá em "APIs e Serviços" → "Biblioteca" e ative

### **❌ Erro: "Access Not Configured"**
**Solução:**
- A API não está ativada no projeto
- Vá no PASSO 2 novamente

### **❌ Vídeos não aparecem**
**Solução:**
- Verifique o ID do canal (tem que começar com `UC`)
- Certifique-se que o canal tem vídeos públicos
- Aguarde 2 minutos após salvar no Render

---

## 📊 Como Funciona Agora

### **ANTES (Fallback):**
```
❌ Vídeos estáticos de teste
❌ Dados fixos no código
❌ Sem atualização automática
```

### **DEPOIS (Com API):**
```
✅ Vídeos REAIS do seu canal
✅ Atualização automática a cada carregamento
✅ Thumbnail, título, views, duração reais
✅ Stats do canal (inscritos, visualizações, total de vídeos)
```

---

## 🎨 Melhorias Implementadas na Seção

1. **Design Moderno:**
   - Gradiente vermelho/preto elegante
   - Efeitos de hover suaves
   - Cards com sombra e animação
   - Badge "NOVO" no vídeo mais recente

2. **Responsivo:**
   - Mobile: 1 vídeo por linha
   - Tablet: 2 vídeos por linha
   - Desktop: 4 vídeos por linha

3. **Informações Ricas:**
   - Thumbnail em HD
   - Duração do vídeo
   - Visualizações
   - Tempo relativo ("há 2 dias")
   - Botão play com animação

4. **Stats do Canal:**
   - Total de inscritos
   - Total de visualizações
   - Total de vídeos

---

## 🔧 Configuração Avançada (Opcional)

### **Alterar quantidade de vídeos exibidos:**

Edite `R10PlaySection.tsx` linha 74:
```typescript
{videos.slice(0, 4).map((video, index) => (
//              ↑ Mude este número (máximo 8)
```

### **Alterar frequência de atualização:**

Os vídeos são buscados **sempre que a página carrega**.

Para adicionar cache, edite `youtubeService.ts`:
```typescript
// Adicione antes do fetchRecentVideos:
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let cachedVideos: YouTubeVideo[] | null = null;
let cacheTime: number = 0;

// No início da função:
if (cachedVideos && Date.now() - cacheTime < CACHE_DURATION) {
  return cachedVideos;
}
```

---

## 📞 Suporte

Se tiver dúvidas, verifique:

1. **Console do Google Cloud:** https://console.cloud.google.com/
2. **Status da API:** https://status.cloud.google.com/
3. **Documentação oficial:** https://developers.google.com/youtube/v3

---

## ✨ Resultado Final

Sua seção R10 Play agora:
- ✅ Puxa vídeos REAIS do YouTube
- ✅ Atualiza automaticamente
- ✅ Mostra estatísticas do canal
- ✅ Design profissional e moderno
- ✅ Totalmente responsivo
- ✅ GRÁTIS (dentro do limite de 10k/dia)

**Aproveite! 🎉**
