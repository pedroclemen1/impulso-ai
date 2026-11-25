import type { MasteryLevel } from '@impulso/shared';
import { clamp, looksLikePromptInjection, normalize, redactSensitiveData, wordCount } from '../../../../shared/text';
import type { EvaluationInput } from '../../inputs';
import type { EvaluationOutput } from '../../schemas';

/** Sinais lexicais por critério típico de rubrica (usados apenas pelo avaliador determinístico). */
const CRITERION_SIGNALS: Record<string, string[]> = {
  contextualizacao: ['contexto', 'empresa', 'vaga', 'senioridade', 'equipe', 'cargo', 'publico', 'setor', 'cultura', 'recrut', 'candidat', 'area'],
  clareza: ['objetivo', 'formato', 'passo', 'etapa', 'primeiro', 'segundo', 'por fim', 'estrutura', 'lista', 'topico'],
  pensamento_critico: ['validar', 'verificar', 'revisar', 'conferir', 'checar', 'fonte', 'alucina', 'limitac', 'erro', 'questionar', 'evidencia', 'critic'],
  uso_responsavel: ['lgpd', 'anonim', 'dados pessoais', 'vies', 'discrimin', 'supervisao humana', 'privacidade', 'consentimento', 'etica', 'responsab', 'decisao humana', 'transparen'],
  qualidade_solucao: ['prompt', 'exemplo', 'criterio', 'resultado', 'fluxo', 'ferramenta', 'restric', 'tom', 'saida'],
  compreensao_conceitual: ['modelo', 'llm', 'linguagem', 'probabil', 'token', 'treinad', 'gera', 'padroes', 'previs', 'ia generativa'],
};

export function masteryFromScore(score: number): MasteryLevel {
  if (score >= 85) return 'AVANCADO';
  if (score >= 70) return 'PROFICIENTE';
  if (score >= 45) return 'EM_DESENVOLVIMENTO';
  return 'INICIAL';
}

function signalScore(text: string, terms: string[]): number {
  if (!terms.length) return 0;
  const hits = terms.filter((t) => text.includes(normalize(t))).length;
  return clamp(hits / Math.min(4, terms.length), 0, 1);
}

/**
 * Avaliador determinístico baseado em rubrica. Não substitui uma LLM — serve para
 * demonstração sem chave de API e como fallback quando o provedor está indisponível.
 */
export function evaluateDeterministically(input: EvaluationInput): EvaluationOutput {
  const raw = input.submission;
  const text = normalize(raw);
  const words = wordCount(raw);
  const keywords = input.activity.expectedKeywords.map(normalize);
  const coverage = keywords.length ? keywords.filter((k) => text.includes(k)).length / keywords.length : 0.5;
  const lengthFactor = clamp(words / 120, 0, 1);
  const structured = /\n\s*([-*•]|\d+[.)])\s/.test(raw) || raw.split('\n').filter((l) => l.trim()).length >= 3;
  const injection = looksLikePromptInjection(raw);
  const sensitive = redactSensitiveData(raw).found;

  const scores = input.rubric.map((c) => {
    const key = normalize(c.key);
    const terms = CRITERION_SIGNALS[key] ?? [...c.indicators.flatMap((i) => normalize(i).split(/\W+/).filter((w) => w.length > 5)).slice(0, 8)];
    const signal = signalScore(text, terms);
    let score = 18 + coverage * 42 + lengthFactor * 18 + signal * 22;
    if (key === 'clareza' && structured) score += 8;
    if (key === 'uso_responsavel' && sensitive.length) score -= 25;
    if (words < 15) score = Math.min(score, 30);
    if (injection) score = Math.min(score, 20);
    score = Math.round(clamp(score, 5, 97));
    const level =
      score >= 80 ? 'atende plenamente' : score >= 60 ? 'atende parcialmente' : score >= 40 ? 'atende de forma inicial' : 'ainda não atende';
    const missing = c.indicators.find((ind) => !signalScore(text, normalize(ind).split(/\W+/).filter((w) => w.length > 5)));
    return {
      criterionId: c.key,
      score,
      justification: `A resposta ${level} ao critério "${c.name}".${missing && score < 80 ? ` Indicador a fortalecer: ${missing}.` : ''}`,
    };
  });

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const nameOf = (key: string) => input.rubric.find((c) => c.key === key)?.name ?? key;
  const strengths = sorted
    .filter((s) => s.score >= 60)
    .slice(0, 3)
    .map((s) => `Bom desempenho em ${nameOf(s.criterionId).toLowerCase()}.`);
  if (!strengths.length && words >= 15) strengths.push('Você identificou a tarefa central da atividade e iniciou uma proposta de solução.');
  const improvements = sorted
    .filter((s) => s.score < 70)
    .reverse()
    .slice(0, 3)
    .map((s) => {
      const c = input.rubric.find((r) => r.key === s.criterionId);
      return c?.indicators[0] ? `${c.name}: ${c.indicators[0]}` : `Aprofunde o critério ${nameOf(s.criterionId).toLowerCase()}.`;
    });
  if (sensitive.length) improvements.unshift(`Remova dados pessoais (${sensitive.join(', ')}) — utilize sempre informações fictícias ou anonimizadas.`);

  const weakestIdx = input.rubric.findIndex((c) => c.key === sorted[sorted.length - 1]?.criterionId);
  const questions = input.activity.socraticQuestions;
  const socraticQuestion = questions.length
    ? questions[(Math.max(0, weakestIdx) + input.attemptNumber - 1) % questions.length]
    : 'Que informação adicional tornaria sua resposta mais precisa para o contexto de recrutamento?';
  const hints = input.activity.hints;
  const hint = hints.length ? hints[Math.min(input.attemptNumber - 1, hints.length - 1)] : '';
  const avg = scores.reduce((a, s) => a + s.score, 0) / scores.length;

  return {
    scores,
    strengths,
    improvements: injection
      ? ['A resposta contém instruções direcionadas ao avaliador. Concentre-se em resolver a atividade proposta.', ...improvements]
      : improvements,
    socraticQuestion,
    hint,
    masteryLevel: masteryFromScore(avg),
    recommendedAction:
      avg >= input.activity.passingScore
        ? 'Consolide a aprendizagem e avance para a próxima etapa.'
        : 'Revise sua resposta considerando a pergunta do tutor e tente novamente.',
    requiresHumanReview: injection,
  };
}
