import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { api, ApiError, setUnauthorizedHandler } from '@/lib/api';
import type { Me } from '@/types';

interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  logout: () => Promise<void>;
  refresh: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api.get<{ user: Me }>('/auth/me')).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    // Expiração de sessão: qualquer 401 limpa o estado e leva ao login.
    setUnauthorizedHandler(() => {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    });
  }, [qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await api.post<{ user: Me }>('/auth/login', { email, password });
      // Mantém a query 'me' (observada por este provider) e descarta o cache de outro usuário.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
      qc.setQueryData(['me'], user);
      return user;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    qc.setQueryData(['me'], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  }, [qc]);

  return (
    <AuthContext.Provider value={{ user: me.data ?? null, loading: me.isLoading, login, logout, refresh: me.refetch }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export const homeFor = (role?: string) => (role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/app/dashboard');
