import { Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  definition,
  tone = 'default',
  footer,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  definition?: string;
  tone?: 'default' | 'success' | 'warning';
  footer?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {label}
          {definition && (
            <Tooltip content={definition}>
              <button type="button" aria-label={`Definição: ${label}`} className="text-muted-foreground/70 hover:text-foreground">
                <Info className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
        {Icon && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone === 'success' ? 'bg-success/10 text-success' : tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value ?? '—'}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
