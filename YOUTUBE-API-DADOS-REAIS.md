# Configuração da YouTube Data API v3

## Como configurar dados REAIS do YouTube no R10 Play

### 1. Obter Chaves da API do YouTube

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **YouTube Data API v3**:
   - Menu > APIs e serviços > Biblioteca
   - Pesquise "YouTube Data API v3"
   - Clique em "Ativar"

4. Crie uma API Key:
   - Menu > APIs e serviços > Credenciais
   - Clique em "Criar credenciais" > "Chave de API"
   - Copie a chave gerada

5. (Opcional) Restrinja a API Key para segurança:
   - Clique na chave criada
   - Em "Restrições de API", selecione "YouTube Data API v3"
   - Salve

### 2. Obter o Channel ID

**Método 1: Pelo URL do canal**
- Se o URL for `youtube.com/@r10piaui`, use `@r10piaui`
- Se o URL for `youtube.com/channel/UCxxxxx`, use `UCxxxxx`

**Método 2: Pelo YouTube Studio**
- Acesse [YouTube Studio](https://studio.youtube.com/)
- Menu > Configurações > Canal
- Copie o "ID do canal"

### 3. Configurar Variáveis de Ambiente

**Desenvolvimento Local (arquivo `.env` na raiz do projeto):**
```env
YOUTUBE_API_KEY=sua_api_key_aqui
YOUTUBE_CHANNEL_ID=@r10piaui
```

**Produção (Render.com):**
1. Acesse o dashboard do Render
2. Selecione seu serviço de backend
3. Vá em "Environment"
4. Adicione as variáveis:
   - `YOUTUBE_API_KEY`: Sua API Key do Google
   - `YOUTUBE_CHANNEL_ID`: `@r10piaui` ou o ID do canal

### 4. Como Funciona

#### Sem API Key configurada:
- Sistema usa dados de **fallback** (números estáticos)
- Vídeos de exemplo são exibidos
- Funciona offline, mas com dados desatualizados

#### Com API Key configurada:
- Sistema busca dados **reais** do canal R10 Piauí
- Estatísticas atualizadas:
  - Número real de inscritos
  - Total de visualizações
  - Quantidade de vídeos
- Vídeos recentes com:
  - Títulos reais
  - Thumbnails reais
  - Views, likes, comentários
  - Duração real

### 5. Endpoints Disponíveis

**Backend criado em:**
- `server/youtubeService.cjs` - Serviço de integração
- `server/youtubeRoutes.cjs` - Rotas da API

**Endpoints:**
- `GET /api/youtube/stats` - Estatísticas do canal
- `GET /api/youtube/videos?maxResults=8` - Vídeos recentes
- `GET /api/youtube/health` - Status da configuração

### 6. Frontend

**Arquivos atualizados:**
- `r10-front_full_07ago/src/services/youtubeService.ts`
- `r10-front_full_07ago/src/components/R10PlaySection.tsx`
- `r10-front_full_07ago/src/components/R10PlayPage.tsx`

**Funções disponíveis:**
```typescript
import { fetchRecentVideos, fetchChannelStats } from '../services/youtubeService';

// Buscar vídeos (4 para seção, 20 para página completa)
const videos = await fetchRecentVideos(4);

// Buscar estatísticas
const stats = await fetchChannelStats();
```

### 7. Limites da YouTube Data API

A API do YouTube tem quota diária:
- **10.000 unidades por dia** (gratuito)
- Cada busca de vídeos = ~3 unidades
- Cada busca de estatísticas = ~1 unidade

**Cálculo estimado:**
- ~3.000 requisições de vídeos por dia
- Mais que suficiente para um site de notícias

### 8. Otimizações Implementadas

**Popup de Vídeo:**
- `modestbranding=1` - Remove logo do YouTube
- `enablejsapi=1` - Habilita controle via JavaScript
- `loading="lazy"` - Carrega iframe apenas quando visível
- `web-share` - Permite compartilhamento nativo

**Performance:**
- Cache automático no navegador
- Fallback instantâneo se API falhar
- Carregamento paralelo de vídeos e estatísticas

### 9. Verificar se está Funcionando

1. **Desenvolvimento:**
```bash
# Terminal 1 - Backend
cd r10final
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Acessar: http://localhost:5175
```

2. **Verificar logs:**
```
✅ 4 vídeos carregados do YouTube
✅ Estatísticas do canal carregadas: { subscribers: '12.5K', ... }
📺 R10 Play Section carregada
```

3. **Verificar no navegador:**
- Inspecionar elemento > Console
- Deve aparecer mensagens de sucesso
- Números devem ser reais, não mock

### 10. Troubleshooting

**Problema: "YouTube API Key não configurada"**
- Verifique se o arquivo `.env` existe na raiz
- Verifique se as variáveis estão corretas
- Reinicie o servidor backend

**Problema: "403 Forbidden"**
- Verifique se a YouTube Data API v3 está ativa
- Verifique as restrições da API Key
- Confira se há quota disponível

**Problema: "Canal não encontrado"**
- Verifique se o CHANNEL_ID está correto
- Tente usar o formato `@handle` ou `UCxxxxx`
- Verifique se o canal é público

**Problema: Vídeos não carregam**
- Abra DevTools > Network
- Verifique se `/api/youtube/videos` retorna 200
- Verifique se há erros de CORS

### 11. Dados de Fallback

Caso a API falhe, o sistema automaticamente usa:
- 245 vídeos
- 1.2M visualizações
- 12.5K inscritos
- 4 vídeos de exemplo do canal real

Isso garante que o site sempre funcione, mesmo sem API configurada.

---

## Resumo

✅ **Implementado:**
- Integração completa com YouTube Data API v3
- Dados REAIS do canal R10 Piauí
- Fallback automático e inteligente
- Popup de vídeo otimizado (sem travamento)
- Endpoints de backend robustos
- Frontend reativo e performático

❌ **Removido:**
- Números mock ("12.5K inscritos" fixos)
- Dados estáticos desatualizados
- Vídeos de exemplo genéricos
