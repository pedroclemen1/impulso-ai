/**
 * Entradas estruturadas de cada operação de IA. São usadas tanto para compor os prompts
 * quanto pelo provedor demonstrativo determinístico.
 */
import type { CourseGenerationInput } from '@impulso/shared';
import type { CourseOutline, EvaluationOutput } from './schemas';

export interface RubricCriterionContext {
  key: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  indicators: string[];
}

export interface ActivityContext {
  title: string;
  type: string;
  instructions: string;
  scenario: string;
  socraticQuestions: string[];
  hints: string[];
  modelAnswer: string;
  expectedKeywords: string[];
  passingScore: number;
}

export interface StudentContext {
  level: number;
  levelLabel: string;
  jobTitle?: string | null;
  professionalContext?: string | null;
}

export interface EvaluationInput {
  lessonTitle: string;
  lessonObjective: string;
  activity: ActivityContext;
  rubric: RubricCriterionContext[];
  submission: string;
  attemptNumber: number;
  previousSubmission?: string | null;
  student: StudentContext;
}

export interface TutorChatInput {
  lessonTitle: string;
  lessonObjective: string;
  approvedContent: string;
  activity: ActivityContext | null;
  rubric: RubricCriterionContext[];
  student: StudentContext;
  attemptCount: number;
  lastSubmission?: string | null;
  lastEvaluation?: Pick<EvaluationOutput, 'strengths' | 'improvements' | 'socraticQuestion'> & { weightedScore: number } | null;
  studentMessage: string;
  turnIndex: number;
  solutionAllowed: boolean;
  tone: string;
  extraInstructions: string;
}

export interface TutorSolutionInput {
  lessonTitle: string;
  activity: ActivityContext;
  lastSubmission?: string | null;
  student: StudentContext;
}

export interface ConsolidationInput {
  lessonTitle: string;
  keyTakeaways: string[];
  reflection: string;
  student: StudentContext;
  evaluations: { attemptNumber: number; weightedScore: number; strengths: string[]; improvements: string[] }[];
  nextLessonTitle?: string | null;
}

export interface PersonalizedExampleInput {
  lessonTitle: string;
  learnContent: string;
  contextContent: string;
  student: StudentContext;
}

export interface ReflectionFeedbackInput {
  lessonTitle: string;
  reflectionPrompt: string;
  reflection: string;
  keyTakeaways: string[];
  student: StudentContext;
}

export interface InsightsInput {
  studentName: string;
  level: number | null;
  currentLevel: number | null;
  competencies: { name: string; score: number; initialScore: number | null; evidenceCount: number }[];
  evaluations: { activity: string; attemptNumber: number; score: number; improvements: string[]; strengths: string[] }[];
  assessments: { kind: string; title: string; score: number | null }[];
  tutorInteractions: number;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface CourseOutlineInput {
  params: CourseGenerationInput;
}

export interface ModuleContentInput {
  params: Pick<CourseGenerationInput, 'topic' | 'targetAudience' | 'professionalContext' | 'expectedLevel' | 'methodology' | 'additionalInstructions'>;
  courseTitle: string;
  competencies: CourseOutline['competencies'];
  module: CourseOutline['modules'][number];
  moduleIndex: number;
  totalModules: number;
  minutesPerLesson: number;
  includeActivity: boolean;
}

export interface CourseAssessmentsInput {
  courseTitle: string;
  topic: string;
  professionalContext: string;
  competencies: CourseOutline['competencies'];
  modules: { title: string; objectives: string[] }[];
}
