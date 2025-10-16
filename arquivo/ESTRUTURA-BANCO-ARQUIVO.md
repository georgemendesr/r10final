# 📊 RELATÓRIO COMPLETO: Estrutura do Banco `/arquivo`

**Data da Análise:** 15 de outubro de 2025  
**Banco:** `arquivo/arquivo.db`  
**Total de Registros:** 15.927 notícias

---

## 🗄️ ESTRUTURA DA TABELA `noticias`

| # | Coluna | Tipo | Restrições | Descrição |
|---|--------|------|------------|-----------|
| 0 | `id` | INTEGER | PRIMARY KEY | Identificador único |
| 1 | `titulo` | TEXT | NOT NULL | Título da notícia |
| 2 | `conteudo` | TEXT | NOT NULL | Conteúdo HTML completo |
| 3 | `imagem` | TEXT | - | Path local antigo: `/uploads/noticias/1/hash.jpeg` |
| 4 | `data_publicacao` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Data/hora da publicação |
| 5 | `autor` | TEXT | - | Autor (NULL na maioria) |
| 6 | `categoria` | TEXT | - | **⚠️ É O CHAPÉU!** (não é categoria real) |
| 7 | `views` | INTEGER | DEFAULT 0 | Contador de visualizações |
| 8 | `imagem_cloudinary` | TEXT | - | URL Cloudinary antiga (funcional) |

---

## 📝 CAMPOS DETALHADOS

### 1. `titulo` (TEXT NOT NULL)
- Título completo da notícia
- **Exemplo:** "Prefeitura diz que alojamento era estacionamento em projeto original"

### 2. `conteudo` (TEXT NOT NULL)
- Conteúdo completo em HTML
- Contém tags `<p>`, `<strong>`, `\r\n`
- **Exemplo:**
  ```html
  <p>A Prefeitura do Rio de Janeiro informou em nota que...</p>
  <p><strong>Corpo de Bombeiros</strong></p>
  <p>Mais cedo, o Corpo de Bombeiros informou...</p>
  ```

### 3. `imagem` (TEXT)
- **Formato:** `/uploads/noticias/{pasta}/{hash_md5}.{ext}`
- **Exemplos:**
  - `/uploads/noticias/1/726a7eed49b74936676e205eca9f4d11.jpeg`
  - `/uploads/noticias/3/0b87804de5790d5ae965817f2db903c6.jpeg`
- **Status:** ❌ Arquivos NÃO existem localmente
- **Quantidade:** 15.903 notícias com imagem (99,8%)

### 4. `data_publicacao` (DATETIME)
- **Formato:** `YYYY-MM-DD HH:MM:SS`
- **Exemplos:**
  - `2019-02-08 16:10:29`
  - `2019-02-08 16:27:08`
- **Período:** Notícias antigas (arquivo histórico)

### 5. `autor` (TEXT)
- **Status:** `NULL` na maioria absoluta dos registros
- Praticamente não utilizado

### 6. `categoria` (TEXT) - ⚠️ **É O CHAPÉU!**
- **NÃO é categoria real** (política, esporte, etc.)
- **É o CHAPÉU da notícia** (tag editorial)
- **Top 10 Chapéus:**
  1. `Saiba Mais !` - 615 notícias
  2. `null` - 577 notícias (sem chapéu)
  3. `Coronavírus` - 330 notícias
  4. `Acidente` - 238 notícias
  5. `Geral` - 237 notícias
  6. `PRISÃO` - 210 notícias
  7. `Crime` - 202 notícias
  8. `Eleições 2022` - 179 notícias
  9. `Prisão` - 178 notícias (duplicado com #6)
  10. `URGENTE` - 167 notícias

- **Observações:**
  - Mistura de maiúsculas/minúsculas ("PRISÃO" vs "Prisão")
  - Sem padronização
  - Não corresponde às categorias do site principal

### 7. `views` (INTEGER DEFAULT 0)
- Contador de visualizações
- **Exemplos:** 272, 299, 382 views
- **Status:** ✅ Funcional

### 8. `imagem_cloudinary` (TEXT)
- **Formato:** URLs completas do Cloudinary
- **Exemplo:** 
  ```
  https://res.cloudinary.com/dlogsw1hy/image/upload/v1/r10-arquivo-antigo/726a7eed49b74936676e205eca9f4d11.jpeg
  ```
- **Status:** ✅ URLs funcionais (não migradas para R2)
- **Quantidade:** 15.903 notícias (99,8%)

---

## 🔍 DIFERENÇAS COM O SITE PRINCIPAL

### Site Principal (`server/noticias.db`)
```sql
noticias (
  id, titulo, subtitulo, chapeu, resumo, conteudo,
  autor, categoria, posicao, imagem, imagemUrl,
  imagem_destaque, slug, published_at, created_at,
  updated_at, views, status
)
```

### Módulo /arquivo (`arquivo/arquivo.db`)
```sql
noticias (
  id, titulo, conteudo, imagem, data_publicacao,
  autor, categoria (É CHAPÉU!), views, imagem_cloudinary
)
```

### Campos que NÃO existem no /arquivo:
- ❌ `subtitulo`
- ❌ `chapeu` (campo com nome correto)
- ❌ `resumo`
- ❌ `categoria` (real - política, esporte, etc.)
- ❌ `posicao` (supermanchete, destaque, geral)
- ❌ `imagemUrl` / `imagem_destaque`
- ❌ `slug`
- ❌ `published_at` / `created_at` / `updated_at`
- ❌ `status`

---

## 📊 ESTATÍSTICAS

- **Total de notícias:** 15.927
- **Com imagem:** 15.903 (99,8%)
- **Sem imagem:** 24 (0,2%)
- **Com chapéu definido:** 15.350
- **Sem chapéu (null):** 577
- **Período:** Arquivo histórico (pré-2025)
- **Imagens no Cloudinary:** ✅ Funcionais
- **Imagens locais:** ❌ Não existem

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Campo "categoria" mal nomeado**
- Deveria se chamar `chapeu`
- Contém valores de chapéu, não categoria

### 2. **Sem categorização real**
- Notícias não têm categoria estruturada
- Apenas chapéus editoriais livres

### 3. **Imagens locais inexistentes**
- Campo `imagem` aponta para paths que não existem
- Apenas `imagem_cloudinary` funciona

### 4. **Sem padronização de chapéus**
- "PRISÃO" vs "Prisão"
- "Saiba Mais !" com pontuação
- Sem lista controlada

### 5. **Estrutura simplificada demais**
- Falta subtítulo, resumo, slug
- Sem controle de status ou posição
- Sem timestamps adequados

---

## 🎯 RECOMENDAÇÕES

### Opção 1: Manter Como Está (Arquivo Histórico)
✅ **Pros:**
- Imagens já funcionam (Cloudinary)
- Não requer trabalho extra
- Serve como arquivo de consulta

❌ **Contras:**
- Estrutura despadronizada
- Não se integra com site principal
- Campo "categoria" mal nomeado

### Opção 2: Migrar para Estrutura Nova
✅ **Pros:**
- Padronização com site principal
- Possibilidade de categorização real
- Melhor SEO (slugs, etc.)

❌ **Contras:**
- Muito trabalho manual
- Perda de tempo
- 15.927 notícias para revisar

### Opção 3: Criar View SQL para Compatibilidade
✅ **Pros:**
- Acesso unificado via API
- Sem alterar banco original
- Mapeamento `categoria → chapeu`

❌ **Contras:**
- Campos faltantes continuam null
- Solução paliativa

---

## 💡 SUGESTÃO FINAL

**Manter módulo `/arquivo` SEPARADO do site principal:**

1. ✅ Usar `imagem_cloudinary` (já funciona)
2. ✅ Renomear logicamente no código: `categoria → chapeu`
3. ✅ Tratar como **arquivo histórico** (read-only)
4. ✅ Não migrar para R2 (desnecessário)
5. ✅ Interface específica para consulta histórica

**Estrutura sugerida no código:**
```javascript
// Ao buscar notícias do /arquivo
{
  id: row.id,
  titulo: row.titulo,
  chapeu: row.categoria, // ← Renomear no retorno da API
  conteudo: row.conteudo,
  imagem: row.imagem_cloudinary, // ← Usar Cloudinary
  data: row.data_publicacao,
  views: row.views
}
```

---

## 📌 CONCLUSÃO

O banco `/arquivo` é um **arquivo histórico** com estrutura simplificada:
- ✅ 15.927 notícias antigas
- ✅ Imagens no Cloudinary (funcionais)
- ⚠️ Campo "categoria" na verdade é CHAPÉU
- ❌ Não deve ser misturado com site principal
- 🎯 Melhor estratégia: manter separado e funcional

**Decisão:** Não migrar para R2. Usar Cloudinary que já funciona.
