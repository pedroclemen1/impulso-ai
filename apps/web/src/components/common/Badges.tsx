import { COURSE_STATUS_LABELS, DIFFICULTY_LABELS, ENROLLMENT_STATUS_LABELS, levelLabel, MASTERY_LABELS, type Difficulty, type MasteryLevel } from '@impulso/shared';
import { Gauge, Signal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  if (!difficulty) return null;
  const variant = difficulty === 'ADVANCED' ? 'destructive' : difficulty === 'INTERMEDIATE' ? 'warning' : 'success';
  return (
    <Badge variant={variant}>
      <Signal />
      {DIFFICULTY_LABELS[difficulty as Difficulty] ?? difficulty}
    </Badge>
  );
}

export function LevelBadge({ level, prefix = 'Nível' }: { level?: number | null; prefix?: string }) {
  if (!level) return <Badge variant="muted">Não avaliado</Badge>;
  return (
    <Badge variant="default">
      <Gauge />
      {prefix} {level} · {levelLabel(level)}
    </Badge>
  );
}

export function EnrollmentStatusBadge({ status }: { status: string }) {
  const variant = status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'default' : status === 'CANCELLED' ? 'destructive' : 'muted';
  return <Badge variant={variant}>{ENROLLMENT_STATUS_LABELS[status as keyof typeof ENROLLMENT_STATUS_LABELS] ?? status}</Badge>;
}

export function CourseStatusBadge({ status }: { status: string }) {
  const variant = status === 'PUBLISHED' ? 'success' : status === 'ARCHIVED' ? 'muted' : 'warning';
  return <Badge variant={variant}>{COURSE_STATUS_LABELS[status as keyof typeof COURSE_STATUS_LABELS] ?? status}</Badge>;
}

export function MasteryBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const variant = level === 'AVANCADO' ? 'success' : level === 'PROFICIENTE' ? 'default' : level === 'EM_DESENVOLVIMENTO' ? 'warning' : 'destructive';
  return <Badge variant={variant}>{MASTERY_LABELS[level as MasteryLevel] ?? level}</Badge>;
}

export function DemoBadge() {
  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      Dados demonstrativos
    </Badge>
  );
}
