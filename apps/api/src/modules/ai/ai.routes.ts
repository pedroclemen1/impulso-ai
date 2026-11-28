import { aiSettingsSchema, courseGenerationSchema, moduleSchema, paginationSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { currentUser, requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { badRequest, notFound } from '../../shared/errors';
import { ok, pageArgs, pageMeta, round } from '../../shared/http';
import { ai, getAISettings, invalidateAISettings, listProviders } from './ai.client';
import { connectionTestSchema } from './schemas';
import { CourseGenerationService } from './services/course-generation.service';

export const aiRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/settings', { schema: { tags: ['ai'], summary: 'Configurações de IA e provedores disponíveis (sem chaves)' } }, async () => {
    return ok({ settings: await getAISettings(), providers: listProviders() });
  });

  app.put('/settings', { schema: { tags: ['ai'], summary: 'Atualiza provedor ativo e parâmetros pedagógicos do tutor', body: aiSettingsSchema } }, async (req) => {
    const provider = listProviders().find((p) => p.name === req.body.activeProvider);
    if (!provider?.configured) throw badRequest(`O provedor "${req.body.activeProvider}" não está configurado nas variáveis de ambiente do servidor.`);
    const settings = await prisma.aISettings.upsert({ where: { id: 'default' }, create: { id: 'default', ...req.body }, update: req.body });
    invalidateAISettings();
    await audit(req, 'ai.settings.update', 'AISettings', 'default', { activeProvider: settings.activeProvider, model: settings.model });
    return ok(settings);
  });

  app.post('/test', { schema: { tags: ['ai'], summary: 'Testa a conexão com o provedor ativo' }, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req) => {
    const started = Date.now();
    const result = await ai.generateStructured(
      {
        operation: 'connection_test',
        system: 'Você é um verificador de conexão.',
        prompt: 'Responda com JSON: { "status": "ok", "message": "conexão estabelecida" }',
        schema: connectionTestSchema,
        input: {},
        maxTokens: 300,
      },
      { userId: currentUser(req).id },
    );
    return ok({ ...result, latencyMs: Date.now() - started });
  });

  app.get(
    '/usage',
    { schema: { tags: ['ai'], summary: 'Uso de IA: metadados, custos estimados e logs recentes', querystring: paginationSchema.extend({ days: z.coerce.number().int().min(1).max(365).default(30) }) } },
    async (req) => {
      const since = new Date(Date.now() - req.query.days * 86_400_000);
      const where = { createdAt: { gte: since } };
      const [byOperation, byStatus, totals, total, logs] = await Promise.all([
        prisma.aIUsageLog.groupBy({ by: ['operation'], where, _count: { _all: true }, _avg: { latencyMs: true }, _sum: { inputTokens: true, outputTokens: true, estimatedCostUsd: true } }),
        prisma.aIUsageLog.groupBy({ by: ['status'], where, _count: { _all: true } }),
        prisma.aIUsageLog.aggregate({ where, _count: { _all: true }, _avg: { latencyMs: true }, _sum: { inputTokens: true, outputTokens: true, estimatedCostUsd: true } }),
        prisma.aIUsageLog.count({ where }),
        prisma.aIUsageLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...pageArgs(req.query), include: { user: { select: { name: true } } } }),
      ]);
      return ok(
        {
          totals: {
            calls: totals._count._all,
            averageLatencyMs: totals._avg.latencyMs ? round(totals._avg.latencyMs, 0) : null,
            inputTokens: totals._sum.inputTokens ?? 0,
            outputTokens: totals._sum.outputTokens ?? 0,
            estimatedCostUsd: totals._sum.estimatedCostUsd,
          },
          byOperation: byOperation.map((o) => ({ operation: o.operation, calls: o._count._all, averageLatencyMs: o._avg.latencyMs ? round(o._avg.latencyMs, 0) : null, inputTokens: o._sum.inputTokens, outputTokens: o._sum.outputTokens, estimatedCostUsd: o._sum.estimatedCostUsd })),
          byStatus: byStatus.map((s) => ({ status: s.status, calls: s._count._all })),
          logs,
        },
        pageMeta(req.query, total),
      );
    },
  );

  // ─── Gerador de cursos com IA ───
  app.post(
    '/course-generations',
    { schema: { tags: ['ai'], summary: 'Inicia a geração de um curso (rascunho) com IA — idempotente', body: courseGenerationSchema }, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const job = await CourseGenerationService.start(req.body, currentUser(req).id);
      await audit(req, 'ai.course_generation.start', 'CourseGenerationJob', job.id, { topic: req.body.topic });
      return reply.status(202).send(ok(job));
    },
  );

  app.get('/course-generations', { schema: { tags: ['ai'], summary: 'Gerações recentes' } }, async () =>
    ok(await prisma.courseGenerationJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { course: { select: { id: true, title: true, status: true } } } })),
  );

  app.get('/course-generations/:jobId', { schema: { tags: ['ai'], params: z.object({ jobId: z.string().uuid() }) } }, async (req) => {
    const job = await prisma.courseGenerationJob.findUnique({ where: { id: req.params.jobId }, include: { course: { select: { id: true, title: true, status: true } } } });
    if (!job) throw notFound('Geração não encontrada');
    return ok(job);
  });

  app.post('/course-generations/:jobId/retry', { schema: { tags: ['ai'], summary: 'Tenta novamente a partir da etapa que falhou (sem duplicar o curso)', params: z.object({ jobId: z.string().uuid() }) } }, async (req) =>
    ok(await CourseGenerationService.retry(req.params.jobId, currentUser(req).id)),
  );

  // Geração de um módulo adicional em um rascunho existente (geração por etapas).
  app.post(
    '/courses/:courseId/modules',
    {
      schema: { tags: ['ai'], summary: 'Gera um novo módulo com IA no rascunho do curso', params: z.object({ courseId: z.string().uuid() }), body: moduleSchema.extend({ lessonCount: z.number().int().min(1).max(5).default(2) }) },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const mod = await CourseGenerationService.generateModule(req.params.courseId, req.body, currentUser(req).id);
      await audit(req, 'ai.module_generation', 'Course', req.params.courseId, { moduleId: mod.id });
      return reply.status(201).send(ok(mod));
    },
  );
};
