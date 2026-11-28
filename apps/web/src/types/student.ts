import type { LessonStage } from '@impulso/shared';

export interface NextStep {
  type: 'DIAGNOSTIC' | 'LESSON' | 'MODULE_QUIZ' | 'FINAL' | 'SATISFACTION';
  title: string;
  moduleTitle?: string;
  path: string;
}

export interface DashboardCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  description: string;
  coverColor: string;
  difficulty: string;
  estimatedHours: number;
  versionNumber: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  dueDate: string | null;
  initialLevel: number | null;
  currentLevel: number | null;
  initialScore: number | null;
  duringScore: number | null;
  finalScore: number | null;
  lessonsDone: number;
  totalLessons: number;
  certificateCode: string | null;
  next: NextStep | null;
}

export interface StudentCompetency {
  id: string;
  name: string;
  description: string;
  category: string;
  score: number;
  initialScore: number | null;
  evidenceCount: number;
  achievement: Achievement | null;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  awardedAt?: string;
}

export interface HistoryEvent {
  type: string;
  title: string;
  course: string | null;
  courseId: string | null;
  at: string;
  score: number | null;
}

export interface Dashboard {
  user: { name: string; firstName: string; jobTitle: string | null; knowledgeLevel: number | null; levelLabel: string };
  overallProgress: number;
  continueLearning: (Partial<NextStep> & { courseId: string; courseTitle: string; path: string; title: string; progressPercent: number }) | null;
  courses: { inProgress: DashboardCourse[]; available: DashboardCourse[]; completed: DashboardCourse[] };
  remainingMinutes: number;
  competencies: StudentCompetency[];
  achievements: { earned: Achievement[]; total: number };
  assessmentPerformance: { id: string; title: string; kind: string; score: number | null; objectiveScore: number | null; passed: boolean | null; passingScore: number; submittedAt: string }[];
  recentHistory: HistoryEvent[];
}

export interface PathItem {
  moduleId: string;
  title: string;
  order: number;
  emphasis: 'REFORCO' | 'PADRAO' | 'REVISAO_RAPIDA';
  reason: string;
  competencyScore: number | null;
}

export interface LearningProfile {
  level: number;
  levelLabel: string;
  rationale: string[];
  knowledgeIdentified: { id: string; name: string; score: number }[];
  gaps: { id: string; name: string; score: number }[];
  competenciesToDevelop: { id: string; name: string; score: number | null }[];
  recommendations: string[];
  path: PathItem[];
}

export interface Presentation {
  showBeginnerSupport: boolean;
  showAdvancedDeepDive: boolean;
  showGuidedSteps: boolean;
  showAdvancedChallenge: boolean;
  languageLevel: string;
  explanation: string;
}

export interface CourseOverview {
  enrollment: {
    id: string;
    status: string;
    progressPercent: number;
    startDate: string;
    dueDate: string | null;
    initialLevel: number | null;
    currentLevel: number | null;
    levelLabel: string;
    initialScore: number | null;
    duringScore: number | null;
    finalScore: number | null;
    passed: boolean | null;
  };
  course: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    prerequisites: string;
    difficulty: string;
    estimatedHours: number;
    coverColor: string;
    versionNumber: number;
    competencies: { id: string; name: string; description: string }[];
  };
  diagnostic: { required: boolean; done: boolean; profile: LearningProfile | null };
  presentation: Presentation;
  progress: {
    percent: number;
    lessonsDone: number;
    totalLessons: number;
    quizzesDone: number;
    totalQuizzes: number;
    completed: boolean;
    finalUnlocked: boolean;
    unmet: string[];
  };
  next: NextStep | null;
  modules: {
    id: string;
    order: number;
    title: string;
    description: string;
    emphasis: PathItem['emphasis'];
    emphasisReason: string | null;
    completed: boolean;
    lessons: {
      id: string;
      order: number;
      title: string;
      summary: string;
      estimatedMinutes: number;
      activity: { id: string; type: string; title: string } | null;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      currentStage: LessonStage | null;
    }[];
    quiz: { id: string; title: string; passingScore: number; attempts: number; maxAttempts: number; bestScore: number | null; unlocked: boolean } | null;
  }[];
  finalAssessment: { unlocked: boolean; passed: boolean } | null;
  satisfaction: { available: boolean; done: boolean };
}

export interface CriterionScore {
  id: string;
  criterionId: string;
  score: number;
  justification: string;
  criterion: { id: string; key: string; name: string; weight: number };
}

export interface Evaluation {
  id: string;
  source: 'AI' | 'DEMO' | 'FALLBACK' | 'HUMAN';
  weightedScore: number;
  masteryLevel: string;
  strengths: string[];
  improvements: string[];
  socraticQuestion: string;
  hint: string;
  recommendedAction: string;
  requiresHumanReview: boolean;
  reviewNote?: string | null;
  scores?: CriterionScore[];
  createdAt: string;
}

export interface Submission {
  id: string;
  attemptNumber: number;
  content: string;
  isRevision: boolean;
  status: string;
  createdAt: string;
  evaluation: Evaluation | null;
}

export interface Consolidation {
  summary: string;
  learned: string[];
  improvementPoints: string[];
  nextSteps: string[];
  reflectionFeedback?: string | null;
  fallback?: boolean;
}

export interface LessonView {
  enrollmentId: string;
  level: number;
  levelLabel: string;
  presentation: Presentation;
  module: { id: string; title: string; order: number; hasQuiz: boolean };
  lesson: {
    id: string;
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
    competencies: { id: string; name: string }[];
  };
  activity: {
    id: string;
    type: string;
    title: string;
    instructions: string;
    scenario: string;
    guidedSteps: string[];
    advancedChallenge: string | null;
    maxAttempts: number;
    passingScore: number;
    rubric: { title: string; criteria: { id: string; key: string; name: string; description: string; weight: number; indicators: string[] }[] } | null;
  } | null;
  submissions: Submission[];
  progress: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    currentStage: LessonStage;
    reflectionText: string | null;
    personalizedExample: string | null;
    consolidation: Consolidation | null;
    hintsUsed: number;
    solutionRevealed: boolean;
    completedAt: string | null;
  };
  navigation: {
    previous: { id: string; moduleId: string; title: string } | null;
    next: { id: string; moduleId: string; title: string } | null;
    position: number;
    total: number;
  };
}

export interface TutorMessage {
  id: string;
  role: 'STUDENT' | 'TUTOR' | 'SYSTEM';
  kind: 'MESSAGE' | 'SUBMISSION' | 'SOCRATIC_FEEDBACK' | 'HINT' | 'SOLUTION' | 'CONSOLIDATION' | 'NOTICE';
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface TutorState {
  conversationId: string;
  attemptCount: number;
  maxAttempts: number;
  hintsUsed: number;
  maxHints: number;
  solutionAllowed: boolean;
  solutionRevealed: boolean;
  messagesUsed: number;
  messagesLimit: number;
  attemptsBeforeSolution: number;
}

export interface StudentQuestion {
  id: string;
  order: number;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'LIKERT' | 'TRUE_FALSE' | 'OPEN' | 'SCENARIO';
  prompt: string;
  helpText: string | null;
  dimension: string | null;
  dimensionLabel: string | null;
  competency: { id: string; name: string } | null;
  likertLabels: string[];
  options: { id: string; label: string }[];
}

export interface StudentAssessment {
  id: string;
  kind: 'DIAGNOSTIC' | 'MODULE_QUIZ' | 'FINAL' | 'SATISFACTION';
  title: string;
  description: string;
  moduleId: string | null;
  passingScore: number;
  maxAttempts: number;
  questions: StudentQuestion[];
}

export interface AttemptSummary {
  id: string;
  attemptNumber: number;
  objectiveScore: number | null;
  selfReportScore: number | null;
  overallScore: number | null;
  passed: boolean | null;
  level: number | null;
  submittedAt: string;
  result: { profile?: LearningProfile | null; perCompetency?: Record<string, number> } | null;
}

export interface AssessmentBundle {
  enrollmentId: string;
  assessment: StudentAssessment;
  access: { locked: boolean; reason: string | null; attemptsUsed: number };
  attempts: AttemptSummary[];
}

export interface AnswerInput {
  questionId: string;
  selectedOptionIds?: string[];
  likertValue?: number;
  booleanValue?: boolean;
  textAnswer?: string;
}

export interface SubmitResult {
  attempt: { id: string; attemptNumber: number; objectiveScore: number | null; selfReportScore: number | null; overallScore: number | null; passed: boolean | null; level: number | null };
  passingScore: number;
  attemptsRemaining: number;
  profile: LearningProfile | null;
  review: { questionId: string; score: number | null; isCorrect: boolean | null; correctOptionIds: string[]; explanation: string | null }[] | null;
}

export interface Certificate {
  id: string;
  code: string;
  userId: string;
  enrollmentId: string;
  studentName: string;
  courseTitle: string;
  versionNumber: number;
  finalScore: number;
  hours: number;
  issuedAt: string;
  enrollment?: { courseId: string };
}
