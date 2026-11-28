import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, GraduationCap, MoreHorizontal, Plus, RotateCcw, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EnrollmentStatusBadge } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/misc';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EnrollmentDialog } from '@/features/admin/EnrollmentDialog';
import { clean, useCohorts, useFilterOptions } from '@/features/admin/hooks';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { useDebounce } from '@/hooks/useDebounce';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPct } from '@/lib/utils';
import type { EnrollmentRow } from '@/types/admin';

export default function EnrollmentsPage() {
  const qc = useQueryClient();
  const opts = useFilterOptions();
  const cohorts = useCohorts();
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [dueEdit, setDueEdit] = useState<{ row: EnrollmentRow; value: string } | null>(null);
  const q = useDebounce(search);
  const params = clean({ search: q, courseId, cohortId, status, page, pageSize: 20 });
  const rows = useQuery({ queryKey: ['enrollments', params], queryFn: () => api.getPage<EnrollmentRow>('/enrollments', params) });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/enrollments/${id}`, body),
    onSuccess: () => {
      toast.success('Alocação atualizada');
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      setDueEdit(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Alocações"
        description="Atribua cursos individualmente, para vários participantes ou para turmas inteiras. Alocações duplicadas na mesma versão são evitadas automaticamente."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nova alocação
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Buscar participante" className="pl-8" />
        </div>
        <SimpleSelect className="w-[230px]" value={courseId} onChange={reset(setCourseId)} allLabel="Todos os cursos" options={(opts.data?.courses ?? []).map((c) => ({ value: c.id, label: c.title }))} />
        <SimpleSelect className="w-[210px]" value={cohortId} onChange={reset(setCohortId)} allLabel="Todas as turmas" options={(cohorts.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        <SimpleSelect
          className="w-[170px]"
          value={status}
          onChange={reset(setStatus)}
          allLabel="Todos os status"
          options={[
            { value: 'NOT_STARTED', label: 'Não iniciado' },
            { value: 'IN_PROGRESS', label: 'Em andamento' },
            { value: 'COMPLETED', label: 'Concluído' },
            { value: 'CANCELLED', label: 'Cancelado' },
          ]}
        />
      </div>
      <Card>
        {rows.error ? (
          <ErrorState error={rows.error} onRetry={() => rows.refetch()} className="m-4" />
        ) : rows.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !rows.data?.data.length ? (
          <EmptyState icon={GraduationCap} title="Nenhuma alocação encontrada" className="m-4" action={<Button onClick={() => setCreateOpen(true)}>Nova alocação</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[140px]">Progresso</TableHead>
                <TableHead>Diagn. → Final</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Conclusão</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.data.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/admin/users/${r.user.id}`} className="font-medium hover:text-primary">
                      {r.user.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{r.user.profile?.jobTitle ?? r.user.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.course.title} <Badge variant="outline">v{r.courseVersion.versionNumber}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.cohort?.name ?? '—'}</TableCell>
                  <TableCell>
                    <EnrollmentStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.progressPercent} className="w-20" />
                      <span className="text-xs">{Math.round(r.progressPercent)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatPct(r.initialScore)} → {formatPct(r.finalScore)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{formatDate(r.startDate)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{r.dueDate ? formatDate(r.dueDate) : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{r.completedAt ? formatDate(r.completedAt) : '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações da alocação">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setDueEdit({ row: r, value: r.dueDate ? r.dueDate.slice(0, 10) : '' })}>
                          <CalendarClock /> Alterar prazo
                        </DropdownMenuItem>
                        {r.status === 'CANCELLED' ? (
                          <DropdownMenuItem onSelect={() => patch.mutate({ id: r.id, body: { cancelled: false } })}>
                            <RotateCcw /> Reativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => patch.mutate({ id: r.id, body: { cancelled: true } })} className="text-destructive">
                            <XCircle /> Cancelar alocação
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {rows.data && <Pagination page={rows.data.meta.page} totalPages={rows.data.meta.totalPages} total={rows.data.meta.total} onChange={setPage} />}
      <EnrollmentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <Dialog open={!!dueEdit} onOpenChange={(o) => !o && setDueEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar prazo</DialogTitle>
          </DialogHeader>
          <Field label="Prazo" hint="Deixe em branco para remover o prazo.">
            <Input type="date" value={dueEdit?.value ?? ''} onChange={(e) => dueEdit && setDueEdit({ ...dueEdit, value: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDueEdit(null)}>
              Cancelar
            </Button>
            <Button
              loading={patch.isPending}
              onClick={() => dueEdit && patch.mutate({ id: dueEdit.row.id, body: { dueDate: dueEdit.value ? new Date(`${dueEdit.value}T23:59:59`).toISOString() : null } })}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
