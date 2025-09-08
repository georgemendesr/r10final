import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardHeaderProps {
  notifications?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ notifications = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
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
            
            <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-2 rounded-full">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="font-semibold text-green-800">1247</span>
              </div>
              <span className="text-green-700 text-base">usuários online</span>
            </div>
          </div>

        <div className="flex items-center space-x-4">
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