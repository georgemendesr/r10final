# Instagram Insights - Diagnóstico de Métricas Zeradas

**Data**: 01/10/2025  
**Conta**: @r10piaui (77.536 seguidores, 6+ anos)

## ❌ Problema

Apenas a métrica **reach** retorna dados. Todas as outras retornam **0 dias de dados** mesmo a conta tendo mais de 77 mil seguidores e 6 anos de atividade.

## ✅ O que FUNCIONA

| Métrica | Status | Dados |
|---------|--------|-------|
| `reach` | ✅ OK | 946.369 (29 dias) |
| `followers_count` | ✅ OK | 77.536 |

## ❌ O que NÃO funciona

| Métrica | Status | Dias retornados |
|---------|--------|----------------|
| `accounts_engaged` | ❌ Vazio | 0 dias |
| `profile_views` | ❌ Vazio | 0 dias |
| `total_interactions` | ❌ Vazio | 0 dias |
| `likes` | ❌ Vazio | 0 dias |
| `comments` | ❌ Vazio | 0 dias |
| `website_clicks` | ❌ Vazio | 0 dias |
| `impressions` | ❌ REMOVIDA | Não existe mais na API v22.0 |

## 🔍 Testes Realizados

1. ✅ Removida métrica `impressions` (não existe mais na Meta Graph API v22.0)
2. ✅ Testado COM `metric_type=total_value` → Retorna vazio
3. ✅ Testado SEM `metric_type=total_value` → Retorna vazio
4. ✅ Confirmado que API responde sem erros (status 200)
5. ✅ Confirmado que arquivo está sendo carregado corretamente

## 🔧 Causas Prováveis

### 1. **Permissões do Token Insuficientes** (MAIS PROVÁVEL)

O token atual pode não ter as permissões necessárias:

```
Permissões necessárias:
- instagram_basic
- instagram_manage_insights ← CRÍTICA
- pages_read_engagement
- pages_show_list
```

**Solução**: Gerar novo token com todas as permissões em:
https://developers.facebook.com/tools/explorer/

### 2. **Conta não é Business/Creator Account**

Insights só funcionam em contas Business ou Creator.

**Verificar**: Instagram App → Configurações → Conta → Tipo de conta

### 3. **Token Expirado**

Tokens de usuário expiram em 60 dias.

**Solução**: Gerar token de longa duração (60 dias) ou usar Page Access Token (não expira).

### 4. **API v22.0 Limitações**

Algumas métricas podem ter sido movidas ou só estar disponíveis em:
- Nível de mídia (posts específicos) em vez de nível de conta
- Período agregado (days_28) em vez de série diária (day)

## 📊 Logs do Backend

```
[analytics][IG] Buscando métrica: reach
[analytics][IG] ✅ reach OK: 29 dias, sum=946369

[analytics][IG] Buscando métrica: accounts_engaged
[analytics][IG] ✅ accounts_engaged OK: 0 dias, sum=0  ← VAZIO!

[analytics][IG] Buscando métrica: likes
[analytics][IG] ✅ likes OK: 0 dias, sum=0  ← VAZIO!
```

**Status 200** mas sem dados = API aceitou requisição mas não retornou séries temporais.

## ✅ Próximos Passos

1. **Gerar novo token** com permissões completas
2. **Verificar tipo de conta** (Business/Creator)
3. **Testar período agregado** (days_28) em vez de séries diárias
4. **Verificar na interface da Meta** se essas métricas aparecem lá
5. **Considerar usar métricas no nível de mídia** (posts individuais)

## 🎯 Alternativa Imediata

Se métricas de conta não funcionarem, podemos:

1. **Buscar métricas por post** (funciona melhor)
2. **Usar apenas reach** (que funciona) como indicador principal
3. **Implementar estimativas** baseadas em reach e taxas médias da indústria

## 📝 Notas

- Meta está constantemente mudando a API de Insights
- Muitas métricas foram removidas ou restritas em 2024-2025
- Documentação oficial: https://developers.facebook.com/docs/instagram-api/reference/ig-user/insights
