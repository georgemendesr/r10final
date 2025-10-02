import { API_BASE_URL, get as apiGet, post as apiPost } from './api';
// Tipos e interfaces para autenticação
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'editor' | 'reporter' | 'viewer';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Chaves para armazenamento no localStorage
const AUTH_STORAGE_KEY = 'r10_auth';
const USERS_STORAGE_KEY = 'r10_users';

// Funções auxiliares para localStorage
const loadAuthFromStorage = (): AuthState => {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  return storedAuth 
    ? JSON.parse(storedAuth) 
    : { user: null, isAuthenticated: false };
};

const saveAuthToStorage = (authState: AuthState): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

const loadUsersFromStorage = (): User[] => {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [];
};

const saveUsersToStorage = (users: User[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Gerar ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Gerar token simulado (não usado quando backend disponível)
const generateToken = (): string => Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

// Funções de autenticação
export const login = async (email: string, password: string): Promise<AuthState> => {
  // Tentar backend primeiro
  try {
    console.log('[AuthService] Tentando login no backend...', email);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    console.log('[AuthService] Resposta do servidor:', res.status, res.statusText);
    
    if (res.ok) {
      const data = await res.json();
      console.log('[AuthService] Login bem-sucedido:', data);
      const authState: AuthState = { user: data.user, isAuthenticated: true };
      // Persistir token (fallback Authorization) além dos cookies HttpOnly
      try {
        const raw = localStorage.getItem('r10_auth');
        const cur = raw ? JSON.parse(raw) : {};
        const next = { ...cur, token: data?.token || null, user: data.user, isAuthenticated: true };
        localStorage.setItem('r10_auth', JSON.stringify(next));
      } catch (_) {}
      saveAuthToStorage(authState);
      return authState;
    } else {
      const errorText = await res.text();
      console.error('[AuthService] Erro do servidor:', errorText);
      throw new Error(errorText || 'Erro ao fazer login');
    }
  } catch (error) {
    console.error('[AuthService] Exceção durante login:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (_) {}
  // Limpar estado e token (fallback Authorization)
  const emptyAuthState: AuthState = { user: null, isAuthenticated: false };
  try {
    const raw = localStorage.getItem('r10_auth');
    const cur = raw ? JSON.parse(raw) : {};
    const next = { ...cur, token: null };
    localStorage.setItem('r10_auth', JSON.stringify(next));
  } catch (_) {}
  saveAuthToStorage(emptyAuthState);
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await apiGet<User>(`/auth/me`, { silent401: true });
    const next = { user, isAuthenticated: true } as AuthState;
    saveAuthToStorage(next);
    return user;
  } catch (error: any) {
    // Se erro 401, usuário não está autenticado - limpar storage e retornar null silenciosamente
    if (error?.status === 401 || error?.response?.status === 401) {
      saveAuthToStorage({ user: null, isAuthenticated: false });
      return null;
    }
  }
  // tentar refresh e reconectar usando o cliente central (com Authorization)
  try {
    const r = await apiPost<any>(`/auth/refresh`);
    if (r && r.user) {
      const user = await apiGet<User>(`/auth/me`, { silent401: true });
      const next = { user, isAuthenticated: true } as AuthState;
      saveAuthToStorage(next);
      return user;
    }
  } catch (error: any) {
    // Se refresh também falhar, limpar storage
    if (error?.status === 401 || error?.response?.status === 401) {
      saveAuthToStorage({ user: null, isAuthenticated: false });
    }
  }
  return null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const authState = loadAuthFromStorage();
  return Promise.resolve(authState.isAuthenticated);
};

export const getToken = (): string | null => {
  return null; // não expomos mais token no front (httpOnly cookies)
};

// Gerenciamento de usuários (normalmente seria uma API separada)
export const getUsers = async (): Promise<User[]> => {
  const users = loadUsersFromStorage();
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(users), 300);
  });
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  const users = loadUsersFromStorage();
  
  // Verificar se o email já existe
  if (users.some(user => user.email.toLowerCase() === userData.email.toLowerCase())) {
    return Promise.reject(new Error('Email já está em uso'));
  }
  
  const newUser: User = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsersToStorage(users);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(newUser), 300);
  });
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  const users = loadUsersFromStorage();
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return Promise.resolve(null);
  }
  
  // Verificar se o email já está em uso por outro usuário
  if (userData.email && 
      users.some(user => user.email.toLowerCase() === userData.email!.toLowerCase() && user.id !== id)) {
    return Promise.reject(new Error('Email já está em uso'));
  }
  
  const updatedUser: User = {
    ...users[userIndex],
    ...userData
  };
  
  users[userIndex] = updatedUser;
  saveUsersToStorage(users);
  
  // Atualizar o usuário atual se for o mesmo
  const authState = loadAuthFromStorage();
  if (authState.user && authState.user.id === id) {
    saveAuthToStorage({
      ...authState,
      user: updatedUser
    });
  }
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(updatedUser), 300);
  });
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const users = loadUsersFromStorage();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) {
    return Promise.resolve(false);
  }
  
  saveUsersToStorage(filteredUsers);
  
  // Deslogar se for o usuário atual
  const authState = loadAuthFromStorage();
  if (authState.user && authState.user.id === id) {
    await logout();
  }
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 300);
  });
};

// Adicionar dados iniciais para teste (remover em produção)
export const initializeTestData = () => {
  // Verificar se já existem usuários
  const existingUsers = loadUsersFromStorage();
  if (existingUsers.length > 0) return;

  const testUsers: User[] = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@r10piaui.com",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@r10piaui.com",
      role: "editor",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "Carlos Oliveira",
      email: "carlos@r10piaui.com",
      role: "reporter",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      createdAt: new Date().toISOString()
    }
  ];
  
  saveUsersToStorage(testUsers);
  
  // Não fazer login automático; backend agora pode autenticar
}; 

// Recuperação de senha
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}