import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirecionar se já estiver autenticado
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    console.log('[LoginPage] Iniciando login...', { email });
    
    try {
      console.log('[LoginPage] Chamando login do AuthContext...');
      await login(email, password);
      console.log('[LoginPage] Login concluído, navegando para /admin');
      navigate('/admin');
    } catch (err) {
      console.error('[LoginPage] Erro capturado:', err);
      setError('Email ou senha inválidos. Tente novamente.');
    } finally {
      console.log('[LoginPage] Finalizando - setando isLoading para false');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-red-600 to-red-700 text-white text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/uploads/imagens/logor10.png"
                alt="R10 Piauí - Logo Oficial"
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-red-100 mt-1">Faça login para continuar</p>
          </div>
          
          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/esqueci-minha-senha" className="text-sm text-red-600 hover:text-red-700 font-medium">
                Esqueci minha senha
              </Link>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Para testes, use:
                <br />
                <span className="font-medium">joao@r10piaui.com</span> ou <span className="font-medium">george@r10piaui.com</span>
                <br />
                Senha: <span className="font-medium">admin</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 