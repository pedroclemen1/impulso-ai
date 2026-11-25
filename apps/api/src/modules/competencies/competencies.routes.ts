import { competencySchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { requireAdmin, requireAuth } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { conflict } from '../../shared/errors';
import { ok } from '../../shared/http';

const params = z.object({ competencyId: z.string().uuid() });

export const competenciesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: { tags: ['competencies'], summary: 'Catálogo de competências' }, preHandler: requireAuth }, async () => {
    return ok(await prisma.competency.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }));
  });

  app.get('/overview', { schema: { tags: ['competencies'], summary: 'Domínio médio por competência (administração)' }, preHandler: requireAdmin }, async () => {
    const comps = await prisma.competency.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { lessons: true, questions: true } } } });
    const agg = await prisma.competencyScore.groupBy({ by: ['competencyId'], _avg: { score: true, initialScore: true }, _count: { _all: true } });
    return ok(
      comps.map((c) => {
        const a = agg.find((x) => x.competencyId === c.id);
        return {
          ...c,
          lessonCount: c._count.lessons,
          questionCount: c._count.questions,
          _count: undefined,
          participants: a?._count._all ?? 0,
          averageScore: a?._avg.score ?? null,
          averageInitialScore: a?._avg.initialScore ?? null,
        };
      }),
    );
  });

  app.post('/', { schema: { tags: ['competencies'], body: competencySchema }, preHandler: requireAdmin }, async (req, reply) => {
    if (await prisma.competency.findUnique({ where: { key: req.body.key } })) throw conflict('Já existe uma competência com esta chave');
    const c = await prisma.competency.create({ data: req.body });
    await audit(req, 'competency.create', 'Competency', c.id);
    return reply.status(201).send(ok(c));
  });

  app.patch('/:competencyId', { schema: { tags: ['competencies'], params, body: competencySchema.partial() }, preHandler: requireAdmin }, async (req) => {
    const c = await prisma.competency.update({ where: { id: req.params.competencyId }, data: req.body });
    await audit(req, 'competency.update', 'Competency', c.id);
    return ok(c);
  });

  app.delete('/:competencyId', { schema: { tags: ['competencies'], params }, preHandler: requireAdmin }, async (req) => {
    const used = await prisma.competency.findUnique({
      where: { id: req.params.competencyId },
      include: { _count: { select: { lessons: true, courseVersions: true } } },
    });
    if (used && (used._count.lessons || used._count.courseVersions)) throw conflict('Competência em uso por cursos; não pode ser excluída.');
    await prisma.competency.delete({ where: { id: req.params.competencyId } });
    await audit(req, 'competency.delete', 'Competency', req.params.competencyId);
    return ok({ success: true });
  });
};
