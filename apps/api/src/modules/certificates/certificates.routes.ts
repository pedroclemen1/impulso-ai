import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { currentUser, requireAuth } from '../../middlewares/auth';
import { notFound } from '../../shared/errors';
import { ok } from '../../shared/http';

export const certificatesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth);

  app.get('/', { schema: { tags: ['certificates'], summary: 'Certificados do usuário (ou todos, para administradores com ?all=true)', querystring: z.object({ all: z.enum(['true', 'false']).optional() }) } }, async (req) => {
    const me = currentUser(req);
    const where = me.role === 'SUPER_ADMIN' && req.query.all === 'true' ? {} : { userId: me.id };
    return ok(await prisma.certificate.findMany({ where, orderBy: { issuedAt: 'desc' }, include: { enrollment: { select: { courseId: true } } } }));
  });

  app.get('/:code', { schema: { tags: ['certificates'], params: z.object({ code: z.string().max(40) }) } }, async (req) => {
    const me = currentUser(req);
    const cert = await prisma.certificate.findUnique({ where: { code: req.params.code } });
    if (!cert || (me.role !== 'SUPER_ADMIN' && cert.userId !== me.id)) throw notFound('Certificado não encontrado');
    return ok(cert);
  });
};
