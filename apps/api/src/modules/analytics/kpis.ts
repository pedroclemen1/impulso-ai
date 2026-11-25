/**
 * Cálculo dos indicadores educacionais (seção 21). Funções puras e testáveis.
 * Todas retornam null quando não há dados suficientes — a interface exibe estado vazio.
 */

export const ratio = (num: number, den: number): number | null => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

export const mean = (xs: (number | null | undefined)[]): number | null => {
  const v = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

/** Alocações concluídas ÷ alocações elegíveis (não canceladas). */
export function completionRate(enrollments: { status: string }[]) {
  const eligible = enrollments.filter((e) => e.status !== 'CANCELLED');
  return ratio(eligible.filter((e) => e.status === 'COMPLETED').length, eligible.length);
}

/** Participantes que iniciaram ÷ participantes alocados. */
export function activationRate(enrollments: { userId: string; status: string; startedAt: Date | null }[]) {
  const eligible = enrollments.filter((e) => e.status !== 'CANCELLED');
  const allocated = new Set(eligible.map((e) => e.userId));
  const started = new Set(eligible.filter((e) => e.startedAt).map((e) => e.userId));
  return ratio(started.size, allocated.size);
}

/** Diferença em pontos percentuais entre final e inicial (mesma escala 0–100). */
export function knowledgeGain(initial: number | null | undefined, final: number | null | undefined): number | null {
  if (initial === null || initial === undefined || final === null || final === undefined) return null;
  return Math.round((final - initial) * 10) / 10;
}

/** Ganho normalizado de Hake: (final − inicial) ÷ (100 − inicial). Indefinido quando inicial = 100. */
export function normalizedGain(initial: number | null | undefined, final: number | null | undefined): number | null {
  if (initial === null || initial === undefined || final === null || final === undefined) return null;
  if (initial >= 100) return null;
  return Math.round(((final - initial) / (100 - initial)) * 1000) / 10;
}

/** Evolução após feedback: última tentativa válida − primeira tentativa, por atividade. */
export function feedbackImprovement(attempts: { attemptNumber: number; score: number }[]): number | null {
  if (attempts.length < 2) return null;
  const sorted = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  return Math.round((sorted[sorted.length - 1].score - sorted[0].score) * 10) / 10;
}

/** Aprovados ÷ participantes que realizaram a avaliação final. */
export function approvalRate(finalResults: { userId: string; passed: boolean }[]) {
  const byUser = new Map<string, boolean>();
  for (const r of finalResults) byUser.set(r.userId, (byUser.get(r.userId) ?? false) || r.passed);
  return ratio([...byUser.values()].filter(Boolean).length, byUser.size);
}

/** Domínio por competência: média ponderada das evidências. */
export function competencyMastery(evidence: { score: number; weight: number }[]) {
  const w = evidence.reduce((s, e) => s + e.weight, 0);
  return w > 0 ? Math.round((evidence.reduce((s, e) => s + e.score * e.weight, 0) / w) * 10) / 10 : null;
}

/** Converte uma média Likert (1–5) para 0–100. */
export const likertTo100 = (avg: number | null) => (avg === null ? null : Math.round(((avg - 1) / 4) * 1000) / 10);

export const IDLE_GAP_SECONDS = 5 * 60;

/**
 * Soma segundos ativos a partir de heartbeats: intervalos acima de IDLE_GAP_SECONDS são desconsiderados.
 */
export function activeSecondsFromHeartbeats(timestamps: Date[], maxGapSeconds = IDLE_GAP_SECONDS) {
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].getTime() - sorted[i - 1].getTime()) / 1000;
    if (gap > 0 && gap <= maxGapSeconds) total += gap;
  }
  return Math.round(total);
}

/**
 * Índice de engajamento (0–100) com pesos transparentes:
 * dias ativos 30%, aulas concluídas 25%, atividades submetidas 20%, interações com o tutor 15%, retornos 10%.
 */
export function engagementIndex(m: { activeDays: number; lessonsCompleted: number; totalLessons: number; submissions: number; tutorInteractions: number; returns: number }) {
  const cap = (v: number, max: number) => Math.min(1, max > 0 ? v / max : 0);
  const score =
    cap(m.activeDays, 10) * 30 +
    cap(m.lessonsCompleted, Math.max(1, m.totalLessons)) * 25 +
    cap(m.submissions, 6) * 20 +
    cap(m.tutorInteractions, 15) * 15 +
    cap(m.returns, 8) * 10;
  return Math.round(score);
}
