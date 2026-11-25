import type { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { prisma, type Tx } from '../../database/prisma';
import { notFound } from '../../shared/errors';
import { competencyMastery, mean } from '../analytics/kpis';
import { estimateCurrentLevel } from './personalization';
import { computeProgress, type CourseStructure } from './progress';

/** Estrutura do curso necessária para o cálculo de progresso. */
export async function loadStructure(courseVersionId: string, db: Tx = prisma) {
  const version = await db.courseVersion.findUniqueOrThrow({
    where: { id: courseVersionId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { orderBy: { order: 'asc' }, include: { activity: { select: { id: true } }, competencies: true } },
        },
      },
      assessments: { select: { id: true, kind: true, moduleId: true, passingScore: true, maxAttempts: true, title: true } },
    },
  });
  const structure: CourseStructure = {
    lessons: version.modules.flatMap((m) => m.lessons.map((l) => ({ id: l.id, moduleId: m.id, hasActivity: !!l.activity }))),
    moduleQuizzes: version.assessments.filter((a) => a.kind === 'MODULE_QUIZ' && a.moduleId).map((a) => ({ assessmentId: a.id, moduleId: a.moduleId! })),
    hasFinalAssessment: version.assessments.some((a) => a.kind === 'FINAL'),
  };
  return { version, structure };
}

type AttemptResult = { perCompetency?: Record<string, number> };

/**
 * Recalcula de forma determinística o estado de uma matrícula: progresso, notas (inicial, durante, final),
 * domínio por competência, nível estimado, status, certificado e conquistas.
 */
export async function recalculateEnrollment(enrollmentId: string, db: Tx = prisma) {
  const enrollment = await db.enrollment.findUnique({ where: { id: enrollmentId }, include: { user: true } });
  if (!enrollment) throw notFound('Matrícula não encontrada');
  const { version, structure } = await loadStructure(enrollment.courseVersionId, db);

  const [progressRows, attempts, submissions] = await Promise.all([
    db.learningProgress.findMany({ where: { enrollmentId } }),
    db.assessmentAttempt.findMany({ where: { enrollmentId, status: 'SUBMITTED' }, include: { assessment: { select: { kind: true, moduleId: true } } } }),
    db.activitySubmission.findMany({
      where: { enrollmentId },
      include: { evaluations: { where: { isCurrent: true }, take: 1 }, activity: { select: { lessonId: true } } },
      orderBy: { attemptNumber: 'asc' },
    }),
  ]);

  const completedLessonIds = new Set(progressRows.filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId));
  const quizAttempts = attempts.filter((a) => a.assessment.kind === 'MODULE_QUIZ');
  const finalAttempts = attempts.filter((a) => a.assessment.kind === 'FINAL');
  const diagnostic = attempts.find((a) => a.assessment.kind === 'DIAGNOSTIC');

  const progress = computeProgress(
    structure,
    {
      completedLessonIds,
      passedQuizIds: new Set(quizAttempts.filter((a) => a.passed).map((a) => a.assessmentId)),
      attemptedQuizIds: new Set(quizAttempts.map((a) => a.assessmentId)),
      finalPassed: finalAttempts.some((a) => a.passed),
      finalAttempted: finalAttempts.length > 0,
    },
    version.completionCriteria,
  );

  // Melhor tentativa avaliada por atividade e melhor nota por avaliação de módulo.
  const bestByActivity = new Map<string, { score: number; lessonId: string }>();
  for (const s of submissions) {
    const score = s.evaluations[0]?.weightedScore;
    if (score === undefined) continue;
    const prev = bestByActivity.get(s.activityId);
    if (!prev || score > prev.score) bestByActivity.set(s.activityId, { score, lessonId: s.activity.lessonId });
  }
  const bestQuiz = new Map<string, number>();
  for (const a of quizAttempts) bestQuiz.set(a.assessmentId, Math.max(bestQuiz.get(a.assessmentId) ?? 0, a.overallScore ?? 0));
  const duringScore = mean([...[...bestByActivity.values()].map((b) => b.score), ...bestQuiz.values()]);
  const bestFinal = finalAttempts.reduce<(typeof finalAttempts)[number] | null>((best, a) => (!best || (a.objectiveScore ?? 0) > (best.objectiveScore ?? 0) ? a : best), null);
  const finalScore = bestFinal?.objectiveScore ?? null;

  // Domínio por competência: atividades (peso da competência na aula) + questões objetivas de módulo e final.
  const lessonComp = new Map<string, { competencyId: string; weight: number }[]>();
  for (const m of version.modules) for (const l of m.lessons) lessonComp.set(l.id, l.competencies);
  const evidence = new Map<string, { score: number; weight: number }[]>();
  const push = (cid: string, score: number, weight: number) => evidence.set(cid, [...(evidence.get(cid) ?? []), { score, weight }]);
  for (const b of bestByActivity.values()) for (const c of lessonComp.get(b.lessonId) ?? []) push(c.competencyId, b.score, c.weight * 2);
  const bestAttemptPerAssessment = new Map<string, (typeof attempts)[number]>();
  for (const a of [...quizAttempts, ...finalAttempts]) {
    const prev = bestAttemptPerAssessment.get(a.assessmentId);
    if (!prev || (a.overallScore ?? 0) > (prev.overallScore ?? 0)) bestAttemptPerAssessment.set(a.assessmentId, a);
  }
  for (const a of bestAttemptPerAssessment.values()) {
    for (const [cid, score] of Object.entries((a.result as AttemptResult | null)?.perCompetency ?? {})) push(cid, score, 1);
  }
  const initialByComp = (diagnostic?.result as AttemptResult | null)?.perCompetency ?? {};

  for (const [competencyId, items] of evidence) {
    const score = competencyMastery(items) ?? 0;
    await db.competencyScore.upsert({
      where: { enrollmentId_competencyId: { enrollmentId, competencyId } },
      create: { enrollmentId, competencyId, userId: enrollment.userId, score, evidenceCount: items.length, initialScore: initialByComp[competencyId] ?? null },
      update: { score, evidenceCount: items.length, initialScore: initialByComp[competencyId] ?? null },
    });
  }

  const started = !!enrollment.startedAt || progressRows.length > 0 || attempts.length > 0 || submissions.length > 0;
  const status = enrollment.status === 'CANCELLED' ? 'CANCELLED' : progress.completed ? 'COMPLETED' : started ? 'IN_PROGRESS' : 'NOT_STARTED';
  const currentLevel = estimateCurrentLevel(enrollment.initialLevel, duringScore, finalScore);

  const updated = await db.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent: progress.percent,
      duringScore,
      finalScore,
      passed: finalAttempts.length ? finalAttempts.some((a) => a.passed) : null,
      currentLevel,
      status,
      startedAt: enrollment.startedAt ?? (started ? new Date() : null),
      completedAt: status === 'COMPLETED' ? enrollment.completedAt ?? new Date() : null,
    },
  });

  if (status === 'COMPLETED') await issueCertificate(updated.id, db);
  await evaluateAchievements(enrollment.userId, enrollmentId, db);
  return { enrollment: updated, progress };
}

async function issueCertificate(enrollmentId: string, db: Tx) {
  const existing = await db.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;
  const e = await db.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, include: { user: true, courseVersion: true } });
  return db.certificate.create({
    data: {
      code: `IMP-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`,
      userId: e.userId,
      enrollmentId,
      studentName: e.user.name,
      courseTitle: e.courseVersion.title,
      versionNumber: e.courseVersion.versionNumber,
      finalScore: e.finalScore ?? 0,
      hours: e.courseVersion.estimatedHours,
    },
  });
}

type AchievementCriteria =
  | { type: 'first_lesson' }
  | { type: 'diagnostic_done' }
  | { type: 'module_completed'; moduleOrder: number }
  | { type: 'competency_score'; minScore: number }
  | { type: 'course_completed' }
  | { type: 'revision_improved'; minDelta: number };

/** Conquistas individuais (sem rankings): regras determinísticas sobre o histórico do próprio participante. */
export async function evaluateAchievements(userId: string, enrollmentId: string, db: Tx = prisma) {
  const [achievements, owned] = await Promise.all([
    db.achievement.findMany(),
    db.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.achievementId));
  const pending = achievements.filter((a) => !ownedIds.has(a.id));
  if (!pending.length) return [];

  const enrollment = await db.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } });
  const { version } = await loadStructure(enrollment.courseVersionId, db);
  const [completed, diag, scores, subs] = await Promise.all([
    db.learningProgress.findMany({ where: { enrollmentId, status: 'COMPLETED' }, select: { lessonId: true } }),
    db.assessmentAttempt.count({ where: { enrollmentId, status: 'SUBMITTED', assessment: { kind: 'DIAGNOSTIC' } } }),
    db.competencyScore.findMany({ where: { enrollmentId } }),
    db.activitySubmission.findMany({ where: { enrollmentId }, include: { evaluations: { where: { isCurrent: true }, take: 1 } }, orderBy: { attemptNumber: 'asc' } }),
  ]);
  const done = new Set(completed.map((c) => c.lessonId));
  const byActivity = new Map<string, number[]>();
  for (const s of subs) if (s.evaluations[0]) byActivity.set(s.activityId, [...(byActivity.get(s.activityId) ?? []), s.evaluations[0].weightedScore]);
  const maxDelta = Math.max(0, ...[...byActivity.values()].filter((v) => v.length > 1).map((v) => v[v.length - 1] - v[0]));

  const awarded: string[] = [];
  for (const a of pending) {
    const c = a.criteria as AchievementCriteria;
    let earned = false;
    switch (c.type) {
      case 'first_lesson':
        earned = done.size > 0;
        break;
      case 'diagnostic_done':
        earned = diag > 0;
        break;
      case 'module_completed': {
        const mod = version.modules.find((m) => m.order === c.moduleOrder);
        earned = !!mod && mod.lessons.length > 0 && mod.lessons.every((l) => done.has(l.id)) && version.title === version.title;
        // Conquistas por módulo só valem para cursos com essa competência associada (quando houver).
        if (earned && a.competencyId) earned = mod!.lessons.some((l) => l.competencies.some((lc) => lc.competencyId === a.competencyId)) || !version.modules.some((m) => m.lessons.some((l) => l.competencies.some((lc) => lc.competencyId === a.competencyId)));
        break;
      }
      case 'competency_score':
        earned = scores.some((s) => (!a.competencyId || s.competencyId === a.competencyId) && s.score >= c.minScore);
        break;
      case 'course_completed':
        earned = enrollment.status === 'COMPLETED';
        break;
      case 'revision_improved':
        earned = maxDelta >= c.minDelta;
        break;
    }
    if (earned) {
      await db.userAchievement.create({ data: { userId, achievementId: a.id, enrollmentId } }).catch(() => undefined);
      awarded.push(a.title);
    }
  }
  return awarded;
}

/** Resolve a matrícula ativa de um estudante em um curso (404 se não alocado). */
export async function resolveEnrollment(userId: string, courseId: string, db: Tx = prisma) {
  const enrollment = await db.enrollment.findFirst({
    where: { userId, courseId, status: { not: 'CANCELLED' } },
    orderBy: { createdAt: 'desc' },
  });
  if (!enrollment) throw notFound('Você não está alocado(a) neste curso');
  return enrollment;
}

export async function touchEnrollment(enrollmentId: string, data: Prisma.EnrollmentUpdateInput = {}, db: Tx = prisma) {
  await db.enrollment.update({ where: { id: enrollmentId }, data: { lastActivityAt: new Date(), ...data } });
}
