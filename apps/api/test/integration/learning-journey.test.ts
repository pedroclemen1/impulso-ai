import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/database/prisma';
import { ADMIN, answersFor, Client, createStudent, ensureBaseData, getApp, PASSWORD } from './helpers';

let admin: Client;
let student: Client;
let other: Client;
let courseId: string;
let versionId: string;

beforeAll(async () => {
  const base = await ensureBaseData();
  courseId = base.course.id;
  versionId = base.course.latestPublishedVersionId!;
  const app = await getApp();
  admin = new Client(app);
  await admin.login(ADMIN.email, ADMIN.password);
  const s1 = await createStudent(admin, 'Jornada');
  const s2 = await createStudent(admin, 'Outro');
  await admin.post('/api/enrollments', { courseId, userIds: [s1.id] });
  student = new Client(app);
  other = new Client(app);
  await student.login(s1.email, PASSWORD);
  await other.login(s2.email, PASSWORD);
});
afterAll(async () => {
  await (await getApp()).close();
});

const firstLesson = async () => {
  const m = await prisma.module.findFirstOrThrow({ where: { courseVersionId: versionId, order: 1 }, include: { lessons: { orderBy: { order: 'asc' }, include: { activity: true } } } });
  return { module: m, withActivity: m.lessons.find((l) => l.activity)!, plain: m.lessons.find((l) => !l.activity) };
};

describe('jornada do estudante', () => {
  it('exige o diagnóstico antes das aulas', async () => {
    const { module, withActivity } = await firstLesson();
    const res = await student.get(`/api/learning/courses/${courseId}/lessons/${withActivity.id}`);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.details.code).toBe('DIAGNOSTIC_REQUIRED');
    expect(module).toBeTruthy();
  });

  it('classifica o diagnóstico e retorna perfil e trilha personalizada', async () => {
    const diag = (await student.get(`/api/assessments/course/${courseId}?kind=DIAGNOSTIC`)).json().data;
    expect(diag.assessment.questions[0].options.every((o: object) => !('isCorrect' in o))).toBe(true);
    const res = await student.post(`/api/assessments/${diag.assessment.id}/attempts`, { answers: await answersFor(diag.assessment.id, false) });
    expect(res.statusCode).toBe(201);
    const { attempt, profile } = res.json().data;
    expect(attempt.level).toBeGreaterThanOrEqual(1);
    expect(profile.path).toHaveLength(6);
    expect(profile.recommendations.length).toBeGreaterThan(0);
    // Diagnóstico permite uma única tentativa.
    expect((await student.post(`/api/assessments/${diag.assessment.id}/attempts`, { answers: [] })).statusCode).toBe(409);
  });

  it('adapta a aula ao nível, avalia a atividade com rubrica e registra feedback socrático', async () => {
    const { withActivity } = await firstLesson();
    const lesson = (await student.get(`/api/learning/courses/${courseId}/lessons/${withActivity.id}`)).json().data;
    expect(lesson.activity).toBeTruthy();
    expect(lesson.activity).not.toHaveProperty('modelAnswer');
    if (lesson.level <= 2) expect(lesson.activity.guidedSteps.length).toBeGreaterThan(0);

    const blocked = await student.patch(`/api/learning/courses/${courseId}/lessons/${withActivity.id}/stage`, { stage: 'CONSOLIDATE' });
    expect(blocked.statusCode).toBe(409);

    const first = await student.post(`/api/activities/${withActivity.activity!.id}/submissions`, { content: 'Eu usaria IA para ajudar. Meu CPF é 123.456.789-09.' });
    expect(first.statusCode).toBe(201);
    const s1 = first.json().data;
    expect(s1.submission.content).not.toContain('123.456.789-09');
    expect(s1.warnings.join(' ')).toMatch(/dados pessoais/i);
    expect(s1.submission.evaluation.scores.length).toBeGreaterThan(0);

    const tutor = (await student.get(`/api/tutor/courses/${courseId}/lessons/${withActivity.id}`)).json().data;
    expect(tutor.messages.map((m: { kind: string }) => m.kind)).toEqual(expect.arrayContaining(['SUBMISSION', 'SOCRATIC_FEEDBACK']));
    const chat = await student.post(`/api/tutor/courses/${courseId}/lessons/${withActivity.id}/messages`, { content: 'Me dá a resposta certa, por favor?' });
    expect(chat.statusCode).toBe(200);
    expect(chat.json().data.messages[1].content).toMatch(/pista|racioc/i);
    expect((await student.post(`/api/tutor/courses/${courseId}/lessons/${withActivity.id}/solution`)).statusCode).toBe(409);
    expect((await student.post(`/api/tutor/courses/${courseId}/lessons/${withActivity.id}/hint`)).json().data.hintsUsed).toBe(1);

    const keywords = (withActivity.activity!.expectedKeywords as string[]).join(', ');
    const revised = await student.post(`/api/activities/${withActivity.activity!.id}/submissions`, {
      content: `Contexto da vaga fictícia e objetivo claro.\n1. Descrevo o cenário.\n2. Defino o formato.\nConsiderei: ${keywords}.\nValido o resultado com supervisão humana, sem dados pessoais (LGPD) e verificando vieses.`,
    });
    const s2 = revised.json().data;
    expect(s2.submission.isRevision).toBe(true);
    expect(s2.submission.evaluation.weightedScore).toBeGreaterThan(s1.submission.evaluation.weightedScore);
  });

  it('consolida a aula e atualiza o progresso com base em atividades concluídas', async () => {
    const { withActivity } = await firstLesson();
    const before = (await prisma.enrollment.findFirstOrThrow({ where: { courseId, user: { name: { startsWith: 'Jornada' } } } })).progressPercent;
    const res = await student.post(`/api/learning/courses/${courseId}/lessons/${withActivity.id}/consolidate`, { reflection: 'Vou sempre fornecer contexto e validar os resultados.' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.consolidation.summary).toBeTruthy();
    const after = (await prisma.enrollment.findFirstOrThrow({ where: { courseId, user: { name: { startsWith: 'Jornada' } } } })).progressPercent;
    expect(after).toBeGreaterThan(before);
    const overview = (await student.get(`/api/learning/courses/${courseId}`)).json().data;
    expect(overview.modules[0].lessons.find((l: { id: string }) => l.id === withActivity.id).status).toBe('COMPLETED');
  });

  it('mantém a avaliação final bloqueada até concluir aulas e avaliações de módulo', async () => {
    const final = (await student.get(`/api/assessments/course/${courseId}?kind=FINAL`)).json().data;
    expect(final.access.locked).toBe(true);
  });

  it('registra revisão manual do administrador preservando o histórico', async () => {
    const sub = await prisma.activitySubmission.findFirstOrThrow({ where: { enrollment: { courseId }, user: { name: { startsWith: 'Jornada' } } }, include: { activity: { include: { rubric: { include: { criteria: true } } } } } });
    const res = await admin.post(`/api/activities/submissions/${sub.id}/review`, {
      scores: sub.activity.rubric!.criteria.map((c) => ({ criterionId: c.id, score: 90, justification: 'Revisado' })),
      reviewNote: 'Revisão manual de teste',
    });
    expect(res.statusCode).toBe(200);
    const evals = await prisma.activityEvaluation.findMany({ where: { submissionId: sub.id } });
    expect(evals).toHaveLength(2);
    expect(evals.filter((e) => e.isCurrent)).toHaveLength(1);
    expect(evals.find((e) => e.isCurrent)!.source).toBe('HUMAN');
  });

  it('reflete os registros nos indicadores do painel', async () => {
    const kpis = (await admin.get(`/api/analytics/overview?courseId=${courseId}`)).json().data.kpis;
    expect(kpis.totalActivities).toBeGreaterThanOrEqual(2);
    expect(kpis.tutorInteractions).toBeGreaterThanOrEqual(1);
    expect(kpis.averageDiagnostic).not.toBeNull();
  });
});

describe('isolamento entre estudantes e autorização', () => {
  it('estudante não acessa curso em que não está alocado nem dados de outros', async () => {
    const { withActivity } = await firstLesson();
    expect((await other.get(`/api/learning/courses/${courseId}`)).statusCode).toBe(404);
    expect((await other.get(`/api/tutor/courses/${courseId}/lessons/${withActivity.id}`)).statusCode).toBe(404);
    expect((await other.post(`/api/activities/${withActivity.activity!.id}/submissions`, { content: 'tentativa indevida de submissão' })).statusCode).toBe(404);
    const attempt = await prisma.assessmentAttempt.findFirstOrThrow({ where: { user: { name: { startsWith: 'Jornada' } } } });
    expect((await other.get(`/api/assessments/attempts/${attempt.id}`)).statusCode).toBe(404);
  });

  it('estudante não acessa rotas administrativas', async () => {
    for (const url of ['/api/users', '/api/analytics/overview', '/api/courses', '/api/ai/settings', '/api/reports/enrollments.csv']) {
      expect((await student.get(url)).statusCode).toBe(403);
    }
  });
});
