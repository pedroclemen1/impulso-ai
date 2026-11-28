import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, activitySchema, type ActivityInput } from '@impulso/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { api, errorMessage } from '@/lib/api';
import type { Activity } from '@/types/admin';
import { ListEditor } from '../ListEditor';
import { SimpleSelect } from '../SimpleSelect';
import { zodIssues } from './issues';
import { MarkdownField } from './MarkdownField';

const DEFAULT_CRITERIA: ActivityInput['rubric']['criteria'] = [
  { key: 'compreensao_conceitual', name: 'Compreensão conceitual', description: 'Demonstra entendimento correto dos conceitos.', weight: 1, maxScore: 100, indicators: ['Usa os conceitos da aula corretamente'] },
  { key: 'contextualizacao', name: 'Contextualização profissional', description: 'Relaciona a solução ao contexto de recrutamento.', weight: 1.5, maxScore: 100, indicators: ['Considera vaga, empresa e público'] },
  { key: 'qualidade_solucao', name: 'Qualidade da solução', description: 'Proposta completa e aplicável.', weight: 1.5, maxScore: 100, indicators: ['Apresenta etapas claras'] },
  { key: 'uso_responsavel', name: 'Uso responsável de IA', description: 'Considera privacidade, vieses e supervisão humana.', weight: 1, maxScore: 100, indicators: ['Menciona anonimização e revisão humana'] },
];

export const toActivityInput = (a: Activity | null): ActivityInput => ({
  type: (a?.type as ActivityInput['type']) ?? 'OPEN_RESPONSE',
  title: a?.title ?? '',
  instructions: a?.instructions ?? '',
  scenario: a?.scenario ?? '',
  guidedSteps: a?.guidedSteps ?? [],
  advancedChallenge: a?.advancedChallenge ?? '',
  socraticQuestions: a?.socraticQuestions ?? [],
  hints: a?.hints ?? [],
  modelAnswer: a?.modelAnswer ?? '',
  expectedKeywords: a?.expectedKeywords ?? [],
  maxAttempts: a?.maxAttempts ?? 4,
  passingScore: a?.passingScore ?? 70,
  rubric: a?.rubric
    ? {
        title: a.rubric.title,
        description: a.rubric.description,
        criteria: a.rubric.criteria.map((c) => ({ key: c.key, name: c.name, description: c.description, weight: c.weight, maxScore: c.maxScore, indicators: c.indicators })),
      }
    : { title: 'Rubrica da atividade', description: '', criteria: DEFAULT_CRITERIA },
});

export function RubricEditor({ value, onChange, disabled }: { value: ActivityInput['rubric']; onChange: (v: ActivityInput['rubric']) => void; disabled?: boolean }) {
  const totalWeight = value.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const setCrit = (i: number, patch: Partial<ActivityInput['rubric']['criteria'][number]>) => onChange({ ...value, criteria: value.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título da rubrica">
          <Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} disabled={disabled} />
        </Field>
        <Field label="Descrição">
          <Input value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} disabled={disabled} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        A IA apenas sugere a nota de cada critério (0–100). Pesos e critérios são definidos aqui e a nota ponderada é calculada pelo sistema. Soma dos pesos: <strong>{totalWeight.toFixed(1)}</strong>.
      </p>
      {value.criteria.map((c, i) => (
        <div key={i} className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px_90px_auto]">
            <Field label="Chave">
              <Input value={c.key} onChange={(e) => setCrit(i, { key: e.target.value })} placeholder="contextualizacao" disabled={disabled} />
            </Field>
            <Field label="Nome do critério">
              <Input value={c.name} onChange={(e) => setCrit(i, { name: e.target.value })} disabled={disabled} />
            </Field>
            <Field label="Peso">
              <Input type="number" step="0.5" min="0.1" value={c.weight} onChange={(e) => setCrit(i, { weight: Number(e.target.value) })} disabled={disabled} />
            </Field>
            <Field label="Máx.">
              <Input type="number" min="1" max="100" value={c.maxScore} onChange={(e) => setCrit(i, { maxScore: Number(e.target.value) })} disabled={disabled} />
            </Field>
            {!disabled && (
              <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => onChange({ ...value, criteria: value.criteria.filter((_, j) => j !== i) })} aria-label="Remover critério">
                <Trash2 className="text-destructive" />
              </Button>
            )}
          </div>
          <Field label="Descrição">
            <Input value={c.description} onChange={(e) => setCrit(i, { description: e.target.value })} disabled={disabled} />
          </Field>
          <div className="space-y-1.5">
            <Label>Indicadores de desempenho esperado</Label>
            <ListEditor value={c.indicators} onChange={(v) => setCrit(i, { indicators: v })} addLabel="Adicionar indicador" disabled={disabled} max={10} />
          </div>
        </div>
      ))}
      {!disabled && value.criteria.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, criteria: [...value.criteria, { key: `criterio_${value.criteria.length + 1}`, name: 'Novo critério', description: '', weight: 1, maxScore: 100, indicators: [] }] })}>
          <Plus /> Adicionar critério
        </Button>
      )}
    </div>
  );
}

export function ActivityEditor({ courseId, lessonId, activity, disabled }: { courseId: string; lessonId: string; activity: Activity | null; disabled?: boolean }) {
  const qc = useQueryClient();
  const [v, setV] = useState<ActivityInput>(() => toActivityInput(activity));
  const [enabled, setEnabled] = useState(!!activity);
  useEffect(() => {
    setV(toActivityInput(activity));
    setEnabled(!!activity);
  }, [activity, lessonId]);
  const set = (patch: Partial<ActivityInput>) => setV((s) => ({ ...s, ...patch }));

  const save = useMutation({
    mutationFn: () => {
      const parsed = activitySchema.safeParse({ ...v, advancedChallenge: v.advancedChallenge || null, guidedSteps: v.guidedSteps.filter(Boolean), hints: v.hints.filter(Boolean), socraticQuestions: v.socraticQuestions.filter(Boolean), expectedKeywords: (v.expectedKeywords ?? []).filter(Boolean) });
      if (!parsed.success) throw new Error(zodIssues(parsed.error));
      return api.put(`/courses/${courseId}/lessons/${lessonId}/activity`, parsed.data);
    },
    onSuccess: () => {
      toast.success('Atividade salva', { description: 'Rascunho salvo.' });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(e instanceof Error && !('status' in e) ? e.message : errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}/lessons/${lessonId}/activity`),
    onSuccess: () => {
      toast.success('Atividade removida');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividade prática</CardTitle>
          <CardDescription>Esta aula não possui atividade. Aulas sem atividade são concluídas com a reflexão do participante.</CardDescription>
        </CardHeader>
        {!disabled && (
          <CardContent>
            <Button variant="outline" onClick={() => setEnabled(true)}>
              <Plus /> Adicionar atividade prática
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Atividade prática e rubrica</CardTitle>
          <CardDescription>Etapa “Praticar”: problema realista avaliado com rubrica e feedback socrático.</CardDescription>
        </div>
        {!disabled && activity && (
          <ConfirmDialog
            title="Remover atividade?"
            description="A atividade e sua rubrica serão removidas deste rascunho."
            destructive
            confirmLabel="Remover"
            onConfirm={() => remove.mutateAsync()}
            trigger={
              <Button variant="ghost" size="sm">
                <Trash2 className="text-destructive" /> Remover
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <fieldset disabled={disabled} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <Field label="Título">
              <Input value={v.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Tipo">
              <SimpleSelect value={v.type} onChange={(t) => set({ type: t as ActivityInput['type'] })} options={ACTIVITY_TYPES.map((t) => ({ value: t, label: ACTIVITY_TYPE_LABELS[t] }))} disabled={disabled} />
            </Field>
          </div>
          <MarkdownField label="Enunciado" value={v.instructions} onChange={(x) => set({ instructions: x })} rows={4} disabled={disabled} />
          <MarkdownField label="Cenário (use apenas dados fictícios)" value={v.scenario} onChange={(x) => set({ scenario: x })} rows={5} disabled={disabled} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Passos guiados (níveis 1–2)</Label>
              <ListEditor value={v.guidedSteps} onChange={(x) => set({ guidedSteps: x })} addLabel="Adicionar passo" disabled={disabled} max={10} />
            </div>
            <div className="space-y-1.5">
              <Label>Perguntas socráticas</Label>
              <ListEditor value={v.socraticQuestions} onChange={(x) => set({ socraticQuestions: x })} addLabel="Adicionar pergunta" disabled={disabled} max={10} />
            </div>
            <div className="space-y-1.5">
              <Label>Pistas progressivas (da mais sutil à mais direta)</Label>
              <ListEditor value={v.hints} onChange={(x) => set({ hints: x })} addLabel="Adicionar pista" multiline disabled={disabled} max={5} />
            </div>
            <div className="space-y-1.5">
              <Label>Palavras-chave esperadas</Label>
              <ListEditor value={v.expectedKeywords ?? []} onChange={(x) => set({ expectedKeywords: x })} addLabel="Adicionar palavra-chave" disabled={disabled} max={30} />
              <p className="text-xs text-muted-foreground">Usadas pelo avaliador demonstrativo e como referência de fallback.</p>
            </div>
          </div>
          <MarkdownField label="Desafio avançado (níveis 3–4)" value={v.advancedChallenge ?? ''} onChange={(x) => set({ advancedChallenge: x })} rows={3} disabled={disabled} />
          <MarkdownField label="Solução comentada (confidencial — liberada após tentativas)" value={v.modelAnswer} onChange={(x) => set({ modelAnswer: x })} rows={6} disabled={disabled} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tentativas máximas">
              <Input type="number" min={1} max={10} value={v.maxAttempts} onChange={(e) => set({ maxAttempts: Number(e.target.value) })} />
            </Field>
            <Field label="Nota de domínio (%)">
              <Input type="number" min={0} max={100} value={v.passingScore} onChange={(e) => set({ passingScore: Number(e.target.value) })} />
            </Field>
          </div>
        </fieldset>
        <div className="space-y-2 border-t pt-4">
          <h4 className="font-semibold">Rubrica de avaliação</h4>
          <RubricEditor value={v.rubric} onChange={(r) => set({ rubric: r })} disabled={disabled} />
        </div>
        {!disabled && (
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              <Save /> Salvar atividade
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
