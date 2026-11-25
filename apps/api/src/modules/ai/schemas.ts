import { ACTIVITY_TYPES, DIFFICULTIES, MASTERY_LEVELS, QUESTION_TYPES } from '@impulso/shared';
import { z } from 'zod';

const str = (max = 20000) => z.string().max(max);
const list = (max = 10, itemMax = 600) => z.array(z.string().max(itemMax)).max(max).default([]);

// ─── Avaliação de atividades (seção 15) ───
export const evaluationOutputSchema = z.object({
  scores: z
    .array(
      z.object({
        criterionId: z.string().min(1).max(60),
        score: z.number().min(0).max(100),
        justification: str(1500).default(''),
      }),
    )
    .min(1)
    .max(12),
  strengths: list(6),
  improvements: list(6),
  socraticQuestion: str(800).default(''),
  hint: str(800).default(''),
  masteryLevel: z.enum(MASTERY_LEVELS).catch('EM_DESENVOLVIMENTO'),
  recommendedAction: str(600).default(''),
  requiresHumanReview: z.boolean().default(false),
});
export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>;

// ─── Geração de cursos (seção 18) ───
export const generatedCompetencySchema = z.object({
  key: z
    .string()
    .max(60)
    .transform((s) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 60) || 'competencia',
    ),
  name: str(120),
  description: str(600).default(''),
});

export const courseOutlineSchema = z.object({
  title: str(200).min(3),
  description: str(3000).min(10),
  objectives: z.array(str(400)).min(1).max(12),
  targetAudience: str(800).default(''),
  prerequisites: str(800).default(''),
  difficulty: z.enum(DIFFICULTIES).catch('BEGINNER'),
  competencies: z.array(generatedCompetencySchema).min(1).max(8),
  modules: z
    .array(
      z.object({
        title: str(200).min(2),
        description: str(1500).default(''),
        objectives: z.array(str(400)).max(8).default([]),
        lessonTitles: z.array(str(200)).min(1).max(6),
      }),
    )
    .min(1)
    .max(10),
  completionCriteria: z
    .object({
      finalAssessmentPassingScore: z.number().min(0).max(100).catch(70),
      requireModuleQuizzes: z.boolean().catch(true),
    })
    .partial()
    .default({}),
  addieNotes: z
    .object({
      analysis: str(1500).default(''),
      design: str(1500).default(''),
      development: str(1500).default(''),
      implementation: str(1500).default(''),
      evaluation: str(1500).default(''),
    })
    .default({}),
});
export type CourseOutline = z.infer<typeof courseOutlineSchema>;

export const generatedQuestionSchema = z.object({
  type: z.enum(QUESTION_TYPES).catch('SINGLE_CHOICE'),
  prompt: str(2000).min(3),
  dimension: z.string().max(40).optional().nullable(),
  competencyKey: z.string().max(60).optional().nullable(),
  selfReported: z.boolean().default(false),
  isScored: z.boolean().default(true),
  explanation: str(1500).optional().nullable(),
  likertLabels: z.array(z.string().max(60)).max(5).default([]),
  options: z
    .array(
      z.object({
        label: str(800).min(1),
        isCorrect: z.boolean().default(false),
        score: z.number().min(0).max(100).optional().nullable(),
      }),
    )
    .max(8)
    .default([]),
});
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const generatedRubricCriterionSchema = z.object({
  key: z.string().max(60),
  name: str(120),
  description: str(600).default(''),
  weight: z.number().min(0.1).max(10).catch(1),
  indicators: z.array(str(300)).max(6).default([]),
});

export const generatedActivitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES).catch('OPEN_RESPONSE'),
  title: str(200).min(2),
  instructions: str(5000).min(5),
  scenario: str(6000).default(''),
  guidedSteps: z.array(str(400)).max(8).default([]),
  advancedChallenge: str(3000).optional().nullable(),
  socraticQuestions: z.array(str(500)).max(6).default([]),
  hints: z.array(str(800)).max(5).default([]),
  modelAnswer: str(8000).default(''),
  expectedKeywords: z.array(z.string().max(60)).max(20).default([]),
  rubric: z.object({
    title: str(200),
    description: str(800).default(''),
    criteria: z.array(generatedRubricCriterionSchema).min(1).max(8),
  }),
});

export const moduleContentSchema = z.object({
  lessons: z
    .array(
      z.object({
        title: str(200).min(2),
        summary: str(800).default(''),
        estimatedMinutes: z.number().int().min(5).max(240).catch(20),
        learnContent: str(15000).min(50),
        beginnerSupport: str(5000).optional().nullable(),
        advancedDeepDive: str(5000).optional().nullable(),
        contextContent: str(8000).default(''),
        reflectionPrompt: str(800).default(''),
        keyTakeaways: z.array(str(400)).max(8).default([]),
        competencyKeys: z.array(z.string().max(60)).max(6).default([]),
        activity: generatedActivitySchema.optional().nullable(),
      }),
    )
    .min(1)
    .max(6),
  quiz: z.object({ questions: z.array(generatedQuestionSchema).min(1).max(10) }).optional().nullable(),
});
export type ModuleContent = z.infer<typeof moduleContentSchema>;

export const courseAssessmentsSchema = z.object({
  diagnostic: z.object({ questions: z.array(generatedQuestionSchema).min(3).max(25) }),
  finalAssessment: z.object({ questions: z.array(generatedQuestionSchema).min(3).max(25) }),
});
export type CourseAssessments = z.infer<typeof courseAssessmentsSchema>;

// ─── Tutor e consolidação ───
export const consolidationSchema = z.object({
  summary: str(2000),
  learned: list(6),
  improvementPoints: list(6),
  nextSteps: list(6),
});
export type ConsolidationOutput = z.infer<typeof consolidationSchema>;

// ─── Insights pedagógicos (seção 20) ───
export const insightsSchema = z.object({
  summary: str(2500),
  strengths: list(6),
  difficulties: list(6),
  recommendations: list(6),
  dataSufficiency: z.enum(['INSUFFICIENT', 'PARTIAL', 'SUFFICIENT']).catch('PARTIAL'),
  evidence: list(8, 400),
});
export type InsightsOutput = z.infer<typeof insightsSchema>;

export const connectionTestSchema = z.object({ status: z.string().max(50), message: z.string().max(500) });
