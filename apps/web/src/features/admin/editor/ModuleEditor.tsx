import { moduleSchema, type ModuleInput } from '@impulso/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { api, errorMessage } from '@/lib/api';
import type { Module, VersionTree } from '@/types/admin';
import { ListEditor } from '../ListEditor';
import { zodIssues } from './issues';

export function ModuleEditor({ courseId, module, disabled, onDeleted }: { courseId: string; module: Module; disabled?: boolean; onDeleted: () => void }) {
  const qc = useQueryClient();
  const init = (): ModuleInput => ({ title: module.title, description: module.description, objectives: module.objectives ?? [] });
  const [v, setV] = useState<ModuleInput>(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setV(init()), [module]);
  const save = useMutation({
    mutationFn: () => {
      const parsed = moduleSchema.safeParse({ ...v, objectives: v.objectives.filter(Boolean) });
      if (!parsed.success) throw new Error(zodIssues(parsed.error));
      return api.patch(`/courses/${courseId}/modules/${module.id}`, parsed.data);
    },
    onSuccess: () => {
      toast.success('Módulo salvo', { description: 'Rascunho salvo.' });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(e instanceof Error && !('status' in e) ? e.message : errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}/modules/${module.id}`),
    onSuccess: () => {
      toast.success('Módulo excluído');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      onDeleted();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Módulo {module.order}</CardTitle>
          <CardDescription>{module.lessons.length} aula(s). Use a árvore para adicionar e reordenar aulas.</CardDescription>
        </div>
        {!disabled && (
          <ConfirmDialog
            title="Excluir módulo?"
            description="Todas as aulas, atividades e a avaliação deste módulo serão removidas do rascunho."
            destructive
            confirmLabel="Excluir"
            onConfirm={() => remove.mutateAsync()}
            trigger={
              <Button variant="ghost" size="sm">
                <Trash2 className="text-destructive" /> Excluir
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent>
        <fieldset disabled={disabled} className="space-y-4">
          <Field label="Título">
            <Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <Textarea rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
          </Field>
          <div className="space-y-1.5">
            <Label>Objetivos do módulo</Label>
            <ListEditor value={v.objectives} onChange={(o) => setV({ ...v, objectives: o })} addLabel="Adicionar objetivo" disabled={disabled} />
          </div>
        </fieldset>
        {!disabled && (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              <Save /> Salvar módulo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ADDIE_FIELDS = [
  { key: 'analysis', label: 'Analysis — Análise', hint: 'Perfil dos participantes, contexto, necessidades de treinamento e lacunas (o diagnóstico inicial é a principal fonte).' },
  { key: 'design', label: 'Design — Design instrucional', hint: 'Objetivos educacionais, competências, sequência pedagógica, estratégias e critérios de avaliação.' },
  { key: 'development', label: 'Development — Desenvolvimento', hint: 'Como os conteúdos, exercícios, rubricas e avaliações foram produzidos (manual e/ou com IA).' },
  { key: 'implementation', label: 'Implementation — Implementação', hint: 'Disponibilização aos participantes e acompanhamento de participação, progresso e dificuldades.' },
  { key: 'evaluation', label: 'Evaluation — Avaliação', hint: 'Como serão mensuradas evolução, competências, eficácia, satisfação e aplicabilidade.' },
] as const;

export function AddieEditor({ courseId, version, disabled }: { courseId: string; version: VersionTree; disabled?: boolean }) {
  const qc = useQueryClient();
  const init = () => Object.fromEntries(ADDIE_FIELDS.map((f) => [f.key, version.addieNotes?.[f.key] ?? ''])) as Record<(typeof ADDIE_FIELDS)[number]['key'], string>;
  const [v, setV] = useState(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setV(init()), [version]);
  const save = useMutation({
    mutationFn: () => api.patch(`/courses/${courseId}/addie`, v),
    onSuccess: () => {
      toast.success('Notas ADDIE salvas');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metodologia ADDIE</CardTitle>
        <CardDescription>Registre o planejamento de cada etapa. Os indicadores correspondentes aparecem na página de analytics do curso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <fieldset disabled={disabled} className="space-y-4">
          {ADDIE_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <Textarea rows={3} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            </Field>
          ))}
        </fieldset>
        {!disabled && (
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              <Save /> Salvar ADDIE
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
