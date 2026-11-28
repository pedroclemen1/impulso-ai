import { useMutation } from '@tanstack/react-query';
import { tutorMessageSchema } from '@impulso/shared';
import { Bot, BookCheck, KeyRound, Lightbulb, Loader2, PenLine, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Markdown } from '@/components/common/Markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Avatar, Skeleton, Tooltip } from '@/components/ui/misc';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import type { TutorMessage, TutorState } from '@/types/student';
import { useTutor } from './queries';
import { useQueryClient } from '@tanstack/react-query';
import { studentKeys } from './queries';

const SUGGESTIONS = ['Não entendi o feedback. Pode explicar de outro jeito?', 'Como posso melhorar o contexto da minha resposta?', 'Pode me dar um exemplo parecido?', 'Que riscos eu deveria considerar?'];

function MessageBubble({ m, userName }: { m: TutorMessage; userName?: string }) {
  const student = m.role === 'STUDENT';
  if (m.kind === 'SUBMISSION') {
    return (
      <div className="ml-auto max-w-[90%] rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <PenLine className="h-3.5 w-3.5" /> Sua resposta · tentativa {String(m.metadata?.attemptNumber ?? '')}
        </p>
        <p className="whitespace-pre-wrap text-sm">{m.content}</p>
      </div>
    );
  }
  const meta: Record<string, { label: string; icon: typeof Bot; cls: string }> = {
    SOCRATIC_FEEDBACK: { label: 'Feedback socrático', icon: Sparkles, cls: 'border-violet-200 bg-violet-50/70' },
    HINT: { label: 'Pista', icon: Lightbulb, cls: 'border-amber-200 bg-amber-50/70' },
    SOLUTION: { label: 'Solução comentada', icon: KeyRound, cls: 'border-emerald-200 bg-emerald-50/70' },
    CONSOLIDATION: { label: 'Consolidação', icon: BookCheck, cls: 'border-emerald-200 bg-emerald-50/70' },
  };
  const special = meta[m.kind];
  if (student) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          <p className="whitespace-pre-wrap">{m.content.replace(/^\*\*Minha reflexão:\*\*\s*/, 'Minha reflexão: ')}</p>
        </div>
        <Avatar name={userName} className="h-7 w-7" />
      </div>
    );
  }
  const score = typeof m.metadata?.weightedScore === 'number' ? (m.metadata.weightedScore as number) : null;
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="h-4 w-4" />
      </span>
      <div className={cn('max-w-[88%] rounded-2xl rounded-tl-sm border px-4 py-3', special?.cls ?? 'bg-card')}>
        {special && (
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <special.icon className="h-3.5 w-3.5" /> {special.label}
            {score !== null && <Badge variant="secondary">{Math.round(score)} pontos</Badge>}
          </p>
        )}
        <Markdown className="text-sm leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{m.content}</Markdown>
        {m.metadata?.fallback === true && <p className="mt-1 text-[11px] text-muted-foreground">Resposta do tutor demonstrativo (provedor de IA indisponível).</p>}
        <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(m.createdAt)}</p>
      </div>
    </div>
  );
}

/** Chat do tutor socrático vinculado à aula e à atividade. */
export function TutorChat({
  courseId,
  lessonId,
  hasActivity,
  onRevise,
  onConsolidate,
  className,
}: {
  courseId: string;
  lessonId: string;
  hasActivity: boolean;
  onRevise?: () => void;
  onConsolidate?: () => void;
  className?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const tutor = useTutor(courseId, lessonId);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const key = studentKeys.tutor(courseId, lessonId);

  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const send = useMutation({
    mutationFn: (content: string) => api.post(`/tutor/courses/${courseId}/lessons/${lessonId}/messages`, { content }),
    onSuccess: () => {
      setText('');
      refresh();
      qc.invalidateQueries({ queryKey: studentKeys.lesson(courseId, lessonId) });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const hint = useMutation({
    mutationFn: () => api.post(`/tutor/courses/${courseId}/lessons/${lessonId}/hint`),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const solution = useMutation({
    mutationFn: () => api.post(`/tutor/courses/${courseId}/lessons/${lessonId}/solution`),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });

  const messages = tutor.data?.messages ?? [];
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, send.isPending]);

  const state: TutorState | undefined = tutor.data?.state;
  const submit = () => {
    const parsed = tutorMessageSchema.safeParse({ content: text });
    if (!parsed.success) return;
    send.mutate(parsed.data.content);
  };
  const limitReached = state ? state.messagesUsed >= state.messagesLimit : false;

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Tutor Impulso</p>
            <p className="text-xs text-muted-foreground">Perguntas que estimulam o seu raciocínio</p>
          </div>
        </div>
        {state && hasActivity && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Badge variant="secondary">
              Tentativa {state.attemptCount}/{state.maxAttempts}
            </Badge>
            <Badge variant="outline">
              Pistas {state.hintsUsed}/{state.maxHints}
            </Badge>
          </div>
        )}
      </div>

      <div className="max-h-[520px] min-h-[260px] flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4" aria-live="polite">
        {tutor.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="ml-auto h-12 w-1/2" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Bot className="mx-auto mb-2 h-6 w-6 text-primary" />
            {hasActivity ? 'Envie sua resposta na etapa Praticar para receber o primeiro feedback do tutor.' : 'Converse com o tutor sobre o conteúdo desta aula.'}
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} m={m} userName={user?.name} />)
        )}
        {send.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Tutor está pensando…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {hasActivity && state && (
        <div className="flex flex-wrap gap-2 border-t px-4 py-3">
          <Button size="sm" variant="outline" onClick={() => hint.mutate()} loading={hint.isPending} disabled={state.hintsUsed >= state.maxHints}>
            <Lightbulb /> Pedir uma pista
          </Button>
          {onRevise && (
            <Button size="sm" variant="outline" onClick={onRevise} disabled={state.attemptCount === 0 || state.attemptCount >= state.maxAttempts}>
              <PenLine /> Revisar resposta
            </Button>
          )}
          <Tooltip
            content={
              state.solutionAllowed
                ? 'Compare sua resposta com uma solução de referência comentada.'
                : `Liberada após ${state.attemptsBeforeSolution} tentativas, depois de usar todas as pistas ou ao atingir a nota mínima.`
            }
          >
            <span>
              <Button size="sm" variant="outline" onClick={() => solution.mutate()} loading={solution.isPending} disabled={!state.solutionAllowed}>
                <KeyRound /> Ver solução comentada
              </Button>
            </span>
          </Tooltip>
          {onConsolidate && (
            <Button size="sm" variant="success" onClick={onConsolidate} disabled={state.attemptCount === 0}>
              <BookCheck /> Consolidar aprendizagem
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2 border-t p-3">
        {!limitReached && messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setText(s)} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            maxLength={3000}
            disabled={limitReached}
            placeholder={limitReached ? 'Limite de mensagens desta aula atingido.' : 'Explique seu raciocínio ou faça uma pergunta ao tutor…'}
            aria-label="Mensagem para o tutor"
            className="min-h-[44px] resize-none"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || limitReached} loading={send.isPending} aria-label="Enviar mensagem">
            {!send.isPending && <Send />}
          </Button>
        </form>
        {state && (
          <p className="text-[11px] text-muted-foreground">
            {state.messagesUsed}/{state.messagesLimit} mensagens nesta aula · Não compartilhe dados pessoais reais.
          </p>
        )}
      </div>
    </Card>
  );
}
