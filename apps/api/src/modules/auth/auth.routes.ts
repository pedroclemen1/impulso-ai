import { changePasswordSchema, loginSchema, profileUpdateSchema } from '@impulso/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { env, isProduction } from '../../config/env';
import { prisma } from '../../database/prisma';
import { currentUser, requireAuth } from '../../middlewares/auth';
import { badRequest, unauthorized } from '../../shared/errors';
import { ok } from '../../shared/http';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';
import { createSession, revokeAllUserSessions, revokeSession, SESSION_COOKIE } from './session.service';

const cookieOptions = (expires?: Date) => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE || isProduction,
  sameSite: 'lax' as const,
  path: '/',
  expires,
});

async function loadMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, profile: true },
  });
}

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/login',
    {
      schema: { tags: ['auth'], summary: 'Autentica o usuário e cria uma sessão (cookie HttpOnly)', body: loginSchema },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) throw unauthorized('E-mail ou senha incorretos');
      if (user.status !== 'ACTIVE') throw unauthorized('Sua conta está desativada. Procure o administrador.');
      const { token, expiresAt } = await createSession(user.id, { ip: req.ip, userAgent: req.headers['user-agent'] });
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      reply.setCookie(SESSION_COOKIE, token, cookieOptions(expiresAt));
      return ok({ user: await loadMe(user.id), expiresAt });
    },
  );

  app.post('/logout', { schema: { tags: ['auth'], summary: 'Encerra a sessão atual' } }, async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) await revokeSession(token);
    reply.clearCookie(SESSION_COOKIE, cookieOptions());
    return ok({ success: true });
  });

  app.get('/me', { schema: { tags: ['auth'], summary: 'Recupera a sessão atual' }, preHandler: requireAuth }, async (req) => {
    return ok({ user: await loadMe(currentUser(req).id) });
  });

  app.patch(
    '/me',
    { schema: { tags: ['auth'], summary: 'Atualiza o próprio perfil', body: profileUpdateSchema }, preHandler: requireAuth },
    async (req) => {
      const me = currentUser(req);
      const { name, ...profile } = req.body;
      await prisma.user.update({
        where: { id: me.id },
        data: {
          ...(name ? { name } : {}),
          profile: { upsert: { create: profile, update: profile } },
        },
      });
      return ok({ user: await loadMe(me.id) });
    },
  );

  app.post(
    '/change-password',
    {
      schema: { tags: ['auth'], summary: 'Altera a própria senha', body: changePasswordSchema },
      preHandler: requireAuth,
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const me = currentUser(req);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
      if (!(await verifyPassword(req.body.currentPassword, user.passwordHash))) throw badRequest('Senha atual incorreta');
      await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(req.body.newPassword) } });
      await revokeAllUserSessions(me.id);
      const { token, expiresAt } = await createSession(me.id, { ip: req.ip, userAgent: req.headers['user-agent'] });
      reply.setCookie(SESSION_COOKIE, token, cookieOptions(expiresAt));
      return ok({ success: true });
    },
  );
};
