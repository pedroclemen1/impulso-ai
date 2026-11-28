import { zodResolver } from '@hookform/resolvers/zod';
import { courseGenerationSchema, DIFFICULTIES, DIFFICULTY_LABELS, type CourseGenerationInput } from '@impulso/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Circle, Info, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';

interface Job {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  step: string;
  completedModules: number;
  totalModules: number;
  error: string | null;
  courseId: string | null;
  createdAt: string;
  params: { topic?: string };
  course: { id: string; title: string; status: string } | null;
}

const STATUS_LABEL = { PENDING: 'Na fila', RUNNING: 'Gerando', COMPLETED: 'Concluído', FAILED: 'Falhou' } as const;

function JobProgress({ job, onRetry, retrying }: { job: Job; onRetry: () => void; retrying: boolean }) {
  const steps = [
    { key: 'outline', label: 'Estrutura do curso (objetivos, competências e módulos)' },
    { key: 'modules', label: job.totalModules ? `Conteúdo dos módulos (${job.completedModules}/${job.totalModules})` : 'Conteúdo dos módulos' },
    { key: 'assessments', label: 'Diagnóstico e avaliação final' },
    { key: 'done', label: 'Rascunho pronto para revisão' },
  ];
  const order = steps.map((s) => s.key);
  const current = job.status === 'COMPLETED' ? 4 : order.indexOf(job.step);
  const pct = job.status === 'COMPLETED' ? 100 : Math.round(((current + (job.step === 'modules' && job.totalModules ? job.completedModules / job.totalModules : 0)) / 3) * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {job.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-success" /> : job.status === 'FAILED' ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {job.status === 'COMPLETED' ? 'Curso gerado' : job.status === 'FAILED' ? 'A geração foi interrompida' : 'Gerando curso por etapas...'}
        </CardTitle>
        <CardDescription>Cada etapa é salva; uma nova tentativa continua do ponto de falha sem duplicar o curso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} />
        <ol className="space-y-2">
          {steps.map((s, i) => {
            const done = i < current || job.status === 'COMPLETED';
            const active = i === current && job.status !== 'COMPLETED';
            return (
              <li key={s.key} className={cn('flex items-center gap-2 text-sm', done ? 'text-success' : active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : active && job.status !== 'FAILED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className="h-4 w-4" />}
                {s.label}
              </li>
            );
          })}
        </ol>
        {job.status === 'FAILED' && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="text-destructive">{job.error ?? 'Erro desconhecido.'}</p>
            <Button size="sm" variant="outline" onClick={onRetry} loading={retrying}>
              <RotateCcw /> Tentar novamente
            </Button>
          </div>
        )}
        {job.status === 'COMPLETED' && job.courseId && (
          <div className="space-y-3 rounded-lg border border-success/30 bg-success/5 p-4">
            <p className="text-sm">
              <strong>O curso foi criado como rascunho</strong> e precisa ser revisado e publicado explicitamente. Revise conteúdos, rubricas e questões antes de publicar.
            </p>
            <Button asChild>
              <Link to={`/admin/courses/${job.courseId}/edit`}>Revisar no editor</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CourseGeneratePage() {
  const qc = useQueryClient();
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const [jobId, setJobId] = useState<string | null>(null);
  const settings = useQuery({ queryKey: ['ai', 'settings'], queryFn: () => api.get<{ settings: { activeProvider: string } }>('/ai/settings') });
  const recent = useQuery({ queryKey: ['ai', 'generations'], queryFn: () => api.get<Job[]>('/ai/course-generations') });
  const job = useQuery({
    queryKey: ['ai', 'generation', jobId],
    queryFn: () => api.get<Job>(`/ai/course-generations/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (q) => (q.state.data && ['COMPLETED', 'FAILED'].includes(q.state.data.status) ? false : 1500),
  });

  const form = useForm<CourseGenerationInput>({
    resolver: zodResolver(courseGenerationSchema),
    defaultValues: {
      topic: 'Inteligência artificial aplicada ao recrutamento',
      targetAudience: 'Analistas de Recursos Humanos com pouca experiência em IA',
      objectives: 'Ensinar fundamentos de LLMs, engenharia de prompts, automação de atividades e uso responsável de IA',
      expectedLevel: 'BEGINNER',
      workloadHours: 6,
      moduleCount: 4,
      professionalContext: 'Recrutamento e seleção',
      competencies: 'Fundamentos de IA, Engenharia de prompts, Uso responsável de IA',
      methodology: 'ADDIE com feedback socrático e aprendizagem baseada em problemas',
      additionalInstructions: '',
      idempotencyKey,
    },
  });
  const e = form.formState.errors;

  const start = useMutation({
    mutationFn: (v: CourseGenerationInput) => api.post<Job>('/ai/course-generations', { ...v, idempotencyKey }),
    onSuccess: (j) => {
      setJobId(j.id);
      qc.invalidateQueries({ queryKey: ['ai', 'generations'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const retry = useMutation({
    mutationFn: (id: string) => api.post<Job>(`/ai/course-generations/${id}/retry`),
    onSuccess: (j) => {
      setJobId(j.id);
      qc.invalidateQueries({ queryKey: ['ai', 'generation', j.id] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const isDemo = settings.data?.settings.activeProvider === 'demo';

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Criar curso com IA"
        description="A IA gera uma primeira versão estruturada (módulos, aulas, exemplos, atividades, rubricas, diagnóstico e avaliação final). O resultado é sempre um rascunho — nunca é publicado automaticamente."
        breadcrumbs={[{ label: 'Cursos', to: '/admin/courses' }, { label: 'Criar com IA' }]}
      />
      {isDemo && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            O provedor ativo é o <strong>demonstrativo</strong> (determinístico, sem chave de API). O conteúdo gerado será genérico e identificado como demonstrativo. Configure um provedor real em{' '}
            <Link to="/admin/settings/ai" className="font-medium text-primary underline">
              Configurações de IA
            </Link>
            .
          </span>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {job.data ? (
            <JobProgress job={job.data} onRetry={() => retry.mutate(job.data!.id)} retrying={retry.isPending} />
          ) : (
            <form onSubmit={form.handleSubmit((v) => start.mutate(v))}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Parâmetros do curso</CardTitle>
                  <CardDescription>Quanto mais contexto, melhor a qualidade da primeira versão.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Tema do curso" error={e.topic?.message}>
                    <Input {...form.register('topic')} />
                  </Field>
                  <Field label="Público-alvo" error={e.targetAudience?.message}>
                    <Input {...form.register('targetAudience')} />
                  </Field>
                  <Field label="Objetivos de aprendizagem" error={e.objectives?.message}>
                    <Textarea rows={3} {...form.register('objectives')} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Nível esperado">
                      <Controller control={form.control} name="expectedLevel" render={({ field }) => <SimpleSelect value={field.value} onChange={field.onChange} options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))} />} />
                    </Field>
                    <Field label="Carga horária (h)" error={e.workloadHours?.message}>
                      <Input type="number" min={1} max={80} {...form.register('workloadHours', { valueAsNumber: true })} />
                    </Field>
                    <Field label="Quantidade de módulos" error={e.moduleCount?.message}>
                      <Input type="number" min={1} max={10} {...form.register('moduleCount', { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <Field label="Contexto profissional">
                    <Input {...form.register('professionalContext')} />
                  </Field>
                  <Field label="Competências desejadas" hint="Separe por vírgulas.">
                    <Input {...form.register('competencies')} />
                  </Field>
                  <Field label="Metodologia">
                    <Input {...form.register('methodology')} />
                  </Field>
                  <Field label="Instruções adicionais">
                    <Textarea rows={3} {...form.register('additionalInstructions')} placeholder="Ex.: usar exemplos de vagas de tecnologia e varejo; enfatizar LGPD." />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" loading={start.isPending}>
                      <Sparkles /> Gerar rascunho
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
          {job.data && ['COMPLETED', 'FAILED'].includes(job.data.status) && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Iniciar nova geração
            </Button>
          )}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Gerações recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recent.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma geração ainda.</p>}
            {(recent.data ?? []).map((j) => (
              <button key={j.id} type="button" onClick={() => setJobId(j.id)} className="w-full rounded-lg border p-3 text-left text-sm hover:bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{j.course?.title ?? j.params?.topic ?? 'Curso'}</span>
                  <Badge variant={j.status === 'COMPLETED' ? 'success' : j.status === 'FAILED' ? 'destructive' : 'default'}>{STATUS_LABEL[j.status]}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(j.createdAt)}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
