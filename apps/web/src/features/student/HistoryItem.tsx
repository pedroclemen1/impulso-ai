import { Award, BookCheck, ClipboardCheck, FileQuestion, MessageSquareHeart, PenLine, RefreshCw, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateTime, formatRelative } from '@/lib/utils';
import type { HistoryEvent } from '@/types/student';

export const HISTORY_TYPES: Record<string, { label: string; icon: typeof Award; cls: string }> = {
  LESSON_COMPLETED: { label: 'Aula concluída', icon: BookCheck, cls: 'bg-success/10 text-success' },
  ASSESSMENT_DIAGNOSTIC: { label: 'Diagnóstico', icon: Stethoscope, cls: 'bg-sky-100 text-sky-700' },
  ASSESSMENT_MODULE_QUIZ: { label: 'Avaliação do módulo', icon: FileQuestion, cls: 'bg-primary/10 text-primary' },
  ASSESSMENT_FINAL: { label: 'Avaliação final', icon: ClipboardCheck, cls: 'bg-violet-100 text-violet-700' },
  ASSESSMENT_SATISFACTION: { label: 'Pesquisa de satisfação', icon: MessageSquareHeart, cls: 'bg-rose-100 text-rose-700' },
  ACTIVITY_SUBMITTED: { label: 'Atividade enviada', icon: PenLine, cls: 'bg-muted text-foreground' },
  ACTIVITY_REVISED: { label: 'Resposta revisada', icon: RefreshCw, cls: 'bg-amber-100 text-amber-700' },
  ACHIEVEMENT: { label: 'Conquista', icon: Award, cls: 'bg-amber-100 text-amber-600' },
};

export function HistoryItem({ e, compact }: { e: HistoryEvent; compact?: boolean }) {
  const t = HISTORY_TYPES[e.type] ?? HISTORY_TYPES.ACTIVITY_SUBMITTED;
  return (
    <div className={cn('flex items-start gap-3', compact ? 'py-1.5' : 'rounded-lg border bg-card p-3')}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', t.cls)}>
        <t.icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{e.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {t.label}
          {e.course ? ` · ${e.course}` : ''} · <span title={formatDateTime(e.at)}>{formatRelative(e.at)}</span>
        </p>
      </div>
      {e.score != null && e.type !== 'ASSESSMENT_SATISFACTION' && <Badge variant="secondary">{Math.round(e.score)}%</Badge>}
    </div>
  );
}
