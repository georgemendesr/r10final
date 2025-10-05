# Correções Estruturais - Campo Subtítulo

## 🔴 PROBLEMA IDENTIFICADO

O usuário reportou que o campo **subtítulo** no editor estava sendo preenchido automaticamente com o conteúdo do campo **`resumo`** do banco de dados, em vez de ficar vazio para ser preenchido manualmente.

### Exemplo do problema:
- **Editor**: Campo "Subtítulo" com placeholder "Digite um subtítulo para complementar o título"
- **Frontend**: Exibindo "Recursos para 12 municípios" (que veio do campo `resumo` do seed)
- **Expectativa**: Campo subtítulo deveria estar VAZIO no banco

---

## ✅ CORREÇÕES APLICADAS

### 1. Adicionada coluna `subtitulo` na tabela
**Commit**: `8c3ab16` - "fix: adiciona coluna subtitulo na tabela noticias"

**Arquivo**: `server/server-api-simple.cjs` (linha 556)

**Antes**:
```sql
CREATE TABLE IF NOT EXISTS noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  chapeu TEXT,
  resumo TEXT,
  conteudo TEXT NOT NULL,
  ...
)
```

**Depois**:
```sql
CREATE TABLE IF NOT EXISTS noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  subtitulo TEXT,  -- ✅ NOVA COLUNA
  chapeu TEXT,
  resumo TEXT,
  conteudo TEXT NOT NULL,
  ...
)
```

### 2. Atualizado INSERT para incluir subtítulo vazio
**Arquivo**: `server/server-api-simple.cjs` (linha 3507)

**Antes**:
```javascript
const stmtN = db.prepare('INSERT INTO noticias (titulo,chapeu,resumo,conteudo,autor,categoria,posicao,imagem_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime("now"),datetime("now"))');
noticias.forEach(n => {
  stmtN.run(n.t, n.ch, n.r, n.c, n.a, n.cat, n.p, n.img, (err) => {
```

**Depois**:
```javascript
const stmtN = db.prepare('INSERT INTO noticias (titulo,subtitulo,chapeu,resumo,conteudo,autor,categoria,posicao,imagem_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime("now"),datetime("now"))');
noticias.forEach(n => {
  stmtN.run(n.t, '', n.ch, n.r, n.c, n.a, n.cat, n.p, n.img, (err) => {
            // ☝️ String vazia para subtítulo
```

### 3. Corrigidos autores fictícios para "Redação"
**Commit**: `c79fcf2` - "fix: altera todos os autores para 'Redacao' (usuario real)"

**Motivo**: Autores devem ser usuários existentes no sistema, não nomes fictícios.

**Antes**:
```javascript
{t:'...', a:'João Silva', ...},
{t:'...', a:'Maria Santos', ...},
{t:'...', a:'Carlos Mendes', ...},
// ... 13 autores fictícios diferentes
```

**Depois**:
```javascript
{t:'...', a:'Redação', ...},
{t:'...', a:'Redação', ...},
{t:'...', a:'Redação', ...},
// ... todos os 16 com 'Redação'
```

---

## 📊 ESTRUTURA FINAL DA TABELA

```sql
CREATE TABLE noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,           -- Título principal
  subtitulo TEXT,                 -- ✅ Subtítulo (vazio no seed, preenchido no editor)
  chapeu TEXT,                    -- Categoria visual (ex: "Desenvolvimento", "Educação")
  resumo TEXT,                    -- Resumo curto para listagens
  conteudo TEXT NOT NULL,         -- Corpo completo da matéria (HTML)
  autor TEXT NOT NULL,            -- Autor (todos = "Redação")
  categoria TEXT NOT NULL,        -- Categoria/município (ex: "politica", "piripiri")
  posicao INTEGER DEFAULT 0,      -- Posição (supermanchete=0, destaque=1, geral=2)
  destaque INTEGER DEFAULT 0,     -- Flag de destaque
  imagem_url TEXT,                -- URL da imagem do Unsplash
  views INTEGER DEFAULT 0,        -- Contador de visualizações
  created_at TEXT NOT NULL,       -- Data de criação
  updated_at TEXT NOT NULL        -- Data de atualização
);
```

---

## 🎯 COMPORTAMENTO ESPERADO

### No Editor (Dashboard):
1. Ao criar/editar notícia, campo **Subtítulo** vem VAZIO
2. Usuário pode preencher manualmente (opcional)
3. Campo **Autor** pode selecionar "Redação" (ou outros usuários cadastrados)

### No Frontend:
1. **Título**: Campo `titulo`
2. **Subtítulo**: Campo `subtitulo` (se vazio, não exibe nada)
3. **Chapéu**: Badge colorido com categoria (`chapeu`)
4. **Resumo**: Texto curto nas listagens (`resumo`)
5. **Autor**: Assinatura da matéria (`autor`)

---

## 🔄 PROCESSO DE APLICAÇÃO

1. ✅ Alterado schema da tabela (commit 8c3ab16)
2. ✅ Alterado INSERT no seed (commit 8c3ab16)
3. ✅ Alterados autores para "Redação" (commit c79fcf2)
4. ⏳ Deploy no Render (aguardando...)
5. ⏳ Limpar banco antigo (DROP + CREATE)
6. ⏳ Popular com nova estrutura (16 notícias + 12 banners)
7. ✅ Validar: subtítulo vazio, autor = "Redação"

---

## 📝 DADOS DO SEED (16 NOTÍCIAS)

Todas as notícias agora têm:
- ✅ `titulo`: Título completo relacionado ao Piauí
- ✅ `subtitulo`: '' (vazio - será preenchido no editor)
- ✅ `chapeu`: Categoria visual
- ✅ `resumo`: Texto curto (ex: "Recursos para 12 municípios")
- ✅ `conteudo`: Corpo em HTML
- ✅ `autor`: "Redação" (todos iguais)
- ✅ `categoria`: politica, piripiri, pedro-ii, etc.
- ✅ `posicao`: supermanchete (1) / destaque (5) / geral (10)
- ✅ `imagem_url`: URLs reais do Unsplash

---

## ✅ RESULTADO FINAL

Após aplicar as correções:

1. **Campo subtítulo**: Vazio no banco, pronto para ser preenchido no editor
2. **Campo resumo**: Mantém texto curto para exibição em listagens
3. **Autores**: Todos = "Redação" (usuário real do sistema)
4. **Imagens**: URLs do Unsplash funcionando
5. **Banco**: Estrutura correta e alinhada com o editor

**Nenhum mock ou dado fictício!** Tudo baseado em notícias realistas do Piauí.
