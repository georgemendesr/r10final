import React, { useState, useEffect } from 'react';
import { Camera, Instagram, Eye, RefreshCw, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface PublishedPost {
  id: string;
  title: string;
  instagramPostId: string;
  publishedAt: string;
  status: 'success' | 'error';
}

const InstagramCardGenerator = () => {
  const [title, setTitle] = useState("");
  const [hat, setHat] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Carregar histórico de posts ao montar o componente
  useEffect(() => {
    loadPublishedPosts();
  }, []);

  const loadPublishedPosts = () => {
    const saved = localStorage.getItem('r10_instagram_posts');
    if (saved) {
      try {
        setPublishedPosts(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }
  };

  const savePost = (post: PublishedPost) => {
    const updated = [post, ...publishedPosts.slice(0, 9)]; // Manter últimos 10
    setPublishedPosts(updated);
    localStorage.setItem('r10_instagram_posts', JSON.stringify(updated));
  };

  async function generateIntelligentCaption() {
    if (!title.trim()) return;
    
    setIsGeneratingCaption(true);
    try {
      const response = await fetch('http://localhost:8080/api/social/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, hat })
      });
      
      const result = await response.json();
      if (result.ok && result.caption) {
        setCaption(result.caption);
      } else {
        // Fallback para legenda padrão
        setCaption(`${title}\n\n📰 Confira mais notícias em R10piaui.com\n\n#R10Piauí #Notícias #Piauí`);
      }
    } catch (error) {
      console.error('Erro ao gerar legenda inteligente:', error);
      setCaption(`${title}\n\n📰 Confira mais notícias em R10piaui.com\n\n#R10Piauí #Notícias #Piauí`);
    } finally {
      setIsGeneratingCaption(false);
    }
  }

  async function generatePreview() {
    if (!title.trim()) {
      alert('Por favor, digite um título');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          hat: hat || 'NOTÍCIA', 
          imageUrl: imageUrl || 'https://picsum.photos/1080/1350'
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setPreview(result.preview);
        // Gerar legenda inteligente se não houver
        if (!caption) {
          await generateIntelligentCaption();
        }
      } else {
        alert("Erro ao gerar preview: " + JSON.stringify(result.error));
      }
    } catch (error) {
      alert("Erro: " + error);
    } finally {
      setLoading(false);
    }
  }

  async function publishToInstagram() {
    if (!preview) {
      alert('Gere um preview primeiro');
      return;
    }

    if (!caption.trim()) {
      alert('Por favor, adicione uma legenda');
      return;
    }

    setLoading(true);
    const publishTime = new Date().toISOString();
    
    try {
      const response = await fetch('http://localhost:8080/api/social/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          hat,
          caption
        })
      });
      
      const result = await response.json();
      
      if (result.ok && result.postId) {
        // Salvar no histórico
        const newPost: PublishedPost = {
          id: Date.now().toString(),
          title: title.slice(0, 80) + (title.length > 80 ? '...' : ''),
          instagramPostId: result.postId,
          publishedAt: publishTime,
          status: 'success'
        };
        savePost(newPost);
        
        alert(`✅ Publicado no Instagram com sucesso!\n\nID: ${result.postId}\nTítulo: ${title}`);
        
        // Limpar formulário
        setTitle("");
        setHat("");
        setImageUrl("");
        setPreview(null);
        setCaption("");
      } else {
        // Salvar erro no histórico
        const errorPost: PublishedPost = {
          id: Date.now().toString(),
          title: title.slice(0, 80) + (title.length > 80 ? '...' : ''),
          instagramPostId: 'ERRO',
          publishedAt: publishTime,
          status: 'error'
        };
        savePost(errorPost);
        
        alert("❌ Falha na publicação: " + JSON.stringify(result.error || result));
      }
    } catch (error) {
      // Salvar erro no histórico
      const errorPost: PublishedPost = {
        id: Date.now().toString(),
        title: title.slice(0, 80) + (title.length > 80 ? '...' : ''),
        instagramPostId: 'ERRO',
        publishedAt: publishTime,
        status: 'error'
      };
      savePost(errorPost);
      
      alert("❌ Erro: " + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Gerador de Cards Instagram</h2>
            <p className="text-gray-600 text-sm">Crie e publique cards automaticamente com IA</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" />
            Histórico ({publishedPosts.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapéu
              </label>
              <input 
                value={hat} 
                onChange={e => setHat(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                placeholder="Ex.: POLÍCIA" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <textarea 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                rows={3} 
                placeholder="Digite o título da notícia"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem (opcional)
              </label>
              <input 
                value={imageUrl} 
                onChange={e => setImageUrl(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                placeholder="https://exemplo.com/imagem.jpg" 
              />
              <p className="text-xs text-gray-500 mt-1">Se não informada, será usada uma imagem aleatória</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={generatePreview} 
                disabled={loading || !title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {loading ? "Gerando..." : "Gerar Preview"}
              </button>
              
              <button 
                onClick={publishToInstagram} 
                disabled={loading || !preview}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Instagram className="w-4 h-4" />
                )}
                {loading ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            {preview ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preview do Card</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <img 
                    src={preview} 
                    alt="Preview do card" 
                    className="w-64 mx-auto rounded-lg shadow-lg" 
                  />
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Legenda
                    </label>
                    <button
                      onClick={generateIntelligentCaption}
                      disabled={isGeneratingCaption || !title.trim()}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                    >
                      {isGeneratingCaption ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-blue-700"></div>
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {isGeneratingCaption ? "Gerando..." : "IA"}
                    </button>
                  </div>
                  <textarea 
                    value={caption} 
                    onChange={e => setCaption(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    rows={4} 
                    placeholder="Legenda será gerada automaticamente..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {caption.length} caracteres
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Preencha o título e clique em "Gerar Preview" para ver o card</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Posts */}
      {showHistory && publishedPosts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Últimas Publicações
          </h3>
          <div className="space-y-3">
            {publishedPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {post.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{post.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(post.publishedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                {post.status === 'success' && post.instagramPostId !== 'ERRO' && (
                  <a
                    href={`https://www.instagram.com/p/${post.instagramPostId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver Post
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories (Funcionalidade Futura) */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stories Instagram</h3>
            <p className="text-sm text-gray-600">Em breve: Criação automática de Stories com links clicáveis</p>
          </div>
        </div>
        <div className="bg-white/50 rounded-lg p-4 text-center">
          <p className="text-gray-500 text-sm">
            🚧 Funcionalidade em desenvolvimento
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstagramCardGenerator; 