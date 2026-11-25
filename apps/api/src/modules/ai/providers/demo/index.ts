import { normalize } from '../../../../shared/text';
import type {
  ConsolidationInput,
  CourseAssessmentsInput,
  CourseOutlineInput,
  EvaluationInput,
  InsightsInput,
  ModuleContentInput,
  PersonalizedExampleInput,
  ReflectionFeedbackInput,
  TutorChatInput,
  TutorSolutionInput,
} from '../../inputs';
import type { ConsolidationOutput, InsightsOutput } from '../../schemas';
import {
  AIProviderError,
  type AIOperation,
  type AIProvider,
  type ChatGenerationRequest,
  type ChatGenerationResponse,
  type StructuredGenerationRequest,
  type StructuredGenerationResponse,
} from '../types';
import { evaluateDeterministically } from './evaluator';
import { demoCourseAssessments, demoCourseOutline, demoModuleContent } from './generators';

export const DEMO_MODEL = 'impulso-demo-v1';

function tutorReply(input: TutorChatInput): string {
  const msg = normalize(input.studentMessage);
  const asksAnswer = /(resposta|solucao|gabarito|me (da|de|passa)|qual e a certa|responde pra mim)/.test(msg);
  const questions = input.activity?.socraticQuestions ?? [];
  const question =
    questions.length > 0
      ? questions[input.turnIndex % questions.length]
      : 'Como você aplicaria esse conceito em um processo seletivo real da sua área?';

  if (asksAnswer && !input.solutionAllowed) {
    return `Entendo a vontade de ver a resposta pronta — mas você aprende mais construindo o raciocínio. Vamos por partes: **${question}**\n\nSe quiser, use o botão **Pedir uma pista** para receber uma orientação progressiva.`;
  }
  if (asksAnswer && input.solutionAllowed) {
    return 'Você já realizou tentativas suficientes. Use o botão **Ver solução comentada** para comparar sua resposta com uma solução de referência e entender o raciocínio por trás dela.';
  }
  if (msg.split(/\s+/).length < 6) {
    return `Pode desenvolver um pouco mais? Explique o seu raciocínio com um exemplo do dia a dia de ${input.student.jobTitle?.toLowerCase() || 'recrutamento'}. ${question}`;
  }
  const ack = input.lastEvaluation?.strengths?.[0]
    ? `Você já demonstrou um ponto forte: ${input.lastEvaluation.strengths[0].replace(/\.$/, '').toLowerCase()}.`
    : 'Boa reflexão — você está conectando o conteúdo à prática.';
  const gap = input.lastEvaluation?.improvements?.[0] ? ` Um aspecto que ainda merece atenção: ${input.lastEvaluation.improvements[0].replace(/\.$/, '').toLowerCase()}.` : '';
  return `${ack}${gap}\n\nAgora pense: **${question}**\n\nQuando se sentir pronto(a), use **Revisar resposta** para aprimorar sua solução.`;
}

function solution(input: TutorSolutionInput): string {
  return `### Solução comentada\n\n${input.activity.modelAnswer || 'Uma boa solução atende a todos os critérios da rubrica.'}\n\n### Comparando com a sua resposta\n\nObserve quais elementos da solução acima já aparecem no seu texto e quais ainda estão ausentes. Em especial, verifique: contexto suficiente, objetivo explícito, validação humana do resultado e cuidados com dados pessoais.`;
}

function consolidation(input: ConsolidationInput): ConsolidationOutput {
  const last = input.evaluations[input.evaluations.length - 1];
  const first = input.evaluations[0];
  const delta = first && last && input.evaluations.length > 1 ? Math.round(last.weightedScore - first.weightedScore) : null;
  return {
    summary: `Você concluiu a aula "${input.lessonTitle}".${delta !== null ? ` Entre a primeira e a última tentativa, sua pontuação variou ${delta >= 0 ? '+' : ''}${delta} pontos.` : ''} Sua reflexão registrada: "${input.reflection.slice(0, 200)}".`,
    learned: input.keyTakeaways.slice(0, 4),
    improvementPoints: (last?.improvements ?? []).slice(0, 3),
    nextSteps: [
      input.nextLessonTitle ? `Continue para a próxima aula: ${input.nextLessonTitle}.` : 'Realize a avaliação do módulo para verificar sua aprendizagem.',
      'Aplique o que aprendeu em uma tarefa real, usando apenas dados fictícios ou anonimizados.',
    ],
  };
}

function insights(input: InsightsInput): InsightsOutput {
  const evidenceCount = input.evaluations.length + input.assessments.filter((a) => a.score !== null).length;
  const sufficiency = evidenceCount < 2 ? 'INSUFFICIENT' : evidenceCount < 5 ? 'PARTIAL' : 'SUFFICIENT';
  const strong = input.competencies.filter((c) => c.evidenceCount > 0 && c.score >= 70);
  const weak = input.competencies.filter((c) => c.evidenceCount > 0 && c.score < 60);
  const recurring = new Map<string, number>();
  for (const e of input.evaluations) for (const imp of e.improvements) recurring.set(imp, (recurring.get(imp) ?? 0) + 1);
  const recurringList = [...recurring.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  return {
    summary:
      sufficiency === 'INSUFFICIENT'
        ? `Ainda não há evidências suficientes para uma análise consistente de ${input.studentName}. Recomenda-se aguardar a conclusão de mais atividades.`
        : `${input.studentName} ${strong.length ? `apresenta bom domínio em ${strong.map((c) => c.name.toLowerCase()).join(', ')}` : 'está construindo os fundamentos'}${weak.length ? `, mas ainda demonstra dificuldades em ${weak.map((c) => c.name.toLowerCase()).join(', ')}` : ''}. Concluiu ${input.lessonsCompleted} de ${input.totalLessons} aulas e realizou ${input.tutorInteractions} interações com o tutor.`,
    strengths: strong.map((c) => `${c.name}: ${Math.round(c.score)}% (${c.evidenceCount} evidência(s))`),
    difficulties: [...weak.map((c) => `${c.name}: ${Math.round(c.score)}%`), ...recurringList],
    recommendations: weak.length
      ? weak.map((c) => `Reforçar atividades relacionadas a ${c.name.toLowerCase()}.`)
      : ['Propor desafios de maior complexidade e análise crítica de fluxos de trabalho.'],
    dataSufficiency: sufficiency,
    evidence: input.evaluations.slice(-4).map((e) => `${e.activity} — tentativa ${e.attemptNumber}: ${Math.round(e.score)}%`),
  };
}

function personalizedExample(input: PersonalizedExampleInput): string {
  const role = input.student.jobTitle || 'profissional de recrutamento';
  return `**Exemplo para o seu contexto (${role})**\n\nImagine que você, como ${role.toLowerCase()}, precisa aplicar o que viu em "${input.lessonTitle}" em uma vaga fictícia de *Assistente Comercial*. Antes de usar a IA, você descreve o contexto (empresa fictícia de médio porte, equipe de 8 pessoas, foco em atendimento), define o objetivo e o formato desejado. Depois, revisa a resposta, elimina exigências desnecessárias e confere se não há critérios discriminatórios. ${input.student.level <= 2 ? 'Comece com um pedido simples e vá acrescentando detalhes.' : 'Experimente comparar duas versões de prompt e registrar qual produziu o resultado mais útil.'}`;
}

function reflectionFeedback(input: ReflectionFeedbackInput): string {
  const words = input.reflection.trim().split(/\s+/).length;
  const depth = words > 40 ? 'Sua reflexão está bem desenvolvida.' : 'Obrigado pela reflexão.';
  return `${depth} Ela se conecta à ideia de que ${input.keyTakeaways[0]?.toLowerCase().replace(/\.$/, '') || 'a IA deve ser usada com contexto e supervisão'}. Para aprofundar: que resultado concreto você espera observar ao aplicar isso no seu trabalho?`;
}

const structuredHandlers: Partial<Record<AIOperation, (input: any) => unknown>> = {
  activity_evaluation: (i: EvaluationInput) => evaluateDeterministically(i),
  consolidation: (i: ConsolidationInput) => consolidation(i),
  pedagogical_insights: (i: InsightsInput) => insights(i),
  course_outline: (i: CourseOutlineInput) => demoCourseOutline(i),
  module_content: (i: ModuleContentInput) => demoModuleContent(i),
  course_assessments: (i: CourseAssessmentsInput) => demoCourseAssessments(i),
  connection_test: () => ({ status: 'ok', message: 'Provedor demonstrativo ativo (respostas determinísticas).' }),
};

const chatHandlers: Partial<Record<AIOperation, (input: any) => string>> = {
  tutor_chat: (i: TutorChatInput) => tutorReply(i),
  tutor_solution: (i: TutorSolutionInput) => solution(i),
  personalized_example: (i: PersonalizedExampleInput) => personalizedExample(i),
  reflection_feedback: (i: ReflectionFeedbackInput) => reflectionFeedback(i),
};

/**
 * Provedor demonstrativo determinístico: permite usar toda a plataforma sem chave de API.
 * Também é utilizado como fallback pedagógico quando o provedor configurado falha.
 */
export class DemoProvider implements AIProvider {
  readonly name = 'demo';
  readonly defaultModel = DEMO_MODEL;

  isConfigured() {
    return true;
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<StructuredGenerationResponse<T>> {
    const handler = structuredHandlers[request.operation];
    if (!handler) throw new AIProviderError(`Operação estruturada não suportada: ${request.operation}`, 'INVALID_OUTPUT', false);
    const parsed = request.schema.safeParse(handler(request.input));
    if (!parsed.success) throw new AIProviderError(`Demo gerou saída inválida: ${parsed.error.message}`, 'INVALID_OUTPUT', false);
    return { data: parsed.data, model: DEMO_MODEL, usage: { inputTokens: 0, outputTokens: 0 } };
  }

  async generateChat(request: ChatGenerationRequest): Promise<ChatGenerationResponse> {
    const handler = chatHandlers[request.operation];
    if (!handler) throw new AIProviderError(`Operação de chat não suportada: ${request.operation}`, 'INVALID_OUTPUT', false);
    return { content: handler(request.input), model: DEMO_MODEL, usage: { inputTokens: 0, outputTokens: 0 } };
  }
}
