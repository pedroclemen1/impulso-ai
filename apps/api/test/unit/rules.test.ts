import { describe, expect, it } from 'vitest';
import { computeWeightedScore } from '../../src/modules/activities/weighted-score';
import { estimateCurrentLevel, lessonPresentation, recommendedPath } from '../../src/modules/learning/personalization';
import { computeProgress, isLessonComplete } from '../../src/modules/learning/progress';
import { canAccessOwnedResource, assertOwnership } from '../../src/shared/authorization';
import { AppError } from '../../src/shared/errors';

describe('nota ponderada da rubrica', () => {
  const criteria = [
    { id: 'id1', key: 'clareza', weight: 1, maxScore: 100 },
    { id: 'id2', key: 'contexto', weight: 3, maxScore: 100 },
  ];
  it('calcula a média ponderada pelos pesos do administrador', () => {
    expect(computeWeightedScore(criteria, [{ criterionId: 'clareza', score: 40 }, { criterionId: 'contexto', score: 80 }]).weightedScore).toBe(70);
  });
  it('ignora critérios inventados pela IA e zera os ausentes', () => {
    const r = computeWeightedScore(criteria, [{ criterionId: 'clareza', score: 100 }, { criterionId: 'criterio_falso', score: 100 }]);
    expect(r.weightedScore).toBe(25);
    expect(r.missingCriteria).toEqual(['contexto']);
  });
  it('limita notas ao máximo do critério', () => {
    expect(computeWeightedScore([criteria[0]], [{ criterionId: 'clareza', score: 150 }]).weightedScore).toBe(100);
  });
});

describe('progresso e conclusão', () => {
  const structure = {
    lessons: [
      { id: 'l1', moduleId: 'm1', hasActivity: true },
      { id: 'l2', moduleId: 'm1', hasActivity: false },
    ],
    moduleQuizzes: [{ assessmentId: 'q1', moduleId: 'm1' }],
    hasFinalAssessment: true,
  };
  const state = (over: object = {}) => ({ completedLessonIds: new Set<string>(), passedQuizIds: new Set<string>(), attemptedQuizIds: new Set<string>(), finalPassed: false, finalAttempted: false, ...over });

  it('conta apenas unidades concluídas (aulas, avaliações de módulo, final aprovada)', () => {
    expect(computeProgress(structure, state()).percent).toBe(0);
    expect(computeProgress(structure, state({ completedLessonIds: new Set(['l1']) })).percent).toBe(25);
    const done = computeProgress(structure, state({ completedLessonIds: new Set(['l1', 'l2']), attemptedQuizIds: new Set(['q1']), finalPassed: true }));
    expect(done.percent).toBe(100);
    expect(done.completed).toBe(true);
  });
  it('só libera a avaliação final após aulas e avaliações de módulo', () => {
    expect(computeProgress(structure, state({ completedLessonIds: new Set(['l1', 'l2']) })).finalUnlocked).toBe(false);
    expect(computeProgress(structure, state({ completedLessonIds: new Set(['l1', 'l2']), attemptedQuizIds: new Set(['q1']) })).finalUnlocked).toBe(true);
  });
  it('não conclui o curso sem aprovação na final', () => {
    const r = computeProgress(structure, state({ completedLessonIds: new Set(['l1', 'l2']), attemptedQuizIds: new Set(['q1']), finalAttempted: true }));
    expect(r.completed).toBe(false);
    expect(r.unmet.length).toBe(1);
  });
  it('exige atividade avaliada e reflexão para concluir aula', () => {
    expect(isLessonComplete({ hasActivity: true, evaluatedSubmissions: 0, consolidated: true, reflection: 'uma reflexão válida' })).toBe(false);
    expect(isLessonComplete({ hasActivity: true, evaluatedSubmissions: 1, consolidated: true, reflection: 'curta' })).toBe(false);
    expect(isLessonComplete({ hasActivity: true, evaluatedSubmissions: 1, consolidated: true, reflection: 'uma reflexão válida' })).toBe(true);
  });
});

describe('motor adaptativo', () => {
  it('apresenta apoio para iniciantes e desafios para avançados', () => {
    expect(lessonPresentation(1)).toMatchObject({ showBeginnerSupport: true, showGuidedSteps: true, showAdvancedChallenge: false });
    expect(lessonPresentation(4)).toMatchObject({ showBeginnerSupport: false, showAdvancedDeepDive: true, showAdvancedChallenge: true });
  });
  it('trilha nunca exclui módulos, apenas muda a ênfase', () => {
    const path = recommendedPath(
      [
        { moduleId: 'a', title: 'A', order: 1, competencyIds: ['c1'] },
        { moduleId: 'b', title: 'B', order: 2, competencyIds: ['c2'] },
      ],
      new Map([['c1', 20], ['c2', 95]]),
      4,
    );
    expect(path).toHaveLength(2);
    expect(path[0].emphasis).toBe('REFORCO');
    expect(path[1].emphasis).toBe('REVISAO_RAPIDA');
  });
  it('estima o nível atual a partir do desempenho', () => {
    expect(estimateCurrentLevel(2, 90, null)).toBe(3);
    expect(estimateCurrentLevel(3, 30, null)).toBe(2);
    expect(estimateCurrentLevel(null, 90, null)).toBeNull();
  });
});

describe('autorização por recurso', () => {
  it('estudante acessa apenas recursos próprios; administrador acessa todos', () => {
    expect(canAccessOwnedResource({ id: 'u1', role: 'STUDENT' }, 'u1')).toBe(true);
    expect(canAccessOwnedResource({ id: 'u1', role: 'STUDENT' }, 'u2')).toBe(false);
    expect(canAccessOwnedResource({ id: 'adm', role: 'SUPER_ADMIN' }, 'u2')).toBe(true);
  });
  it('responde 404 (não 403) para estudante, sem revelar a existência do recurso', () => {
    try {
      assertOwnership({ id: 'u1', role: 'STUDENT' }, { userId: 'u2' });
      expect.unreachable();
    } catch (e) {
      expect((e as AppError).statusCode).toBe(404);
    }
  });
});
