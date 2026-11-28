import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@impulso/shared';
import { BrainCircuit, Eye, EyeOff, LineChart, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { errorMessage } from '@/lib/api';
import { homeFor, useAuth } from '@/providers/AuthProvider';
import { FullPageLoader } from '@/routes/guards';

const pillars = [
  { icon: BrainCircuit, title: 'Diagnóstico e trilha personalizada', text: 'Identificamos seu nível e adaptamos explicações, exemplos e desafios.' },
  { icon: MessageCircleQuestion, title: 'Tutor socrático', text: 'Perguntas e pistas que desenvolvem seu raciocínio — sem entregar respostas prontas.' },
  { icon: LineChart, title: 'Evolução mensurável', text: 'Acompanhe competências do diagnóstico à avaliação final.' },
  { icon: ShieldCheck, title: 'IA responsável', text: 'LGPD, vieses e supervisão humana em cada atividade.' },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const me = await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      const prefix = me.role === 'SUPER_ADMIN' ? '/admin' : '/app';
      navigate(from?.startsWith(prefix) ? from : homeFor(me.role), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">Inteligência artificial aplicada ao recrutamento, com método.</h1>
            <p className="text-indigo-100">Uma jornada de aprendizagem adaptativa para profissionais de RH: diagnóstico, prática contextualizada, feedback socrático e evolução de competências.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {pillars.map((p) => (
              <li key={p.title} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                <p.icon className="mb-2 h-5 w-5 text-indigo-200" />
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-1 text-xs leading-5 text-indigo-100">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-indigo-200">Plataforma educacional — não realiza decisões automatizadas de contratação.</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground">Acesse com as credenciais fornecidas pela administração.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="E-mail" htmlFor="email" error={form.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" placeholder="voce@empresa.com" aria-invalid={!!form.formState.errors.email} {...form.register('email')} />
            </Field>
            <Field label="Senha" htmlFor="password" error={form.formState.errors.password?.message}>
              <div className="relative">
                <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="pr-10" aria-invalid={!!form.formState.errors.password} {...form.register('password')} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {error && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
              Entrar
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">Não há cadastro público. Participantes são cadastrados ou convidados pela administração.</p>
        </div>
      </section>
    </div>
  );
}
