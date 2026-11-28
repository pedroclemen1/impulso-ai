/** Tipos das respostas da API usadas pelo painel administrativo. */
export interface Competency {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface CohortSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  enrollmentCount: number;
  averageProgress: number | null;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE';
  isDemo: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profile: { jobTitle: string | null; department: string | null; company: string | null; knowledgeLevel: number | null } | null;
  cohorts: { id: string; name: string }[];
  enrollmentCount: number;
}

export interface CourseRow {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  coverColor: string;
  generatedByAI: boolean;
  isDemo: boolean;
  updatedAt: string;
  description: string;
  difficulty?: string;
  estimatedHours?: number;
  moduleCount: number;
  publishedVersion: { id: string; versionNumber: number; publishedAt: string | null } | null;
  hasDraft: boolean;
  versionCount: number;
  enrollmentCount: number;
  averageProgress: number | null;
  completedCount: number;
}

export interface QuestionOption {
  id: string;
  order: number;
  label: string;
  isCorrect: boolean;
  score: number | null;
  feedback: string | null;
}

export interface Question {
  id: string;
  order: number;
  type: string;
  prompt: string;
  helpText: string | null;
  dimension: string | null;
  competencyId: string | null;
  points: number;
  isScored: boolean;
  selfReported: boolean;
  explanation: string | null;
  likertLabels: string[];
  options: QuestionOption[];
}

export interface Assessment {
  id: string;
  kind: 'DIAGNOSTIC' | 'MODULE_QUIZ' | 'FINAL' | 'SATISFACTION';
  moduleId: string | null;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

export interface RubricCriterion {
  id: string;
  key: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  indicators: string[];
  order: number;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  instructions: string;
  scenario: string;
  guidedSteps: string[];
  advancedChallenge: string | null;
  socraticQuestions: string[];
  hints: string[];
  modelAnswer: string;
  expectedKeywords: string[];
  maxAttempts: number;
  passingScore: number;
  rubric: { id: string; title: string; description: string; criteria: RubricCriterion[] } | null;
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  learnContent: string;
  beginnerSupport: string | null;
  advancedDeepDive: string | null;
  contextContent: string;
  videoUrl: string | null;
  resources: { label: string; url: string }[];
  reflectionPrompt: string;
  keyTakeaways: string[];
  competencies: { competencyId: string; weight: number; competency: Competency }[];
  activity: Activity | null;
}

export interface Module {
  id: string;
  order: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: Lesson[];
}

export interface VersionTree {
  id: string;
  courseId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  prerequisites: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedHours: number;
  coverImageUrl: string | null;
  completionCriteria: {
    minLessonCompletion?: number;
    requireModuleQuizzes?: boolean;
    requireFinalAssessment?: boolean;
    finalAssessmentPassingScore?: number;
  };
  addieNotes: Partial<Record<'analysis' | 'design' | 'development' | 'implementation' | 'evaluation', string>>;
  publishedAt: string | null;
  competencies: { competencyId: string; competency: Competency }[];
  modules: Module[];
  assessments: Assessment[];
}

export interface CourseDetail {
  course: { id: string; title: string; slug: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; coverColor: string; generatedByAI: boolean; latestPublishedVersionId: string | null };
  versions: { id: string; versionNumber: number; status: string; publishedAt: string | null; createdAt: string; enrollmentCount: number }[];
  version: VersionTree;
  editable: boolean;
  publishIssues: string[];
}

export interface FilterOptions {
  courses: { id: string; title: string }[];
  cohorts: { id: string; name: string }[];
  participants: { id: string; name: string }[];
}

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  courseId?: string;
  cohortId?: string;
  userId?: string;
}

export interface Kpis {
  totalParticipants: number;
  activeParticipants: number;
  coursesInProgress: number;
  enrollments: number;
  completionRate: number | null;
  activationRate: number | null;
  participationRate: number | null;
  averageDiagnostic: number | null;
  averageDuring: number | null;
  averageFinal: number | null;
  knowledgeGain: number | null;
  normalizedGain: number | null;
  comparableParticipants: number;
  feedbackImprovement: number | null;
  feedbackImprovementSample: number;
  approvalRate: number | null;
  averageLearningMinutes: number | null;
  totalLearningHours: number;
  totalActivities: number;
  tutorInteractions: number;
  lessonsCompleted: number;
  satisfaction: number | null;
  satisfactionResponses: number;
  applicability: number | null;
  applicabilityResponses: number;
  publishedCourses?: number;
}

export interface Charts {
  learningEvolution: { moment: string; score: number | null }[];
  levelDistribution: { level: number; label: string; initial: number; current: number }[];
  progressByCourse: { courseId: string; course: string; averageProgress: number | null; enrollments: number; completed: number }[];
  competencyPerformance: { competency: string; initial: number | null; current: number | null; participants: number }[];
  scoreDistribution: { range: string; finalAssessment: number; activities: number }[];
  participationOverTime: { date: string; activeParticipants: number; submissions: number; tutorInteractions: number; lessonsCompleted: number }[];
  topDifficulties: {
    weakestCriteria: { criterion: string; average: number | null; evaluations: number }[];
    frequentImprovements: { text: string; count: number }[];
  };
}

export type KpiDefinitions = Record<string, { label: string; definition: string; nature: string }>;

export interface Overview {
  filters: AnalyticsFilters;
  kpis: Kpis;
  charts: Charts;
  hasData: boolean;
  definitions: KpiDefinitions;
}

export interface EnrollmentRow {
  id: string;
  userId: string;
  courseId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  startDate: string;
  dueDate: string | null;
  completedAt: string | null;
  initialLevel: number | null;
  currentLevel: number | null;
  initialScore: number | null;
  finalScore: number | null;
  user: { id: string; name: string; email: string; profile: { jobTitle: string | null; department: string | null } | null };
  course: { id: string; title: string; coverColor: string };
  courseVersion: { id: string; versionNumber: number };
  cohort: { id: string; name: string } | null;
}

export interface EvaluationRecord {
  id: string;
  source: 'AI' | 'DEMO' | 'FALLBACK' | 'HUMAN';
  provider: string | null;
  model: string | null;
  weightedScore: number;
  masteryLevel: string;
  strengths: string[];
  improvements: string[];
  socraticQuestion: string;
  hint: string;
  recommendedAction: string;
  requiresHumanReview: boolean;
  isCurrent: boolean;
  reviewNote: string | null;
  createdAt: string;
  reviewedBy?: { id?: string; name: string } | null;
  scores?: { id: string; criterionId: string; score: number; justification: string; criterion: { id: string; name: string; key?: string } }[];
}
