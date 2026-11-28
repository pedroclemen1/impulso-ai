import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { homeFor, useAuth } from '@/providers/AuthProvider';

function ErrorLayout({ code, title, text }: { code: string; title: string; text: string }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div>
        <p className="text-6xl font-bold tracking-tight text-primary">{code}</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
      </div>
      <Button asChild>
        <Link to={user ? homeFor(user.role) : '/login'}>Voltar ao início</Link>
      </Button>
    </div>
  );
}

export const NotFoundPage = () => <ErrorLayout code="404" title="Página não encontrada" text="O endereço acessado não existe ou foi removido." />;
export const ForbiddenPage = () => <ErrorLayout code="403" title="Acesso não autorizado" text="Seu perfil não tem permissão para acessar esta área." />;
