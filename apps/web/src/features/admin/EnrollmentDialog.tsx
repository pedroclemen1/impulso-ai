import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, errorMessage } from '@/lib/api';
import { useCohorts, usePublishedCourses, useStudents } from './hooks';
import { MultiSelect } from './MultiSelect';
import { SimpleSelect } from './SimpleSelect';

type Mode = 'individual' | 'multiple' | 'cohort';

/** Alocação de curso: individual, vários participantes ou turma inteira. */
export function EnrollmentDialog({
  open,
  onOpenChange,
  defaultCourseId,
  defaultCohortId,
  defaultUserIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultCourseId?: string;
  defaultCohortId?: string;
  defaultUserIds?: string[];
}) {
  const qc = useQueryClient();
  const courses = usePublishedCourses();
  const students = useStudents();
  const cohorts = useCohorts();
  const initialMode: Mode = defaultCohortId ? 'cohort' : (defaultUserIds?.length ?? 0) > 1 ? 'multiple' : 'individual';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [courseId, setCourseId] = useState(defaultCourseId ?? '');
  const [userIds, setUserIds] = useState<string[]>(defaultUserIds ?? []);
  const [cohortId, setCohortId] = useState(defaultCohortId ?? '');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setCourseId(defaultCourseId ?? '');
      setUserIds(defaultUserIds ?? []);
      setCohortId(defaultCohortId ?? '');
      setDueDate('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const m = useMutation({
    mutationFn: () =>
      api.post<{ created: number; skippedExisting: number; skippedInvalid: number }>('/enrollments', {
        courseId,
        userIds: mode === 'cohort' ? [] : userIds,
        cohortId: mode === 'cohort' ? cohortId : undefined,
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
      }),
    onSuccess: (r) => {
      const extra = [r.skippedExisting ? `${r.skippedExisting} já alocado(s) — duplicidade evitada` : '', r.skippedInvalid ? `${r.skippedInvalid} inativo(s)/inválido(s) ignorado(s)` : ''].filter(Boolean).join(' · ');
      toast.success(`${r.created} alocação(ões) criada(s)`, { description: extra || undefined });
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['cohorts'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['participant'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const studentOptions = (students.data ?? []).map((s) => ({ value: s.id, label: s.name, hint: s.profile?.department ?? s.email }));
  const valid = !!courseId && (mode === 'cohort' ? !!cohortId : userIds.length > 0) && (!dueDate || dueDate >= startDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova alocação</DialogTitle>
          <DialogDescription>A alocação usa a versão publicada mais recente do curso. Participantes já alocados nessa versão são ignorados.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Curso publicado">
            <SimpleSelect value={courseId} onChange={setCourseId} placeholder="Selecione um curso" options={(courses.data ?? []).map((c) => ({ value: c.id, label: `${c.title} (v${c.publishedVersion?.versionNumber ?? 1})` }))} />
          </Field>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="multiple">Vários participantes</TabsTrigger>
              <TabsTrigger value="cohort">Turma inteira</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === 'individual' && (
            <Field label="Participante">
              <SimpleSelect value={userIds[0]} onChange={(v) => setUserIds(v ? [v] : [])} placeholder="Selecione o participante" options={studentOptions} />
            </Field>
          )}
          {mode === 'multiple' && (
            <Field label="Participantes">
              <MultiSelect options={studentOptions} value={userIds} onChange={setUserIds} placeholder="Buscar participante..." />
            </Field>
          )}
          {mode === 'cohort' && (
            <Field label="Turma" hint="Todos os membros ativos da turma serão alocados.">
              <SimpleSelect value={cohortId} onChange={setCohortId} placeholder="Selecione a turma" options={(cohorts.data ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.memberCount} membros)` }))} />
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data de início">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Prazo (opcional)" error={dueDate && dueDate < startDate ? 'O prazo deve ser posterior ao início' : undefined}>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => m.mutate()} disabled={!valid} loading={m.isPending}>
            Alocar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
