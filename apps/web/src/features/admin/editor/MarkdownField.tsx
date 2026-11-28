import { useState } from 'react';
import { Markdown } from '@/components/common/Markdown';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Campo Markdown com abas Editar / Pré-visualizar (renderização segura). */
export function MarkdownField({ label, value, onChange, rows = 10, hint, disabled }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string; disabled?: boolean }) {
  const [tab, setTab] = useState<'edit' | 'preview'>(disabled ? 'preview' : 'edit');
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex rounded-md bg-muted p-0.5 text-xs">
          {(['edit', 'preview'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded px-2 py-0.5', tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              {t === 'edit' ? 'Editar' : 'Pré-visualizar'}
            </button>
          ))}
        </div>
      </div>
      {tab === 'edit' ? (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-[13px]" disabled={disabled} />
      ) : (
        <div className="min-h-[80px] rounded-md border bg-muted/20 p-4">{value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted-foreground">Sem conteúdo.</p>}</div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
