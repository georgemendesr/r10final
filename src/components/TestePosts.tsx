import React, { useState, useEffect } from 'react';

const TestePosts: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('🔍 Iniciando busca de posts...');
  const response = await fetch('/api/posts?limit=5&admin=1');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Dados recebidos:', data);
        
  const items = Array.isArray(data) ? data : (data.posts || data.items || []);
  setPosts(items);
        setLoading(false);
      } catch (err) {
        console.error('❌ Erro ao buscar posts:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando posts de teste...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Erro: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Posts - {posts.length} encontrados</h1>
      
      {posts.length === 0 ? (
        <p className="text-gray-600">Nenhum post encontrado.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post.id || index} className="border p-4 rounded">
              <h2 className="font-bold text-lg">{post.titulo || 'Sem título'}</h2>
              <p className="text-gray-600">ID: {post.id}</p>
              <p className="text-gray-600">Autor: {post.autor}</p>
              <p className="text-gray-600">Posição: {post.posicao}</p>
              <p className="text-gray-600">Data: {post.data_entrada}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestePosts;
