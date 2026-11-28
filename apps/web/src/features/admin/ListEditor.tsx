import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

/** Editor de listas de textos (objetivos, pistas, passos, indicadores...). */
export function ListEditor({
  value,
  onChange,
  placeholder,
  addLabel = 'Adicionar item',
  multiline,
  disabled,
  max = 20,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  multiline?: boolean;
  disabled?: boolean;
  max?: number;
}) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 w-5 shrink-0 text-right text-xs text-muted-foreground">{i + 1}.</span>
          {multiline ? (
            <Textarea value={item} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} disabled={disabled} className="min-h-[60px]" />
          ) : (
            <Input value={item} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} disabled={disabled} />
          )}
          {!disabled && (
            <div className="flex shrink-0">
              <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Mover para baixo">
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remover">
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          )}
        </div>
      ))}
      {!disabled && value.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ''])}>
          <Plus /> {addLabel}
        </Button>
      )}
    </div>
  );
}
