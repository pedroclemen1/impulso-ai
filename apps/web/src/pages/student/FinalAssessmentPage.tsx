import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Award, ClipboardCheck, Heart, Lock, MessageSquareHeart } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, LoadingState, QueryState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttemptsList, ResultHeader } from '@/features/student/AssessmentResult';
import { useAssessment, useCourseOverview, useInvalidateCourse } from '@/features/student/queries';
import { QuizReview, QuizRunner } from '@/features/student/QuizRunner';
import { ScoreMoments } from '@/features/student/ScoreMoments';
import { api, errorMessage } from '@/lib/api';
import type { AnswerInput, SubmitResult } from '@/types/student';

function SatisfactionSurvey({ courseId }: { courseId: string }) {
  const q = useAssessment(courseId, 'SATISFACTION');
  const invalidate = useInvalidateCourse();
  const [started, setStarted] = useState(false);
  const submit = useMutation({
    mutationFn: (answers: AnswerInput[]) => api.post<SubmitResult>(`/assessments/${q.data!.assessment.id}/attempts`, { answers }),
    onSuccess: async () => {
      toast.success('Obrigado pela sua avaliação!');
      await invalidate(courseId);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (q.isLoading) return <LoadingState rows={1} />;
  if (q.error || !q.data) return null;
  const d = q.data;
  if (d.attempts.length > 0 || submit.isSuccess) {
    return (
      <Card className="flex items-center gap-3 p-5">
        <Heart className="h-5 w-5 text-rose-500" />
        <p className="text-sm">Você já respondeu a pesquisa de satisfação. Obrigado por contribuir com a melhoria do curso!</p>
      </Card>
    );
  }
  if (d.access.locked) return null;
  if (!started) {
    return (
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <MessageSquareHeart className="h-8 w-8 shrink-0 text-rose-500" />
        <div className="flex-1">
          <p className="font-semibold">Pesquisa de satisfação</p>
          <p className="text-sm text-muted-foreground">
            Conte como foi sua experiência e o quanto você conseguirá aplicar o conteúdo no trabalho. São respostas autodeclaradas, analisadas de forma agregada e nunca exibidas a outros participantes.
          </p>
        </div>
        <Button onClick={() => setStarted(true)}>Responder (2 min)</Button>
      </Card>
    );
  }
  return <QuizRunner assessment={d.assessment} submitting={submit.isPending} onSubmit={(a) => submit.mutate(a)} submitLabel="Enviar pesquisa" />;
}

export default function FinalAssessmentPage() {
  const { courseId = '' } = useParams();
  const [params] = useSearchParams();
  const q = useAssessment(courseId, 'FINAL');
  const course = useCourseOverview(courseId);
  const invalidate = useInvalidateCourse();
  const [result, setResult] = useState<{ r: SubmitResult; answers: AnswerInput[] } | null>(null);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const surveyOnly = params.get('survey') === '1';

  const submit = useMutation({
    mutationFn: (answers: AnswerInput[]) => api.post<SubmitResult>(`/assessments/${q.data!.assessment.id}/attempts`, { answers }).then((r) => ({ r, answers })),
    onSuccess: async (res) => {
      setResult(res);
      setRunning(false);
      await invalidate(courseId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (res.r.attempt.passed) toast.success('Parabéns! Você foi aprovado(a) na avaliação final.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const c = course.data;
  const passed = !!result?.r.attempt.passed || !!c?.finalAssessment?.passed;
  const evolution = c && (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sua evolução no curso</CardTitle>
      </CardHeader>
      <CardContent>
        <ScoreMoments initial={c.enrollment.initialScore} during={c.enrollment.duringScore} final={c.enrollment.finalScore} />
        <p className="mt-3 text-xs text-muted-foreground">A comparação usa a parte objetiva do diagnóstico e da avaliação final, na mesma escala (0–100) e com as mesmas competências.</p>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={surveyOnly ? 'Pesquisa de satisfação' : 'Avaliação final'}
        breadcrumbs={[{ label: 'Meus cursos', to: '/app/courses' }, { label: c?.course.title ?? 'Curso', to: `/app/courses/${courseId}` }, { label: surveyOnly ? 'Satisfação' : 'Avaliação final' }]}
      />
      {surveyOnly ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <SatisfactionSurvey courseId={courseId} />
        </div>
      ) : (
        <QueryState query={q}>
          {(d) => {
            if (running) return <QuizRunner key={round} assessment={d.assessment} submitting={submit.isPending} onSubmit={(a) => submit.mutate(a)} submitLabel="Enviar avaliação final" />;
            return (
              <div className="mx-auto max-w-3xl space-y-5">
                {result ? (
                  <>
                    <ResultHeader
                      result={result.r}
                      onRetry={
                        result.r.attempt.passed
                          ? undefined
                          : () => {
                              setResult(null);
                              setRound((r) => r + 1);
                              setRunning(true);
                            }
                      }
                    />
                    {evolution}
                  </>
                ) : passed ? (
                  evolution
                ) : d.access.locked ? (
                  <EmptyState icon={Lock} title="Avaliação final bloqueada" description={d.access.reason ?? ''} action={<Button asChild variant="outline"><Link to={`/app/courses/${courseId}`}>Voltar à trilha</Link></Button>} />
                ) : (
                  <Card className="space-y-4 p-6">
                    <ClipboardCheck className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{d.assessment.title}</p>
                      {d.assessment.description && <p className="text-sm text-muted-foreground">{d.assessment.description}</p>}
                    </div>
                    <p className="text-sm">
                      {d.assessment.questions.length} questões cobrindo todas as competências do curso · nota mínima {d.assessment.passingScore}% · tentativa {d.access.attemptsUsed + 1} de {d.assessment.maxAttempts}.
                    </p>
                    <Button onClick={() => setRunning(true)}>
                      Iniciar avaliação final <ArrowRight />
                    </Button>
                  </Card>
                )}

                {passed && c?.progress.completed && (
                  <Card className="flex flex-col gap-4 border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center">
                    <Award className="h-8 w-8 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-semibold">Curso concluído — seu certificado está disponível!</p>
                      <p className="text-sm text-muted-foreground">Ele registra a carga horária, a versão do curso e sua nota final.</p>
                    </div>
                    <Button asChild>
                      <Link to="/app/certificates">Ver certificado</Link>
                    </Button>
                  </Card>
                )}
                {passed && !c?.progress.completed && c && c.progress.unmet.length > 0 && (
                  <Card className="p-4 text-sm">Para concluir o curso, ainda falta: {c.progress.unmet.join('; ')}.</Card>
                )}
                {passed && c?.progress.completed && <SatisfactionSurvey courseId={courseId} />}

                {result?.r.review && <QuizReview assessment={d.assessment} review={result.r.review} answers={result.answers} />}
                <AttemptsList attempts={d.attempts} passingScore={d.assessment.passingScore} />
              </div>
            );
          }}
        </QueryState>
      )}
    </div>
  );
}
