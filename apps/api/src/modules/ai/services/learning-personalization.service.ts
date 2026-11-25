import { prisma } from '../../../database/prisma';
import { notFound } from '../../../shared/errors';
import { resolveEnrollment } from '../../learning/engine';
import { ai } from '../ai.client';
import type { PersonalizedExampleInput } from '../inputs';
import { personalizedExamplePrompt } from '../prompts';
import { studentContext } from './context';

/**
 * Personalização com IA: gera um exemplo contextualizado ao cargo e ao nível do participante.
 * As decisões pedagógicas (o que mostrar, trilha, nível) ficam nas regras determinísticas de learning/personalization.
 */
export const LearningPersonalizationService = {
  async personalizedExample(userId: string, courseId: string, lessonId: string, regenerate = false) {
    const enrollment = await resolveEnrollment(userId, courseId);
    const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, module: { courseVersionId: enrollment.courseVersionId } } });
    if (!lesson) throw notFound('Aula não encontrada');
    const progress = await prisma.learningProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: { enrollmentId: enrollment.id, lessonId, status: 'IN_PROGRESS' },
      update: {},
    });
    if (progress.personalizedExample && !regenerate) return { content: progress.personalizedExample, cached: true, fallback: false };
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    const input: PersonalizedExampleInput = {
      lessonTitle: lesson.title,
      learnContent: lesson.learnContent,
      contextContent: lesson.contextContent,
      student: studentContext(enrollment.currentLevel ?? enrollment.initialLevel, profile),
    };
    const { system, messages } = personalizedExamplePrompt(input);
    const reply = await ai.generateChat({ operation: 'personalized_example', system, messages, input, maxTokens: 700 }, { userId, allowFallback: true });
    await prisma.learningProgress.update({ where: { id: progress.id }, data: { personalizedExample: reply.content } });
    return { content: reply.content, cached: false, fallback: reply.fallback };
  },
};
