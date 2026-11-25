import { prisma } from '../../../database/prisma';
import { conflict, notFound } from '../../../shared/errors';
import { asStringArray } from '../../../shared/http';
import { looksLikePromptInjection, redactSensitiveData } from '../../../shared/text';
import { resolveEnrollment, touchEnrollment } from '../../learning/engine';
import { ai, getAISettings } from '../ai.client';
import type { TutorChatInput } from '../inputs';
import { solutionPrompt, tutorChatPrompt } from '../prompts';
import { activityContext, lessonObjective, rubricContext, studentContext } from './context';

const HISTORY_WINDOW = 12;

/** Carrega (ou cria) a conversa do estudante na aula — sempre isolada por matrícula. */
async function loadContext(userId: string, courseId: string, lessonId: string) {
  const enrollment = await resolveEnrollment(userId, courseId);
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseVersionId: enrollment.courseVersionId } },
    include: { activity: { include: { rubric: { include: { criteria: { orderBy: { order: 'asc' } } } } } } },
  });
  if (!lesson) throw notFound('Aula não encontrada');
  const conversation = await prisma.tutorConversation.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    create: { enrollmentId: enrollment.id, lessonId, userId },
    update: {},
  });
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  const progress = await prisma.learningProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    create: { enrollmentId: enrollment.id, lessonId, status: 'IN_PROGRESS' },
    update: {},
  });
  const submissions = lesson.activity
    ? await prisma.activitySubmission.findMany({
        where: { enrollmentId: enrollment.id, activityId: lesson.activity.id },
        orderBy: { attemptNumber: 'asc' },
        include: { evaluations: { where: { isCurrent: true }, take: 1 } },
      })
    : [];
  return { enrollment, lesson, conversation, profile, progress, submissions };
}

export async function tutorState(userId: string, courseId: string, lessonId: string) {
  const ctx = await loadContext(userId, courseId, lessonId);
  const settings = await getAISettings();
  const studentMessages = await prisma.tutorMessage.count({ where: { conversationId: ctx.conversation.id, role: 'STUDENT', kind: 'MESSAGE' } });
  const last = ctx.submissions[ctx.submissions.length - 1];
  const lastScore = last?.evaluations[0]?.weightedScore ?? null;
  const authoredHints = asStringArray(ctx.lesson.activity?.hints);
  const maxHints = Math.min(settings.tutorMaxHints, Math.max(authoredHints.length, 1));
  const solutionAllowed =
    !!ctx.lesson.activity &&
    ctx.submissions.length > 0 &&
    (ctx.submissions.length >= settings.tutorAttemptsBeforeSolution ||
      ctx.progress.hintsUsed >= maxHints ||
      (lastScore !== null && lastScore >= ctx.lesson.activity.passingScore) ||
      ctx.submissions.length >= ctx.lesson.activity.maxAttempts);
  return {
    ...ctx,
    state: {
      conversationId: ctx.conversation.id,
      attemptCount: ctx.submissions.length,
      maxAttempts: ctx.lesson.activity?.maxAttempts ?? 0,
      hintsUsed: ctx.progress.hintsUsed,
      maxHints,
      solutionAllowed,
      solutionRevealed: ctx.progress.solutionRevealed,
      messagesUsed: studentMessages,
      messagesLimit: settings.tutorMaxMessagesPerLesson,
      attemptsBeforeSolution: settings.tutorAttemptsBeforeSolution,
    },
  };
}

export const SocraticTutorService = {
  async getConversation(userId: string, courseId: string, lessonId: string) {
    const { state, conversation } = await tutorState(userId, courseId, lessonId);
    const messages = await prisma.tutorMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: 'asc' } });
    return { state, messages };
  },

  async sendMessage(userId: string, courseId: string, lessonId: string, rawContent: string) {
    const ctx = await tutorState(userId, courseId, lessonId);
    const settings = await getAISettings();
    if (ctx.state.messagesUsed >= ctx.state.messagesLimit) {
      throw conflict('Limite de mensagens desta aula atingido. Consolide sua aprendizagem ou revise sua resposta.');
    }
    const { text: content, found } = redactSensitiveData(rawContent);
    const studentMsg = await prisma.tutorMessage.create({
      data: { conversationId: ctx.conversation.id, role: 'STUDENT', kind: 'MESSAGE', content, metadata: found.length ? { redacted: found } : undefined },
    });

    const history = await prisma.tutorMessage.findMany({
      where: { conversationId: ctx.conversation.id, kind: { in: ['MESSAGE', 'SOCRATIC_FEEDBACK', 'HINT'] } },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_WINDOW,
    });
    const last = ctx.submissions[ctx.submissions.length - 1];
    const lastEval = last?.evaluations[0];
    const input: TutorChatInput = {
      lessonTitle: ctx.lesson.title,
      lessonObjective: lessonObjective(ctx.lesson),
      approvedContent: `${ctx.lesson.learnContent}\n\n${ctx.lesson.contextContent}`,
      activity: ctx.lesson.activity ? activityContext(ctx.lesson.activity) : null,
      rubric: rubricContext(ctx.lesson.activity?.rubric ?? null),
      student: studentContext(ctx.enrollment.currentLevel ?? ctx.enrollment.initialLevel, ctx.profile),
      attemptCount: ctx.submissions.length,
      lastSubmission: last?.content ?? null,
      lastEvaluation: lastEval
        ? {
            weightedScore: lastEval.weightedScore,
            strengths: asStringArray(lastEval.strengths),
            improvements: asStringArray(lastEval.improvements),
            socraticQuestion: lastEval.socraticQuestion,
          }
        : null,
      studentMessage: content,
      turnIndex: ctx.state.messagesUsed,
      solutionAllowed: ctx.state.solutionAllowed,
      tone: settings.tutorTone,
      extraInstructions: settings.tutorExtraInstructions,
    };
    const { system } = tutorChatPrompt(input);
    const messages = history
      .reverse()
      .map((m) => ({
        role: m.role === 'STUDENT' ? ('user' as const) : ('assistant' as const),
        content: m.role === 'STUDENT' ? `<mensagem_do_estudante>\n${m.content}\n</mensagem_do_estudante>` : m.content,
      }));
    const reply = await ai.generateChat({ operation: 'tutor_chat', system, messages, input, maxTokens: 600 }, { userId, allowFallback: true });
    const notice = looksLikePromptInjection(content)
      ? '\n\n_Observação: instruções enviadas ao tutor não alteram suas regras pedagógicas._'
      : found.length
        ? `\n\n_Removi dados pessoais (${found.join(', ')}) da sua mensagem. Use sempre informações fictícias ou anonimizadas._`
        : '';
    const tutorMsg = await prisma.tutorMessage.create({
      data: {
        conversationId: ctx.conversation.id,
        role: 'TUTOR',
        kind: 'MESSAGE',
        content: reply.content + notice,
        metadata: { provider: reply.provider, fallback: reply.fallback },
      },
    });
    await touchEnrollment(ctx.enrollment.id, { lastLessonId: lessonId });
    if (ctx.progress.currentStage === 'PRACTICE' && ctx.submissions.length) {
      await prisma.learningProgress.update({ where: { id: ctx.progress.id }, data: { currentStage: 'REFLECT' } });
    }
    return { messages: [studentMsg, tutorMsg], fallback: reply.fallback };
  },

  /** Pistas progressivas: primeiro as pistas aprovadas pelo administrador, depois a pista da última avaliação. */
  async hint(userId: string, courseId: string, lessonId: string) {
    const ctx = await tutorState(userId, courseId, lessonId);
    if (!ctx.lesson.activity) throw conflict('Esta aula não possui atividade prática.');
    if (ctx.state.hintsUsed >= ctx.state.maxHints) throw conflict('Você já utilizou todas as pistas. Solicite a solução comentada se precisar.');
    const authored = asStringArray(ctx.lesson.activity.hints);
    const lastEval = ctx.submissions[ctx.submissions.length - 1]?.evaluations[0];
    const n = ctx.state.hintsUsed + 1;
    const hint = authored[ctx.state.hintsUsed] ?? lastEval?.hint ?? 'Releia o enunciado e identifique quais informações de contexto ainda faltam na sua resposta.';
    const msg = await prisma.tutorMessage.create({
      data: { conversationId: ctx.conversation.id, role: 'TUTOR', kind: 'HINT', content: `**Pista ${n} de ${ctx.state.maxHints}:** ${hint}`, metadata: { hintNumber: n } },
    });
    await prisma.learningProgress.update({ where: { id: ctx.progress.id }, data: { hintsUsed: n } });
    return { message: msg, hintsUsed: n, maxHints: ctx.state.maxHints };
  },

  async solution(userId: string, courseId: string, lessonId: string) {
    const ctx = await tutorState(userId, courseId, lessonId);
    if (!ctx.lesson.activity) throw conflict('Esta aula não possui atividade prática.');
    if (!ctx.state.solutionAllowed) {
      throw conflict(`A solução comentada é liberada após ${ctx.state.attemptsBeforeSolution} tentativas, após usar todas as pistas ou ao atingir a nota mínima.`);
    }
    const existing = await prisma.tutorMessage.findFirst({ where: { conversationId: ctx.conversation.id, kind: 'SOLUTION' } });
    if (existing) return { message: existing };
    const input = {
      lessonTitle: ctx.lesson.title,
      activity: activityContext(ctx.lesson.activity),
      lastSubmission: ctx.submissions[ctx.submissions.length - 1]?.content ?? null,
      student: studentContext(ctx.enrollment.currentLevel ?? ctx.enrollment.initialLevel, ctx.profile),
    };
    const { system, messages } = solutionPrompt(input);
    const reply = await ai.generateChat({ operation: 'tutor_solution', system, messages, input, maxTokens: 1200 }, { userId, allowFallback: true });
    const msg = await prisma.tutorMessage.create({
      data: { conversationId: ctx.conversation.id, role: 'TUTOR', kind: 'SOLUTION', content: reply.content, metadata: { provider: reply.provider, fallback: reply.fallback } },
    });
    await prisma.learningProgress.update({ where: { id: ctx.progress.id }, data: { solutionRevealed: true } });
    return { message: msg };
  },
};
