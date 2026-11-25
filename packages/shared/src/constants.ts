export const ROLES = ['SUPER_ADMIN', 'STUDENT'] as const;
export type Role = (typeof ROLES)[number];

export const KNOWLEDGE_LEVELS = {
  1: { label: 'Iniciante', short: 'N1', description: 'Pouco ou nenhum contato com ferramentas de IA.' },
  2: { label: 'Familiarizado', short: 'N2', description: 'Já utilizou IA em tarefas pontuais, com conhecimento conceitual inicial.' },
  3: { label: 'Intermediário', short: 'N3', description: 'Usa IA com frequência e domina fundamentos de prompts e limitações.' },
  4: { label: 'Avançado', short: 'N4', description: 'Aplica IA criticamente em fluxos de trabalho e valida resultados.' },
} as const;
export type KnowledgeLevel = 1 | 2 | 3 | 4;

export const levelLabel = (level?: number | null): string =>
  level && level >= 1 && level <= 4 ? KNOWLEDGE_LEVELS[level as KnowledgeLevel].label : 'Não avaliado';

export const LESSON_STAGES = ['LEARN', 'CONTEXTUALIZE', 'PRACTICE', 'REFLECT', 'IMPROVE', 'CONSOLIDATE'] as const;
export type LessonStage = (typeof LESSON_STAGES)[number];
export const LESSON_STAGE_LABELS: Record<LessonStage, string> = {
  LEARN: 'Aprender',
  CONTEXTUALIZE: 'Contextualizar',
  PRACTICE: 'Praticar',
  REFLECT: 'Refletir',
  IMPROVE: 'Aprimorar',
  CONSOLIDATE: 'Consolidar',
};

export const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

export const COURSE_STATUS_LABELS = { DRAFT: 'Rascunho', PUBLISHED: 'Publicado', ARCHIVED: 'Arquivado' } as const;
export const ENROLLMENT_STATUS_LABELS = {
  NOT_STARTED: 'Não iniciado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
} as const;

export const ACTIVITY_TYPES = [
  'OPEN_RESPONSE',
  'PROMPT_EXERCISE',
  'CASE_STUDY',
  'CRITICAL_ANALYSIS',
  'WORKFLOW_DESIGN',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  OPEN_RESPONSE: 'Resposta aberta',
  PROMPT_EXERCISE: 'Engenharia de prompts',
  CASE_STUDY: 'Estudo de caso',
  CRITICAL_ANALYSIS: 'Análise crítica',
  WORKFLOW_DESIGN: 'Desenho de fluxo de trabalho',
};

export const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'LIKERT', 'TRUE_FALSE', 'OPEN', 'SCENARIO'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Múltipla escolha',
  MULTIPLE_CHOICE: 'Seleção múltipla',
  LIKERT: 'Escala Likert (1–5)',
  TRUE_FALSE: 'Verdadeiro ou falso',
  OPEN: 'Resposta aberta',
  SCENARIO: 'Cenário prático',
};

export const ASSESSMENT_KINDS = ['DIAGNOSTIC', 'MODULE_QUIZ', 'FINAL', 'SATISFACTION'] as const;
export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];
export const ASSESSMENT_KIND_LABELS: Record<AssessmentKind, string> = {
  DIAGNOSTIC: 'Diagnóstico inicial',
  MODULE_QUIZ: 'Avaliação do módulo',
  FINAL: 'Avaliação final',
  SATISFACTION: 'Pesquisa de satisfação',
};

/** Dimensões do diagnóstico inicial (seção 9 da especificação). */
export const DIAGNOSTIC_DIMENSIONS = {
  FAMILIARITY: 'Familiaridade com IA',
  FREQUENCY: 'Frequência de uso',
  LLM_KNOWLEDGE: 'Conhecimento sobre LLMs',
  PROMPTING: 'Engenharia de prompts',
  LIMITATIONS: 'Identificação de limitações',
  TOOLS: 'Experiência com ferramentas',
  RECRUITMENT_AI: 'IA em recrutamento',
  PRIVACY: 'Privacidade e dados',
  CONFIDENCE: 'Confiança no uso de IA',
  GOALS: 'Objetivos de aprendizagem',
  ACTIVITIES: 'Atividades profissionais',
  CHALLENGES: 'Dificuldades no trabalho',
} as const;
export type DiagnosticDimension = keyof typeof DIAGNOSTIC_DIMENSIONS;

export const MASTERY_LEVELS = ['INICIAL', 'EM_DESENVOLVIMENTO', 'PROFICIENTE', 'AVANCADO'] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];
export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  INICIAL: 'Inicial',
  EM_DESENVOLVIMENTO: 'Em desenvolvimento',
  PROFICIENTE: 'Proficiente',
  AVANCADO: 'Avançado',
};

export const AI_PROVIDERS = ['demo', 'openai', 'anthropic', 'gemini', 'openai_compatible', 'ollama'] as const;
export type AIProviderName = (typeof AI_PROVIDERS)[number];
export const AI_PROVIDER_LABELS: Record<AIProviderName, string> = {
  demo: 'Demonstrativo (determinístico, sem chave)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  openai_compatible: 'Compatível com OpenAI',
  ollama: 'Ollama (modelo local)',
};

/** Definições transparentes dos indicadores (seção 21). Exibidas no painel e nos relatórios. */
export const KPI_DEFINITIONS = {
  completionRate: {
    label: 'Taxa de conclusão',
    definition: 'Alocações concluídas ÷ alocações elegíveis (não canceladas).',
    nature: 'objetivo',
  },
  activationRate: {
    label: 'Taxa de ativação',
    definition: 'Participantes que iniciaram efetivamente o treinamento ÷ participantes alocados.',
    nature: 'objetivo',
  },
  knowledgeGain: {
    label: 'Evolução de conhecimento',
    definition:
      'Diferença, em pontos percentuais, entre a avaliação final e a parte objetiva do diagnóstico inicial (mesma escala 0–100 e competências comparáveis).',
    nature: 'objetivo',
  },
  normalizedGain: {
    label: 'Ganho normalizado',
    definition: '(nota final − nota inicial) ÷ (100 − nota inicial). Não calculado quando a nota inicial é 100.',
    nature: 'objetivo',
  },
  feedbackImprovement: {
    label: 'Evolução após feedback',
    definition:
      'Diferença entre a primeira tentativa e a última tentativa válida da mesma atividade. Indica progresso observado durante o ciclo de feedback socrático, sem comprovar causalidade.',
    nature: 'objetivo',
  },
  competencyMastery: {
    label: 'Domínio por competência',
    definition: 'Média ponderada das pontuações das atividades e questões associadas à competência.',
    nature: 'objetivo',
  },
  approvalRate: {
    label: 'Taxa de aprovação',
    definition: 'Participantes aprovados ÷ participantes que realizaram a avaliação final.',
    nature: 'objetivo',
  },
  engagement: {
    label: 'Engajamento',
    definition: 'Combinação de dias ativos, aulas concluídas, atividades submetidas, interações com o tutor e retornos.',
    nature: 'comportamental',
  },
  learningTime: {
    label: 'Tempo de aprendizagem',
    definition: 'Soma de sessões ativas (heartbeats); intervalos sem atividade acima de 5 minutos são desconsiderados.',
    nature: 'comportamental',
  },
  satisfaction: {
    label: 'Satisfação',
    definition: 'Média das respostas Likert da pesquisa de satisfação pós-curso, convertida para 0–100.',
    nature: 'autodeclarado',
  },
  applicability: {
    label: 'Aplicabilidade profissional',
    definition: 'Percepção do participante sobre a capacidade de aplicar o que aprendeu no trabalho (Likert, 0–100).',
    nature: 'autodeclarado',
  },
} as const;
export type KpiKey = keyof typeof KPI_DEFINITIONS;
