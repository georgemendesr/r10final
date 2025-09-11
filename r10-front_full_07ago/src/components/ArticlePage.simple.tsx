import React, { useEffect, useState } from 'react';
import { Calendar, User, Share2, MessageCircle, Facebook, Twitter } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getPostById } from '../services/postsService';
import Header from './Header';
import Footer from './Footer';
import BreakingBar from './BreakingBar';

interface Post {
  id: string;
  titulo: string;
  subtitulo?: string;
  autor: string;
  dataPublicacao: string;
  categoria: string;
  conteudo: string;
  imagemUrl?: string;
  views?: number;
  visualizacoes?: number;
}

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        const postData = await getPostById(id);
        setPost(postData);
      } catch (err) {
        setError('Erro ao carregar a matéria');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const shareWhatsApp = () => {
    if (post) {
      const text = encodeURIComponent(`${post.titulo} - ${window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const shareFacebook = () => {
    if (post) {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  const shareTwitter = () => {
    if (post) {
      const text = encodeURIComponent(post.titulo);
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <BreakingBar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <BreakingBar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error || 'Matéria não encontrada'}
            </h1>
            <p className="text-gray-600">
              Não foi possível carregar esta matéria. Tente novamente mais tarde.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BreakingBar />
      
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Cabeçalho da matéria */}
          <div className="p-8 border-b border-gray-200">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-sm font-medium rounded uppercase tracking-wide">
                {post.categoria}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {post.titulo}
            </h1>
            
            {post.subtitulo && (
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                {post.subtitulo}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Por <strong className="text-gray-700">{post.autor}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.dataPublicacao)}</span>
              </div>
              {(post.views || post.visualizacoes) && (
                <span>{post.views || post.visualizacoes} visualizações</span>
              )}
            </div>
          </div>

          {/* Imagem da matéria */}
          {post.imagemUrl && (
            <div className="px-8 py-6">
              <img 
                src={post.imagemUrl} 
                alt={post.titulo}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Conteúdo da matéria */}
          <div className="px-8 py-6">
            <div className="prose prose-lg max-w-none">
              {post.conteudo.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Botões de compartilhamento */}
          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Compartilhar:</h3>
            <div className="flex gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={shareFacebook}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </button>
              <button
                onClick={shareTwitter}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </button>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default ArticlePage;
