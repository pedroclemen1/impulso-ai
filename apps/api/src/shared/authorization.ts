import type { Role } from '@prisma/client';
import { forbidden, notFound } from './errors';

export interface Actor {
  id: string;
  role: Role;
}

/** Regra central de autorização por recurso: estudantes só acessam o que lhes pertence. */
export function canAccessOwnedResource(actor: Actor, ownerId: string): boolean {
  return actor.role === 'SUPER_ADMIN' || actor.id === ownerId;
}

/**
 * Garante a posse do recurso. Para estudantes, responde 404 (e não 403) para não revelar
 * a existência de recursos de outros participantes.
 */
export function assertOwnership<T extends { userId: string }>(actor: Actor, resource: T | null | undefined): T {
  if (!resource) throw notFound();
  if (!canAccessOwnedResource(actor, resource.userId)) {
    if (actor.role === 'STUDENT') throw notFound();
    throw forbidden();
  }
  return resource;
}

export function assertAdmin(actor: Actor) {
  if (actor.role !== 'SUPER_ADMIN') throw forbidden();
}
