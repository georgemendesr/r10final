import React, { useState, useEffect } from 'react';

interface LatestNews {
  id: number;
  titulo: string;
  publishedAt?: string;
  createdAt?: string;
}

const BreakingBar = () => {
  const [latestNews, setLatestNews] = useState<LatestNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        console.log('📰 BreakingBar: Buscando últimas notícias...');
        const response = await fetch('/api/posts?limit=10');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📰 BreakingBar: Dados recebidos:', data);
        
        // Se for array direto, usar; senão verificar se tem propriedade 'items'
        const posts = Array.isArray(data) ? data : data.items || [];
        
        // Filtrar e ordenar por data mais recente
        const sortedPosts = posts
          .filter((post: any) => post.titulo) // Só posts com título
          .sort((a: any, b: any) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 8); // Pegar as 8 mais recentes
        
        console.log('📰 BreakingBar: Posts ordenados:', sortedPosts.length);
        setLatestNews(sortedPosts);
      } catch (error) {
        console.error('❌ Erro ao buscar últimas notícias:', error);
        // Fallback para dados mockados em caso de erro
        setLatestNews([
          { id: 1, titulo: "Prefeito anuncia novo hospital para região norte" },
          { id: 2, titulo: "Chuvas intensas atingem 12 municípios do interior" },
          { id: 3, titulo: "Festival de verão movimenta economia local" },
          { id: 4, titulo: "Universidade abre inscrições para 500 vagas" },
          { id: 5, titulo: "Operação policial prende quadrilha no centro" },
          { id: 6, titulo: "Governo investe R$ 30 milhões em educação" }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestNews();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-breakingRed text-white py-2 overflow-hidden">
        <div className="container mx-auto px-4 max-w-[1180px] flex items-center">
          <span className="bg-white text-breakingRed px-4 py-1 rounded text-sm font-bold uppercase flex-shrink-0 mr-4">
            ÚLTIMAS
          </span>
          <div className="flex-1">
            <span className="text-sm font-medium">Carregando últimas notícias...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-breakingRed text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4 max-w-[1180px] flex items-center">
        <span className="bg-white text-breakingRed px-4 py-1 rounded text-sm font-bold uppercase flex-shrink-0 mr-4">
          ÚLTIMAS
        </span>
        
        <div className="flex-1 overflow-hidden">
          <div className="animate-[scroll_20s_linear_infinite] whitespace-nowrap flex">
            {[...Array(3)].map((_, cycle) => (
              <div key={cycle} className="flex">
                {latestNews.map((news, index) => (
                  <a 
                    key={`${cycle}-${index}`} 
                    href={`/post/${news.id}`}
                    className="inline-block mr-20 text-sm font-medium hover:text-yellow-300 transition-colors duration-200 cursor-pointer"
                    title={`Leia: ${news.titulo}`}
                  >
                    • {news.titulo}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingBar;