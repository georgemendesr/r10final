import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, MapPin, X, Zap, CheckCircle } from 'lucide-react';

interface AITagsGeneratorProps {
  title: string;
  content: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

const AITagsGenerator: React.FC<AITagsGeneratorProps> = ({
  title,
  content,
  tags,
  onTagsChange
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Palavras comuns para filtrar
  const commonWords = [
    'a', 'o', 'e', 'é', 'de', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma',
    'os', 'as', 'se', 'que', 'por', 'mais', 'como', 'mas', 'foi', 'ele', 'tem',
    'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está',
    'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era',
    'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'minha', 'têm',
    'àquelas', 'muito', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha',
    'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa',
    'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe',
    'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te',
    'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas',
    'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes',
    'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo',
    'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos',
    'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos',
    'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem',
    'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão',
    'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja',
    'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver',
    'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão',
    'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era',
    'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos',
    'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for',
    'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria',
    'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'têm', 'tinha',
    'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera',
    'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos',
    'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos',
    'terão', 'teria', 'teríamos', 'teriam'
  ];

  // Palavras específicas do Piauí
  const piauiWords = [
    'piauí', 'teresina', 'piripiri', 'pedro ii', 'campo maior', 'barras',
    'esperantina', 'picos', 'floriano', 'parnaíba', 'luzilândia', 'beneditinos',
    'coivaras', 'demerval lobão', 'lagoa do piauí', 'miguel leão', 'mucajaí',
    'nazária', 'palmeirais', 'passagem franca', 'regeneração', 'ribeiro gonçalves',
    'santa rosa', 'são joão do piauí', 'são pedro do piauí', 'socorro do piauí',
    'valença do piauí', 'várzea grande', 'altos', 'angical do piauí',
    'antônio almeida', 'aroeiras do itaim', 'arribação', 'baixa grande do ribeiro',
    'barra d\'alcântara', 'batalha', 'belém do piauí', 'betânia do piauí',
    'boa hora', 'bocaina', 'bom jesus', 'brejo do piauí', 'buriti dos lopes',
    'buriti dos montes', 'cabeceiras do piauí', 'cajazeiras do piauí',
    'cajueiro da praia', 'caldeirão grande do piauí', 'campinas do piauí',
    'campo alegre do fidalgo', 'campo grande do piauí', 'campo largo do piauí',
    'capitão de campos', 'capitão gervásio oliveira', 'caracol', 'caraúbas do piauí',
    'caridade do piauí', 'castelo do piauí', 'caxingó', 'cocal', 'cocal de telha',
    'cocal dos alves', 'coivaras', 'colônia do gurguéia', 'colônia do piauí',
    'conceição do canindé', 'coronel josé dias', 'corrente', 'cristalândia do piauí',
    'cristino castro', 'curimatá', 'currais', 'curralinhos', 'curral novo do piauí',
    'dom expedito lopes', 'domingos mourão', 'dom inocêncio', 'elesbão veloso',
    'eliseu martins', 'esperantina', 'fartura do piauí', 'flores do piauí',
    'floresta do piauí', 'floriano', 'francinópolis', 'francisco ayres',
    'francisco macedo', 'francisco santos', 'fronteiras', 'geminiano',
    'gilbués', 'guadalupe', 'guaribas', 'hugo napoleão', 'ilha grande',
    'inhuma', 'ipiranga do piauí', 'isaías coelho', 'itainópolis', 'itaueira',
    'jacobina do piauí', 'jaicós', 'joão costa', 'joaquim pires', 'joca marques',
    'josé de freitas', 'juazeiro do piauí', 'júlio borges', 'jurema',
    'lagoa alegre', 'lagoa de são francisco', 'lagoa do barro do piauí',
    'lagoa do piauí', 'lagoa do sítio', 'lagoinha do piauí', 'landri sales',
    'luís correia', 'luzilândia', 'madeiro', 'manoel emídio', 'marcolândia',
    'marcos parente', 'massapê do piauí', 'matias olímpio', 'miguel alves',
    'miguel leão', 'milton brandão', 'monsenhor gil', 'monsenhor hipólito',
    'monte alegre do piauí', 'morro cabeça no tempo', 'morro do chapéu do piauí',
    'mucajaí', 'nazaré do piauí', 'nossa senhora de nazaré', 'nossa senhora dos remédios',
    'nova santa rita', 'novo oriente do piauí', 'novo santo antônio',
    'oeiras', 'olho d\'água do piauí', 'padre marcos', 'paes landim',
    'pajeú do piauí', 'palmeira do piauí', 'palmeirais', 'paquetá',
    'parnaguá', 'parnaíba', 'passagem franca do piauí', 'patos do piauí',
    'pau d\'arco do piauí', 'paulistana', 'pavussu', 'pedro ii',
    'pedro laurentino', 'nova santa rita', 'picos', 'pimenteiras',
    'pio ix', 'piracuruca', 'piripiri', 'porto', 'porto alegre do piauí',
    'prata do piauí', 'queimada nova', 'redenção do gurguéia', 'regeneração',
    'ribeiro gonçalves', 'ribeiro gonçalves', 'rio grande do piauí',
    'santa cruz do piauí', 'santa cruz dos milagres', 'santa filomena',
    'santa luz', 'santana do piauí', 'santa rosa do piauí', 'santo antônio de lisboa',
    'santo antônio dos milagres', 'santo inácio do piauí', 'são braz do piauí',
    'são félix do piauí', 'são francisco de assis do piauí', 'são francisco do piauí',
    'são gonçalo do gurguéia', 'são gonçalo do piauí', 'são joão da canabrava',
    'são joão da fronteira', 'são joão da serra', 'são joão da varjota',
    'são joão do arraial', 'são joão do piauí', 'são josé do divino',
    'são josé do peixe', 'são josé do piauí', 'são julião', 'são lourenço do piauí',
    'são luis do piauí', 'são miguel da baixa grande', 'são miguel do fidalgo',
    'são miguel do tapuio', 'são pedro do piauí', 'são raimundo nonato',
    'sebastião barros', 'sebastião leal', 'sigefredo pacheco', 'simões',
    'simplício mendes', 'socorro do piauí', 'sussuapara', 'tamboril do piauí',
    'tanque do piauí', 'teresina', 'união', 'uruçuí', 'valença do piauí',
    'várzea branca', 'várzea grande', 'vera mendes', 'vila nova do piauí',
    'wall ferraz'
  ];

  // Simular geração de tags com IA
  const generateTags = async () => {
    setIsGenerating(true);
    setAiActive(true);

    // Simular delay da IA
    await new Promise(resolve => setTimeout(resolve, 2000));

    const allText = `${title} ${content}`.toLowerCase();
    const words = allText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Filtrar palavras comuns
    const filteredWords = words.filter(word => 
      !commonWords.includes(word.toLowerCase())
    );

    // Contar frequência
    const wordCount: { [key: string]: number } = {};
    filteredWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Priorizar palavras do Piauí
    const piauiMatches = filteredWords.filter(word => 
      piauiWords.includes(word.toLowerCase())
    );

    // Gerar tags
    const generatedTags: string[] = [];

    // Adicionar palavras do Piauí primeiro
    piauiMatches.slice(0, 3).forEach(word => {
      if (!generatedTags.includes(word)) {
        generatedTags.push(word);
      }
    });

    // Adicionar palavras mais frequentes
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    sortedWords.forEach(word => {
      if (generatedTags.length < 8 && !generatedTags.includes(word)) {
        generatedTags.push(word);
      }
    });

    setSuggestedTags(generatedTags);
    setIsGenerating(false);
  };

  // Adicionar tag sugerida
  const addSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  useEffect(() => {
    if (title.length > 10 && content.length > 50) {
      generateTags();
    }
  }, [title, content]);

  return (
    <div className="space-y-4">
                   <div className="flex items-center justify-between">
               <label className="block text-base font-semibold text-gray-900">
                 Tags
               </label>
        
        {/* Indicador de IA */}
        {aiActive && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Brain className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">IA Ativa</span>
          </div>
        )}
      </div>

      {/* Input manual de tags */}
                   <input
               type="text"
               placeholder="Digite uma tag e pressione Enter"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                   e.preventDefault();
                   const newTag = e.currentTarget.value.trim();
                   if (!tags.includes(newTag)) {
                     onTagsChange([...tags, newTag]);
                   }
                   e.currentTarget.value = '';
                 }
               }}
             />

      {/* Tags atuais */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
            >
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tags sugeridas pela IA */}
      {suggestedTags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Tags Sugeridas pela IA</h4>
            {isGenerating && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Zap className="w-3 h-3 animate-spin" />
                <span className="text-xs">Gerando...</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map(tag => (
              <button
                key={tag}
                onClick={() => addSuggestedTag(tag)}
                disabled={tags.includes(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  tags.includes(tag)
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {tag}
                {tags.includes(tag) && <CheckCircle className="w-3 h-3 ml-1 inline" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {tags.length} tags adicionadas
        </span>
        <span>
          {piauiWords.filter(word => 
            tags.some(tag => tag.toLowerCase().includes(word))
          ).length} tags do Piauí
        </span>
      </div>
    </div>
  );
};

export default AITagsGenerator; 