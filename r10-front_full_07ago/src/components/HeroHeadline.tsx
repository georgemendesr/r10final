import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Post, getPostsByPosition } from '../services/postsService';
import { getHomeH1 } from '../lib/seo';

const HeroHeadline = () => {
  const [supermanchete, setSupermanchete] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  // Criar slug para URL
  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/gi, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  };

  useEffect(() => {
    const fetchSupermanchete = async () => {
      try {
        console.log('🎯 HeroHeadline: Buscando supermanchete...');
        const supermancheteArray = await getPostsByPosition('supermanchete', 1);
        console.log('🎯 Array retornado da API:', supermancheteArray);
        console.log('🎯 Quantidade encontrada:', supermancheteArray.length);
        const supermanchetePost = supermancheteArray[0] || null;
        
        console.log('🎯 Supermanchete encontrada:', supermanchetePost);
        
        setSupermanchete(supermanchetePost);
      } catch (error) {
        console.error('❌ Erro ao buscar supermanchete:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupermanchete();
  }, []);

  // Se não há supermanchete, não renderizar nada
  if (loading) {
    return (
      <section className="bg-white py-8 font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="animate-pulse">
            <div className="w-full h-96 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!supermanchete) {
    console.log('⚠️ Nenhuma supermanchete encontrada');
    return null; // Não renderizar se não há supermanchete
  }

  const articleUrl = `/noticia/${supermanchete.categoria || 'geral'}/${createSlug(supermanchete.titulo)}/${supermanchete.id}`;

  // Função para extrair texto limpo do HTML
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <section className="bg-white py-8 font-body">
      <div className="container mx-auto px-4 max-w-[1250px]">
        {/* Supermanchete Principal */}
        <div className="relative">
          <Link to={articleUrl} className="block group">
            <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
              <img
                src={supermanchete.imagemUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop"}
                alt={supermanchete.titulo}
                className="w-full h-96 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
              
              {/* Conteúdo da Manchete */}
              <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                {/* Chapéu da Matéria - sempre cinza claro, sem underline, sem animação */}
                {supermanchete.chapeu && (
                  <div className="mb-2">
                    <span className="inline-block text-gray-300 px-3 py-1 super-manchete-chapeu">
                      {supermanchete.chapeu}
                    </span>
                  </div>
                )}
                
                {/* Título sempre branco para supermanchete */}
                <h1 className="super-manchete-title mb-4 text-white drop-shadow-lg">
                  <span className="block">{supermanchete.titulo}</span>
                </h1>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Separador discreto */}
        <div className="h-px bg-gray-100 my-4"></div>
      </div>
    </section>
  );
};

export default HeroHeadline;