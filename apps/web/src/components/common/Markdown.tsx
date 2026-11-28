import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Renderização segura de Markdown: HTML bruto NÃO é interpretado (prevenção de XSS) e
 * links externos abrem em nova aba com rel="noopener noreferrer".
 */
export function Markdown({ children, className }: { children?: string | null; className?: string }) {
  if (!children) return null;
  return (
    <div className={cn('prose-impulso', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => (/^(https?:|mailto:|\/|#)/i.test(url) ? url : '')}
        components={{ a: ({ node: _n, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
