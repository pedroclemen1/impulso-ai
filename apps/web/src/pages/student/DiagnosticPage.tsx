import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Clock, HeartHandshake, ListChecks, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LearningProfileView } from '@/features/student/LearningProfileView';
import { useAssessment, useCourseOverview, useInvalidateCourse } from '@/features/student/queries';
import { QuizRunner } from '@/features/student/QuizRunner';
import { api, errorMessage } from '@/lib/api';
import type { AnswerInput, LearningProfile, SubmitResult } from '@/types/student';

export default function DiagnosticPage() {
  const { courseId = '' } = useParams();
  const q = useAssessment(courseId, 'DIAGNOSTIC');
  const course = useCourseOverview(courseId);
  const invalidate = useInvalidateCourse();
  const [started, setStarted] = useState(false);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const draftKey = `diag-draft-${courseId}`;

  const submit = useMutation({
    mutationFn: (answers: AnswerInput[]) => api.post<SubmitResult>(`/assessments/${q.data!.assessment.id}/attempts`, { answers }),
    onSuccess: async (r) => {
      sessionStorage.removeItem(draftKey);
      setProfile(r.profile);
      await invalidate(courseId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Diagnóstico concluído! Sua trilha foi personalizada.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const title = course.data?.course.title ?? 'Curso';
  return (
    <div>
      <PageHeader
        title="Diagnóstico inicial"
        description="Entender seu ponto de partida para personalizar sua trilha."
        breadcrumbs={[{ label: 'Meus cursos', to: '/app/courses' }, { label: title, to: `/app/courses/${courseId}` }, { label: 'Diagnóstico' }]}
      />
      <QueryState query={q}>
        {(d) => {
          const stored = profile ?? d.attempts[0]?.result?.profile ?? null;
          if (stored) {
            return (
              <div className="space-y-6">
                <LearningProfileView profile={stored} />
                <div className="flex justify-end">
                  <Button asChild size="lg">
                    <Link to={`/app/courses/${courseId}`}>
                      Começar trilha <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          }
          if (d.access.locked) return <EmptyState icon={Lock} title="Diagnóstico indisponível" description={d.access.reason ?? ''} />;
          if (!started) {
            return (
              <Card className="mx-auto max-w-2xl space-y-6 p-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{d.assessment.title}</h2>
                  {d.assessment.description && <p className="text-sm text-muted-foreground">{d.assessment.description}</p>}
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <ListChecks className="h-5 w-5 shrink-0 text-primary" />
                    <span>
                      <strong>{d.assessment.questions.length} questões</strong> sobre familiaridade com IA, conhecimentos, situações práticas e seu contexto de trabalho.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-primary" /> Cerca de 10 minutos. Você pode voltar às questões anteriores antes de enviar.
                  </li>
                  <li className="flex gap-3">
                    <HeartHandshake className="h-5 w-5 shrink-0 text-primary" />
                    <span>
                      Não é uma prova eliminatória: o resultado personaliza a trilha e <strong>nunca</strong> bloqueia conteúdos. Nas perguntas de autopercepção não há resposta certa — seja sincero(a).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-success" /> Não inclua dados pessoais (seus ou de candidatos) nas respostas abertas.
                  </li>
                </ul>
                <Button size="lg" className="w-full" onClick={() => setStarted(true)}>
                  Começar diagnóstico <ArrowRight />
                </Button>
              </Card>
            );
          }
          return <QuizRunner assessment={d.assessment} draftKey={draftKey} submitting={submit.isPending} onSubmit={(a) => submit.mutate(a)} submitLabel="Concluir diagnóstico" />;
        }}
      </QueryState>
    </div>
  );
}
