import { LESSON_STAGE_LABELS, LESSON_STAGES, type LessonStage } from '@impulso/shared';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Indicador das seis etapas da jornada da aula. */
export function LearningSteps({
  current,
  reached,
  stages = [...LESSON_STAGES],
  onSelect,
  isEnabled,
}: {
  current: LessonStage;
  reached: LessonStage;
  stages?: LessonStage[];
  onSelect?: (s: LessonStage) => void;
  isEnabled?: (s: LessonStage) => boolean;
}) {
  const reachedIdx = stages.indexOf(reached);
  return (
    <ol className="flex w-full items-center gap-1 overflow-x-auto pb-1" aria-label="Etapas da aula">
      {stages.map((s, i) => {
        const done = i < reachedIdx;
        const active = s === current;
        const enabled = isEnabled ? isEnabled(s) : i <= reachedIdx;
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!enabled}
              onClick={() => onSelect?.(s)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex w-full min-w-[92px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors',
                active ? 'border-primary bg-primary/5 text-primary' : done ? 'border-success/30 bg-success/5 text-success' : 'text-muted-foreground',
                enabled ? 'hover:border-primary/50' : 'cursor-not-allowed opacity-60',
              )}
            >
              <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]', active ? 'bg-primary text-primary-foreground' : done ? 'bg-success text-success-foreground' : 'bg-muted')}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="truncate">{LESSON_STAGE_LABELS[s]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
