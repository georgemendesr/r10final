import React, { useState, useEffect } from 'react';
import { fetchPostsArray } from '../services/postsService';

const SimplePostsTest: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testFetch = async () => {
      try {
        console.log('🧪 Testando fetchPostsArray...');
        const result = await fetchPostsArray({ page: 1, limit: 3 });
        console.log('✅ Result:', result);
        setPosts(result);
      } catch (err) {
        console.error('❌ Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    testFetch();
  }, []);

  if (loading) return <div className="p-4">🔄 Carregando...</div>;
  if (error) return <div className="p-4 text-red-600">❌ Erro: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">✅ Posts Carregados: {posts.length}</h2>
      {posts.map((post, index) => (
        <div key={post.id || index} className="border p-2 mb-2">
          <h3 className="font-bold">{post.titulo}</h3>
          <p className="text-sm text-gray-600">{post.subtitulo}</p>
          <p className="text-xs">Posição: {post.posicao} | Autor: {post.autor}</p>
        </div>
      ))}
    </div>
  );
};

export default SimplePostsTest;
