import React from 'react';
import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const RelatedWidget = () => {
  const relatedPosts = [
    {
      id: "2",
      title: "Ministério da Saúde amplia campanhas de prevenção ao câncer",
      category: "SAÚDE"
    },
    {
      id: "3", 
      title: "Número de casos de câncer aumenta 20% no último ano",
      category: "SAÚDE"
    },
    {
      id: "4",
      title: "Nova tecnologia promete revolucionar tratamento oncológico",
      category: "TECNOLOGIA"
    },
    {
      id: "5",
      title: "Especialistas alertam para importância da detecção precoce",
      category: "SAÚDE"
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="bg-blue-600 text-white p-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <h3 className="font-bold">RELACIONADAS</h3>
        </div>
      </div>

      <div className="p-3">
        <div className="space-y-3">
          {relatedPosts.map((post) => (
            <Link 
              key={post.id}
              to={`/noticia/${post.category.toLowerCase()}/${post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/${post.id}`}
              className="block hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <div>
                <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1 hover:text-blue-600 transition-colors">
                  {post.title}
                </h4>
                <span className="text-xs text-blue-600 font-semibold uppercase">
                  {post.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelatedWidget;