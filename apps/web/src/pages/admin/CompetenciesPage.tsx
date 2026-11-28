import { zodResolver } from '@hookform/resolvers/zod';
import { competencySchema, type CompetencyInput } from '@impulso/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, errorMessage } from '@/lib/api';
import { formatPct } from '@/lib/utils';
import type { Competency } from '@/types/admin';

interface CompetencyOverview extends Competency {
  lessonCount: number;
  questionCount: number;
  participants: number;
  averageScore: number | null;
  averageInitialScore: number | null;
}

function CompetencyDialog({ value, open, onOpenChange }: { value: Competency | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const form = useForm<CompetencyInput>({ resolver: zodResolver(competencySchema), defaultValues: { key: '', name: '', description: '', category: 'Geral' } });
  useEffect(() => {
    if (open) form.reset(value ? { key: value.key, name: value.name, description: value.description, category: value.category } : { key: '', name: '', description: '', category: 'Geral' });
  }, [open, value, form]);
  const e = form.formState.errors;
  const submit = form.handleSubmit(async (v) => {
    try {
      if (value) await api.patch(`/competencies/${value.id}`, v);
      else await api.post('/competencies', v);
      toast.success(value ? 'Competência atualizada' : 'Competência criada');
      qc.invalidateQueries({ queryKey: ['competencies'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{value ? 'Editar competência' : 'Nova competência'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" error={e.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="Chave (identificador)" error={e.key?.message} hint="Ex.: engenharia_prompts">
              <Input {...form.register('key')} />
            </Field>
          </div>
          <Field label="Categoria">
            <Input {...form.register('category')} />
          </Field>
          <Field label="Descrição">
            <Textarea rows={3} {...form.register('description')} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CompetenciesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['competencies', 'overview'], queryFn: () => api.get<CompetencyOverview[]>('/competencies/overview') });
  const [dialog, setDialog] = useState<{ open: boolean; value: Competency | null }>({ open: false, value: null });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/competencies/${id}`),
    onSuccess: () => {
      toast.success('Competência excluída');
      qc.invalidateQueries({ queryKey: ['competencies'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div>
      <PageHeader
        title="Competências"
        description="Catálogo de competências e domínio médio dos participantes (média ponderada das evidências de atividades e avaliações)."
        actions={
          <Button onClick={() => setDialog({ open: true, value: null })}>
            <Plus /> Nova competência
          </Button>
        }
      />
      <QueryState query={q}>
        {(list) =>
          !list.length ? (
            <EmptyState icon={Target} title="Nenhuma competência cadastrada" />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Aulas</TableHead>
                    <TableHead>Questões</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead className="min-w-[220px]">Domínio médio (inicial → atual)</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <code>{c.key}</code> · {c.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.category}</Badge>
                      </TableCell>
                      <TableCell>{c.lessonCount}</TableCell>
                      <TableCell>{c.questionCount}</TableCell>
                      <TableCell>{c.participants}</TableCell>
                      <TableCell>
                        {c.averageScore === null ? (
                          <span className="text-xs text-muted-foreground">Sem evidências</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs">
                              {formatPct(c.averageInitialScore)} → <strong>{formatPct(c.averageScore)}</strong>
                            </div>
                            <div className="relative h-2 rounded-full bg-muted">
                              <div className="absolute h-2 rounded-full bg-violet-300" style={{ width: `${c.averageInitialScore ?? 0}%` }} />
                              <div className="absolute h-1 translate-y-[2px] rounded-full bg-success" style={{ width: `${c.averageScore}%` }} />
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex">
                          <Button variant="ghost" size="icon" onClick={() => setDialog({ open: true, value: c })} aria-label="Editar">
                            <Pencil />
                          </Button>
                          <ConfirmDialog
                            title={`Excluir "${c.name}"?`}
                            description="Competências em uso por cursos não podem ser excluídas."
                            destructive
                            confirmLabel="Excluir"
                            onConfirm={() => remove.mutateAsync(c.id)}
                            trigger={
                              <Button variant="ghost" size="icon" aria-label="Excluir">
                                <Trash2 className="text-destructive" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        }
      </QueryState>
      <CompetencyDialog open={dialog.open} value={dialog.value} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
    </div>
  );
}
