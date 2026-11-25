import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma';
import { computeWeightedScore, masteryFromWeighted } from '../../activities/weighted-score';
import { ai, getAISettings } from '../ai.client';
import type { EvaluationInput } from '../inputs';
import { evaluationPrompt } from '../prompts';
import { evaluationOutputSchema } from '../schemas';
import { activityContext, lessonObjective, rubricContext, studentContext } from './context';

/**
 * Avalia uma submissão com a rubrica configurada. A LLM sugere notas por critério;
 * o backend valida a estrutura, ignora critérios desconhecidos e calcula a nota ponderada.
 */
export const ActivityEvaluationService = {
  async evaluate(submissionId: string, userId: string) {
    const submission = await prisma.activitySubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: {
        activity: { include: { lesson: true, rubric: { include: { criteria: { orderBy: { order: 'asc' } } } } } },
        enrollment: { include: { user: { include: { profile: true } } } },
      },
    });
    const { activity, enrollment } = submission;
    const criteria = activity.rubric?.criteria ?? [];
    const previous = submission.previousSubmissionId
      ? await prisma.activitySubmission.findUnique({ where: { id: submission.previousSubmissionId } })
      : null;

    const input: EvaluationInput = {
      lessonTitle: activity.lesson.title,
      lessonObjective: lessonObjective(activity.lesson),
      activity: activityContext(activity),
      rubric: rubricContext(activity.rubric),
      submission: submission.content,
      attemptNumber: submission.attemptNumber,
      previousSubmission: previous?.content ?? null,
      student: studentContext(enrollment.currentLevel ?? enrollment.initialLevel, enrollment.user.profile),
    };
    const { system, prompt } = evaluationPrompt(input);
    const result = await ai.generateStructured(
      { operation: 'activity_evaluation', system, prompt, schema: evaluationOutputSchema, input, temperature: 0.2 },
      { userId, allowFallback: true },
    );
    const settings = await getAISettings();
    const computed = computeWeightedScore(
      criteria.map((c) => ({ id: c.id, key: c.key, weight: c.weight, maxScore: c.maxScore })),
      result.data.scores,
    );
    const justifications = new Map(result.data.scores.map((s) => [s.criterionId, s.justification]));
    const requiresHumanReview =
      result.data.requiresHumanReview || result.fallback || computed.missingCriteria.length > 0 || computed.weightedScore < settings.humanReviewBelowScore;

    const evaluation = await prisma.$transaction(async (tx) => {
      await tx.activityEvaluation.updateMany({ where: { submissionId, isCurrent: true }, data: { isCurrent: false } });
      const ev = await tx.activityEvaluation.create({
        data: {
          submissionId,
          source: result.fallback ? 'FALLBACK' : result.provider === 'demo' ? 'DEMO' : 'AI',
          provider: result.provider,
          model: result.model,
          weightedScore: computed.weightedScore,
          masteryLevel: masteryFromWeighted(computed.weightedScore),
          strengths: result.data.strengths,
          improvements: result.data.improvements,
          socraticQuestion: result.data.socraticQuestion,
          hint: result.data.hint,
          recommendedAction: result.data.recommendedAction,
          requiresHumanReview,
          scores: {
            create: computed.criteria.map((c) => ({
              criterionId: c.criterionId,
              score: c.pct,
              justification: justifications.get(c.key) ?? (c.missing ? 'Critério não avaliado automaticamente.' : ''),
            })),
          },
        },
        include: { scores: { include: { criterion: true } } },
      });
      await tx.activitySubmission.update({ where: { id: submissionId }, data: { status: 'EVALUATED' } });
      return ev;
    });
    return { evaluation, fallback: result.fallback };
  },
};

export type EvaluationWithScores = Prisma.ActivityEvaluationGetPayload<{ include: { scores: { include: { criterion: true } } } }>;
