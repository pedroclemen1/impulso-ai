import type { Prisma } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { prisma, type Tx } from '../database/prisma';

export async function audit(
  req: FastifyRequest | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
  db: Tx = prisma,
) {
  await db.auditLog.create({
    data: {
      actorId: req?.user?.id ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? undefined,
      ip: req?.ip ?? null,
    },
  });
}
