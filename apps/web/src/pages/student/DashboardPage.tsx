import { ASSESSMENT_KIND_LABELS, type AssessmentKind } from '@impulso/shared';
import { ArrowRight, Award, BookOpen, Clock, Compass, History, PlayCircle, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LevelBadge } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState, QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AchievementChip, AchievementIcon } from '@/features/student/AchievementIcon';
import { CourseCard } from '@/features/student/CourseCard';
import { HistoryItem } from '@/features/student/HistoryItem';
import { useDashboard } from '@/features/student/queries';
import { formatDate, formatMinutes, formatPct } from '@/lib/utils';
import type { Dashboard } from '@/types/student';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

const NEXT_LABEL: Record<string, string> = {
  DIAGNOSTIC: 'Diagnóstico inicial',
  LESSON: 'Aula',
  MODULE_QUIZ: 'Avaliação do módulo',
  FINAL: 'Avaliação final',
  SATISFACTION: 'Pesquisa de satisfação',
};

function ContinueCard({ d }: { d: Dashboard }) {
  const c = d.continueLearning;
  if (!c) {
    const anyCourse = d.courses.inProgress.length + d.courses.available.length + d.courses.completed.length > 0;
    return (
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
        <p className="text-sm text-indigo-100">Continue aprendendo</p>
        <p className="mt-1 text-xl font-semibold">{anyCourse ? 'Você está em dia com suas trilhas! 🎉' : 'Nenhum curso alocado ainda'}</p>
        <p className="mt-1 text-sm text-indigo-100">{anyCourse ? 'Revise seus cursos concluídos ou consulte seus certificados.' : 'Assim que a administração alocar um curso, ele aparecerá aqui.'}</p>
      </Card>
    );
  }
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-indigo-100">
            <PlayCircle className="h-4 w-4" /> Continue aprendendo
          </p>
          <p className="text-xl font-semibold leading-tight">{c.title}</p>
          <p className="text-sm text-indigo-100">
            {c.type ? NEXT_LABEL[c.type] : 'Próximo passo'} {c.moduleTitle ? `· ${c.moduleTitle}` : ''} · {c.courseTitle}
          </p>
          <div className="flex max-w-xs items-center gap-2 pt-2">
            <Progress value={c.progressPercent} className="h-1.5 bg-white/20" indicatorClassName="bg-white" />
            <span className="text-xs text-indigo-100">{Math.round(c.progressPercent)}%</span>
          </div>
        </div>
        <Button asChild size="lg" variant="secondary" className="shrink-0 bg-white text-indigo-700 hover:bg-indigo-50">
          <Link to={c.path}>
            Continuar <ArrowRight />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const q = useDashboard();
  return (
    <QueryState query={q}>
      {(d) => {
        const allCourses = [...d.courses.inProgress, ...d.courses.available, ...d.courses.completed];
        return (
          <div className="space-y-6">
            <PageHeader
              title={`${greeting()}, ${d.user.firstName}!`}
              description={d.user.jobTitle ? `${d.user.jobTitle} · sua jornada de aprendizagem em IA` : 'Sua jornada de aprendizagem em IA'}
              actions={<LevelBadge level={d.user.knowledgeLevel} prefix="Nível inicial" />}
            />
            <ContinueCard d={d} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Progresso geral" value={formatPct(d.overallProgress)} icon={TrendingUp} footer={<Progress value={d.overallProgress} />} />
              <StatCard label="Cursos" value={allCourses.length} icon={BookOpen} hint={`${d.courses.inProgress.length} em andamento · ${d.courses.completed.length} concluído(s)`} />
              <StatCard label="Tempo estimado restante" value={formatMinutes(d.remainingMinutes)} icon={Clock} hint="Soma das aulas ainda não concluídas" />
              <StatCard label="Conquistas" value={`${d.achievements.earned.length}/${d.achievements.total}`} icon={Award} tone="warning" hint="Marcos do seu desenvolvimento" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {(['inProgress', 'available', 'completed'] as const).map((k) =>
                  d.courses[k].length ? (
                    <section key={k} className="space-y-3">
                      <h2 className="font-semibold">{k === 'inProgress' ? 'Cursos em andamento' : k === 'available' ? 'Cursos disponíveis' : 'Cursos concluídos'}</h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {d.courses[k].map((c) => (
                          <CourseCard key={c.enrollmentId} course={c} />
                        ))}
                      </div>
                    </section>
                  ) : null,
                )}
                {!allCourses.length && <EmptyState icon={BookOpen} title="Nenhum curso alocado" description="Quando a administração alocar um curso para você, ele aparecerá aqui." />}

                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-primary" /> Competências desenvolvidas
                    </CardTitle>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/app/competencies">Ver todas</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {d.competencies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Suas competências aparecerão após o diagnóstico e as primeiras atividades.</p>
                    ) : (
                      d.competencies.slice(0, 6).map((c) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground">
                              {c.initialScore != null && <span className="mr-1 text-xs">{Math.round(c.initialScore)} →</span>}
                              <span className="font-semibold text-foreground">{Math.round(c.score)}%</span>
                            </span>
                          </div>
                          <div className="relative">
                            <Progress value={c.score} />
                            {c.initialScore != null && <span className="absolute top-[-2px] h-3 w-0.5 rounded bg-foreground/50" style={{ left: `${Math.min(100, c.initialScore)}%` }} title="Diagnóstico" />}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {d.continueLearning && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Compass className="h-4 w-4 text-primary" /> Próxima atividade recomendada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Badge variant="secondary">{d.continueLearning.type ? NEXT_LABEL[d.continueLearning.type] : 'Próximo passo'}</Badge>
                        <p className="mt-2 font-medium">{d.continueLearning.title}</p>
                        <p className="text-xs text-muted-foreground">{d.continueLearning.courseTitle}</p>
                      </div>
                      <Button asChild size="sm" className="w-full">
                        <Link to={d.continueLearning.path}>Ir para a atividade</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Desempenho nas avaliações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {d.assessmentPerformance.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma avaliação realizada ainda.</p>
                    ) : (
                      d.assessmentPerformance.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {ASSESSMENT_KIND_LABELS[a.kind as AssessmentKind]} · {formatDate(a.submittedAt)}
                            </p>
                          </div>
                          <Badge variant={a.kind === 'DIAGNOSTIC' ? 'secondary' : a.passed ? 'success' : 'warning'}>{formatPct(a.objectiveScore ?? a.score)}</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-4 w-4 text-amber-500" /> Conquistas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {d.achievements.earned.length === 0 ? (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <AchievementIcon earned={false} /> Conclua sua primeira aula para desbloquear conquistas.
                      </div>
                    ) : (
                      d.achievements.earned.slice(0, 4).map((a) => <AchievementChip key={a.id} a={a} />)
                    )}
                    {d.achievements.earned.length > 4 && <p className="text-xs text-muted-foreground">+{d.achievements.earned.length - 4} conquista(s)</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-4 w-4 text-primary" /> Histórico recente
                    </CardTitle>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/app/history">Ver tudo</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {d.recentHistory.length === 0 ? <p className="text-sm text-muted-foreground">Sua atividade aparecerá aqui.</p> : d.recentHistory.map((e, i) => <HistoryItem key={i} e={e} compact />)}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
