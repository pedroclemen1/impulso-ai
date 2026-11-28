import { DIFFICULTY_LABELS, type Difficulty } from '@impulso/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, BarChart3, BookOpen, Copy, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CourseStatusBadge, DemoBadge } from '@/components/common/Badges';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { EnrollmentDialog } from '@/features/admin/EnrollmentDialog';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { useDebounce } from '@/hooks/useDebounce';
import { api, errorMessage } from '@/lib/api';
import { cn, coverClass, formatDate } from '@/lib/utils';
import type { CourseRow } from '@/types/admin';

export default function AdminCoursesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [allocate, setAllocate] = useState<string | null>(null);
  const q = useDebounce(search);
  const courses = useQuery({
    queryKey: ['courses', 'list', q, status, page],
    queryFn: () => api.getPage<CourseRow>('/courses', { search: q, status: status || undefined, page, pageSize: 12 }),
  });

  const action = useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: 'duplicate' | 'archive' | 'unarchive' | 'delete' }) => {
      if (kind === 'delete') return api.delete(`/courses/${id}`);
      return api.post<{ id?: string }>(`/courses/${id}/${kind}`);
    },
    onSuccess: (res, v) => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      const msgs = { duplicate: 'Curso duplicado como rascunho', archive: 'Curso arquivado', unarchive: 'Curso restaurado', delete: 'Curso excluído' };
      toast.success(msgs[v.kind]);
      if (v.kind === 'duplicate' && res && typeof res === 'object' && 'id' in res && res.id) navigate(`/admin/courses/${res.id}/edit`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Crie, edite, versione e publique cursos. Cursos publicados são imutáveis: alterações geram uma nova versão."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/courses/generate">
                <Sparkles /> Criar curso com IA
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/courses/new">
                <Plus /> Novo curso
              </Link>
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar curso..."
            className="pl-8"
          />
        </div>
        <SimpleSelect
          className="w-[180px]"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          allLabel="Todos os status"
          options={[
            { value: 'DRAFT', label: 'Rascunho' },
            { value: 'PUBLISHED', label: 'Publicado' },
            { value: 'ARCHIVED', label: 'Arquivado' },
          ]}
        />
      </div>

      {courses.isLoading ? (
        <LoadingState rows={1} />
      ) : courses.error ? (
        <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
      ) : !courses.data?.data.length ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum curso encontrado"
          description="Crie um curso manualmente ou use a IA para gerar uma primeira versão."
          action={
            <Button asChild>
              <Link to="/admin/courses/new">Novo curso</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.data.data.map((c) => (
              <Card key={c.id} className="flex flex-col overflow-hidden">
                <div className={cn('h-2 bg-gradient-to-r', coverClass(c.coverColor))} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <CourseStatusBadge status={c.status} />
                    {c.publishedVersion && <Badge variant="outline">v{c.publishedVersion.versionNumber}</Badge>}
                    {c.hasDraft && c.publishedVersion && <Badge variant="warning">Rascunho pendente</Badge>}
                    {c.generatedByAI && (
                      <Badge variant="secondary">
                        <Sparkles /> IA
                      </Badge>
                    )}
                    {c.isDemo && <DemoBadge />}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/admin/courses/${c.id}/edit`} className="font-semibold leading-snug hover:text-primary">
                      {c.title}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-1 shrink-0" aria-label="Ações do curso">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate(`/admin/courses/${c.id}/edit`)}>
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate(`/admin/courses/${c.id}/analytics`)}>
                          <BarChart3 /> Analytics (ADDIE)
                        </DropdownMenuItem>
                        {c.status === 'PUBLISHED' && (
                          <DropdownMenuItem onSelect={() => setAllocate(c.id)}>
                            <Users /> Alocar participantes
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => action.mutate({ id: c.id, kind: 'duplicate' })}>
                          <Copy /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.status === 'ARCHIVED' ? (
                          <DropdownMenuItem onSelect={() => action.mutate({ id: c.id, kind: 'unarchive' })}>
                            <ArchiveRestore /> Restaurar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => action.mutate({ id: c.id, kind: 'archive' })}>
                            <Archive /> Arquivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{c.moduleCount} módulo(s)</span>
                    {c.estimatedHours ? <span>{c.estimatedHours}h</span> : null}
                    {c.difficulty && <span>{DIFFICULTY_LABELS[c.difficulty as Difficulty]}</span>}
                    <span>Atualizado em {formatDate(c.updatedAt)}</span>
                  </div>
                  <div className="mt-auto space-y-1.5 pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {c.enrollmentCount} alocação(ões) · {c.completedCount} concluída(s)
                      </span>
                      <span className="font-medium">{c.averageProgress === null ? '—' : `${Math.round(c.averageProgress)}%`}</span>
                    </div>
                    <Progress value={c.averageProgress ?? 0} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/admin/courses/${c.id}/edit`}>
                        <Pencil /> Editar
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/admin/courses/${c.id}/analytics`}>
                        <BarChart3 /> Analytics
                      </Link>
                    </Button>
                    {c.enrollmentCount === 0 && (
                      <ConfirmDialog
                        title="Excluir curso?"
                        description="Esta ação é permanente e só é permitida para cursos sem alocações."
                        destructive
                        confirmLabel="Excluir"
                        onConfirm={() => action.mutateAsync({ id: c.id, kind: 'delete' })}
                        trigger={
                          <Button size="sm" variant="ghost" aria-label="Excluir curso">
                            <Trash2 className="text-destructive" />
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={courses.data.meta.page} totalPages={courses.data.meta.totalPages} total={courses.data.meta.total} onChange={setPage} />
        </>
      )}
      <EnrollmentDialog open={!!allocate} onOpenChange={(o) => !o && setAllocate(null)} defaultCourseId={allocate ?? undefined} />
    </div>
  );
}
