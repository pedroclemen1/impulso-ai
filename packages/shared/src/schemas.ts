import { z } from 'zod';
import { ACTIVITY_TYPES, AI_PROVIDERS, ASSESSMENT_KINDS, DIFFICULTIES, LESSON_STAGES, QUESTION_TYPES } from './constants';

const trimmed = (min = 1, max = 500) => z.string().trim().min(min).max(max);
const markdown = (max = 30000) => z.string().max(max);

// ─── Autenticação ───
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128)
  .regex(/[A-Za-z]/, 'Inclua ao menos uma letra')
  .regex(/[0-9]/, 'Inclua ao menos um número');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

// ─── Usuários ───
export const userCreateSchema = z.object({
  name: trimmed(2, 120),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: passwordSchema,
  role: z.enum(['SUPER_ADMIN', 'STUDENT']).default('STUDENT'),
  jobTitle: z.string().trim().max(120).optional().or(z.literal('')),
  department: z.string().trim().max(120).optional().or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  cohortIds: z.array(z.string().uuid()).optional(),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: trimmed(2, 120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'STUDENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: passwordSchema.optional().or(z.literal('')),
  jobTitle: z.string().trim().max(120).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  cohortIds: z.array(z.string().uuid()).optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const profileUpdateSchema = z.object({
  name: trimmed(2, 120).optional(),
  jobTitle: z.string().trim().max(120).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  professionalContext: z.string().trim().max(2000).optional().nullable(),
  learningGoals: z.string().trim().max(2000).optional().nullable(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ─── Turmas ───
export const cohortSchema = z.object({
  name: trimmed(2, 120),
  description: z.string().trim().max(1000).optional().default(''),
  memberIds: z.array(z.string().uuid()).optional(),
});
export type CohortInput = z.infer<typeof cohortSchema>;

// ─── Alocações ───
export const enrollmentCreateSchema = z
  .object({
    courseId: z.string().uuid(),
    userIds: z.array(z.string().uuid()).default([]),
    cohortId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional().nullable(),
  })
  .refine((v) => v.userIds.length > 0 || !!v.cohortId, {
    message: 'Selecione ao menos um participante ou uma turma',
  });
export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;

// ─── Cursos ───
export const completionCriteriaSchema = z.object({
  minLessonCompletion: z.number().min(0).max(100).default(100),
  requireModuleQuizzes: z.boolean().default(true),
  requireFinalAssessment: z.boolean().default(true),
  finalAssessmentPassingScore: z.number().min(0).max(100).default(70),
});
export type CompletionCriteria = z.infer<typeof completionCriteriaSchema>;

export const courseMetaSchema = z.object({
  title: trimmed(3, 200),
  description: trimmed(10, 5000),
  objectives: z.array(trimmed(3, 500)).max(20).default([]),
  targetAudience: z.string().trim().max(1000).default(''),
  prerequisites: z.string().trim().max(1000).default(''),
  difficulty: z.enum(DIFFICULTIES).default('BEGINNER'),
  estimatedHours: z.number().min(0.25).max(500).default(1),
  coverColor: z.string().trim().max(30).optional(),
  coverImageUrl: z.string().url().max(1000).optional().nullable().or(z.literal('')),
  competencyIds: z.array(z.string().uuid()).default([]),
  completionCriteria: completionCriteriaSchema.optional(),
});
export type CourseMetaInput = z.infer<typeof courseMetaSchema>;

export const moduleSchema = z.object({
  title: trimmed(2, 200),
  description: z.string().max(5000).default(''),
  objectives: z.array(trimmed(2, 500)).max(20).default([]),
});
export type ModuleInput = z.infer<typeof moduleSchema>;

export const resourceSchema = z.object({ label: trimmed(1, 200), url: z.string().url().max(1000) });

export const lessonSchema = z.object({
  title: trimmed(2, 200),
  summary: z.string().max(2000).default(''),
  estimatedMinutes: z.number().int().min(1).max(600).default(15),
  learnContent: markdown(),
  beginnerSupport: markdown().optional().nullable(),
  advancedDeepDive: markdown().optional().nullable(),
  contextContent: markdown().default(''),
  videoUrl: z.string().url().max(1000).optional().nullable().or(z.literal('')),
  resources: z.array(resourceSchema).max(20).default([]),
  reflectionPrompt: z.string().max(2000).default(''),
  keyTakeaways: z.array(trimmed(2, 500)).max(20).default([]),
  competencies: z.array(z.object({ competencyId: z.string().uuid(), weight: z.number().min(0.1).max(10) })).default([]),
});
export type LessonInput = z.infer<typeof lessonSchema>;

export const rubricCriterionSchema = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e _'),
  name: trimmed(2, 120),
  description: z.string().max(2000).default(''),
  weight: z.number().min(0.1).max(10),
  maxScore: z.number().min(1).max(100).default(100),
  indicators: z.array(trimmed(2, 500)).max(10).default([]),
});
export type RubricCriterionInput = z.infer<typeof rubricCriterionSchema>;

export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES).default('OPEN_RESPONSE'),
  title: trimmed(2, 200),
  instructions: markdown(10000).refine((s) => s.trim().length >= 5, 'Descreva a atividade'),
  scenario: markdown(10000).default(''),
  guidedSteps: z.array(trimmed(2, 500)).max(10).default([]),
  advancedChallenge: markdown(5000).optional().nullable(),
  socraticQuestions: z.array(trimmed(2, 500)).max(10).default([]),
  hints: z.array(trimmed(2, 1000)).max(5).default([]),
  modelAnswer: markdown(10000).default(''),
  expectedKeywords: z.array(z.string().trim().min(2).max(60)).max(30).default([]),
  maxAttempts: z.number().int().min(1).max(10).default(4),
  passingScore: z.number().min(0).max(100).default(70),
  rubric: z.object({
    title: trimmed(2, 200),
    description: z.string().max(2000).default(''),
    criteria: z.array(rubricCriterionSchema).min(1).max(10),
  }),
});
export type ActivityInput = z.infer<typeof activitySchema>;

export const questionOptionSchema = z.object({
  label: trimmed(1, 1000),
  isCorrect: z.boolean().default(false),
  score: z.number().min(0).max(100).optional().nullable(),
  feedback: z.string().max(1000).optional().nullable(),
});

export const questionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  prompt: trimmed(3, 5000),
  helpText: z.string().max(1000).optional().nullable(),
  dimension: z.string().max(60).optional().nullable(),
  competencyId: z.string().uuid().optional().nullable(),
  points: z.number().min(0).max(100).default(1),
  isScored: z.boolean().default(true),
  selfReported: z.boolean().default(false),
  explanation: z.string().max(3000).optional().nullable(),
  likertLabels: z.array(z.string().max(60)).max(5).default([]),
  options: z.array(questionOptionSchema).max(10).default([]),
});
export type QuestionInput = z.infer<typeof questionSchema>;

export const assessmentSchema = z.object({
  kind: z.enum(ASSESSMENT_KINDS),
  moduleId: z.string().uuid().optional().nullable(),
  title: trimmed(2, 200),
  description: z.string().max(3000).default(''),
  passingScore: z.number().min(0).max(100).default(70),
  maxAttempts: z.number().int().min(1).max(20).default(3),
  questions: z.array(questionSchema).max(60).default([]),
});
export type AssessmentInput = z.infer<typeof assessmentSchema>;

export const reorderSchema = z.object({ orderedIds: z.array(z.string().uuid()).min(1) });

// ─── Gerador de cursos com IA ───
export const courseGenerationSchema = z.object({
  topic: trimmed(3, 300),
  targetAudience: trimmed(3, 500),
  objectives: trimmed(3, 2000),
  expectedLevel: z.enum(DIFFICULTIES).default('BEGINNER'),
  workloadHours: z.number().min(1).max(80).default(6),
  moduleCount: z.number().int().min(1).max(10).default(4),
  professionalContext: z.string().trim().max(2000).default('Recrutamento e seleção'),
  competencies: z.string().trim().max(1000).default(''),
  methodology: z.string().trim().max(1000).default('ADDIE com feedback socrático e aprendizagem baseada em problemas'),
  additionalInstructions: z.string().trim().max(2000).default(''),
  idempotencyKey: z.string().trim().min(8).max(100),
});
export type CourseGenerationInput = z.infer<typeof courseGenerationSchema>;

// ─── Aprendizagem ───
export const assessmentAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).max(10).optional(),
  likertValue: z.number().int().min(1).max(5).optional(),
  booleanValue: z.boolean().optional(),
  textAnswer: z.string().max(5000).optional(),
});
export const assessmentSubmitSchema = z.object({ answers: z.array(assessmentAnswerSchema).max(100) });
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>;

export const submissionSchema = z.object({
  content: z.string().trim().min(10, 'Desenvolva um pouco mais a sua resposta (mínimo de 10 caracteres)').max(8000),
});
export const tutorMessageSchema = z.object({ content: z.string().trim().min(1).max(3000) });
export const stageUpdateSchema = z.object({ stage: z.enum(LESSON_STAGES) });
export const consolidateSchema = z.object({ reflection: z.string().trim().min(10, 'Escreva sua reflexão (mínimo de 10 caracteres)').max(3000) });

export const evaluationReviewSchema = z.object({
  scores: z.array(z.object({ criterionId: z.string().uuid(), score: z.number().min(0).max(100), justification: z.string().max(2000).default('') })).min(1),
  reviewNote: trimmed(3, 2000),
  strengths: z.array(z.string().max(500)).max(10).optional(),
  improvements: z.array(z.string().max(500)).max(10).optional(),
});
export type EvaluationReviewInput = z.infer<typeof evaluationReviewSchema>;

// ─── Competências ───
export const competencySchema = z.object({
  key: z.string().trim().min(2).max(60).regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e _'),
  name: trimmed(2, 120),
  description: z.string().max(2000).default(''),
  category: z.string().trim().max(60).default('Geral'),
});
export type CompetencyInput = z.infer<typeof competencySchema>;

// ─── Configurações de IA ───
export const aiSettingsSchema = z.object({
  activeProvider: z.enum(AI_PROVIDERS),
  model: z.string().trim().max(120).optional().nullable(),
  temperature: z.number().min(0).max(1.5),
  maxOutputTokens: z.number().int().min(256).max(16000),
  tutorAttemptsBeforeSolution: z.number().int().min(1).max(10),
  tutorMaxHints: z.number().int().min(1).max(5),
  tutorMaxMessagesPerLesson: z.number().int().min(5).max(200),
  tutorTone: z.string().trim().max(200),
  tutorExtraInstructions: z.string().max(3000),
  humanReviewBelowScore: z.number().min(0).max(100),
  monthlyBudgetUsd: z.number().min(0).max(100000).optional().nullable(),
});
export type AISettingsInput = z.infer<typeof aiSettingsSchema>;

// ─── Filtros de analytics ───
export const analyticsFilterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  courseId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});
export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  sort: z.string().trim().max(60).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type PaginationQuery = z.infer<typeof paginationSchema>;
