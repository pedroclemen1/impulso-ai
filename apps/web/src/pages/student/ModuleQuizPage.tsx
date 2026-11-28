import { useMutation } from '@tanstack/react-query';
import { ArrowRight, FileQuestion, Lock } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AttemptsList, ResultHeader } from '@/features/student/AssessmentResult';
import { useAssessment, useCourseOverview, useInvalidateCourse } from '@/features/student/queries';
import { QuizReview, QuizRunner } from '@/features/student/QuizRunner';
import { api, errorMessage } from '@/lib/api';
import type { AnswerInput, SubmitResult } from '@/types/student';

export default function ModuleQuizPage() {
  const { courseId = '', moduleId = '' } = useParams();
  const q = useAssessment(courseId, 'MODULE_QUIZ', moduleId);
  const course = useCourseOverview(courseId);
  const invalidate = useInvalidateCourse();
  const [result, setResult] = useState<{ r: SubmitResult; answers: AnswerInput[] } | null>(null);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);

  const submit = useMutation({
    mutationFn: (answers: AnswerInput[]) => api.post<SubmitResult>(`/assessments/${q.data!.assessment.id}/attempts`, { answers }).then((r) => ({ r, answers })),
    onSuccess: async (res) => {
      setResult(res);
      setRunning(false);
      await invalidate(courseId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const mod = course.data?.modules.find((m) => m.id === moduleId);
  const nextModule = course.data?.modules.find((m) => mod && m.order === mod.order + 1);
  return (
    <div>
      <PageHeader
        title={q.data?.assessment.title ?? 'Avaliação do módulo'}
        description={mod ? `Módulo ${mod.order}: ${mod.title}` : undefined}
        breadcrumbs={[{ label: 'Meus cursos', to: '/app/courses' }, { label: course.data?.course.title ?? 'Curso', to: `/app/courses/${courseId}` }, { label: 'Avaliação do módulo' }]}
      />
      <QueryState query={q}>
        {(d) => {
          if (result) {
            return (
              <div className="mx-auto max-w-3xl space-y-5">
                <ResultHeader
                  result={result.r}
                  onRetry={() => {
                    setResult(null);
                    setRound((r) => r + 1);
                    setRunning(true);
                  }}
                />
                {result.r.review && <QuizReview assessment={d.assessment} review={result.r.review} answers={result.answers} />}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/app/courses/${courseId}`}>Voltar à trilha</Link>
                  </Button>
                  {course.data?.next && (
                    <Button asChild>
                      <Link to={course.data.next.path}>
                        {nextModule ? 'Continuar para o próximo módulo' : 'Próximo passo'} <ArrowRight />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          }
          if (running) return <QuizRunner key={round} assessment={d.assessment} submitting={submit.isPending} onSubmit={(a) => submit.mutate(a)} />;
          return (
            <div className="mx-auto max-w-2xl space-y-4">
              {d.access.locked ? (
                <EmptyState icon={Lock} title="Avaliação indisponível" description={d.access.reason ?? ''} action={<Button asChild variant="outline"><Link to={`/app/courses/${courseId}`}>Voltar à trilha</Link></Button>} />
              ) : (
                <Card className="space-y-4 p-6">
                  <FileQuestion className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-lg font-semibold">{d.assessment.title}</p>
                    {d.assessment.description && <p className="text-sm text-muted-foreground">{d.assessment.description}</p>}
                  </div>
                  <p className="text-sm">
                    {d.assessment.questions.length} questões · nota mínima {d.assessment.passingScore}% · tentativa {d.access.attemptsUsed + 1} de {d.assessment.maxAttempts}. Ao final você verá a correção comentada.
                  </p>
                  <Button onClick={() => setRunning(true)}>
                    Iniciar avaliação <ArrowRight />
                  </Button>
                </Card>
              )}
              <AttemptsList attempts={d.attempts} passingScore={d.assessment.passingScore} />
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
