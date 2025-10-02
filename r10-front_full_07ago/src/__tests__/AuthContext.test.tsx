import '@testing-library/jest-dom/vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const authServiceMocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn()
}));

vi.mock('../services/authService', () => ({
  login: authServiceMocks.login,
  logout: authServiceMocks.logout,
  getCurrentUser: authServiceMocks.getCurrentUser,
}));

interface WrapperProps {
  children: ReactNode;
}

const wrapper = ({ children }: WrapperProps) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMocks.getCurrentUser.mockResolvedValue(null);
  });

  it('carrega o usuário atual ao montar', async () => {
    const fakeUser = {
      id: '1',
      name: 'João Silva',
      email: 'joao@r10piaui.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    authServiceMocks.getCurrentUser.mockResolvedValueOnce(fakeUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(authServiceMocks.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('atualiza o estado após login bem-sucedido', async () => {
    const fakeUser = {
      id: '2',
      name: 'Maria Editor',
      email: 'maria@r10piaui.com',
      role: 'editor',
      createdAt: new Date().toISOString(),
    };
    authServiceMocks.login.mockResolvedValueOnce({ user: fakeUser, isAuthenticated: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login(fakeUser.email, 'senha-super-secreta');
    });

    expect(authServiceMocks.login).toHaveBeenCalledWith(fakeUser.email, 'senha-super-secreta');
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('propaga erro e mantém estado quando o login falha', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authServiceMocks.login.mockRejectedValueOnce(new Error('credenciais inválidas'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('joao@r10piaui.com', 'errado');
      })
    ).rejects.toThrow('credenciais inválidas');

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it('efetua logout limpando usuário e estado autenticado', async () => {
    const fakeUser = {
      id: '3',
      name: 'Carlos Reporter',
      email: 'carlos@r10piaui.com',
      role: 'reporter',
      createdAt: new Date().toISOString(),
    };
    authServiceMocks.login.mockResolvedValueOnce({ user: fakeUser, isAuthenticated: true });
    authServiceMocks.logout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login(fakeUser.email, 'senha-valida');
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(authServiceMocks.logout).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
