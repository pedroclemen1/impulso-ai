import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { allowedOrigins, env, isProduction } from './config/env';
import { prisma } from './database/prisma';
import { csrfGuard } from './middlewares/csrf';
import { errorHandler } from './middlewares/error-handler';
import { activitiesRoutes } from './modules/activities/activities.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { reportsRoutes } from './modules/analytics/reports.routes';
import { assessmentsRoutes } from './modules/assessments/assessments.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { certificatesRoutes } from './modules/certificates/certificates.routes';
import { cohortsRoutes } from './modules/cohorts/cohorts.routes';
import { competenciesRoutes } from './modules/competencies/competencies.routes';
import { coursesRoutes } from './modules/courses/courses.routes';
import { enrollmentsRoutes } from './modules/enrollments/enrollments.routes';
import { learningRoutes } from './modules/learning/learning.routes';
import { tutorRoutes } from './modules/tutor/tutor.routes';
import { usersRoutes } from './modules/users/users.routes';

export async function buildApp(opts: { logger?: boolean; rateLimit?: boolean } = {}) {
  const app = Fastify({
    logger: opts.logger === false ? false : { level: env.LOG_LEVEL, redact: ['req.headers.cookie', 'req.headers.authorization'] },
    bodyLimit: 2 * 1024 * 1024,
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
        connectSrc: ["'self'"],
      },
    },
  });
  await app.register(cors, { origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  await app.register(cookie);
  await app.register(rateLimit, { global: opts.rateLimit !== false, max: 300, timeWindow: '1 minute', enableDraftSpec: true });
  app.addHook('onRequest', csrfGuard);

  await app.register(swagger, {
    openapi: {
      info: { title: 'Impulso AI API', description: 'API REST da plataforma Impulso AI. Autenticação por cookie HttpOnly; requisições que alteram estado exigem o cabeçalho X-Requested-With: XMLHttpRequest.', version: '1.0.0' },
      tags: ['auth', 'users', 'cohorts', 'courses', 'enrollments', 'assessments', 'activities', 'learning', 'tutor', 'competencies', 'analytics', 'reports', 'ai', 'certificates'].map((name) => ({ name })),
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/api/docs' });

  app.get('/api/health', { schema: { hide: true } }, async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', time: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(cohortsRoutes, { prefix: '/api/cohorts' });
  await app.register(competenciesRoutes, { prefix: '/api/competencies' });
  await app.register(coursesRoutes, { prefix: '/api/courses' });
  await app.register(enrollmentsRoutes, { prefix: '/api/enrollments' });
  await app.register(assessmentsRoutes, { prefix: '/api/assessments' });
  await app.register(activitiesRoutes, { prefix: '/api/activities' });
  await app.register(learningRoutes, { prefix: '/api/learning' });
  await app.register(tutorRoutes, { prefix: '/api/tutor' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(reportsRoutes, { prefix: '/api/reports' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(certificatesRoutes, { prefix: '/api/certificates' });

  // Em produção (Docker), o backend também serve o frontend compilado (SPA).
  const webDist = env.SERVE_WEB_DIST ? resolve(env.SERVE_WEB_DIST) : null;
  if (webDist && existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
      return reply.sendFile('index.html');
    });
  } else {
    app.setNotFoundHandler((_req, reply) => reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } }));
  }

  if (isProduction) app.log.info('Executando em modo produção');
  return app;
}
