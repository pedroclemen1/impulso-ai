import {
  activitySchema,
  assessmentSchema,
  courseMetaSchema,
  lessonSchema,
  moduleSchema,
  paginationSchema,
  reorderSchema,
} from '@impulso/shared';
import type { Prisma } from '@prisma/client';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { currentUser, requireAdmin } from '../../middlewares/auth';
import { audit } from '../../shared/audit';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { ok, pageArgs, pageMeta } from '../../shared/http';
import { lessonPresentation } from '../learning/personalization';
import { createLesson, updateLesson, upsertAssessment, writeActivity } from './content-writer';
import {
  createCourse,
  createDraftFromPublished,
  duplicateCourse,
  getDraftVersion,
  getVersionTree,
  publishCourse,
  requireDraftVersion,
  updateCourseMeta,
  validateForPublish,
} from './courses.service';

const idParams = z.object({ courseId: z.string().uuid() });
const moduleParams = idParams.extend({ moduleId: z.string().uuid() });
const lessonParams = idParams.extend({ lessonId: z.string().uuid() });
const assessmentParams = idParams.extend({ assessmentId: z.string().uuid() });

async function assertModuleInDraft(courseId: string, moduleId: string) {
  const draft = await requireDraftVersion(courseId);
  const mod = await prisma.module.findFirst({ where: { id: moduleId, courseVersionId: draft.id } });
  if (!mod) throw notFound('Módulo não encontrado no rascunho atual');
  return { draft, mod };
}

async function assertLessonInDraft(courseId: string, lessonId: string) {
  const draft = await requireDraftVersion(courseId);
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, module: { courseVersionId: draft.id } } });
  if (!lesson) throw notFound('Aula não encontrada no rascunho atual');
  return { draft, lesson };
}

export const coursesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get(
    '/',
    {
      schema: {
        tags: ['courses'],
        summary: 'Lista cursos (administração)',
        querystring: paginationSchema.extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() }),
      },
    },
    async (req) => {
      const q = req.query;
      const where: Prisma.CourseWhereInput = {
        ...(q.status ? { status: q.status } : {}),
        ...(q.search ? { title: { contains: q.search, mode: 'insensitive' } } : {}),
      };
      const orderBy: Prisma.CourseOrderByWithRelationInput = q.sort === 'title' ? { title: q.order } : { updatedAt: q.order };
      const [total, courses] = await Promise.all([
        prisma.course.count({ where }),
        prisma.course.findMany({
          where,
          orderBy,
          ...pageArgs(q),
          include: {
            versions: { orderBy: { versionNumber: 'desc' }, select: { id: true, versionNumber: true, status: true, difficulty: true, estimatedHours: true, description: true, publishedAt: true, _count: { select: { modules: true } } } },
            _count: { select: { enrollments: true } },
          },
        }),
      ]);
      const ids = courses.map((c) => c.id);
      const progress = await prisma.enrollment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: ids }, status: { not: 'CANCELLED' } },
        _avg: { progressPercent: true },
        _count: { _all: true },
      });
      const completed = await prisma.enrollment.groupBy({ by: ['courseId'], where: { courseId: { in: ids }, status: 'COMPLETED' }, _count: { _all: true } });
      const data = courses.map((c) => {
        const latest = c.versions[0];
        const published = c.versions.find((v) => v.id === c.latestPublishedVersionId);
        const p = progress.find((x) => x.courseId === c.id);
        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          status: c.status,
          coverColor: c.coverColor,
          generatedByAI: c.generatedByAI,
          isDemo: c.isDemo,
          updatedAt: c.updatedAt,
          description: (published ?? latest)?.description ?? '',
          difficulty: (published ?? latest)?.difficulty,
          estimatedHours: (published ?? latest)?.estimatedHours,
          moduleCount: (published ?? latest)?._count.modules ?? 0,
          publishedVersion: published ? { id: published.id, versionNumber: published.versionNumber, publishedAt: published.publishedAt } : null,
          hasDraft: c.versions.some((v) => v.status === 'DRAFT'),
          versionCount: c.versions.length,
          enrollmentCount: p?._count._all ?? 0,
          averageProgress: p?._avg.progressPercent ?? null,
          completedCount: completed.find((x) => x.courseId === c.id)?._count._all ?? 0,
        };
      });
      return ok(data, pageMeta(q, total));
    },
  );

  app.post('/', { schema: { tags: ['courses'], summary: 'Cria curso (rascunho v1)', body: courseMetaSchema } }, async (req, reply) => {
    const { course, version } = await createCourse(req.body, currentUser(req).id);
    await audit(req, 'course.create', 'Course', course.id, { title: course.title });
    return reply.status(201).send(ok({ id: course.id, versionId: version.id }));
  });

  app.get(
    '/:courseId',
    {
      schema: {
        tags: ['courses'],
        summary: 'Detalhe do curso com árvore de conteúdo (rascunho, se houver, ou versão publicada)',
        params: idParams,
        querystring: z.object({ versionId: z.string().uuid().optional() }),
      },
    },
    async (req) => {
      const course = await prisma.course.findUnique({
        where: { id: req.params.courseId },
        include: {
          versions: { orderBy: { versionNumber: 'desc' }, select: { id: true, versionNumber: true, status: true, publishedAt: true, createdAt: true, _count: { select: { enrollments: true } } } },
        },
      });
      if (!course) throw notFound('Curso não encontrado');
      const draft = await getDraftVersion(course.id);
      const versionId = req.query.versionId ?? draft?.id ?? course.latestPublishedVersionId ?? course.versions[0]?.id;
      if (!versionId || !course.versions.some((v) => v.id === versionId)) throw notFound('Versão não encontrada');
      const tree = await getVersionTree(versionId);
      return ok({
        course: { id: course.id, title: course.title, slug: course.slug, status: course.status, coverColor: course.coverColor, generatedByAI: course.generatedByAI, latestPublishedVersionId: course.latestPublishedVersionId },
        versions: course.versions.map((v) => ({ ...v, enrollmentCount: v._count.enrollments })),
        version: tree,
        editable: tree.status === 'DRAFT' && course.status !== 'ARCHIVED',
        publishIssues: tree.status === 'DRAFT' ? validateForPublish(tree) : [],
      });
    },
  );

  app.patch('/:courseId', { schema: { tags: ['courses'], summary: 'Atualiza metadados do rascunho', params: idParams, body: courseMetaSchema } }, async (req) => {
    const versionId = await updateCourseMeta(req.params.courseId, req.body);
    await audit(req, 'course.update', 'Course', req.params.courseId, { versionId });
    return ok({ versionId });
  });

  app.patch(
    '/:courseId/addie',
    {
      schema: {
        tags: ['courses'],
        summary: 'Atualiza as notas de design instrucional (ADDIE) do rascunho',
        params: idParams,
        body: z.object({ analysis: z.string().max(3000), design: z.string().max(3000), development: z.string().max(3000), implementation: z.string().max(3000), evaluation: z.string().max(3000) }),
      },
    },
    async (req) => {
      const draft = await requireDraftVersion(req.params.courseId);
      await prisma.courseVersion.update({ where: { id: draft.id }, data: { addieNotes: req.body } });
      return ok({ success: true });
    },
  );

  app.post('/:courseId/publish', { schema: { tags: ['courses'], summary: 'Publica o rascunho como nova versão', params: idParams } }, async (req) => {
    const published = await publishCourse(req.params.courseId);
    await audit(req, 'course.publish', 'Course', req.params.courseId, { versionId: published.id, versionNumber: published.versionNumber });
    return ok(published);
  });

  app.post('/:courseId/versions', { schema: { tags: ['courses'], summary: 'Cria um novo rascunho a partir da versão publicada', params: idParams } }, async (req, reply) => {
    const draft = await createDraftFromPublished(req.params.courseId);
    await audit(req, 'course.new_version', 'Course', req.params.courseId, { versionId: draft.id, versionNumber: draft.versionNumber });
    return reply.status(201).send(ok(draft));
  });

  app.post('/:courseId/archive', { schema: { tags: ['courses'], summary: 'Arquiva o curso', params: idParams } }, async (req) => {
    const course = await prisma.course.update({ where: { id: req.params.courseId }, data: { status: 'ARCHIVED' } });
    await audit(req, 'course.archive', 'Course', course.id);
    return ok(course);
  });

  app.post('/:courseId/unarchive', { schema: { tags: ['courses'], summary: 'Restaura um curso arquivado', params: idParams } }, async (req) => {
    const current = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!current) throw notFound();
    const course = await prisma.course.update({ where: { id: current.id }, data: { status: current.latestPublishedVersionId ? 'PUBLISHED' : 'DRAFT' } });
    await audit(req, 'course.unarchive', 'Course', course.id);
    return ok(course);
  });

  app.post('/:courseId/duplicate', { schema: { tags: ['courses'], summary: 'Duplica o curso como novo rascunho', params: idParams } }, async (req, reply) => {
    const copy = await duplicateCourse(req.params.courseId, currentUser(req).id);
    await audit(req, 'course.duplicate', 'Course', copy.id, { sourceId: req.params.courseId });
    return reply.status(201).send(ok({ id: copy.id }));
  });

  app.delete('/:courseId', { schema: { tags: ['courses'], summary: 'Exclui curso sem alocações', params: idParams } }, async (req) => {
    const count = await prisma.enrollment.count({ where: { courseId: req.params.courseId } });
    if (count) throw conflict('Cursos com alocações não podem ser excluídos. Arquive-o.');
    await prisma.course.delete({ where: { id: req.params.courseId } });
    await audit(req, 'course.delete', 'Course', req.params.courseId);
    return ok({ success: true });
  });

  // ─── Módulos ───
  app.post('/:courseId/modules', { schema: { tags: ['courses'], summary: 'Adiciona módulo ao rascunho', params: idParams, body: moduleSchema } }, async (req, reply) => {
    const draft = await requireDraftVersion(req.params.courseId);
    const max = await prisma.module.aggregate({ where: { courseVersionId: draft.id }, _max: { order: true } });
    const mod = await prisma.module.create({ data: { courseVersionId: draft.id, order: (max._max.order ?? 0) + 1, ...req.body } });
    return reply.status(201).send(ok(mod));
  });

  app.patch('/:courseId/modules/:moduleId', { schema: { tags: ['courses'], params: moduleParams, body: moduleSchema } }, async (req) => {
    await assertModuleInDraft(req.params.courseId, req.params.moduleId);
    return ok(await prisma.module.update({ where: { id: req.params.moduleId }, data: req.body }));
  });

  app.delete('/:courseId/modules/:moduleId', { schema: { tags: ['courses'], params: moduleParams } }, async (req) => {
    await assertModuleInDraft(req.params.courseId, req.params.moduleId);
    await prisma.module.delete({ where: { id: req.params.moduleId } });
    return ok({ success: true });
  });

  app.post('/:courseId/modules/reorder', { schema: { tags: ['courses'], summary: 'Reordena módulos', params: idParams, body: reorderSchema } }, async (req) => {
    const draft = await requireDraftVersion(req.params.courseId);
    const modules = await prisma.module.findMany({ where: { courseVersionId: draft.id }, select: { id: true } });
    const ids = new Set(modules.map((m) => m.id));
    if (req.body.orderedIds.length !== ids.size || !req.body.orderedIds.every((id) => ids.has(id))) throw badRequest('Lista de módulos inválida');
    await prisma.$transaction(req.body.orderedIds.map((id, i) => prisma.module.update({ where: { id }, data: { order: i + 1 } })));
    return ok({ success: true });
  });

  // ─── Aulas ───
  app.post('/:courseId/modules/:moduleId/lessons', { schema: { tags: ['courses'], summary: 'Adiciona aula', params: moduleParams, body: lessonSchema } }, async (req, reply) => {
    await assertModuleInDraft(req.params.courseId, req.params.moduleId);
    const max = await prisma.lesson.aggregate({ where: { moduleId: req.params.moduleId }, _max: { order: true } });
    const lesson = await prisma.$transaction((tx) => createLesson(tx, req.params.moduleId, (max._max.order ?? 0) + 1, req.body));
    return reply.status(201).send(ok(lesson));
  });

  app.post('/:courseId/modules/:moduleId/lessons/reorder', { schema: { tags: ['courses'], params: moduleParams, body: reorderSchema } }, async (req) => {
    await assertModuleInDraft(req.params.courseId, req.params.moduleId);
    const lessons = await prisma.lesson.findMany({ where: { moduleId: req.params.moduleId }, select: { id: true } });
    const ids = new Set(lessons.map((l) => l.id));
    if (req.body.orderedIds.length !== ids.size || !req.body.orderedIds.every((id) => ids.has(id))) throw badRequest('Lista de aulas inválida');
    await prisma.$transaction(req.body.orderedIds.map((id, i) => prisma.lesson.update({ where: { id }, data: { order: i + 1 } })));
    return ok({ success: true });
  });

  app.patch('/:courseId/lessons/:lessonId', { schema: { tags: ['courses'], params: lessonParams, body: lessonSchema } }, async (req) => {
    await assertLessonInDraft(req.params.courseId, req.params.lessonId);
    return ok(await prisma.$transaction((tx) => updateLesson(tx, req.params.lessonId, req.body)));
  });

  app.delete('/:courseId/lessons/:lessonId', { schema: { tags: ['courses'], params: lessonParams } }, async (req) => {
    await assertLessonInDraft(req.params.courseId, req.params.lessonId);
    await prisma.lesson.delete({ where: { id: req.params.lessonId } });
    return ok({ success: true });
  });

  app.put('/:courseId/lessons/:lessonId/activity', { schema: { tags: ['courses'], summary: 'Cria/substitui a atividade e a rubrica da aula', params: lessonParams, body: activitySchema } }, async (req) => {
    await assertLessonInDraft(req.params.courseId, req.params.lessonId);
    const activity = await prisma.$transaction((tx) => writeActivity(tx, req.params.lessonId, req.body));
    return ok(activity);
  });

  app.delete('/:courseId/lessons/:lessonId/activity', { schema: { tags: ['courses'], params: lessonParams } }, async (req) => {
    await assertLessonInDraft(req.params.courseId, req.params.lessonId);
    await prisma.activity.deleteMany({ where: { lessonId: req.params.lessonId } });
    return ok({ success: true });
  });

  // ─── Avaliações (diagnóstico, módulo, final, satisfação) ───
  app.put('/:courseId/assessments', { schema: { tags: ['courses'], summary: 'Cria/substitui uma avaliação do rascunho', params: idParams, body: assessmentSchema } }, async (req) => {
    const draft = await requireDraftVersion(req.params.courseId);
    if (req.body.kind === 'MODULE_QUIZ') {
      if (!req.body.moduleId) throw badRequest('Avaliações de módulo exigem moduleId');
      await assertModuleInDraft(req.params.courseId, req.body.moduleId);
    }
    const competencyIds = req.body.questions.map((q) => q.competencyId).filter((x): x is string => !!x);
    if (competencyIds.length) {
      const found = await prisma.competency.count({ where: { id: { in: [...new Set(competencyIds)] } } });
      if (found !== new Set(competencyIds).size) throw badRequest('Competência inválida em uma das questões');
    }
    const id = await prisma.$transaction((tx) => upsertAssessment(tx, draft.id, req.body), { timeout: 30_000 });
    return ok({ id });
  });

  app.delete('/:courseId/assessments/:assessmentId', { schema: { tags: ['courses'], params: assessmentParams } }, async (req) => {
    const draft = await requireDraftVersion(req.params.courseId);
    const a = await prisma.assessment.findFirst({ where: { id: req.params.assessmentId, courseVersionId: draft.id } });
    if (!a) throw notFound('Avaliação não encontrada no rascunho');
    await prisma.assessment.delete({ where: { id: a.id } });
    return ok({ success: true });
  });

  // ─── Pré-visualização como estudante ───
  app.get(
    '/:courseId/preview/lessons/:lessonId',
    {
      schema: {
        tags: ['courses'],
        summary: 'Pré-visualiza uma aula como estudante de determinado nível',
        params: lessonParams,
        querystring: z.object({ level: z.coerce.number().int().min(1).max(4).default(1) }),
      },
    },
    async (req) => {
      const lesson = await prisma.lesson.findFirst({
        where: { id: req.params.lessonId, module: { courseVersion: { courseId: req.params.courseId } } },
        include: { module: true, activity: { include: { rubric: { include: { criteria: { orderBy: { order: 'asc' } } } } } }, competencies: { include: { competency: true } } },
      });
      if (!lesson) throw notFound('Aula não encontrada');
      return ok({ lesson, presentation: lessonPresentation(req.query.level) });
    },
  );
};
