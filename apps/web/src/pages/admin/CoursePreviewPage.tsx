import { ACTIVITY_TYPE_LABELS, KNOWLEDGE_LEVELS, type ActivityType } from '@impulso/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Briefcase, GraduationCap, Lightbulb, ListChecks, Rocket, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Markdown } from '@/components/common/Markdown';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import type { Activity, Lesson } from '@/types/admin';

interface Preview {
  lesson: Lesson & { module: { title: string; order: number }; activity: Activity | null };
  presentation: { showBeginnerSupport: boolean; showAdvancedDeepDive: boolean; showGuidedSteps: boolean; showAdvancedChallenge: boolean; languageLevel: string; explanation: string };
}

function Section({ icon: Icon, title, children, tone }: { icon: typeof BookOpen; title: string; children: React.ReactNode; tone?: string }) {
  return (
    <Card className={tone}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function CoursePreviewPage() {
  const { courseId = '', lessonId = '' } = useParams();
  const [level, setLevel] = useState('1');
  const q = useQuery({ queryKey: ['course-preview', courseId, lessonId, level], queryFn: () => api.get<Preview>(`/courses/${courseId}/preview/lessons/${lessonId}`, { level }) });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Visualizar como estudante"
        description="Veja como a aula é apresentada para cada nível de conhecimento. As regras de adaptação são determinísticas."
        breadcrumbs={[{ label: 'Cursos', to: '/admin/courses' }, { label: 'Editor', to: `/admin/courses/${courseId}/edit` }, { label: 'Pré-visualização' }]}
        actions={
          <Button variant="outline" asChild>
            <Link to={`/admin/courses/${courseId}/edit`}>
              <ArrowLeft /> Voltar ao editor
            </Link>
          </Button>
        }
      />
      <Tabs value={level} onValueChange={setLevel} className="mb-4">
        <TabsList>
          {([1, 2, 3, 4] as const).map((l) => (
            <TabsTrigger key={l} value={String(l)}>
              Nível {l} · {KNOWLEDGE_LEVELS[l].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QueryState query={q}>
        {({ lesson, presentation }) => (
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5 p-4 text-sm">
              <strong>Personalização para este nível:</strong> {presentation.explanation}
            </Card>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Módulo {lesson.module.order} · {lesson.module.title}
              </p>
              <h2 className="text-xl font-semibold">{lesson.title}</h2>
              {lesson.summary && <p className="text-sm text-muted-foreground">{lesson.summary}</p>}
            </div>
            <Section icon={BookOpen} title="1. Aprender">
              <Markdown>{lesson.learnContent}</Markdown>
            </Section>
            {presentation.showBeginnerSupport && lesson.beginnerSupport && (
              <Section icon={Lightbulb} title="Explicação introdutória (níveis 1–2)" tone="border-success/30 bg-success/5">
                <Markdown>{lesson.beginnerSupport}</Markdown>
              </Section>
            )}
            {presentation.showAdvancedDeepDive && lesson.advancedDeepDive && (
              <Section icon={Rocket} title="Aprofundamento (níveis 3–4)" tone="border-violet-300/50 bg-violet-50/50">
                <Markdown>{lesson.advancedDeepDive}</Markdown>
              </Section>
            )}
            <Section icon={Briefcase} title="2. Contextualizar">
              <Markdown>{lesson.contextContent}</Markdown>
            </Section>
            {lesson.activity ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4 text-primary" /> 3. Praticar — {lesson.activity.title}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary">{ACTIVITY_TYPE_LABELS[lesson.activity.type as ActivityType] ?? lesson.activity.type}</Badge> · até {lesson.activity.maxAttempts} tentativas · domínio a partir de {lesson.activity.passingScore}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Markdown>{lesson.activity.instructions}</Markdown>
                  {lesson.activity.scenario && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <Markdown>{lesson.activity.scenario}</Markdown>
                    </div>
                  )}
                  {presentation.showGuidedSteps && lesson.activity.guidedSteps.length > 0 && (
                    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                        <GraduationCap className="h-4 w-4" /> Passos guiados
                      </p>
                      <ol className="list-decimal space-y-1 pl-5 text-sm">
                        {lesson.activity.guidedSteps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {presentation.showAdvancedChallenge && lesson.activity.advancedChallenge && (
                    <div className="rounded-lg border border-violet-300/50 bg-violet-50/50 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                        <Sparkles className="h-4 w-4" /> Desafio avançado
                      </p>
                      <Markdown>{lesson.activity.advancedChallenge}</Markdown>
                    </div>
                  )}
                  {lesson.activity.rubric && (
                    <div>
                      <p className="mb-2 text-sm font-semibold">Critérios de avaliação</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {lesson.activity.rubric.criteria.map((c) => (
                          <li key={c.id} className="rounded-md border p-2 text-sm">
                            <span className="font-medium">{c.name}</span> <span className="text-xs text-muted-foreground">(peso {c.weight})</span>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Etapas 4–6 (Refletir, Aprimorar e Consolidar) ocorrem com o tutor socrático após a primeira resposta do participante.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-4 text-sm text-muted-foreground">Esta aula não possui atividade prática; o participante conclui com a reflexão.</Card>
            )}
            {lesson.reflectionPrompt && (
              <Section icon={Lightbulb} title="4. Refletir">
                <p className="text-sm">{lesson.reflectionPrompt}</p>
              </Section>
            )}
            {lesson.keyTakeaways.length > 0 && (
              <Section icon={GraduationCap} title="6. Consolidar — aprendizados-chave">
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {lesson.keyTakeaways.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}
