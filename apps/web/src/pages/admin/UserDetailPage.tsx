import { ASSESSMENT_KIND_LABELS, DIAGNOSTIC_DIMENSIONS, levelLabel, type AssessmentKind } from '@impulso/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Award, BrainCircuit, CalendarDays, CheckCircle2, Clock, GraduationCap, Lightbulb, Mail, MessageSquare, Pencil, Sparkles, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DemoBadge, EnrollmentStatusBadge, LevelBadge, MasteryBadge } from '@/components/common/Badges';
import { ChartCard, CHART_COLORS } from '@/components/common/ChartCard';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState, QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/misc';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnrollmentDialog } from '@/features/admin/EnrollmentDialog';
import { EditUserDialog } from '@/features/admin/UserDialogs';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDate, formatDateTime, formatMinutes, formatPct, formatPp } from '@/lib/utils';
import type { EvaluationRecord, UserRow } from '@/types/admin';

interface Participant {
  user: { id: string; name: string; email: string; role: string; status: string; createdAt: string; lastLoginAt: string | null; profile: { jobTitle: string | null; department: string | null; company: string | null; professionalContext: string | null; challenges: string | null; knowledgeLevel: number | null } | null; cohorts: { id: string; name: string }[] };
  enrollments: {
    id: string;
    courseId: string;
    course: string;
    versionNumber: number;
    status: string;
    progressPercent: number;
    startDate: string;
    dueDate: string | null;
    completedAt: string | null;
    initialLevel: number | null;
    currentLevel: number | null;
    initialScore: number | null;
    duringScore: number | null;
    finalScore: number | null;
    knowledgeGain: number | null;
    normalizedGain: number | null;
    passed: boolean | null;
    certificateCode: string | null;
  }[];
  diagnostic: {
    level: number | null;
    levelLabel: string;
    objectiveScore: number | null;
    selfReportScore: number | null;
    submittedAt: string;
    profile: { rationale?: string[]; knowledgeIdentified?: { name: string; score: number }[]; gaps?: { name: string; score: number }[]; recommendations?: string[] } | null;
    answers: { question: string; type: string; dimension: string | null; selfReported: boolean; answer: string; score: number | null; isCorrect: boolean | null }[];
  } | null;
  assessments: { id: string; title: string; kind: string; attemptNumber: number; score: number | null; objectiveScore: number | null; passed: boolean | null; submittedAt: string }[];
  competencies: { id: string; name: string; initialScore: number | null; score: number; evidenceCount: number }[];
  activities: {
    activity: string;
    lesson: string;
    passingScore: number;
    firstScore: number | null;
    lastScore: number | null;
    improvement: number | null;
    attempts: { id: string; attemptNumber: number; content: string; createdAt: string; evaluation: EvaluationRecord | null; history: number }[];
  }[];
  recurringDifficulties: { name: string; low: number; avg: number }[];
  engagement: { activeDays: number; learningMinutes: number; sessions: number; lessonsCompleted: number; totalLessons: number; submissions: number; tutorInteractions: number; index: number };
  achievements: { id: string; title: string; description: string; awardedAt: string }[];
  evolution: { course: string; diagnostic: number | null; during: number | null; final: number | null }[];
}

interface Insights {
  summary: string;
  strengths: string[];
  difficulties: string[];
  recommendations: string[];
  dataSufficiency: 'INSUFFICIENT' | 'PARTIAL' | 'SUFFICIENT';
  evidence: string[];
  evidenceCount: number;
  provider: string;
  fallback: boolean;
  generatedAt: string;
}

const SUFFICIENCY = { INSUFFICIENT: { label: 'Dados insuficientes', variant: 'destructive' }, PARTIAL: { label: 'Dados parciais', variant: 'warning' }, SUFFICIENT: { label: 'Dados suficientes', variant: 'success' } } as const;

function InsightsCard({ userId }: { userId: string }) {
  const m = useMutation({ mutationFn: () => api.post<Insights>(`/analytics/participants/${userId}/insights`), onError: (e) => toast.error(errorMessage(e)) });
  const r = m.data;
  const List = ({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof Lightbulb }) =>
    items.length ? (
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {title}
        </p>
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {items.map((i, k) => (
            <li key={k}>{i}</li>
          ))}
        </ul>
      </div>
    ) : null;
  return (
    <Card className="border-primary/30">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4 text-primary" /> Insights pedagógicos (IA)
          </CardTitle>
          <CardDescription>Gerados a partir das evidências registradas. São apoio pedagógico — não decisões.</CardDescription>
        </div>
        <Button size="sm" onClick={() => m.mutate()} loading={m.isPending}>
          <Sparkles /> {r ? 'Gerar novamente' : 'Gerar insights'}
        </Button>
      </CardHeader>
      {r && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={SUFFICIENCY[r.dataSufficiency].variant}>{SUFFICIENCY[r.dataSufficiency].label}</Badge>
            <Badge variant="outline">{r.evidenceCount} evidência(s)</Badge>
            <Badge variant="muted">
              {r.provider === 'demo' ? 'Provedor demonstrativo' : r.provider}
              {r.fallback ? ' (fallback)' : ''}
            </Badge>
          </div>
          <p className="text-sm leading-6">{r.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <List title="Pontos fortes" items={r.strengths} icon={CheckCircle2} />
            <List title="Dificuldades" items={r.difficulties} icon={XCircle} />
            <List title="Recomendações" items={r.recommendations} icon={Lightbulb} />
            <List title="Evidências citadas" items={r.evidence} icon={TrendingUp} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function UserDetailPage() {
  const { userId = '' } = useParams();
  const [allocate, setAllocate] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const q = useQuery({ queryKey: ['participant', userId], queryFn: () => api.get<Participant>(`/analytics/participants/${userId}`) });
  const openEdit = async () => {
    try {
      setEditing(await api.get<UserRow>(`/users/${userId}`));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <QueryState query={q}>
      {(d) => {
        const enr = d.enrollments[0];
        return (
          <div className="space-y-6">
            <PageHeader
              title={
                <span className="flex flex-wrap items-center gap-3">
                  <Avatar name={d.user.name} className="h-10 w-10" /> {d.user.name}
                </span>
              }
              breadcrumbs={[{ label: 'Participantes', to: '/admin/users' }, { label: d.user.name }]}
              actions={
                <>
                  <Button variant="outline" onClick={openEdit}>
                    <Pencil /> Editar
                  </Button>
                  {d.user.role === 'STUDENT' && (
                    <Button onClick={() => setAllocate(true)}>
                      <GraduationCap /> Alocar curso
                    </Button>
                  )}
                </>
              }
            />

            <Card>
              <CardContent className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Contato</p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {d.user.email}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant={d.user.status === 'ACTIVE' ? 'success' : 'muted'}>{d.user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</Badge>
                    {d.user.email.endsWith('@demo.impulso.ai') && <DemoBadge />}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cargo e área</p>
                  <p>{d.user.profile?.jobTitle ?? '—'}</p>
                  <p className="text-muted-foreground">
                    {[d.user.profile?.department, d.user.profile?.company].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Turmas</p>
                  <div className="flex flex-wrap gap-1">{d.user.cohorts.length ? d.user.cohorts.map((c) => <Badge key={c.id} variant="outline">{c.name}</Badge>) : '—'}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nível de conhecimento</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <LevelBadge level={enr?.initialLevel} prefix="Inicial" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <LevelBadge level={enr?.currentLevel} prefix="Atual" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Último acesso: {formatDateTime(d.user.lastLoginAt)}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Índice de engajamento" value={`${d.engagement.index}/100`} icon={TrendingUp} definition="Dias ativos 30%, aulas 25%, atividades 20%, interações com o tutor 15%, retornos 10%." />
              <StatCard label="Dias ativos" value={d.engagement.activeDays} icon={CalendarDays} hint={`${d.engagement.sessions} sessão(ões)`} />
              <StatCard label="Tempo de aprendizagem" value={formatMinutes(d.engagement.learningMinutes)} icon={Clock} hint={`${d.engagement.lessonsCompleted}/${d.engagement.totalLessons} aulas concluídas`} />
              <StatCard label="Interações com o tutor" value={d.engagement.tutorInteractions} icon={MessageSquare} hint={`${d.engagement.submissions} submissão(ões) de atividade`} />
            </div>

            <InsightsCard userId={userId} />

            <Tabs defaultValue="courses">
              <TabsList>
                <TabsTrigger value="courses">Cursos e evolução</TabsTrigger>
                <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
                <TabsTrigger value="competencies">Competências</TabsTrigger>
                <TabsTrigger value="activities">Atividades e feedbacks</TabsTrigger>
                <TabsTrigger value="assessments">Avaliações</TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="space-y-4">
                {!d.enrollments.length && <EmptyState title="Nenhum curso atribuído" description="Use “Alocar curso” para iniciar a capacitação." />}
                {d.enrollments.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_1.2fr]">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{e.course}</span>
                          <Badge variant="outline">v{e.versionNumber}</Badge>
                          <EnrollmentStatusBadge status={e.status} />
                        </div>
                        <Progress value={e.progressPercent} />
                        <p className="text-xs text-muted-foreground">
                          {Math.round(e.progressPercent)}% · início {formatDate(e.startDate)}
                          {e.dueDate ? ` · prazo ${formatDate(e.dueDate)}` : ''}
                          {e.completedAt ? ` · concluído ${formatDate(e.completedAt)}` : ''}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2 text-sm">
                          <span>
                            Evolução: <strong className="text-primary">{formatPp(e.knowledgeGain)}</strong>
                          </span>
                          <span>
                            Ganho normalizado: <strong className="text-success">{formatPct(e.normalizedGain)}</strong>
                          </span>
                          {e.passed !== null && <Badge variant={e.passed ? 'success' : 'destructive'}>{e.passed ? 'Aprovado(a)' : 'Não aprovado(a)'}</Badge>}
                          {e.certificateCode && (
                            <Badge variant="success">
                              <Award /> {e.certificateCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { l: 'Diagnóstico', v: e.initialScore },
                          { l: 'Durante o curso', v: e.duringScore },
                          { l: 'Avaliação final', v: e.finalScore },
                        ].map((x) => (
                          <div key={x.l} className="rounded-lg bg-muted/50 p-3">
                            <div className="text-xs text-muted-foreground">{x.l}</div>
                            <div className="text-2xl font-semibold">{formatPct(x.v)}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {d.evolution.some((e) => e.diagnostic !== null) && (
                  <ChartCard title="Evolução de desempenho" description="Diagnóstico → durante o curso → avaliação final, por curso">
                    <ResponsiveContainer>
                      <BarChart data={d.evolution} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <RTooltip formatter={(v: number) => `${v}%`} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="diagnostic" name="Diagnóstico" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="during" name="Durante" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="final" name="Final" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {d.achievements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Conquistas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {d.achievements.map((a) => (
                        <Badge key={a.id} variant="secondary" title={a.description}>
                          <Award /> {a.title}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="diagnostic" className="space-y-4">
                {!d.diagnostic ? (
                  <EmptyState title="Diagnóstico ainda não respondido" />
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <StatCard label="Nível inicial" value={`${d.diagnostic.level ?? '—'} · ${d.diagnostic.levelLabel}`} hint={`Respondido em ${formatDate(d.diagnostic.submittedAt)}`} />
                      <StatCard label="Desempenho objetivo" value={formatPct(d.diagnostic.objectiveScore, 1)} definition="Questões com gabarito, cenários práticos e conhecimento (75% da classificação)." />
                      <StatCard label="Autopercepção" value={formatPct(d.diagnostic.selfReportScore, 1)} footer={<Badge variant="outline">autodeclarado</Badge>} definition="Familiaridade, frequência e confiança declaradas (25% da classificação, nunca eleva o nível além do desempenho objetivo)." />
                    </div>
                    {d.diagnostic.profile && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Perfil de aprendizagem</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                          <div>
                            <p className="mb-1 font-medium">Conhecimentos identificados</p>
                            {d.diagnostic.profile.knowledgeIdentified?.length ? (
                              d.diagnostic.profile.knowledgeIdentified.map((k) => (
                                <p key={k.name}>
                                  {k.name} — {k.score}%
                                </p>
                              ))
                            ) : (
                              <p className="text-muted-foreground">Nenhum acima de 70%.</p>
                            )}
                            <p className="mb-1 mt-3 font-medium">Lacunas</p>
                            {d.diagnostic.profile.gaps?.length ? d.diagnostic.profile.gaps.map((k) => <p key={k.name}>{k.name} — {k.score}%</p>) : <p className="text-muted-foreground">Nenhuma abaixo de 50%.</p>}
                          </div>
                          <div>
                            <p className="mb-1 font-medium">Justificativa da classificação</p>
                            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                              {d.diagnostic.profile.rationale?.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                            <p className="mb-1 mt-3 font-medium">Recomendações</p>
                            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                              {d.diagnostic.profile.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Respostas do diagnóstico</CardTitle>
                      </CardHeader>
                      <CardContent className="divide-y">
                        {d.diagnostic.answers.map((a, i) => (
                          <div key={i} className="py-3 text-sm">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              {a.dimension && <Badge variant="secondary">{DIAGNOSTIC_DIMENSIONS[a.dimension as keyof typeof DIAGNOSTIC_DIMENSIONS] ?? a.dimension}</Badge>}
                              {a.selfReported && <Badge variant="outline">autodeclarada</Badge>}
                              {a.isCorrect === true && <Badge variant="success">correta</Badge>}
                              {a.isCorrect === false && <Badge variant="destructive">incorreta</Badge>}
                              {a.score !== null && <span className="text-xs text-muted-foreground">{Math.round(a.score)} pts</span>}
                            </div>
                            <p className="font-medium">{a.question}</p>
                            <p className="text-muted-foreground">{a.answer || '—'}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="competencies" className="space-y-4">
                {!d.competencies.length ? (
                  <EmptyState title="Sem evidências de competência ainda" />
                ) : (
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      {d.competencies.map((c) => (
                        <div key={`${c.id}-${c.initialScore}-${c.score}`} className="space-y-1">
                          <div className="flex flex-wrap justify-between gap-2 text-sm">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground">
                              inicial {formatPct(c.initialScore)} → atual <strong className="text-foreground">{formatPct(c.score)}</strong> · {c.evidenceCount} evidência(s)
                            </span>
                          </div>
                          <div className="relative h-2.5 rounded-full bg-muted">
                            <div className="absolute h-2.5 rounded-full bg-violet-300" style={{ width: `${c.initialScore ?? 0}%` }} />
                            <div className={cn('absolute h-1 translate-y-[3px] rounded-full', c.score >= 70 ? 'bg-success' : c.score >= 50 ? 'bg-primary' : 'bg-warning')} style={{ width: `${c.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {d.recurringDifficulties.length > 0 && (
                  <Card className="border-warning/40">
                    <CardHeader>
                      <CardTitle className="text-base">Dificuldades recorrentes</CardTitle>
                      <CardDescription>Critérios de rubrica com nota abaixo de 60 em duas ou mais evidências.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {d.recurringDifficulties.map((r) => (
                        <Badge key={r.name} variant="warning">
                          {r.name} · média {Math.round(r.avg)}% · {r.low}×
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                {!d.activities.length && <EmptyState title="Nenhuma atividade realizada" />}
                {d.activities.map((a) => (
                  <Card key={a.activity}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{a.activity}</CardTitle>
                          <CardDescription>{a.lesson}</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="outline">1ª tentativa: {formatPct(a.firstScore)}</Badge>
                          <Badge variant="outline">Última: {formatPct(a.lastScore)}</Badge>
                          {a.improvement !== null && <Badge variant={a.improvement >= 0 ? 'success' : 'destructive'}>Evolução após feedback: {formatPp(a.improvement)}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ol className="relative space-y-4 border-l pl-5">
                        {a.attempts.map((t) => (
                          <li key={t.id} className="relative">
                            <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{t.attemptNumber}</span>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{t.attemptNumber === 1 ? 'Primeira resposta' : 'Resposta revisada'}</span>· {formatDateTime(t.createdAt)}
                              {t.evaluation && (
                                <>
                                  <Badge variant={t.evaluation.weightedScore >= a.passingScore ? 'success' : 'warning'}>{Math.round(t.evaluation.weightedScore)}%</Badge>
                                  <MasteryBadge level={t.evaluation.masteryLevel} />
                                  <Badge variant="muted">{t.evaluation.source}</Badge>
                                  {t.evaluation.requiresHumanReview && <Badge variant="destructive">revisão humana pendente</Badge>}
                                  {t.history > 1 && <Badge variant="outline">{t.history} avaliações (histórico)</Badge>}
                                </>
                              )}
                              <Link to={`/admin/assessments?submission=${t.id}`} className="font-medium text-primary hover:underline">
                                Revisar avaliação
                              </Link>
                            </div>
                            <p className="mt-1 whitespace-pre-line rounded-md bg-muted/40 p-3 text-sm">{t.content}</p>
                            {t.evaluation && (t.evaluation.strengths.length > 0 || t.evaluation.improvements.length > 0 || t.evaluation.socraticQuestion) && (
                              <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                                {t.evaluation.strengths.length > 0 && (
                                  <div className="rounded-md border border-success/30 bg-success/5 p-2">
                                    <p className="text-xs font-semibold text-success">Acertos</p>
                                    <ul className="list-disc pl-4">{t.evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                  </div>
                                )}
                                {t.evaluation.improvements.length > 0 && (
                                  <div className="rounded-md border border-warning/30 bg-warning/5 p-2">
                                    <p className="text-xs font-semibold text-warning">Melhorias</p>
                                    <ul className="list-disc pl-4">{t.evaluation.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                  </div>
                                )}
                                {t.evaluation.socraticQuestion && (
                                  <p className="rounded-md border p-2 md:col-span-2">
                                    <span className="text-xs font-semibold text-primary">Pergunta socrática: </span>
                                    {t.evaluation.socraticQuestion}
                                  </p>
                                )}
                                {t.evaluation.reviewNote && (
                                  <p className="rounded-md border p-2 md:col-span-2">
                                    <span className="text-xs font-semibold">Nota da revisão humana: </span>
                                    {t.evaluation.reviewNote}
                                  </p>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="assessments">
                <Card>
                  <CardContent className="divide-y p-0">
                    {!d.assessments.length && <EmptyState title="Nenhuma avaliação realizada" className="m-4" />}
                    {d.assessments.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ASSESSMENT_KIND_LABELS[a.kind as AssessmentKind]} · tentativa {a.attemptNumber} · {formatDateTime(a.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatPct(a.score)}</span>
                          {a.passed !== null && <Badge variant={a.passed ? 'success' : 'destructive'}>{a.passed ? 'Aprovado' : 'Abaixo da nota mínima'}</Badge>}
                          {a.kind === 'SATISFACTION' && <Badge variant="outline">autodeclarado</Badge>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <p className="mt-2 text-xs text-muted-foreground">Nível atual estimado: {levelLabel(enr?.currentLevel)}.</p>
              </TabsContent>
            </Tabs>
            <EnrollmentDialog open={allocate} onOpenChange={setAllocate} defaultUserIds={[userId]} />
            <EditUserDialog user={editing} onOpenChange={(o) => !o && setEditing(null)} />
          </div>
        );
      }}
    </QueryState>
  );
}
