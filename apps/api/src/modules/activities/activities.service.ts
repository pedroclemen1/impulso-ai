import type { EvaluationReviewInput } from '@impulso/shared';
import { prisma } from '../../database/prisma';
import { conflict, notFound } from '../../shared/errors';
import { asStringArray } from '../../shared/http';
import { looksLikePromptInjection, redactSensitiveData } from '../../shared/text';
import { ActivityEvaluationService } from '../ai/services/activity-evaluation.service';
import { recalculateEnrollment, touchEnrollment } from '../learning/engine';
import { computeWeightedScore, masteryFromWeighted } from './weighted-score';

export const ActivitiesService = {
  async submit(userId: string, activityId: string, rawContent: string) {
    const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { lesson: { include: { module: true } } } });
    if (!activity) throw notFound('Atividade não encontrada');
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseVersionId: activity.lesson.module.courseVersionId, status: { not: 'CANCELLED' } },
    });
    if (!enrollment) throw notFound('Atividade não encontrada');
    const diagnostic = await prisma.assessment.findFirst({ where: { courseVersionId: enrollment.courseVersionId, kind: 'DIAGNOSTIC' } });
    if (diagnostic && !(await prisma.assessmentAttempt.count({ where: { enrollmentId: enrollment.id, assessmentId: diagnostic.id, status: 'SUBMITTED' } }))) {
      throw conflict('Responda o diagnóstico inicial antes de realizar atividades.');
    }
    const previous = await prisma.activitySubmission.findMany({ where: { enrollmentId: enrollment.id, activityId }, orderBy: { attemptNumber: 'desc' } });
    if (previous.length >= activity.maxAttempts) throw conflict(`Você já utilizou as ${activity.maxAttempts} tentativas desta atividade.`);

    // LGPD: dados pessoais são removidos antes de persistir e de enviar à LLM.
    const { text: content, found } = redactSensitiveData(rawContent);
    const submission = await prisma.activitySubmission.create({
      data: {
        activityId,
        enrollmentId: enrollment.id,
        userId,
        attemptNumber: previous.length + 1,
        content,
        isRevision: previous.length > 0,
        previousSubmissionId: previous[0]?.id ?? null,
      },
    });
    const { evaluation, fallback } = await ActivityEvaluationService.evaluate(submission.id, userId);

    const conversation = await prisma.tutorConversation.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: activity.lessonId } },
      create: { enrollmentId: enrollment.id, lessonId: activity.lessonId, userId },
      update: {},
    });
    const strengths = asStringArray(evaluation.strengths);
    const improvements = asStringArray(evaluation.improvements);
    const feedback = [
      strengths.length ? `**O que você já fez bem:**\n${strengths.map((s) => `- ${s}`).join('\n')}` : '',
      improvements.length ? `**O que pode melhorar:**\n${improvements.map((s) => `- ${s}`).join('\n')}` : '',
      evaluation.socraticQuestion ? `**Para refletir:** ${evaluation.socraticQuestion}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    const now = Date.now();
    await prisma.tutorMessage.createMany({
      data: [
        { conversationId: conversation.id, role: 'STUDENT', kind: 'SUBMISSION', content, metadata: { submissionId: submission.id, attemptNumber: submission.attemptNumber }, createdAt: new Date(now) },
        {
          conversationId: conversation.id,
          role: 'TUTOR',
          kind: 'SOCRATIC_FEEDBACK',
          content: feedback || 'Recebi sua resposta. O que você acrescentaria para torná-la mais completa?',
          metadata: { submissionId: submission.id, evaluationId: evaluation.id, weightedScore: evaluation.weightedScore, fallback },
          createdAt: new Date(now + 1),
        },
      ],
    });
    await prisma.learningProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: activity.lessonId } },
      create: { enrollmentId: enrollment.id, lessonId: activity.lessonId, status: 'IN_PROGRESS', currentStage: 'REFLECT' },
      update: { currentStage: previous.length ? 'IMPROVE' : 'REFLECT' },
    });
    await touchEnrollment(enrollment.id, { lastLessonId: activity.lessonId, startedAt: enrollment.startedAt ?? new Date() });
    await recalculateEnrollment(enrollment.id);

    const warnings: string[] = [];
    if (found.length) warnings.push(`Removemos dados pessoais da sua resposta (${found.join(', ')}). Use sempre dados fictícios ou anonimizados.`);
    if (looksLikePromptInjection(rawContent)) warnings.push('Sua resposta contém instruções direcionadas ao avaliador; ela foi encaminhada para revisão humana.');
    if (fallback) warnings.push('O provedor de IA está indisponível: esta avaliação foi feita pelo avaliador demonstrativo e será revisada.');

    return {
      submission: { ...submission, evaluation },
      attemptsRemaining: activity.maxAttempts - submission.attemptNumber,
      passed: evaluation.weightedScore >= activity.passingScore,
      warnings,
    };
  },

  /** Revisão manual pelo administrador: cria nova avaliação HUMAN e preserva o histórico. */
  async review(submissionId: string, reviewerId: string, input: EvaluationReviewInput) {
    const submission = await prisma.activitySubmission.findUnique({
      where: { id: submissionId },
      include: { activity: { include: { rubric: { include: { criteria: true } } } }, evaluations: { where: { isCurrent: true }, take: 1 } },
    });
    if (!submission) throw notFound('Submissão não encontrada');
    const criteria = submission.activity.rubric?.criteria ?? [];
    const ids = new Set(criteria.map((c) => c.id));
    if (input.scores.some((s) => !ids.has(s.criterionId))) throw conflict('Critério não pertence à rubrica desta atividade');
    const computed = computeWeightedScore(
      criteria.map((c) => ({ id: c.id, key: c.key, weight: c.weight, maxScore: c.maxScore })),
      input.scores.map((s) => ({ criterionId: s.criterionId, score: (s.score / 100) * (criteria.find((c) => c.id === s.criterionId)?.maxScore ?? 100) })),
    );
    const current = submission.evaluations[0];
    const evaluation = await prisma.$transaction(async (tx) => {
      await tx.activityEvaluation.updateMany({ where: { submissionId, isCurrent: true }, data: { isCurrent: false } });
      return tx.activityEvaluation.create({
        data: {
          submissionId,
          source: 'HUMAN',
          weightedScore: computed.weightedScore,
          masteryLevel: masteryFromWeighted(computed.weightedScore),
          strengths: input.strengths ?? current?.strengths ?? [],
          improvements: input.improvements ?? current?.improvements ?? [],
          socraticQuestion: current?.socraticQuestion ?? '',
          hint: current?.hint ?? '',
          recommendedAction: current?.recommendedAction ?? '',
          requiresHumanReview: false,
          supersedesId: current?.id ?? null,
          reviewedById: reviewerId,
          reviewNote: input.reviewNote,
          scores: { create: input.scores.map((s) => ({ criterionId: s.criterionId, score: s.score, justification: s.justification })) },
        },
        include: { scores: { include: { criterion: true } } },
      });
    });
    await recalculateEnrollment(submission.enrollmentId);
    return evaluation;
  },
};
