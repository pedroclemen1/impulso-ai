import { evaluationReviewSchema, paginationSchema, submissionSchema } from '@impulso/shared';
import type { Prisma } from '@prisma/client';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { currentUser, requireAdmin, requireStudent } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { notFound } from '../../shared/errors';
import { ok, pageArgs, pageMeta } from '../../shared/http';
import { ActivitiesService } from './activities.service';

export const activitiesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/:activityId/submissions',
    {
      schema: { tags: ['activities'], summary: 'Envia (ou revisa) a resposta de uma atividade e recebe feedback socrático', params: z.object({ activityId: z.string().uuid() }), body: submissionSchema },
      preHandler: requireStudent,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => reply.status(201).send(ok(await ActivitiesService.submit(currentUser(req).id, req.params.activityId, req.body.content))),
  );

  app.get(
    '/evaluations',
    {
      schema: {
        tags: ['activities'],
        summary: 'Fila de avaliações de atividades (administração)',
        querystring: paginationSchema.extend({
          requiresReview: z.enum(['true', 'false']).optional(),
          courseId: z.string().uuid().optional(),
          userId: z.string().uuid().optional(),
          source: z.enum(['AI', 'DEMO', 'FALLBACK', 'HUMAN']).optional(),
        }),
      },
      preHandler: requireAdmin,
    },
    async (req) => {
      const q = req.query;
      const where: Prisma.ActivitySubmissionWhereInput = {
        ...(q.userId ? { userId: q.userId } : {}),
        ...(q.courseId ? { enrollment: { courseId: q.courseId } } : {}),
        ...(q.search ? { user: { name: { contains: q.search, mode: 'insensitive' } } } : {}),
        evaluations: {
          some: {
            isCurrent: true,
            ...(q.requiresReview ? { requiresHumanReview: q.requiresReview === 'true' } : {}),
            ...(q.source ? { source: q.source } : {}),
          },
        },
      };
      const [total, rows] = await Promise.all([
        prisma.activitySubmission.count({ where }),
        prisma.activitySubmission.findMany({
          where,
          orderBy: { createdAt: q.order },
          ...pageArgs(q),
          include: {
            user: { select: { id: true, name: true } },
            activity: { select: { id: true, title: true, passingScore: true, lesson: { select: { title: true } } } },
            enrollment: { select: { courseId: true, courseVersion: { select: { title: true, versionNumber: true } } } },
            evaluations: { where: { isCurrent: true }, take: 1 },
          },
        }),
      ]);
      return ok(rows.map((r) => ({ ...r, evaluation: r.evaluations[0] ?? null, evaluations: undefined, content: r.content.slice(0, 300) })), pageMeta(q, total));
    },
  );

  app.get(
    '/submissions/:submissionId',
    { schema: { tags: ['activities'], summary: 'Detalhe da submissão com histórico de avaliações', params: z.object({ submissionId: z.string().uuid() }) }, preHandler: requireAdmin },
    async (req) => {
      const s = await prisma.activitySubmission.findUnique({
        where: { id: req.params.submissionId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          activity: { include: { lesson: { select: { title: true } }, rubric: { include: { criteria: { orderBy: { order: 'asc' } } } } } },
          evaluations: { orderBy: { createdAt: 'desc' }, include: { scores: { include: { criterion: true } }, reviewedBy: { select: { id: true, name: true } } } },
        },
      });
      if (!s) throw notFound('Submissão não encontrada');
      const attempts = await prisma.activitySubmission.findMany({
        where: { enrollmentId: s.enrollmentId, activityId: s.activityId },
        orderBy: { attemptNumber: 'asc' },
        include: { evaluations: { where: { isCurrent: true }, take: 1 } },
      });
      return ok({ ...s, attempts: attempts.map((a) => ({ id: a.id, attemptNumber: a.attemptNumber, content: a.content, createdAt: a.createdAt, score: a.evaluations[0]?.weightedScore ?? null })) });
    },
  );

  app.post(
    '/submissions/:submissionId/review',
    { schema: { tags: ['activities'], summary: 'Revisão manual da avaliação (mantém histórico)', params: z.object({ submissionId: z.string().uuid() }), body: evaluationReviewSchema }, preHandler: requireAdmin },
    async (req) => {
      const evaluation = await ActivitiesService.review(req.params.submissionId, currentUser(req).id, req.body);
      await audit(req, 'evaluation.review', 'ActivitySubmission', req.params.submissionId, { evaluationId: evaluation.id, weightedScore: evaluation.weightedScore });
      return ok(evaluation);
    },
  );
};
