import type { ActivityType, AssessmentKind, DiagnosticDimension, Difficulty, QuestionType } from '@impulso/shared';

/** Formato declarativo do conteúdo educacional usado pelo seed. */

export interface SeedCompetency {
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface SeedOption {
  label: string;
  isCorrect?: boolean;
  /** Pontuação parcial 0–100 (opcional). Usada em cenários e questões autodeclaradas. */
  score?: number;
  feedback?: string;
}

export interface SeedQuestion {
  type: QuestionType;
  prompt: string;
  helpText?: string;
  dimension?: DiagnosticDimension;
  competencyKey?: string;
  points?: number;
  /** false = não compõe nota (ex.: perguntas abertas de contexto profissional). */
  isScored?: boolean;
  /** true = autopercepção (Likert/frequência). Compõe a nota autodeclarada, nunca a objetiva. */
  selfReported?: boolean;
  explanation?: string;
  likertLabels?: string[];
  options?: SeedOption[];
}

export interface SeedAssessment {
  kind: AssessmentKind;
  title: string;
  description: string;
  passingScore?: number;
  maxAttempts?: number;
  questions: SeedQuestion[];
}

export interface SeedRubricCriterion {
  key: string;
  name: string;
  description: string;
  weight: number;
  maxScore?: number;
  indicators: string[];
}

export interface SeedActivity {
  type: ActivityType;
  title: string;
  instructions: string;
  scenario: string;
  /** Passos guiados exibidos para níveis 1–2. */
  guidedSteps: string[];
  /** Desafio extra exibido para níveis 3–4. */
  advancedChallenge?: string;
  socraticQuestions: string[];
  /** Pistas progressivas (da mais sutil à mais direta). */
  hints: string[];
  /** Solução comentada — só revelada após tentativas ou na consolidação. */
  modelAnswer: string;
  maxAttempts?: number;
  passingScore?: number;
  rubric: { title: string; description: string; criteria: SeedRubricCriterion[] };
  /** Palavras/expressões que indicam boa resposta (usadas pelo provedor demonstrativo e por fallback). */
  expectedKeywords?: string[];
}

export interface SeedLesson {
  title: string;
  summary: string;
  estimatedMinutes: number;
  learnContent: string;
  /** Explicação introdutória extra para níveis 1–2. */
  beginnerSupport?: string;
  /** Aprofundamento para níveis 3–4. */
  advancedDeepDive?: string;
  contextContent: string;
  videoUrl?: string;
  resources?: { label: string; url: string }[];
  reflectionPrompt: string;
  keyTakeaways: string[];
  competencies: { key: string; weight: number }[];
  activity?: SeedActivity;
}

export interface SeedModule {
  title: string;
  description: string;
  objectives: string[];
  lessons: SeedLesson[];
  quiz?: SeedAssessment;
}

export interface SeedCourse {
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  prerequisites: string;
  difficulty: Difficulty;
  estimatedHours: number;
  coverColor: string;
  competencyKeys: string[];
  addieNotes: {
    analysis: string;
    design: string;
    development: string;
    implementation: string;
    evaluation: string;
  };
  diagnostic: SeedAssessment;
  modules: SeedModule[];
  finalAssessment: SeedAssessment;
  satisfaction: SeedAssessment;
}

export interface SeedAchievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  competencyKey?: string;
  /** Regra determinística avaliada pelo AchievementService. */
  criteria:
    | { type: 'first_lesson' }
    | { type: 'diagnostic_done' }
    | { type: 'module_completed'; moduleOrder: number }
    | { type: 'competency_score'; minScore: number }
    | { type: 'course_completed' }
    | { type: 'revision_improved'; minDelta: number };
}
