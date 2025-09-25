import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Home, ExternalLink, Eye, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardHeaderProps {
  notifications?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ notifications = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showQuickNav, setShowQuickNav] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowQuickNav(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
      <div className="max-w-[1250px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Bom dia, {user?.name.split(' ')[0] || 'João'}! 👋
              </h2>
              <p className="text-gray-600 mt-1">Aqui está o resumo das suas atividades</p>
            </div>
            
            {/* Removido: chip de usuários online estático */}
          </div>

        <div className="flex items-center space-x-4">
          {/* Links Rápidos */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                title="Ver Site Principal"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Site</span>
                <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              </a>
              
              <div className="w-px h-6 bg-gray-200"></div>

              <button
                onClick={() => setShowQuickNav(!showQuickNav)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                title="Mais Links"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showQuickNav ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Menu Dropdown */}
            {showQuickNav && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                <div className="p-2">
                  <a
                    href="/admin/nova-materia"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Nova Matéria</span>
                  </a>
                  
                  <a
                    href="/"
                    target="_blank"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm">Homepage</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                  
                  <a
                    href="/admin"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Dashboard</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-2 border border-gray-200">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
              alt="Avatar" 
              className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
            />
            <div>
              <p className="font-semibold text-gray-900 text-base">{user?.name || 'Usuário'}</p>
              <p className="text-sm text-gray-500">{user?.role === 'admin' ? 'Administrador' : 
                                                  user?.role === 'editor' ? 'Editor' : 
                                                  user?.role === 'reporter' ? 'Repórter' : 'Usuário'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 flex items-center space-x-2"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader; 