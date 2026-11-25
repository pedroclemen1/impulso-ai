import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env';
import { prisma } from '../../database/prisma';

export const SESSION_COOKIE = 'impulso_session';
const TOUCH_INTERVAL_MS = 60_000;

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600_000);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), ip: meta.ip, userAgent: meta.userAgent?.slice(0, 300), expiresAt },
  });
  return { token, expiresAt };
}

/** Valida o token e aplica expiração absoluta e por inatividade. Retorna o usuário ativo ou null. */
export async function resolveSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, status: true } } },
  });
  if (!session || session.revokedAt) return null;
  const now = Date.now();
  const idleLimit = session.lastSeenAt.getTime() + env.SESSION_IDLE_MINUTES * 60_000;
  if (session.expiresAt.getTime() <= now || idleLimit <= now || session.user.status !== 'ACTIVE') {
    if (!session.revokedAt) await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }
  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return { sessionId: session.id, user: session.user, expiresAt: session.expiresAt };
}

export async function revokeSession(token: string) {
  await prisma.session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
