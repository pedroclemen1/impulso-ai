import { cohortSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { conflict, notFound } from '../../shared/errors';
import { ok } from '../../shared/http';

const params = z.object({ cohortId: z.string().uuid() });

export const cohortsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', { schema: { tags: ['cohorts'], summary: 'Lista turmas com indicadores' } }, async () => {
    const cohorts = await prisma.cohort.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true, enrollments: true } } },
    });
    const progress = await prisma.enrollment.groupBy({
      by: ['cohortId'],
      where: { cohortId: { in: cohorts.map((c) => c.id) }, status: { not: 'CANCELLED' } },
      _avg: { progressPercent: true },
    });
    return ok(
      cohorts.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        createdAt: c.createdAt,
        memberCount: c._count.members,
        enrollmentCount: c._count.enrollments,
        averageProgress: progress.find((p) => p.cohortId === c.id)?._avg.progressPercent ?? null,
      })),
    );
  });

  app.post('/', { schema: { tags: ['cohorts'], body: cohortSchema } }, async (req, reply) => {
    if (await prisma.cohort.findUnique({ where: { name: req.body.name } })) throw conflict('Já existe uma turma com este nome');
    const cohort = await prisma.cohort.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        members: req.body.memberIds?.length ? { create: [...new Set(req.body.memberIds)].map((userId) => ({ userId })) } : undefined,
      },
    });
    await audit(req, 'cohort.create', 'Cohort', cohort.id, { name: cohort.name });
    return reply.status(201).send(ok(cohort));
  });

  app.get('/:cohortId', { schema: { tags: ['cohorts'], params } }, async (req) => {
    const cohort = await prisma.cohort.findUnique({
      where: { id: req.params.cohortId },
      include: {
        members: {
          orderBy: { user: { name: 'asc' } },
          include: { user: { select: { id: true, name: true, email: true, status: true, profile: { select: { jobTitle: true, department: true, knowledgeLevel: true } } } } },
        },
      },
    });
    if (!cohort) throw notFound('Turma não encontrada');
    return ok({ ...cohort, members: cohort.members.map((m) => ({ ...m.user, joinedAt: m.joinedAt })) });
  });

  app.patch('/:cohortId', { schema: { tags: ['cohorts'], params, body: cohortSchema.partial() } }, async (req) => {
    const { memberIds, ...data } = req.body;
    const cohort = await prisma.$transaction(async (tx) => {
      if (memberIds) {
        await tx.cohortMember.deleteMany({ where: { cohortId: req.params.cohortId, userId: { notIn: memberIds } } });
        for (const userId of new Set(memberIds)) {
          await tx.cohortMember.upsert({ where: { cohortId_userId: { cohortId: req.params.cohortId, userId } }, create: { cohortId: req.params.cohortId, userId }, update: {} });
        }
      }
      return tx.cohort.update({ where: { id: req.params.cohortId }, data });
    });
    await audit(req, 'cohort.update', 'Cohort', cohort.id);
    return ok(cohort);
  });

  app.post('/:cohortId/members', { schema: { tags: ['cohorts'], params, body: z.object({ userIds: z.array(z.string().uuid()).min(1) }) } }, async (req) => {
    const result = await prisma.cohortMember.createMany({
      data: req.body.userIds.map((userId) => ({ cohortId: req.params.cohortId, userId })),
      skipDuplicates: true,
    });
    await audit(req, 'cohort.add_members', 'Cohort', req.params.cohortId, { count: result.count });
    return ok({ added: result.count });
  });

  app.delete('/:cohortId/members/:userId', { schema: { tags: ['cohorts'], params: params.extend({ userId: z.string().uuid() }) } }, async (req) => {
    await prisma.cohortMember.deleteMany({ where: { cohortId: req.params.cohortId, userId: req.params.userId } });
    await audit(req, 'cohort.remove_member', 'Cohort', req.params.cohortId, { userId: req.params.userId });
    return ok({ success: true });
  });

  app.delete('/:cohortId', { schema: { tags: ['cohorts'], params } }, async (req) => {
    await prisma.cohort.delete({ where: { id: req.params.cohortId } });
    await audit(req, 'cohort.delete', 'Cohort', req.params.cohortId);
    return ok({ success: true });
  });
};
