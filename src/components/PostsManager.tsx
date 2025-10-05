import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Search, FileText, Instagram, Camera, RefreshCw, Eye
} from 'lucide-react';
import { getPosts, deletePost, Post, ensureArray } from '../services/postsService';
import { useAuth } from '../contexts/AuthContext';
import { sortPostsByPriority, getPosicaoBadge } from '../utils/postSorting';


const PostsManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedPosition, setSelectedPosition] = useState<string>('todas');
  const [selectedAuthor, setSelectedAuthor] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  // Carregar posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await getPosts();
      // Garantir que sempre temos um array, considerando que getPosts pode retornar LegacyPostsResult
      const postsArray: Post[] = Array.isArray(result) 
        ? result 
        : Array.isArray(result?.posts) 
          ? result.posts 
          : [];
      console.log('🔄 PostsManager: Posts carregados:', postsArray.length);
      setPosts(postsArray);
      setFilteredPosts(postsArray);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Recarregar posts quando a janela volta ao foco para atualizar dados
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 PostsManager: Janela voltou ao foco, recarregando posts...');
      loadPosts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Função para mapear categoria para subcategoria editorial obrigatória
  const mapToEditorialCategory = (categoria: string, subcategoria?: string): string => {
    // Se tem subcategoria, usar ela primeiro
    const categoryToCheck = (subcategoria || categoria || '').toLowerCase();
    
    // Mapeamento para as 5 subcategorias editoriais obrigatórias:
    if (categoryToCheck.includes('polici') || categoryToCheck.includes('segur') || 
        categoryToCheck.includes('crime') || categoryToCheck.includes('violenc')) {
      return 'policia';
    }
    
    if (categoryToCheck.includes('politic') || categoryToCheck.includes('eleic') || 
        categoryToCheck.includes('governo') || categoryToCheck.includes('prefeito') ||
        categoryToCheck.includes('vereador') || categoryToCheck.includes('deputado')) {
      return 'política';
    }
    
    if (categoryToCheck.includes('esport') || categoryToCheck.includes('futebol') || 
        categoryToCheck.includes('campeonato') || categoryToCheck.includes('jogo') ||
        categoryToCheck.includes('copa') || categoryToCheck.includes('time')) {
      return 'esporte';
    }
    
    if (categoryToCheck.includes('entret') || categoryToCheck.includes('cultura') || 
        categoryToCheck.includes('festival') || categoryToCheck.includes('show') ||
        categoryToCheck.includes('cinema') || categoryToCheck.includes('música') ||
        categoryToCheck.includes('arte')) {
      return 'entretenimento';
    }
    
    // Default: geral (para economia, saúde, educação, especiais, municípios, etc.)
    return 'geral';
  };

  // Função para gerar card Instagram
  const handleGenerateInstagramCard = async (post: Post, type: 'feed' | 'story') => {
    try {
  console.log(`Gerando ${type} para:`, post.titulo);
      
      // Mapear para subcategoria editorial obrigatória
  const editorialCategory = mapToEditorialCategory(post.categoria);
  console.log(`📍 Categoria original: "${post.categoria}", Mapeado para: "${editorialCategory}"`);
      
      const response = await fetch('http://localhost:8080/api/social/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: post.titulo,
          hat: post.chapeu || '',
          imageUrl: post.imagemUrl || `https://picsum.photos/1080/${type === 'story' ? '1920' : '1350'}`,
          categoria: editorialCategory, // USAR A CATEGORIA MAPEADA!
          type: type === 'story' ? 'story' : 'card'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.preview) {
          // Gerar legenda para o post
          const legenda = `🚨 ${post.chapeu || ''} em Piauí! 🚨

${post.titulo}

${post.conteudo ? post.conteudo.substring(0, 120) + '...' : ''}

Como isso impacta nossa região?

📍 Leia a notícia completa em www.r10piaui.com ou clique no link da bio.
🔴 R10 Piauí – Qualidade em Primeiro Lugar.

#R10PiauiPulse #Piauí #Notícias #${(post.chapeu || '').replace(/[ÃÁÀ]/g, 'A')}`;

          // Abrir preview em nova janela COM LEGENDA E BOTÃO
          const previewWindow = window.open('', '_blank', 'width=700,height=900');
          if (previewWindow) {
            previewWindow.document.write(`
              <html>
                <head>
                  <title>Preview - ${type === 'story' ? 'Story' : 'Feed'} Instagram</title>
                  <style>
                    body { 
                      margin: 0; 
                      padding: 20px; 
                      background: #f0f0f0; 
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    .container { 
                      max-width: 600px; 
                      margin: 0 auto; 
                      background: white; 
                      border-radius: 12px; 
                      overflow: hidden; 
                      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    }
                    .header { 
                      background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); 
                      color: white; 
                      padding: 20px; 
                      text-align: center; 
                    }
                    .header h2 { 
                      margin: 0; 
                      font-size: 24px; 
                      font-weight: 600; 
                    }
                    .image-container { 
                      text-align: center; 
                      padding: 20px; 
                    }
                    .preview-image { 
                      max-width: 100%; 
                      height: auto; 
                      border-radius: 8px; 
                      box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
                    }
                    .legend-section { 
                      padding: 20px; 
                      background: #f8f9fa; 
                      border-top: 1px solid #e9ecef; 
                    }
                    .legend-title { 
                      font-size: 18px; 
                      font-weight: 600; 
                      color: #333; 
                      margin-bottom: 12px; 
                      display: flex; 
                      align-items: center; 
                    }
                    .legend-text { 
                      background: white; 
                      padding: 15px; 
                      border-radius: 8px; 
                      border-left: 4px solid #e53935; 
                      white-space: pre-wrap; 
                      font-family: monospace; 
                      font-size: 14px; 
                      line-height: 1.4; 
                      color: #333; 
                      max-height: 200px; 
                      overflow-y: auto; 
                    }
                    .actions { 
                      padding: 20px; 
                      text-align: center; 
                      background: white; 
                    }
                    .publish-btn { 
                      background: linear-gradient(135deg, #833ab4, #fd1d1d); 
                      color: white; 
                      border: none; 
                      padding: 12px 24px; 
                      font-size: 16px; 
                      font-weight: 600; 
                      border-radius: 8px; 
                      cursor: pointer; 
                      transition: all 0.3s; 
                      box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
                    }
                    .publish-btn:hover { 
                      transform: translateY(-2px); 
                      box-shadow: 0 6px 16px rgba(0,0,0,0.3); 
                    }
                    .publish-btn:active { 
                      transform: translateY(0); 
                    }
                    .copy-btn { 
                      background: #28a745; 
                      color: white; 
                      border: none; 
                      padding: 8px 16px; 
                      font-size: 14px; 
                      border-radius: 6px; 
                      cursor: pointer; 
                      margin-left: 10px; 
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h2>🎨 ${type === 'story' ? 'Instagram Story' : 'Instagram Feed'}</h2>
                    </div>
                    
                    <div class="image-container">
                      <img src="${data.preview}" alt="Instagram ${type}" class="preview-image" />
                    </div>
                    
                    <div class="legend-section">
                      <div class="legend-title">
                        📝 Legenda do Post:
                      </div>
                      <div class="legend-text" id="legend-text">${legenda}</div>
                    </div>
                    
                    <div class="actions">
                      <button class="publish-btn" onclick="publishToInstagram()">
                        📱 Publicar no Instagram
                      </button>
                      <button class="copy-btn" onclick="copyLegend()">
                        📋 Copiar Legenda
                      </button>
                    </div>
                  </div>
                  
                  <script>
                    async function publishToInstagram() {
                      const btn = document.querySelector('.publish-btn');
                      const originalText = btn.textContent;
                      
                      try {
                        btn.textContent = '📤 Publicando...';
                        btn.disabled = true;
                        
                        const response = await fetch('http://localhost:8080/api/social/instagram/publish', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            titulo: '${post.titulo.replace(/'/g, "\\'")}',
                            chapeu: '${(post.chapeu || '').replace(/'/g, "\\'")}',
                            conteudo: '${post.conteudo.replace(/'/g, "\\'").substring(0, 200)}',
                            imageUrl: '${post.imagemUrl || ''}',
                            legenda: \`${legenda.replace(/'/g, "\\'")}\`
                          })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success || result.ok) {
                          btn.textContent = '✅ Publicado!';
                          btn.style.background = '#28a745';
                          setTimeout(() => {
                            alert('Post publicado com sucesso no Instagram!');
                          }, 500);
                        } else {
                          throw new Error(result.message || 'Erro ao publicar');
                        }
                        
                      } catch (error) {
                        console.error('Erro:', error);
                        btn.textContent = '❌ Erro';
                        btn.style.background = '#dc3545';
                        alert('Erro ao publicar: ' + error.message);
                        
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.background = 'linear-gradient(135deg, #833ab4, #fd1d1d)';
                          btn.disabled = false;
                        }, 2000);
                      }
                    }
                    
                    function copyLegend() {
                      const legendText = document.getElementById('legend-text').textContent;
                      navigator.clipboard.writeText(legendText).then(() => {
                        const btn = event.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copiado!';
                        setTimeout(() => {
                          btn.textContent = originalText;
                        }, 2000);
                      });
                    }
                  </script>
                </body>
              </html>
            `);
          }
        }
      } else {
        throw new Error('Erro na resposta do servidor');
      }
    } catch (error) {
      console.error('Erro ao gerar card:', error);
      alert(`Erro ao gerar ${type} Instagram: ${error.message}`);
    }
  };

  // Filtrar posts
  useEffect(() => {
    let filtered = [...posts];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.subtitulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.chapeu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(post => post.categoria === selectedCategory);
    }

    // Filtro por posição
    if (selectedPosition !== 'todas') {
      filtered = filtered.filter(post => post.posicao === selectedPosition);
    }

    // Filtro por autor
    if (selectedAuthor !== 'todos') {
      filtered = filtered.filter(post => post.autor === selectedAuthor);
    }

    // Ordenação por prioridade (Super Manchete -> Destaque -> Demais) e depois por data
    const sortedFiltered = sortPostsByPriority(filtered, 'date');
    
    setFilteredPosts(sortedFiltered);
  }, [posts, searchTerm, selectedCategory, selectedPosition, selectedAuthor]);

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria?')) {
      try {
        await deletePost(postId);
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        alert('Matéria excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir post:', error);
        alert('Erro ao excluir matéria');
      }
    }
  };

  const createPost = async (payload: any) => {
    try {
      setCreating(true);
      const resp = await fetch('/api/posts?_ts=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Falha ao criar');
      const data = await resp.json().catch(()=>({}));
      console.log('✅ Post criado:', data);
      // Recarregar lista imediatamente (bust cache)
      await loadPosts();
      return data;
    } catch (e:any) {
      console.error('Erro criação post', e);
      throw e;
    } finally {
      setCreating(false);
    }
  };

  // Utilitários
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPositionLabel = (position: string) => {
    const positions = {
      'supermanchete': 'Super Manchete',
      'manchete-principal': 'Manchete Principal',
      'destaque-principal': 'Destaque Principal',
      'destaque-secundario': 'Destaque Secundário',
      'noticia-comum': 'Notícia Comum'
    };
    return positions[position as keyof typeof positions] || position;
  };

  const getPositionColor = (position: string) => {
    const colors = {
      'supermanchete': 'bg-red-100 text-red-800',
      'manchete-principal': 'bg-orange-100 text-orange-800',
      'destaque-principal': 'bg-blue-100 text-blue-800',
      'destaque-secundario': 'bg-green-100 text-green-800',
      'noticia-comum': 'bg-gray-100 text-gray-800'
    };
    return colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Obter valores únicos para filtros
  const uniqueAuthors = Array.from(new Set(posts.map(post => post.autor)));
  const uniqueCategories = Array.from(new Set(posts.map(post => post.categoria)));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciador de Matérias</h1>
          <p className="text-gray-600">Total de {filteredPosts.length} matérias</p>
          <p className="text-xs text-blue-600 mt-1">✨ Ordenação: Super Manchete → Destaque → Demais (por data)</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadPosts}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <Link
          to="/admin/nova-materia"
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Matéria</span>
        </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar matérias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option key="todas" value="todas">Todas as categorias</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Filtro Posição */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option key="todas" value="todas">Todas as posições</option>
            <option key="supermanchete" value="supermanchete">Super Manchete</option>
            <option key="manchete-principal" value="manchete-principal">Manchete Principal</option>
            <option key="destaque-principal" value="destaque-principal">Destaque Principal</option>
            <option key="destaque-secundario" value="destaque-secundario">Destaque Secundário</option>
            <option key="noticia-comum" value="noticia-comum">Notícia Comum</option>
          </select>

          {/* Filtro Autor */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option key="todos" value="todos">Todos os autores</option>
            {uniqueAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Matérias - Layout Tabela Otimizada */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide" style={{width: '60%'}}>
                MATÉRIA
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden sm:table-cell" style={{width: '12%'}}>
                DATA
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide" style={{width: '16%'}}>
                POSIÇÃO
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden md:table-cell" style={{width: '12%'}}>
                CATEGORIA
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredPosts.map((post) => {
              // Definir cor de fundo baseada na posição
              const getRowBackgroundClass = (posicao: string) => {
                const pos = String(posicao).toLowerCase().trim();
                if (pos === 'supermanchete' || pos.includes('super') || pos.includes('manchete')) {
                  return 'bg-red-50 hover:bg-red-100'; // Fundo vermelho claro
                }
                if (pos === 'destaque' || pos.includes('destaque')) {
                  return 'bg-orange-50 hover:bg-orange-100'; // Fundo laranja claro
                }
                return 'hover:bg-gray-50'; // Fundo padrão
              };

              return (
                <tr key={post.id} className={`transition-colors ${getRowBackgroundClass(post.posicao)}`}>
                  {/* Coluna Matéria - 60% da largura */}
                <td className="px-6 py-4" style={{width: '60%'}}>
                  <div className="flex items-start space-x-4">
                    {/* Imagem da matéria */}
                    <div className="flex-shrink-0">
                      {post.imagemUrl ? (
                        <img
                          src={post.imagemUrl}
                          alt={post.titulo}
                          className="w-16 h-16 rounded-lg object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo da matéria */}
                    <div className="flex-1 min-w-0">
                      {/* Primeira linha: Título - Simples sem cores ou animações */}
                      <div className="mb-1">
                        <button
                          onClick={() => window.location.href = `/admin/editar-materia/${post.id}`}
                          className="text-base font-semibold leading-tight text-gray-900 hover:text-gray-700 text-left"
                        >
                          {post.titulo}
                        </button>
                      </div>
                      
                      {/* Segunda linha: Autor e Botões - Mais compacta */}
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          por {post.autor}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleGenerateInstagramCard(post, 'feed')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded hover:from-purple-600 hover:to-pink-600 transition-all"
                            title="Gerar Instagram Feed"
                          >
                            <Instagram className="w-3 h-3 mr-1" />
                            Feed
                          </button>
                          <button
                            onClick={() => handleGenerateInstagramCard(post, 'story')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded hover:from-orange-600 hover:to-red-600 transition-all"
                            title="Gerar Instagram Story"
                          >
                            <Camera className="w-3 h-3 mr-1" />
                            Story
                          </button>
                          <a
                            href={`/post/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center p-1 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200 transition-colors"
                            title="Ver Artigo"
                          >
                            <Eye className="w-3 h-3" />
                          </a>
                          <Link
                            to={`/admin/editar-materia/${post.id}`}
                            className="inline-flex items-center p-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="inline-flex items-center p-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Coluna Data - 12% da largura - Oculta em mobile */}
                <td className="px-3 py-4 text-xs text-gray-600 align-top hidden sm:table-cell" style={{width: '12%'}}>
                  <div className="whitespace-nowrap">
                    {formatDate(post.publishedAt || post.dataPublicacao)}
                  </div>
                </td>

                {/* Coluna Posição - 16% da largura */}
                <td className="px-3 py-4 align-top" style={{width: '16%'}}>
                  {(() => {
                    const badge = getPosicaoBadge(post.posicao);
                    return badge ? (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full border ${badge.className} whitespace-nowrap`}>
                        {badge.text}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                        {post.posicao}
                      </span>
                    );
                  })()}
                </td>

                {/* Coluna Categoria - 12% da largura - Oculta em tablet */}
                <td className="px-3 py-4 align-top hidden md:table-cell" style={{width: '12%'}}>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded whitespace-nowrap">
                    {post.categoria}
                  </span>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>

        {/* Mensagem vazia */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma matéria encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'todas' || selectedPosition !== 'todas' || selectedAuthor !== 'todos'
                ? 'Tente ajustar os filtros para encontrar matérias.'
                : 'Comece criando uma nova matéria.'}
            </p>
            {(!searchTerm && selectedCategory === 'todas' && selectedPosition === 'todas' && selectedAuthor === 'todos') && (
              <div className="mt-6">
                <Link
                  to="/admin/nova-materia"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Matéria
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsManager;
