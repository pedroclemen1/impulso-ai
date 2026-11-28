import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, profileUpdateSchema, type ProfileUpdateInput } from '@impulso/shared';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Save, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { LevelBadge } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Avatar } from '@/components/ui/misc';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

const passwordForm = changePasswordSchema.extend({ confirm: z.string() }).refine((v) => v.newPassword === v.confirm, { message: 'As senhas não conferem', path: ['confirm'] });

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const p = user?.profile;
  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name ?? '',
      jobTitle: p?.jobTitle ?? '',
      department: p?.department ?? '',
      company: p?.company ?? '',
      professionalContext: p?.professionalContext ?? '',
      learningGoals: p?.learningGoals ?? '',
    },
  });
  const pwd = useForm<z.infer<typeof passwordForm>>({ resolver: zodResolver(passwordForm), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const save = useMutation({
    mutationFn: (v: ProfileUpdateInput) => api.patch('/auth/me', v),
    onSuccess: async () => {
      await refresh();
      toast.success('Perfil atualizado');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const change = useMutation({
    mutationFn: (v: z.infer<typeof passwordForm>) => api.post('/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      pwd.reset();
      toast.success('Senha alterada. As outras sessões foram encerradas.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const err = form.formState.errors;
  return (
    <div className="space-y-6">
      <PageHeader title="Meu perfil" description="Essas informações ajudam o tutor a contextualizar exemplos para a sua realidade." breadcrumbs={[{ label: 'Início', to: '/app/dashboard' }, { label: 'Perfil' }]} />
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar name={user?.name} className="h-14 w-14 text-base" />
        <div className="flex-1">
          <p className="text-lg font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Último acesso: {formatDateTime(user?.lastLoginAt)}</p>
        </div>
        <LevelBadge level={p?.knowledgeLevel} prefix="Nível diagnosticado" />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" /> Dados profissionais
            </CardTitle>
            <CardDescription>Não inclua dados sensíveis. Use descrições gerais da sua função.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" htmlFor="name" error={err.name?.message} className="sm:col-span-2">
                <Input id="name" {...form.register('name')} />
              </Field>
              <Field label="Cargo" htmlFor="jobTitle" error={err.jobTitle?.message}>
                <Input id="jobTitle" {...form.register('jobTitle')} />
              </Field>
              <Field label="Departamento" htmlFor="department" error={err.department?.message}>
                <Input id="department" {...form.register('department')} />
              </Field>
              <Field label="Empresa" htmlFor="company" error={err.company?.message} className="sm:col-span-2">
                <Input id="company" {...form.register('company')} />
              </Field>
              <Field label="Contexto profissional" htmlFor="ctx" hint="Ex.: recrutamento de vagas operacionais em alto volume." error={err.professionalContext?.message} className="sm:col-span-2">
                <Textarea id="ctx" rows={3} {...form.register('professionalContext')} />
              </Field>
              <Field label="Objetivos de aprendizagem" htmlFor="goals" error={err.learningGoals?.message} className="sm:col-span-2">
                <Textarea id="goals" rows={3} {...form.register('learningGoals')} />
              </Field>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" loading={save.isPending}>
                  <Save /> Salvar perfil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> Alterar senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={pwd.handleSubmit((v) => change.mutate(v))} className="space-y-4">
              <Field label="Senha atual" htmlFor="cur" error={pwd.formState.errors.currentPassword?.message}>
                <Input id="cur" type="password" autoComplete="current-password" {...pwd.register('currentPassword')} />
              </Field>
              <Field label="Nova senha" htmlFor="new" hint="Mínimo de 8 caracteres, com letras e números." error={pwd.formState.errors.newPassword?.message}>
                <Input id="new" type="password" autoComplete="new-password" {...pwd.register('newPassword')} />
              </Field>
              <Field label="Confirmar nova senha" htmlFor="conf" error={pwd.formState.errors.confirm?.message}>
                <Input id="conf" type="password" autoComplete="new-password" {...pwd.register('confirm')} />
              </Field>
              <Button type="submit" variant="outline" className="w-full" loading={change.isPending}>
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
