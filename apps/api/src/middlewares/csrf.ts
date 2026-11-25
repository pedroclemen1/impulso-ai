import type { FastifyReply, FastifyRequest } from 'fastify';
import { allowedOrigins } from '../config/env';
import { AppError } from '../shared/errors';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defesa contra CSRF para autenticação por cookie:
 * 1) cookies SameSite=Lax; 2) requisições que alteram estado exigem o cabeçalho
 * personalizado X-Requested-With (navegadores não o enviam entre origens sem preflight CORS,
 * que é restrito às origens permitidas); 3) se houver Origin, ela precisa estar na lista permitida.
 */
export async function csrfGuard(req: FastifyRequest, _reply: FastifyReply) {
  if (SAFE.has(req.method) || !req.url.startsWith('/api/')) return;
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    const host = req.headers.host;
    const sameHost = host && (origin === `http://${host}` || origin === `https://${host}`);
    if (!sameHost) throw new AppError(403, 'CSRF', 'Origem da requisição não permitida');
  }
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    throw new AppError(403, 'CSRF', 'Cabeçalho de proteção ausente');
  }
}
