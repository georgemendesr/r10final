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
  token: string | null;
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
    : { user: null, token: null, isAuthenticated: false };
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

// Gerar token simulado
const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + 
         Math.random().toString(36).substring(2) + 
         Math.random().toString(36).substring(2);
};

// Funções de autenticação
export const login = async (email: string, password: string): Promise<AuthState> => {
  // Em uma implementação real, validaríamos as credenciais no servidor
  // Para simulação, verificamos os usuários no localStorage
  const users = loadUsersFromStorage();
  
  // Simulando verificação de senha (em produção, usaríamos bcrypt ou similar)
  // Aqui, qualquer senha funciona para usuários existentes
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return Promise.reject(new Error('Usuário não encontrado'));
  }
  
  // Criar estado de autenticação
  const authState: AuthState = {
    user,
    token: generateToken(),
    isAuthenticated: true
  };
  
  // Salvar no localStorage
  saveAuthToStorage(authState);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(authState), 500);
  });
};

export const logout = async (): Promise<void> => {
  // Limpar estado de autenticação
  const emptyAuthState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false
  };
  
  saveAuthToStorage(emptyAuthState);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(), 300);
  });
};

export const getCurrentUser = async (): Promise<User | null> => {
  const authState = loadAuthFromStorage();
  return Promise.resolve(authState.user);
};

export const isAuthenticated = async (): Promise<boolean> => {
  const authState = loadAuthFromStorage();
  return Promise.resolve(authState.isAuthenticated);
};

export const getToken = (): string | null => {
  const authState = loadAuthFromStorage();
  return authState.token;
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
  
  // Fazer login automático com o usuário admin para testes
  const authState: AuthState = {
    user: testUsers[0],
    token: generateToken(),
    isAuthenticated: true
  };
  
  saveAuthToStorage(authState);
}; 