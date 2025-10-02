# 🔧 Correção de Bugs no Editor de Texto

**Data:** 02/10/2025  
**Problemas Resolvidos:** Blockquote e Highlight Animado

---

## 🐛 Problemas Reportados

### 1. **Blockquote selecionando texto inteiro**
**Sintoma:** Ao selecionar uma parte do texto e clicar em "Citação" (quote), o blockquote era aplicado ao parágrafo INTEIRO em vez de apenas ao texto selecionado.

**Causa Raiz:**
```typescript
// ❌ CÓDIGO PROBLEMÁTICO (linha 260)
element.textContent = selectedText;  // Usa string simples
range.deleteContents();
range.insertNode(element);
```

A função `insertSpecialElement` estava usando `textContent`, que converte a seleção em string plana, perdendo elementos inline (negrito, itálico, links, etc).

### 2. **Highlight animado não salvando**
**Sintoma:** Ao marcar texto como "Destaque Animado", a animação funcionava no editor, mas ao salvar e publicar a matéria, o destaque não animava (ficava amarelo fixo).

**Causa Raiz:**
```typescript
// ❌ CÓDIGO PROBLEMÁTICO (linha 190)
span.style.cssText = `
  background-size: 0% 100%;  // Inicia vazio
  transition: background-size 2s ...;
`;

// Preview no editor (TEMPORÁRIO)
setTimeout(() => {
  span.style.backgroundSize = '100% 100%';  // Anima, mas não salva
}, 300);
```

O HTML era salvo com `background-size: 0%` (estado inicial). A animação acontecia apenas no editor via JavaScript, mas não era preservada no banco de dados.

---

## ✅ Soluções Implementadas

### **Correção 1: Blockquote preservando elementos inline**

**Arquivo:** `RichTextEditor.tsx` (linha 272)

```typescript
// ✅ SOLUÇÃO: Usar extractContents() para preservar DOM
const fragment = range.extractContents();  // Mantém formatação
element.appendChild(fragment);             // Move fragmento para blockquote
range.insertNode(element);                 // Insere no DOM

// Salvar alteração
setTimeout(() => handleContentChange(), 100);
```

**Como funciona:**
- `extractContents()` retorna um **DocumentFragment** com os nós DOM originais
- Preserva: negrito, itálico, links, spans, etc
- Apenas o texto SELECIONADO é extraído e movido para dentro do `<blockquote>`

**Resultado:**
```html
<!-- ANTES (ERRADO) -->
<p>Lorem ipsum dolor sit amet</p>
<!-- Usuário seleciona "dolor sit" -->
<blockquote>Lorem ipsum dolor sit amet</blockquote>  ❌

<!-- DEPOIS (CORRETO) -->
<p>Lorem ipsum <blockquote>dolor sit</blockquote> amet</p>  ✅
```

---

### **Correção 2: Highlight animado com estado persistente**

**Arquivo:** `RichTextEditor.tsx` (linha 187)

```typescript
// ✅ SOLUÇÃO: Salvar com background-size: 0% (estado inicial)
span.style.cssText = `
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  background-size: 0% 100%;  // ⚠️ Estado INICIAL persistido
  background-repeat: no-repeat;
  background-position: left center;
  color: #000;
  font-weight: 600;
  /* SEM transition aqui - será aplicada no ArticlePage */
`.replace(/\s+/g, ' ').trim();

// Preview no editor (NÃO afeta o HTML salvo)
setTimeout(() => {
  span.style.transition = 'background-size 0.8s ease-out';
  span.style.backgroundSize = '100% 100%';
}, 100);
```

**Fluxo completo:**

1. **Editor** salva HTML com `background-size: 0%`
2. **Banco de dados** armazena:
   ```html
   <span data-highlight="animated" style="background-size: 0% 100%; ...">texto</span>
   ```

3. **ArticlePage** renderiza com CSS:
   ```css
   span[data-highlight="animated"] {
     background-size: 0% 100%;
     transition: background-size 1.2s cubic-bezier(0.4, 0, 0.2, 1);
   }
   
   span[data-highlight="animated"].animate-in-view {
     background-size: 100% 100% !important;
   }
   ```

4. **JavaScript scroll-based** adiciona classe quando usuário vê:
   ```typescript
   // ArticlePage.tsx (linha 139)
   const highlightElements = document.querySelectorAll('span[data-highlight="animated"]:not(.animate-in-view)');
   
   highlightElements.forEach((element) => {
     const rect = element.getBoundingClientRect();
     if (rect.top < windowHeight - 50) {
       element.classList.add('animate-in-view');  // 🎯 Ativa animação!
     }
   });
   ```

---

## 📊 Validação

### **Teste 1: Blockquote em texto selecionado**
1. Digitar: "O governo anunciou hoje novas medidas econômicas."
2. Selecionar: "novas medidas econômicas"
3. Clicar botão Quote
4. **Resultado esperado:**
   ```html
   <p>O governo anunciou hoje <blockquote>novas medidas econômicas</blockquote>.</p>
   ```

### **Teste 2: Highlight animado salvando**
1. Digitar: "O tempo de espera caiu de 60 para 20 dias."
2. Selecionar: "caiu de 60 para 20 dias"
3. Clicar botão "Highlight Animado"
4. **Verificar no editor:**
   - Preview animado aparece (amarelo preenchendo)
5. **Salvar matéria**
6. **Publicar e abrir matéria**
7. **Rolar página até o texto**
8. **Resultado esperado:**
   - Quando o texto aparecer na tela, fundo amarelo anima da esquerda para direita

### **Teste 3: Blockquote preservando formatação**
1. Digitar: "O ministro disse que as medidas serão rigorosas."
2. Aplicar **negrito** em "rigorosas"
3. Selecionar: "as medidas serão **rigorosas**"
4. Clicar botão Quote
5. **Resultado esperado:**
   ```html
   <blockquote>as medidas serão <strong>rigorosas</strong></blockquote>
   ```

---

## 🔍 Arquivos Modificados

### **1. RichTextEditor.tsx**
- **Linha 272:** Substituído `textContent` por `extractContents()` + `appendChild(fragment)`
- **Linha 187:** Removido `transition` do CSS inline salvo (apenas `background-size: 0%`)
- **Linha 210:** Preview temporário no editor com `transition` aplicada via JS

### **2. ArticlePage.tsx**
- **Linha 308:** Adicionado `<style>` inline com regras CSS para animação
- **Linha 139:** JavaScript scroll-based já existia (sem alteração)

---

## 🎯 Impacto

✅ **Blockquote:**
- Agora respeita a seleção EXATA do usuário
- Preserva formatação inline (negrito, itálico, links)
- Não "vaza" para o parágrafo inteiro

✅ **Highlight Animado:**
- HTML salvo com estado inicial correto (`background-size: 0%`)
- Animação executada apenas quando usuário vê o texto (scroll-based)
- Compatível com IntersectionObserver para performance

✅ **Experiência do Editor:**
- Preview visual no editor mantido
- Comportamento consistente entre editor e página publicada

---

## 📝 Observações Técnicas

### **Por que `extractContents()` em vez de `textContent`?**

| Método | Retorno | Formatação | Use Case |
|--------|---------|------------|----------|
| `textContent` | String plana | ❌ Perde | Texto simples |
| `extractContents()` | DocumentFragment | ✅ Preserva | HTML estruturado |

### **Por que salvar com `background-size: 0%`?**

Se salvarmos com `100%`, o destaque já aparece preenchido ao carregar a página, sem animação. O fluxo correto é:

1. Salvar: `0%` (pronto para animar)
2. CSS: `transition: background-size 1.2s`
3. JavaScript: Adiciona `.animate-in-view` quando visível
4. CSS: `.animate-in-view { background-size: 100% }`

Isso garante que a animação aconteça **scroll-based** (quando usuário vê), não ao carregar a página.

---

## ✅ Status

**Implementação:** ✅ Completa  
**Testes:** ⏳ Aguardando validação do usuário  
**Deploy:** ⏳ Pendente

---

**Desenvolvido por:** GitHub Copilot  
**Data:** 02/10/2025
