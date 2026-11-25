import type { SeedAssessment } from './types';

export const LIKERT_AGREEMENT = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];
export const LIKERT_FAMILIARITY = ['Nenhuma', 'Pouca', 'Moderada', 'Boa', 'Muito boa'];

/** Pesquisa de satisfação padrão (autodeclarada) usada pelos cursos demonstrativos. */
export const buildSatisfactionSurvey = (courseLabel: string): SeedAssessment => ({
  kind: 'SATISFACTION',
  title: 'Pesquisa de satisfação e aplicabilidade',
  description: `Sua opinião sobre o curso "${courseLabel}" nos ajuda a melhorá-lo. As respostas são autodeclaradas e não afetam sua nota.`,
  passingScore: 0,
  maxAttempts: 1,
  questions: [
    {
      type: 'LIKERT',
      prompt: 'De forma geral, estou satisfeito(a) com o curso.',
      helpText: 'SATISFACAO',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'LIKERT',
      prompt: 'O tutor de IA me ajudou a refletir e a melhorar minhas respostas.',
      helpText: 'SATISFACAO',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'LIKERT',
      prompt: 'Sinto-me capaz de aplicar o que aprendi em situações reais do meu trabalho.',
      helpText: 'APLICABILIDADE',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'LIKERT',
      prompt: 'Pretendo aplicar, nas próximas semanas, pelo menos uma prática do curso na minha rotina.',
      helpText: 'APLICABILIDADE',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'OPEN',
      prompt: 'Deixe um comentário ou sugestão sobre o curso (opcional).',
      isScored: false,
    },
  ],
});
