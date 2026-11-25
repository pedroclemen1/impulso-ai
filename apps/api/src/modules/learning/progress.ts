import { completionCriteriaSchema, type CompletionCriteria } from '@impulso/shared';

export interface CourseStructure {
  lessons: { id: string; moduleId: string; hasActivity: boolean }[];
  moduleQuizzes: { assessmentId: string; moduleId: string }[];
  hasFinalAssessment: boolean;
}

export interface LearnerState {
  completedLessonIds: Set<string>;
  passedQuizIds: Set<string>;
  attemptedQuizIds: Set<string>;
  finalPassed: boolean;
  finalAttempted: boolean;
}

export const parseCriteria = (raw: unknown): CompletionCriteria => completionCriteriaSchema.parse(raw ?? {});

/**
 * Progresso = unidades efetivamente concluídas ÷ unidades obrigatórias.
 * Unidades: cada aula (concluída apenas com atividade avaliada + consolidação), cada avaliação de módulo
 * (realizada) e a avaliação final (aprovada). Páginas visitadas não contam.
 */
export function computeProgress(structure: CourseStructure, state: LearnerState, criteriaRaw?: unknown) {
  const criteria = parseCriteria(criteriaRaw);
  const lessonsDone = structure.lessons.filter((l) => state.completedLessonIds.has(l.id)).length;
  const quizzesRequired = criteria.requireModuleQuizzes ? structure.moduleQuizzes : [];
  const quizzesDone = quizzesRequired.filter((q) => state.attemptedQuizIds.has(q.assessmentId)).length;
  const finalRequired = criteria.requireFinalAssessment && structure.hasFinalAssessment;
  const total = structure.lessons.length + quizzesRequired.length + (finalRequired ? 1 : 0);
  const done = lessonsDone + quizzesDone + (finalRequired && state.finalPassed ? 1 : 0);
  const percent = total ? Math.round((done / total) * 1000) / 10 : 0;

  const lessonPct = structure.lessons.length ? (lessonsDone / structure.lessons.length) * 100 : 100;
  const lessonsOk = lessonPct >= criteria.minLessonCompletion;
  const quizzesOk = quizzesDone === quizzesRequired.length;
  const finalOk = !finalRequired || state.finalPassed;
  const unmet: string[] = [];
  if (!lessonsOk) unmet.push(`Concluir ao menos ${criteria.minLessonCompletion}% das aulas`);
  if (!quizzesOk) unmet.push('Realizar todas as avaliações de módulo');
  if (!finalOk) unmet.push(`Ser aprovado(a) na avaliação final (mínimo ${criteria.finalAssessmentPassingScore}%)`);

  return {
    percent,
    lessonsDone,
    totalLessons: structure.lessons.length,
    quizzesDone,
    totalQuizzes: quizzesRequired.length,
    completed: lessonsOk && quizzesOk && finalOk,
    /** A avaliação final só é liberada após as aulas e avaliações de módulo. */
    finalUnlocked: lessonsOk && quizzesOk,
    unmet,
    criteria,
  };
}

/**
 * Regra de conclusão de uma aula: se houver atividade, ela precisa ter ao menos uma tentativa avaliada
 * e a aprendizagem precisa ser consolidada (com reflexão registrada).
 */
export function isLessonComplete(args: { hasActivity: boolean; evaluatedSubmissions: number; consolidated: boolean; reflection?: string | null }) {
  const reflectionOk = !!args.reflection && args.reflection.trim().length >= 10;
  if (args.hasActivity) return args.evaluatedSubmissions > 0 && args.consolidated && reflectionOk;
  return args.consolidated && reflectionOk;
}
