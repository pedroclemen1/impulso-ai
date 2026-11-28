import { ACTIVITY_TYPE_LABELS, type ActivityType } from '@impulso/shared';
import { ArrowRight, Award, CheckCircle2, ChevronDown, Circle, CircleDot, ClipboardCheck, Clock, FileQuestion, Lock, MessageSquareHeart, Sparkles, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DifficultyBadge, EnrollmentStatusBadge, LevelBadge } from '@/components/common/Badges';
import { Markdown } from '@/components/common/Markdown';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EMPHASIS } from '@/features/student/LearningProfileView';
import { useCourseOverview } from '@/features/student/queries';
import { ScoreMoments } from '@/features/student/ScoreMoments';
import { cn, coverClass, formatDate } from '@/lib/utils';
import type { CourseOverview } from '@/types/student';

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="h-5 w-5 text-success" aria-label="Concluída" />;
  if (status === 'IN_PROGRESS') return <CircleDot className="h-5 w-5 text-primary" aria-label="Em andamento" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40" aria-label="Não iniciada" />;
}

function ModuleBlock({ m, courseId, locked, defaultOpen }: { m: CourseOverview['modules'][number]; courseId: string; locked: boolean; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const done = m.lessons.filter((l) => l.status === 'COMPLETED').length;
  return (
    <Card className={cn(m.completed && 'border-success/30')}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-4 p-4 text-left" aria-expanded={open}>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold', m.completed ? 'bg-success text-success-foreground' : 'bg-primary/10 text-primary')}>
          {m.completed ? <CheckCircle2 className="h-5 w-5" /> : m.order}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{m.title}</p>
            {m.emphasis !== 'PADRAO' && <Badge variant={EMPHASIS[m.emphasis].variant}>{EMPHASIS[m.emphasis].label}</Badge>}
          </div>
          {m.emphasisReason && m.emphasis !== 'PADRAO' && <p className="text-xs text-muted-foreground">{m.emphasisReason}</p>}
          <div className="flex items-center gap-2 pt-1">
            <Progress value={(done / Math.max(1, m.lessons.length)) * 100} className="h-1.5 max-w-[200px]" />
            <span className="text-xs text-muted-foreground">
              {done}/{m.lessons.length} aulas
            </span>
          </div>
        </div>
        <ChevronDown className={cn('mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t">
          {m.description && <p className="px-4 pt-3 text-sm text-muted-foreground">{m.description}</p>}
          <ul className="divide-y">
            {m.lessons.map((l) => (
              <li key={l.id}>
                <Link
                  to={locked ? `/app/courses/${courseId}/diagnostic` : `/app/courses/${courseId}/modules/${m.id}/lessons/${l.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <StatusIcon status={l.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{l.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {l.estimatedMinutes} min
                      </span>
                      {l.activity && (
                        <Badge variant="secondary" className="text-[11px]">
                          <Sparkles /> {ACTIVITY_TYPE_LABELS[l.activity.type as ActivityType] ?? 'Atividade prática'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </Link>
              </li>
            ))}
            {m.quiz && (
              <li>
                {m.quiz.unlocked ? (
                  <Link to={`/app/courses/${courseId}/modules/${m.id}/quiz`} className="flex items-center gap-3 bg-muted/20 px-4 py-3 hover:bg-muted/40">
                    <FileQuestion className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Tentativas {m.quiz.attempts}/{m.quiz.maxAttempts} · mínimo {m.quiz.passingScore}%
                      </p>
                    </div>
                    {m.quiz.bestScore != null ? <Badge variant={m.quiz.bestScore >= m.quiz.passingScore ? 'success' : 'warning'}>{Math.round(m.quiz.bestScore)}%</Badge> : <Badge>Disponível</Badge>}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 bg-muted/20 px-4 py-3 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">{m.quiz.title}</p>
                      <p className="text-xs">Conclua todas as aulas do módulo para liberar.</p>
                    </div>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default function CourseDetailPage() {
  const { courseId = '' } = useParams();
  const q = useCourseOverview(courseId);
  return (
    <QueryState query={q}>
      {(d) => {
        const locked = d.diagnostic.required && !d.diagnostic.done;
        const firstOpen = d.modules.find((m) => !m.completed)?.id;
        return (
          <div className="space-y-6">
            <PageHeader title={d.course.title} breadcrumbs={[{ label: 'Meus cursos', to: '/app/courses' }, { label: d.course.title }]} />
            <Card className="overflow-hidden">
              <div className={`h-3 bg-gradient-to-r ${coverClass(d.course.coverColor)}`} />
              <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <EnrollmentStatusBadge status={d.enrollment.status} />
                    <DifficultyBadge difficulty={d.course.difficulty} />
                    <Badge variant="outline">
                      <Clock /> {d.course.estimatedHours}h
                    </Badge>
                    <Badge variant="outline">Versão {d.course.versionNumber}</Badge>
                    {d.enrollment.dueDate && <Badge variant="outline">Prazo: {formatDate(d.enrollment.dueDate)}</Badge>}
                  </div>
                  <Markdown className="text-sm">{d.course.description}</Markdown>
                  {d.course.objectives.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-sm font-semibold">Objetivos de aprendizagem</p>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {d.course.objectives.map((o, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {d.course.competencies.map((c) => (
                      <Badge key={c.id} variant="secondary" title={c.description}>
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 rounded-xl bg-muted/40 p-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium">Progresso</span>
                      <span className="font-semibold">{Math.round(d.progress.percent)}%</span>
                    </div>
                    <Progress value={d.progress.percent} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {d.progress.lessonsDone}/{d.progress.totalLessons} aulas · {d.progress.quizzesDone}/{d.progress.totalQuizzes} avaliações de módulo
                    </p>
                  </div>
                  {d.progress.unmet.length > 0 && !d.progress.completed && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Para concluir</p>
                      <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                        {d.progress.unmet.map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {d.next && (
                    <Button asChild className="w-full">
                      <Link to={d.next.path}>
                        {locked ? 'Fazer diagnóstico' : 'Próximo passo'} <ArrowRight />
                      </Link>
                    </Button>
                  )}
                  {d.progress.completed && (
                    <Button asChild variant="success" className="w-full">
                      <Link to="/app/certificates">
                        <Award /> Ver certificado
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {locked ? (
              <Card className="border-primary/30 bg-primary/5 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">Comece pelo diagnóstico inicial</p>
                    <p className="text-sm text-muted-foreground">
                      Em cerca de 10 minutos, entendemos sua familiaridade com IA e seu contexto profissional para personalizar explicações, exemplos e desafios. O diagnóstico não é usado para excluir ninguém — todo o conteúdo continua disponível.
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <Link to={`/app/courses/${courseId}/diagnostic`}>Iniciar diagnóstico</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      Como sua trilha foi adaptada <LevelBadge level={d.enrollment.currentLevel ?? d.enrollment.initialLevel} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{d.presentation.explanation}</p>
                    {d.diagnostic.profile && d.diagnostic.profile.gaps.length > 0 && (
                      <p>
                        <span className="font-medium">Foco de reforço:</span> {d.diagnostic.profile.gaps.map((g) => g.name).join(', ')}.
                      </p>
                    )}
                    <Button asChild variant="link" className="h-auto p-0">
                      <Link to={`/app/courses/${courseId}/diagnostic`}>Ver meu perfil de aprendizagem</Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sua evolução</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScoreMoments initial={d.enrollment.initialScore} during={d.enrollment.duringScore} final={d.enrollment.finalScore} compact />
                  </CardContent>
                </Card>
              </div>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Trilha do curso</h2>
              {d.modules.map((m) => (
                <ModuleBlock key={m.id} m={m} courseId={courseId} locked={locked} defaultOpen={m.id === firstOpen} />
              ))}

              {d.finalAssessment && (
                <Card className={cn('flex items-center gap-4 p-4', !d.finalAssessment.unlocked && 'opacity-80')}>
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', d.finalAssessment.passed ? 'bg-success text-success-foreground' : 'bg-violet-100 text-violet-700')}>
                    {d.finalAssessment.passed ? <CheckCircle2 className="h-5 w-5" /> : d.finalAssessment.unlocked ? <ClipboardCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">Avaliação final</p>
                    <p className="text-xs text-muted-foreground">
                      {d.finalAssessment.passed ? 'Aprovado(a)! Confira sua evolução.' : d.finalAssessment.unlocked ? 'Liberada — demonstre o que você aprendeu.' : 'Liberada após concluir as aulas e as avaliações de módulo.'}
                    </p>
                  </div>
                  {d.finalAssessment.unlocked && (
                    <Button asChild size="sm" variant={d.finalAssessment.passed ? 'outline' : 'default'}>
                      <Link to={`/app/courses/${courseId}/final-assessment`}>{d.finalAssessment.passed ? 'Ver resultado' : 'Iniciar'}</Link>
                    </Button>
                  )}
                </Card>
              )}
              {d.satisfaction.available && d.progress.completed && (
                <Card className="flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <MessageSquareHeart className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">Pesquisa de satisfação</p>
                    <p className="text-xs text-muted-foreground">{d.satisfaction.done ? 'Obrigado por responder!' : 'Conte como foi sua experiência (2 minutos).'}</p>
                  </div>
                  {!d.satisfaction.done && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/app/courses/${courseId}/final-assessment?survey=1`}>Responder</Link>
                    </Button>
                  )}
                </Card>
              )}
            </section>
          </div>
        );
      }}
    </QueryState>
  );
}
