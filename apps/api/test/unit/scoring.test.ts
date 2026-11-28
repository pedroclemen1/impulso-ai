import { describe, expect, it } from 'vitest';
import { classifyDiagnostic, scoreAttempt, scoreQuestion, type ScorableQuestion } from '../../src/modules/assessments/scoring';

const q = (over: Partial<ScorableQuestion>): ScorableQuestion => ({
  id: 'q',
  type: 'SINGLE_CHOICE',
  points: 1,
  isScored: true,
  selfReported: false,
  competencyId: null,
  dimension: null,
  options: [
    { id: 'a', label: 'A', isCorrect: true, score: null },
    { id: 'b', label: 'B', isCorrect: false, score: null },
  ],
  ...over,
});

describe('pontuação de questões', () => {
  it('pontua múltipla escolha correta e incorreta', () => {
    expect(scoreQuestion(q({}), { questionId: 'q', selectedOptionIds: ['a'] })).toEqual({ score: 100, isCorrect: true });
    expect(scoreQuestion(q({}), { questionId: 'q', selectedOptionIds: ['b'] })).toEqual({ score: 0, isCorrect: false });
  });

  it('usa pontuação parcial em cenários', () => {
    const scenario = q({ type: 'SCENARIO', options: [{ id: 'a', isCorrect: true, score: 100 }, { id: 'b', isCorrect: false, score: 60 }] });
    expect(scoreQuestion(scenario, { questionId: 'q', selectedOptionIds: ['b'] }).score).toBe(60);
  });

  it('converte Likert 1–5 para 0–100', () => {
    const likert = q({ type: 'LIKERT', options: [], selfReported: true });
    expect(scoreQuestion(likert, { questionId: 'q', likertValue: 1 }).score).toBe(0);
    expect(scoreQuestion(likert, { questionId: 'q', likertValue: 5 }).score).toBe(100);
  });

  it('penaliza seleção incorreta em seleção múltipla', () => {
    const multi = q({ type: 'MULTIPLE_CHOICE', options: [{ id: 'a', isCorrect: true, score: null }, { id: 'b', isCorrect: true, score: null }, { id: 'c', isCorrect: false, score: null }] });
    expect(scoreQuestion(multi, { questionId: 'q', selectedOptionIds: ['a', 'b'] })).toEqual({ score: 100, isCorrect: true });
    expect(scoreQuestion(multi, { questionId: 'q', selectedOptionIds: ['a', 'c'] }).score).toBe(0);
  });

  it('não pontua questões abertas de contexto', () => {
    expect(scoreQuestion(q({ type: 'OPEN', isScored: false, options: [] }), { questionId: 'q', textAnswer: 'x' })).toEqual({ score: null, isCorrect: null });
  });

  it('separa notas objetivas e autodeclaradas e agrega por competência', () => {
    const qs = [q({ id: 'o1', competencyId: 'c1' }), q({ id: 'o2', competencyId: 'c1' }), q({ id: 's1', type: 'LIKERT', selfReported: true, options: [] })];
    const r = scoreAttempt(qs, [
      { questionId: 'o1', selectedOptionIds: ['a'] },
      { questionId: 'o2', selectedOptionIds: ['b'] },
      { questionId: 's1', likertValue: 5 },
    ]);
    expect(r.objectiveScore).toBe(50);
    expect(r.selfReportScore).toBe(100);
    expect(r.perCompetency.get('c1')?.score).toBe(50);
  });
});

describe('classificação diagnóstica', () => {
  it('classifica os quatro níveis', () => {
    expect(classifyDiagnostic({ objectiveScore: 10, selfReportScore: 10, scenarioScore: null }).level).toBe(1);
    expect(classifyDiagnostic({ objectiveScore: 45, selfReportScore: 40, scenarioScore: null }).level).toBe(2);
    expect(classifyDiagnostic({ objectiveScore: 65, selfReportScore: 60, scenarioScore: null }).level).toBe(3);
    expect(classifyDiagnostic({ objectiveScore: 90, selfReportScore: 80, scenarioScore: 90 }).level).toBe(4);
  });

  it('autopercepção alta não eleva o nível sem desempenho objetivo', () => {
    const r = classifyDiagnostic({ objectiveScore: 30, selfReportScore: 100, scenarioScore: null });
    expect(r.level).toBeLessThanOrEqual(2);
  });

  it('desempenho fraco em cenários práticos limita o nível a 3', () => {
    expect(classifyDiagnostic({ objectiveScore: 95, selfReportScore: 100, scenarioScore: 30 }).level).toBe(3);
  });
});
