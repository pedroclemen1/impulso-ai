import { enrollmentCreateSchema, paginationSchema } from '@impulso/shared';
import type { Prisma } from '@prisma/client';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { currentUser, requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { ok, pageArgs, pageMeta } from '../../shared/http';
import { recalculateEnrollment } from '../learning/engine';

const enrollmentInclude = {
  user: { select: { id: true, name: true, email: true, profile: { select: { jobTitle: true, department: true } } } },
  course: { select: { id: true, title: true, coverColor: true } },
  courseVersion: { select: { id: true, versionNumber: true } },
  cohort: { select: { id: true, name: true } },
} satisfies Prisma.EnrollmentInclude;

export const enrollmentsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get(
    '/',
    {
      schema: {
        tags: ['enrollments'],
        summary: 'Lista alocações com filtros',
        querystring: paginationSchema.extend({
          courseId: z.string().uuid().optional(),
          cohortId: z.string().uuid().optional(),
          userId: z.string().uuid().optional(),
          status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        }),
      },
    },
    async (req) => {
      const q = req.query;
      const where: Prisma.EnrollmentWhereInput = {
        ...(q.courseId ? { courseId: q.courseId } : {}),
        ...(q.cohortId ? { cohortId: q.cohortId } : {}),
        ...(q.userId ? { userId: q.userId } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.search
          ? { OR: [{ user: { name: { contains: q.search, mode: 'insensitive' } } }, { user: { email: { contains: q.search, mode: 'insensitive' } } }] }
          : {}),
      };
      const orderBy: Prisma.EnrollmentOrderByWithRelationInput =
        q.sort === 'progress' ? { progressPercent: q.order } : q.sort === 'dueDate' ? { dueDate: q.order } : { createdAt: q.order };
      const [total, rows] = await Promise.all([
        prisma.enrollment.count({ where }),
        prisma.enrollment.findMany({ where, orderBy, ...pageArgs(q), include: enrollmentInclude }),
      ]);
      return ok(rows, pageMeta(q, total));
    },
  );

  app.post(
    '/',
    { schema: { tags: ['enrollments'], summary: 'Aloca um curso para participantes e/ou uma turma inteira', body: enrollmentCreateSchema } },
    async (req, reply) => {
      const b = req.body;
      const course = await prisma.course.findUnique({ where: { id: b.courseId } });
      if (!course) throw notFound('Curso não encontrado');
      if (course.status !== 'PUBLISHED' || !course.latestPublishedVersionId) throw conflict('Apenas cursos publicados podem ser alocados.');
      if (b.dueDate && b.startDate && b.dueDate < b.startDate) throw badRequest('O prazo deve ser posterior à data de início.');

      const userIds = new Set(b.userIds);
      if (b.cohortId) {
        const members = await prisma.cohortMember.findMany({ where: { cohortId: b.cohortId }, select: { userId: true } });
        members.forEach((m) => userIds.add(m.userId));
      }
      const students = await prisma.user.findMany({ where: { id: { in: [...userIds] }, role: 'STUDENT', status: 'ACTIVE' }, select: { id: true } });
      const existing = await prisma.enrollment.findMany({
        where: { courseVersionId: course.latestPublishedVersionId, userId: { in: students.map((s) => s.id) } },
        select: { userId: true },
      });
      const already = new Set(existing.map((e) => e.userId));
      const toCreate = students.filter((s) => !already.has(s.id));
      await prisma.enrollment.createMany({
        data: toCreate.map((s) => ({
          userId: s.id,
          courseId: course.id,
          courseVersionId: course.latestPublishedVersionId!,
          cohortId: b.cohortId ?? null,
          assignedById: currentUser(req).id,
          startDate: b.startDate ?? new Date(),
          dueDate: b.dueDate ?? null,
        })),
        skipDuplicates: true,
      });
      await audit(req, 'enrollment.create', 'Course', course.id, { created: toCreate.length, skipped: already.size, cohortId: b.cohortId ?? null });
      return reply.status(201).send(
        ok({
          created: toCreate.length,
          skippedExisting: already.size,
          skippedInvalid: userIds.size - students.length,
        }),
      );
    },
  );

  app.patch(
    '/:enrollmentId',
    {
      schema: {
        tags: ['enrollments'],
        summary: 'Altera prazo ou cancela/reativa uma alocação',
        params: z.object({ enrollmentId: z.string().uuid() }),
        body: z.object({ dueDate: z.coerce.date().nullable().optional(), cancelled: z.boolean().optional() }),
      },
    },
    async (req) => {
      const e = await prisma.enrollment.findUnique({ where: { id: req.params.enrollmentId } });
      if (!e) throw notFound('Alocação não encontrada');
      await prisma.enrollment.update({
        where: { id: e.id },
        data: {
          ...(req.body.dueDate !== undefined ? { dueDate: req.body.dueDate } : {}),
          ...(req.body.cancelled === true ? { status: 'CANCELLED' } : req.body.cancelled === false && e.status === 'CANCELLED' ? { status: 'NOT_STARTED' } : {}),
        },
      });
      if (req.body.cancelled === false) await recalculateEnrollment(e.id);
      await audit(req, 'enrollment.update', 'Enrollment', e.id, { dueDate: req.body.dueDate?.toISOString() ?? null, cancelled: req.body.cancelled ?? null });
      return ok(await prisma.enrollment.findUnique({ where: { id: e.id }, include: enrollmentInclude }));
    },
  );
};
