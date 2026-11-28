import type { CourseMetaInput } from '@impulso/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowDown, ArrowUp, BarChart3, BookOpen, ClipboardList, Compass, FileText, FolderOpen, GitBranch, ListChecks, Plus, Rocket, Smile, Sparkles, Target } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CourseStatusBadge } from '@/components/common/Badges';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CourseMetaForm, emptyCourseMeta } from '@/features/admin/CourseMetaForm';
import { AssessmentEditor } from '@/features/admin/editor/AssessmentEditor';
import { GenerateModuleDialog } from '@/features/admin/editor/GenerateModuleDialog';
import { LessonEditor } from '@/features/admin/editor/LessonEditor';
import { AddieEditor, ModuleEditor } from '@/features/admin/editor/ModuleEditor';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { api, ApiError, errorMessage } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import type { CourseDetail, VersionTree } from '@/types/admin';

type EditorNode =
  | { type: 'course' }
  | { type: 'addie' }
  | { type: 'assessment'; kind: 'DIAGNOSTIC' | 'FINAL' | 'SATISFACTION' }
  | { type: 'module'; id: string }
  | { type: 'lesson'; id: string }
  | { type: 'quiz'; moduleId: string };

const same = (a: EditorNode, b: EditorNode) => JSON.stringify(a) === JSON.stringify(b);

function TreeItem({ active, onClick, icon, children, actions, indent = 0, muted }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode; actions?: ReactNode; indent?: number; muted?: boolean }) {
  return (
    <div className={cn('group flex items-center gap-1 rounded-md pr-1', active ? 'bg-primary/10 text-primary' : 'hover:bg-muted')} style={{ paddingLeft: 6 + indent * 14 }}>
      <button type="button" onClick={onClick} className={cn('flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm', muted && !active && 'text-muted-foreground')}>
        <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <span className="truncate">{children}</span>
      </button>
      {actions && <div className="flex shrink-0 opacity-70 group-hover:opacity-100">{actions}</div>}
    </div>
  );
}

const metaFromVersion = (v: VersionTree, coverColor: string): CourseMetaInput => ({
  ...emptyCourseMeta,
  title: v.title,
  description: v.description,
  objectives: v.objectives ?? [],
  targetAudience: v.targetAudience,
  prerequisites: v.prerequisites,
  difficulty: v.difficulty,
  estimatedHours: v.estimatedHours,
  coverColor,
  coverImageUrl: v.coverImageUrl ?? '',
  competencyIds: v.competencies.map((c) => c.competencyId),
  completionCriteria: { ...emptyCourseMeta.completionCriteria!, ...v.completionCriteria },
});

export default function CourseEditorPage() {
  const { courseId = '' } = useParams();
  const qc = useQueryClient();
  const [versionId, setVersionId] = useState<string | undefined>();
  const [node, setNode] = useState<EditorNode>({ type: 'course' });
  const [genOpen, setGenOpen] = useState(false);
  const detail = useQuery({
    queryKey: ['course', courseId, versionId],
    queryFn: () => api.get<CourseDetail>(`/courses/${courseId}`, { versionId }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['course', courseId] });

  const mutate = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const publish = useMutation({
    mutationFn: () => api.post<{ versionNumber: number }>(`/courses/${courseId}/publish`),
    onSuccess: (v) => {
      toast.success(`Versão ${v.versionNumber} publicada`, { description: 'Já pode ser alocada aos participantes.' });
      setVersionId(undefined);
      invalidate();
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (e) => {
      const issues = e instanceof ApiError ? (e.details as { issues?: string[] })?.issues : undefined;
      toast.error(e instanceof ApiError ? e.message : 'Falha ao publicar', { description: issues?.join(' • ') });
    },
  });
  const newVersion = useMutation({
    mutationFn: () => api.post<{ versionNumber: number }>(`/courses/${courseId}/versions`),
    onSuccess: (v) => {
      toast.success(`Rascunho da versão ${v.versionNumber} criado`, { description: 'As versões publicadas e as tentativas já realizadas permanecem intactas.' });
      setVersionId(undefined);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <QueryState query={detail}>
      {(d) => {
        const v = d.version;
        const disabled = !d.editable;
        const assessment = (kind: string, moduleId?: string) => v.assessments.find((a) => a.kind === kind && (kind !== 'MODULE_QUIZ' || a.moduleId === moduleId)) ?? null;
        const allLessons = v.modules.flatMap((m) => m.lessons);
        const firstLesson = allLessons[0];

        const addModule = () =>
          mutate.mutate(async () => {
            const mod = await api.post<{ id: string }>(`/courses/${courseId}/modules`, { title: `Módulo ${v.modules.length + 1}`, description: '', objectives: [] });
            await invalidate();
            setNode({ type: 'module', id: mod.id });
            toast.success('Módulo adicionado');
          });
        const addLesson = (moduleId: string) =>
          mutate.mutate(async () => {
            const l = await api.post<{ id: string }>(`/courses/${courseId}/modules/${moduleId}/lessons`, {
              title: 'Nova aula',
              learnContent: '## Nova aula\n\nEscreva aqui o conteúdo teórico da aula.',
              summary: '',
              estimatedMinutes: 15,
              contextContent: '',
              resources: [],
              reflectionPrompt: '',
              keyTakeaways: [],
              competencies: [],
            });
            await invalidate();
            setNode({ type: 'lesson', id: l.id });
            toast.success('Aula adicionada');
          });
        const reorderModules = (i: number, dir: -1 | 1) =>
          mutate.mutate(async () => {
            const ids = v.modules.map((m) => m.id);
            [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
            await api.post(`/courses/${courseId}/modules/reorder`, { orderedIds: ids });
            await invalidate();
          });
        const reorderLessons = (moduleId: string, i: number, dir: -1 | 1) =>
          mutate.mutate(async () => {
            const ids = v.modules.find((m) => m.id === moduleId)!.lessons.map((l) => l.id);
            [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
            await api.post(`/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { orderedIds: ids });
            await invalidate();
          });

        const arrow = (onClick: () => void, dir: 'up' | 'down', dis: boolean) =>
          !disabled && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={dis || mutate.isPending} onClick={onClick} aria-label={dir === 'up' ? 'Mover para cima' : 'Mover para baixo'}>
              {dir === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </Button>
          );

        let panel: ReactNode = null;
        if (node.type === 'course') panel = <CourseMetaForm key={v.id} defaultValues={metaFromVersion(v, d.course.coverColor)} disabled={disabled} submitLabel="Salvar informações" onSubmit={async (meta) => {
          try {
            await api.patch(`/courses/${courseId}`, { ...meta, coverImageUrl: meta.coverImageUrl || null });
            toast.success('Informações salvas', { description: 'Rascunho salvo.' });
            invalidate();
            qc.invalidateQueries({ queryKey: ['courses'] });
          } catch (e) {
            toast.error(errorMessage(e));
          }
        }} />;
        if (node.type === 'addie') panel = <AddieEditor courseId={courseId} version={v} disabled={disabled} />;
        if (node.type === 'assessment') {
          const titles = { DIAGNOSTIC: 'Diagnóstico inicial', FINAL: 'Avaliação final', SATISFACTION: 'Pesquisa de satisfação' };
          panel = <AssessmentEditor courseId={courseId} kind={node.kind} assessment={assessment(node.kind)} disabled={disabled} defaultTitle={titles[node.kind]} />;
        }
        if (node.type === 'module') {
          const m = v.modules.find((x) => x.id === node.id);
          panel = m ? <ModuleEditor courseId={courseId} module={m} disabled={disabled} onDeleted={() => setNode({ type: 'course' })} /> : null;
        }
        if (node.type === 'quiz') {
          const m = v.modules.find((x) => x.id === node.moduleId);
          panel = m ? <AssessmentEditor courseId={courseId} kind="MODULE_QUIZ" moduleId={m.id} assessment={assessment('MODULE_QUIZ', m.id)} disabled={disabled} defaultTitle={`Avaliação do módulo: ${m.title}`} /> : null;
        }
        if (node.type === 'lesson') {
          const l = allLessons.find((x) => x.id === node.id);
          panel = l ? <LessonEditor courseId={courseId} lesson={l} disabled={disabled} onDeleted={() => setNode({ type: 'course' })} /> : null;
        }
        if (!panel) panel = <p className="text-sm text-muted-foreground">Selecione um item na estrutura do curso.</p>;

        return (
          <div>
            <PageHeader
              title={v.title}
              breadcrumbs={[{ label: 'Cursos', to: '/admin/courses' }, { label: d.course.title }, { label: 'Editor' }]}
              description={
                <span className="flex flex-wrap items-center gap-2">
                  <CourseStatusBadge status={d.course.status} />
                  <Badge variant={v.status === 'DRAFT' ? 'warning' : v.status === 'PUBLISHED' ? 'success' : 'muted'}>
                    Versão {v.versionNumber} · {v.status === 'DRAFT' ? 'rascunho' : v.status === 'PUBLISHED' ? `publicada em ${formatDate(v.publishedAt)}` : 'substituída'}
                  </Badge>
                  {d.course.generatedByAI && (
                    <Badge variant="secondary">
                      <Sparkles /> Gerado com IA
                    </Badge>
                  )}
                </span>
              }
              actions={
                <>
                  {d.versions.length > 1 && (
                    <SimpleSelect
                      className="w-[220px]"
                      value={versionId ?? v.id}
                      onChange={(id) => setVersionId(id || undefined)}
                      options={d.versions.map((x) => ({ value: x.id, label: `v${x.versionNumber} · ${x.status === 'DRAFT' ? 'rascunho' : x.status === 'PUBLISHED' ? 'publicada' : 'substituída'} (${x.enrollmentCount} alocações)` }))}
                      ariaLabel="Versão"
                    />
                  )}
                  <Button variant="outline" asChild>
                    <Link to={`/admin/courses/${courseId}/analytics`}>
                      <BarChart3 /> Analytics
                    </Link>
                  </Button>
                  {firstLesson && (
                    <Button variant="outline" asChild>
                      <Link to={`/admin/courses/${courseId}/preview/${node.type === 'lesson' ? node.id : firstLesson.id}`}>Visualizar como estudante</Link>
                    </Button>
                  )}
                  {d.editable ? (
                    <ConfirmDialog
                      title={`Publicar versão ${v.versionNumber}?`}
                      description="A versão publicada se torna imutável e pode ser alocada. Alterações futuras exigirão uma nova versão; tentativas já realizadas nunca são alteradas."
                      confirmLabel="Publicar"
                      onConfirm={() => publish.mutateAsync().catch(() => undefined)}
                      trigger={
                        <Button disabled={d.publishIssues.length > 0}>
                          <Rocket /> Publicar
                        </Button>
                      }
                    />
                  ) : (
                    d.course.status !== 'ARCHIVED' &&
                    !d.versions.some((x) => x.status === 'DRAFT') && (
                      <Button onClick={() => newVersion.mutate()} loading={newVersion.isPending}>
                        <GitBranch /> Criar nova versão para editar
                      </Button>
                    )
                  )}
                  {!d.editable && d.versions.some((x) => x.status === 'DRAFT') && versionId && (
                    <Button onClick={() => setVersionId(undefined)}>Abrir rascunho</Button>
                  )}
                </>
              }
            />

            {disabled && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Esta versão está em modo somente leitura. {v.status !== 'DRAFT' ? 'Versões publicadas são imutáveis para preservar a integridade das tentativas e avaliações já realizadas.' : 'Cursos arquivados não podem ser editados.'}
              </div>
            )}
            {d.editable && d.publishIssues.length > 0 && (
              <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                <p className="mb-1 font-medium text-warning">Pendências para publicação</p>
                <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                  {d.publishIssues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <Card className="h-fit p-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                <p className="px-2 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Estrutura do curso</p>
                <TreeItem active={same(node, { type: 'course' })} onClick={() => setNode({ type: 'course' })} icon={<BookOpen />}>
                  Visão geral do curso
                </TreeItem>
                <TreeItem active={same(node, { type: 'addie' })} onClick={() => setNode({ type: 'addie' })} icon={<Compass />}>
                  Metodologia ADDIE
                </TreeItem>
                <TreeItem active={same(node, { type: 'assessment', kind: 'DIAGNOSTIC' })} onClick={() => setNode({ type: 'assessment', kind: 'DIAGNOSTIC' })} icon={<Target />} muted={!assessment('DIAGNOSTIC')}>
                  Diagnóstico inicial {assessment('DIAGNOSTIC') ? `(${assessment('DIAGNOSTIC')!.questions.length})` : ''}
                </TreeItem>
                <div className="my-1 border-t" />
                {v.modules.map((m, mi) => (
                  <div key={m.id}>
                    <TreeItem
                      active={same(node, { type: 'module', id: m.id })}
                      onClick={() => setNode({ type: 'module', id: m.id })}
                      icon={<FolderOpen />}
                      actions={
                        <>
                          {arrow(() => reorderModules(mi, -1), 'up', mi === 0)}
                          {arrow(() => reorderModules(mi, 1), 'down', mi === v.modules.length - 1)}
                        </>
                      }
                    >
                      <span className="font-medium">
                        {m.order}. {m.title}
                      </span>
                    </TreeItem>
                    {m.lessons.map((l, li) => (
                      <TreeItem
                        key={l.id}
                        indent={1}
                        active={same(node, { type: 'lesson', id: l.id })}
                        onClick={() => setNode({ type: 'lesson', id: l.id })}
                        icon={l.activity ? <ListChecks /> : <FileText />}
                        actions={
                          <>
                            {arrow(() => reorderLessons(m.id, li, -1), 'up', li === 0)}
                            {arrow(() => reorderLessons(m.id, li, 1), 'down', li === m.lessons.length - 1)}
                          </>
                        }
                      >
                        {l.title}
                      </TreeItem>
                    ))}
                    <TreeItem indent={1} active={same(node, { type: 'quiz', moduleId: m.id })} onClick={() => setNode({ type: 'quiz', moduleId: m.id })} icon={<ClipboardList />} muted={!assessment('MODULE_QUIZ', m.id)}>
                      Avaliação do módulo {assessment('MODULE_QUIZ', m.id) ? `(${assessment('MODULE_QUIZ', m.id)!.questions.length})` : '(vazia)'}
                    </TreeItem>
                    {!disabled && (
                      <button type="button" onClick={() => addLesson(m.id)} className="ml-[20px] flex items-center gap-1 py-1 pl-2 text-xs font-medium text-primary hover:underline">
                        <Plus className="h-3 w-3" /> Aula
                      </button>
                    )}
                  </div>
                ))}
                {!disabled && (
                  <div className="flex flex-wrap gap-1 px-1 py-2">
                    <Button size="sm" variant="outline" onClick={addModule} loading={mutate.isPending}>
                      <Plus /> Módulo
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setGenOpen(true)}>
                      <Sparkles /> Gerar módulo com IA
                    </Button>
                  </div>
                )}
                <div className="my-1 border-t" />
                <TreeItem active={same(node, { type: 'assessment', kind: 'FINAL' })} onClick={() => setNode({ type: 'assessment', kind: 'FINAL' })} icon={<ClipboardList />} muted={!assessment('FINAL')}>
                  Avaliação final {assessment('FINAL') ? `(${assessment('FINAL')!.questions.length})` : ''}
                </TreeItem>
                <TreeItem active={same(node, { type: 'assessment', kind: 'SATISFACTION' })} onClick={() => setNode({ type: 'assessment', kind: 'SATISFACTION' })} icon={<Smile />} muted={!assessment('SATISFACTION')}>
                  Pesquisa de satisfação
                </TreeItem>
              </Card>
              <div className="min-w-0">{panel}</div>
            </div>
            <GenerateModuleDialog courseId={courseId} open={genOpen} onOpenChange={setGenOpen} onCreated={(id) => setNode({ type: 'module', id })} />
          </div>
        );
      }}
    </QueryState>
  );
}
