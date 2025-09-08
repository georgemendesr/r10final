import { useState } from 'react';

interface AdminSocialButtonsProps {
  post: {
    id: string;
    titulo: string;
    chapeu?: string;
    imagemPrincipal?: string;
    categoria?: string;
    subcategorias?: string[];
    dataPublicacao?: string;
  };
  compact?: boolean;
}

export default function AdminSocialButtons({ post, compact = false }: AdminSocialButtonsProps) {
  const [gen, setGen] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'card' | 'story' | 'feed' | null>(null);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>(''); // ✅ ADICIONANDO ESTADO PARA LEGENDA

  async function handleGenerate(type: 'card' | 'story') {
    setLoading(true);
    setLoadingType(type);
    
    try {
      console.log(`🎨 Gerando ${type} para:`, post.titulo);
      
      const response = await fetch('http://localhost:8080/api/social/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          post: {
            id: post.id,
            titulo: post.titulo,
            chapeu: post.chapeu,
            imagemPrincipal: post.imagemPrincipal,
            categoria: post.categoria,
            subcategorias: post.subcategorias,
            dataPublicacao: post.dataPublicacao
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎯 Resultado da geração:', result);
      
      if (result.ok && result.preview) { // ✅ MUDANDO PARA VERIFICAR result.ok
        setGen(result);
        // ✅ CAPTURANDO A LEGENDA GERADA
        if (result.caption) {
          setCaption(result.caption);
          console.log('📝 Legenda capturada:', result.caption.substring(0, 100) + '...');
        }
        console.log('✅ Imagem gerada com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao gerar imagem');
      }
      
    } catch (error) {
      console.error(`❌ Erro ao gerar ${type}:`, error);
      alert(`❌ Erro ao gerar ${type}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  }

  async function handlePublish(type: 'feed' | 'story') {
    if (!gen || !gen.preview) {
      alert('❌ Primeiro gere uma imagem antes de publicar!');
      return;
    }
    
    try {
      setLoading(true);
      setLoadingType(type);
      setPublishResult(null);
      
      console.log('📱 Publicando no Instagram...');
      const result = await socialPublish(type, gen.preview, post);
      
      console.log('✅ Resultado:', result);
      setPublishResult(result.message || '✅ Publicado no Instagram com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao publicar:', error);
      setPublishResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  }

  // Função para publicar no Instagram REAL
  async function socialPublish(type: string, preview: string, postData: any) {
    console.log('📤 [IG] Iniciando publicação real...', { type, postId: postData.id });
    
    // ✅ USAR A LEGENDA EDITÁVEL AO INVÉS DE GERAR UMA NOVA
    const finalCaption = caption || [
      postData.chapeu ? `${postData.chapeu}` : '',
      postData.titulo,
      '',
      '#R10Piaui #Noticias #Piaui #Brasil',
      postData.categoria ? `#${postData.categoria.replace(/\s+/g, '')}` : ''
    ].filter(Boolean).join('\n');

    const response = await fetch('/api/social/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: postData.id,
        title: postData.titulo,
        caption: finalCaption, // ✅ USANDO A LEGENDA EDITÁVEL
        imageUrl: preview // URL da prévia gerada
      })
    });

    const result = await response.json();
    
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Falha ao publicar no Instagram');
    }

    console.log('🎉 [IG] Publicado com sucesso!', result);
    return {
      message: `🎉 Publicado no Instagram! Post ID: ${result.publishedId}`,
      ...result
    };
  }

  // Layout compacto para tabela
  if (compact) {
    return (
      <>
        <div className="flex flex-col gap-1" data-e2e="social-admin">
          <button 
            onClick={() => handleGenerate('card')}
            disabled={loading}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 w-full"
            title="Gerar card para feed"
          >
            {loading && loadingType === 'card' ? '...' : 'CARD'}
          </button>

          <button 
            onClick={() => handleGenerate('story')}
            disabled={loading}
            className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50 w-full"
            title="Gerar story"
          >
            {loading && loadingType === 'story' ? '...' : 'STORY'}
          </button>
          
          <button 
            onClick={() => handlePublish('feed')}
            disabled={!gen || loading}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 w-full"
            title="Publicar no feed do Instagram"
          >
            {loading && loadingType === 'feed' ? '...' : 'PUBLICAR'}
          </button>

          {gen && gen.preview && (
            <div 
              className="w-full h-12 bg-cover bg-center border rounded cursor-pointer mt-1"
              style={{ backgroundImage: `url(${gen.preview})` }}
              onClick={() => window.open(gen.preview, '_blank')}
              title="Ver prévia da imagem"
            />
          )}
        </div>

        {/* ✅ MODAL PARA LAYOUT COMPACTO TAMBÉM */}
        {gen && gen.preview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setGen(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">📱 Instagram - Prévia Gerada</h3>
                  <button 
                    onClick={() => setGen(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={gen.preview} 
                    alt="Prévia gerada"
                    className="w-48 h-48 object-cover rounded-lg border shadow-sm"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <div>📏 <strong>Dimensões:</strong> {gen.width || 1080} x {gen.height || 1080}px</div>
                      <div>🎨 <strong>Formato:</strong> {gen.format || 'PNG'}</div>
                      <div>⏱️ <strong>Gerado:</strong> {new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                
                {/* ✅ LEGENDA EDITÁVEL NO MODAL */}
                {caption && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Legenda para Instagram (editável)
                    </label>
                    <textarea 
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={5}
                      placeholder="Legenda para o Instagram..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {caption.length} caracteres
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handlePublish('feed')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>📤</span>
                    {loading && loadingType === 'feed' ? 'Publicando...' : 'Publicar no Instagram'}
                  </button>
                  
                  <button 
                    onClick={() => setGen(null)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
                
                {publishResult && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    publishResult.includes('❌') 
                      ? 'bg-red-50 border border-red-200 text-red-800' 
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}>
                    <div className="text-sm font-medium">{publishResult}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Layout expandido
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200" data-e2e="social-admin">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          📱 Redes Sociais
        </h3>
        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
          ID: {post.id}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => handleGenerate('card')}
          disabled={loading}
          className="flex flex-col items-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">🎨</div>
          <span className="font-medium">
            {loading && loadingType === 'card' ? 'Gerando...' : 'Gerar Card Feed'}
          </span>
          <span className="text-xs opacity-90 mt-1">1080x1080px</span>
        </button>

        <button 
          onClick={() => handleGenerate('story')}
          disabled={loading}
          className="flex flex-col items-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">📱</div>
          <span className="font-medium">
            {loading && loadingType === 'story' ? 'Gerando...' : 'Gerar Story'}
          </span>
          <span className="text-xs opacity-90 mt-1">1080x1920px</span>
        </button>
      </div>

      {gen && gen.preview && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">✨ Prévia Gerada</h4>
          <div className="flex items-start gap-4">
            <img 
              src={gen.preview} 
              alt="Prévia gerada"
              className="w-32 h-32 object-cover rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.open(gen.preview, '_blank')}
            />
            <div className="flex-1">
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <div>📏 <strong>Dimensões:</strong> {gen.width || 1080} x {gen.height || 1080}px</div>
                <div>🎨 <strong>Formato:</strong> {gen.format || 'PNG'}</div>
                <div>⏱️ <strong>Gerado:</strong> {new Date().toLocaleTimeString()}</div>
              </div>
              
              {/* ✅ SEÇÃO DA LEGENDA GERADA */}
              {caption && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Legenda Gerada (editável)
                  </label>
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={4}
                    placeholder="Legenda para o Instagram..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {caption.length} caracteres
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => handlePublish('feed')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>📤</span>
                {loading && loadingType === 'feed' ? 'Publicando...' : 'Publicar no Instagram'}
              </button>
            </div>
          </div>
        </div>
      )}

      {publishResult && (
        <div className={`p-3 rounded-lg mb-4 ${
          publishResult.includes('❌') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <div className="text-sm font-medium">{publishResult}</div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-amber-800">
          <span>💡</span>
          <span className="text-sm font-medium">Dica:</span>
        </div>
        <p className="text-xs text-amber-700 mt-1">
          Gere primeiro a imagem e depois publique diretamente no Instagram. As imagens são otimizadas automaticamente.
        </p>
      </div>
    </div>
  );
}