import { tutorMessageSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { currentUser, requireStudent } from '../../middlewares/auth';
import { ok } from '../../shared/http';
import { SocraticTutorService } from '../ai/services/socratic-tutor.service';

const params = z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid() });
const aiLimit = { rateLimit: { max: 20, timeWindow: '1 minute' } };

export const tutorRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireStudent);

  app.get('/courses/:courseId/lessons/:lessonId', { schema: { tags: ['tutor'], summary: 'Conversa do tutor na aula (somente do próprio estudante)', params } }, async (req) =>
    ok(await SocraticTutorService.getConversation(currentUser(req).id, req.params.courseId, req.params.lessonId)),
  );

  app.post('/courses/:courseId/lessons/:lessonId/messages', { schema: { tags: ['tutor'], summary: 'Envia mensagem ao tutor socrático', params, body: tutorMessageSchema }, config: aiLimit }, async (req) =>
    ok(await SocraticTutorService.sendMessage(currentUser(req).id, req.params.courseId, req.params.lessonId, req.body.content)),
  );

  app.post('/courses/:courseId/lessons/:lessonId/hint', { schema: { tags: ['tutor'], summary: 'Solicita uma pista progressiva', params }, config: aiLimit }, async (req) =>
    ok(await SocraticTutorService.hint(currentUser(req).id, req.params.courseId, req.params.lessonId)),
  );

  app.post('/courses/:courseId/lessons/:lessonId/solution', { schema: { tags: ['tutor'], summary: 'Solicita a solução comentada (após tentativas suficientes)', params }, config: aiLimit }, async (req) =>
    ok(await SocraticTutorService.solution(currentUser(req).id, req.params.courseId, req.params.lessonId)),
  );
};
