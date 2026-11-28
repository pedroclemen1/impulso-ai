import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Zap className="h-4 w-4 fill-current" />
      </span>
      <span className={cn('text-[17px]', light ? 'text-white' : 'text-foreground')}>
        Impulso <span className={light ? 'text-indigo-200' : 'text-primary'}>AI</span>
      </span>
    </div>
  );
}
