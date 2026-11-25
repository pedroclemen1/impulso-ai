import type { KnowledgeLevel } from '@impulso/shared';

/**
 * Motor de aprendizagem adaptativa — regras determinísticas.
 * A IA é usada para contextualizar e dar feedback; decisões pedagógicas fundamentais são tomadas aqui.
 */

export interface LessonPresentation {
  showBeginnerSupport: boolean;
  showAdvancedDeepDive: boolean;
  showGuidedSteps: boolean;
  showAdvancedChallenge: boolean;
  languageLevel: 'simples' | 'padrao' | 'tecnica';
  explanation: string;
}

export function lessonPresentation(level: number | null | undefined): LessonPresentation {
  const l = (level ?? 1) as KnowledgeLevel;
  return {
    showBeginnerSupport: l <= 2,
    showAdvancedDeepDive: l >= 3,
    showGuidedSteps: l <= 2,
    showAdvancedChallenge: l >= 3,
    languageLevel: l <= 1 ? 'simples' : l >= 4 ? 'tecnica' : 'padrao',
    explanation:
      l <= 1
        ? 'Você verá explicações introdutórias, exemplos simples e atividades guiadas passo a passo.'
        : l === 2
          ? 'Você verá explicações de apoio e atividades com orientação, com foco em qualidade de prompts.'
          : l === 3
            ? 'Você verá aprofundamentos e desafios extras envolvendo validação de resultados, vieses e otimização.'
            : 'Você verá cenários complexos, análise crítica e desafios envolvendo fluxos de trabalho completos.',
  };
}

export type ModuleEmphasis = 'REFORCO' | 'PADRAO' | 'REVISAO_RAPIDA';

export interface PathModule {
  moduleId: string;
  title: string;
  order: number;
  competencyIds: string[];
}

/**
 * Trilha sugerida: todos os módulos permanecem acessíveis (não há exclusão);
 * a ênfase muda conforme as lacunas identificadas por competência.
 */
export function recommendedPath(modules: PathModule[], competencyScores: Map<string, number>, level: number) {
  return modules
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const scores = m.competencyIds.map((c) => competencyScores.get(c)).filter((s): s is number => s !== undefined);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      let emphasis: ModuleEmphasis = 'PADRAO';
      let reason = 'Conteúdo essencial do curso.';
      if (avg !== null && avg < 50) {
        emphasis = 'REFORCO';
        reason = `Lacuna identificada no diagnóstico (${Math.round(avg)}%). Dedique atenção extra e use as pistas do tutor.`;
      } else if (avg !== null && avg >= 80 && level >= 3) {
        emphasis = 'REVISAO_RAPIDA';
        reason = `Bom domínio prévio (${Math.round(avg)}%). Revise rapidamente e aproveite os desafios avançados.`;
      }
      return { moduleId: m.moduleId, title: m.title, order: m.order, emphasis, reason, competencyScore: avg };
    });
}

/** Estima o nível atual a partir do nível inicial e do desempenho durante o curso. */
export function estimateCurrentLevel(initialLevel: number | null, duringScore: number | null, finalScore: number | null): number | null {
  if (initialLevel === null) return null;
  const evidence = finalScore ?? duringScore;
  if (evidence === null) return initialLevel;
  let level = initialLevel;
  if (evidence >= 85) level += 1;
  if (evidence >= 85 && finalScore !== null && finalScore >= 90 && initialLevel <= 2) level += 1;
  if (evidence < 45) level -= 1;
  return Math.max(1, Math.min(4, level));
}

/** Identifica dificuldades recorrentes: competências com baixo desempenho em várias evidências. */
export function recurringDifficulties(items: { competencyName: string; score: number }[], threshold = 60, minOccurrences = 2) {
  const map = new Map<string, number[]>();
  for (const i of items) map.set(i.competencyName, [...(map.get(i.competencyName) ?? []), i.score]);
  return [...map.entries()]
    .map(([name, scores]) => ({ name, low: scores.filter((s) => s < threshold).length, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .filter((d) => d.low >= minOccurrences)
    .sort((a, b) => a.avg - b.avg);
}
