import { ArrowLeft, ArrowRight, Check, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Markdown } from '@/components/common/Markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AnswerInput, StudentAssessment, StudentQuestion, SubmitResult } from '@/types/student';

const isAnswered = (q: StudentQuestion, a?: AnswerInput) => {
  if (!a) return false;
  if (q.type === 'OPEN') return !!a.textAnswer?.trim();
  if (q.type === 'LIKERT') return !!a.likertValue;
  return (a.selectedOptionIds?.length ?? 0) > 0;
};

/** Questões abertas não pontuáveis são opcionais; as demais são obrigatórias. */
const isRequired = (q: StudentQuestion) => q.type !== 'OPEN';

function OptionCard({ selected, multi, label, onClick, letter }: { selected: boolean; multi?: boolean; label: string; onClick: () => void; letter: string }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition-all',
        selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center border-2 text-xs font-semibold',
          multi ? 'rounded-md' : 'rounded-full',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground',
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : letter}
      </span>
      <span className="leading-6">{label}</span>
    </button>
  );
}

export function QuestionInput({ q, value, onChange }: { q: StudentQuestion; value?: AnswerInput; onChange: (a: AnswerInput) => void }) {
  const selected = new Set(value?.selectedOptionIds ?? []);
  const letters = 'ABCDEFGHIJ';
  switch (q.type) {
    case 'LIKERT': {
      const labels = q.likertLabels.length === 5 ? q.likertLabels : ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];
      return (
        <div role="radiogroup" aria-label="Escala de 1 a 5" className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value?.likertValue === n}
              onClick={() => onChange({ questionId: q.id, likertValue: n })}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 text-center transition-all',
                value?.likertValue === n ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
              )}
            >
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold', value?.likertValue === n ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{n}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">{labels[n - 1]}</span>
            </button>
          ))}
        </div>
      );
    }
    case 'OPEN':
      return (
        <div className="space-y-2">
          <Textarea
            rows={5}
            value={value?.textAnswer ?? ''}
            onChange={(e) => onChange({ questionId: q.id, textAnswer: e.target.value })}
            placeholder="Escreva sua resposta…"
            aria-label="Resposta aberta"
            maxLength={5000}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Não inclua nomes reais, CPF, e-mails ou outros dados pessoais. {isRequired(q) ? '' : 'Resposta opcional.'}
          </p>
        </div>
      );
    case 'MULTIPLE_CHOICE':
      return (
        <div className="space-y-2" role="group">
          <p className="text-xs text-muted-foreground">Selecione todas as alternativas que se aplicam.</p>
          {q.options.map((o, i) => (
            <OptionCard
              key={o.id}
              multi
              letter={letters[i]}
              label={o.label}
              selected={selected.has(o.id)}
              onClick={() => {
                const next = new Set(selected);
                if (next.has(o.id)) next.delete(o.id);
                else next.add(o.id);
                onChange({ questionId: q.id, selectedOptionIds: [...next] });
              }}
            />
          ))}
        </div>
      );
    case 'TRUE_FALSE':
      return (
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {q.options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected.has(o.id)}
              onClick={() => onChange({ questionId: q.id, selectedOptionIds: [o.id] })}
              className={cn(
                'rounded-xl border-2 px-4 py-6 text-base font-semibold transition-all',
                selected.has(o.id) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    default:
      return (
        <div className="space-y-2" role="radiogroup">
          {q.options.map((o, i) => (
            <OptionCard key={o.id} letter={letters[i]} label={o.label} selected={selected.has(o.id)} onClick={() => onChange({ questionId: q.id, selectedOptionIds: [o.id] })} />
          ))}
        </div>
      );
  }
}

/** Executor de questionários em etapas (uma questão por tela), compartilhado por diagnóstico, avaliações e pesquisa. */
export function QuizRunner({
  assessment,
  onSubmit,
  submitting,
  draftKey,
  submitLabel = 'Enviar respostas',
}: {
  assessment: StudentAssessment;
  onSubmit: (answers: AnswerInput[]) => void;
  submitting?: boolean;
  draftKey?: string;
  submitLabel?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerInput>>(() => {
    if (!draftKey) return {};
    try {
      return JSON.parse(sessionStorage.getItem(draftKey) ?? '{}');
    } catch {
      return {};
    }
  });
  const [index, setIndex] = useState(0);
  const questions = assessment.questions;
  const q = questions[index];

  useEffect(() => {
    if (draftKey) sessionStorage.setItem(draftKey, JSON.stringify(answers));
  }, [answers, draftKey]);

  const answeredCount = useMemo(() => questions.filter((x) => isAnswered(x, answers[x.id])).length, [questions, answers]);
  const missingRequired = questions.filter((x) => isRequired(x) && !isAnswered(x, answers[x.id]));
  const canAdvance = !isRequired(q) || isAnswered(q, answers[q.id]);
  const last = index === questions.length - 1;

  const submit = () => {
    const list = Object.values(answers).filter((a) => {
      const qq = questions.find((x) => x.id === a.questionId);
      return qq && isAnswered(qq, a);
    });
    onSubmit(list);
  };

  if (!q) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Questão {index + 1} de {questions.length}
          </span>
          <span>{answeredCount} respondida(s)</span>
        </div>
        <Progress value={((index + 1) / questions.length) * 100} />
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          {q.dimensionLabel && <Badge variant="secondary">{q.dimensionLabel}</Badge>}
          {q.competency && <Badge variant="outline">{q.competency.name}</Badge>}
          {q.type === 'SCENARIO' && <Badge variant="warning">Cenário prático</Badge>}
        </div>
        <Markdown className="text-base font-medium text-foreground">{q.prompt}</Markdown>
        {q.helpText && <p className="text-sm text-muted-foreground">{q.helpText}</p>}
        <QuestionInput q={q} value={answers[q.id]} onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))} />
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ArrowLeft /> Anterior
        </Button>
        {last ? (
          <Button onClick={submit} loading={submitting} disabled={missingRequired.length > 0}>
            {submitLabel} <Check />
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)} disabled={!canAdvance}>
            {!isRequired(q) && !isAnswered(q, answers[q.id]) ? 'Pular' : 'Próxima'} <ArrowRight />
          </Button>
        )}
      </div>
      {last && missingRequired.length > 0 && (
        <p className="text-center text-xs text-warning">
          Responda as questões obrigatórias pendentes:{' '}
          {missingRequired.map((m) => (
            <button key={m.id} className="mx-0.5 underline" onClick={() => setIndex(questions.indexOf(m))}>
              {questions.indexOf(m) + 1}
            </button>
          ))}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-1.5" aria-label="Navegação entre questões">
        {questions.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setIndex(i)}
            aria-label={`Ir para a questão ${i + 1}`}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all',
              i === index ? 'w-6 bg-primary' : isAnswered(x, answers[x.id]) ? 'bg-primary/40' : 'bg-muted-foreground/20',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Correção comentada exibida após avaliações de módulo e final. */
export function QuizReview({ assessment, review, answers }: { assessment: StudentAssessment; review: NonNullable<SubmitResult['review']>; answers: AnswerInput[] }) {
  const byQ = new Map(review.map((r) => [r.questionId, r]));
  const ans = new Map(answers.map((a) => [a.questionId, a]));
  return (
    <div className="space-y-3">
      {assessment.questions.map((q, i) => {
        const r = byQ.get(q.id);
        const a = ans.get(q.id);
        const ok = r?.isCorrect;
        return (
          <Card key={q.id} className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium">
                  {i + 1}. <Markdown className="inline [&>p]:my-0 [&>p]:inline">{q.prompt}</Markdown>
                </p>
                <ul className="space-y-1">
                  {q.options.map((o) => {
                    const correct = r?.correctOptionIds.includes(o.id);
                    const chosen = a?.selectedOptionIds?.includes(o.id);
                    return (
                      <li
                        key={o.id}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-sm',
                          correct ? 'border-success/40 bg-success/5' : chosen ? 'border-destructive/40 bg-destructive/5' : 'border-transparent text-muted-foreground',
                        )}
                      >
                        {o.label}
                        {correct && <span className="ml-2 text-xs font-medium text-success">(resposta correta)</span>}
                        {chosen && !correct && <span className="ml-2 text-xs font-medium text-destructive">(sua resposta)</span>}
                        {chosen && correct && <span className="ml-1 text-xs font-medium text-success">— sua resposta</span>}
                      </li>
                    );
                  })}
                </ul>
                {r?.score != null && !ok && r.score > 0 && <p className="text-xs text-muted-foreground">Crédito parcial: {Math.round(r.score)}%</p>}
                {r?.explanation && (
                  <div className="rounded-md bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
                    <Markdown className="text-sm [&>p]:my-0">{r.explanation}</Markdown>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
