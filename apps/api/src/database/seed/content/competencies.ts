import type { SeedAchievement, SeedCompetency } from './types';

export const competencies: SeedCompetency[] = [
  {
    key: 'ai_fundamentals',
    name: 'Fundamentos de IA e LLMs',
    description:
      'Compreender o que é inteligência artificial, IA generativa e modelos de linguagem (LLMs), como funcionam em linhas gerais e quais são suas principais limitações.',
    category: 'Fundamentos',
  },
  {
    key: 'prompt_engineering',
    name: 'Engenharia de prompts',
    description:
      'Elaborar instruções claras, contextualizadas e estruturadas para obter resultados úteis de ferramentas de IA, refinando-as de forma iterativa.',
    category: 'Aplicação',
  },
  {
    key: 'ai_recruitment',
    name: 'IA aplicada ao recrutamento',
    description:
      'Aplicar ferramentas de IA em atividades de recrutamento e seleção, como descrições de vagas, roteiros de entrevistas, comunicação com candidatos e organização de informações.',
    category: 'Aplicação',
  },
  {
    key: 'critical_thinking',
    name: 'Pensamento crítico e validação',
    description:
      'Avaliar criticamente respostas geradas por IA, identificar erros, alucinações e conclusões sem evidência, e validar informações antes de usá-las.',
    category: 'Análise',
  },
  {
    key: 'responsible_ai',
    name: 'Ética, privacidade e vieses',
    description:
      'Utilizar IA de forma responsável, respeitando a LGPD, anonimizando dados, prevenindo vieses e discriminação e preservando a responsabilidade humana nas decisões.',
    category: 'Responsabilidade',
  },
  {
    key: 'workflow_design',
    name: 'Fluxos de trabalho assistidos por IA',
    description:
      'Desenhar processos de trabalho que combinam etapas automatizadas por IA com pontos claros de revisão e decisão humana.',
    category: 'Estratégia',
  },
];

export const achievements: SeedAchievement[] = [
  {
    key: 'primeiros_passos',
    title: 'Primeiros passos com IA',
    description: 'Concluiu a primeira aula da sua trilha de aprendizagem.',
    icon: 'sparkles',
    criteria: { type: 'first_lesson' },
  },
  {
    key: 'diagnostico',
    title: 'Ponto de partida',
    description: 'Respondeu o diagnóstico inicial e recebeu uma trilha personalizada.',
    icon: 'compass',
    criteria: { type: 'diagnostic_done' },
  },
  {
    key: 'fundamentos_llm',
    title: 'Fundamentos de LLMs',
    description: 'Concluiu o módulo de fundamentos de inteligência artificial.',
    icon: 'brain',
    competencyKey: 'ai_fundamentals',
    criteria: { type: 'module_completed', moduleOrder: 1 },
  },
  {
    key: 'engenharia_prompts',
    title: 'Engenharia de prompts',
    description: 'Concluiu o módulo de engenharia de prompts.',
    icon: 'message-square-code',
    competencyKey: 'prompt_engineering',
    criteria: { type: 'module_completed', moduleOrder: 2 },
  },
  {
    key: 'recrutamento_inteligente',
    title: 'Recrutamento inteligente',
    description: 'Concluiu o módulo de IA aplicada ao recrutamento.',
    icon: 'briefcase',
    competencyKey: 'ai_recruitment',
    criteria: { type: 'module_completed', moduleOrder: 3 },
  },
  {
    key: 'pensamento_critico',
    title: 'Pensamento crítico',
    description: 'Concluiu o módulo de pensamento crítico e validação.',
    icon: 'search-check',
    competencyKey: 'critical_thinking',
    criteria: { type: 'module_completed', moduleOrder: 4 },
  },
  {
    key: 'ia_responsavel',
    title: 'IA responsável',
    description: 'Concluiu o módulo de ética, privacidade e vieses.',
    icon: 'shield-check',
    competencyKey: 'responsible_ai',
    criteria: { type: 'module_completed', moduleOrder: 5 },
  },
  {
    key: 'evolucao_feedback',
    title: 'Evolução com feedback',
    description: 'Melhorou uma resposta em pelo menos 15 pontos após o feedback socrático.',
    icon: 'trending-up',
    criteria: { type: 'revision_improved', minDelta: 15 },
  },
  {
    key: 'conclusao',
    title: 'Curso concluído',
    description: 'Concluiu um curso completo e recebeu o certificado.',
    icon: 'graduation-cap',
    criteria: { type: 'course_completed' },
  },
];
