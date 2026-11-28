import { DIFFICULTY_LABELS, type Difficulty } from '@impulso/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, MessageSquare, Pencil, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams } from 'react-router-dom';
import { ChartCard, CHART_COLORS } from '@/components/common/ChartCard';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetencyChart, DifficultiesCard, EvolutionChart, LevelDistributionChart, ParticipationChart, ScoreDistributionChart, ThreeMoments } from '@/features/admin/charts';
import { defaultFilters, FiltersBar, toQuery, type FilterState } from '@/features/admin/FiltersBar';
import { api } from '@/lib/api';
import { formatDate, formatMinutes, formatPct, formatPp } from '@/lib/utils';
import type { Charts, KpiDefinitions } from '@/types/admin';

interface CourseAnalytics {
  course: { id: string; title: string; status: string; generatedByAI: boolean; versions: number; publishedVersion: number };
  definitions: KpiDefinitions;
  addie: {
    analysis: { notes: string; participants: number; averageDiagnostic: number | null; levelDistribution: Charts['levelDistribution']; competencyGaps: Charts['competencyPerformance'] };
    design: { notes: string; objectives: string[]; competencies: string[]; difficulty: string; estimatedHours: number; completionCriteria: Record<string, unknown> };
    development: { notes: string; modules: number; lessons: number; activities: number; questions: number; rubrics: number; generatedByAI: boolean; versions: { versionNumber: number; status: string; publishedAt: string | null }[] };
    implementation: {
      notes: string;
      enrollments: number;
      activationRate: number | null;
      participationRate: number | null;
      averageProgress: number | null;
      tutorInteractions: number;
      totalActivities: number;
      averageLearningMinutes: number | null;
      lessonFunnel: { module: string; lesson: string; completed: number }[];
      participationOverTime: Charts['participationOverTime'];
      difficulties: Charts['topDifficulties'];
    };
    evaluation: {
      notes: string;
      learningEvolution: Charts['learningEvolution'];
      knowledgeGain: number | null;
      normalizedGain: number | null;
      feedbackImprovement: number | null;
      approvalRate: number | null;
      completionRate: number | null;
      satisfaction: number | null;
      applicability: number | null;
      competencyPerformance: Charts['competencyPerformance'];
      scoreDistribution: Charts['scoreDistribution'];
    };
  };
}

const Notes = ({ text }: { text: string }) => (
  <Card className="bg-muted/30">
    <CardContent className="p-4 text-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Planejamento registrado</p>
      {text ? <p className="whitespace-pre-line">{text}</p> : <p className="text-muted-foreground">Nenhuma nota registrada para esta etapa. Adicione no editor do curso (Metodologia ADDIE).</p>}
    </CardContent>
  </Card>
);

export default function CourseAnalyticsPage() {
  const { courseId = '' } = useParams();
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters, preset: '90' });
  const query = toQuery(filters);
  const q = useQuery({ queryKey: ['analytics', 'course', courseId, query], queryFn: () => api.get<CourseAnalytics>(`/analytics/courses/${courseId}`, { ...query, courseId: undefined }) });

  return (
    <QueryState query={q}>
      {(d) => {
        const { analysis, design, development, implementation, evaluation } = d.addie;
        const funnelData = implementation.lessonFunnel.map((l, i) => ({ ...l, name: `${i + 1}. ${l.lesson}` }));
        return (
          <div className="space-y-6">
            <PageHeader
              title={d.course.title}
              description="Acompanhamento do curso pelas etapas da metodologia ADDIE, com indicadores calculados a partir dos registros reais."
              breadcrumbs={[{ label: 'Cursos', to: '/admin/courses' }, { label: d.course.title }, { label: 'Analytics' }]}
              actions={
                <>
                  <Button variant="outline" asChild>
                    <Link to="/admin/courses">
                      <ArrowLeft /> Cursos
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/admin/courses/${courseId}/edit`}>
                      <Pencil /> Editar curso
                    </Link>
                  </Button>
                </>
              }
            />
            <FiltersBar value={filters} onChange={setFilters} show={{ course: false, cohort: true, participant: false }} />
            <ThreeMoments
              diagnostic={analysis.averageDiagnostic}
              during={evaluation.learningEvolution[1]?.score ?? null}
              final={evaluation.learningEvolution[2]?.score ?? null}
              gain={evaluation.knowledgeGain}
              normalized={evaluation.normalizedGain}
            />
            <Tabs defaultValue="analysis">
              <TabsList>
                <TabsTrigger value="analysis">A · Análise</TabsTrigger>
                <TabsTrigger value="design">D · Design</TabsTrigger>
                <TabsTrigger value="development">D · Desenvolvimento</TabsTrigger>
                <TabsTrigger value="implementation">I · Implementação</TabsTrigger>
                <TabsTrigger value="evaluation">E · Avaliação</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <Notes text={analysis.notes} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Participantes analisados" value={analysis.participants} icon={Users} />
                  <StatCard label="Média do diagnóstico" value={formatPct(analysis.averageDiagnostic, 1)} definition="Parte objetiva do diagnóstico inicial (0–100)." />
                  <StatCard label="Competências com lacuna" value={analysis.competencyGaps.length} hint="Domínio inicial médio abaixo de 50%" />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <LevelDistributionChart data={analysis.levelDistribution} />
                  <CompetencyChart data={analysis.competencyGaps} title="Lacunas de competência (diagnóstico)" />
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <Notes text={design.notes} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Objetivos educacionais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {design.objectives.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Competências e critérios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex flex-wrap gap-1.5">
                        {design.competencies.map((c) => (
                          <Badge key={c} variant="secondary">
                            {c}
                          </Badge>
                        ))}
                      </div>
                      <p>
                        Dificuldade: <strong>{DIFFICULTY_LABELS[design.difficulty as Difficulty]}</strong> · Carga horária: <strong>{design.estimatedHours}h</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Conclusão: {String(design.completionCriteria.minLessonCompletion ?? 100)}% das aulas
                        {design.completionCriteria.requireModuleQuizzes ? ', avaliações de módulo' : ''}
                        {design.completionCriteria.requireFinalAssessment ? `, aprovação na final (≥ ${String(design.completionCriteria.finalAssessmentPassingScore ?? 70)}%)` : ''}.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="development" className="space-y-4">
                <Notes text={development.notes} />
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <StatCard label="Módulos" value={development.modules} />
                  <StatCard label="Aulas" value={development.lessons} />
                  <StatCard label="Atividades práticas" value={development.activities} />
                  <StatCard label="Rubricas" value={development.rubrics} />
                  <StatCard label="Questões" value={development.questions} />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Versões {development.generatedByAI && <Badge variant="secondary"><Sparkles /> Gerado com IA e revisado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {development.versions.map((v) => (
                      <Badge key={v.versionNumber} variant={v.status === 'PUBLISHED' ? 'success' : v.status === 'DRAFT' ? 'warning' : 'muted'}>
                        v{v.versionNumber} · {v.status === 'PUBLISHED' ? `publicada ${formatDate(v.publishedAt)}` : v.status === 'DRAFT' ? 'rascunho' : 'substituída'}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="implementation" className="space-y-4">
                <Notes text={implementation.notes} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Alocações" value={implementation.enrollments} icon={Users} hint={`Progresso médio: ${formatPct(implementation.averageProgress)}`} />
                  <StatCard label="Taxa de ativação" value={formatPct(implementation.activationRate, 1)} definition={d.definitions.activationRate?.definition} />
                  <StatCard label="Interações com o tutor" value={implementation.tutorInteractions} icon={MessageSquare} hint={`${implementation.totalActivities} atividade(s) submetida(s)`} />
                  <StatCard label="Tempo médio" value={formatMinutes(implementation.averageLearningMinutes)} icon={Clock} definition={d.definitions.learningTime?.definition} />
                </div>
                <ChartCard title="Funil de conclusão por aula" description="Participantes que concluíram cada aula" empty={!funnelData.some((f) => f.completed)} height={Math.max(260, funnelData.length * 26)}>
                  <ResponsiveContainer>
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={240} tick={{ fontSize: 11 }} />
                      <RTooltip formatter={(v: number) => [`${v} participante(s)`, 'Concluíram']} />
                      <Bar dataKey="completed" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ParticipationChart data={implementation.participationOverTime} />
                <DifficultiesCard data={implementation.difficulties} />
              </TabsContent>

              <TabsContent value="evaluation" className="space-y-4">
                <Notes text={evaluation.notes} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Evolução de conhecimento" value={formatPp(evaluation.knowledgeGain)} definition={d.definitions.knowledgeGain?.definition} tone="success" />
                  <StatCard label="Ganho normalizado" value={formatPct(evaluation.normalizedGain, 1)} definition={d.definitions.normalizedGain?.definition} tone="success" />
                  <StatCard label="Evolução após feedback" value={formatPp(evaluation.feedbackImprovement)} definition={d.definitions.feedbackImprovement?.definition} hint="Não indica causalidade" />
                  <StatCard label="Taxa de aprovação" value={formatPct(evaluation.approvalRate, 1)} definition={d.definitions.approvalRate?.definition} hint={`Conclusão: ${formatPct(evaluation.completionRate, 1)}`} />
                  <StatCard label="Satisfação" value={formatPct(evaluation.satisfaction)} definition={d.definitions.satisfaction?.definition} footer={<Badge variant="outline">autodeclarado</Badge>} />
                  <StatCard label="Aplicabilidade profissional" value={formatPct(evaluation.applicability)} definition={d.definitions.applicability?.definition} footer={<Badge variant="outline">autodeclarado</Badge>} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <EvolutionChart data={evaluation.learningEvolution} />
                  <ScoreDistributionChart data={evaluation.scoreDistribution} />
                </div>
                <CompetencyChart data={evaluation.competencyPerformance} />
              </TabsContent>
            </Tabs>
          </div>
        );
      }}
    </QueryState>
  );
}
