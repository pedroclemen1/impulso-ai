import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '@/providers/AuthProvider';
import type { Role } from '@/types';

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando" />
    </div>
  );
}

/** Proteção de rotas no frontend (o backend também valida perfil e posse de cada recurso). */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

export function RedirectHome() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}
