import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Select simples com opção "todos" (valor sentinela 'all'). */
export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  className,
  disabled,
  ariaLabel,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Select value={value || (allLabel ? 'all' : undefined)} onValueChange={(v) => onChange(v === 'all' ? '' : v)} disabled={disabled}>
      <SelectTrigger className={className} aria-label={ariaLabel ?? placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
