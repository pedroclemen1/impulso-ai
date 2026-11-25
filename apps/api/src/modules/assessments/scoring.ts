import type { KnowledgeLevel, QuestionType } from '@impulso/shared';

export interface ScorableOption {
  id: string;
  label?: string;
  isCorrect: boolean;
  score: number | null;
}

export interface ScorableQuestion {
  id: string;
  type: QuestionType;
  points: number;
  isScored: boolean;
  selfReported: boolean;
  competencyId: string | null;
  dimension: string | null;
  options: ScorableOption[];
}

export interface AnswerInput {
  questionId: string;
  selectedOptionIds?: string[];
  likertValue?: number;
  booleanValue?: boolean;
  textAnswer?: string;
}

export interface QuestionScore {
  /** 0–100, ou null quando a questão não é pontuável (ex.: aberta de contexto). */
  score: number | null;
  isCorrect: boolean | null;
}

/** Pontua uma única questão de forma determinística. */
export function scoreQuestion(q: ScorableQuestion, a: AnswerInput | undefined): QuestionScore {
  if (!q.isScored) return { score: null, isCorrect: null };
  if (!a) return { score: 0, isCorrect: false };
  const selected = new Set(a.selectedOptionIds ?? []);
  switch (q.type) {
    case 'LIKERT': {
      if (!a.likertValue) return { score: 0, isCorrect: null };
      return { score: ((a.likertValue - 1) / 4) * 100, isCorrect: null };
    }
    case 'TRUE_FALSE':
    case 'SINGLE_CHOICE':
    case 'SCENARIO': {
      let chosen = q.options.find((o) => selected.has(o.id));
      if (!chosen && q.type === 'TRUE_FALSE' && a.booleanValue !== undefined) {
        chosen = q.options.find((o) => /^verdadeir/i.test(o.label ?? '') === a.booleanValue);
      }
      if (!chosen) return { score: 0, isCorrect: false };
      const score = chosen.score ?? (chosen.isCorrect ? 100 : 0);
      return { score, isCorrect: q.selfReported ? null : chosen.isCorrect || score >= 100 };
    }
    case 'MULTIPLE_CHOICE': {
      const correct = q.options.filter((o) => o.isCorrect);
      if (!correct.length) {
        // Seleção múltipla sem gabarito (ex.: ferramentas já utilizadas): pontua pela amplitude, como autodeclaração.
        const withScore = q.options.filter((o) => selected.has(o.id));
        const total = withScore.reduce((s, o) => s + (o.score ?? 0), 0);
        return { score: Math.min(100, total || (withScore.length / Math.max(1, q.options.length)) * 100), isCorrect: null };
      }
      const hits = q.options.filter((o) => o.isCorrect && selected.has(o.id)).length;
      const wrong = q.options.filter((o) => !o.isCorrect && selected.has(o.id)).length;
      const score = Math.max(0, ((hits - wrong) / correct.length) * 100);
      return { score, isCorrect: hits === correct.length && wrong === 0 };
    }
    case 'OPEN':
      return { score: null, isCorrect: null };
  }
}

export interface AttemptScore {
  objectiveScore: number | null;
  selfReportScore: number | null;
  overallScore: number | null;
  perQuestion: Map<string, QuestionScore>;
  perCompetency: Map<string, { score: number; weight: number }>;
}

const weightedAvg = (items: { score: number; weight: number }[]) => {
  const w = items.reduce((s, i) => s + i.weight, 0);
  return w > 0 ? items.reduce((s, i) => s + i.score * i.weight, 0) / w : null;
};

/** Agrega as pontuações: objetivas e autodeclaradas são mantidas separadas. */
export function scoreAttempt(questions: ScorableQuestion[], answers: AnswerInput[]): AttemptScore {
  const byQ = new Map(answers.map((a) => [a.questionId, a]));
  const perQuestion = new Map<string, QuestionScore>();
  const objective: { score: number; weight: number }[] = [];
  const selfReport: { score: number; weight: number }[] = [];
  const comp = new Map<string, { score: number; weight: number }[]>();

  for (const q of questions) {
    const result = scoreQuestion(q, byQ.get(q.id));
    perQuestion.set(q.id, result);
    if (result.score === null) continue;
    const item = { score: result.score, weight: q.points || 1 };
    if (q.selfReported) selfReport.push(item);
    else {
      objective.push(item);
      if (q.competencyId) comp.set(q.competencyId, [...(comp.get(q.competencyId) ?? []), item]);
    }
  }

  const perCompetency = new Map<string, { score: number; weight: number }>();
  for (const [k, items] of comp) perCompetency.set(k, { score: weightedAvg(items)!, weight: items.reduce((s, i) => s + i.weight, 0) });

  const objectiveScore = weightedAvg(objective);
  const selfReportScore = weightedAvg(selfReport);
  return {
    objectiveScore,
    selfReportScore,
    overallScore: objectiveScore ?? selfReportScore,
    perQuestion,
    perCompetency,
  };
}

export interface DiagnosticClassification {
  level: KnowledgeLevel;
  combinedScore: number;
  rationale: string[];
}

/**
 * Classificação diagnóstica determinística (níveis 1–4).
 * Combina 75% desempenho objetivo + 25% autopercepção. A autopercepção nunca eleva o nível
 * acima do que o desempenho objetivo sustenta, e o desempenho em cenários práticos limita o nível máximo.
 */
export function classifyDiagnostic(input: {
  objectiveScore: number | null;
  selfReportScore: number | null;
  scenarioScore: number | null;
}): DiagnosticClassification {
  const rationale: string[] = [];
  const objective = input.objectiveScore ?? 0;
  const self = input.selfReportScore ?? objective;
  const combined = input.objectiveScore === null ? self * 0.5 : objective * 0.75 + self * 0.25;
  let level: KnowledgeLevel = combined >= 75 ? 4 : combined >= 55 ? 3 : combined >= 35 ? 2 : 1;
  rationale.push(`Pontuação combinada ${combined.toFixed(0)} (75% objetiva, 25% autopercepção).`);

  if (input.objectiveScore === null) {
    level = Math.min(level, 2) as KnowledgeLevel;
    rationale.push('Sem questões objetivas respondidas: nível limitado a 2.');
  } else if (objective < 40 && level > 2) {
    level = 2;
    rationale.push('Desempenho objetivo abaixo de 40%: a autopercepção não eleva o nível acima de 2.');
  } else if (objective < 60 && level > 3) {
    level = 3;
    rationale.push('Desempenho objetivo abaixo de 60%: nível limitado a 3.');
  }
  if (input.scenarioScore !== null && input.scenarioScore < 50 && level > 3) {
    level = 3;
    rationale.push('Desempenho em cenários práticos abaixo de 50%: nível limitado a 3.');
  }
  return { level, combinedScore: combined, rationale };
}
