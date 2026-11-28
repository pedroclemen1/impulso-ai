import { useQuery } from '@tanstack/react-query';
import { Activity, BookCheck, BookOpen, CheckCircle2, Clock, GraduationCap, MessageSquare, Repeat, Rocket, Smile, Sparkles, Target, TrendingUp, Users, UserCheck, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState, QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatMinutes, formatPct, formatPp } from '@/lib/utils';
import { CompetencyChart, DifficultiesCard, EvolutionChart, LevelDistributionChart, ParticipationChart, ProgressByCourseChart, ScoreDistributionChart, ThreeMoments } from '@/features/admin/charts';
import { defaultFilters, FiltersBar, toQuery, type FilterState } from '@/features/admin/FiltersBar';
import type { Overview } from '@/types/admin';

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const query = toQuery(filters);
  const overview = useQuery({
    queryKey: ['analytics', 'overview', query],
    queryFn: () => api.get<Overview>('/analytics/overview', { ...query }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Visão geral" description="Indicadores de aprendizagem calculados a partir dos registros reais da plataforma. Passe o cursor sobre o ícone ⓘ para ver a definição de cada indicador." />
      <FiltersBar value={filters} onChange={setFilters} />
      <QueryState query={overview}>
        {(d) => {
          const k = d.kpis;
          const def = (key: string) => d.definitions[key]?.definition;
          return (
            <div className="space-y-6">
              {!d.hasData && <EmptyState icon={Activity} title="Ainda não há dados para os filtros selecionados" description="Os indicadores aparecem quando participantes são alocados e iniciam os cursos." />}
              <ThreeMoments
                diagnostic={k.averageDiagnostic}
                during={k.averageDuring}
                final={k.averageFinal}
                gain={k.knowledgeGain}
                normalized={k.normalizedGain}
                note={`Evolução e ganho normalizado calculados com ${k.comparableParticipants} participante(s) que possuem diagnóstico e avaliação final em escalas comparáveis.`}
              />

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total de participantes" value={k.totalParticipants} icon={Users} hint={`${k.enrollments} alocação(ões)`} />
                <StatCard label="Participantes ativos" value={k.activeParticipants} icon={UserCheck} hint="No período selecionado" />
                <StatCard label="Cursos publicados" value={k.publishedCourses ?? 0} icon={BookOpen} />
                <StatCard label="Cursos em andamento" value={k.coursesInProgress} icon={Rocket} hint="Com alocações em andamento" />
                <StatCard label="Taxa de conclusão" value={formatPct(k.completionRate, 1)} icon={CheckCircle2} tone="success" definition={def('completionRate')} />
                <StatCard label="Taxa de ativação" value={formatPct(k.activationRate, 1)} icon={GraduationCap} definition={def('activationRate')} />
                <StatCard label="Taxa de participação" value={formatPct(k.participationRate, 1)} icon={Activity} definition="Participantes alocados com atividade no período ÷ participantes alocados." />
                <StatCard label="Taxa de aprovação" value={formatPct(k.approvalRate, 1)} icon={BookCheck} tone="success" definition={def('approvalRate')} />
                <StatCard label="Média do diagnóstico inicial" value={formatPct(k.averageDiagnostic, 1)} icon={Target} definition="Média da parte objetiva do diagnóstico (0–100)." />
                <StatCard label="Média da avaliação final" value={formatPct(k.averageFinal, 1)} icon={Target} tone="success" definition="Média da melhor tentativa objetiva na avaliação final (0–100)." />
                <StatCard label="Evolução de conhecimento" value={formatPp(k.knowledgeGain)} icon={TrendingUp} tone="success" definition={def('knowledgeGain')} hint={`Ganho normalizado: ${formatPct(k.normalizedGain, 1)}`} />
                <StatCard
                  label="Evolução após feedback"
                  value={formatPp(k.feedbackImprovement)}
                  icon={Repeat}
                  definition={def('feedbackImprovement')}
                  hint={`${k.feedbackImprovementSample} atividade(s) com revisão · não indica causalidade`}
                />
                <StatCard label="Tempo médio de aprendizagem" value={formatMinutes(k.averageLearningMinutes)} icon={Clock} definition={def('learningTime')} hint={`${k.totalLearningHours} h no total`} />
                <StatCard label="Atividades realizadas" value={k.totalActivities} icon={Sparkles} hint={`${k.lessonsCompleted} aula(s) concluída(s)`} />
                <StatCard label="Interações com o tutor de IA" value={k.tutorInteractions} icon={MessageSquare} definition="Mensagens enviadas pelos participantes ao tutor socrático." />
                <StatCard
                  label="Satisfação"
                  value={formatPct(k.satisfaction)}
                  icon={Smile}
                  definition={def('satisfaction')}
                  footer={
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline">autodeclarado</Badge> {k.satisfactionResponses} resposta(s)
                    </div>
                  }
                />
                <StatCard
                  label="Aplicabilidade profissional"
                  value={formatPct(k.applicability)}
                  icon={Briefcase}
                  definition={def('applicability')}
                  footer={
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline">autodeclarado</Badge> {k.applicabilityResponses} resposta(s)
                    </div>
                  }
                />
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <EvolutionChart data={d.charts.learningEvolution} />
                <LevelDistributionChart data={d.charts.levelDistribution} />
                <ProgressByCourseChart data={d.charts.progressByCourse} />
                <ScoreDistributionChart data={d.charts.scoreDistribution} />
              </div>
              <ParticipationChart data={d.charts.participationOverTime} />
              <div className="grid gap-4 lg:grid-cols-2">
                <CompetencyChart data={d.charts.competencyPerformance} />
                <DifficultiesCard data={d.charts.topDifficulties} />
              </div>
              <p className="text-xs text-muted-foreground">
                Dados objetivos (avaliações e atividades) e autodeclarados (satisfação e aplicabilidade) são apresentados separadamente. A evolução após feedback descreve o progresso observado durante o ciclo de feedback socrático, sem comprovar causalidade.
              </p>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
