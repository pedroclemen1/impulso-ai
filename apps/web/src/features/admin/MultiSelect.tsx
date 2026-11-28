import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export interface MultiOption {
  value: string;
  label: string;
  hint?: string;
}

/** Lista de seleção múltipla com busca. */
export function MultiSelect({ options, value, onChange, placeholder = 'Buscar...', height = 220, disabled }: { options: MultiOption[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string; height?: number; disabled?: boolean }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q.toLowerCase())), [options, q]);
  const selected = new Set(value);
  const toggle = (v: string) => onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.value));
  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 border-b px-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="h-9 border-0 shadow-none focus-visible:ring-0" />
        {!disabled && filtered.length > 0 && (
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-primary hover:underline"
            onClick={() => onChange(allFilteredSelected ? value.filter((v) => !filtered.some((o) => o.value === v)) : [...new Set([...value, ...filtered.map((o) => o.value)])])}
          >
            {allFilteredSelected ? 'Limpar' : 'Selecionar todos'}
          </button>
        )}
      </div>
      <div className="overflow-y-auto p-1" style={{ maxHeight: height }}>
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Nenhum resultado</p>}
        {filtered.map((o) => (
          <label key={o.value} className={cn('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted', disabled && 'cursor-not-allowed opacity-60')}>
            <Checkbox checked={selected.has(o.value)} onCheckedChange={() => !disabled && toggle(o.value)} disabled={disabled} />
            <span className="truncate">{o.label}</span>
            {o.hint && <span className="ml-auto truncate text-xs text-muted-foreground">{o.hint}</span>}
          </label>
        ))}
      </div>
      <div className="border-t px-2 py-1 text-xs text-muted-foreground">{value.length} selecionado(s)</div>
    </div>
  );
}
