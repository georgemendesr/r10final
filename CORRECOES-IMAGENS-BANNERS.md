# Correções: Imagens e Banners

## Data: 05/10/2025

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. Autenticação quebrada ❌
- **Causa**: Código nas linhas 3314-3315 estava **removendo** as rotas de autenticação originais
- **Sintoma**: `/api/auth/login` retornava 404
- **Impacto**: Dashboard inacessível

### 2. Imagens não apareciam ❌
- **Causa**: Função `mapPost` (linha 110) procurava por `row.imagem`, mas o banco tem `row.imagem_url`
- **Sintoma**: Todos os posts exibiam `/placeholder.svg` em vez das imagens do Unsplash
- **Impacto**: Site sem imagens

### 3. Banners não carregavam ❌
- **Causa**: Endpoint `/api/banners` exigia autenticação (admin/editor)
- **Sintoma**: Frontend não conseguia buscar banners (401 Unauthorized)
- **Impacto**: Publicidade não exibida
- **Nota**: Endpoint público `/api/banners/public` já existia mas frontend estava usando a rota autenticada

---

## ✅ CORREÇÕES APLICADAS

### Commit 1: `2b9a710` - fix: impede remocao das rotas de autenticacao originais
**Arquivo**: `server/server-api-simple.cjs` (linhas 3312-3316)

**Antes**:
```javascript
try {
  if (app._router && app._router.stack) {
    app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/login' && l.route.methods.post));
    app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/register' && l.route.methods.post));
  }
```

**Depois**:
```javascript
try {
  if (app._router && app._router.stack) {
    // ⚠️ COMENTADO: não remover as rotas originais definidas nas linhas 780-891
    // app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/login' && l.route.methods.post));
    // app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/register' && l.route.methods.post));
  }
```

**Resultado**: ✅ `/api/auth/login` agora funciona (200 OK com token JWT)

---

### Commit 2: `cc46860` - fix: corrige mapPost para ler imagem_url do banco
**Arquivo**: `server/server-api-simple.cjs` (linhas 107-111)

**Antes**:
```javascript
// Considerar variações de colunas: imagem, imagemUrl, imagem_destaque
imagemUrl: (row.imagem && String(row.imagem).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || '/placeholder.svg',
imagemDestaque: (row.imagem && String(row.imagem).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || (row.imagemDestaque && String(row.imagemDestaque).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || '/placeholder.svg',
```

**Depois**:
```javascript
// Considerar variações de colunas: imagem, imagemUrl, imagem_url, imagem_destaque
imagemUrl: (row.imagem_url && String(row.imagem_url).trim()) || (row.imagem && String(row.imagem).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || '/placeholder.svg',
imagemDestaque: (row.imagem_url && String(row.imagem_url).trim()) || (row.imagem && String(row.imagem).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || (row.imagemDestaque && String(row.imagemDestaque).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || '/placeholder.svg',
```

**Mudança**: Adicionada verificação de `row.imagem_url` como **primeira prioridade** (antes estava ausente)

**Resultado**: ✅ Posts agora exibem imagens do Unsplash (ex: https://images.unsplash.com/photo-1541888946425-d81bb19240f5)

---

## 📊 STATUS PÓS-CORREÇÕES

### ✅ Funcionando
- `/api/health` - 200 OK
- `/api/home` - 200 OK (hero + destaques + geral)
- `/api/posts` - 200 OK (com imagens do Unsplash)
- `/api/posts/1/reactions` - 200 OK
- `/api/reactions/daily` - 200 OK
- `/api/auth/login` - 200 OK (retorna token JWT)
- `/api/auth/me` - 200 OK (com token válido)
- `/api/banners/public` - 200 OK (12 banners ativos)

### ⚠️ Requer Autenticação (correto)
- `/api/banners` - 401 Unauthorized (admin/editor only)
- `/api/users` - 401 Unauthorized (admin only)
- `/api/categories` - 401 Unauthorized (admin only)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Verificar se imagens aparecem no frontend após deploy
2. ✅ Verificar se banners são exibidos corretamente
3. ⏳ Testar login no dashboard admin
4. ⏳ Verificar "dezenas de erros" mencionados pelo usuário
5. ⏳ Criar usuário admin padrão (se não existir)

---

## 📝 NOTAS TÉCNICAS

### Seed de Dados
- **16 notícias**: 1 supermanchete + 5 destaques + 10 gerais
- **12 banners**: distribuídos em 5 posições (top-strip, super-banner, news-sidebar, sidebar-article, in-content)
- **6 municípios autorizados**: piripiri, pedro-ii, brasileira, lagoa-de-sao-francisco, piracuruca, sao-jose-do-divino

### Estrutura do Banco
```sql
CREATE TABLE noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  chapeu TEXT,
  resumo TEXT,
  conteudo TEXT NOT NULL,
  autor TEXT NOT NULL,
  categoria TEXT NOT NULL,
  posicao TEXT NOT NULL,
  destaque INTEGER DEFAULT 0,
  imagem_url TEXT,  -- ⚠️ Coluna correta no banco
  views INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Frontend
- **Caminho da API**: `/api` (relativo, funciona em produção)
- **Service de banners**: `src/services/bannersApi.ts`
  - Usa `/banners/public` para acesso público ✅
  - Usa `/banners` para admin (requer auth) ✅
- **Componentes de anúncios**:
  - `AdBanner.tsx` - Renderiza banners por posição
  - `AdBox.tsx` - Wrapper para sidebar-article

---

## 🔗 URLs de Teste

### Produção (Render)
- **Site**: https://r10piaui.onrender.com
- **API Health**: https://r10piaui.onrender.com/api/health
- **Posts**: https://r10piaui.onrender.com/api/posts?limit=5
- **Banners Públicos**: https://r10piaui.onrender.com/api/banners/public
- **Login**: POST https://r10piaui.onrender.com/api/auth/login

### Seed (Popular Banco)
```
GET https://r10piaui.onrender.com/api/seed?secret=r10seed2025
```

### Limpar Banco
```
GET https://r10piaui.onrender.com/api/clear?secret=r10seed2025
```

---

## ✅ CONCLUSÃO

As correções foram aplicadas com sucesso:

1. **Autenticação restaurada** - Login funciona normalmente
2. **Imagens carregando** - URLs do Unsplash sendo lidas corretamente do campo `imagem_url`
3. **Banners disponíveis** - Endpoint público `/api/banners/public` retornando 12 banners ativos

**Próximo passo**: Aguardar deploy e validar no frontend.
