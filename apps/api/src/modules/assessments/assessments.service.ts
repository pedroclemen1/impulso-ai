import { DIAGNOSTIC_DIMENSIONS, levelLabel, type AssessmentSubmitInput, type KnowledgeLevel, type QuestionType } from '@impulso/shared';
import type { AssessmentKind, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { Actor } from '../../shared/authorization';
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors';
import { round } from '../../shared/http';
import { redactSensitiveData } from '../../shared/text';
import { loadStructure, recalculateEnrollment, resolveEnrollment } from '../learning/engine';
import { lessonPresentation, recommendedPath } from '../learning/personalization';
import { computeProgress } from '../learning/progress';
import { classifyDiagnostic, scoreAttempt, type ScorableQuestion } from './scoring';

const assessmentInclude = {
  questions: { orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } }, competency: true } },
} satisfies Prisma.AssessmentInclude;

type FullAssessment = Prisma.AssessmentGetPayload<{ include: typeof assessmentInclude }>;

const toScorable = (a: FullAssessment): ScorableQuestion[] =>
  a.questions.map((q) => ({
    id: q.id,
    type: q.type as QuestionType,
    points: q.points,
    isScored: q.isScored,
    selfReported: q.selfReported,
    competencyId: q.competencyId,
    dimension: q.dimension,
    options: q.options.map((o) => ({ id: o.id, label: o.label, isCorrect: o.isCorrect, score: o.score })),
  }));

/** Versão segura para o estudante: sem gabarito, pontuações parciais ou explicações. */
export function sanitizeAssessment(a: FullAssessment) {
  return {
    id: a.id,
    kind: a.kind,
    title: a.title,
    description: a.description,
    moduleId: a.moduleId,
    passingScore: a.passingScore,
    maxAttempts: a.maxAttempts,
    questions: a.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      helpText: q.helpText && !['SATISFACAO', 'APLICABILIDADE'].includes(q.helpText) ? q.helpText : null,
      dimension: q.dimension,
      dimensionLabel: q.dimension ? DIAGNOSTIC_DIMENSIONS[q.dimension as keyof typeof DIAGNOSTIC_DIMENSIONS] ?? null : null,
      competency: q.competency ? { id: q.competency.id, name: q.competency.name } : null,
      likertLabels: q.likertLabels,
      options: q.options.map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

export interface AccessState {
  locked: boolean;
  reason: string | null;
}

/** Regras de liberação das avaliações. O diagnóstico é sempre o primeiro passo do curso. */
export async function assessmentAccess(enrollmentId: string, assessment: { id: string; kind: AssessmentKind; moduleId: string | null; maxAttempts: number }): Promise<AccessState & { attemptsUsed: number }> {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } });
  const attemptsUsed = await prisma.assessmentAttempt.count({ where: { enrollmentId, assessmentId: assessment.id, status: 'SUBMITTED' } });
  const base = { attemptsUsed };
  if (enrollment.status === 'CANCELLED') return { ...base, locked: true, reason: 'Alocação cancelada.' };
  if (attemptsUsed >= assessment.maxAttempts) return { ...base, locked: true, reason: 'Você já utilizou todas as tentativas disponíveis.' };
  if (assessment.kind === 'DIAGNOSTIC') return { ...base, locked: false, reason: null };

  const diagnostic = await prisma.assessment.findFirst({ where: { courseVersionId: enrollment.courseVersionId, kind: 'DIAGNOSTIC' } });
  if (diagnostic) {
    const done = await prisma.assessmentAttempt.count({ where: { enrollmentId, assessmentId: diagnostic.id, status: 'SUBMITTED' } });
    if (!done) return { ...base, locked: true, reason: 'Responda primeiro o diagnóstico inicial.' };
  }
  const { version, structure } = await loadStructure(enrollment.courseVersionId);
  const completed = new Set(
    (await prisma.learningProgress.findMany({ where: { enrollmentId, status: 'COMPLETED' }, select: { lessonId: true } })).map((p) => p.lessonId),
  );
  if (assessment.kind === 'MODULE_QUIZ') {
    const mod = version.modules.find((m) => m.id === assessment.moduleId);
    if (mod && !mod.lessons.every((l) => completed.has(l.id))) return { ...base, locked: true, reason: 'Conclua todas as aulas do módulo para liberar a avaliação.' };
  }
  if (assessment.kind === 'FINAL') {
    const quizAttempts = await prisma.assessmentAttempt.findMany({
      where: { enrollmentId, status: 'SUBMITTED', assessment: { kind: 'MODULE_QUIZ' } },
      select: { assessmentId: true, passed: true },
    });
    const progress = computeProgress(
      structure,
      {
        completedLessonIds: completed,
        attemptedQuizIds: new Set(quizAttempts.map((a) => a.assessmentId)),
        passedQuizIds: new Set(quizAttempts.filter((a) => a.passed).map((a) => a.assessmentId)),
        finalPassed: false,
        finalAttempted: false,
      },
      version.completionCriteria,
    );
    if (!progress.finalUnlocked) return { ...base, locked: true, reason: 'Conclua as aulas e as avaliações de módulo para liberar a avaliação final.' };
  }
  if (assessment.kind === 'SATISFACTION' && enrollment.status !== 'COMPLETED') {
    return { ...base, locked: true, reason: 'A pesquisa de satisfação é liberada após a conclusão do curso.' };
  }
  return { ...base, locked: false, reason: null };
}

export async function getStudentAssessment(actor: Actor, courseId: string, kind: AssessmentKind, moduleId?: string) {
  const enrollment = await resolveEnrollment(actor.id, courseId);
  const assessment = await prisma.assessment.findFirst({
    where: { courseVersionId: enrollment.courseVersionId, kind, ...(kind === 'MODULE_QUIZ' ? { moduleId } : {}) },
    include: assessmentInclude,
  });
  if (!assessment) throw notFound('Avaliação não encontrada');
  const access = await assessmentAccess(enrollment.id, assessment);
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { enrollmentId: enrollment.id, assessmentId: assessment.id, status: 'SUBMITTED' },
    orderBy: { attemptNumber: 'asc' },
    select: { id: true, attemptNumber: true, objectiveScore: true, selfReportScore: true, overallScore: true, passed: true, level: true, submittedAt: true, result: true },
  });
  return { enrollmentId: enrollment.id, assessment: sanitizeAssessment(assessment), access, attempts };
}

/** Monta o perfil de aprendizagem apresentado ao final do diagnóstico. */
async function buildLearningProfile(courseVersionId: string, level: KnowledgeLevel, perCompetency: Map<string, { score: number }>, rationale: string[]) {
  const { version } = await loadStructure(courseVersionId);
  const competencies = await prisma.competency.findMany({ where: { courseVersions: { some: { courseVersionId } } } });
  const scoreOf = new Map([...perCompetency.entries()].map(([k, v]) => [k, v.score]));
  const known = competencies.filter((c) => (scoreOf.get(c.id) ?? -1) >= 70);
  const gaps = competencies.filter((c) => scoreOf.has(c.id) && scoreOf.get(c.id)! < 50);
  const path = recommendedPath(
    version.modules.map((m) => ({
      moduleId: m.id,
      title: m.title,
      order: m.order,
      competencyIds: [...new Set(m.lessons.flatMap((l) => l.competencies.map((c) => c.competencyId)))],
    })),
    scoreOf,
    level,
  );
  const presentation = lessonPresentation(level);
  const recommendations = [
    presentation.explanation,
    ...gaps.map((g) => `Dedique atenção extra a "${g.name}" — use as pistas do tutor e revise suas respostas após o feedback.`),
    level <= 2 ? 'Avance no seu ritmo: cada aula tem passos guiados e o tutor está disponível para dúvidas.' : 'Aproveite os desafios avançados para aplicar a IA em fluxos de trabalho completos.',
  ];
  return {
    level,
    levelLabel: levelLabel(level),
    rationale,
    knowledgeIdentified: known.map((c) => ({ id: c.id, name: c.name, score: round(scoreOf.get(c.id)!) })),
    gaps: gaps.map((c) => ({ id: c.id, name: c.name, score: round(scoreOf.get(c.id)!) })),
    competenciesToDevelop: competencies.map((c) => ({ id: c.id, name: c.name, score: scoreOf.has(c.id) ? round(scoreOf.get(c.id)!) : null })),
    recommendations,
    path,
  };
}

export async function submitAttempt(actor: Actor, assessmentId: string, input: AssessmentSubmitInput) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { ...assessmentInclude, courseVersion: true } });
  if (!assessment) throw notFound('Avaliação não encontrada');
  if (actor.role !== 'STUDENT') throw forbidden('Apenas participantes realizam avaliações');
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: actor.id, courseVersionId: assessment.courseVersionId, status: { not: 'CANCELLED' } },
  });
  if (!enrollment) throw notFound('Avaliação não encontrada');
  const access = await assessmentAccess(enrollment.id, assessment);
  if (access.locked) throw conflict(access.reason ?? 'Avaliação indisponível');

  const questionIds = new Set(assessment.questions.map((q) => q.id));
  for (const a of input.answers) {
    if (!questionIds.has(a.questionId)) throw badRequest('Resposta para questão inexistente');
    const q = assessment.questions.find((x) => x.id === a.questionId)!;
    const optionIds = new Set(q.options.map((o) => o.id));
    if ((a.selectedOptionIds ?? []).some((id) => !optionIds.has(id))) throw badRequest('Alternativa inválida');
  }
  const missing = assessment.questions.filter((q) => q.type !== 'OPEN' && q.isScored && !input.answers.some((a) => a.questionId === q.id));
  if (missing.length) throw badRequest(`Responda todas as questões obrigatórias (${missing.length} pendente(s)).`);

  const scorable = toScorable(assessment);
  const result = scoreAttempt(scorable, input.answers);
  const scenarioScores = assessment.questions
    .filter((q) => q.type === 'SCENARIO' && !q.selfReported)
    .map((q) => result.perQuestion.get(q.id)?.score)
    .filter((s): s is number => typeof s === 'number');
  const scenarioScore = scenarioScores.length ? scenarioScores.reduce((a, b) => a + b, 0) / scenarioScores.length : null;

  const isDiagnostic = assessment.kind === 'DIAGNOSTIC';
  const classification = isDiagnostic
    ? classifyDiagnostic({ objectiveScore: result.objectiveScore, selfReportScore: result.selfReportScore, scenarioScore })
    : null;
  const passed = isDiagnostic || assessment.kind === 'SATISFACTION' ? null : (result.overallScore ?? 0) >= assessment.passingScore;
  const perCompetency = Object.fromEntries([...result.perCompetency.entries()].map(([k, v]) => [k, round(v.score)]));
  const profile = classification ? await buildLearningProfile(assessment.courseVersionId, classification.level, result.perCompetency, classification.rationale) : null;

  const attempt = await prisma.$transaction(async (tx) => {
    const attemptNumber = access.attemptsUsed + 1;
    const created = await tx.assessmentAttempt.create({
      data: {
        assessmentId,
        enrollmentId: enrollment.id,
        userId: actor.id,
        attemptNumber,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        objectiveScore: result.objectiveScore === null ? null : round(result.objectiveScore),
        selfReportScore: result.selfReportScore === null ? null : round(result.selfReportScore),
        overallScore: result.overallScore === null ? null : round(result.overallScore),
        passed,
        level: classification?.level ?? null,
        result: { perCompetency, scenarioScore, profile } as Prisma.InputJsonValue,
        answers: {
          create: input.answers.map((a) => {
            const s = result.perQuestion.get(a.questionId);
            return {
              questionId: a.questionId,
              selectedOptionIds: a.selectedOptionIds ?? [],
              likertValue: a.likertValue ?? null,
              booleanValue: a.booleanValue ?? null,
              textAnswer: a.textAnswer ? redactSensitiveData(a.textAnswer).text : null,
              score: s?.score ?? null,
              isCorrect: s?.isCorrect ?? null,
            };
          }),
        },
      },
    });
    if (isDiagnostic && classification) {
      const openByDim = (dim: string) => {
        const q = assessment.questions.find((x) => x.dimension === dim && x.type === 'OPEN');
        const t = q ? input.answers.find((a) => a.questionId === q.id)?.textAnswer : undefined;
        return t ? redactSensitiveData(t).text.slice(0, 2000) : undefined;
      };
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          initialLevel: classification.level,
          currentLevel: classification.level,
          initialScore: result.objectiveScore === null ? null : round(result.objectiveScore),
          startedAt: enrollment.startedAt ?? new Date(),
          lastActivityAt: new Date(),
        },
      });
      const profileData = {
        knowledgeLevel: classification.level,
        ...(openByDim('ACTIVITIES') ? { professionalContext: openByDim('ACTIVITIES') } : {}),
        ...(openByDim('CHALLENGES') ? { challenges: openByDim('CHALLENGES') } : {}),
      };
      await tx.studentProfile.upsert({ where: { userId: actor.id }, create: { userId: actor.id, ...profileData }, update: profileData });
    } else {
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { lastActivityAt: new Date(), startedAt: enrollment.startedAt ?? new Date() } });
    }
    return created;
  });

  await recalculateEnrollment(enrollment.id);

  // Correção comentada para avaliações de aprendizagem (o diagnóstico e a satisfação não exibem gabarito).
  const review =
    assessment.kind === 'MODULE_QUIZ' || assessment.kind === 'FINAL'
      ? assessment.questions.map((q) => ({
          questionId: q.id,
          score: result.perQuestion.get(q.id)?.score ?? null,
          isCorrect: result.perQuestion.get(q.id)?.isCorrect ?? null,
          correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
          explanation: q.explanation,
        }))
      : null;

  return {
    attempt: {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      objectiveScore: attempt.objectiveScore,
      selfReportScore: attempt.selfReportScore,
      overallScore: attempt.overallScore,
      passed: attempt.passed,
      level: attempt.level,
    },
    passingScore: assessment.passingScore,
    attemptsRemaining: assessment.maxAttempts - attempt.attemptNumber,
    profile,
    review,
  };
}

/** Detalhe de uma tentativa (próprio estudante ou administrador). */
export async function getAttemptDetail(actor: Actor, attemptId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { include: assessmentInclude },
      answers: true,
      user: { select: { id: true, name: true } },
    },
  });
  if (!attempt || (actor.role === 'STUDENT' && attempt.userId !== actor.id)) throw notFound('Tentativa não encontrada');
  const showKey = actor.role === 'SUPER_ADMIN' || attempt.assessment.kind === 'MODULE_QUIZ' || attempt.assessment.kind === 'FINAL';
  return {
    ...attempt,
    assessment: showKey ? attempt.assessment : sanitizeAssessment(attempt.assessment),
  };
}
