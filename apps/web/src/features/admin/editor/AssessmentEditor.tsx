import { assessmentSchema, ASSESSMENT_KIND_LABELS, DIAGNOSTIC_DIMENSIONS, QUESTION_TYPE_LABELS, QUESTION_TYPES, type AssessmentInput, type QuestionInput } from '@impulso/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Checkbox, Switch } from '@/components/ui/misc';
import { api, errorMessage } from '@/lib/api';
import type { Assessment } from '@/types/admin';
import { useCompetencies } from '../hooks';
import { SimpleSelect } from '../SimpleSelect';
import { zodIssues } from './issues';

type Kind = AssessmentInput['kind'];
const LIKERT_DEFAULT = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];

const KIND_HELP: Record<Kind, string> = {
  DIAGNOSTIC: 'Avalia conhecimentos prévios e contexto profissional. Combine questões objetivas (com competência) e autodeclaradas. A classificação usa 75% desempenho objetivo + 25% autopercepção.',
  MODULE_QUIZ: 'Verifica a aprendizagem do módulo. Liberada após a conclusão das aulas do módulo.',
  FINAL: 'Avaliação somativa. Use competências e dificuldade comparáveis às questões objetivas do diagnóstico para medir a evolução.',
  SATISFACTION: 'Pesquisa pós-curso (dados autodeclarados). Use o texto de apoio SATISFACAO ou APLICABILIDADE para que as respostas Likert alimentem os indicadores.',
};

const newQuestion = (kind: Kind): QuestionInput => ({
  type: kind === 'SATISFACTION' ? 'LIKERT' : 'SINGLE_CHOICE',
  prompt: '',
  helpText: null,
  dimension: null,
  competencyId: null,
  points: 1,
  isScored: true,
  selfReported: kind === 'SATISFACTION',
  explanation: null,
  likertLabels: kind === 'SATISFACTION' ? LIKERT_DEFAULT : [],
  options:
    kind === 'SATISFACTION'
      ? []
      : [
          { label: '', isCorrect: true, score: null, feedback: null },
          { label: '', isCorrect: false, score: null, feedback: null },
        ],
});

const toInput = (kind: Kind, moduleId: string | null, a: Assessment | null, defaultTitle: string): AssessmentInput => ({
  kind,
  moduleId,
  title: a?.title ?? defaultTitle,
  description: a?.description ?? '',
  passingScore: a?.passingScore ?? (kind === 'DIAGNOSTIC' || kind === 'SATISFACTION' ? 0 : kind === 'MODULE_QUIZ' ? 60 : 70),
  maxAttempts: a?.maxAttempts ?? (kind === 'DIAGNOSTIC' || kind === 'SATISFACTION' ? 1 : kind === 'MODULE_QUIZ' ? 3 : 2),
  questions: (a?.questions ?? []).map((q) => ({
    type: q.type as QuestionInput['type'],
    prompt: q.prompt,
    helpText: q.helpText,
    dimension: q.dimension,
    competencyId: q.competencyId,
    points: q.points,
    isScored: q.isScored,
    selfReported: q.selfReported,
    explanation: q.explanation,
    likertLabels: q.likertLabels ?? [],
    options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect, score: o.score, feedback: o.feedback })),
  })),
});

function QuestionCard({ q, index, kind, onChange, onRemove, onMove, disabled, total }: { q: QuestionInput; index: number; kind: Kind; onChange: (q: QuestionInput) => void; onRemove: () => void; onMove: (d: -1 | 1) => void; disabled?: boolean; total: number }) {
  const competencies = useCompetencies();
  const set = (patch: Partial<QuestionInput>) => onChange({ ...q, ...patch });
  const setType = (type: QuestionInput['type']) => {
    if (type === 'TRUE_FALSE') return set({ type, options: [{ label: 'Verdadeiro', isCorrect: true, score: null, feedback: null }, { label: 'Falso', isCorrect: false, score: null, feedback: null }], likertLabels: [] });
    if (type === 'LIKERT') return set({ type, options: [], likertLabels: q.likertLabels.length ? q.likertLabels : LIKERT_DEFAULT });
    if (type === 'OPEN') return set({ type, options: [], likertLabels: [], isScored: false });
    return set({ type, likertLabels: [], options: q.options.length >= 2 ? q.options : newQuestion('FINAL').options });
  };
  const setOpt = (i: number, patch: Partial<QuestionInput['options'][number]>) => set({ options: q.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });
  const single = q.type === 'SINGLE_CHOICE' || q.type === 'SCENARIO' || q.type === 'TRUE_FALSE';

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Questão {index + 1}</Badge>
        <SimpleSelect className="w-[200px]" value={q.type} onChange={(t) => setType(t as QuestionInput['type'])} options={QUESTION_TYPES.map((t) => ({ value: t, label: QUESTION_TYPE_LABELS[t] }))} disabled={disabled} />
        {q.selfReported && <Badge variant="outline">autodeclarada</Badge>}
        {!q.isScored && <Badge variant="muted">não pontuada</Badge>}
        {!disabled && (
          <div className="ml-auto flex">
            <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Mover para cima">
              <ArrowUp />
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Mover para baixo">
              <ArrowDown />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remover questão">
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        )}
      </div>
      <fieldset disabled={disabled} className="space-y-3">
        <Field label="Enunciado">
          <Textarea rows={2} value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Competência">
            <SimpleSelect value={q.competencyId ?? ''} onChange={(v) => set({ competencyId: v || null })} allLabel="Nenhuma" options={(competencies.data ?? []).map((c) => ({ value: c.id, label: c.name }))} disabled={disabled} />
          </Field>
          {kind === 'DIAGNOSTIC' && (
            <Field label="Dimensão do diagnóstico">
              <SimpleSelect value={q.dimension ?? ''} onChange={(v) => set({ dimension: v || null })} allLabel="Nenhuma" options={Object.entries(DIAGNOSTIC_DIMENSIONS).map(([k, l]) => ({ value: k, label: l }))} disabled={disabled} />
            </Field>
          )}
          <Field label="Texto de apoio / marcador">
            <Input value={q.helpText ?? ''} onChange={(e) => set({ helpText: e.target.value || null })} placeholder={kind === 'SATISFACTION' ? 'SATISFACAO ou APLICABILIDADE' : 'Opcional'} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <Switch checked={q.isScored} onCheckedChange={(c) => set({ isScored: c })} disabled={disabled} /> Pontuada
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={q.selfReported} onCheckedChange={(c) => set({ selfReported: c })} disabled={disabled} /> Autodeclarada (autopercepção)
          </label>
          <label className="flex items-center gap-2">
            Peso <Input type="number" min={0} max={100} className="h-8 w-20" value={q.points} onChange={(e) => set({ points: Number(e.target.value) })} />
          </label>
        </div>

        {q.type === 'LIKERT' && (
          <div className="space-y-1.5">
            <Label>Rótulos da escala (1 a 5)</Label>
            <div className="grid gap-2 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Input key={i} value={q.likertLabels[i] ?? ''} placeholder={`${i + 1}`} onChange={(e) => set({ likertLabels: Array.from({ length: 5 }, (_, j) => (j === i ? e.target.value : q.likertLabels[j] ?? '')) })} />
              ))}
            </div>
          </div>
        )}

        {q.type !== 'LIKERT' && q.type !== 'OPEN' && (
          <div className="space-y-2">
            <Label>Alternativas {single ? '(marque a correta)' : '(marque todas as corretas)'} — pontuação parcial opcional (0–100)</Label>
            {q.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={o.isCorrect}
                  onCheckedChange={(c) => set({ options: q.options.map((x, j) => (j === i ? { ...x, isCorrect: !!c } : single && c ? { ...x, isCorrect: false } : x)) })}
                  aria-label="Correta"
                  disabled={disabled}
                />
                <Input value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} placeholder={`Alternativa ${i + 1}`} disabled={disabled || q.type === 'TRUE_FALSE'} />
                <Input type="number" min={0} max={100} className="w-24" value={o.score ?? ''} placeholder="pts" onChange={(e) => setOpt(i, { score: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Pontuação parcial" />
                {!disabled && q.type !== 'TRUE_FALSE' && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => set({ options: q.options.filter((_, j) => j !== i) })} aria-label="Remover alternativa">
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {!disabled && q.type !== 'TRUE_FALSE' && q.options.length < 10 && (
              <Button type="button" variant="outline" size="sm" onClick={() => set({ options: [...q.options, { label: '', isCorrect: false, score: null, feedback: null }] })}>
                <Plus /> Alternativa
              </Button>
            )}
          </div>
        )}
        <Field label="Explicação (exibida após a correção)">
          <Textarea rows={2} value={q.explanation ?? ''} onChange={(e) => set({ explanation: e.target.value || null })} />
        </Field>
      </fieldset>
    </div>
  );
}

export function AssessmentEditor({ courseId, kind, moduleId = null, assessment, disabled, defaultTitle }: { courseId: string; kind: Kind; moduleId?: string | null; assessment: Assessment | null; disabled?: boolean; defaultTitle: string }) {
  const qc = useQueryClient();
  const [v, setV] = useState<AssessmentInput>(() => toInput(kind, moduleId, assessment, defaultTitle));
  useEffect(() => setV(toInput(kind, moduleId, assessment, defaultTitle)), [kind, moduleId, assessment, defaultTitle]);
  const set = (patch: Partial<AssessmentInput>) => setV((s) => ({ ...s, ...patch }));
  const setQ = (i: number, q: QuestionInput) => set({ questions: v.questions.map((x, j) => (j === i ? q : x)) });
  const move = (i: number, d: -1 | 1) => {
    const next = [...v.questions];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set({ questions: next });
  };

  const save = useMutation({
    mutationFn: () => {
      const parsed = assessmentSchema.safeParse(v);
      if (!parsed.success) throw new Error(zodIssues(parsed.error));
      return api.put(`/courses/${courseId}/assessments`, parsed.data);
    },
    onSuccess: () => {
      toast.success('Avaliação salva', { description: 'Rascunho salvo.' });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(e instanceof Error && !('status' in e) ? e.message : errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}/assessments/${assessment!.id}`),
    onSuccess: () => {
      toast.success('Avaliação removida');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{ASSESSMENT_KIND_LABELS[kind]}</CardTitle>
          <CardDescription>{KIND_HELP[kind]}</CardDescription>
        </div>
        {!disabled && assessment && (
          <ConfirmDialog
            title="Remover avaliação?"
            description="A avaliação e suas questões serão removidas deste rascunho."
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
        <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
          <Field label="Título">
            <Input value={v.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Nota mínima (%)">
            <Input type="number" min={0} max={100} value={v.passingScore} onChange={(e) => set({ passingScore: Number(e.target.value) })} />
          </Field>
          <Field label="Tentativas">
            <Input type="number" min={1} max={20} value={v.maxAttempts} onChange={(e) => set({ maxAttempts: Number(e.target.value) })} />
          </Field>
          <Field label="Descrição / instruções" className="sm:col-span-3">
            <Textarea rows={2} value={v.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </fieldset>
        <div className="space-y-3">
          {v.questions.map((q, i) => (
            <QuestionCard key={i} q={q} index={i} kind={kind} total={v.questions.length} onChange={(x) => setQ(i, x)} onRemove={() => set({ questions: v.questions.filter((_, j) => j !== i) })} onMove={(d) => move(i, d)} disabled={disabled} />
          ))}
          {!v.questions.length && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma questão cadastrada.</p>}
        </div>
        {!disabled && (
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => set({ questions: [...v.questions, newQuestion(kind)] })}>
              <Plus /> Adicionar questão
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              <Save /> Salvar avaliação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
