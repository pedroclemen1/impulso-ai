import { zodResolver } from '@hookform/resolvers/zod';
import { userCreateSchema, type UserCreateInput } from '@impulso/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, errorMessage } from '@/lib/api';
import type { UserRow } from '@/types/admin';
import { useCohorts } from './hooks';
import { MultiSelect } from './MultiSelect';
import { SimpleSelect } from './SimpleSelect';

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Participante' },
  { value: 'SUPER_ADMIN', label: 'Super administrador' },
];

export function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const cohorts = useCohorts();
  const form = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { name: '', email: '', password: '', role: 'STUDENT', jobTitle: '', department: '', company: '', cohortIds: [] },
  });
  const e = form.formState.errors;
  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);
  const submit = form.handleSubmit(async (v) => {
    try {
      await api.post('/users', v);
      toast.success('Usuário cadastrado', { description: 'Compartilhe a senha inicial com o participante por um canal seguro.' });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['cohorts'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar usuário</DialogTitle>
          <DialogDescription>Não há cadastro público: participantes são cadastrados pela administração.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nome completo" error={e.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail" error={e.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>
            <Field label="Senha inicial" error={e.password?.message} hint="Mín. 8 caracteres, com letras e números">
              <Input type="text" autoComplete="new-password" {...form.register('password')} />
            </Field>
          </div>
          <Field label="Perfil">
            <Controller control={form.control} name="role" render={({ field }) => <SimpleSelect value={field.value} onChange={field.onChange} options={ROLE_OPTIONS} />} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Cargo">
              <Input {...form.register('jobTitle')} />
            </Field>
            <Field label="Departamento">
              <Input {...form.register('department')} />
            </Field>
            <Field label="Empresa">
              <Input {...form.register('company')} />
            </Field>
          </div>
          <div className="space-y-1.5">
            <Label>Turmas</Label>
            <Controller control={form.control} name="cohortIds" render={({ field }) => <MultiSelect options={(cohorts.data ?? []).map((c) => ({ value: c.id, label: c.name }))} value={field.value ?? []} onChange={field.onChange} height={120} />} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({ user, onOpenChange }: { user: UserRow | null; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const cohorts = useCohorts();
  const [v, setV] = useState({ name: '', email: '', role: 'STUDENT', active: true, password: '', jobTitle: '', department: '', company: '', cohortIds: [] as string[] });
  useEffect(() => {
    if (user)
      setV({
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.status === 'ACTIVE',
        password: '',
        jobTitle: user.profile?.jobTitle ?? '',
        department: user.profile?.department ?? '',
        company: user.profile?.company ?? '',
        cohortIds: user.cohorts.map((c) => c.id),
      });
  }, [user]);
  const m = useMutation({
    mutationFn: () =>
      api.patch(`/users/${user!.id}`, {
        name: v.name,
        email: v.email,
        role: v.role,
        status: v.active ? 'ACTIVE' : 'INACTIVE',
        password: v.password || undefined,
        jobTitle: v.jobTitle || null,
        department: v.department || null,
        company: v.company || null,
        cohortIds: v.cohortIds,
      }),
    onSuccess: () => {
      toast.success('Usuário atualizado');
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['participant'] });
      qc.invalidateQueries({ queryKey: ['cohorts'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Desativar a conta encerra imediatamente todas as sessões do usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nome">
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail">
              <Input value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
            </Field>
            <Field label="Perfil">
              <SimpleSelect value={v.role} onChange={(r) => setV({ ...v, role: r })} options={ROLE_OPTIONS} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Cargo">
              <Input value={v.jobTitle} onChange={(e) => setV({ ...v, jobTitle: e.target.value })} />
            </Field>
            <Field label="Departamento">
              <Input value={v.department} onChange={(e) => setV({ ...v, department: e.target.value })} />
            </Field>
            <Field label="Empresa">
              <Input value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} />
            </Field>
          </div>
          <Field label="Nova senha (opcional)" hint="Deixe em branco para manter a senha atual.">
            <Input value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
          </Field>
          <div className="space-y-1.5">
            <Label>Turmas</Label>
            <MultiSelect options={(cohorts.data ?? []).map((c) => ({ value: c.id, label: c.name }))} value={v.cohortIds} onChange={(ids) => setV({ ...v, cohortIds: ids })} height={120} />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={v.active} onCheckedChange={(c) => setV({ ...v, active: c })} /> Conta ativa
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => m.mutate()} loading={m.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImportResult {
  dryRun: boolean;
  totalRows: number;
  created: { line: number; email: string; name: string; temporaryPassword?: string }[];
  errors: { line: number; email?: string; message: string }[];
}

const EXAMPLE_CSV = 'nome,email,cargo,departamento,empresa,turma\nMaria Exemplo,maria.exemplo@empresa.com,Analista de Recrutamento,Recrutamento e Seleção,Empresa Fictícia,';

export function ImportUsersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  useEffect(() => {
    if (open) {
      setCsv('');
      setResult(null);
    }
  }, [open]);
  const m = useMutation({
    mutationFn: (dryRun: boolean) => api.post<ImportResult>('/users/import', { csv, dryRun }),
    onSuccess: (r) => {
      setResult(r);
      if (!r.dryRun) {
        toast.success(`${r.created.length} participante(s) importado(s)`);
        qc.invalidateQueries({ queryKey: ['users'] });
        qc.invalidateQueries({ queryKey: ['cohorts'] });
      }
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const onFile = async (f?: File) => {
    if (!f) return;
    setCsv(await f.text());
    setResult(null);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar participantes (CSV)</DialogTitle>
          <DialogDescription>
            Colunas aceitas: <code>nome, email, cargo, departamento, empresa, turma, senha</code>. Sem senha, uma senha temporária é gerada. A turma deve existir previamente.
          </DialogDescription>
        </DialogHeader>
        {!result || result.dryRun ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <FileUp /> Selecionar arquivo .csv
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCsv(EXAMPLE_CSV)}>
                Inserir exemplo
              </Button>
            </div>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setResult(null);
              }}
              placeholder={EXAMPLE_CSV}
            />
          </div>
        ) : null}
        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{result.totalRows} linha(s)</Badge>
              <Badge variant="success">
                {result.created.length} {result.dryRun ? 'válida(s)' : 'importada(s)'}
              </Badge>
              <Badge variant={result.errors.length ? 'destructive' : 'muted'}>{result.errors.length} erro(s)</Badge>
              {result.dryRun && <Badge variant="outline">Validação — nada foi gravado ainda</Badge>}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((er, i) => (
                      <TableRow key={i}>
                        <TableCell>{er.line}</TableCell>
                        <TableCell>{er.email ?? '—'}</TableCell>
                        <TableCell className="text-destructive">{er.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {!result.dryRun && result.created.some((c) => c.temporaryPassword) && (
              <div className="max-h-56 overflow-y-auto rounded-md border">
                <p className="border-b bg-warning/5 px-3 py-2 text-xs text-warning">Senhas temporárias — copie agora e compartilhe por canal seguro. Elas não serão exibidas novamente.</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Senha temporária</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.created.map((c) => (
                      <TableRow key={c.email}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell className="font-mono text-xs">{c.temporaryPassword ?? '(definida no CSV)'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result && !result.dryRun ? 'Fechar' : 'Cancelar'}
          </Button>
          {(!result || result.dryRun) && (
            <>
              <Button variant="secondary" onClick={() => m.mutate(true)} disabled={!csv.trim()} loading={m.isPending && m.variables === true}>
                Validar
              </Button>
              <Button onClick={() => m.mutate(false)} disabled={!result?.dryRun || !result.created.length} loading={m.isPending && m.variables === false}>
                <Upload /> Importar {result?.dryRun ? `${result.created.length} válida(s)` : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
