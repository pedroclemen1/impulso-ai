import { zodResolver } from '@hookform/resolvers/zod';
import { courseMetaSchema, DIFFICULTIES, DIFFICULTY_LABELS, type CourseMetaInput } from '@impulso/shared';
import { Check } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/misc';
import { cn, COVER_COLORS } from '@/lib/utils';
import { useCompetencies } from './hooks';
import { ListEditor } from './ListEditor';
import { MultiSelect } from './MultiSelect';
import { SimpleSelect } from './SimpleSelect';

export const emptyCourseMeta: CourseMetaInput = {
  title: '',
  description: '',
  objectives: [],
  targetAudience: '',
  prerequisites: '',
  difficulty: 'BEGINNER',
  estimatedHours: 2,
  coverColor: 'indigo',
  coverImageUrl: '',
  competencyIds: [],
  completionCriteria: { minLessonCompletion: 100, requireModuleQuizzes: true, requireFinalAssessment: true, finalAssessmentPassingScore: 70 },
};

export function CourseMetaForm({ defaultValues, onSubmit, submitLabel, disabled }: { defaultValues: CourseMetaInput; onSubmit: (v: CourseMetaInput) => Promise<unknown>; submitLabel: string; disabled?: boolean }) {
  const competencies = useCompetencies();
  const form = useForm<CourseMetaInput>({ resolver: zodResolver(courseMetaSchema), defaultValues });
  const { register, control, formState } = form;
  const e = formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        await onSubmit({ ...v, objectives: v.objectives.filter((o) => o.trim()) });
        form.reset(v);
      })}
      className="space-y-5"
    >
      <fieldset disabled={disabled} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do curso</CardTitle>
            <CardDescription>Dados exibidos aos participantes na página do curso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Título" error={e.title?.message}>
              <Input {...register('title')} placeholder="Ex.: Inteligência Artificial Aplicada ao Recrutamento" />
            </Field>
            <Field label="Descrição" error={e.description?.message}>
              <Textarea rows={4} {...register('description')} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Público-alvo" error={e.targetAudience?.message}>
                <Textarea rows={2} {...register('targetAudience')} />
              </Field>
              <Field label="Pré-requisitos" error={e.prerequisites?.message}>
                <Textarea rows={2} {...register('prerequisites')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nível de dificuldade">
                <Controller control={control} name="difficulty" render={({ field }) => <SimpleSelect value={field.value} onChange={(v) => field.onChange(v)} options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))} disabled={disabled} />} />
              </Field>
              <Field label="Carga horária (horas)" error={e.estimatedHours?.message}>
                <Input type="number" step="0.5" min="0.25" {...register('estimatedHours', { valueAsNumber: true })} />
              </Field>
              <Field label="Cor de capa">
                <Controller
                  control={control}
                  name="coverColor"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(COVER_COLORS).map(([key, cls]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => field.onChange(key)}
                          className={cn('flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white ring-offset-2', cls, field.value === key && 'ring-2 ring-primary')}
                          aria-label={`Cor ${key}`}
                        >
                          {field.value === key && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objetivos e competências</CardTitle>
            <CardDescription>Objetivos de aprendizagem (Design instrucional) e competências trabalhadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivos de aprendizagem</Label>
              <Controller control={control} name="objectives" render={({ field }) => <ListEditor value={field.value} onChange={field.onChange} placeholder="Ex.: Elaborar prompts contextualizados para descrições de vagas" addLabel="Adicionar objetivo" disabled={disabled} />} />
              {e.objectives && <p className="text-xs text-destructive">Revise os objetivos (mínimo de 3 caracteres cada).</p>}
            </div>
            <div className="space-y-2">
              <Label>Competências trabalhadas</Label>
              <Controller
                control={control}
                name="competencyIds"
                render={({ field }) => (
                  <MultiSelect options={(competencies.data ?? []).map((c) => ({ value: c.id, label: c.name, hint: c.category }))} value={field.value} onChange={field.onChange} placeholder="Buscar competência..." height={180} disabled={disabled} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Critérios de conclusão</CardTitle>
            <CardDescription>O progresso considera apenas atividades efetivamente concluídas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Aulas concluídas exigidas (%)">
              <Input type="number" min={0} max={100} {...register('completionCriteria.minLessonCompletion', { valueAsNumber: true })} />
            </Field>
            <Field label="Nota mínima na avaliação final (%)">
              <Input type="number" min={0} max={100} {...register('completionCriteria.finalAssessmentPassingScore', { valueAsNumber: true })} />
            </Field>
            <Controller
              control={control}
              name="completionCriteria.requireModuleQuizzes"
              render={({ field }) => (
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={disabled} /> Exigir avaliações de módulo
                </label>
              )}
            />
            <Controller
              control={control}
              name="completionCriteria.requireFinalAssessment"
              render={({ field }) => (
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={disabled} /> Exigir aprovação na avaliação final
                </label>
              )}
            />
          </CardContent>
        </Card>
      </fieldset>
      {!disabled && (
        <div className="flex justify-end">
          <Button type="submit" loading={formState.isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
