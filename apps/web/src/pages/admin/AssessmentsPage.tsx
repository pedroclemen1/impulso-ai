import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Eye, History, Info, Search, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MasteryBadge } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clean, useFilterOptions } from '@/features/admin/hooks';
import { ListEditor } from '@/features/admin/ListEditor';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { useDebounce } from '@/hooks/useDebounce';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { EvaluationRecord, RubricCriterion } from '@/types/admin';

interface QueueRow {
  id: string;
  attemptNumber: number;
  isRevision: boolean;
  createdAt: string;
  content: string;
  user: { id: string; name: string };
  activity: { id: string; title: string; passingScore: number; lesson: { title: string } };
  enrollment: { courseId: string; courseVersion: { title: string; versionNumber: number } };
  evaluation: EvaluationRecord | null;
}

interface SubmissionDetail {
  id: string;
  attemptNumber: number;
  content: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  activity: { title: string; instructions: string; passingScore: number; lesson: { title: string }; rubric: { criteria: RubricCriterion[] } | null };
  evaluations: EvaluationRecord[];
  attempts: { id: string; attemptNumber: number; content: string; createdAt: string; score: number | null }[];
}

const SOURCE_LABEL: Record<string, string> = { AI: 'IA', DEMO: 'Demonstrativo', FALLBACK: 'Fallback (IA indisponível)', HUMAN: 'Revisão humana' };

function ReviewDialog({ submissionId, onOpenChange }: { submissionId: string | null; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['submission', submissionId], queryFn: () => api.get<SubmissionDetail>(`/activities/submissions/${submissionId}`), enabled: !!submissionId });
  const [scores, setScores] = useState<Record<string, { score: number; justification: string }>>({});
  const [note, setNote] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const current = q.data?.evaluations.find((e) => e.isCurrent) ?? q.data?.evaluations[0];

  useEffect(() => {
    if (!q.data) return;
    const init: Record<string, { score: number; justification: string }> = {};
    for (const c of q.data.activity.rubric?.criteria ?? []) {
      const s = current?.scores?.find((x) => x.criterionId === c.id);
      init[c.id] = { score: Math.round(s?.score ?? 0), justification: s?.justification ?? '' };
    }
    setScores(init);
    setNote('');
    setStrengths(current?.strengths ?? []);
    setImprovements(current?.improvements ?? []);
  }, [q.data, current]);

  const criteria = q.data?.activity.rubric?.criteria ?? [];
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  const preview = criteria.reduce((s, c) => s + (scores[c.id]?.score ?? 0) * c.weight, 0) / totalWeight;

  const m = useMutation({
    mutationFn: () =>
      api.post(`/activities/submissions/${submissionId}/review`, {
        scores: criteria.map((c) => ({ criterionId: c.id, score: scores[c.id]?.score ?? 0, justification: scores[c.id]?.justification ?? '' })),
        reviewNote: note,
        strengths: strengths.filter(Boolean),
        improvements: improvements.filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Revisão registrada', { description: 'A avaliação anterior foi preservada no histórico.' });
      qc.invalidateQueries({ queryKey: ['evaluations'] });
      qc.invalidateQueries({ queryKey: ['submission', submissionId] });
      qc.invalidateQueries({ queryKey: ['participant'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={!!submissionId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{q.data ? `${q.data.activity.title} — tentativa ${q.data.attemptNumber}` : 'Avaliação'}</DialogTitle>
          <DialogDescription>
            {q.data && (
              <>
                <Link to={`/admin/users/${q.data.user.id}`} className="font-medium text-primary hover:underline">
                  {q.data.user.name}
                </Link>{' '}
                · {q.data.activity.lesson.title} · {formatDateTime(q.data.createdAt)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {q.isLoading ? (
          <LoadingState rows={2} />
        ) : q.error ? (
          <ErrorState error={q.error} />
        ) : q.data ? (
          <Tabs defaultValue="review">
            <TabsList>
              <TabsTrigger value="review">Resposta e revisão</TabsTrigger>
              <TabsTrigger value="attempts">Tentativas ({q.data.attempts.length})</TabsTrigger>
              <TabsTrigger value="history">
                <History /> Histórico ({q.data.evaluations.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="review" className="space-y-4">
              <div>
                <Label>Resposta do participante</Label>
                <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-line rounded-md border bg-muted/30 p-3 text-sm">{q.data.content}</p>
              </div>
              {current && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  Avaliação atual: <strong>{Math.round(current.weightedScore)}%</strong>
                  <MasteryBadge level={current.masteryLevel} />
                  <Badge variant="muted">{SOURCE_LABEL[current.source]}</Badge>
                  {current.requiresHumanReview && <Badge variant="destructive">requer revisão humana</Badge>}
                </div>
              )}
              <div className="space-y-3">
                {criteria.map((c) => (
                  <div key={c.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_110px]">
                    <div>
                      <p className="text-sm font-medium">
                        {c.name} <span className="text-xs text-muted-foreground">(peso {c.weight})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                      <Input
                        className="mt-2"
                        placeholder="Justificativa"
                        value={scores[c.id]?.justification ?? ''}
                        onChange={(e) => setScores({ ...scores, [c.id]: { ...scores[c.id], justification: e.target.value } })}
                      />
                    </div>
                    <Field label="Nota (0–100)">
                      <Input type="number" min={0} max={100} value={scores[c.id]?.score ?? 0} onChange={(e) => setScores({ ...scores, [c.id]: { ...scores[c.id], score: Math.max(0, Math.min(100, Number(e.target.value))) } })} />
                    </Field>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Nota ponderada resultante: <strong>{preview.toFixed(1)}%</strong> <span className="text-xs text-muted-foreground">(calculada pelo sistema com os pesos da rubrica)</span>
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Pontos fortes</Label>
                  <ListEditor value={strengths} onChange={setStrengths} addLabel="Adicionar" max={10} />
                </div>
                <div className="space-y-1.5">
                  <Label>Melhorias</Label>
                  <ListEditor value={improvements} onChange={setImprovements} addLabel="Adicionar" max={10} />
                </div>
              </div>
              <Field label="Nota da revisão (obrigatória)" hint="Explique o motivo do ajuste. Fica registrada no histórico e na auditoria.">
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </TabsContent>
            <TabsContent value="attempts" className="space-y-3">
              {q.data.attempts.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={a.id === q.data!.id ? 'default' : 'outline'}>Tentativa {a.attemptNumber}</Badge>
                    {formatDateTime(a.createdAt)}
                    <span className="font-semibold text-foreground">{a.score === null ? '—' : `${Math.round(a.score)}%`}</span>
                  </div>
                  <p className="whitespace-pre-line">{a.content}</p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-3">
              {q.data.evaluations.map((e) => (
                <div key={e.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={e.source === 'HUMAN' ? 'success' : 'muted'}>{SOURCE_LABEL[e.source]}</Badge>
                    {e.isCurrent && <Badge>atual</Badge>}
                    <strong>{Math.round(e.weightedScore)}%</strong>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(e.createdAt)}
                      {e.reviewedBy ? ` · por ${e.reviewedBy.name}` : e.model ? ` · ${e.provider}/${e.model}` : ''}
                    </span>
                  </div>
                  {e.reviewNote && <p className="mb-2 rounded bg-muted/50 p-2 text-xs">Nota: {e.reviewNote}</p>}
                  <ul className="grid gap-1 text-xs sm:grid-cols-2">
                    {e.scores?.map((s) => (
                      <li key={s.id}>
                        <span className="font-medium">{s.criterion.name}:</span> {Math.round(s.score)} — <span className="text-muted-foreground">{s.justification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => m.mutate()} loading={m.isPending} disabled={!q.data || note.trim().length < 3 || !criteria.length}>
            Registrar revisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssessmentsPage() {
  const opts = useFilterOptions();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [requiresReview, setRequiresReview] = useState('true');
  const [source, setSource] = useState('');
  const [courseId, setCourseId] = useState('');
  const [page, setPage] = useState(1);
  const selected = params.get('submission');
  const q = useDebounce(search);
  const query = clean({ search: q, requiresReview, source, courseId, page, pageSize: 20 });
  const rows = useQuery({ queryKey: ['evaluations', query], queryFn: () => api.getPage<QueueRow>('/activities/evaluations', query) });
  const open = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('submission', id);
    else next.delete('submission');
    setParams(next, { replace: true });
  };
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Avaliações" description="Acompanhe as avaliações das atividades práticas e revise manualmente quando necessário." />
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Avaliações automáticas são apoio pedagógico, não decisões infalíveis. Toda revisão manual cria uma nova avaliação e preserva o histórico.
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Buscar participante" className="pl-8" />
        </div>
        <SimpleSelect className="w-[220px]" value={requiresReview} onChange={reset(setRequiresReview)} allLabel="Todas as avaliações" options={[{ value: 'true', label: 'Pendentes de revisão humana' }, { value: 'false', label: 'Sem pendência' }]} />
        <SimpleSelect className="w-[200px]" value={source} onChange={reset(setSource)} allLabel="Todas as origens" options={Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value, label }))} />
        <SimpleSelect className="w-[230px]" value={courseId} onChange={reset(setCourseId)} allLabel="Todos os cursos" options={(opts.data?.courses ?? []).map((c) => ({ value: c.id, label: c.title }))} />
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
          <EmptyState icon={ClipboardCheck} title={requiresReview === 'true' ? 'Nenhuma avaliação pendente de revisão' : 'Nenhuma avaliação encontrada'} className="m-4" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Tentativa</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.data.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/admin/users/${r.user.id}`} className="font-medium hover:text-primary">
                      {r.user.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{r.activity.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.enrollment.courseVersion.title} · v{r.enrollment.courseVersion.versionNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.attemptNumber} {r.isRevision && <Badge variant="outline">revisão</Badge>}
                  </TableCell>
                  <TableCell className="font-semibold">{r.evaluation ? `${Math.round(r.evaluation.weightedScore)}%` : '—'}</TableCell>
                  <TableCell>
                    <MasteryBadge level={r.evaluation?.masteryLevel} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="muted">{SOURCE_LABEL[r.evaluation?.source ?? ''] ?? '—'}</Badge>
                      {r.evaluation?.requiresHumanReview && (
                        <Badge variant="destructive">
                          <ShieldAlert /> revisar
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => open(r.id)}>
                      <Eye /> Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {rows.data && <Pagination page={rows.data.meta.page} totalPages={rows.data.meta.totalPages} total={rows.data.meta.total} onChange={setPage} />}
      <ReviewDialog submissionId={selected} onOpenChange={(o) => !o && open(null)} />
    </div>
  );
}
