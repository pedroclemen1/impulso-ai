import { zodResolver } from '@hookform/resolvers/zod';
import { ACTIVITY_TYPE_LABELS, consolidateSchema, LESSON_STAGES, submissionSchema, type ActivityType, type LessonStage } from '@impulso/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Loader2,
  PartyPopper,
  PenLine,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Target,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { LevelBadge } from '@/components/common/Badges';
import { LearningSteps } from '@/components/common/LearningSteps';
import { Markdown } from '@/components/common/Markdown';
import { Breadcrumbs } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { AchievementIcon } from '@/features/student/AchievementIcon';
import { EvaluationCard, ScoreRing } from '@/features/student/EvaluationCard';
import { studentKeys, useInvalidateCourse, useLesson } from '@/features/student/queries';
import { TutorChat } from '@/features/student/TutorChat';
import { api, ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Achievement, Consolidation, LessonView, Submission } from '@/types/student';

const NO_ACTIVITY_STAGES: LessonStage[] = ['LEARN', 'CONTEXTUALIZE', 'REFLECT', 'CONSOLIDATE'];

function Section({ icon: Icon, title, children, tone = 'default' }: { icon: typeof BookOpen; title: string; children: React.ReactNode; tone?: 'default' | 'beginner' | 'advanced' }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        tone === 'beginner' && 'border-sky-200 bg-sky-50/60',
        tone === 'advanced' && 'border-violet-200 bg-violet-50/60',
      )}
    >
      <p className={cn('mb-2 flex items-center gap-2 text-sm font-semibold', tone === 'beginner' ? 'text-sky-700' : tone === 'advanced' ? 'text-violet-700' : 'text-foreground')}>
        <Icon className="h-4 w-4" /> {title}
      </p>
      {children}
    </div>
  );
}

function LearnStage({ data }: { data: LessonView }) {
  const l = data.lesson;
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <Markdown>{l.learnContent}</Markdown>
      </Card>
      {l.beginnerSupport && (
        <Section icon={Lightbulb} title="Explicação introdutória" tone="beginner">
          <Markdown className="text-sm">{l.beginnerSupport}</Markdown>
        </Section>
      )}
      {l.advancedDeepDive && (
        <Section icon={Rocket} title="Aprofundamento" tone="advanced">
          <Markdown className="text-sm">{l.advancedDeepDive}</Markdown>
        </Section>
      )}
      {(l.videoUrl || l.resources.length > 0) && (
        <Section icon={ExternalLink} title="Materiais complementares">
          <ul className="space-y-1.5 text-sm">
            {l.videoUrl && (
              <li>
                <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                  Vídeo da aula
                </a>
              </li>
            )}
            {l.resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function ContextStage({ data, courseId }: { data: LessonView; courseId: string }) {
  const qc = useQueryClient();
  const example = useMutation({
    mutationFn: (regenerate: boolean) => api.post<{ content: string; fallback: boolean }>(`/learning/courses/${courseId}/lessons/${data.lesson.id}/personalized-example`, { regenerate }),
    onSuccess: (r) => {
      qc.setQueryData<LessonView>(studentKeys.lesson(courseId, data.lesson.id), (old) => (old ? { ...old, progress: { ...old.progress, personalizedExample: r.content } } : old));
      if (r.fallback) toast.info('Exemplo gerado pelo tutor demonstrativo (provedor de IA indisponível).');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const ex = data.progress.personalizedExample;
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <GraduationCap className="h-4 w-4" /> Aplicação em recrutamento e seleção
        </p>
        <Markdown>{data.lesson.contextContent}</Markdown>
      </Card>
      <Card className="border-dashed p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <Wand2 className="h-4 w-4 text-primary" /> Exemplo para o meu contexto
            </p>
            <p className="text-sm text-muted-foreground">O tutor cria um exemplo considerando seu cargo e seu nível — sempre com dados fictícios.</p>
          </div>
          <Button variant={ex ? 'outline' : 'default'} onClick={() => example.mutate(!!ex)} loading={example.isPending}>
            {ex ? (
              <>
                <RefreshCw /> Gerar outro
              </>
            ) : (
              <>
                <Sparkles /> Gerar exemplo
              </>
            )}
          </Button>
        </div>
        {ex && (
          <div className="mt-4 rounded-lg bg-accent/50 p-4">
            <Markdown className="text-sm">{ex}</Markdown>
          </div>
        )}
      </Card>
    </div>
  );
}

function ActivityBrief({ data }: { data: LessonView }) {
  const a = data.activity!;
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>
          <Target /> {ACTIVITY_TYPE_LABELS[a.type as ActivityType] ?? 'Atividade prática'}
        </Badge>
        <Badge variant="outline">Até {a.maxAttempts} tentativas</Badge>
        <Badge variant="outline">Referência: {a.passingScore} pontos</Badge>
      </div>
      <h2 className="text-lg font-semibold">{a.title}</h2>
      <Markdown>{a.instructions}</Markdown>
      {a.scenario && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cenário (fictício)</p>
          <Markdown className="text-sm">{a.scenario}</Markdown>
        </div>
      )}
      {a.guidedSteps.length > 0 && (
        <Section icon={ListChecks} title="Passo a passo sugerido" tone="beginner">
          <ul className="space-y-2">
            {a.guidedSteps.map((s, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[hsl(var(--primary))]"
                    checked={checked.has(i)}
                    onChange={() =>
                      setChecked((prev) => {
                        const n = new Set(prev);
                        if (n.has(i)) n.delete(i);
                        else n.add(i);
                        return n;
                      })
                    }
                  />
                  <span className={cn(checked.has(i) && 'text-muted-foreground line-through')}>{s}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {a.advancedChallenge && (
        <Section icon={Rocket} title="Desafio avançado" tone="advanced">
          <Markdown className="text-sm">{a.advancedChallenge}</Markdown>
        </Section>
      )}
      {a.rubric && (
        <details className="group rounded-xl border p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            Como você será avaliado <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-3 space-y-2.5">
            {a.rubric.criteria.map((c) => (
              <li key={c.id} className="text-sm">
                <p className="font-medium">
                  {c.name} <span className="text-xs font-normal text-muted-foreground">· peso {c.weight}</span>
                </p>
                {c.description && <p className="text-muted-foreground">{c.description}</p>}
                {c.indicators.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                    {c.indicators.map((ind) => (
                      <li key={ind}>{ind}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function LgpdBanner() {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      Use apenas dados fictícios ou anonimizados. Não insira nomes reais, CPF, e-mails, telefones ou currículos de candidatos — dados pessoais detectados serão removidos.
    </div>
  );
}

function AnswerForm({ defaultValue, submitLabel, loading, onSubmit }: { defaultValue?: string; submitLabel: string; loading: boolean; onSubmit: (content: string) => void }) {
  const form = useForm<z.infer<typeof submissionSchema>>({ resolver: zodResolver(submissionSchema), defaultValues: { content: defaultValue ?? '' } });
  const value = form.watch('content') ?? '';
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v.content))} className="space-y-3">
      <LgpdBanner />
      <Textarea rows={12} placeholder="Desenvolva sua resposta aqui. Explique seu raciocínio, o contexto e como validaria o resultado…" aria-label="Sua resposta" aria-invalid={!!form.formState.errors.content} {...form.register('content')} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('text-xs', value.length > 8000 ? 'text-destructive' : 'text-muted-foreground')}>{value.length}/8000 caracteres</span>
        {form.formState.errors.content && <span className="text-xs text-destructive">{form.formState.errors.content.message}</span>}
        <Button type="submit" loading={loading}>
          {submitLabel} <ArrowRight />
        </Button>
      </div>
      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> O tutor está analisando sua resposta com base na rubrica…
        </p>
      )}
    </form>
  );
}

function useSubmitActivity(courseId: string, data: LessonView, onDone: () => void) {
  const qc = useQueryClient();
  const invalidate = useInvalidateCourse();
  return useMutation({
    mutationFn: (content: string) => api.post<{ warnings: string[]; attemptsRemaining: number; passed: boolean }>(`/activities/${data.activity!.id}/submissions`, { content }),
    onSuccess: async (r) => {
      r.warnings.forEach((w) => toast.warning(w));
      toast.success(r.passed ? 'Ótimo trabalho! Veja o feedback do tutor.' : 'Resposta enviada! Veja o feedback e reflita com o tutor.');
      await Promise.all([qc.invalidateQueries({ queryKey: studentKeys.lesson(courseId, data.lesson.id) }), qc.invalidateQueries({ queryKey: studentKeys.tutor(courseId, data.lesson.id) }), invalidate(courseId)]);
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

function AttemptsEvolution({ submissions, passing }: { submissions: Submission[]; passing: number }) {
  const scored = submissions.filter((s) => s.evaluation);
  if (scored.length < 1) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      {scored.map((s, i) => {
        const prev = i > 0 ? scored[i - 1].evaluation!.weightedScore : null;
        const delta = prev != null ? Math.round(s.evaluation!.weightedScore - prev) : null;
        return (
          <div key={s.id} className="flex flex-col items-center gap-1">
            <ScoreRing score={s.evaluation!.weightedScore} passing={passing} size={52} />
            <span className="text-[11px] text-muted-foreground">Tentativa {s.attemptNumber}</span>
            {delta != null && <span className={cn('text-[11px] font-semibold', delta >= 0 ? 'text-success' : 'text-destructive')}>{delta >= 0 ? `+${delta}` : delta}</span>}
          </div>
        );
      })}
    </div>
  );
}

function PracticeStage({ data, courseId, goTo }: { data: LessonView; courseId: string; goTo: (s: LessonStage) => void }) {
  const submit = useSubmitActivity(courseId, data, () => goTo('REFLECT'));
  const last = data.submissions[data.submissions.length - 1];
  return (
    <div className="space-y-5">
      <ActivityBrief data={data} />
      {last ? (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Você já enviou {data.submissions.length} tentativa(s)</p>
              <p className="text-sm text-muted-foreground">Converse com o tutor e aprimore sua resposta com base no feedback.</p>
            </div>
            <AttemptsEvolution submissions={data.submissions} passing={data.activity!.passingScore} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => goTo('REFLECT')}>
              Refletir com o tutor <ArrowRight />
            </Button>
            <Button variant="outline" onClick={() => goTo('IMPROVE')} disabled={data.submissions.length >= data.activity!.maxAttempts}>
              <PenLine /> Aprimorar resposta
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="mb-3 font-semibold">Sua resposta</p>
          <AnswerForm submitLabel="Enviar para o tutor" loading={submit.isPending} onSubmit={(c) => submit.mutate(c)} />
        </Card>
      )}
    </div>
  );
}

function ReflectStage({ data, courseId, goTo }: { data: LessonView; courseId: string; goTo: (s: LessonStage) => void }) {
  const last = data.submissions[data.submissions.length - 1];
  const prev = data.submissions[data.submissions.length - 2];
  const hasActivity = !!data.activity;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-5">
        {hasActivity && last?.evaluation ? (
          <EvaluationCard evaluation={last.evaluation} passingScore={data.activity!.passingScore} attemptNumber={last.attemptNumber} previousScore={prev?.evaluation?.weightedScore ?? null} />
        ) : (
          <Card className="p-5">
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <Lightbulb className="h-4 w-4 text-amber-500" /> Para refletir
            </p>
            <Markdown className="text-sm">{data.lesson.reflectionPrompt || 'Como você aplicaria o conteúdo desta aula no seu dia a dia?'}</Markdown>
            <p className="mt-3 text-sm text-muted-foreground">Converse com o tutor sobre suas dúvidas e, quando se sentir pronto(a), consolide sua aprendizagem.</p>
          </Card>
        )}
        <div className="flex flex-wrap gap-2">
          {hasActivity && (
            <Button variant="outline" onClick={() => goTo('IMPROVE')} disabled={data.submissions.length >= data.activity!.maxAttempts}>
              <PenLine /> Revisar resposta
            </Button>
          )}
          <Button variant="success" onClick={() => goTo('CONSOLIDATE')}>
            <CheckCircle2 /> Consolidar aprendizagem
          </Button>
        </div>
      </div>
      <TutorChat courseId={courseId} lessonId={data.lesson.id} hasActivity={hasActivity} onRevise={() => goTo('IMPROVE')} onConsolidate={() => goTo('CONSOLIDATE')} />
    </div>
  );
}

function ImproveStage({ data, courseId, goTo }: { data: LessonView; courseId: string; goTo: (s: LessonStage) => void }) {
  const submit = useSubmitActivity(courseId, data, () => goTo('REFLECT'));
  const last = data.submissions[data.submissions.length - 1];
  const exhausted = data.submissions.length >= data.activity!.maxAttempts;
  if (!last) return <EmptyState title="Envie sua primeira resposta" description="A etapa Aprimorar fica disponível após a primeira tentativa." action={<Button onClick={() => goTo('PRACTICE')}>Ir para Praticar</Button>} />;
  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold">Evolução das suas tentativas</p>
          <p className="text-sm text-muted-foreground">Compare as versões e use o feedback para fortalecer os critérios com menor pontuação.</p>
        </div>
        <AttemptsEvolution submissions={data.submissions} passing={data.activity!.passingScore} />
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sua resposta anterior · tentativa {last.attemptNumber}</p>
            <p className="whitespace-pre-wrap text-sm">{last.content}</p>
          </Card>
          {last.evaluation && <EvaluationCard evaluation={last.evaluation} passingScore={data.activity!.passingScore} attemptNumber={last.attemptNumber} />}
        </div>
        <Card className="h-fit p-5 lg:sticky lg:top-20">
          <p className="mb-1 font-semibold">Nova versão</p>
          <p className="mb-3 text-sm text-muted-foreground">
            {exhausted ? 'Você utilizou todas as tentativas desta atividade.' : `Tentativa ${data.submissions.length + 1} de ${data.activity!.maxAttempts}.`}
          </p>
          {exhausted ? (
            <Button onClick={() => goTo('CONSOLIDATE')} variant="success">
              Consolidar aprendizagem
            </Button>
          ) : (
            <AnswerForm key={last.id} defaultValue={last.content} submitLabel="Enviar versão revisada" loading={submit.isPending} onSubmit={(c) => submit.mutate(c)} />
          )}
        </Card>
      </div>
    </div>
  );
}

function ConsolidationView({ c, takeaways }: { c: Consolidation; takeaways: string[] }) {
  return (
    <div className="space-y-5">
      <Card className="border-success/30 bg-success/5 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <PartyPopper className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-semibold">Aula concluída!</p>
            <p className="mt-1 text-sm">{c.summary}</p>
          </div>
        </div>
      </Card>
      {c.reflectionFeedback && (
        <Card className="p-5">
          <p className="mb-2 text-sm font-semibold">Comentário do tutor sobre sua reflexão</p>
          <Markdown className="text-sm">{c.reflectionFeedback}</Markdown>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'O que você aprendeu', items: c.learned.length ? c.learned : takeaways, icon: CheckCircle2, cls: 'text-success' },
          { title: 'Pontos de melhoria', items: c.improvementPoints, icon: Lightbulb, cls: 'text-warning' },
          { title: 'Próximos passos', items: c.nextSteps, icon: ArrowRight, cls: 'text-primary' },
        ].map((b) => (
          <Card key={b.title}>
            <CardHeader className="pb-2">
              <CardTitle className={cn('flex items-center gap-2 text-sm', b.cls)}>
                <b.icon className="h-4 w-4" /> {b.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {b.items.length ? (
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {b.items.map((i, k) => (
                    <li key={k}>{i}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ConsolidateStage({ data, courseId }: { data: LessonView; courseId: string }) {
  const qc = useQueryClient();
  const invalidate = useInvalidateCourse();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const form = useForm<z.infer<typeof consolidateSchema>>({ resolver: zodResolver(consolidateSchema), defaultValues: { reflection: data.progress.reflectionText ?? '' } });
  const consolidate = useMutation({
    mutationFn: (reflection: string) => api.post<{ newAchievements: Achievement[]; enrollmentStatus: string }>(`/learning/courses/${courseId}/lessons/${data.lesson.id}/consolidate`, { reflection }),
    onSuccess: async (r) => {
      setAchievements(r.newAchievements);
      r.newAchievements.forEach((a) => toast.success(`Nova conquista: ${a.title}`));
      if (r.enrollmentStatus === 'COMPLETED') toast.success('Parabéns! Você concluiu o curso.');
      await Promise.all([qc.invalidateQueries({ queryKey: studentKeys.lesson(courseId, data.lesson.id) }), qc.invalidateQueries({ queryKey: studentKeys.tutor(courseId, data.lesson.id) }), invalidate(courseId)]);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const done = data.progress.status === 'COMPLETED' && data.progress.consolidation;

  return (
    <div className="space-y-5">
      {done ? (
        <ConsolidationView c={data.progress.consolidation!} takeaways={data.lesson.keyTakeaways} />
      ) : (
        <>
          {data.lesson.keyTakeaways.length > 0 && (
            <Card className="p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-primary" /> Aprendizados-chave da aula
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {data.lesson.keyTakeaways.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-5">
            <form onSubmit={form.handleSubmit((v) => consolidate.mutate(v.reflection))} className="space-y-3">
              <label htmlFor="reflection" className="block font-semibold">
                Sua reflexão
              </label>
              <p className="text-sm text-muted-foreground">{data.lesson.reflectionPrompt || 'O que você levará desta aula para a sua prática profissional?'}</p>
              <Textarea id="reflection" rows={5} aria-invalid={!!form.formState.errors.reflection} {...form.register('reflection')} placeholder="Escreva com suas palavras…" />
              {form.formState.errors.reflection && <p className="text-xs text-destructive">{form.formState.errors.reflection.message}</p>}
              <div className="flex justify-end">
                <Button type="submit" variant="success" loading={consolidate.isPending}>
                  <CheckCircle2 /> Consolidar e concluir aula
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}
      {achievements.length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold">Conquistas desbloqueadas</p>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border p-2 pr-3">
                <AchievementIcon name={a.icon} />
                <span className="text-sm font-medium">{a.title}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function LessonPage() {
  const { courseId = '', moduleId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useLesson(courseId, lessonId);
  const data = q.data;
  const stages = useMemo<LessonStage[]>(() => (data && !data.activity ? NO_ACTIVITY_STAGES : [...LESSON_STAGES]), [data]);
  const [view, setView] = useState<LessonStage | null>(null);

  useEffect(() => {
    setView(null);
  }, [lessonId]);

  const saved = data ? (data.progress.status === 'COMPLETED' ? 'CONSOLIDATE' : data.progress.currentStage) : 'LEARN';
  const reached: LessonStage = stages.includes(saved) ? saved : stages[Math.min(stages.length - 1, Math.max(0, LESSON_STAGES.indexOf(saved) - 1))] ?? 'LEARN';
  const current = view ?? reached;
  const hasEvaluated = !!data?.submissions.some((s) => s.evaluation);

  const stageMutation = useMutation({
    mutationFn: (stage: LessonStage) => api.patch(`/learning/courses/${courseId}/lessons/${lessonId}/stage`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.lesson(courseId, lessonId) }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const isEnabled = (s: LessonStage) => {
    if (!data?.activity) return true;
    return LESSON_STAGES.indexOf(s) <= LESSON_STAGES.indexOf('PRACTICE') || hasEvaluated;
  };

  const goTo = (s: LessonStage) => {
    if (!isEnabled(s)) {
      toast.info('Envie sua resposta na etapa Praticar para avançar.');
      return;
    }
    setView(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Salvamento automático: registra apenas avanços (revisitar etapas não regride o progresso).
    if (data && data.progress.status !== 'COMPLETED' && stages.indexOf(s) > stages.indexOf(reached)) stageMutation.mutate(s);
  };

  if (q.isLoading) return <LoadingState rows={2} />;
  if (q.error) {
    const e = q.error;
    if (e instanceof ApiError && (e.details as { code?: string } | undefined)?.code === 'DIAGNOSTIC_REQUIRED') {
      return (
        <EmptyState
          icon={Stethoscope}
          title="Responda o diagnóstico inicial"
          description="O diagnóstico personaliza explicações, exemplos e desafios das aulas. Leva cerca de 10 minutos."
          action={
            <Button asChild>
              <Link to={`/app/courses/${courseId}/diagnostic`}>Iniciar diagnóstico</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState error={e} onRetry={() => q.refetch()} />;
  }
  if (!data) return null;

  const idx = stages.indexOf(current);
  const nextStage = stages[idx + 1];
  const prevStage = stages[idx - 1];
  const nav = data.navigation;

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Meus cursos', to: '/app/courses' },
          { label: 'Curso', to: `/app/courses/${courseId}` },
          { label: `Módulo ${data.module.order}: ${data.module.title}`, to: `/app/courses/${courseId}` },
          { label: data.lesson.title },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Aula {nav.position} de {nav.total}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{data.lesson.title}</h1>
          {data.lesson.summary && <p className="max-w-3xl text-sm text-muted-foreground">{data.lesson.summary}</p>}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">
              <Clock /> {data.lesson.estimatedMinutes} min
            </Badge>
            {data.lesson.competencies.map((c) => (
              <Badge key={c.id} variant="secondary">
                {c.name}
              </Badge>
            ))}
            {data.progress.status === 'COMPLETED' && (
              <Badge variant="success">
                <CheckCircle2 /> Concluída
              </Badge>
            )}
          </div>
        </div>
        <LevelBadge level={data.level} prefix="Conteúdo adaptado ao nível" />
      </div>

      <LearningSteps current={current} reached={reached} stages={stages} onSelect={goTo} isEnabled={(s) => isEnabled(s) && (stages.indexOf(s) <= stages.indexOf(reached) + 1 || data.progress.status === 'COMPLETED' || hasEvaluated)} />

      <div key={current} className="animate-in fade-in-0">
        {current === 'LEARN' && <LearnStage data={data} />}
        {current === 'CONTEXTUALIZE' && <ContextStage data={data} courseId={courseId} />}
        {current === 'PRACTICE' && data.activity && <PracticeStage data={data} courseId={courseId} goTo={goTo} />}
        {current === 'REFLECT' && <ReflectStage data={data} courseId={courseId} goTo={goTo} />}
        {current === 'IMPROVE' && data.activity && <ImproveStage data={data} courseId={courseId} goTo={goTo} />}
        {current === 'CONSOLIDATE' && <ConsolidateStage data={data} courseId={courseId} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        {prevStage ? (
          <Button variant="outline" onClick={() => goTo(prevStage)}>
            <ArrowLeft /> Etapa anterior
          </Button>
        ) : nav.previous ? (
          <Button variant="outline" onClick={() => navigate(`/app/courses/${courseId}/modules/${nav.previous!.moduleId}/lessons/${nav.previous!.id}`)}>
            <ArrowLeft /> Aula anterior
          </Button>
        ) : (
          <span />
        )}
        {nextStage && !(current === 'PRACTICE' && !hasEvaluated) ? (
          <Button onClick={() => goTo(nextStage)}>
            Próxima etapa <ArrowRight />
          </Button>
        ) : current === 'CONSOLIDATE' && data.progress.status === 'COMPLETED' ? (
          nav.next ? (
            <Button onClick={() => navigate(`/app/courses/${courseId}/modules/${nav.next!.moduleId}/lessons/${nav.next!.id}`)}>
              {nav.next.moduleId !== moduleId ? 'Ir para o próximo módulo' : 'Próxima aula'} <ArrowRight />
            </Button>
          ) : (
            <Button asChild>
              <Link to={`/app/courses/${courseId}`}>
                Voltar à trilha do curso <ArrowRight />
              </Link>
            </Button>
          )
        ) : null}
      </div>
      {current === 'CONSOLIDATE' && data.progress.status === 'COMPLETED' && data.module.hasQuiz && nav.next && nav.next.moduleId !== moduleId && (
        <p className="text-right text-xs text-muted-foreground">
          Antes de avançar, realize a{' '}
          <Link to={`/app/courses/${courseId}/modules/${moduleId}/quiz`} className="font-medium text-primary underline-offset-4 hover:underline">
            avaliação deste módulo
          </Link>
          .
        </p>
      )}
    </div>
  );
}
