import React, { useState } from 'react';
import { type Banner } from '../services/bannersApi';
import * as bannersApi from '../services/bannersApi';
import { Upload, Image, Code, X } from 'lucide-react';

interface BannerFormProps {
  banner?: Banner;
  onSave: (banner: Banner) => void;
  onCancel: () => void;
}

const BannerForm: React.FC<BannerFormProps> = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    titulo: banner?.titulo || '',
    cliente: banner?.cliente || '',
    imagem: banner?.imagem || '',
    link: banner?.link || '',
    posicao: banner?.posicao || 'top-strip' as Banner['posicao'],
    tipo: banner?.tipo || 'imagem' as Banner['tipo'],
    tamanho: banner?.tamanho || '300x250' as Banner['tamanho'],
    status: banner?.status || 'ativo' as Banner['status'],
    dataInicio: banner?.dataInicio?.split('T')[0] || new Date().toISOString().split('T')[0],
    dataFim: banner?.dataFim?.split('T')[0] || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    impressoesMax: banner?.impressoesMax || '',
    cliquesMax: banner?.cliquesMax || '',
    cpm: banner?.cpm || '',
    cpc: banner?.cpc || '',
    valorTotal: banner?.valorTotal || '',
    prioridade: banner?.prioridade || 1 as Banner['prioridade'],
    conteudoHtml: banner?.conteudoHtml || '',
    observacoes: banner?.observacoes || ''
  });

  const [imagePreview, setImagePreview] = useState<string>(banner?.imagem || '');
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
  const imageUrl = await bannersApi.uploadImage(file);
      setFormData(prev => ({ ...prev, imagem: imageUrl }));
      setImagePreview(imageUrl);
    } catch (error) {
      alert('Erro ao fazer upload da imagem: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bannerData = {
      ...formData,
      dataInicio: new Date(formData.dataInicio).toISOString(),
      dataFim: new Date(formData.dataFim).toISOString(),
      impressoesMax: formData.impressoesMax ? Number(formData.impressoesMax) : undefined,
      cliquesMax: formData.cliquesMax ? Number(formData.cliquesMax) : undefined,
      cpm: formData.cpm ? Number(formData.cpm) : undefined,
      cpc: formData.cpc ? Number(formData.cpc) : undefined,
      valorTotal: formData.valorTotal ? Number(formData.valorTotal) : undefined,
    };

    (async () => {
      if (banner) {
        const updated = await bannersApi.updateBanner(banner.id, bannerData as any);
        onSave(updated);
      } else {
        const created = await bannersApi.createBanner(bannerData as any);
        onSave(created);
      }
    })();
  };

  const positions = bannersApi.getAvailablePositions();
  const sizes = bannersApi.getStandardSizes();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {banner ? 'Editar Banner' : 'Novo Banner'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Banner *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posição *
                </label>
                <select
                  name="posicao"
                  value={formData.posicao}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label} - {pos.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    name="dataInicio"
                    value={formData.dataInicio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    name="dataFim"
                    value={formData.dataFim}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Banner *
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="imagem">Imagem</option>
                  <option value="gif">GIF Animado</option>
                  <option value="html">HTML/AdSense</option>
                  <option value="video">Vídeo</option>
                </select>
              </div>
            </div>
            {/* Conteúdo do Banner */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Conteúdo</h3>
              {(formData.tipo === 'imagem' || formData.tipo === 'gif' || formData.tipo === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload de Arquivo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {imagePreview ? (
                      <div className="text-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 mx-auto mb-2 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, imagem: '' }));
                          }}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remover arquivo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-sm text-gray-600">
                            {uploading ? 'Carregando...' : 'Clique para fazer upload'}
                          </span>
                          <input
                            type="file"
                            accept={formData.tipo === 'video' ? 'video/*' : 'image/*'}
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link de Destino
                    </label>
                    <input
                      type="url"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="https://"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}
              {formData.tipo === 'html' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código HTML/AdSense
                  </label>
                  <textarea
                    name="conteudoHtml"
                    value={formData.conteudoHtml}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder="Cole aqui o código do Google AdSense ou HTML personalizado..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para Google AdSense, cole o código completo incluindo as tags &lt;ins&gt; e &lt;script&gt;
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Botões */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {banner ? 'Atualizar' : 'Criar'} Banner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm; 