import type { ActivityType, AssessmentKind, Prisma, QuestionType } from '@prisma/client';
import type { Tx } from '../../database/prisma';

/** Formatos neutros usados pelo editor, pelo gerador com IA e pelo seed para gravar conteúdo. */

export interface QuestionData {
  type: QuestionType;
  prompt: string;
  helpText?: string | null;
  dimension?: string | null;
  competencyId?: string | null;
  points?: number;
  isScored?: boolean;
  selfReported?: boolean;
  explanation?: string | null;
  likertLabels?: string[];
  options?: { label: string; isCorrect?: boolean; score?: number | null; feedback?: string | null }[];
}

export interface AssessmentData {
  kind: AssessmentKind;
  moduleId?: string | null;
  title: string;
  description?: string;
  passingScore?: number;
  maxAttempts?: number;
  questions: QuestionData[];
}

export interface ActivityData {
  type: ActivityType;
  title: string;
  instructions: string;
  scenario?: string;
  guidedSteps?: string[];
  advancedChallenge?: string | null;
  socraticQuestions?: string[];
  hints?: string[];
  modelAnswer?: string;
  expectedKeywords?: string[];
  maxAttempts?: number;
  passingScore?: number;
  rubric: {
    title: string;
    description?: string;
    criteria: { key: string; name: string; description?: string; weight: number; maxScore?: number; indicators?: string[] }[];
  };
}

export interface LessonData {
  title: string;
  summary?: string;
  estimatedMinutes?: number;
  learnContent: string;
  beginnerSupport?: string | null;
  advancedDeepDive?: string | null;
  contextContent?: string;
  videoUrl?: string | null;
  resources?: { label: string; url: string }[];
  reflectionPrompt?: string;
  keyTakeaways?: string[];
  competencies?: { competencyId: string; weight: number }[];
  activity?: ActivityData | null;
}

const normalizeQuestion = (q: QuestionData): QuestionData => {
  if (q.type === 'TRUE_FALSE' && (!q.options || q.options.length !== 2)) {
    const correctIsTrue = q.options?.find((o) => o.isCorrect)?.label?.toLowerCase().startsWith('verd') ?? true;
    return { ...q, options: [{ label: 'Verdadeiro', isCorrect: correctIsTrue }, { label: 'Falso', isCorrect: !correctIsTrue }] };
  }
  if (q.type === 'LIKERT' || q.type === 'OPEN') return { ...q, options: [] };
  return q;
};

export async function createQuestions(tx: Tx, assessmentId: string, questions: QuestionData[]) {
  for (const [i, raw] of questions.entries()) {
    const q = normalizeQuestion(raw);
    await tx.question.create({
      data: {
        assessmentId,
        order: i + 1,
        type: q.type,
        prompt: q.prompt,
        helpText: q.helpText ?? null,
        dimension: q.dimension ?? null,
        competencyId: q.competencyId ?? null,
        points: q.points ?? 1,
        isScored: q.isScored ?? q.type !== 'OPEN',
        selfReported: q.selfReported ?? false,
        explanation: q.explanation ?? null,
        likertLabels: q.likertLabels ?? [],
        options: {
          create: (q.options ?? []).map((o, j) => ({
            order: j + 1,
            label: o.label,
            isCorrect: o.isCorrect ?? false,
            score: o.score ?? null,
            feedback: o.feedback ?? null,
          })),
        },
      },
    });
  }
}

/** Cria ou substitui uma avaliação (por tipo e módulo) dentro de uma versão em rascunho. */
export async function upsertAssessment(tx: Tx, courseVersionId: string, data: AssessmentData) {
  const existing = await tx.assessment.findFirst({
    where: { courseVersionId, kind: data.kind, moduleId: data.kind === 'MODULE_QUIZ' ? data.moduleId ?? null : null },
  });
  const fields = {
    title: data.title,
    description: data.description ?? '',
    passingScore: data.passingScore ?? 70,
    maxAttempts: data.maxAttempts ?? (data.kind === 'DIAGNOSTIC' || data.kind === 'SATISFACTION' ? 1 : 3),
  };
  let assessmentId: string;
  if (existing) {
    await tx.question.deleteMany({ where: { assessmentId: existing.id } });
    await tx.assessment.update({ where: { id: existing.id }, data: fields });
    assessmentId = existing.id;
  } else {
    const created = await tx.assessment.create({
      data: { ...fields, courseVersionId, kind: data.kind, moduleId: data.kind === 'MODULE_QUIZ' ? data.moduleId ?? null : null },
    });
    assessmentId = created.id;
  }
  await createQuestions(tx, assessmentId, data.questions);
  return assessmentId;
}

export async function writeActivity(tx: Tx, lessonId: string, a: ActivityData) {
  await tx.activity.deleteMany({ where: { lessonId } });
  return tx.activity.create({
    data: {
      lessonId,
      type: a.type,
      title: a.title,
      instructions: a.instructions,
      scenario: a.scenario ?? '',
      guidedSteps: a.guidedSteps ?? [],
      advancedChallenge: a.advancedChallenge ?? null,
      socraticQuestions: a.socraticQuestions ?? [],
      hints: a.hints ?? [],
      modelAnswer: a.modelAnswer ?? '',
      expectedKeywords: a.expectedKeywords ?? [],
      maxAttempts: a.maxAttempts ?? 4,
      passingScore: a.passingScore ?? 70,
      rubric: {
        create: {
          title: a.rubric.title,
          description: a.rubric.description ?? '',
          criteria: {
            create: dedupeKeys(a.rubric.criteria).map((c, i) => ({
              key: c.key,
              name: c.name,
              description: c.description ?? '',
              weight: c.weight,
              maxScore: c.maxScore ?? 100,
              indicators: c.indicators ?? [],
              order: i + 1,
            })),
          },
        },
      },
    },
  });
}

function dedupeKeys<T extends { key: string }>(items: T[]): T[] {
  const seen = new Map<string, number>();
  return items.map((c) => {
    const n = seen.get(c.key) ?? 0;
    seen.set(c.key, n + 1);
    return n ? { ...c, key: `${c.key}_${n + 1}` } : c;
  });
}

const lessonFields = (l: LessonData) => ({
  title: l.title,
  summary: l.summary ?? '',
  estimatedMinutes: l.estimatedMinutes ?? 15,
  learnContent: l.learnContent,
  beginnerSupport: l.beginnerSupport || null,
  advancedDeepDive: l.advancedDeepDive || null,
  contextContent: l.contextContent ?? '',
  videoUrl: l.videoUrl || null,
  resources: (l.resources ?? []) as Prisma.InputJsonValue,
  reflectionPrompt: l.reflectionPrompt ?? '',
  keyTakeaways: l.keyTakeaways ?? [],
});

export async function createLesson(tx: Tx, moduleId: string, order: number, l: LessonData) {
  const lesson = await tx.lesson.create({
    data: {
      moduleId,
      order,
      ...lessonFields(l),
      competencies: { create: dedupeCompetencies(l.competencies ?? []).map((c) => ({ competencyId: c.competencyId, weight: c.weight })) },
    },
  });
  if (l.activity) await writeActivity(tx, lesson.id, l.activity);
  return lesson;
}

export async function updateLesson(tx: Tx, lessonId: string, l: LessonData) {
  await tx.lessonCompetency.deleteMany({ where: { lessonId } });
  return tx.lesson.update({
    where: { id: lessonId },
    data: {
      ...lessonFields(l),
      competencies: { create: dedupeCompetencies(l.competencies ?? []).map((c) => ({ competencyId: c.competencyId, weight: c.weight })) },
    },
  });
}

function dedupeCompetencies(items: { competencyId: string; weight: number }[]) {
  const m = new Map<string, number>();
  for (const c of items) m.set(c.competencyId, c.weight);
  return [...m.entries()].map(([competencyId, weight]) => ({ competencyId, weight }));
}
