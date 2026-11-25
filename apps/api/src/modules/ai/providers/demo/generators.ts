import { DIFFICULTY_LABELS } from '@impulso/shared';
import type { CourseAssessmentsInput, CourseOutlineInput, ModuleContentInput } from '../../inputs';
import type { CourseAssessments, CourseOutline, GeneratedQuestion, ModuleContent } from '../../schemas';

const DEMO_TAG = '> Conteúdo gerado pelo **provedor demonstrativo** (determinístico). Revise e edite antes de publicar.';

const splitList = (s: string) =>
  s
    .split(/[\n;,]|\s+e\s+/)
    .map((x) => x.trim().replace(/\.$/, ''))
    .filter((x) => x.length > 3);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const slugKey = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);

export function demoCourseOutline({ params }: CourseOutlineInput): CourseOutline {
  const objectives = splitList(params.objectives);
  const themes = objectives.length ? objectives : [params.topic];
  const moduleTitles = Array.from({ length: params.moduleCount }, (_, i) => {
    const theme = themes[i % themes.length];
    return i < themes.length ? capitalize(theme) : `Aplicação prática ${i - themes.length + 1}: ${capitalize(themes[i % themes.length])}`;
  });
  const competencyNames = splitList(params.competencies).length
    ? splitList(params.competencies)
    : ['Fundamentos do tema', 'Aplicação no contexto profissional', 'Uso responsável de IA'];
  return {
    title: capitalize(params.topic),
    description: `Curso voltado a ${params.targetAudience.toLowerCase()} com foco em ${params.topic.toLowerCase()}, contextualizado em ${params.professionalContext.toLowerCase()}. Estruturado segundo ${params.methodology}.`,
    objectives: themes.map((t) => `Compreender e aplicar ${t.toLowerCase()} no contexto de ${params.professionalContext.toLowerCase()}.`),
    targetAudience: params.targetAudience,
    prerequisites: params.expectedLevel === 'BEGINNER' ? 'Nenhum pré-requisito técnico.' : 'Familiaridade básica com ferramentas de IA generativa.',
    difficulty: params.expectedLevel,
    competencies: competencyNames.slice(0, 5).map((name) => ({ key: slugKey(name), name: capitalize(name), description: `Competência relacionada a ${name.toLowerCase()}.` })),
    modules: moduleTitles.map((title, i) => ({
      title,
      description: `Módulo ${i + 1} — ${title}. Apresenta conceitos, exemplos contextualizados e uma atividade prática.`,
      objectives: [`Explicar os conceitos centrais de ${title.toLowerCase()}.`, `Aplicar ${title.toLowerCase()} em uma situação realista.`],
      lessonTitles: [`Conceitos essenciais: ${title}`, `Na prática: ${title}`],
    })),
    completionCriteria: { finalAssessmentPassingScore: 70, requireModuleQuizzes: true },
    addieNotes: {
      analysis: `Público: ${params.targetAudience}. Nível esperado: ${DIFFICULTY_LABELS[params.expectedLevel]}. O diagnóstico inicial identifica lacunas antes do início.`,
      design: `Objetivos derivados de: ${params.objectives}. Sequência do conceito à prática, com rubricas por atividade.`,
      development: 'Conteúdo gerado com apoio de IA e revisado pelo administrador antes da publicação.',
      implementation: 'Disponibilização por alocação individual ou por turma, com acompanhamento de progresso e engajamento.',
      evaluation: 'Comparação entre diagnóstico e avaliação final, evolução após feedback e pesquisa de satisfação.',
    },
  };
}

function demoQuiz(topic: string, competencyKey: string | undefined, n: number, seed: number): GeneratedQuestion[] {
  const bank: GeneratedQuestion[] = [
    {
      type: 'SINGLE_CHOICE',
      prompt: `Ao utilizar IA generativa em atividades de ${topic.toLowerCase()}, qual é a postura mais adequada?`,
      competencyKey,
      selfReported: false,
      isScored: true,
      explanation: 'A IA apoia o trabalho, mas a validação e a decisão final permanecem humanas.',
      likertLabels: [],
      options: [
        { label: 'Aceitar a resposta da IA sem revisão para ganhar tempo.', isCorrect: false },
        { label: 'Usar a IA como apoio e revisar criticamente o resultado antes de utilizá-lo.', isCorrect: true },
        { label: 'Evitar qualquer uso de IA, pois ela sempre erra.', isCorrect: false },
        { label: 'Delegar à IA a decisão final sobre candidatos.', isCorrect: false },
      ],
    },
    {
      type: 'TRUE_FALSE',
      prompt: 'Modelos de linguagem podem produzir informações plausíveis, porém incorretas.',
      competencyKey,
      selfReported: false,
      isScored: true,
      explanation: 'Esse fenômeno é conhecido como alucinação e exige validação humana.',
      likertLabels: [],
      options: [
        { label: 'Verdadeiro', isCorrect: true },
        { label: 'Falso', isCorrect: false },
      ],
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: 'Qual elemento torna um prompt mais preciso?',
      competencyKey,
      selfReported: false,
      isScored: true,
      explanation: 'Contexto, objetivo, restrições e formato de saída orientam melhor o modelo.',
      likertLabels: [],
      options: [
        { label: 'Instruções curtas e genéricas.', isCorrect: false },
        { label: 'Contexto, objetivo claro, restrições e formato de saída.', isCorrect: true },
        { label: 'Repetir a mesma pergunta várias vezes.', isCorrect: false },
      ],
    },
    {
      type: 'SINGLE_CHOICE',
      prompt: 'Antes de inserir informações de candidatos em uma ferramenta de IA, o que deve ser feito?',
      competencyKey,
      selfReported: false,
      isScored: true,
      explanation: 'A LGPD exige minimização e proteção de dados pessoais; use dados anonimizados.',
      likertLabels: [],
      options: [
        { label: 'Anonimizar ou remover dados pessoais.', isCorrect: true },
        { label: 'Incluir CPF para facilitar a identificação.', isCorrect: false },
        { label: 'Enviar o currículo completo sem alterações.', isCorrect: false },
      ],
    },
  ];
  return Array.from({ length: n }, (_, i) => bank[(i + seed) % bank.length]);
}

export function demoModuleContent(input: ModuleContentInput): ModuleContent {
  const { module, params } = input;
  const comp = input.competencies[input.moduleIndex % input.competencies.length]?.key;
  const lessons = module.lessonTitles.map((title, i) => {
    const isLast = i === module.lessonTitles.length - 1;
    return {
      title,
      summary: `${title} — fundamentos e aplicação em ${params.professionalContext.toLowerCase()}.`,
      estimatedMinutes: input.minutesPerLesson,
      learnContent: `${DEMO_TAG}\n\n## ${title}\n\nNesta aula você vai compreender os conceitos centrais de **${module.title.toLowerCase()}** e por que eles são relevantes para ${params.targetAudience.toLowerCase()}.\n\n### Ideias principais\n\n- O que é ${module.title.toLowerCase()} e qual problema resolve.\n- Como a IA generativa pode apoiar essa atividade, sem substituir o julgamento profissional.\n- Quais cuidados são necessários: validação, privacidade e vieses.\n\n### Por que isso importa\n\nAo dominar este tema, você ganha eficiência em tarefas repetitivas e mais tempo para atividades estratégicas, mantendo a supervisão humana sobre decisões que afetam pessoas.`,
      beginnerSupport: `Pense na IA como um assistente muito rápido, mas que ainda não conhece a sua empresa. Quanto mais contexto você der, melhor será a ajuda — e você sempre deve revisar o que ele entregar.`,
      advancedDeepDive: `Explore como pequenas variações de contexto e restrições alteram o resultado. Compare duas versões de prompt para a mesma tarefa e registre quais critérios de qualidade mudaram.`,
      contextContent: `### Exemplo em ${params.professionalContext}\n\nUma analista precisa aplicar ${module.title.toLowerCase()} em uma vaga fictícia de **Analista Administrativo**. Ela descreve o contexto da empresa (fictícia), define o objetivo e pede um formato de saída em tópicos. Em seguida, revisa o resultado, remove generalizações e confere se nenhum critério discriminatório foi sugerido.`,
      reflectionPrompt: `Em qual situação do seu trabalho você aplicaria ${module.title.toLowerCase()} nesta semana? Que cuidado você tomaria?`,
      keyTakeaways: [
        `${module.title} pode ser apoiado por IA quando há contexto claro.`,
        'Todo resultado de IA precisa de revisão humana.',
        'Dados de candidatos devem ser anonimizados.',
      ],
      competencyKeys: comp ? [comp] : [],
      activity:
        isLast && input.includeActivity
          ? {
              type: 'OPEN_RESPONSE' as const,
              title: `Atividade prática: ${module.title}`,
              instructions: `Descreva como você aplicaria ${module.title.toLowerCase()} em um processo seletivo fictício. Inclua o contexto, o objetivo, como usaria a IA e como validaria o resultado.`,
              scenario: 'A empresa fictícia **Aurora Serviços** abriu uma vaga de Analista Administrativo Júnior e precisa reduzir o tempo de triagem sem perder qualidade.',
              guidedSteps: ['Descreva o contexto da vaga.', 'Defina o objetivo do uso da IA.', 'Explique como validará o resultado.', 'Indique cuidados com dados e vieses.'],
              advancedChallenge: 'Proponha um indicador para medir se o uso de IA melhorou o processo.',
              socraticQuestions: [
                'Que informações a IA precisaria ter para gerar uma resposta realmente útil?',
                'Como você saberia se o resultado gerado está correto?',
                'Que riscos para os candidatos existem nessa proposta?',
              ],
              hints: ['Comece pelo contexto: empresa, vaga e objetivo.', 'Inclua uma etapa explícita de validação humana.', 'Mencione anonimização e critérios objetivos.'],
              modelAnswer: 'Uma boa resposta descreve o contexto da vaga, define o objetivo e o formato esperado, indica como validar o resultado e destaca cuidados com LGPD e vieses, preservando a decisão humana.',
              expectedKeywords: ['contexto', 'objetivo', 'formato', 'validar', 'revisar', 'anonim', 'vies', 'humana'],
              rubric: {
                title: `Rubrica — ${module.title}`,
                description: 'Critérios de avaliação da atividade prática.',
                criteria: [
                  { key: 'contextualizacao', name: 'Contextualização profissional', description: 'Relaciona a solução ao contexto da vaga.', weight: 2, indicators: ['Descreve empresa, vaga e objetivo'] },
                  { key: 'qualidade_solucao', name: 'Qualidade da solução', description: 'Proposta viável e completa.', weight: 2, indicators: ['Apresenta etapas claras e aplicáveis'] },
                  { key: 'pensamento_critico', name: 'Pensamento crítico', description: 'Prevê validação dos resultados.', weight: 1.5, indicators: ['Inclui revisão e verificação humana'] },
                  { key: 'uso_responsavel', name: 'Uso responsável de IA', description: 'Considera privacidade e vieses.', weight: 1.5, indicators: ['Menciona anonimização e critérios não discriminatórios'] },
                ],
              },
            }
          : null,
    };
  });
  return { lessons, quiz: { questions: demoQuiz(params.topic, comp, 3, input.moduleIndex) } };
}

export function demoCourseAssessments(input: CourseAssessmentsInput): CourseAssessments {
  const keys = input.competencies.map((c) => c.key);
  const objective = (seed: number) =>
    keys.flatMap((k, i) => demoQuiz(input.topic, k, 1, seed + i)).slice(0, Math.max(4, keys.length));
  return {
    diagnostic: {
      questions: [
        {
          type: 'LIKERT',
          prompt: 'Quão familiarizado(a) você está com ferramentas de inteligência artificial generativa?',
          dimension: 'FAMILIARITY',
          selfReported: true,
          isScored: true,
          likertLabels: ['Nada', 'Pouco', 'Razoavelmente', 'Bastante', 'Totalmente'],
          options: [],
        },
        {
          type: 'SINGLE_CHOICE',
          prompt: 'Com que frequência você utiliza ferramentas de IA no trabalho?',
          dimension: 'FREQUENCY',
          selfReported: true,
          isScored: true,
          likertLabels: [],
          options: [
            { label: 'Nunca utilizei', isCorrect: false, score: 0 },
            { label: 'Raramente', isCorrect: false, score: 33 },
            { label: 'Semanalmente', isCorrect: false, score: 66 },
            { label: 'Diariamente', isCorrect: false, score: 100 },
          ],
        },
        ...objective(0),
        {
          type: 'OPEN',
          prompt: 'Quais são suas principais atividades profissionais e dificuldades atuais?',
          dimension: 'ACTIVITIES',
          selfReported: false,
          isScored: false,
          likertLabels: [],
          options: [],
        },
      ],
    },
    finalAssessment: { questions: objective(1) },
  };
}
