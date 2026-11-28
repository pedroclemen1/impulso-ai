import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/database/prisma';
import { ADMIN, Client, createStudent, ensureBaseData, getApp, PASSWORD } from './helpers';

let admin: Client;
let courseId: string;

beforeAll(async () => {
  const base = await ensureBaseData();
  courseId = base.course.id;
  admin = new Client(await getApp());
  await admin.login(ADMIN.email, ADMIN.password);
});
afterAll(async () => {
  await (await getApp()).close();
});

describe('autenticação', () => {
  it('recusa credenciais inválidas e aceita válidas com cookie HttpOnly', async () => {
    const c = new Client(await getApp());
    expect((await c.login(ADMIN.email, 'errada')).statusCode).toBe(401);
    const ok = await c.login(ADMIN.email, ADMIN.password);
    expect(ok.statusCode).toBe(200);
    expect(String(ok.headers['set-cookie'])).toMatch(/HttpOnly/i);
    expect((await c.get('/api/auth/me')).json().data.user.role).toBe('SUPER_ADMIN');
  });

  it('exige autenticação e encerra a sessão no logout', async () => {
    const c = new Client(await getApp());
    expect((await c.get('/api/auth/me')).statusCode).toBe(401);
    await c.login(ADMIN.email, ADMIN.password);
    await c.post('/api/auth/logout');
    expect((await c.get('/api/auth/me')).statusCode).toBe(401);
  });

  it('bloqueia requisições que alteram estado sem cabeçalho anti-CSRF', async () => {
    const res = await admin.req('POST', '/api/cohorts', { name: 'X' }, { csrf: false });
    expect(res.statusCode).toBe(403);
  });

  it('impede login de conta desativada', async () => {
    const s = await createStudent(admin);
    await admin.patch(`/api/users/${s.id}`, { status: 'INACTIVE' });
    expect((await new Client(await getApp()).login(s.email, PASSWORD)).statusCode).toBe(401);
  });
});

describe('cursos: criação, edição e publicação', () => {
  it('cria curso, adiciona conteúdo e só publica após validação', async () => {
    const comp = await prisma.competency.findFirstOrThrow();
    const created = await admin.post('/api/courses', {
      title: 'Curso de Teste de Integração',
      description: 'Curso criado nos testes de integração da plataforma.',
      objectives: ['Aprender a testar'],
      difficulty: 'BEGINNER',
      estimatedHours: 1,
      competencyIds: [comp.id],
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id;

    const blocked = await admin.post(`/api/courses/${id}/publish`);
    expect(blocked.statusCode).toBe(422);
    expect(blocked.json().error.details.issues.length).toBeGreaterThan(0);

    const mod = await admin.post(`/api/courses/${id}/modules`, { title: 'Módulo 1', description: '', objectives: [] });
    const moduleId = mod.json().data.id;
    const lesson = await admin.post(`/api/courses/${id}/modules/${moduleId}/lessons`, {
      title: 'Aula 1',
      learnContent: 'Conteúdo teórico suficiente para a aula de teste de integração.',
      competencies: [{ competencyId: comp.id, weight: 1 }],
    });
    expect(lesson.statusCode).toBe(201);
    const lessonId = lesson.json().data.id;
    const act = await admin.put(`/api/courses/${id}/lessons/${lessonId}/activity`, {
      type: 'PROMPT_EXERCISE',
      title: 'Atividade',
      instructions: 'Escreva um prompt completo.',
      rubric: { title: 'Rubrica', criteria: [{ key: 'clareza', name: 'Clareza', weight: 1 }] },
    });
    expect(act.statusCode).toBe(200);
    const tf = { type: 'TRUE_FALSE', prompt: 'LLMs podem alucinar?', competencyId: comp.id, options: [{ label: 'Verdadeiro', isCorrect: true }, { label: 'Falso' }] };
    expect((await admin.put(`/api/courses/${id}/assessments`, { kind: 'DIAGNOSTIC', title: 'Diagnóstico', questions: [tf] })).statusCode).toBe(200);
    expect((await admin.put(`/api/courses/${id}/assessments`, { kind: 'FINAL', title: 'Final', questions: [tf] })).statusCode).toBe(200);

    const published = await admin.post(`/api/courses/${id}/publish`);
    expect(published.statusCode).toBe(200);
    expect(published.json().data.versionNumber).toBe(1);

    // Versões publicadas são imutáveis: editar exige um novo rascunho (v2).
    expect((await admin.post(`/api/courses/${id}/modules`, { title: 'Novo' })).statusCode).toBe(409);
    const draft = await admin.post(`/api/courses/${id}/versions`);
    expect(draft.json().data.versionNumber).toBe(2);
    const detail = (await admin.get(`/api/courses/${id}`)).json().data;
    expect(detail.editable).toBe(true);
    expect(detail.version.modules[0].lessons[0].activity.rubric.criteria).toHaveLength(1);
  });

  it('duplica um curso como novo rascunho', async () => {
    const res = await admin.post(`/api/courses/${courseId}/duplicate`);
    expect(res.statusCode).toBe(201);
    const copy = (await admin.get(`/api/courses/${res.json().data.id}`)).json().data;
    expect(copy.course.status).toBe('DRAFT');
    expect(copy.version.modules).toHaveLength(6);
  });
});

describe('participantes, turmas e alocações', () => {
  it('importa CSV com relatório de erros', async () => {
    const csv = 'nome,email,cargo\nPessoa Válida,valida.csv@teste.local,Analista\nSem Email,,Analista\nPessoa Válida 2,valida.csv@teste.local,Analista';
    const dry = (await admin.post('/api/users/import', { csv, dryRun: true })).json().data;
    expect(dry.created).toHaveLength(1);
    expect(dry.errors).toHaveLength(2);
    expect(await prisma.user.count({ where: { email: 'valida.csv@teste.local' } })).toBe(0);
    const real = (await admin.post('/api/users/import', { csv })).json().data;
    expect(real.created[0].temporaryPassword).toBeTruthy();
  });

  it('aloca individualmente e por turma sem duplicar a mesma versão', async () => {
    const a = await createStudent(admin);
    const b = await createStudent(admin);
    const cohort = (await admin.post('/api/cohorts', { name: `Turma ${Date.now()}`, memberIds: [a.id, b.id] })).json().data;
    const first = (await admin.post('/api/enrollments', { courseId, userIds: [a.id] })).json().data;
    expect(first.created).toBe(1);
    const second = (await admin.post('/api/enrollments', { courseId, cohortId: cohort.id })).json().data;
    expect(second).toMatchObject({ created: 1, skippedExisting: 1 });
    expect(await prisma.enrollment.count({ where: { userId: a.id, courseId } })).toBe(1);
  });
});
