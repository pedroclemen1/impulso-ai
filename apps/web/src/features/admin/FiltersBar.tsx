import { CalendarRange } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { AnalyticsFilters } from '@/types/admin';
import { useFilterOptions } from './hooks';
import { SimpleSelect } from './SimpleSelect';

const PRESETS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export interface FilterState extends AnalyticsFilters {
  preset: string;
}

export const defaultFilters: FilterState = { preset: '30' };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Converte o estado do filtro em parâmetros da API. */
export function toQuery(f: FilterState): AnalyticsFilters {
  const q: AnalyticsFilters = { courseId: f.courseId || undefined, cohortId: f.cohortId || undefined, userId: f.userId || undefined };
  if (f.preset === 'custom') {
    if (f.from) q.from = new Date(`${f.from}T00:00:00`).toISOString();
    if (f.to) q.to = new Date(`${f.to}T23:59:59`).toISOString();
  } else {
    // Ancorado no início do dia: mantém a chave de cache estável entre renderizações.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Number(f.preset));
    q.from = start.toISOString();
  }
  return q;
}

export function FiltersBar({ value, onChange, show = { course: true, cohort: true, participant: true } }: { value: FilterState; onChange: (v: FilterState) => void; show?: { course?: boolean; cohort?: boolean; participant?: boolean } }) {
  const opts = useFilterOptions();
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <CalendarRange className="h-4 w-4 text-muted-foreground" />
      <SimpleSelect
        className="w-[170px]"
        value={value.preset}
        onChange={(v) => set({ preset: v || '30', ...(v === 'custom' ? { from: value.from ?? iso(new Date(Date.now() - 30 * 86_400_000)), to: value.to ?? iso(new Date()) } : {}) })}
        options={PRESETS}
        ariaLabel="Período"
      />
      {value.preset === 'custom' && (
        <>
          <Input type="date" className="w-[150px]" value={value.from ?? ''} onChange={(e) => set({ from: e.target.value })} aria-label="Data inicial" />
          <Input type="date" className="w-[150px]" value={value.to ?? ''} onChange={(e) => set({ to: e.target.value })} aria-label="Data final" />
        </>
      )}
      {show.course && (
        <SimpleSelect className="w-[220px]" value={value.courseId} onChange={(v) => set({ courseId: v })} allLabel="Todos os cursos" options={(opts.data?.courses ?? []).map((c) => ({ value: c.id, label: c.title }))} ariaLabel="Curso" />
      )}
      {show.cohort && (
        <SimpleSelect className="w-[200px]" value={value.cohortId} onChange={(v) => set({ cohortId: v })} allLabel="Todas as turmas" options={(opts.data?.cohorts ?? []).map((c) => ({ value: c.id, label: c.name }))} ariaLabel="Turma" />
      )}
      {show.participant && (
        <SimpleSelect className="w-[200px]" value={value.userId} onChange={(v) => set({ userId: v })} allLabel="Todos os participantes" options={(opts.data?.participants ?? []).map((c) => ({ value: c.id, label: c.name }))} ariaLabel="Participante" />
      )}
    </div>
  );
}
