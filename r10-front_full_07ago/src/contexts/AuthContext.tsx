import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  login as authLogin, 
  logout as authLogout, 
  getCurrentUser,
  User
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Primeiro verifica se há dados salvos localmente para evitar chamada desnecessária
        const storedAuth = localStorage.getItem('r10_auth');
        
        if (!storedAuth) {
          // Sem dados salvos, assume não autenticado sem fazer chamada
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        const parsedAuth = JSON.parse(storedAuth);
        const hasStoredAuth = parsedAuth?.isAuthenticated;
        
        // Só faz a chamada se houver indicação de que pode estar autenticado
        if (hasStoredAuth) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);
        } else {
          // Dados indicam não autenticado
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Erro silencioso - não loga 401 esperados
        if ((error as any)?.status !== 401) {
          console.error('Erro ao verificar status de autenticação:', error);
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Login chamado, setando isLoading=true');
    setIsLoading(true);
    try {
      console.log('[AuthContext] Chamando authLogin do authService...');
      const authState = await authLogin(email, password);
      console.log('[AuthContext] authLogin retornou:', authState);
      setUser(authState.user);
      setIsAuthenticated(authState.isAuthenticated);
      console.log('[AuthContext] Estado atualizado com sucesso');
    } catch (error) {
      console.error('[AuthContext] Erro ao fazer login:', error);
      throw error;
    } finally {
      console.log('[AuthContext] Finalizando - setando isLoading=false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authLogout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 