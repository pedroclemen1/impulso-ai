import { Award, Brain, Briefcase, Compass, GraduationCap, MessageSquareCode, SearchCheck, ShieldCheck, Sparkles, Target, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/types/student';

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  brain: Brain,
  'message-square-code': MessageSquareCode,
  briefcase: Briefcase,
  'search-check': SearchCheck,
  'shield-check': ShieldCheck,
  'trending-up': TrendingUp,
  'graduation-cap': GraduationCap,
  compass: Compass,
  award: Award,
  target: Target,
};

export const iconFor = (name?: string | null): LucideIcon => ICONS[name ?? ''] ?? Award;

export function AchievementIcon({ name, className, earned = true }: { name?: string | null; className?: string; earned?: boolean }) {
  const Icon = iconFor(name);
  return (
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', earned ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground', className)}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function AchievementChip({ a }: { a: Achievement }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <AchievementIcon name={a.icon} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{a.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
      </div>
    </div>
  );
}
