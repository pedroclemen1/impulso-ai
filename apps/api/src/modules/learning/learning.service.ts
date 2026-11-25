import { LESSON_STAGES, levelLabel, type LessonStage } from '@impulso/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { conflict, notFound } from '../../shared/errors';
import { asStringArray, round } from '../../shared/http';
import { redactSensitiveData } from '../../shared/text';
import { ai } from '../ai/ai.client';
import { consolidationPrompt, reflectionFeedbackPrompt } from '../ai/prompts';
import { consolidationSchema } from '../ai/schemas';
import { studentContext } from '../ai/services/context';
import { IDLE_GAP_SECONDS } from '../analytics/kpis';
import { loadStructure, recalculateEnrollment, resolveEnrollment, touchEnrollment } from './engine';
import { lessonPresentation, recommendedPath } from './personalization';
import { computeProgress } from './progress';

type Structure = Awaited<ReturnType<typeof loadStructure>>;

async function learnerSnapshot(enrollmentId: string, s: Structure) {
  const [progressRows, attempts] = await Promise.all([
    prisma.learningProgress.findMany({ where: { enrollmentId } }),
    prisma.assessmentAttempt.findMany({ where: { enrollmentId, status: 'SUBMITTED' }, include: { assessment: { select: { kind: true, moduleId: true } } } }),
  ]);
  const completed = new Set(progressRows.filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId));
  const quiz = attempts.filter((a) => a.assessment.kind === 'MODULE_QUIZ');
  const final = attempts.filter((a) => a.assessment.kind === 'FINAL');
  const progress = computeProgress(
    s.structure,
    {
      completedLessonIds: completed,
      attemptedQuizIds: new Set(quiz.map((a) => a.assessmentId)),
      passedQuizIds: new Set(quiz.filter((a) => a.passed).map((a) => a.assessmentId)),
      finalPassed: final.some((a) => a.passed),
      finalAttempted: final.length > 0,
    },
    s.version.completionCriteria,
  );
  const diagnosticDone = attempts.some((a) => a.assessment.kind === 'DIAGNOSTIC');
  const satisfactionDone = attempts.some((a) => a.assessment.kind === 'SATISFACTION');
  return { progressRows, attempts, completed, progress, diagnosticDone, satisfactionDone };
}

/** Próximo passo recomendado: diagnóstico → aulas em ordem → avaliação do módulo → avaliação final. */
function nextStep(s: Structure, snap: Awaited<ReturnType<typeof learnerSnapshot>>, courseId: string) {
  const hasDiagnostic = s.version.assessments.some((a) => a.kind === 'DIAGNOSTIC');
  if (hasDiagnostic && !snap.diagnosticDone) {
    return { type: 'DIAGNOSTIC' as const, title: 'Diagnóstico inicial', path: `/app/courses/${courseId}/diagnostic` };
  }
  for (const m of s.version.modules) {
    const pending = m.lessons.find((l) => !snap.completed.has(l.id));
    if (pending) return { type: 'LESSON' as const, title: pending.title, moduleTitle: m.title, path: `/app/courses/${courseId}/modules/${m.id}/lessons/${pending.id}` };
    const quiz = s.version.assessments.find((a) => a.kind === 'MODULE_QUIZ' && a.moduleId === m.id);
    if (quiz && !snap.attempts.some((a) => a.assessmentId === quiz.id)) {
      return { type: 'MODULE_QUIZ' as const, title: quiz.title, moduleTitle: m.title, path: `/app/courses/${courseId}/modules/${m.id}/quiz` };
    }
  }
  if (!snap.progress.completed && s.structure.hasFinalAssessment) {
    return { type: 'FINAL' as const, title: 'Avaliação final', path: `/app/courses/${courseId}/final-assessment` };
  }
  if (snap.progress.completed && !snap.satisfactionDone && s.version.assessments.some((a) => a.kind === 'SATISFACTION')) {
    return { type: 'SATISFACTION' as const, title: 'Pesquisa de satisfação', path: `/app/courses/${courseId}/final-assessment?survey=1` };
  }
  return null;
}

export const LearningService = {
  async dashboard(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: { not: 'CANCELLED' } },
      include: { course: true, courseVersion: { select: { title: true, description: true, estimatedHours: true, difficulty: true, versionNumber: true } }, certificate: true },
      orderBy: [{ lastActivityAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    });

    const courses = [];
    let continueLearning = null;
    let remainingMinutes = 0;
    for (const e of enrollments) {
      const s = await loadStructure(e.courseVersionId);
      const snap = await learnerSnapshot(e.id, s);
      const next = nextStep(s, snap, e.courseId);
      const pendingMinutes = s.version.modules.flatMap((m) => m.lessons).filter((l) => !snap.completed.has(l.id));
      const lessonMinutes = await prisma.lesson.findMany({ where: { id: { in: pendingMinutes.map((l) => l.id) } }, select: { estimatedMinutes: true } });
      remainingMinutes += lessonMinutes.reduce((a, l) => a + l.estimatedMinutes, 0);
      const item = {
        enrollmentId: e.id,
        courseId: e.courseId,
        title: e.courseVersion.title,
        description: e.courseVersion.description,
        coverColor: e.course.coverColor,
        difficulty: e.courseVersion.difficulty,
        estimatedHours: e.courseVersion.estimatedHours,
        versionNumber: e.courseVersion.versionNumber,
        status: e.status,
        progressPercent: e.progressPercent,
        dueDate: e.dueDate,
        initialLevel: e.initialLevel,
        currentLevel: e.currentLevel,
        initialScore: e.initialScore,
        duringScore: e.duringScore,
        finalScore: e.finalScore,
        lessonsDone: snap.progress.lessonsDone,
        totalLessons: snap.progress.totalLessons,
        certificateCode: e.certificate?.code ?? null,
        next,
      };
      courses.push(item);
      if (!continueLearning && next && e.status !== 'COMPLETED') {
        // Prioriza a última aula visitada e ainda não concluída.
        const lastLesson = e.lastLessonId ? s.version.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title }))).find((l) => l.id === e.lastLessonId) : null;
        continueLearning =
          lastLesson && !snap.completed.has(lastLesson.id) && snap.diagnosticDone
            ? { courseId: e.courseId, courseTitle: item.title, type: 'LESSON', title: lastLesson.title, moduleTitle: lastLesson.moduleTitle, path: `/app/courses/${e.courseId}/modules/${lastLesson.moduleId}/lessons/${lastLesson.id}`, progressPercent: e.progressPercent }
            : { courseId: e.courseId, courseTitle: item.title, ...next, progressPercent: e.progressPercent };
      }
    }

    const [competencies, achievements, allAchievements, attempts, recent] = await Promise.all([
      this.competencies(userId),
      prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { awardedAt: 'desc' } }),
      prisma.achievement.count(),
      prisma.assessmentAttempt.findMany({
        where: { userId, status: 'SUBMITTED', assessment: { kind: { in: ['MODULE_QUIZ', 'FINAL', 'DIAGNOSTIC'] } } },
        include: { assessment: { select: { title: true, kind: true, passingScore: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 8,
      }),
      this.history(userId, 8),
    ]);

    const active = enrollments.filter((e) => e.status !== 'CANCELLED');
    return {
      user: { name: user.name, firstName: user.name.split(' ')[0], jobTitle: user.profile?.jobTitle ?? null, knowledgeLevel: user.profile?.knowledgeLevel ?? null, levelLabel: levelLabel(user.profile?.knowledgeLevel) },
      overallProgress: active.length ? round(active.reduce((a, e) => a + e.progressPercent, 0) / active.length) : 0,
      continueLearning,
      courses: {
        inProgress: courses.filter((c) => c.status === 'IN_PROGRESS'),
        available: courses.filter((c) => c.status === 'NOT_STARTED'),
        completed: courses.filter((c) => c.status === 'COMPLETED'),
      },
      remainingMinutes,
      competencies,
      achievements: { earned: achievements.map((a) => ({ ...a.achievement, awardedAt: a.awardedAt })), total: allAchievements },
      assessmentPerformance: attempts.map((a) => ({
        id: a.id,
        title: a.assessment.title,
        kind: a.assessment.kind,
        score: a.overallScore,
        objectiveScore: a.objectiveScore,
        passed: a.passed,
        passingScore: a.assessment.passingScore,
        submittedAt: a.submittedAt,
      })),
      recentHistory: recent,
    };
  },

  async courseOverview(userId: string, courseId: string) {
    const e = await resolveEnrollment(userId, courseId);
    const s = await loadStructure(e.courseVersionId);
    const snap = await learnerSnapshot(e.id, s);
    const version = await prisma.courseVersion.findUniqueOrThrow({ where: { id: e.courseVersionId }, include: { competencies: { include: { competency: true } }, course: true } });
    const lessons = await prisma.lesson.findMany({
      where: { module: { courseVersionId: e.courseVersionId } },
      select: { id: true, title: true, summary: true, estimatedMinutes: true, moduleId: true, activity: { select: { id: true, type: true, title: true } } },
    });
    const lessonById = new Map(lessons.map((l) => [l.id, l]));
    const diagnostic = snap.attempts.find((a) => a.assessment.kind === 'DIAGNOSTIC');
    const initialScores = new Map(Object.entries(((diagnostic?.result as { perCompetency?: Record<string, number> } | null)?.perCompetency ?? {})));
    const path = recommendedPath(
      s.version.modules.map((m) => ({ moduleId: m.id, title: m.title, order: m.order, competencyIds: [...new Set(m.lessons.flatMap((l) => l.competencies.map((c) => c.competencyId)))] })),
      initialScores,
      e.currentLevel ?? e.initialLevel ?? 1,
    );
    const quizzes = s.version.assessments.filter((a) => a.kind === 'MODULE_QUIZ');
    return {
      enrollment: {
        id: e.id,
        status: e.status,
        progressPercent: e.progressPercent,
        startDate: e.startDate,
        dueDate: e.dueDate,
        initialLevel: e.initialLevel,
        currentLevel: e.currentLevel,
        levelLabel: levelLabel(e.currentLevel ?? e.initialLevel),
        initialScore: e.initialScore,
        duringScore: e.duringScore,
        finalScore: e.finalScore,
        passed: e.passed,
      },
      course: {
        id: courseId,
        title: version.title,
        description: version.description,
        objectives: asStringArray(version.objectives),
        targetAudience: version.targetAudience,
        prerequisites: version.prerequisites,
        difficulty: version.difficulty,
        estimatedHours: version.estimatedHours,
        coverColor: version.course.coverColor,
        versionNumber: version.versionNumber,
        competencies: version.competencies.map((c) => ({ id: c.competency.id, name: c.competency.name, description: c.competency.description })),
      },
      diagnostic: {
        required: s.version.assessments.some((a) => a.kind === 'DIAGNOSTIC'),
        done: snap.diagnosticDone,
        profile: (diagnostic?.result as { profile?: unknown } | null)?.profile ?? null,
      },
      presentation: lessonPresentation(e.currentLevel ?? e.initialLevel),
      progress: snap.progress,
      next: nextStep(s, snap, courseId),
      modules: s.version.modules.map((m) => {
        const quiz = quizzes.find((q) => q.moduleId === m.id);
        const quizAttempts = quiz ? snap.attempts.filter((a) => a.assessmentId === quiz.id) : [];
        const emphasis = path.find((p) => p.moduleId === m.id);
        return {
          id: m.id,
          order: m.order,
          title: m.title,
          description: (m as unknown as { description: string }).description,
          emphasis: emphasis?.emphasis ?? 'PADRAO',
          emphasisReason: emphasis?.reason ?? null,
          lessons: m.lessons.map((l) => {
            const p = snap.progressRows.find((r) => r.lessonId === l.id);
            const info = lessonById.get(l.id)!;
            return { id: l.id, order: l.order, title: l.title, summary: info.summary, estimatedMinutes: info.estimatedMinutes, activity: info.activity, status: p?.status ?? 'NOT_STARTED', currentStage: p?.currentStage ?? null };
          }),
          quiz: quiz
            ? {
                id: quiz.id,
                title: quiz.title,
                passingScore: quiz.passingScore,
                attempts: quizAttempts.length,
                maxAttempts: quiz.maxAttempts,
                bestScore: quizAttempts.length ? Math.max(...quizAttempts.map((a) => a.overallScore ?? 0)) : null,
                unlocked: snap.diagnosticDone && m.lessons.every((l) => snap.completed.has(l.id)),
              }
            : null,
          completed: m.lessons.every((l) => snap.completed.has(l.id)),
        };
      }),
      finalAssessment: s.version.assessments.find((a) => a.kind === 'FINAL')
        ? { unlocked: snap.progress.finalUnlocked && snap.diagnosticDone, passed: snap.attempts.some((a) => a.assessment.kind === 'FINAL' && a.passed) }
        : null,
      satisfaction: { available: s.version.assessments.some((a) => a.kind === 'SATISFACTION'), done: snap.satisfactionDone },
    };
  },

  async lesson(userId: string, courseId: string, lessonId: string) {
    const e = await resolveEnrollment(userId, courseId);
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, module: { courseVersionId: e.courseVersionId } },
      include: {
        module: { select: { id: true, title: true, order: true } },
        competencies: { include: { competency: true } },
        activity: { include: { rubric: { include: { criteria: { orderBy: { order: 'asc' } } } } } },
      },
    });
    if (!lesson) throw notFound('Aula não encontrada');
    const s = await loadStructure(e.courseVersionId);
    const snap = await learnerSnapshot(e.id, s);
    if (s.version.assessments.some((a) => a.kind === 'DIAGNOSTIC') && !snap.diagnosticDone) {
      throw conflict('Responda o diagnóstico inicial antes de iniciar as aulas.', { code: 'DIAGNOSTIC_REQUIRED' });
    }
    const progress = await prisma.learningProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: e.id, lessonId } },
      create: { enrollmentId: e.id, lessonId, status: 'IN_PROGRESS' },
      update: {},
    });
    await touchEnrollment(e.id, { lastLessonId: lessonId, startedAt: e.startedAt ?? new Date(), ...(e.status === 'NOT_STARTED' ? { status: 'IN_PROGRESS' } : {}) });

    const submissions = lesson.activity
      ? await prisma.activitySubmission.findMany({
          where: { enrollmentId: e.id, activityId: lesson.activity.id },
          orderBy: { attemptNumber: 'asc' },
          include: { evaluations: { where: { isCurrent: true }, take: 1, include: { scores: { include: { criterion: true } } } } },
        })
      : [];

    const flat = s.version.modules.flatMap((m) => m.lessons.map((l) => ({ id: l.id, moduleId: m.id, title: l.title })));
    const idx = flat.findIndex((l) => l.id === lessonId);
    const level = e.currentLevel ?? e.initialLevel ?? 1;
    const presentation = lessonPresentation(level);
    const a = lesson.activity;
    return {
      enrollmentId: e.id,
      level,
      levelLabel: levelLabel(level),
      presentation,
      module: lesson.module,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        estimatedMinutes: lesson.estimatedMinutes,
        learnContent: lesson.learnContent,
        beginnerSupport: presentation.showBeginnerSupport ? lesson.beginnerSupport : null,
        advancedDeepDive: presentation.showAdvancedDeepDive ? lesson.advancedDeepDive : null,
        contextContent: lesson.contextContent,
        videoUrl: lesson.videoUrl,
        resources: lesson.resources,
        reflectionPrompt: lesson.reflectionPrompt,
        keyTakeaways: asStringArray(lesson.keyTakeaways),
        competencies: lesson.competencies.map((c) => ({ id: c.competency.id, name: c.competency.name })),
      },
      // Solução de referência e palavras-chave ficam no servidor (não são enviadas ao estudante).
      activity: a
        ? {
            id: a.id,
            type: a.type,
            title: a.title,
            instructions: a.instructions,
            scenario: a.scenario,
            guidedSteps: presentation.showGuidedSteps ? asStringArray(a.guidedSteps) : [],
            advancedChallenge: presentation.showAdvancedChallenge ? a.advancedChallenge : null,
            maxAttempts: a.maxAttempts,
            passingScore: a.passingScore,
            rubric: a.rubric ? { title: a.rubric.title, criteria: a.rubric.criteria.map((c) => ({ id: c.id, key: c.key, name: c.name, description: c.description, weight: c.weight, indicators: asStringArray(c.indicators) })) } : null,
          }
        : null,
      submissions: submissions.map((sub) => ({
        id: sub.id,
        attemptNumber: sub.attemptNumber,
        content: sub.content,
        isRevision: sub.isRevision,
        status: sub.status,
        createdAt: sub.createdAt,
        evaluation: sub.evaluations[0] ?? null,
      })),
      progress: {
        status: progress.status,
        currentStage: progress.currentStage,
        reflectionText: progress.reflectionText,
        personalizedExample: progress.personalizedExample,
        consolidation: progress.consolidation,
        hintsUsed: progress.hintsUsed,
        solutionRevealed: progress.solutionRevealed,
        completedAt: progress.completedAt,
      },
      navigation: {
        previous: idx > 0 ? flat[idx - 1] : null,
        next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
        position: idx + 1,
        total: flat.length,
      },
    };
  },

  /** Registra a etapa atual (salvamento automático do progresso). Não permite pular a prática sem submissão. */
  async setStage(userId: string, courseId: string, lessonId: string, stage: LessonStage) {
    const e = await resolveEnrollment(userId, courseId);
    const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, module: { courseVersionId: e.courseVersionId } }, include: { activity: true } });
    if (!lesson) throw notFound('Aula não encontrada');
    const target = LESSON_STAGES.indexOf(stage);
    if (lesson.activity && target > LESSON_STAGES.indexOf('PRACTICE')) {
      const evaluated = await prisma.activitySubmission.count({ where: { enrollmentId: e.id, activityId: lesson.activity.id, status: 'EVALUATED' } });
      if (!evaluated) throw conflict('Envie sua resposta na etapa Praticar para avançar.');
    }
    const p = await prisma.learningProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: e.id, lessonId } },
      create: { enrollmentId: e.id, lessonId, status: 'IN_PROGRESS', currentStage: stage },
      update: { currentStage: stage },
    });
    await touchEnrollment(e.id, { lastLessonId: lessonId });
    return p;
  },

  async consolidate(userId: string, courseId: string, lessonId: string, rawReflection: string) {
    const e = await resolveEnrollment(userId, courseId);
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, module: { courseVersionId: e.courseVersionId } },
      include: { activity: true, module: { include: { lessons: { orderBy: { order: 'asc' } } } } },
    });
    if (!lesson) throw notFound('Aula não encontrada');
    const reflection = redactSensitiveData(rawReflection).text;
    const evaluations = lesson.activity
      ? (
          await prisma.activitySubmission.findMany({
            where: { enrollmentId: e.id, activityId: lesson.activity.id, status: 'EVALUATED' },
            orderBy: { attemptNumber: 'asc' },
            include: { evaluations: { where: { isCurrent: true }, take: 1 } },
          })
        )
          .filter((s) => s.evaluations[0])
          .map((s) => ({
            attemptNumber: s.attemptNumber,
            weightedScore: s.evaluations[0].weightedScore,
            strengths: asStringArray(s.evaluations[0].strengths),
            improvements: asStringArray(s.evaluations[0].improvements),
          }))
      : [];
    if (lesson.activity && !evaluations.length) throw conflict('Realize a atividade prática antes de consolidar a aprendizagem.');

    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    const student = studentContext(e.currentLevel ?? e.initialLevel, profile);
    const s = await loadStructure(e.courseVersionId);
    const flat = s.version.modules.flatMap((m) => m.lessons);
    const next = flat[flat.findIndex((l) => l.id === lessonId) + 1];
    const input = { lessonTitle: lesson.title, keyTakeaways: asStringArray(lesson.keyTakeaways), reflection, student, evaluations, nextLessonTitle: next?.title ?? null };
    const { system, prompt } = consolidationPrompt(input);
    const result = await ai.generateStructured({ operation: 'consolidation', system, prompt, schema: consolidationSchema, input }, { userId, allowFallback: true });

    let reflectionFeedback: string | null = null;
    if (!lesson.activity) {
      const fbInput = { lessonTitle: lesson.title, reflectionPrompt: lesson.reflectionPrompt, reflection, keyTakeaways: input.keyTakeaways, student };
      const fb = reflectionFeedbackPrompt(fbInput);
      reflectionFeedback = (await ai.generateChat({ operation: 'reflection_feedback', ...fb, input: fbInput, maxTokens: 400 }, { userId, allowFallback: true })).content;
    }
    const consolidation = { ...result.data, reflectionFeedback, fallback: result.fallback } as Prisma.InputJsonValue;

    await prisma.learningProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: e.id, lessonId } },
      create: { enrollmentId: e.id, lessonId, status: 'COMPLETED', currentStage: 'CONSOLIDATE', reflectionText: reflection, consolidation, completedAt: new Date() },
      update: { status: 'COMPLETED', currentStage: 'CONSOLIDATE', reflectionText: reflection, consolidation, completedAt: new Date() },
    });
    const conversation = await prisma.tutorConversation.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: e.id, lessonId } },
      create: { enrollmentId: e.id, lessonId, userId },
      update: {},
    });
    await prisma.tutorMessage.createMany({
      data: [
        { conversationId: conversation.id, role: 'STUDENT', kind: 'MESSAGE', content: `**Minha reflexão:** ${reflection}` },
        { conversationId: conversation.id, role: 'TUTOR', kind: 'CONSOLIDATION', content: result.data.summary, metadata: consolidation },
      ],
    });
    await touchEnrollment(e.id, { lastLessonId: lessonId });
    const before = await prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } });
    const { enrollment, progress } = await recalculateEnrollment(e.id);
    const newAchievements = await prisma.userAchievement.findMany({
      where: { userId, achievementId: { notIn: before.map((b) => b.achievementId) } },
      include: { achievement: true },
    });
    return { consolidation, progress, enrollmentStatus: enrollment.status, newAchievements: newAchievements.map((a) => a.achievement) };
  },

  /** Tempo de aprendizagem: heartbeats a cada ~60s; pausas acima de 5 min iniciam nova sessão. */
  async heartbeat(userId: string, courseId?: string) {
    const enrollment = courseId ? await resolveEnrollment(userId, courseId).catch(() => null) : null;
    const now = new Date();
    const last = await prisma.learningSession.findFirst({ where: { userId }, orderBy: { lastHeartbeatAt: 'desc' } });
    const gap = last ? (now.getTime() - last.lastHeartbeatAt.getTime()) / 1000 : Infinity;
    if (last && gap <= IDLE_GAP_SECONDS) {
      await prisma.learningSession.update({
        where: { id: last.id },
        data: { lastHeartbeatAt: now, activeSeconds: { increment: Math.round(gap) }, enrollmentId: enrollment?.id ?? last.enrollmentId },
      });
    } else {
      await prisma.learningSession.create({ data: { userId, enrollmentId: enrollment?.id ?? null, startedAt: now, lastHeartbeatAt: now } });
    }
    if (enrollment) await touchEnrollment(enrollment.id);
    return { ok: true };
  },

  async competencies(userId: string) {
    const scores = await prisma.competencyScore.findMany({ where: { userId }, include: { competency: true }, orderBy: { updatedAt: 'desc' } });
    const byComp = new Map<string, (typeof scores)[number]>();
    for (const s of scores) if (!byComp.has(s.competencyId)) byComp.set(s.competencyId, s);
    const achievements = await prisma.userAchievement.findMany({ where: { userId, achievement: { competencyId: { not: null } } }, include: { achievement: true } });
    return [...byComp.values()].map((s) => ({
      id: s.competency.id,
      name: s.competency.name,
      description: s.competency.description,
      category: s.competency.category,
      score: round(s.score),
      initialScore: s.initialScore === null ? null : round(s.initialScore),
      evidenceCount: s.evidenceCount,
      achievement: achievements.find((a) => a.achievement.competencyId === s.competencyId)?.achievement ?? null,
    }));
  },

  /** Linha do tempo de aprendizagem do próprio estudante. */
  async history(userId: string, limit = 50) {
    const [lessons, attempts, submissions, achievements] = await Promise.all([
      prisma.learningProgress.findMany({
        where: { enrollment: { userId }, status: 'COMPLETED' },
        include: { lesson: { select: { title: true, moduleId: true } }, enrollment: { select: { courseId: true, courseVersion: { select: { title: true } } } } },
        orderBy: { completedAt: 'desc' },
        take: limit,
      }),
      prisma.assessmentAttempt.findMany({
        where: { userId, status: 'SUBMITTED' },
        include: { assessment: { select: { title: true, kind: true } }, enrollment: { select: { courseId: true, courseVersion: { select: { title: true } } } } },
        orderBy: { submittedAt: 'desc' },
        take: limit,
      }),
      prisma.activitySubmission.findMany({
        where: { userId },
        include: { activity: { select: { title: true } }, evaluations: { where: { isCurrent: true }, take: 1 }, enrollment: { select: { courseId: true, courseVersion: { select: { title: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { awardedAt: 'desc' }, take: limit }),
    ]);
    const events = [
      ...lessons.map((l) => ({ type: 'LESSON_COMPLETED', title: l.lesson.title, course: l.enrollment.courseVersion.title, courseId: l.enrollment.courseId, at: l.completedAt!, score: null as number | null })),
      ...attempts.map((a) => ({ type: `ASSESSMENT_${a.assessment.kind}`, title: a.assessment.title, course: a.enrollment.courseVersion.title, courseId: a.enrollment.courseId, at: a.submittedAt!, score: a.overallScore })),
      ...submissions.map((s) => ({
        type: s.isRevision ? 'ACTIVITY_REVISED' : 'ACTIVITY_SUBMITTED',
        title: `${s.activity.title} (tentativa ${s.attemptNumber})`,
        course: s.enrollment.courseVersion.title,
        courseId: s.enrollment.courseId,
        at: s.createdAt,
        score: s.evaluations[0]?.weightedScore ?? null,
      })),
      ...achievements.map((a) => ({ type: 'ACHIEVEMENT', title: a.achievement.title, course: null as string | null, courseId: null as string | null, at: a.awardedAt, score: null })),
    ];
    return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
  },
};
