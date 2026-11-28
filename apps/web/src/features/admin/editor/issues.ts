import type { ZodError } from 'zod';

/** Converte erros do Zod em mensagens legíveis para toasts. */
export const zodIssues = (err: ZodError) =>
  err.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(' › ') || 'campo'}: ${i.message}`)
    .join('\n');
