import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HISTORY_TYPES, HistoryItem } from '@/features/student/HistoryItem';
import { studentKeys } from '@/features/student/queries';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { HistoryEvent } from '@/types/student';

export default function HistoryPage() {
  const q = useQuery({ queryKey: studentKeys.history, queryFn: () => api.get<HistoryEvent[]>('/learning/history') });
  const [type, setType] = useState('ALL');
  const groups = useMemo(() => {
    const items = (q.data ?? []).filter((e) => type === 'ALL' || e.type === type);
    const map = new Map<string, HistoryEvent[]>();
    for (const e of items) {
      const k = e.at.slice(0, 10);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()];
  }, [q.data, type]);

  return (
    <div>
      <PageHeader
        title="Histórico de aprendizagem"
        description="Tudo o que você realizou: aulas, atividades, revisões, avaliações e conquistas."
        breadcrumbs={[{ label: 'Início', to: '/app/dashboard' }, { label: 'Histórico' }]}
        actions={
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-56" aria-label="Filtrar por tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os eventos</SelectItem>
              {Object.entries(HISTORY_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <QueryState query={q}>
        {() =>
          groups.length === 0 ? (
            <EmptyState icon={History} title="Nenhum evento" description="Sua atividade de aprendizagem aparecerá aqui." />
          ) : (
            <div className="space-y-6">
              {groups.map(([day, events]) => (
                <section key={day}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatDate(`${day}T12:00:00`, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</h2>
                  <div className="space-y-2">
                    {events.map((e, i) => (
                      <HistoryItem key={i} e={e} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        }
      </QueryState>
    </div>
  );
}
