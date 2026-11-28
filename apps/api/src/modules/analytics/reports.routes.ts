import { analyticsFilterSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { toCsv } from '../../shared/http';
import { AnalyticsService } from './analytics.service';

const REPORTS = {
  enrollments: { file: 'indicadores-por-participante', load: AnalyticsService.enrollmentRows },
  competencies: { file: 'dominio-por-competencia', load: AnalyticsService.competencyRows },
  evaluations: { file: 'avaliacoes-de-atividades', load: AnalyticsService.evaluationRows },
} as const;

export const reportsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get(
    '/:report.csv',
    {
      schema: {
        tags: ['reports'],
        summary: 'Exporta relatório em CSV (UTF-8 com BOM, compatível com Excel)',
        params: z.object({ report: z.enum(['enrollments', 'competencies', 'evaluations']) }),
        querystring: analyticsFilterSchema,
      },
    },
    async (req, reply) => {
      const r = REPORTS[req.params.report];
      const rows = await r.load(req.query);
      await audit(req, 'report.export', 'Report', req.params.report, { rows: rows.length });
      const date = new Date().toISOString().slice(0, 10);
      return reply
        .header('content-type', 'text/csv; charset=utf-8')
        .header('content-disposition', `attachment; filename="${r.file}-${date}.csv"`)
        .send(`﻿${toCsv(rows as Record<string, unknown>[])}`);
    },
  );

  app.get('/:report', { schema: { tags: ['reports'], summary: 'Prévia do relatório em JSON', params: z.object({ report: z.enum(['enrollments', 'competencies', 'evaluations']) }), querystring: analyticsFilterSchema } }, async (req) => {
    return { data: await REPORTS[req.params.report].load(req.query) };
  });
};
