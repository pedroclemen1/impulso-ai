import { assessmentSubmitSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { currentUser, requireAuth, requireStudent } from '../../middlewares/auth';
import { ok } from '../../shared/http';
import { getAttemptDetail, getStudentAssessment, submitAttempt } from './assessments.service';

export const assessmentsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/course/:courseId',
    {
      schema: {
        tags: ['assessments'],
        summary: 'Obtém uma avaliação do curso para o estudante (sem gabarito) e suas tentativas',
        params: z.object({ courseId: z.string().uuid() }),
        querystring: z.object({ kind: z.enum(['DIAGNOSTIC', 'MODULE_QUIZ', 'FINAL', 'SATISFACTION']), moduleId: z.string().uuid().optional() }),
      },
      preHandler: requireStudent,
    },
    async (req) => ok(await getStudentAssessment(currentUser(req), req.params.courseId, req.query.kind, req.query.moduleId)),
  );

  app.post(
    '/:assessmentId/attempts',
    {
      schema: { tags: ['assessments'], summary: 'Envia respostas e recebe o resultado', params: z.object({ assessmentId: z.string().uuid() }), body: assessmentSubmitSchema },
      preHandler: requireStudent,
    },
    async (req, reply) => reply.status(201).send(ok(await submitAttempt(currentUser(req), req.params.assessmentId, req.body))),
  );

  app.get(
    '/attempts/:attemptId',
    { schema: { tags: ['assessments'], summary: 'Detalhe de uma tentativa', params: z.object({ attemptId: z.string().uuid() }) }, preHandler: requireAuth },
    async (req) => ok(await getAttemptDetail(currentUser(req), req.params.attemptId)),
  );
};
