import { KPI_DEFINITIONS } from '@impulso/shared';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defaultFilters, FiltersBar, toQuery, type FilterState } from '@/features/admin/FiltersBar';
import { api } from '@/lib/api';

const REPORTS = [
  { key: 'enrollments', label: 'Indicadores por participante', description: 'Uma linha por alocação: progresso, notas nos três momentos, evolução, ganho normalizado, tempo ativo, engajamento e dados autodeclarados.' },
  { key: 'competencies', label: 'Domínio por competência', description: 'Domínio inicial e atual de cada participante em cada competência, com número de evidências.' },
  { key: 'evaluations', label: 'Avaliações de atividades', description: 'Todas as tentativas, notas ponderadas, origem da avaliação e pendências de revisão humana.' },
] as const;

const NATURE_VARIANT = { objetivo: 'success', comportamental: 'default', autodeclarado: 'outline' } as const;

function ReportPreview({ report, filters }: { report: string; filters: Record<string, string | undefined> }) {
  const q = useQuery({ queryKey: ['report', report, filters], queryFn: () => api.get<Record<string, unknown>[]>(`/reports/${report}`, filters) });
  if (q.isLoading) return <Skeleton className="h-48" />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const rows = q.data ?? [];
  if (!rows.length) return <EmptyState icon={FileSpreadsheet} title="Sem registros para os filtros selecionados" />;
  const cols = Object.keys(rows[0]);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Prévia de {Math.min(rows.length, 50)} de {rows.length} linha(s). Colunas com sufixo “autodeclarada” vêm de respostas de percepção dos participantes.
      </p>
      <div className="max-h-[420px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => (
                <TableHead key={c}>{c.replace(/_/g, ' ')}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 50).map((r, i) => (
              <TableRow key={i}>
                {cols.map((c) => (
                  <TableCell key={c} className="whitespace-nowrap text-xs">
                    {r[c] === null || r[c] === '' ? '—' : typeof r[c] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(r[c] as string) ? new Date(r[c] as string).toLocaleString('pt-BR') : String(r[c])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters, preset: '90' });
  const query = toQuery(filters);
  const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v)) as Record<string, string>;
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Exporte indicadores em CSV (UTF-8, compatível com Excel). As exportações são registradas na auditoria." />
      <FiltersBar value={filters} onChange={setFilters} />
      <Tabs defaultValue="enrollments">
        <TabsList>
          {REPORTS.map((r) => (
            <TabsTrigger key={r.key} value={r.key}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {REPORTS.map((r) => (
          <TabsContent key={r.key} value={r.key}>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{r.label}</CardTitle>
                  <CardDescription>{r.description}</CardDescription>
                </div>
                <Button asChild>
                  <a href={api.url(`/reports/${r.key}.csv`, params)} download>
                    <Download /> Baixar CSV
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <ReportPreview report={r.key} filters={params} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Glossário de indicadores</CardTitle>
          <CardDescription>Definições transparentes usadas no painel e nos relatórios. Dados autodeclarados são diferenciados de resultados objetivos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {Object.entries(KPI_DEFINITIONS).map(([key, d]) => (
            <div key={key} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium">{d.label}</span>
                <Badge variant={NATURE_VARIANT[d.nature as keyof typeof NATURE_VARIANT] ?? 'muted'}>{d.nature}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{d.definition}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
