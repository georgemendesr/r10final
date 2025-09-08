import React from 'react';
import { TrendingUp, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MostReadWidget = () => {
  const mostReadPosts = [
    {
      id: "1",
      title: "Governador anuncia investimento de R$ 200 milhões em infraestrutura",
      category: "POLÍTICA",
      views: "12.5k",
      timeAgo: "2h"
    },
    {
      id: "2", 
      title: "Nova tecnologia promete revolucionar tratamento oncológico",
      category: "SAÚDE",
      views: "8.3k",
      timeAgo: "4h"
    },
    {
      id: "3",
      title: "Ministério da Saúde amplia campanhas de prevenção ao câncer",
      category: "SAÚDE",
      views: "6.9k",
      timeAgo: "6h"
    },
    {
      id: "4",
      title: "Número de casos de câncer aumenta 20% no último ano",
      category: "SAÚDE",
      views: "5.7k",
      timeAgo: "8h"
    },
    {
      id: "5",
      title: "Educação: novas escolas serão construídas em 15 municípios",
      category: "EDUCAÇÃO",
      views: "4.2k",
      timeAgo: "10h"
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-red-600 text-white p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <h3 className="font-bold text-lg">MAIS LIDAS ✨</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {mostReadPosts.map((post, index) => (
            <Link 
              key={post.id}
              to={`/noticia/${post.category.toLowerCase()}/${post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/${post.id}`}
              className="block hover:bg-gray-50 p-3 rounded-lg transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-500' :
                  'bg-red-600'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-2 group-hover:text-red-600 transition-colors">
                    {post.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="px-2 py-1 bg-red-100 text-red-700 font-semibold uppercase rounded">
                      {post.category}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MostReadWidget;
