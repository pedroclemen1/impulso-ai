import type { Role } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { forbidden, unauthorized } from '../shared/errors';
import { resolveSession, SESSION_COOKIE } from '../modules/auth/session.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  sessionId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/** Carrega o usuário da sessão (se houver) sem exigir autenticação. */
export async function loadUser(req: FastifyRequest) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return;
  const resolved = await resolveSession(token);
  if (resolved) req.user = { ...resolved.user, sessionId: resolved.sessionId };
}

export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
  if (!req.user) await loadUser(req);
  if (!req.user) throw unauthorized('Sua sessão expirou. Faça login novamente.');
}

export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (!roles.includes(req.user!.role)) throw forbidden();
  };
}

export const requireAdmin = requireRole('SUPER_ADMIN');
export const requireStudent = requireRole('STUDENT');

export const currentUser = (req: FastifyRequest): AuthUser => {
  if (!req.user) throw unauthorized();
  return req.user;
};
