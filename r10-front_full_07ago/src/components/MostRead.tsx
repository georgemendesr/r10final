import React, { useEffect, useState, memo } from 'react';
import { getPosts, Post } from '../services/postsService';

const MostRead: React.FC = memo(() => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Busca assíncrona dos posts mais lidos
    async function fetchPosts() {
      try {
        const result = await getPosts({}, 1, 20);
        const list = Array.isArray(result?.posts) ? result.posts : [];
        setPosts(list.slice(0, 5));
      } catch (e) {
        console.error('Erro MostRead:', e);
        setPosts([]);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border-l-4 border-red-500 p-6">
      <div className="flex items-center mb-5">
        <div className="w-2 h-6 bg-red-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-gray-800">Mais Lidas</h2>
      </div>
      
      <div className="space-y-3">
        {posts.map((post, index) => (
          <div key={post.id} className="group">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <a 
                href={`/post/${post.id}`} 
                className="text-gray-700 font-medium leading-tight hover:text-red-600 transition-colors duration-200 group-hover:text-red-600"
              >
                {(post as any).titulo || (post as any).title || ''}
              </a>
            </div>
            {index < posts.length - 1 && <hr className="mt-3 border-red-200" />}
          </div>
        ))}
      </div>
    </div>
  );
});

MostRead.displayName = 'MostRead';

export default MostRead;
