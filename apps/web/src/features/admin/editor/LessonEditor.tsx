import { lessonSchema, type LessonInput } from '@impulso/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { api, errorMessage } from '@/lib/api';
import type { Lesson } from '@/types/admin';
import { useCompetencies } from '../hooks';
import { ListEditor } from '../ListEditor';
import { SimpleSelect } from '../SimpleSelect';
import { ActivityEditor } from './ActivityEditor';
import { zodIssues } from './issues';
import { MarkdownField } from './MarkdownField';

const toInput = (l: Lesson): LessonInput => ({
  title: l.title,
  summary: l.summary,
  estimatedMinutes: l.estimatedMinutes,
  learnContent: l.learnContent,
  beginnerSupport: l.beginnerSupport ?? '',
  advancedDeepDive: l.advancedDeepDive ?? '',
  contextContent: l.contextContent,
  videoUrl: l.videoUrl ?? '',
  resources: l.resources ?? [],
  reflectionPrompt: l.reflectionPrompt,
  keyTakeaways: l.keyTakeaways ?? [],
  competencies: l.competencies.map((c) => ({ competencyId: c.competencyId, weight: c.weight })),
});

export function LessonEditor({ courseId, lesson, disabled, onDeleted }: { courseId: string; lesson: Lesson; disabled?: boolean; onDeleted: () => void }) {
  const qc = useQueryClient();
  const competencies = useCompetencies();
  const [v, setV] = useState<LessonInput>(() => toInput(lesson));
  useEffect(() => setV(toInput(lesson)), [lesson]);
  const set = (patch: Partial<LessonInput>) => setV((s) => ({ ...s, ...patch }));

  const save = useMutation({
    mutationFn: () => {
      const parsed = lessonSchema.safeParse({
        ...v,
        videoUrl: v.videoUrl || null,
        beginnerSupport: v.beginnerSupport || null,
        advancedDeepDive: v.advancedDeepDive || null,
        keyTakeaways: v.keyTakeaways.filter(Boolean),
        resources: v.resources.filter((r) => r.label && r.url),
      });
      if (!parsed.success) throw new Error(zodIssues(parsed.error));
      return api.patch(`/courses/${courseId}/lessons/${lesson.id}`, parsed.data);
    },
    onSuccess: () => {
      toast.success('Aula salva', { description: 'Rascunho salvo.' });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(e instanceof Error && !('status' in e) ? e.message : errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}/lessons/${lesson.id}`),
    onSuccess: () => {
      toast.success('Aula excluída');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      onDeleted();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const compOptions = (competencies.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">Aula</CardTitle>
            <CardDescription>Etapas Aprender, Contextualizar, Refletir e Consolidar.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/courses/${courseId}/preview/${lesson.id}`}>
                <Eye /> Visualizar como estudante
              </Link>
            </Button>
            {!disabled && (
              <ConfirmDialog
                title="Excluir aula?"
                description="A aula, sua atividade e rubrica serão removidas deste rascunho."
                destructive
                confirmLabel="Excluir"
                onConfirm={() => remove.mutateAsync()}
                trigger={
                  <Button variant="ghost" size="sm" aria-label="Excluir aula">
                    <Trash2 className="text-destructive" />
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <fieldset disabled={disabled} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Field label="Título">
                <Input value={v.title} onChange={(e) => set({ title: e.target.value })} />
              </Field>
              <Field label="Duração (min)">
                <Input type="number" min={1} max={600} value={v.estimatedMinutes} onChange={(e) => set({ estimatedMinutes: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Resumo">
              <Textarea rows={2} value={v.summary} onChange={(e) => set({ summary: e.target.value })} />
            </Field>
            <MarkdownField label="1. Aprender — conteúdo teórico" value={v.learnContent} onChange={(x) => set({ learnContent: x })} rows={14} disabled={disabled} />
            <div className="grid gap-4 lg:grid-cols-2">
              <MarkdownField label="Apoio introdutório (níveis 1–2)" value={v.beginnerSupport ?? ''} onChange={(x) => set({ beginnerSupport: x })} rows={6} disabled={disabled} />
              <MarkdownField label="Aprofundamento (níveis 3–4)" value={v.advancedDeepDive ?? ''} onChange={(x) => set({ advancedDeepDive: x })} rows={6} disabled={disabled} />
            </div>
            <MarkdownField label="2. Contextualizar — exemplo em recrutamento e seleção" value={v.contextContent} onChange={(x) => set({ contextContent: x })} rows={8} disabled={disabled} />
            <Field label="Vídeo (URL opcional)">
              <Input value={v.videoUrl ?? ''} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
            <div className="space-y-1.5">
              <Label>Links externos</Label>
              {v.resources.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={r.label} placeholder="Rótulo" onChange={(e) => set({ resources: v.resources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <Input value={r.url} placeholder="https://" onChange={(e) => set({ resources: v.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                  {!disabled && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => set({ resources: v.resources.filter((_, j) => j !== i) })} aria-label="Remover link">
                      <Trash2 className="text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {!disabled && (
                <Button type="button" variant="outline" size="sm" onClick={() => set({ resources: [...v.resources, { label: '', url: '' }] })}>
                  <Plus /> Adicionar link
                </Button>
              )}
            </div>
            <Field label="4. Refletir — pergunta de reflexão">
              <Textarea rows={2} value={v.reflectionPrompt} onChange={(e) => set({ reflectionPrompt: e.target.value })} />
            </Field>
            <div className="space-y-1.5">
              <Label>6. Consolidar — aprendizados-chave</Label>
              <ListEditor value={v.keyTakeaways} onChange={(x) => set({ keyTakeaways: x })} addLabel="Adicionar aprendizado" disabled={disabled} />
            </div>
            <div className="space-y-1.5">
              <Label>Competências desenvolvidas (com peso)</Label>
              {v.competencies.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <SimpleSelect
                    className="flex-1"
                    value={c.competencyId}
                    onChange={(id) => set({ competencies: v.competencies.map((x, j) => (j === i ? { ...x, competencyId: id } : x)) })}
                    options={compOptions}
                    placeholder="Competência"
                    disabled={disabled}
                  />
                  <Input type="number" step="0.5" min={0.1} max={10} className="w-24" value={c.weight} onChange={(e) => set({ competencies: v.competencies.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} aria-label="Peso" />
                  {!disabled && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => set({ competencies: v.competencies.filter((_, j) => j !== i) })} aria-label="Remover competência">
                      <Trash2 className="text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {!disabled && compOptions.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => set({ competencies: [...v.competencies, { competencyId: compOptions.find((o) => !v.competencies.some((c) => c.competencyId === o.value))?.value ?? compOptions[0].value, weight: 1 }] })}>
                  <Plus /> Adicionar competência
                </Button>
              )}
            </div>
          </fieldset>
          {!disabled && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => save.mutate()} loading={save.isPending}>
                <Save /> Salvar aula
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <ActivityEditor courseId={courseId} lessonId={lesson.id} activity={lesson.activity} disabled={disabled} />
    </div>
  );
}
