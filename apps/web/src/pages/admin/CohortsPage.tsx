import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { EnrollmentDialog } from '@/features/admin/EnrollmentDialog';
import { useCohorts, useStudents } from '@/features/admin/hooks';
import { MultiSelect } from '@/features/admin/MultiSelect';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { CohortSummary } from '@/types/admin';

function CohortDialog({ cohort, open, onOpenChange }: { cohort: CohortSummary | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const students = useStudents();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const detail = useQuery({
    queryKey: ['cohort', cohort?.id],
    queryFn: () => api.get<{ members: { id: string }[] }>(`/cohorts/${cohort!.id}`),
    enabled: open && !!cohort,
  });
  useEffect(() => {
    if (!open) return;
    setName(cohort?.name ?? '');
    setDescription(cohort?.description ?? '');
    setMemberIds([]);
  }, [open, cohort]);
  useEffect(() => {
    if (detail.data) setMemberIds(detail.data.members.map((m) => m.id));
  }, [detail.data]);
  const m = useMutation({
    mutationFn: () => (cohort ? api.patch(`/cohorts/${cohort.id}`, { name, description, memberIds }) : api.post('/cohorts', { name, description, memberIds })),
    onSuccess: () => {
      toast.success(cohort ? 'Turma atualizada' : 'Turma criada');
      qc.invalidateQueries({ queryKey: ['cohorts'] });
      qc.invalidateQueries({ queryKey: ['cohort'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{cohort ? 'Editar turma' : 'Nova turma'}</DialogTitle>
          <DialogDescription>Turmas agrupam participantes para alocação e filtros de indicadores.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Capacitação em IA 2026" />
          </Field>
          <Field label="Descrição">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="space-y-1.5">
            <Label>Membros</Label>
            <MultiSelect options={(students.data ?? []).map((s) => ({ value: s.id, label: s.name, hint: s.profile?.department ?? undefined }))} value={memberIds} onChange={setMemberIds} placeholder="Buscar participante..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => m.mutate()} loading={m.isPending} disabled={name.trim().length < 2 || (!!cohort && detail.isLoading)}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CohortsPage() {
  const qc = useQueryClient();
  const cohorts = useCohorts();
  const [dialog, setDialog] = useState<{ open: boolean; cohort: CohortSummary | null }>({ open: false, cohort: null });
  const [allocate, setAllocate] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/cohorts/${id}`),
    onSuccess: () => {
      toast.success('Turma excluída');
      qc.invalidateQueries({ queryKey: ['cohorts'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div>
      <PageHeader
        title="Turmas"
        description="Organize participantes em turmas e aloque cursos para todos de uma vez."
        actions={
          <Button onClick={() => setDialog({ open: true, cohort: null })}>
            <Plus /> Nova turma
          </Button>
        }
      />
      <QueryState query={cohorts}>
        {(list) =>
          !list.length ? (
            <EmptyState icon={UsersRound} title="Nenhuma turma cadastrada" action={<Button onClick={() => setDialog({ open: true, cohort: null })}>Criar turma</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((c) => (
                <Card key={c.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{c.description || 'Sem descrição'}</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UsersRound className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Membros</div>
                      <div className="font-semibold">{c.memberCount}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Alocações</div>
                      <div className="font-semibold">{c.enrollmentCount}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progresso médio</span>
                      <span className="font-medium">{c.averageProgress === null ? '—' : `${Math.round(c.averageProgress)}%`}</span>
                    </div>
                    <Progress value={c.averageProgress ?? 0} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Criada em {formatDate(c.createdAt)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setAllocate(c.id)} disabled={!c.memberCount}>
                      <GraduationCap /> Alocar curso
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, cohort: c })}>
                      <Pencil /> Editar
                    </Button>
                    <ConfirmDialog
                      title={`Excluir a turma "${c.name}"?`}
                      description="Os participantes e as alocações existentes são mantidos; apenas o agrupamento é removido."
                      destructive
                      confirmLabel="Excluir"
                      onConfirm={() => remove.mutateAsync(c.id)}
                      trigger={
                        <Button size="sm" variant="ghost" aria-label="Excluir turma">
                          <Trash2 className="text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </QueryState>
      <CohortDialog open={dialog.open} cohort={dialog.cohort} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
      <EnrollmentDialog open={!!allocate} onOpenChange={(o) => !o && setAllocate(null)} defaultCohortId={allocate ?? undefined} />
    </div>
  );
}
