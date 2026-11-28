import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/database/prisma';
import { achievements, competencies, recruitmentCourse } from '../../src/database/seed/content';
import { loadCourse } from '../../src/database/seed/load-course';
import { hashPassword } from '../../src/modules/auth/password';

export const ADMIN = { email: 'admin@teste.local', password: 'Admin@12345' };
export const PASSWORD = 'Aluno@12345';

let appPromise: Promise<FastifyInstance> | null = null;
export const getApp = () => (appPromise ??= buildApp({ logger: false, rateLimit: false }).then(async (a) => (await a.ready(), a)));

/** Prepara dados mínimos: catálogo, administrador e o curso principal publicado (uma única vez). */
export async function ensureBaseData() {
  for (const c of competencies) await prisma.competency.upsert({ where: { key: c.key }, create: c, update: {} });
  const ids = new Map((await prisma.competency.findMany()).map((c) => [c.key, c.id]));
  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { key: a.key }, create: { key: a.key, title: a.title, description: a.description, icon: a.icon, criteria: a.criteria, competencyId: a.competencyKey ? ids.get(a.competencyKey) : null }, update: {} });
  }
  const admin = await prisma.user.upsert({
    where: { email: ADMIN.email },
    create: { email: ADMIN.email, name: 'Admin Teste', role: 'SUPER_ADMIN', passwordHash: await hashPassword(ADMIN.password) },
    update: {},
  });
  await prisma.aISettings.upsert({ where: { id: 'default' }, create: { id: 'default', activeProvider: 'demo' }, update: { activeProvider: 'demo' } });
  const course = await loadCourse(recruitmentCourse, { createdById: admin.id, isDemo: false });
  return { admin, course };
}

export class Client {
  cookie = '';
  constructor(private app: FastifyInstance) {}

  async login(email: string, password: string) {
    const res = await this.req('POST', '/api/auth/login', { email, password });
    const set = res.headers['set-cookie'];
    this.cookie = (Array.isArray(set) ? set[0] : String(set ?? '')).split(';')[0];
    return res;
  }

  async req(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: unknown, opts: { csrf?: boolean } = {}) {
    return this.app.inject({
      method,
      url,
      payload: payload as never,
      headers: {
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...(opts.csrf === false ? {} : { 'x-requested-with': 'XMLHttpRequest' }),
      },
    });
  }

  get = (url: string) => this.req('GET', url);
  post = (url: string, body: unknown = {}) => this.req('POST', url, body);
  put = (url: string, body: unknown) => this.req('PUT', url, body);
  patch = (url: string, body: unknown) => this.req('PATCH', url, body);
  delete = (url: string) => this.req('DELETE', url);
}

let seq = 0;
export async function createStudent(admin: Client, name = 'Estudante') {
  seq++;
  const email = `estudante${seq}.${Date.now()}@teste.local`;
  const res = await admin.post('/api/users', { name: `${name} ${seq}`, email, password: PASSWORD, role: 'STUDENT', jobTitle: 'Analista de Recrutamento' });
  if (res.statusCode !== 201) throw new Error(res.body);
  return { id: res.json().data.id as string, email };
}

/** Respostas para todas as questões de uma avaliação, acertando (good=true) ou errando as objetivas. */
export async function answersFor(assessmentId: string, good: boolean) {
  const a = await prisma.assessment.findUniqueOrThrow({ where: { id: assessmentId }, include: { questions: { include: { options: true } } } });
  return a.questions.map((q) => {
    if (q.type === 'LIKERT') return { questionId: q.id, likertValue: good ? 4 : 2 };
    if (q.type === 'OPEN') return { questionId: q.id, textAnswer: 'Faço triagem e entrevistas.' };
    const correct = q.options.filter((o) => o.isCorrect);
    const wrong = q.options.filter((o) => !o.isCorrect);
    if (q.type === 'MULTIPLE_CHOICE') return { questionId: q.id, selectedOptionIds: (good && correct.length ? correct : [q.options[0]]).map((o) => o.id) };
    const pick = good ? correct[0] ?? q.options[q.options.length - 1] : wrong[0] ?? q.options[0];
    return { questionId: q.id, selectedOptionIds: [pick.id] };
  });
}
