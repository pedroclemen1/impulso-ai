import { paginationSchema, passwordSchema, userCreateSchema, userUpdateSchema } from '@impulso/shared';
import type { Prisma } from '@prisma/client';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { randomBytes } from 'node:crypto';
import Papa from 'papaparse';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { currentUser, requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { ok, pageArgs, pageMeta } from '../../shared/http';
import { hashPassword } from '../auth/password';
import { revokeAllUserSessions } from '../auth/session.service';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  isDemo: true,
  lastLoginAt: true,
  createdAt: true,
  profile: true,
  cohortMemberships: { select: { cohort: { select: { id: true, name: true } } } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.UserSelect;

const shape = (u: Prisma.UserGetPayload<{ select: typeof userSelect }>) => ({
  ...u,
  cohorts: u.cohortMemberships.map((m) => m.cohort),
  cohortMemberships: undefined,
  enrollmentCount: u._count.enrollments,
  _count: undefined,
});

const generatePassword = () => `Imp${randomBytes(6).toString('base64url')}9`;

const csvRowSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  jobTitle: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  cohort: z.string().trim().max(120).optional(),
  password: passwordSchema.optional(),
});

const HEADER_ALIASES: Record<string, string> = {
  nome: 'name',
  name: 'name',
  email: 'email',
  'e-mail': 'email',
  cargo: 'jobTitle',
  jobtitle: 'jobTitle',
  departamento: 'department',
  department: 'department',
  empresa: 'company',
  company: 'company',
  turma: 'cohort',
  cohort: 'cohort',
  senha: 'password',
  password: 'password',
};

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'Lista usuários com filtros, ordenação e paginação',
        querystring: paginationSchema.extend({
          role: z.enum(['SUPER_ADMIN', 'STUDENT']).optional(),
          status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
          cohortId: z.string().uuid().optional(),
        }),
      },
    },
    async (req) => {
      const q = req.query;
      const where: Prisma.UserWhereInput = {
        ...(q.role ? { role: q.role } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.cohortId ? { cohortMemberships: { some: { cohortId: q.cohortId } } } : {}),
        ...(q.search
          ? {
              OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { email: { contains: q.search, mode: 'insensitive' } },
                { profile: { department: { contains: q.search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      };
      const orderBy: Prisma.UserOrderByWithRelationInput =
        q.sort === 'name' ? { name: q.order } : q.sort === 'email' ? { email: q.order } : q.sort === 'lastLoginAt' ? { lastLoginAt: q.order } : { createdAt: q.order };
      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({ where, orderBy, ...pageArgs(q), select: userSelect }),
      ]);
      return ok(users.map(shape), pageMeta(q, total));
    },
  );

  app.post('/', { schema: { tags: ['users'], summary: 'Cadastra usuário', body: userCreateSchema } }, async (req, reply) => {
    const b = req.body;
    if (await prisma.user.findUnique({ where: { email: b.email } })) throw conflict('Já existe um usuário com este e-mail');
    const user = await prisma.user.create({
      data: {
        name: b.name,
        email: b.email,
        role: b.role,
        passwordHash: await hashPassword(b.password),
        profile: { create: { jobTitle: b.jobTitle || null, department: b.department || null, company: b.company || null } },
        cohortMemberships: b.cohortIds?.length ? { create: b.cohortIds.map((cohortId) => ({ cohortId })) } : undefined,
      },
      select: userSelect,
    });
    await audit(req, 'user.create', 'User', user.id, { email: user.email, role: user.role });
    return reply.status(201).send(ok(shape(user)));
  });

  app.get('/:userId', { schema: { tags: ['users'], params: z.object({ userId: z.string().uuid() }) } }, async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: userSelect });
    if (!user) throw notFound('Usuário não encontrado');
    return ok(shape(user));
  });

  app.patch('/:userId', { schema: { tags: ['users'], summary: 'Edita, ativa ou desativa usuário', params: z.object({ userId: z.string().uuid() }), body: userUpdateSchema } }, async (req) => {
    const me = currentUser(req);
    const b = req.body;
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target) throw notFound('Usuário não encontrado');
    if (target.id === me.id && (b.status === 'INACTIVE' || (b.role && b.role !== 'SUPER_ADMIN'))) {
      throw badRequest('Você não pode desativar ou rebaixar a própria conta');
    }
    if (b.email && b.email !== target.email && (await prisma.user.findUnique({ where: { email: b.email } }))) throw conflict('E-mail já utilizado');
    const profileData = {
      ...(b.jobTitle !== undefined ? { jobTitle: b.jobTitle || null } : {}),
      ...(b.department !== undefined ? { department: b.department || null } : {}),
      ...(b.company !== undefined ? { company: b.company || null } : {}),
    };
    const user = await prisma.$transaction(async (tx) => {
      if (b.cohortIds) {
        await tx.cohortMember.deleteMany({ where: { userId: target.id, cohortId: { notIn: b.cohortIds } } });
        for (const cohortId of b.cohortIds) {
          await tx.cohortMember.upsert({ where: { cohortId_userId: { cohortId, userId: target.id } }, create: { cohortId, userId: target.id }, update: {} });
        }
      }
      return tx.user.update({
        where: { id: target.id },
        data: {
          ...(b.name ? { name: b.name } : {}),
          ...(b.email ? { email: b.email } : {}),
          ...(b.role ? { role: b.role } : {}),
          ...(b.status ? { status: b.status } : {}),
          ...(b.password ? { passwordHash: await hashPassword(b.password) } : {}),
          profile: { upsert: { create: profileData, update: profileData } },
        },
        select: userSelect,
      });
    });
    if (b.status === 'INACTIVE' || b.password) await revokeAllUserSessions(target.id);
    await audit(req, 'user.update', 'User', target.id, { fields: Object.keys(b).filter((k) => k !== 'password'), passwordChanged: !!b.password });
    return ok(shape(user));
  });

  app.post(
    '/import',
    {
      schema: {
        tags: ['users'],
        summary: 'Importa participantes via CSV (colunas: nome,email,cargo,departamento,empresa,turma,senha)',
        body: z.object({ csv: z.string().min(1).max(2_000_000), dryRun: z.boolean().default(false) }),
      },
    },
    async (req) => {
      const parsed = Papa.parse<Record<string, string>>(req.body.csv.trim(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim(),
      });
      if (!parsed.meta.fields?.includes('name') || !parsed.meta.fields?.includes('email')) {
        throw badRequest('O CSV precisa das colunas "nome" e "email".');
      }
      if (parsed.data.length > 1000) throw badRequest('Importe no máximo 1000 linhas por vez.');
      const errors: { line: number; email?: string; message: string }[] = [];
      const created: { line: number; email: string; name: string; temporaryPassword?: string }[] = [];
      const seen = new Set<string>();
      const cohorts = new Map((await prisma.cohort.findMany()).map((c) => [c.name.toLowerCase(), c.id]));

      for (const [i, row] of parsed.data.entries()) {
        const line = i + 2;
        const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? undefined : v]));
        const r = csvRowSchema.safeParse(clean);
        if (!r.success) {
          errors.push({ line, email: row.email, message: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') });
          continue;
        }
        const d = r.data;
        if (seen.has(d.email)) {
          errors.push({ line, email: d.email, message: 'E-mail duplicado no arquivo' });
          continue;
        }
        seen.add(d.email);
        if (await prisma.user.findUnique({ where: { email: d.email } })) {
          errors.push({ line, email: d.email, message: 'E-mail já cadastrado' });
          continue;
        }
        const cohortId = d.cohort ? cohorts.get(d.cohort.toLowerCase()) : undefined;
        if (d.cohort && !cohortId) {
          errors.push({ line, email: d.email, message: `Turma "${d.cohort}" não encontrada` });
          continue;
        }
        const temporaryPassword = d.password ? undefined : generatePassword();
        if (!req.body.dryRun) {
          await prisma.user.create({
            data: {
              name: d.name,
              email: d.email,
              role: 'STUDENT',
              passwordHash: await hashPassword(d.password ?? temporaryPassword!),
              profile: { create: { jobTitle: d.jobTitle ?? null, department: d.department ?? null, company: d.company ?? null } },
              cohortMemberships: cohortId ? { create: { cohortId } } : undefined,
            },
          });
        }
        created.push({ line, email: d.email, name: d.name, temporaryPassword });
      }
      if (!req.body.dryRun) await audit(req, 'user.import', 'User', null, { created: created.length, errors: errors.length });
      return ok({ dryRun: req.body.dryRun, totalRows: parsed.data.length, created, errors });
    },
  );
};
