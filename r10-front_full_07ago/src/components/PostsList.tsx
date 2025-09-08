import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, Clock, CheckCircle, Edit3, FileText, Search,
  ChevronLeft, ChevronRight, Filter, Edit, Trash2, Share2, 
  Image as ImageIcon, PlayCircle, CheckSquare, ExternalLink
} from 'lucide-react';
import { getPosts, deletePost } from '../services/postsService';
import { Post, PostFilters } from '../types/Post';
import AdminSocialButtons from './AdminSocialButtons';
import { sortPostsByPriority, getPosicaoBadge, filterAndSortPosts } from '../utils/postSorting';

// Tipos necessários que estavam em postsService
export type PostStatus = 'published' | 'draft' | 'scheduled' | 'processing';

export interface PostFilter extends PostFilters {
  status?: PostStatus;
}

const createSlug = (title: string): string => {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

interface PostsListProps {
  initialFilter?: PostFilter;
}

const PostsList: React.FC<PostsListProps> = ({ initialFilter }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PostFilter>(initialFilter || {});
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'title'>('date');
  const postsPerPage = 10;

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const result = await getPosts(filters);
        const fetchedPosts = result.posts || [];
        setAllPosts(fetchedPosts);
        
        // Aplicar filtros e ordenação usando o novo helper
        const filteredAndSorted = filterAndSortPosts(
          fetchedPosts,
          searchTerm,
          filters.categoria,
          sortField
        );
        
        const totalPosts = filteredAndSorted.length;
        setTotalPages(Math.ceil(totalPosts / postsPerPage));
        
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const paginatedPosts = filteredAndSorted.slice(startIndex, endIndex);
        
        setPosts(paginatedPosts);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar matérias');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [filters, currentPage, searchTerm, sortField]);

  const getStats = () => {
    const total = allPosts.length;
    // Como a nova interface Post não tem status, vamos assumir que todos são published
    const published = allPosts.length;
    const draft = 0;
    const scheduled = 0;
    return { total, published, draft, scheduled };
  };

  const stats = getStats();

  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria?')) {
      try {
        await deletePost(postId);
        setPosts(prev => prev.filter(post => post.id !== postId));
        setSelectedPosts(prev => prev.filter(id => id !== postId));
      } catch (err) {
        setError('Erro ao excluir matéria');
        console.error(err);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPosts.length === 0) return;
    
    if (window.confirm(`Tem certeza que deseja excluir ${selectedPosts.length} matérias?`)) {
      try {
        for (const postId of selectedPosts) {
          await deletePost(postId);
        }
        setPosts(prev => prev.filter(post => !selectedPosts.includes(post.id)));
        setSelectedPosts([]);
      } catch (err) {
        setError('Erro ao excluir matérias');
        console.error(err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: PostStatus) => {
    const styles = {
      published: 'bg-green-100 text-green-700 border-green-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };

    const labels = {
      published: 'Publicado',
      draft: 'Rascunho',
      scheduled: 'Agendado',
      processing: 'Processando'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Carregando matérias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Matérias</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: <strong className="text-gray-900">{stats.total}</strong></span>
              <span>Publicadas: <strong className="text-green-600">{stats.published}</strong></span>
              <span>Rascunhos: <strong className="text-gray-600">{stats.draft}</strong></span>
              <span>Agendadas: <strong className="text-blue-600">{stats.scheduled}</strong></span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              ✨ Ordenação: Super Manchete → Destaque → Demais (por {sortField === 'date' ? 'data' : 'título'})
            </div>
          </div>
          <Link
            to="/admin/nova-materia"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Nova Matéria
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por título, categoria ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'date' | 'title')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="date">Por data</option>
              <option value="title">Por título</option>
            </select>
            
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as PostStatus || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
              <option value="scheduled">Agendados</option>
              <option value="processing">Processando</option>
            </select>
            
            <select
              value={filters.categoria || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              <option value="Política">Política</option>
              <option value="Economia">Economia</option>
              <option value="Saúde">Saúde</option>
              <option value="Educação">Educação</option>
              <option value="Esportes">Esportes</option>
              <option value="Cultura">Cultura</option>
              <option value="Segurança">Segurança</option>
              <option value="Geral">Geral</option>
            </select>
          </div>
        </div>

        {selectedPosts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedPosts.length} matéria(s) selecionada(s)
              </span>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Excluir Selecionadas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma matéria encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira matéria.'}
            </p>
            <Link
              to="/admin/nova-materia"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Nova Matéria
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPosts(prev => [...prev, post.id]);
                        } else {
                          setSelectedPosts(prev => prev.filter(id => id !== post.id));
                        }
                      }}
                      className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                  </div>
                  
                  {post.imagemUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.imagemUrl}
                        alt={post.titulo}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {post.titulo}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium text-red-600">{post.categoria}</span>
                          {post.autor && <span>Por {post.autor}</span>}
                          <span>{formatDate(post.dataPublicacao || '')}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Publicado
                          </span>
                          {(() => {
                            const badge = getPosicaoBadge(post.posicao);
                            return badge ? (
                              <span className={`px-2 py-1 text-xs rounded-full border ${badge.className}`}>
                                {badge.text}
                              </span>
                            ) : null;
                          })()}
                        </div>

                        {post.subtitulo && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {post.subtitulo}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/editar-materia/${post.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        
                        <Link
                          to={`/noticia/${createSlug(post.titulo)}`}
                          target="_blank"
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ver no site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <AdminSocialButtons 
                  post={{
                    id: post.id,
                    titulo: post.titulo,
                    chapeu: post.chapeu,
                    imagemPrincipal: post.imagemUrl,
                    categoria: post.categoria,
                    subcategorias: [post.categoria],
                    dataPublicacao: post.dataPublicacao
                  }} 
                  compact={true} 
                />
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg font-medium">
                {currentPage}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <button
          onClick={handleSelectAll}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <CheckSquare className="w-4 h-4" />
          {selectedPosts.length === posts.length ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dispensar
          </button>
        </div>
      )}
    </div>
  );
};

export default PostsList;

