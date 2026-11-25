import { prisma } from '../../../database/prisma';
import { notFound } from '../../../shared/errors';
import { asStringArray } from '../../../shared/http';
import { ai } from '../ai.client';
import type { InsightsInput } from '../inputs';
import { insightsPrompt } from '../prompts';
import { insightsSchema } from '../schemas';

/** Insights pedagógicos baseados exclusivamente em evidências registradas (sem dados pessoais sensíveis). */
export const PedagogicalInsightsService = {
  async buildInput(userId: string, enrollmentId?: string): Promise<InsightsInput> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound('Participante não encontrado');
    const enrollmentFilter = enrollmentId ? { id: enrollmentId, userId } : { userId, status: { not: 'CANCELLED' as const } };
    const enrollments = await prisma.enrollment.findMany({ where: enrollmentFilter, orderBy: { createdAt: 'desc' } });
    const ids = enrollments.map((e) => e.id);
    const [scores, submissions, attempts, tutorCount, progress, lessonCount] = await Promise.all([
      prisma.competencyScore.findMany({ where: { enrollmentId: { in: ids } }, include: { competency: true } }),
      prisma.activitySubmission.findMany({
        where: { enrollmentId: { in: ids } },
        include: { activity: { select: { title: true } }, evaluations: { where: { isCurrent: true }, take: 1 } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.assessmentAttempt.findMany({ where: { enrollmentId: { in: ids }, status: 'SUBMITTED' }, include: { assessment: { select: { kind: true, title: true } } } }),
      prisma.tutorMessage.count({ where: { role: 'STUDENT', conversation: { enrollmentId: { in: ids } } } }),
      prisma.learningProgress.count({ where: { enrollmentId: { in: ids }, status: 'COMPLETED' } }),
      prisma.lesson.count({ where: { module: { courseVersionId: { in: enrollments.map((e) => e.courseVersionId) } } } }),
    ]);
    const firstName = user.name.split(' ')[0];
    return {
      studentName: firstName,
      level: enrollments[0]?.initialLevel ?? null,
      currentLevel: enrollments[0]?.currentLevel ?? null,
      competencies: scores.map((s) => ({ name: s.competency.name, score: s.score, initialScore: s.initialScore, evidenceCount: s.evidenceCount })),
      evaluations: submissions
        .filter((s) => s.evaluations[0])
        .map((s) => ({
          activity: s.activity.title,
          attemptNumber: s.attemptNumber,
          score: s.evaluations[0].weightedScore,
          improvements: asStringArray(s.evaluations[0].improvements),
          strengths: asStringArray(s.evaluations[0].strengths),
        })),
      assessments: attempts.map((a) => ({ kind: a.assessment.kind, title: a.assessment.title, score: a.objectiveScore ?? a.overallScore })),
      tutorInteractions: tutorCount,
      lessonsCompleted: progress,
      totalLessons: lessonCount,
    };
  },

  async generate(userId: string, actorId: string, enrollmentId?: string) {
    const input = await this.buildInput(userId, enrollmentId);
    const { system, prompt } = insightsPrompt(input);
    const result = await ai.generateStructured(
      { operation: 'pedagogical_insights', system, prompt, schema: insightsSchema, input, temperature: 0.3 },
      { userId: actorId, allowFallback: true },
    );
    const evidenceCount = input.evaluations.length + input.assessments.filter((a) => a.score !== null).length;
    // Regra determinística: com poucas evidências, a suficiência nunca é declarada como completa.
    const dataSufficiency = evidenceCount < 2 ? 'INSUFFICIENT' : evidenceCount < 5 && result.data.dataSufficiency === 'SUFFICIENT' ? 'PARTIAL' : result.data.dataSufficiency;
    return { ...result.data, dataSufficiency, evidenceCount, provider: result.provider, fallback: result.fallback, generatedAt: new Date() };
  },
};
