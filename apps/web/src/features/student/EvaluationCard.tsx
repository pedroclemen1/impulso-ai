import { CheckCircle2, Info, Lightbulb, MessageCircleQuestion, TrendingUp, UserCheck } from 'lucide-react';
import { MasteryBadge } from '@/components/common/Badges';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Evaluation } from '@/types/student';

export const scoreTone = (s: number, passing = 70) => (s >= passing ? 'text-success' : s >= passing - 20 ? 'text-warning' : 'text-destructive');

export function ScoreRing({ score, passing = 70, size = 64 }: { score: number; passing?: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= passing ? '#10b981' : score >= passing - 20 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, score) / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{Math.round(score)}</span>
    </div>
  );
}

/** Avaliação por rubrica apresentada como apoio pedagógico (não como veredito). */
export function EvaluationCard({ evaluation, passingScore, attemptNumber, previousScore }: { evaluation: Evaluation; passingScore: number; attemptNumber?: number; previousScore?: number | null }) {
  const delta = previousScore != null ? Math.round(evaluation.weightedScore - previousScore) : null;
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-4">
        <ScoreRing score={evaluation.weightedScore} passing={passingScore} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Feedback da {attemptNumber ? `tentativa ${attemptNumber}` : 'avaliação'}</p>
            <MasteryBadge level={evaluation.masteryLevel} />
            {delta !== null && (
              <Badge variant={delta >= 0 ? 'success' : 'destructive'}>
                <TrendingUp /> {delta >= 0 ? '+' : ''}
                {delta} pontos
              </Badge>
            )}
            {evaluation.source === 'HUMAN' && (
              <Badge variant="secondary">
                <UserCheck /> Revisada por instrutor
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Nota de referência para aprovação: {passingScore}. A nota é calculada a partir dos pesos da rubrica definida pela equipe pedagógica.
          </p>
        </div>
      </div>

      {evaluation.scores && evaluation.scores.length > 0 && (
        <div className="space-y-2.5">
          {evaluation.scores.map((s) => (
            <div key={s.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {s.criterion.name} <span className="text-xs font-normal text-muted-foreground">· peso {s.criterion.weight}</span>
                </span>
                <span className={cn('font-semibold', scoreTone(s.score, passingScore))}>{Math.round(s.score)}</span>
              </div>
              <Progress value={s.score} className="h-1.5" indicatorClassName={s.score >= passingScore ? 'bg-success' : s.score >= passingScore - 20 ? 'bg-warning' : 'bg-destructive'} />
              {s.justification && <p className="text-xs text-muted-foreground">{s.justification}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.strengths.length > 0 && (
          <div className="rounded-lg bg-success/5 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> O que você já fez bem
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {evaluation.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.improvements.length > 0 && (
          <div className="rounded-lg bg-warning/5 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
              <Lightbulb className="h-3.5 w-3.5" /> Pontos para aprimorar
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {evaluation.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {evaluation.socraticQuestion && (
        <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <span className="font-semibold text-primary">Para refletir: </span>
            {evaluation.socraticQuestion}
          </p>
        </div>
      )}
      {evaluation.reviewNote && <p className="text-sm text-muted-foreground">Nota do instrutor: {evaluation.reviewNote}</p>}
      {evaluation.requiresHumanReview && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> Esta avaliação pode ser revisada por um instrutor.
        </p>
      )}
    </Card>
  );
}
