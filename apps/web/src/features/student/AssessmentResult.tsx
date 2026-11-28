import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatDate, formatPct } from '@/lib/utils';
import type { AttemptSummary, SubmitResult } from '@/types/student';
import { ScoreRing } from './EvaluationCard';

export function ResultHeader({ result, onRetry, children }: { result: SubmitResult; onRetry?: () => void; children?: ReactNode }) {
  const score = result.attempt.overallScore ?? 0;
  const passed = !!result.attempt.passed;
  return (
    <Card className={cn('p-6', passed ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5')}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ScoreRing score={score} passing={result.passingScore} size={88} />
        <div className="flex-1 space-y-1">
          <p className="flex items-center gap-2 text-lg font-semibold">
            {passed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-warning" />}
            {passed ? 'Aprovado(a)!' : 'Ainda não atingiu a nota mínima'}
          </p>
          <p className="text-sm text-muted-foreground">
            Sua nota: <strong className="text-foreground">{formatPct(score)}</strong> · mínimo {result.passingScore}% · tentativa {result.attempt.attemptNumber}
          </p>
          {!passed && result.attemptsRemaining > 0 && <p className="text-sm">Revise as explicações abaixo e tente novamente — você ainda tem {result.attemptsRemaining} tentativa(s).</p>}
          {children}
        </div>
        {onRetry && result.attemptsRemaining > 0 && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw /> Tentar novamente
          </Button>
        )}
      </div>
    </Card>
  );
}

export function AttemptsList({ attempts, passingScore }: { attempts: AttemptSummary[]; passingScore: number }) {
  if (!attempts.length) return null;
  return (
    <Card className="p-4">
      <p className="mb-2 text-sm font-semibold">Tentativas anteriores</p>
      <ul className="divide-y">
        {attempts.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              Tentativa {a.attemptNumber} · <span className="text-muted-foreground">{formatDate(a.submittedAt)}</span>
            </span>
            <Badge variant={(a.overallScore ?? 0) >= passingScore ? 'success' : 'warning'}>{formatPct(a.overallScore)}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
