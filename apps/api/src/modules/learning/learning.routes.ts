import { consolidateSchema, stageUpdateSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { currentUser, requireStudent } from '../../middlewares/auth';
import { ok } from '../../shared/http';
import { LearningPersonalizationService } from '../ai/services/learning-personalization.service';
import { LearningService } from './learning.service';

const courseParams = z.object({ courseId: z.string().uuid() });
const lessonParams = courseParams.extend({ lessonId: z.string().uuid() });

export const learningRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireStudent);

  app.get('/dashboard', { schema: { tags: ['learning'], summary: 'Dashboard do estudante' } }, async (req) => ok(await LearningService.dashboard(currentUser(req).id)));

  app.get('/courses/:courseId', { schema: { tags: ['learning'], summary: 'Visão do curso, trilha personalizada e progresso', params: courseParams } }, async (req) =>
    ok(await LearningService.courseOverview(currentUser(req).id, req.params.courseId)),
  );

  app.get('/courses/:courseId/lessons/:lessonId', { schema: { tags: ['learning'], summary: 'Aula personalizada pelo nível do estudante', params: lessonParams } }, async (req) =>
    ok(await LearningService.lesson(currentUser(req).id, req.params.courseId, req.params.lessonId)),
  );

  app.patch('/courses/:courseId/lessons/:lessonId/stage', { schema: { tags: ['learning'], summary: 'Salva a etapa atual da aula', params: lessonParams, body: stageUpdateSchema } }, async (req) =>
    ok(await LearningService.setStage(currentUser(req).id, req.params.courseId, req.params.lessonId, req.body.stage)),
  );

  app.post(
    '/courses/:courseId/lessons/:lessonId/personalized-example',
    {
      schema: { tags: ['learning'], summary: 'Gera exemplo contextualizado ao cargo do participante (IA)', params: lessonParams, body: z.object({ regenerate: z.boolean().default(false) }).default({}) },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req) => ok(await LearningPersonalizationService.personalizedExample(currentUser(req).id, req.params.courseId, req.params.lessonId, req.body?.regenerate)),
  );

  app.post(
    '/courses/:courseId/lessons/:lessonId/consolidate',
    { schema: { tags: ['learning'], summary: 'Consolida a aprendizagem e conclui a aula', params: lessonParams, body: consolidateSchema }, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req) => ok(await LearningService.consolidate(currentUser(req).id, req.params.courseId, req.params.lessonId, req.body.reflection)),
  );

  app.post(
    '/heartbeat',
    { schema: { tags: ['learning'], summary: 'Registra atividade para cálculo do tempo de aprendizagem', body: z.object({ courseId: z.string().uuid().optional() }).default({}) }, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req) => ok(await LearningService.heartbeat(currentUser(req).id, req.body?.courseId)),
  );

  app.get('/competencies', { schema: { tags: ['learning'], summary: 'Minhas competências' } }, async (req) => ok(await LearningService.competencies(currentUser(req).id)));

  app.get('/history', { schema: { tags: ['learning'], summary: 'Meu histórico de aprendizagem' } }, async (req) => ok(await LearningService.history(currentUser(req).id, 100)));
};
