import { prisma } from '../prisma';
import { createLesson, upsertAssessment, type QuestionData } from '../../modules/courses/content-writer';
import { getVersionTree, validateForPublish } from '../../modules/courses/courses.service';
import type { SeedAssessment, SeedCourse } from './content';

/** Cria (se ainda não existir) e publica um curso a partir do conteúdo declarativo do seed. */
export async function loadCourse(content: SeedCourse, opts: { createdById: string; isDemo: boolean }) {
  const existing = await prisma.course.findUnique({ where: { slug: content.slug } });
  if (existing) return existing;

  const competencies = new Map((await prisma.competency.findMany()).map((c) => [c.key, c.id]));
  const compId = (key?: string) => {
    if (!key) return null;
    const id = competencies.get(key);
    if (!id) throw new Error(`Competência desconhecida no seed: ${key}`);
    return id;
  };
  const toQuestions = (a: SeedAssessment): QuestionData[] =>
    a.questions.map((q) => ({
      type: q.type,
      prompt: q.prompt,
      helpText: q.helpText ?? null,
      dimension: q.dimension ?? null,
      competencyId: compId(q.competencyKey),
      points: q.points ?? 1,
      isScored: q.isScored ?? q.type !== 'OPEN',
      selfReported: q.selfReported ?? false,
      explanation: q.explanation ?? null,
      likertLabels: q.likertLabels ?? [],
      options: (q.options ?? []).map((o) => ({ label: o.label, isCorrect: o.isCorrect ?? false, score: o.score ?? null, feedback: o.feedback ?? null })),
    }));

  const course = await prisma.$transaction(
    async (tx) => {
      const course = await tx.course.create({
        data: {
          slug: content.slug,
          title: content.title,
          status: 'DRAFT',
          coverColor: content.coverColor,
          isDemo: opts.isDemo,
          createdById: opts.createdById,
          versions: {
            create: {
              versionNumber: 1,
              status: 'DRAFT',
              title: content.title,
              description: content.description,
              objectives: content.objectives,
              targetAudience: content.targetAudience,
              prerequisites: content.prerequisites,
              difficulty: content.difficulty,
              estimatedHours: content.estimatedHours,
              completionCriteria: { minLessonCompletion: 100, requireModuleQuizzes: true, requireFinalAssessment: true, finalAssessmentPassingScore: content.finalAssessment.passingScore ?? 70 },
              addieNotes: content.addieNotes,
              competencies: { create: content.competencyKeys.map((k) => ({ competencyId: compId(k)! })) },
            },
          },
        },
        include: { versions: true },
      });
      const versionId = course.versions[0].id;
      for (const [mi, m] of content.modules.entries()) {
        const mod = await tx.module.create({ data: { courseVersionId: versionId, order: mi + 1, title: m.title, description: m.description, objectives: m.objectives } });
        for (const [li, l] of m.lessons.entries()) {
          await createLesson(tx, mod.id, li + 1, {
            ...l,
            competencies: l.competencies.map((c) => ({ competencyId: compId(c.key)!, weight: c.weight })),
            activity: l.activity ?? null,
          });
        }
        if (m.quiz) {
          await upsertAssessment(tx, versionId, {
            kind: 'MODULE_QUIZ',
            moduleId: mod.id,
            title: m.quiz.title,
            description: m.quiz.description,
            passingScore: m.quiz.passingScore,
            maxAttempts: m.quiz.maxAttempts,
            questions: toQuestions(m.quiz),
          });
        }
      }
      for (const a of [content.diagnostic, content.finalAssessment, content.satisfaction]) {
        await upsertAssessment(tx, versionId, { kind: a.kind, title: a.title, description: a.description, passingScore: a.passingScore, maxAttempts: a.maxAttempts, questions: toQuestions(a) });
      }
      return course;
    },
    { timeout: 120_000 },
  );

  // Publicação explícita, passando pela mesma validação usada no painel.
  const version = course.versions[0];
  const issues = validateForPublish(await getVersionTree(version.id));
  if (issues.length) throw new Error(`Curso do seed inválido (${content.slug}):\n- ${issues.join('\n- ')}`);
  await prisma.courseVersion.update({ where: { id: version.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  return prisma.course.update({ where: { id: course.id }, data: { status: 'PUBLISHED', latestPublishedVersionId: version.id } });
}
