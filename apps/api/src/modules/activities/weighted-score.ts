import type { MasteryLevel } from '@impulso/shared';

export interface CriterionDef {
  id: string;
  key: string;
  weight: number;
  maxScore: number;
}

export interface CriterionScoreInput {
  criterionId: string;
  score: number;
}

/**
 * Calcula a nota ponderada (0–100) a partir da rubrica configurada pelo administrador.
 * Pesos e critérios vêm SEMPRE do banco — a LLM apenas sugere a pontuação de cada critério.
 * Critérios ausentes recebem 0; critérios desconhecidos são ignorados.
 */
export function computeWeightedScore(criteria: CriterionDef[], scores: CriterionScoreInput[]) {
  if (!criteria.length) throw new Error('Rubrica sem critérios');
  const byKey = new Map(scores.map((s) => [s.criterionId, s.score]));
  const normalized = criteria.map((c) => {
    const rawScore = byKey.get(c.key) ?? byKey.get(c.id);
    const score = Math.max(0, Math.min(c.maxScore, rawScore ?? 0));
    return { criterionId: c.id, key: c.key, score, missing: rawScore === undefined, pct: (score / c.maxScore) * 100, weight: c.weight };
  });
  const totalWeight = normalized.reduce((s, c) => s + c.weight, 0);
  const weightedScore = normalized.reduce((s, c) => s + c.pct * c.weight, 0) / totalWeight;
  return {
    weightedScore: Math.round(weightedScore * 10) / 10,
    criteria: normalized,
    missingCriteria: normalized.filter((c) => c.missing).map((c) => c.key),
  };
}

export function masteryFromWeighted(score: number): MasteryLevel {
  if (score >= 85) return 'AVANCADO';
  if (score >= 70) return 'PROFICIENTE';
  if (score >= 45) return 'EM_DESENVOLVIMENTO';
  return 'INICIAL';
}
