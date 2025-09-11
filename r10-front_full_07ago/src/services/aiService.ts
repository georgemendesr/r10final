// Serviço de IA usando um proxy no backend (seguro) e fallback local
// A chave NUNCA fica no frontend. O frontend chama /api/ai/completions (proxy no servidor).

const AI_PROXY_URL = '/api/ai/completions';
const AI_HEALTH_URL = '/api/ai/health';

// Debug mínimo (sem expor chaves)
console.log('🔧 aiService.ts carregado (proxy backend)');

// Fallback antigo (Hugging Face) desativado por padrão para segurança
const HF_API_KEY = '';
const HF_API_URL = '';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface HuggingFaceResponse {
  generated_text: string;
}

// Função auxiliar para extrair palavras relevantes (sem artigos, preposições, etc.)
function extractRelevantWords(text: string): string[] {
  const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'com', 'por', 'sobre', 'entre', 'sem', 'até', 'após', 'antes', 'durante', 'e', 'ou', 'mas', 'que', 'se', 'quando', 'onde', 'como', 'porque', 'então', 'já', 'ainda', 'mais', 'menos', 'muito', 'pouco', 'todo', 'toda', 'todos', 'todas', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => word.trim());
}

// Função para verificar se há palavras repetidas entre textos
function hasRepeatedWords(text1: string, text2: string, text3?: string): boolean {
  const words1 = extractRelevantWords(text1);
  const words2 = extractRelevantWords(text2);
  const words3 = text3 ? extractRelevantWords(text3) : [];
  
  // Verifica repetição entre texto1 e texto2
  const hasRepetition12 = words1.some(word => words2.includes(word));
  
  // Se há texto3, verifica repetição com ele também
  if (text3) {
    const hasRepetition13 = words1.some(word => words3.includes(word));
    const hasRepetition23 = words2.some(word => words3.includes(word));
    return hasRepetition12 || hasRepetition13 || hasRepetition23;
  }
  
  return hasRepetition12;
}

// Função para filtrar sugestões que não repetem palavras
function filterNonRepeatingWords(suggestions: string[], existingTexts: string[]): string[] {
  return suggestions.filter(suggestion => {
    // Verifica se a sugestão não repete palavras com nenhum dos textos existentes
    return !existingTexts.some(existing => hasRepeatedWords(suggestion, existing));
  });
}

// Função para fazer chamada à API via proxy seguro
async function callGroqAPI(prompt: string): Promise<string> {
  try {
    console.log('🌐 Fazendo fetch para proxy:', AI_PROXY_URL);
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em jornalismo brasileiro. Responda sempre em português, seja direto e objetivo.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      throw new Error(`Erro na API Groq: ${response.status} - ${errorText}`);
    }

  const data: GroqResponse = await response.json();
    console.log('✅ Dados recebidos:', data);
    
    const content = data.choices[0]?.message?.content || '';
    console.log('📝 Conteúdo extraído:', content);
    
    return content;
  } catch (error) {
    console.error('❌ Erro ao chamar Groq API:', error);
    throw error;
  }
}

// Função para fazer chamada à API Hugging Face (fallback)
async function callHuggingFaceAPI(prompt: string): Promise<string> {
  if (!HF_API_KEY) {
    throw new Error('Chave da API Hugging Face não configurada');
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Hugging Face: ${response.status}`);
    }

    const data: HuggingFaceResponse[] = await response.json();
    return data[0]?.generated_text || '';
  } catch (error) {
    console.error('Erro ao chamar Hugging Face API:', error);
    throw error;
  }
}

// Função principal para chamar IA com fallback
async function callAI(prompt: string): Promise<string> {
  console.log('🤖 callAI iniciado');
  console.log('🔑 HF_API_KEY exists:', !!HF_API_KEY);
  
  try {
    // Tentar proxy (Groq no backend) primeiro
    console.log('🚀 Tentando proxy de IA no backend...');
    return await callGroqAPI(prompt);
    
    // Fallback para Hugging Face
    if (HF_API_KEY) {
      console.log('🚀 Tentando Hugging Face API...');
      return await callHuggingFaceAPI(prompt);
    }
    
    // Se não há chaves configuradas, usar geração local
    console.warn('⚠️ Nenhuma API configurada, usando fallback local');
    throw new Error('Nenhuma API de IA configurada');
  } catch (error) {
    console.warn('❌ APIs de IA falharam, usando geração local:', error);
    return generateLocalFallback(prompt);
  }
}

// Geração local como último recurso
function generateLocalFallback(prompt: string): string {
  const type = prompt.toLowerCase();
  
  if (type.includes('título')) {
    return `Título Sugerido\nNovo Desenvolvimento\nÚltimas Notícias`;
  }
  
  if (type.includes('subtítulo')) {
    return `Entenda os principais detalhes\nConfira as informações completas\nSaiba mais sobre o assunto`;
  }
  
  if (type.includes('chapéu')) {
    return `NOTÍCIAS\nATUALIDADES\nDESTAQUE`;
  }
  
  return 'Sugestão gerada localmente';
}

// Gerar sugestões de títulos
export async function generateTitles(content: string, maxLength: number = 75, existingSubtitle?: string, existingChapeu?: string): Promise<string[]> {
  console.log('📰 generateTitles iniciado');
  console.log('📝 Content length:', content.length);
  console.log('📝 Content preview:', content.substring(0, 100));
  console.log('📏 Max length:', maxLength);
  console.log('📄 Existing subtitle:', existingSubtitle);
  console.log('🏷️ Existing chapeu:', existingChapeu);

  const prompt = `
INSTRUÇÕES CRÍTICAS PARA JORNALISMO:
- NUNCA invente informações que não estão no texto
- Use APENAS os fatos presentes no conteúdo fornecido
- NÃO adicione detalhes, números ou nomes que não existem no texto original
- Seja factual e preciso, sem especulação
- IMPORTANTE: Use palavras DIFERENTES do subtítulo e chapéu existentes

${existingSubtitle ? `SUBTÍTULO EXISTENTE: "${existingSubtitle}" - NÃO repita estas palavras` : ''}
${existingChapeu ? `CHAPÉU EXISTENTE: "${existingChapeu}" - NÃO repita estas palavras` : ''}

Baseado ESTRITAMENTE no seguinte conteúdo jornalístico, gere 3 títulos informativos.
Cada título deve ter no máximo ${maxLength} caracteres.
Use APENAS as informações que estão explicitamente no texto.
Use palavras COMPLEMENTARES, não repetitivas.

Conteúdo:
${content.substring(0, 1000)}

Responda apenas com os 3 títulos, um por linha, sem numeração:
`;

  console.log('🎯 Prompt preparado, chamando callAI...');

  try {
    const response = await callAI(prompt);
    console.log('✅ Resposta recebida:', response);
    
    let suggestions = response
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3)
      .map(title => title.trim().substring(0, maxLength));

    console.log('📋 Sugestões processadas:', suggestions);

    // Filtrar sugestões que repetem palavras
    const existingTexts = [existingSubtitle, existingChapeu].filter(Boolean);
    if (existingTexts.length > 0) {
      const filteredSuggestions = filterNonRepeatingWords(suggestions, existingTexts);
      if (filteredSuggestions.length > 0) {
        suggestions = filteredSuggestions;
        console.log('🔧 Sugestões filtradas:', suggestions);
      }
    }

    console.log('🏁 Retornando sugestões finais:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('❌ Erro ao gerar títulos:', error);
    const fallback = generateTitlesFallback(content, maxLength);
    console.log('🔄 Usando fallback:', fallback);
    return fallback;
  }
}

// Gerar sugestões de subtítulos
export async function generateSubtitles(content: string, title: string, maxLength: number = 120, existingChapeu?: string): Promise<string[]> {
  const prompt = `
INSTRUÇÕES CRÍTICAS PARA JORNALISMO:
- NUNCA invente informações que não estão no texto
- Use APENAS os fatos presentes no conteúdo fornecido
- NÃO adicione detalhes, números ou nomes que não existem no texto original
- Seja factual e preciso, complementando o título sem especular
- IMPORTANTE: Use palavras DIFERENTES do título e chapéu existentes

TÍTULO EXISTENTE: "${title}" - NÃO repita estas palavras
${existingChapeu ? `CHAPÉU EXISTENTE: "${existingChapeu}" - NÃO repita estas palavras` : ''}

Para o título "${title}", gere 3 subtítulos jornalísticos que complementem a informação.
Cada subtítulo deve ter no máximo ${maxLength} caracteres.
Use APENAS as informações que estão explicitamente no conteúdo abaixo.
Use palavras COMPLEMENTARES ao título, não repetitivas.

Conteúdo:
${content.substring(0, 1000)}

Responda apenas com os 3 subtítulos, um por linha, sem numeração:
`;

  try {
    const response = await callAI(prompt);
    let suggestions = response
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3)
      .map(subtitle => subtitle.trim().substring(0, maxLength));

    // Filtrar sugestões que repetem palavras
    const existingTexts = [title, existingChapeu].filter(Boolean);
    const filteredSuggestions = filterNonRepeatingWords(suggestions, existingTexts);
    if (filteredSuggestions.length > 0) {
      suggestions = filteredSuggestions;
    }

    return suggestions;
  } catch (error) {
    console.error('Erro ao gerar subtítulos:', error);
    return generateSubtitlesFallback(content, title, maxLength);
  }
}

// Gerar sugestões de chapéus
export async function generateChapeus(content: string, maxLength: number = 20, existingTitle?: string, existingSubtitle?: string): Promise<string[]> {
  const prompt = `
INSTRUÇÕES CRÍTICAS PARA JORNALISMO:
- Analise APENAS o conteúdo fornecido
- NÃO invente palavras que não se relacionam ao texto
- Chapéu é uma CHAMADA ou PALAVRA-CHAVE sobre o assunto principal
- IMPORTANTE: Use palavras DIFERENTES do título e subtítulo existentes

${existingTitle ? `TÍTULO EXISTENTE: "${existingTitle}" - NÃO repita estas palavras` : ''}
${existingSubtitle ? `SUBTÍTULO EXISTENTE: "${existingSubtitle}" - NÃO repita estas palavras` : ''}

Baseado ESTRITAMENTE no conteúdo jornalístico abaixo, gere 3 opções de chapéu.
CHAPÉU = palavra ou duas palavras que resumem o ASSUNTO PRINCIPAL da matéria.
Cada chapéu deve ter no máximo ${maxLength} caracteres.
Use palavras COMPLEMENTARES ao título e subtítulo, não repetitivas.

Exemplos de bons chapéus:
- "EDUCAÇÃO" (para matéria sobre escolas)
- "TRÂNSITO" (para matéria sobre vias)
- "SAÚDE" (para matéria sobre hospitais)
- "OBRAS" (para matéria sobre construções)
- "ELEIÇÕES" (para matéria sobre política eleitoral)

Conteúdo:
${content.substring(0, 800)}

Responda apenas com os 3 chapéus em MAIÚSCULAS, um por linha, sem numeração:
`;

  try {
    const response = await callAI(prompt);
    let suggestions = response
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3)
      .map(chapeu => chapeu.trim().toUpperCase().substring(0, maxLength));

    // Filtrar sugestões que repetem palavras
    const existingTexts = [existingTitle, existingSubtitle].filter(Boolean);
    if (existingTexts.length > 0) {
      const filteredSuggestions = filterNonRepeatingWords(suggestions, existingTexts);
      if (filteredSuggestions.length > 0) {
        suggestions = filteredSuggestions;
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Erro ao gerar chapéus:', error);
    return generateChapeusFallback(content, maxLength);
  }
}

// Fallbacks locais
function generateTitlesFallback(content: string, maxLength: number): string[] {
  const firstSentence = content.split('.')[0];
  const words = firstSentence.split(' ').slice(0, 8);
  
  return [
    words.slice(0, 6).join(' '),
    `Novo: ${words.slice(1, 6).join(' ')}`,
    `${words.slice(0, 5).join(' ')} em destaque`
  ].map(s => s.length > maxLength ? s.substring(0, maxLength-3) + '...' : s);
}

function generateSubtitlesFallback(content: string, title: string, maxLength: number): string[] {
  const words = content.split(' ').slice(0, 10);
  
  return [
    `Entenda os detalhes sobre ${words.slice(0, 4).join(' ').toLowerCase()}`,
    `Confira as principais informações do caso`,
    `Saiba mais sobre os desdobramentos`
  ].map(s => s.length > maxLength ? s.substring(0, maxLength-3) + '...' : s);
}

function generateChapeusFallback(content: string, maxLength: number): string[] {
  const text = content.toLowerCase();
  
  // Detecção baseada no assunto principal, não categoria editorial
  if (text.includes('prefeito') || text.includes('prefeitura') || text.includes('governo municipal')) {
    return ['PREFEITURA', 'GOVERNO', 'GESTÃO'];
  }
  
  if (text.includes('escola') || text.includes('educação') || text.includes('professor')) {
    return ['EDUCAÇÃO', 'ENSINO', 'ESCOLA'];
  }
  
  if (text.includes('hospital') || text.includes('saúde') || text.includes('médico')) {
    return ['SAÚDE', 'MEDICINA', 'HOSPITAL'];
  }
  
  if (text.includes('obra') || text.includes('construção') || text.includes('pavimentação')) {
    return ['OBRAS', 'INFRAESTRUTURA', 'CONSTRUÇÃO'];
  }
  
  if (text.includes('polícia') || text.includes('crime') || text.includes('segurança')) {
    return ['SEGURANÇA', 'POLÍCIA', 'CRIME'];
  }
  
  if (text.includes('eleição') || text.includes('candidato') || text.includes('voto')) {
    return ['ELEIÇÕES', 'POLÍTICA', 'CANDIDATOS'];
  }
  
  if (text.includes('trânsito') || text.includes('rua') || text.includes('avenida')) {
    return ['TRÂNSITO', 'VIAS', 'MOBILIDADE'];
  }
  
  return ['NOTÍCIAS', 'CIDADE', 'COMUNIDADE'];
}

// Detectar categoria automaticamente
export async function detectCategory(content: string): Promise<{
  categoria: string;
  subcategoria: string;
  confidence: number;
}> {
  const prompt = `
Analise o conteúdo jornalístico e identifique a categoria e subcategoria mais adequada.

CATEGORIAS DISPONÍVEIS:
- editoriais: policia, politica, esporte, entretenimento, geral
- municipios: piripiri, pedro-ii, brasileira, lagoa-de-sao-francisco, piracuruca, sao-jose-do-divino, domingos-mourao, capitao-de-campos, cocal-de-telha, milton-brandao, teresina, boa-hora
- especiais: investigacao, series-especiais, entrevistas, grandes-reportagens, documentarios

Conteúdo:
${content.substring(0, 1200)}

Responda EXATAMENTE no formato:
categoria: [categoria]
subcategoria: [subcategoria]
confidence: [0-100]
`;

  try {
    const response = await callAI(prompt);
    
    // Parse da resposta
    const lines = response.split('\n');
    const categoriaLine = lines.find(line => line.startsWith('categoria:'));
    const subcategoriaLine = lines.find(line => line.startsWith('subcategoria:'));
    const confidenceLine = lines.find(line => line.startsWith('confidence:'));
    
    const categoria = categoriaLine?.split(':')[1]?.trim() || 'editoriais';
    const subcategoria = subcategoriaLine?.split(':')[1]?.trim() || 'geral';
    const confidence = parseInt(confidenceLine?.split(':')[1]?.trim() || '70');
    
    return {
      categoria,
      subcategoria,
      confidence
    };
  } catch (error) {
    console.error('Erro na detecção de categoria:', error);
    // Fallback para detecção básica
    return detectCategoryFallback(content);
  }
}

// Fallback para detecção de categoria (sem IA)
function detectCategoryFallback(content: string): {
  categoria: string;
  subcategoria: string;
  confidence: number;
} {
  const text = content.toLowerCase();
  
  // Palavras-chave para cada categoria
  const keywords = {
    policia: ['polícia', 'crime', 'prisão', 'delegacia', 'roubo', 'furto', 'homicídio'],
    politica: ['prefeito', 'vereador', 'eleição', 'governo', 'política', 'câmara'],
    esporte: ['futebol', 'time', 'jogo', 'campeonato', 'atleta', 'esporte'],
    saude: ['hospital', 'médico', 'saúde', 'doença', 'tratamento', 'sus'],
    educacao: ['escola', 'professor', 'aluno', 'educação', 'universidade']
  };
  
  // Cidades do Piauí
  const cidades = ['piripiri', 'pedro ii', 'teresina', 'brasileira', 'piracuruca'];
  
  // Verificar se é sobre alguma cidade específica
  for (const cidade of cidades) {
    if (text.includes(cidade)) {
      return {
        categoria: 'municipios',
        subcategoria: cidade.replace(' ', '-'),
        confidence: 80
      };
    }
  }
  
  // Verificar categoria editorial
  for (const [subcat, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return {
        categoria: 'editoriais',
        subcategoria: subcat,
        confidence: 75
      };
    }
  }
  
  return {
    categoria: 'editoriais',
    subcategoria: 'geral',
    confidence: 50
  };
} 