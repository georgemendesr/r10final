import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Grid, List, Plus, Trash2, Edit, 
  Download, Share2, Eye, Image as ImageIcon, Film, 
  File, Music, Info, X, Upload, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getMediaItems, MediaItem, MediaType, MediaFilter, deleteMediaItem } from '../services/mediaService';

interface MediaGalleryProps {
  initialFilter?: MediaFilter;
  onSelect?: (media: MediaItem) => void;
  selectable?: boolean;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  initialFilter, 
  onSelect, 
  selectable = false 
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MediaFilter>(initialFilter || {});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const itemsPerPage = 12;

  // Carregar itens de mídia
  useEffect(() => {
    const loadMediaItems = async () => {
      setLoading(true);
      try {
        const allItems = await getMediaItems(filters);
        
        // Aplicar paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedItems = allItems.slice(startIndex, startIndex + itemsPerPage);
        
        setMediaItems(paginatedItems);
        setTotalPages(Math.ceil(allItems.length / itemsPerPage));
      } catch (err) {
        setError('Erro ao carregar mídia');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMediaItems();
  }, [filters, currentPage]);

  // Aplicar filtro de busca
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchTerm }));
    setCurrentPage(1);
  };

  // Filtrar por tipo
  const filterByType = (type: MediaType | undefined) => {
    setFilters(prev => ({ ...prev, type }));
    setCurrentPage(1);
  };

  // Selecionar/deselecionar item
  const toggleItemSelection = (itemId: string) => {
    if (selectable && onSelect) {
      // Modo seleção única para uso em outros componentes
      const item = mediaItems.find(item => item.id === itemId);
      if (item) onSelect(item);
      return;
    }

    // Modo seleção múltipla para gerenciamento
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Selecionar/deselecionar todos
  const toggleSelectAll = () => {
    if (selectedItems.length === mediaItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(mediaItems.map(item => item.id));
    }
  };

  // Excluir item
  const handleDelete = async (itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
      try {
        await deleteMediaItem(itemId);
        setMediaItems(prev => prev.filter(item => item.id !== itemId));
        setSelectedItems(prev => prev.filter(id => id !== itemId));
      } catch (err) {
        setError('Erro ao excluir arquivo');
        console.error(err);
      }
    }
  };

  // Excluir selecionados
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Tem certeza que deseja excluir ${selectedItems.length} arquivos?`)) {
      try {
        // Excluir itens em sequência
        for (const itemId of selectedItems) {
          await deleteMediaItem(itemId);
        }
        
        // Atualizar lista
        setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
      } catch (err) {
        setError('Erro ao excluir arquivos');
        console.error(err);
      }
    }
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ícone por tipo de arquivo
  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Film className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'document': return <File className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  // Cor por tipo de arquivo
  const getMediaColor = (type: MediaType) => {
    switch (type) {
      case 'image': return 'bg-blue-100 text-blue-600';
      case 'video': return 'bg-purple-100 text-purple-600';
      case 'audio': return 'bg-green-100 text-green-600';
      case 'document': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Manipular upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadFile(file);
    
    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  // Upload de arquivo
  const handleUpload = async () => {
    // Implementação futura: integração com serviço de upload
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview(null);
  };

  if (loading && mediaItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error && mediaItems.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Mídia</h1>
          <p className="text-gray-600 mt-1">Gerencie imagens, vídeos, áudios e documentos</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => filterByType(undefined)} 
            className={`px-4 py-2 rounded-lg transition-colors ${!filters.type ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => filterByType('image')} 
            className={`px-4 py-2 rounded-lg transition-colors ${filters.type === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <span className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              Imagens
            </span>
          </button>
          <button 
            onClick={() => filterByType('video')} 
            className={`px-4 py-2 rounded-lg transition-colors ${filters.type === 'video' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <span className="flex items-center gap-1">
              <Film className="w-4 h-4" />
              Vídeos
            </span>
          </button>
          <button 
            onClick={() => filterByType('audio')} 
            className={`px-4 py-2 rounded-lg transition-colors ${filters.type === 'audio' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <span className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              Áudios
            </span>
          </button>
          <button 
            onClick={() => filterByType('document')} 
            className={`px-4 py-2 rounded-lg transition-colors ${filters.type === 'document' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <span className="flex items-center gap-1">
              <File className="w-4 h-4" />
              Documentos
            </span>
          </button>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="absolute inset-y-0 right-0 px-3 flex items-center bg-gray-100 rounded-r-lg border-l border-gray-300"
            >
              <Search className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5 text-gray-700" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Ações em lote */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-blue-700">
            <span className="font-bold">{selectedItems.length}</span> arquivos selecionados
          </p>
          <div className="flex space-x-2">
            <button 
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir selecionados
            </button>
            <button 
              onClick={() => setSelectedItems([])}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Visualização em Grade */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhum arquivo encontrado
            </div>
          ) : (
            mediaItems.map(item => (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div 
                  className="aspect-square relative cursor-pointer"
                  onClick={() => toggleItemSelection(item.id)}
                >
                  {/* Thumbnail */}
                  {item.type === 'image' ? (
                    <img 
                      src={item.thumbnailUrl || item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${getMediaColor(item.type)}`}>
                      {getMediaIcon(item.type)}
                    </div>
                  )}
                  
                  {/* Seleção */}
                  {selectedItems.includes(item.id) && (
                    <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500">{formatFileSize(item.fileSize)}</p>
                </div>
                
                <div className="px-3 pb-3 flex justify-between">
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-500 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1 text-gray-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Visualização em Lista */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                    checked={selectedItems.length === mediaItems.length && mediaItems.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviado por</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mediaItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum arquivo encontrado
                  </td>
                </tr>
              ) : (
                mediaItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex-shrink-0 mr-3">
                          {item.type === 'image' ? (
                            <img 
                              src={item.thumbnailUrl || item.url} 
                              alt={item.title} 
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded flex items-center justify-center ${getMediaColor(item.type)}`}>
                              {getMediaIcon(item.type)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">
                            {item.alt || item.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMediaColor(item.type)}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatFileSize(item.fileSize)}</td>
                    <td className="px-4 py-3 text-gray-700">{item.uploadedBy}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-1 text-gray-500 hover:text-gray-700">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-gray-700">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg ${
                  currentPage === page
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Upload de Arquivo</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione um arquivo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {uploadPreview ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={uploadPreview} 
                        alt="Preview" 
                        className="max-h-40 mb-4 rounded"
                      />
                      <p className="text-sm text-gray-500">{uploadFile?.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-500">Arraste um arquivo ou clique para selecionar</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite um título para o arquivo"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto alternativo
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descreva o conteúdo do arquivo (para acessibilidade)"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpload}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={!uploadFile}
              >
                Fazer Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery; 