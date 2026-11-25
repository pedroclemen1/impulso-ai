import { Prisma } from '@prisma/client';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors';

export function errorHandler(error: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message, details: error.details } });
  }
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: error.validation.map((v) => ({ path: v.instancePath, message: v.message })),
      },
    });
  }
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Registro duplicado' } });
    if (error.code === 'P2025') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Recurso não encontrado' } });
    if (error.code === 'P2003') return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Registro relacionado impede a operação' } });
  }
  const fe = error as FastifyError;
  if (fe.statusCode && fe.statusCode < 500) {
    const code = fe.statusCode === 429 ? 'RATE_LIMITED' : fe.code ?? 'BAD_REQUEST';
    const message = fe.statusCode === 429 ? 'Muitas requisições. Aguarde alguns instantes.' : fe.message;
    return reply.status(fe.statusCode).send({ error: { code, message } });
  }
  req.log.error({ err: error }, 'Erro não tratado');
  return reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente em instantes.' } });
}
