import { MASTERY_LABELS } from '@impulso/shared';
import { Info, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { ChartCard, CHART_COLORS } from '@/components/common/ChartCard';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AchievementIcon } from '@/features/student/AchievementIcon';
import { studentKeys } from '@/features/student/queries';
import { api } from '@/lib/api';
import type { StudentCompetency } from '@/types/student';

const mastery = (s: number) => (s >= 85 ? 'AVANCADO' : s >= 70 ? 'PROFICIENTE' : s >= 45 ? 'EM_DESENVOLVIMENTO' : 'INICIAL');

export default function CompetenciesPage() {
  const q = useQuery({ queryKey: studentKeys.competencies, queryFn: () => api.get<StudentCompetency[]>('/learning/competencies') });
  return (
    <div>
      <PageHeader title="Minhas competências" description="Seu domínio em cada competência trabalhada nos cursos." breadcrumbs={[{ label: 'Início', to: '/app/dashboard' }, { label: 'Competências' }]} />
      <QueryState query={q}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon={Target} title="Ainda sem evidências" description="Suas competências serão calculadas a partir do diagnóstico, das atividades práticas e das avaliações." />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Mapa de competências" description="Domínio atual em cada competência (0–100)">
                  <ResponsiveContainer>
                    <RadarChart data={items.map((c) => ({ name: c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name, atual: Math.round(c.score), inicial: c.initialScore == null ? 0 : Math.round(c.initialScore) }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Diagnóstico" dataKey="inicial" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.15} />
                      <Radar name="Atual" dataKey="atual" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
                      <Legend />
                      <RTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Diagnóstico × atual" description="Evolução por competência">
                  <ResponsiveContainer>
                    <BarChart data={items.map((c) => ({ name: c.name.length > 16 ? `${c.name.slice(0, 14)}…` : c.name, Diagnóstico: c.initialScore == null ? null : Math.round(c.initialScore), Atual: Math.round(c.score) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <RTooltip />
                      <Legend />
                      <Bar dataKey="Diagnóstico" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Atual" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => {
                  const delta = c.initialScore != null ? Math.round(c.score - c.initialScore) : null;
                  return (
                    <Card key={c.id} className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.category}</p>
                        </div>
                        {c.achievement && <AchievementIcon name={c.achievement.icon} className="h-8 w-8" />}
                      </div>
                      {c.description && <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}
                      <div className="flex items-end justify-between">
                        <p className="text-3xl font-semibold tracking-tight">{Math.round(c.score)}%</p>
                        <Badge variant={c.score >= 70 ? 'success' : c.score >= 45 ? 'warning' : 'destructive'}>{MASTERY_LABELS[mastery(c.score)]}</Badge>
                      </div>
                      <Progress value={c.score} />
                      <p className="text-xs text-muted-foreground">
                        {c.initialScore != null ? `Diagnóstico: ${Math.round(c.initialScore)}% · ` : ''}
                        {delta != null && <span className={delta >= 0 ? 'font-medium text-success' : 'font-medium text-destructive'}>{delta >= 0 ? `+${delta}` : delta} p.p. · </span>}
                        {c.evidenceCount} evidência(s)
                      </p>
                      {c.achievement && <p className="text-xs font-medium text-amber-600">Conquista: {c.achievement.title}</p>}
                    </Card>
                  );
                })}
              </div>
              <Card className="flex gap-3 p-4 text-sm text-muted-foreground">
                <Info className="h-5 w-5 shrink-0 text-primary" />
                O domínio é a média ponderada das suas melhores tentativas nas atividades práticas (avaliadas por rubrica) e das questões objetivas das avaliações associadas a cada competência. O valor do diagnóstico mostra seu ponto de partida.
              </Card>
            </div>
          )
        }
      </QueryState>
    </div>
  );
}
