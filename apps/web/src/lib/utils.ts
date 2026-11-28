import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (d?: string | Date | null, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('pt-BR', opts).format(new Date(d)) : '—';

export const formatDateTime = (d?: string | Date | null) =>
  formatDate(d, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const formatRelative = (d?: string | Date | null) => {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  if (diff < 60) return 'agora';
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), 'day');
  return formatDate(d);
};

export const formatPct = (v?: number | null, digits = 0) => (v === null || v === undefined ? '—' : `${v.toFixed(digits)}%`);
export const formatPp = (v?: number | null) => (v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)} p.p.`);
export const formatMinutes = (m?: number | null) => {
  if (m === null || m === undefined) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h}h ${r}min` : `${h}h`;
};

export const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const COVER_COLORS: Record<string, string> = {
  indigo: 'from-indigo-500 to-indigo-700',
  violet: 'from-violet-500 to-violet-700',
  sky: 'from-sky-500 to-sky-700',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  rose: 'from-rose-500 to-rose-700',
};
export const coverClass = (c?: string) => COVER_COLORS[c ?? 'indigo'] ?? COVER_COLORS.indigo;
