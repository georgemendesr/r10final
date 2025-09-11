import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

const AdminLink = () => {
  return (
    <Link 
      to="/admin" 
      className="fixed bottom-6 right-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-50 group"
      title="Acessar Painel Administrativo"
    >
      <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
    </Link>
  );
};

export default AdminLink; 