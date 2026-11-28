import type { CourseGenerationInput } from '@impulso/shared';
import type { CourseGenerationJob, Prisma } from '@prisma/client';
import { prisma, type Tx } from '../../../database/prisma';
import { notFound } from '../../../shared/errors';
import { createLesson, upsertAssessment, type QuestionData } from '../../courses/content-writer';
import { requireDraftVersion, uniqueSlug } from '../../courses/courses.service';
import { ai } from '../ai.client';
import type { CourseAssessmentsInput, ModuleContentInput } from '../inputs';
import { courseAssessmentsPrompt, courseOutlinePrompt, moduleContentPrompt } from '../prompts';
import { courseAssessmentsSchema, courseOutlineSchema, moduleContentSchema, type CourseOutline, type GeneratedQuestion } from '../schemas';

/**
 * Geração de cursos por etapas (estrutura → um módulo por vez → avaliações), com estado persistido.
 * Cada etapa é idempotente: uma nova tentativa retoma do ponto de falha sem duplicar o curso.
 * O curso é sempre criado como RASCUNHO e nunca é publicado automaticamente.
 */
const running = new Set<string>();

async function ensureCompetencies(tx: Tx, outline: CourseOutline) {
  const map = new Map<string, string>();
  for (const c of outline.competencies) {
    const comp = await tx.competency.upsert({
      where: { key: c.key },
      create: { key: c.key, name: c.name, description: c.description, category: 'Gerada por IA' },
      update: {},
    });
    map.set(c.key, comp.id);
  }
  return map;
}

const toQuestionData = (q: GeneratedQuestion, comps: Map<string, string>): QuestionData => ({
  type: q.type,
  prompt: q.prompt,
  dimension: q.dimension ?? null,
  competencyId: q.competencyKey ? comps.get(q.competencyKey) ?? null : null,
  isScored: q.type === 'OPEN' ? false : q.isScored,
  selfReported: q.selfReported,
  explanation: q.explanation ?? null,
  likertLabels: q.likertLabels,
  options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect, score: o.score ?? null })),
});

async function step(job: CourseGenerationJob, userId: string): Promise<CourseGenerationJob> {
  const params = job.params as unknown as CourseGenerationInput;

  if (job.step === 'outline') {
    const input = { params };
    const { system, prompt } = courseOutlinePrompt(input);
    const res = await ai.generateStructured({ operation: 'course_outline', system, prompt, schema: courseOutlineSchema, input, maxTokens: 4000 }, { userId });
    const outline = { ...res.data, modules: res.data.modules.slice(0, params.moduleCount) };
    return prisma.$transaction(async (tx) => {
      const comps = await ensureCompetencies(tx, outline);
      const course = await tx.course.create({
        data: {
          title: outline.title,
          slug: await uniqueSlug(outline.title, tx),
          generatedByAI: true,
          createdById: job.createdById,
          coverColor: 'violet',
          versions: {
            create: {
              versionNumber: 1,
              status: 'DRAFT',
              title: outline.title,
              description: outline.description,
              objectives: outline.objectives,
              targetAudience: outline.targetAudience || params.targetAudience,
              prerequisites: outline.prerequisites,
              difficulty: outline.difficulty,
              estimatedHours: params.workloadHours,
              completionCriteria: {
                minLessonCompletion: 100,
                requireModuleQuizzes: outline.completionCriteria.requireModuleQuizzes ?? true,
                requireFinalAssessment: true,
                finalAssessmentPassingScore: outline.completionCriteria.finalAssessmentPassingScore ?? 70,
              },
              addieNotes: outline.addieNotes,
              competencies: { create: [...comps.values()].map((competencyId) => ({ competencyId })) },
            },
          },
        },
      });
      return tx.courseGenerationJob.update({
        where: { id: job.id },
        data: { courseId: course.id, outline: outline as unknown as Prisma.InputJsonValue, step: 'modules', totalModules: outline.modules.length, status: 'RUNNING' },
      });
    });
  }

  const outline = job.outline as unknown as CourseOutline;
  const version = await prisma.courseVersion.findFirstOrThrow({ where: { courseId: job.courseId!, status: 'DRAFT' }, orderBy: { versionNumber: 'desc' } });
  const comps = new Map((await prisma.competency.findMany({ where: { key: { in: outline.competencies.map((c) => c.key) } } })).map((c) => [c.key, c.id]));

  if (job.step === 'modules') {
    const index = job.completedModules;
    const mod = outline.modules[index];
    const lessonsTotal = outline.modules.reduce((s, m) => s + m.lessonTitles.length, 0);
    const input: ModuleContentInput = {
      params,
      courseTitle: outline.title,
      competencies: outline.competencies,
      module: mod,
      moduleIndex: index,
      totalModules: outline.modules.length,
      minutesPerLesson: Math.max(10, Math.round((params.workloadHours * 60 * 0.8) / Math.max(1, lessonsTotal))),
      includeActivity: true,
    };
    const { system, prompt } = moduleContentPrompt(input);
    const res = await ai.generateStructured({ operation: 'module_content', system, prompt, schema: moduleContentSchema, input, maxTokens: 12000 }, { userId });
    return prisma.$transaction(
      async (tx) => {
        // Idempotência: remove um módulo parcialmente gravado nesta mesma posição antes de gravar novamente.
        await tx.module.deleteMany({ where: { courseVersionId: version.id, order: index + 1 } });
        const created = await tx.module.create({
          data: { courseVersionId: version.id, order: index + 1, title: mod.title, description: mod.description, objectives: mod.objectives },
        });
        for (const [i, l] of res.data.lessons.entries()) {
          await createLesson(tx, created.id, i + 1, {
            ...l,
            competencies: l.competencyKeys.map((k) => comps.get(k)).filter((x): x is string => !!x).map((competencyId) => ({ competencyId, weight: 1 })),
            activity: l.activity ?? null,
          });
        }
        if (res.data.quiz?.questions.length) {
          await upsertAssessment(tx, version.id, {
            kind: 'MODULE_QUIZ',
            moduleId: created.id,
            title: `Avaliação do módulo: ${mod.title}`,
            passingScore: 60,
            maxAttempts: 3,
            questions: res.data.quiz.questions.map((q) => toQuestionData(q, comps)),
          });
        }
        const done = index + 1;
        return tx.courseGenerationJob.update({
          where: { id: job.id },
          data: { completedModules: done, step: done >= outline.modules.length ? 'assessments' : 'modules' },
        });
      },
      { timeout: 60_000 },
    );
  }

  if (job.step === 'assessments') {
    const input: CourseAssessmentsInput = {
      courseTitle: outline.title,
      topic: params.topic,
      professionalContext: params.professionalContext,
      competencies: outline.competencies,
      modules: outline.modules.map((m) => ({ title: m.title, objectives: m.objectives })),
    };
    const { system, prompt } = courseAssessmentsPrompt(input);
    const res = await ai.generateStructured({ operation: 'course_assessments', system, prompt, schema: courseAssessmentsSchema, input, maxTokens: 8000 }, { userId });
    return prisma.$transaction(
      async (tx) => {
        await upsertAssessment(tx, version.id, {
          kind: 'DIAGNOSTIC',
          title: 'Diagnóstico inicial',
          description: 'Responda com sinceridade: o diagnóstico personaliza sua trilha e não é usado como critério de exclusão.',
          passingScore: 0,
          maxAttempts: 1,
          questions: res.data.diagnostic.questions.map((q) => toQuestionData(q, comps)),
        });
        await upsertAssessment(tx, version.id, {
          kind: 'FINAL',
          title: 'Avaliação final',
          passingScore: 70,
          maxAttempts: 2,
          questions: res.data.finalAssessment.questions.map((q) => toQuestionData(q, comps)),
        });
        return tx.courseGenerationJob.update({ where: { id: job.id }, data: { step: 'done', status: 'COMPLETED', error: null } });
      },
      { timeout: 60_000 },
    );
  }
  return job;
}

async function run(jobId: string, userId: string) {
  if (running.has(jobId)) return;
  running.add(jobId);
  try {
    let job = await prisma.courseGenerationJob.update({ where: { id: jobId }, data: { status: 'RUNNING', error: null } });
    while (job.status !== 'COMPLETED' && job.step !== 'done') job = await step(job, userId);
  } catch (err) {
    await prisma.courseGenerationJob.update({ where: { id: jobId }, data: { status: 'FAILED', error: (err as Error).message.slice(0, 1000) } }).catch(() => undefined);
  } finally {
    running.delete(jobId);
  }
}

export const CourseGenerationService = {
  /** Inicia (ou retorna, se a chave de idempotência já existir) um job de geração. */
  async start(params: CourseGenerationInput, userId: string, opts: { wait?: boolean } = {}) {
    const existing = await prisma.courseGenerationJob.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) return existing;
    const { idempotencyKey, ...rest } = params;
    const job = await prisma.courseGenerationJob.create({
      data: { idempotencyKey, createdById: userId, params: { ...rest, idempotencyKey } as Prisma.InputJsonValue, status: 'PENDING' },
    });
    const promise = run(job.id, userId);
    if (opts.wait) await promise;
    return prisma.courseGenerationJob.findUniqueOrThrow({ where: { id: job.id } });
  },

  async retry(jobId: string, userId: string, opts: { wait?: boolean } = {}) {
    const job = await prisma.courseGenerationJob.findUnique({ where: { id: jobId } });
    if (!job) throw notFound('Geração não encontrada');
    if (job.status === 'FAILED' || job.status === 'PENDING') {
      const promise = run(job.id, userId);
      if (opts.wait) await promise;
    }
    return prisma.courseGenerationJob.findUniqueOrThrow({ where: { id: jobId } });
  },

  /** Gera um módulo adicional (com aulas, atividade e avaliação) no rascunho de um curso existente. */
  async generateModule(courseId: string, data: { title: string; description: string; objectives: string[]; lessonCount: number }, userId: string) {
    const draft = await requireDraftVersion(courseId);
    const version = await prisma.courseVersion.findUniqueOrThrow({ where: { id: draft.id }, include: { competencies: { include: { competency: true } }, modules: true } });
    const competencies = version.competencies.map((c) => ({ key: c.competency.key, name: c.competency.name, description: c.competency.description }));
    const comps = new Map(version.competencies.map((c) => [c.competency.key, c.competency.id]));
    const input: ModuleContentInput = {
      params: {
        topic: version.title,
        targetAudience: version.targetAudience || 'Profissionais de RH',
        professionalContext: 'Recrutamento e seleção',
        expectedLevel: version.difficulty,
        methodology: 'ADDIE com feedback socrático',
        additionalInstructions: '',
      },
      courseTitle: version.title,
      competencies: competencies.length ? competencies : [{ key: 'geral', name: 'Geral', description: '' }],
      module: {
        title: data.title,
        description: data.description,
        objectives: data.objectives,
        lessonTitles: Array.from({ length: data.lessonCount }, (_, i) => (i === 0 ? `Fundamentos: ${data.title}` : `Aplicação prática ${i}: ${data.title}`)),
      },
      moduleIndex: version.modules.length,
      totalModules: version.modules.length + 1,
      minutesPerLesson: 20,
      includeActivity: true,
    };
    const { system, prompt } = moduleContentPrompt(input);
    const res = await ai.generateStructured({ operation: 'module_content', system, prompt, schema: moduleContentSchema, input, maxTokens: 12000 }, { userId });
    return prisma.$transaction(
      async (tx) => {
        const order = (version.modules.reduce((m, x) => Math.max(m, x.order), 0) ?? 0) + 1;
        const created = await tx.module.create({ data: { courseVersionId: version.id, order, title: data.title, description: data.description, objectives: data.objectives } });
        for (const [i, l] of res.data.lessons.entries()) {
          await createLesson(tx, created.id, i + 1, {
            ...l,
            competencies: (l.competencyKeys ?? []).map((k) => comps.get(k)).filter((x): x is string => !!x).map((competencyId) => ({ competencyId, weight: 1 })),
            activity: l.activity ?? null,
          });
        }
        if (res.data.quiz?.questions.length) {
          await upsertAssessment(tx, version.id, {
            kind: 'MODULE_QUIZ',
            moduleId: created.id,
            title: `Avaliação do módulo: ${data.title}`,
            passingScore: 60,
            maxAttempts: 3,
            questions: res.data.quiz.questions.map((q) => toQuestionData(q, comps)),
          });
        }
        return created;
      },
      { timeout: 60_000 },
    );
  },

  /** Retoma jobs interrompidos por reinício do servidor. */
  async resumeInterrupted() {
    const jobs = await prisma.courseGenerationJob.findMany({ where: { status: 'RUNNING' } });
    for (const j of jobs) void run(j.id, j.createdById);
  },
};
