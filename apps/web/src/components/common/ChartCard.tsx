import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from './States';

export const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444'];

export function ChartCard({ title, description, children, empty, className, height = 260 }: { title: string; description?: string; children: ReactNode; empty?: boolean; className?: string; height?: number }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyState title="Dados insuficientes" description="Este gráfico será exibido quando houver registros no período selecionado." className="py-8" />
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
