import type { CourseMetaInput } from '@impulso/shared';
import { Prisma } from '@prisma/client';
import { prisma, type Tx } from '../../database/prisma';
import { conflict, notFound, unprocessable } from '../../shared/errors';
import { asStringArray } from '../../shared/http';
import { parseCriteria } from '../learning/progress';
import { createLesson, upsertAssessment, writeActivity, type ActivityData, type LessonData, type QuestionData } from './content-writer';

/** Árvore completa de uma versão de curso (para editor, pré-visualização e cópia). */
export const versionTreeInclude = {
  competencies: { include: { competency: true } },
  modules: {
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          competencies: { include: { competency: true } },
          activity: { include: { rubric: { include: { criteria: { orderBy: { order: 'asc' } } } } } },
        },
      },
    },
  },
  assessments: {
    orderBy: { createdAt: 'asc' },
    include: { questions: { orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } } } } },
  },
} satisfies Prisma.CourseVersionInclude;

export type VersionTree = Prisma.CourseVersionGetPayload<{ include: typeof versionTreeInclude }>;

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'curso'
  );
}

export async function uniqueSlug(base: string, db: Tx = prisma) {
  const root = slugify(base);
  let slug = root;
  for (let i = 2; await db.course.findUnique({ where: { slug } }); i++) slug = `${root}-${i}`;
  return slug;
}

export async function getVersionTree(versionId: string, db: Tx = prisma) {
  const v = await db.courseVersion.findUnique({ where: { id: versionId }, include: versionTreeInclude });
  if (!v) throw notFound('Versão do curso não encontrada');
  return v;
}

export async function getDraftVersion(courseId: string, db: Tx = prisma) {
  return db.courseVersion.findFirst({ where: { courseId, status: 'DRAFT' }, orderBy: { versionNumber: 'desc' } });
}

/** Garante que existe um rascunho editável; caso contrário, orienta a criação de nova versão. */
export async function requireDraftVersion(courseId: string, db: Tx = prisma) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw notFound('Curso não encontrado');
  if (course.status === 'ARCHIVED') throw conflict('Curso arquivado. Restaure-o antes de editar.');
  const draft = await getDraftVersion(courseId, db);
  if (!draft) throw conflict('Versões publicadas são imutáveis. Crie uma nova versão (rascunho) para editar.', { code: 'NO_DRAFT' });
  return draft;
}

export async function createCourse(meta: CourseMetaInput, createdById: string, opts: { generatedByAI?: boolean; isDemo?: boolean } = {}, db: Tx = prisma) {
  const course = await db.course.create({
    data: {
      title: meta.title,
      slug: await uniqueSlug(meta.title, db),
      coverColor: meta.coverColor ?? 'indigo',
      createdById,
      generatedByAI: opts.generatedByAI ?? false,
      isDemo: opts.isDemo ?? false,
      versions: {
        create: {
          versionNumber: 1,
          status: 'DRAFT',
          ...versionMetaFields(meta),
          competencies: { create: meta.competencyIds.map((competencyId) => ({ competencyId })) },
        },
      },
    },
    include: { versions: true },
  });
  return { course, version: course.versions[0] };
}

const versionMetaFields = (meta: CourseMetaInput) => ({
  title: meta.title,
  description: meta.description,
  objectives: meta.objectives,
  targetAudience: meta.targetAudience,
  prerequisites: meta.prerequisites,
  difficulty: meta.difficulty,
  estimatedHours: meta.estimatedHours,
  coverImageUrl: meta.coverImageUrl || null,
  completionCriteria: parseCriteria(meta.completionCriteria ?? {}) as Prisma.InputJsonValue,
});

export async function updateCourseMeta(courseId: string, meta: CourseMetaInput) {
  return prisma.$transaction(async (tx) => {
    const draft = await requireDraftVersion(courseId, tx);
    await tx.courseVersionCompetency.deleteMany({ where: { courseVersionId: draft.id } });
    await tx.courseVersion.update({
      where: { id: draft.id },
      data: { ...versionMetaFields(meta), competencies: { create: meta.competencyIds.map((competencyId) => ({ competencyId })) } },
    });
    await tx.course.update({ where: { id: courseId }, data: { title: meta.title, ...(meta.coverColor ? { coverColor: meta.coverColor } : {}) } });
    return draft.id;
  });
}

/** Verificações antes da publicação. Retorna a lista de problemas (vazia = publicável). */
export function validateForPublish(tree: VersionTree): string[] {
  const issues: string[] = [];
  if (!tree.modules.length) issues.push('O curso precisa de pelo menos um módulo.');
  for (const m of tree.modules) {
    if (!m.lessons.length) issues.push(`O módulo "${m.title}" não possui aulas.`);
    for (const l of m.lessons) {
      if (l.learnContent.trim().length < 30) issues.push(`A aula "${l.title}" está sem conteúdo teórico suficiente.`);
      if (l.activity && !l.activity.rubric?.criteria.length) issues.push(`A atividade da aula "${l.title}" está sem rubrica.`);
    }
  }
  const criteria = parseCriteria(tree.completionCriteria);
  const final = tree.assessments.find((a) => a.kind === 'FINAL');
  if (criteria.requireFinalAssessment && (!final || !final.questions.length)) issues.push('A avaliação final é exigida, mas não possui questões.');
  const diagnostic = tree.assessments.find((a) => a.kind === 'DIAGNOSTIC');
  if (!diagnostic || !diagnostic.questions.length) issues.push('O curso precisa de um questionário diagnóstico.');
  for (const a of tree.assessments) {
    for (const q of a.questions) {
      if (['SINGLE_CHOICE', 'SCENARIO', 'TRUE_FALSE'].includes(q.type) && q.isScored && !q.selfReported && !q.options.some((o) => o.isCorrect || (o.score ?? 0) >= 100)) {
        issues.push(`Questão sem alternativa correta em "${a.title}": "${q.prompt.slice(0, 60)}".`);
      }
    }
  }
  return issues;
}

export async function publishCourse(courseId: string) {
  return prisma.$transaction(async (tx) => {
    const draft = await requireDraftVersion(courseId, tx);
    const tree = await getVersionTree(draft.id, tx);
    const issues = validateForPublish(tree);
    if (issues.length) throw unprocessable('O curso ainda não pode ser publicado.', { issues });
    await tx.courseVersion.updateMany({ where: { courseId, status: 'PUBLISHED' }, data: { status: 'SUPERSEDED' } });
    const published = await tx.courseVersion.update({ where: { id: draft.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    await tx.course.update({ where: { id: courseId }, data: { status: 'PUBLISHED', latestPublishedVersionId: published.id, title: published.title } });
    return published;
  });
}

/**
 * Copia integralmente o conteúdo de uma versão para outra (módulos, aulas, atividades, rubricas,
 * avaliações e questões). Usado para nova versão e duplicação — nunca altera a versão de origem.
 */
export async function copyVersionContent(tx: Tx, source: VersionTree, targetVersionId: string) {
  const moduleIdMap = new Map<string, string>();
  for (const m of source.modules) {
    const mod = await tx.module.create({
      data: { courseVersionId: targetVersionId, order: m.order, title: m.title, description: m.description, objectives: m.objectives ?? [] },
    });
    moduleIdMap.set(m.id, mod.id);
    for (const l of m.lessons) {
      await createLesson(tx, mod.id, l.order, {
        ...l,
        resources: (l.resources as LessonData['resources']) ?? [],
        keyTakeaways: asStringArray(l.keyTakeaways),
        competencies: l.competencies.map((c) => ({ competencyId: c.competencyId, weight: c.weight })),
        activity: l.activity ? activityToData(l.activity) : null,
      });
    }
  }
  for (const a of source.assessments) {
    await upsertAssessment(tx, targetVersionId, {
      kind: a.kind,
      moduleId: a.moduleId ? moduleIdMap.get(a.moduleId) ?? null : null,
      title: a.title,
      description: a.description,
      passingScore: a.passingScore,
      maxAttempts: a.maxAttempts,
      questions: a.questions.map(questionToData),
    });
  }
}

export function activityToData(a: NonNullable<VersionTree['modules'][number]['lessons'][number]['activity']>): ActivityData {
  return {
    type: a.type,
    title: a.title,
    instructions: a.instructions,
    scenario: a.scenario,
    guidedSteps: asStringArray(a.guidedSteps),
    advancedChallenge: a.advancedChallenge,
    socraticQuestions: asStringArray(a.socraticQuestions),
    hints: asStringArray(a.hints),
    modelAnswer: a.modelAnswer,
    expectedKeywords: asStringArray(a.expectedKeywords),
    maxAttempts: a.maxAttempts,
    passingScore: a.passingScore,
    rubric: {
      title: a.rubric?.title ?? a.title,
      description: a.rubric?.description ?? '',
      criteria: (a.rubric?.criteria ?? []).map((c) => ({
        key: c.key,
        name: c.name,
        description: c.description,
        weight: c.weight,
        maxScore: c.maxScore,
        indicators: asStringArray(c.indicators),
      })),
    },
  };
}

export function questionToData(q: VersionTree['assessments'][number]['questions'][number]): QuestionData {
  return {
    type: q.type,
    prompt: q.prompt,
    helpText: q.helpText,
    dimension: q.dimension,
    competencyId: q.competencyId,
    points: q.points,
    isScored: q.isScored,
    selfReported: q.selfReported,
    explanation: q.explanation,
    likertLabels: asStringArray(q.likertLabels),
    options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect, score: o.score, feedback: o.feedback })),
  };
}

/** Cria um novo rascunho a partir da última versão publicada (as versões publicadas permanecem intactas). */
export async function createDraftFromPublished(courseId: string) {
  return prisma.$transaction(
    async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) throw notFound('Curso não encontrado');
      const existing = await getDraftVersion(courseId, tx);
      if (existing) return existing;
      if (!course.latestPublishedVersionId) throw conflict('Não há versão publicada para copiar.');
      const source = await getVersionTree(course.latestPublishedVersionId, tx);
      const last = await tx.courseVersion.findFirst({ where: { courseId }, orderBy: { versionNumber: 'desc' } });
      const draft = await tx.courseVersion.create({
        data: {
          courseId,
          versionNumber: (last?.versionNumber ?? 0) + 1,
          status: 'DRAFT',
          title: source.title,
          description: source.description,
          objectives: source.objectives ?? [],
          targetAudience: source.targetAudience,
          prerequisites: source.prerequisites,
          difficulty: source.difficulty,
          estimatedHours: source.estimatedHours,
          coverImageUrl: source.coverImageUrl,
          completionCriteria: source.completionCriteria ?? {},
          addieNotes: source.addieNotes ?? {},
          competencies: { create: source.competencies.map((c) => ({ competencyId: c.competencyId })) },
        },
      });
      await copyVersionContent(tx, source, draft.id);
      return draft;
    },
    { timeout: 60_000 },
  );
}

export async function duplicateCourse(courseId: string, actorId: string) {
  return prisma.$transaction(
    async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) throw notFound('Curso não encontrado');
      const sourceVersion =
        (await getDraftVersion(courseId, tx)) ??
        (course.latestPublishedVersionId ? await tx.courseVersion.findUnique({ where: { id: course.latestPublishedVersionId } }) : null);
      if (!sourceVersion) throw conflict('Curso sem conteúdo para duplicar.');
      const source = await getVersionTree(sourceVersion.id, tx);
      const title = `${source.title} (cópia)`;
      const copy = await tx.course.create({
        data: {
          title,
          slug: await uniqueSlug(title, tx),
          coverColor: course.coverColor,
          createdById: actorId,
          versions: {
            create: {
              versionNumber: 1,
              status: 'DRAFT',
              title,
              description: source.description,
              objectives: source.objectives ?? [],
              targetAudience: source.targetAudience,
              prerequisites: source.prerequisites,
              difficulty: source.difficulty,
              estimatedHours: source.estimatedHours,
              coverImageUrl: source.coverImageUrl,
              completionCriteria: source.completionCriteria ?? {},
              addieNotes: source.addieNotes ?? {},
              competencies: { create: source.competencies.map((c) => ({ competencyId: c.competencyId })) },
            },
          },
        },
        include: { versions: true },
      });
      await copyVersionContent(tx, source, copy.versions[0].id);
      return copy;
    },
    { timeout: 60_000 },
  );
}

export { writeActivity };
