import { analyticsFilterSchema, KPI_DEFINITIONS } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { currentUser, requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { ok } from '../../shared/http';
import { PedagogicalInsightsService } from '../ai/services/pedagogical-insights.service';
import { AnalyticsService } from './analytics.service';

export const analyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/overview', { schema: { tags: ['analytics'], summary: 'Indicadores e gráficos do painel (dados reais do banco)', querystring: analyticsFilterSchema } }, async (req) =>
    ok({ ...(await AnalyticsService.overview(req.query)), definitions: KPI_DEFINITIONS }),
  );

  app.get('/filters', { schema: { tags: ['analytics'], summary: 'Opções de filtro (cursos, turmas, participantes)' } }, async () => ok(await AnalyticsService.filterOptions()));

  app.get(
    '/courses/:courseId',
    { schema: { tags: ['analytics'], summary: 'Visão ADDIE e indicadores de um curso', params: z.object({ courseId: z.string().uuid() }), querystring: analyticsFilterSchema } },
    async (req) => ok({ ...(await AnalyticsService.course(req.params.courseId, req.query)), definitions: KPI_DEFINITIONS }),
  );

  app.get('/participants/:userId', { schema: { tags: ['analytics'], summary: 'Acompanhamento individual do participante', params: z.object({ userId: z.string().uuid() }) } }, async (req) =>
    ok(await AnalyticsService.participant(req.params.userId)),
  );

  app.post(
    '/participants/:userId/insights',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Gera insights pedagógicos com IA, baseados em evidências',
        params: z.object({ userId: z.string().uuid() }),
        body: z.object({ enrollmentId: z.string().uuid().optional() }).default({}),
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req) => {
      const insights = await PedagogicalInsightsService.generate(req.params.userId, currentUser(req).id, req.body?.enrollmentId);
      await audit(req, 'insights.generate', 'User', req.params.userId);
      return ok(insights);
    },
  );
};
