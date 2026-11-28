import { ArrowRight, TrendingUp } from 'lucide-react';
import { Tooltip } from '@/components/ui/misc';
import { cn, formatPct, formatPp } from '@/lib/utils';

const gain = (i?: number | null, f?: number | null) => (i == null || f == null ? null : f - i);
const normalized = (i?: number | null, f?: number | null) => (i == null || f == null || i >= 100 ? null : ((f - i) / (100 - i)) * 100);

/** Evolução em três momentos: diagnóstico → durante o curso → avaliação final. */
export function ScoreMoments({ initial, during, final, compact }: { initial: number | null; during: number | null; final: number | null; compact?: boolean }) {
  const items = [
    { label: 'Diagnóstico', value: initial },
    { label: 'Durante o curso', value: during },
    { label: 'Avaliação final', value: final },
  ];
  const g = gain(initial, final);
  const n = normalized(initial, final);
  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        {items.map((it, i) => (
          <div key={it.label} className="flex flex-1 items-center gap-2">
            <div className={cn('flex-1 rounded-lg border p-3 text-center', it.value == null && 'border-dashed')}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{it.label}</p>
              <p className={cn('mt-1 font-semibold tracking-tight', compact ? 'text-xl' : 'text-2xl', i === 2 && it.value != null && 'text-success')}>{formatPct(it.value)}</p>
            </div>
            {i < 2 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </div>
        ))}
      </div>
      {g != null && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Tooltip content="Diferença, em pontos percentuais, entre a avaliação final e a parte objetiva do diagnóstico.">
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 font-medium text-success">
              <TrendingUp className="h-4 w-4" /> Evolução {formatPp(g)}
            </span>
          </Tooltip>
          {n != null && (
            <Tooltip content="(nota final − nota inicial) ÷ (100 − nota inicial): quanto do espaço possível de melhoria foi conquistado.">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Ganho normalizado {formatPct(n)}</span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
