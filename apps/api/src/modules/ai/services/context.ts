import { levelLabel } from '@impulso/shared';
import type { Activity, Rubric, RubricCriterion, StudentProfile } from '@prisma/client';
import { asStringArray } from '../../../shared/http';
import type { ActivityContext, RubricCriterionContext, StudentContext } from '../inputs';

export const activityContext = (a: Activity): ActivityContext => ({
  title: a.title,
  type: a.type,
  instructions: a.instructions,
  scenario: a.scenario,
  socraticQuestions: asStringArray(a.socraticQuestions),
  hints: asStringArray(a.hints),
  modelAnswer: a.modelAnswer,
  expectedKeywords: asStringArray(a.expectedKeywords),
  passingScore: a.passingScore,
});

export const rubricContext = (rubric: (Rubric & { criteria: RubricCriterion[] }) | null): RubricCriterionContext[] =>
  (rubric?.criteria ?? []).map((c) => ({
    key: c.key,
    name: c.name,
    description: c.description,
    weight: c.weight,
    maxScore: c.maxScore,
    indicators: asStringArray(c.indicators),
  }));

export const studentContext = (level: number | null | undefined, profile?: StudentProfile | null): StudentContext => ({
  level: level ?? 1,
  levelLabel: levelLabel(level ?? 1),
  jobTitle: profile?.jobTitle ?? null,
  professionalContext: profile?.professionalContext ?? null,
});

/** Objetivo da aula: resumo ou primeira frase do conteúdo aprovado. */
export const lessonObjective = (l: { summary: string; learnContent: string }) =>
  l.summary || l.learnContent.replace(/[#>*_`]/g, '').trim().split('\n').find((x) => x.trim().length > 20)?.slice(0, 300) || '';
