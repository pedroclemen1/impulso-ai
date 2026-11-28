import { levelLabel, type AnalyticsFilter } from '@impulso/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { notFound } from '../../shared/errors';
import { asStringArray, round } from '../../shared/http';
import { recurringDifficulties } from '../learning/personalization';
import {
  activationRate,
  approvalRate,
  completionRate,
  engagementIndex,
  feedbackImprovement,
  knowledgeGain,
  likertTo100,
  mean,
  normalizedGain,
  ratio,
} from './kpis';

const DAY = 86_400_000;

function enrollmentWhere(f: AnalyticsFilter): Prisma.EnrollmentWhereInput {
  return {
    status: { not: 'CANCELLED' },
    user: { role: 'STUDENT' },
    ...(f.courseId ? { courseId: f.courseId } : {}),
    ...(f.cohortId ? { OR: [{ cohortId: f.cohortId }, { user: { cohortMemberships: { some: { cohortId: f.cohortId } } } }] } : {}),
    ...(f.userId ? { userId: f.userId } : {}),
  };
}

const period = (f: AnalyticsFilter) => ({
  from: f.from ?? new Date(Date.now() - 30 * DAY),
  to: f.to ?? new Date(),
});

/** Coleta tudo o que os indicadores precisam a partir das matrículas filtradas. */
async function collect(f: AnalyticsFilter) {
  const enrollments = await prisma.enrollment.findMany({
    where: enrollmentWhere(f),
    include: {
      user: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
    },
  });
  const ids = enrollments.map((e) => e.id);
  const { from, to } = period(f);
  const [attempts, submissions, sessions, tutorMessages, scores, progress, satisfactionAnswers] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: { enrollmentId: { in: ids }, status: 'SUBMITTED' },
      select: { enrollmentId: true, userId: true, overallScore: true, objectiveScore: true, passed: true, level: true, submittedAt: true, assessment: { select: { kind: true } } },
    }),
    prisma.activitySubmission.findMany({
      where: { enrollmentId: { in: ids } },
      select: {
        id: true,
        enrollmentId: true,
        userId: true,
        activityId: true,
        attemptNumber: true,
        createdAt: true,
        evaluations: { where: { isCurrent: true }, take: 1, select: { weightedScore: true, improvements: true, requiresHumanReview: true, scores: { select: { score: true, criterion: { select: { name: true } } } } } },
      },
    }),
    prisma.learningSession.findMany({ where: { enrollmentId: { in: ids } }, select: { userId: true, enrollmentId: true, startedAt: true, lastHeartbeatAt: true, activeSeconds: true } }),
    prisma.tutorMessage.findMany({ where: { role: 'STUDENT', conversation: { enrollmentId: { in: ids } } }, select: { createdAt: true, conversation: { select: { enrollmentId: true, userId: true } } } }),
    prisma.competencyScore.findMany({ where: { enrollmentId: { in: ids } }, include: { competency: { select: { id: true, name: true } } } }),
    prisma.learningProgress.findMany({ where: { enrollmentId: { in: ids }, status: 'COMPLETED' }, select: { enrollmentId: true, lessonId: true, completedAt: true } }),
    prisma.assessmentAnswer.findMany({
      where: { attempt: { enrollmentId: { in: ids }, status: 'SUBMITTED', assessment: { kind: 'SATISFACTION' } }, likertValue: { not: null } },
      select: { likertValue: true, question: { select: { helpText: true } } },
    }),
  ]);
  return { enrollments, attempts, submissions, sessions, tutorMessages, scores, progress, satisfactionAnswers, from, to };
}

type Data = Awaited<ReturnType<typeof collect>>;

function feedbackDeltas(subs: Data['submissions']) {
  const byKey = new Map<string, { attemptNumber: number; score: number }[]>();
  for (const s of subs) {
    const score = s.evaluations[0]?.weightedScore;
    if (score === undefined) continue;
    const k = `${s.enrollmentId}:${s.activityId}`;
    byKey.set(k, [...(byKey.get(k) ?? []), { attemptNumber: s.attemptNumber, score }]);
  }
  return [...byKey.values()].map(feedbackImprovement).filter((d): d is number => d !== null);
}

function kpis(d: Data) {
  const e = d.enrollments;
  const inPeriod = (date: Date | null | undefined) => !!date && date >= d.from && date <= d.to;
  const activeUsers = new Set([
    ...d.sessions.filter((s) => inPeriod(s.lastHeartbeatAt)).map((s) => s.userId),
    ...d.submissions.filter((s) => inPeriod(s.createdAt)).map((s) => s.userId),
    ...d.attempts.filter((a) => inPeriod(a.submittedAt)).map((a) => a.userId),
  ]);
  const allocated = new Set(e.map((x) => x.userId));
  const withBoth = e.filter((x) => x.initialScore !== null && x.finalScore !== null);
  const timeByUser = new Map<string, number>();
  for (const s of d.sessions) timeByUser.set(s.userId, (timeByUser.get(s.userId) ?? 0) + s.activeSeconds);
  const sat = d.satisfactionAnswers.filter((a) => a.question.helpText === 'SATISFACAO').map((a) => a.likertValue!);
  const app = d.satisfactionAnswers.filter((a) => a.question.helpText === 'APLICABILIDADE').map((a) => a.likertValue!);
  const deltas = feedbackDeltas(d.submissions);
  return {
    totalParticipants: allocated.size,
    activeParticipants: activeUsers.size,
    coursesInProgress: new Set(e.filter((x) => x.status === 'IN_PROGRESS').map((x) => x.courseId)).size,
    enrollments: e.length,
    completionRate: completionRate(e),
    activationRate: activationRate(e),
    participationRate: ratio([...activeUsers].filter((u) => allocated.has(u)).length, allocated.size),
    averageDiagnostic: mean(e.map((x) => x.initialScore)),
    averageDuring: mean(e.map((x) => x.duringScore)),
    averageFinal: mean(e.map((x) => x.finalScore)),
    knowledgeGain: mean(withBoth.map((x) => knowledgeGain(x.initialScore, x.finalScore))),
    normalizedGain: mean(withBoth.map((x) => normalizedGain(x.initialScore, x.finalScore))),
    comparableParticipants: withBoth.length,
    feedbackImprovement: mean(deltas),
    feedbackImprovementSample: deltas.length,
    approvalRate: approvalRate(d.attempts.filter((a) => a.assessment.kind === 'FINAL').map((a) => ({ userId: a.userId, passed: !!a.passed }))),
    averageLearningMinutes: timeByUser.size ? round(mean([...timeByUser.values()])! / 60) : null,
    totalLearningHours: round([...timeByUser.values()].reduce((a, b) => a + b, 0) / 3600),
    totalActivities: d.submissions.length,
    tutorInteractions: d.tutorMessages.length,
    lessonsCompleted: d.progress.length,
    satisfaction: likertTo100(mean(sat)),
    satisfactionResponses: sat.length,
    applicability: likertTo100(mean(app)),
    applicabilityResponses: app.length,
  };
}

function charts(d: Data) {
  const e = d.enrollments;
  const days = Math.min(120, Math.max(1, Math.ceil((d.to.getTime() - d.from.getTime()) / DAY)));
  const dayKey = (dt: Date) => dt.toISOString().slice(0, 10);
  const timeline = new Map<string, { date: string; activeParticipants: Set<string>; submissions: number; tutorInteractions: number; lessonsCompleted: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(new Date(d.to.getTime() - i * DAY));
    timeline.set(k, { date: k, activeParticipants: new Set(), submissions: 0, tutorInteractions: 0, lessonsCompleted: 0 });
  }
  for (const s of d.sessions) timeline.get(dayKey(s.lastHeartbeatAt))?.activeParticipants.add(s.userId);
  for (const s of d.submissions) {
    const t = timeline.get(dayKey(s.createdAt));
    if (t) {
      t.submissions++;
      t.activeParticipants.add(s.userId);
    }
  }
  for (const m of d.tutorMessages) {
    const t = timeline.get(dayKey(m.createdAt));
    if (t) t.tutorInteractions++;
  }
  for (const p of d.progress) {
    const t = p.completedAt ? timeline.get(dayKey(p.completedAt)) : undefined;
    if (t) t.lessonsCompleted++;
  }

  const byCourse = new Map<string, typeof e>();
  for (const x of e) byCourse.set(x.courseId, [...(byCourse.get(x.courseId) ?? []), x]);

  const compMap = new Map<string, { name: string; initial: number[]; current: number[] }>();
  for (const s of d.scores) {
    const c = compMap.get(s.competencyId) ?? { name: s.competency.name, initial: [], current: [] };
    c.current.push(s.score);
    if (s.initialScore !== null) c.initial.push(s.initialScore);
    compMap.set(s.competencyId, c);
  }

  const buckets = ['0–39', '40–59', '60–69', '70–84', '85–100'];
  const bucketOf = (v: number) => (v < 40 ? 0 : v < 60 ? 1 : v < 70 ? 2 : v < 85 ? 3 : 4);
  const finals = e.map((x) => x.finalScore).filter((v): v is number => v !== null);
  const activityScores = d.submissions.map((s) => s.evaluations[0]?.weightedScore).filter((v): v is number => v !== undefined);

  const criteria = new Map<string, number[]>();
  for (const s of d.submissions) for (const cs of s.evaluations[0]?.scores ?? []) criteria.set(cs.criterion.name, [...(criteria.get(cs.criterion.name) ?? []), cs.score]);
  const improvementCounts = new Map<string, number>();
  for (const s of d.submissions) for (const imp of asStringArray(s.evaluations[0]?.improvements)) {
    const key = imp.split(':')[0].slice(0, 80);
    improvementCounts.set(key, (improvementCounts.get(key) ?? 0) + 1);
  }

  return {
    learningEvolution: [
      { moment: 'Diagnóstico', score: mean(e.map((x) => x.initialScore)) },
      { moment: 'Durante o curso', score: mean(e.map((x) => x.duringScore)) },
      { moment: 'Avaliação final', score: mean(e.map((x) => x.finalScore)) },
    ],
    levelDistribution: [1, 2, 3, 4].map((l) => ({
      level: l,
      label: levelLabel(l),
      initial: e.filter((x) => x.initialLevel === l).length,
      current: e.filter((x) => (x.currentLevel ?? x.initialLevel) === l).length,
    })),
    progressByCourse: [...byCourse.entries()].map(([courseId, rows]) => ({
      courseId,
      course: rows[0].course.title,
      averageProgress: mean(rows.map((r) => r.progressPercent)),
      enrollments: rows.length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
    })),
    competencyPerformance: [...compMap.values()].map((c) => ({ competency: c.name, initial: mean(c.initial), current: mean(c.current), participants: c.current.length })),
    scoreDistribution: buckets.map((label, i) => ({
      range: label,
      finalAssessment: finals.filter((v) => bucketOf(v) === i).length,
      activities: activityScores.filter((v) => bucketOf(v) === i).length,
    })),
    participationOverTime: [...timeline.values()].map((t) => ({ ...t, activeParticipants: t.activeParticipants.size })),
    topDifficulties: {
      weakestCriteria: [...criteria.entries()]
        .map(([criterion, v]) => ({ criterion, average: mean(v), evaluations: v.length }))
        .sort((a, b) => (a.average ?? 0) - (b.average ?? 0))
        .slice(0, 6),
      frequentImprovements: [...improvementCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([text, count]) => ({ text, count })),
    },
  };
}

export const AnalyticsService = {
  async overview(f: AnalyticsFilter) {
    const d = await collect(f);
    const publishedCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });
    return { filters: { ...f, ...period(f) }, kpis: { ...kpis(d), publishedCourses }, charts: charts(d), hasData: d.enrollments.length > 0 };
  },

  async filterOptions() {
    const [courses, cohorts, participants] = await Promise.all([
      prisma.course.findMany({ where: { status: { not: 'DRAFT' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
      prisma.cohort.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { courses, cohorts, participants };
  },

  /** Visão ADDIE de um curso: cada etapa com seus indicadores. */
  async course(courseId: string, f: AnalyticsFilter) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, include: { competencies: { include: { competency: true } } } } },
    });
    if (!course) throw notFound('Curso não encontrado');
    const version = course.versions.find((v) => v.id === course.latestPublishedVersionId) ?? course.versions[0];
    const [structure, questionCount, rubricCount] = await Promise.all([
      prisma.module.findMany({ where: { courseVersionId: version.id }, orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, activity: { select: { id: true } } } } } }),
      prisma.question.count({ where: { assessment: { courseVersionId: version.id } } }),
      prisma.rubric.count({ where: { activity: { lesson: { module: { courseVersionId: version.id } } } } }),
    ]);
    const d = await collect({ ...f, courseId });
    const k = kpis(d);
    const c = charts(d);
    const lessonFunnel = structure.flatMap((m) =>
      m.lessons.map((l) => ({ module: m.title, lesson: l.title, completed: d.progress.filter((p) => p.lessonId === l.id).length })),
    );
    const gaps = c.competencyPerformance.filter((x) => x.initial !== null && x.initial < 50);
    const addie = (version.addieNotes ?? {}) as Record<string, string>;
    return {
      course: { id: course.id, title: course.title, status: course.status, generatedByAI: course.generatedByAI, versions: course.versions.length, publishedVersion: version.versionNumber },
      addie: {
        analysis: {
          notes: addie.analysis ?? '',
          participants: k.totalParticipants,
          averageDiagnostic: k.averageDiagnostic,
          levelDistribution: c.levelDistribution,
          competencyGaps: gaps,
        },
        design: {
          notes: addie.design ?? '',
          objectives: asStringArray(version.objectives),
          competencies: version.competencies.map((x) => x.competency.name),
          difficulty: version.difficulty,
          estimatedHours: version.estimatedHours,
          completionCriteria: version.completionCriteria,
        },
        development: {
          notes: addie.development ?? '',
          modules: structure.length,
          lessons: structure.reduce((a, m) => a + m.lessons.length, 0),
          activities: structure.reduce((a, m) => a + m.lessons.filter((l) => l.activity).length, 0),
          questions: questionCount,
          rubrics: rubricCount,
          generatedByAI: course.generatedByAI,
          versions: course.versions.map((v) => ({ versionNumber: v.versionNumber, status: v.status, publishedAt: v.publishedAt })),
        },
        implementation: {
          notes: addie.implementation ?? '',
          enrollments: k.enrollments,
          activationRate: k.activationRate,
          participationRate: k.participationRate,
          averageProgress: c.progressByCourse[0]?.averageProgress ?? null,
          tutorInteractions: k.tutorInteractions,
          totalActivities: k.totalActivities,
          averageLearningMinutes: k.averageLearningMinutes,
          lessonFunnel,
          participationOverTime: c.participationOverTime,
          difficulties: c.topDifficulties,
        },
        evaluation: {
          notes: addie.evaluation ?? '',
          learningEvolution: c.learningEvolution,
          knowledgeGain: k.knowledgeGain,
          normalizedGain: k.normalizedGain,
          feedbackImprovement: k.feedbackImprovement,
          approvalRate: k.approvalRate,
          completionRate: k.completionRate,
          satisfaction: k.satisfaction,
          applicability: k.applicability,
          competencyPerformance: c.competencyPerformance,
          scoreDistribution: c.scoreDistribution,
        },
      },
    };
  },

  /** Acompanhamento individual detalhado (somente administradores). */
  async participant(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true, profile: true, cohortMemberships: { select: { cohort: { select: { id: true, name: true } } } } },
    });
    if (!user) throw notFound('Participante não encontrado');
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } }, courseVersion: { select: { versionNumber: true } }, certificate: true },
      orderBy: { createdAt: 'desc' },
    });
    const ids = enrollments.map((e) => e.id);
    const [attempts, submissions, scores, sessions, tutorCount, lessonsDone, achievements] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where: { userId, status: 'SUBMITTED' },
        orderBy: { submittedAt: 'asc' },
        include: {
          assessment: { select: { id: true, title: true, kind: true, passingScore: true } },
          answers: { include: { question: { select: { prompt: true, type: true, dimension: true, selfReported: true, options: { select: { id: true, label: true, isCorrect: true } } } } } },
        },
      }),
      prisma.activitySubmission.findMany({
        where: { userId },
        orderBy: [{ activityId: 'asc' }, { attemptNumber: 'asc' }],
        include: {
          activity: { select: { id: true, title: true, passingScore: true, lesson: { select: { title: true } } } },
          evaluations: { orderBy: { createdAt: 'desc' }, include: { scores: { include: { criterion: { select: { name: true } } } }, reviewedBy: { select: { name: true } } } },
        },
      }),
      prisma.competencyScore.findMany({ where: { userId }, include: { competency: true } }),
      prisma.learningSession.findMany({ where: { userId }, select: { startedAt: true, activeSeconds: true } }),
      prisma.tutorMessage.count({ where: { role: 'STUDENT', conversation: { userId } } }),
      prisma.learningProgress.count({ where: { enrollmentId: { in: ids }, status: 'COMPLETED' } }),
      prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
    ]);

    const activities = new Map<string, { activity: string; lesson: string; passingScore: number; attempts: { id: string; attemptNumber: number; content: string; createdAt: Date; evaluation: (typeof submissions)[number]['evaluations'][number] | null; history: number }[] }>();
    for (const s of submissions) {
      const entry = activities.get(s.activityId) ?? { activity: s.activity.title, lesson: s.activity.lesson.title, passingScore: s.activity.passingScore, attempts: [] };
      entry.attempts.push({ id: s.id, attemptNumber: s.attemptNumber, content: s.content, createdAt: s.createdAt, evaluation: s.evaluations.find((e) => e.isCurrent) ?? null, history: s.evaluations.length });
      activities.set(s.activityId, entry);
    }
    const activityList = [...activities.values()].map((a) => ({
      ...a,
      firstScore: a.attempts[0]?.evaluation?.weightedScore ?? null,
      lastScore: a.attempts[a.attempts.length - 1]?.evaluation?.weightedScore ?? null,
      improvement: feedbackImprovement(a.attempts.filter((x) => x.evaluation).map((x) => ({ attemptNumber: x.attemptNumber, score: x.evaluation!.weightedScore }))),
    }));

    // Dificuldades recorrentes: critérios de rubrica com nota baixa em múltiplas evidências.
    const criterionEvidence = submissions.flatMap((s) => (s.evaluations.find((e) => e.isCurrent)?.scores ?? []).map((cs) => ({ competencyName: cs.criterion.name, score: cs.score })));
    const diagnostic = attempts.find((a) => a.assessment.kind === 'DIAGNOSTIC');
    const activeDays = new Set(sessions.map((s) => s.startedAt.toISOString().slice(0, 10))).size;
    const totalLessons = await prisma.lesson.count({ where: { module: { courseVersionId: { in: enrollments.map((e) => e.courseVersionId) } } } });

    return {
      user: { ...user, cohorts: user.cohortMemberships.map((m) => m.cohort), cohortMemberships: undefined },
      enrollments: enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        course: e.course.title,
        versionNumber: e.courseVersion.versionNumber,
        status: e.status,
        progressPercent: e.progressPercent,
        startDate: e.startDate,
        dueDate: e.dueDate,
        completedAt: e.completedAt,
        initialLevel: e.initialLevel,
        currentLevel: e.currentLevel,
        initialScore: e.initialScore,
        duringScore: e.duringScore,
        finalScore: e.finalScore,
        knowledgeGain: knowledgeGain(e.initialScore, e.finalScore),
        normalizedGain: normalizedGain(e.initialScore, e.finalScore),
        passed: e.passed,
        certificateCode: e.certificate?.code ?? null,
      })),
      diagnostic: diagnostic
        ? {
            level: diagnostic.level,
            levelLabel: levelLabel(diagnostic.level),
            objectiveScore: diagnostic.objectiveScore,
            selfReportScore: diagnostic.selfReportScore,
            submittedAt: diagnostic.submittedAt,
            profile: (diagnostic.result as { profile?: unknown } | null)?.profile ?? null,
            answers: diagnostic.answers.map((a) => ({
              question: a.question.prompt,
              type: a.question.type,
              dimension: a.question.dimension,
              selfReported: a.question.selfReported,
              answer:
                a.textAnswer ??
                (a.likertValue ? `${a.likertValue}/5` : a.question.options.filter((o) => a.selectedOptionIds.includes(o.id)).map((o) => o.label).join('; ')),
              score: a.score,
              isCorrect: a.isCorrect,
            })),
          }
        : null,
      assessments: attempts
        .filter((a) => a.assessment.kind !== 'DIAGNOSTIC')
        .map((a) => ({ id: a.id, title: a.assessment.title, kind: a.assessment.kind, attemptNumber: a.attemptNumber, score: a.overallScore, objectiveScore: a.objectiveScore, passed: a.passed, submittedAt: a.submittedAt })),
      competencies: scores.map((s) => ({ id: s.competencyId, name: s.competency.name, initialScore: s.initialScore, score: s.score, evidenceCount: s.evidenceCount, courseEnrollmentId: s.enrollmentId })),
      activities: activityList,
      recurringDifficulties: recurringDifficulties(criterionEvidence),
      engagement: {
        activeDays,
        learningMinutes: round(sessions.reduce((a, s) => a + s.activeSeconds, 0) / 60),
        sessions: sessions.length,
        lessonsCompleted: lessonsDone,
        totalLessons,
        submissions: submissions.length,
        tutorInteractions: tutorCount,
        index: engagementIndex({ activeDays, lessonsCompleted: lessonsDone, totalLessons, submissions: submissions.length, tutorInteractions: tutorCount, returns: Math.max(0, sessions.length - 1) }),
      },
      achievements: achievements.map((a) => ({ ...a.achievement, awardedAt: a.awardedAt })),
      evolution: enrollments.map((e) => ({ course: e.course.title, diagnostic: e.initialScore, during: e.duringScore, final: e.finalScore })),
    };
  },

  /** Linhas por matrícula para exportação (CSV). Dados autodeclarados são identificados nas colunas. */
  async enrollmentRows(f: AnalyticsFilter) {
    const d = await collect(f);
    const cohortNames = new Map((await prisma.cohort.findMany()).map((c) => [c.id, c.name]));
    const versions = new Map((await prisma.courseVersion.findMany({ where: { id: { in: d.enrollments.map((e) => e.courseVersionId) } }, select: { id: true, versionNumber: true } })).map((v) => [v.id, v.versionNumber]));
    const satByEnrollment = await prisma.assessmentAnswer.findMany({
      where: { attempt: { enrollmentId: { in: d.enrollments.map((e) => e.id) }, assessment: { kind: 'SATISFACTION' } }, likertValue: { not: null } },
      select: { likertValue: true, question: { select: { helpText: true } }, attempt: { select: { enrollmentId: true } } },
    });
    return d.enrollments.map((e) => {
      const subs = d.submissions.filter((s) => s.enrollmentId === e.id);
      const sat = satByEnrollment.filter((a) => a.attempt.enrollmentId === e.id);
      const deltas = feedbackDeltas(subs);
      return {
        participante: e.user.name,
        curso: e.course.title,
        versao: versions.get(e.courseVersionId) ?? '',
        turma: e.cohortId ? cohortNames.get(e.cohortId) ?? '' : '',
        status: e.status,
        progresso_pct: e.progressPercent,
        nivel_inicial: e.initialLevel ?? '',
        nivel_atual: e.currentLevel ?? '',
        nota_diagnostico: e.initialScore ?? '',
        nota_durante: e.duringScore ?? '',
        nota_final: e.finalScore ?? '',
        evolucao_pp: knowledgeGain(e.initialScore, e.finalScore) ?? '',
        ganho_normalizado_pct: normalizedGain(e.initialScore, e.finalScore) ?? '',
        evolucao_apos_feedback_pp: mean(deltas) ?? '',
        aprovado: e.passed === null ? '' : e.passed ? 'sim' : 'não',
        minutos_ativos: round(d.sessions.filter((s) => s.enrollmentId === e.id).reduce((a, s) => a + s.activeSeconds, 0) / 60),
        atividades_submetidas: subs.length,
        interacoes_tutor: d.tutorMessages.filter((m) => m.conversation.enrollmentId === e.id).length,
        satisfacao_autodeclarada: likertTo100(mean(sat.filter((a) => a.question.helpText === 'SATISFACAO').map((a) => a.likertValue!))) ?? '',
        aplicabilidade_autodeclarada: likertTo100(mean(sat.filter((a) => a.question.helpText === 'APLICABILIDADE').map((a) => a.likertValue!))) ?? '',
      };
    });
  },

  async competencyRows(f: AnalyticsFilter) {
    const d = await collect(f);
    return d.scores.map((s) => {
      const e = d.enrollments.find((x) => x.id === s.enrollmentId)!;
      return {
        participante: e.user.name,
        curso: e.course.title,
        competencia: s.competency.name,
        dominio_inicial: s.initialScore ?? '',
        dominio_atual: s.score,
        evidencias: s.evidenceCount,
      };
    });
  },

  async evaluationRows(f: AnalyticsFilter) {
    const rows = await prisma.activitySubmission.findMany({
      where: { enrollment: enrollmentWhere(f) },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { name: true } },
        activity: { select: { title: true } },
        enrollment: { select: { course: { select: { title: true } } } },
        evaluations: { where: { isCurrent: true }, take: 1 },
      },
    });
    return rows.map((r) => ({
      participante: r.user.name,
      curso: r.enrollment.course.title,
      atividade: r.activity.title,
      tentativa: r.attemptNumber,
      revisao: r.isRevision ? 'sim' : 'não',
      nota_ponderada: r.evaluations[0]?.weightedScore ?? '',
      nivel_dominio: r.evaluations[0]?.masteryLevel ?? '',
      origem_avaliacao: r.evaluations[0]?.source ?? '',
      requer_revisao_humana: r.evaluations[0]?.requiresHumanReview ? 'sim' : 'não',
      data: r.createdAt,
    }));
  },
};
