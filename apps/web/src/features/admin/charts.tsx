import { ArrowRight, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, ChartCard } from '@/components/common/ChartCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/States';
import { formatPct, formatPp } from '@/lib/utils';
import type { Charts } from '@/types/admin';

const axis = { fontSize: 12, fill: 'hsl(220 9% 44%)' };
const tooltipStyle = { borderRadius: 8, border: '1px solid hsl(220 16% 90%)', fontSize: 12 };

/** Destaque acadêmico: evolução em três momentos + ganho. */
export function ThreeMoments({ diagnostic, during, final, gain, normalized, note }: { diagnostic: number | null; during: number | null; final: number | null; gain: number | null; normalized: number | null; note?: string }) {
  const items = [
    { label: 'Diagnóstico', value: diagnostic },
    { label: 'Durante o curso', value: during },
    { label: 'Avaliação final', value: final },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-3 p-5">
          {items.map((it, i) => (
            <div key={it.label} className="flex items-center gap-3">
              <div className="min-w-[120px] rounded-lg bg-muted/60 px-4 py-3">
                <div className="text-xs font-medium text-muted-foreground">{it.label}</div>
                <div className="text-3xl font-semibold tracking-tight">{formatPct(it.value)}</div>
              </div>
              {i < items.length - 1 && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <div className="flex gap-6 border-t bg-primary/5 p-5 md:border-l md:border-t-0">
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Evolução de conhecimento
            </div>
            <div className="text-3xl font-semibold text-primary">{formatPp(gain)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Ganho normalizado</div>
            <div className="text-3xl font-semibold text-success">{formatPct(normalized)}</div>
          </div>
        </div>
      </div>
      {note && <p className="border-t px-5 py-2 text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}

export function EvolutionChart({ data, title = 'Evolução de aprendizagem', className }: { data: Charts['learningEvolution']; title?: string; className?: string }) {
  return (
    <ChartCard title={title} description="Médias em três momentos (escala 0–100)" empty={data.every((d) => d.score === null)} className={className}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="moment" tick={axis} />
          <YAxis domain={[0, 100]} tick={axis} />
          <RTooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
          <Line type="monotone" dataKey="score" name="Média" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 5 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function LevelDistributionChart({ data, className }: { data: Charts['levelDistribution']; className?: string }) {
  return (
    <ChartCard title="Distribuição por nível de conhecimento" description="Nível inicial (diagnóstico) e atual estimado" empty={data.every((d) => !d.initial && !d.current)} className={className}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axis} />
          <YAxis allowDecimals={false} tick={axis} />
          <RTooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="initial" name="Inicial" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
          <Bar dataKey="current" name="Atual" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProgressByCourseChart({ data, className }: { data: Charts['progressByCourse']; className?: string }) {
  return (
    <ChartCard title="Progresso por curso" description="Progresso médio das alocações" empty={!data.length} className={className}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={axis} />
          <YAxis type="category" dataKey="course" width={170} tick={{ ...axis, fontSize: 11 }} />
          <RTooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
          <Bar dataKey="averageProgress" name="Progresso médio" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CompetencyChart({ data, className, title = 'Desempenho por competência' }: { data: Charts['competencyPerformance']; className?: string; title?: string }) {
  return (
    <ChartCard title={title} description="Domínio inicial (diagnóstico) vs. atual" empty={!data.length} className={className} height={300}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={axis} />
          <YAxis type="category" dataKey="competency" width={170} tick={{ ...axis, fontSize: 11 }} />
          <RTooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="initial" name="Inicial" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
          <Bar dataKey="current" name="Atual" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ScoreDistributionChart({ data, className }: { data: Charts['scoreDistribution']; className?: string }) {
  return (
    <ChartCard title="Distribuição de notas" description="Quantidade por faixa de nota" empty={data.every((d) => !d.finalAssessment && !d.activities)} className={className}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="range" tick={axis} />
          <YAxis allowDecimals={false} tick={axis} />
          <RTooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="activities" name="Atividades" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
          <Bar dataKey="finalAssessment" name="Avaliação final" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ParticipationChart({ data, className }: { data: Charts['participationOverTime']; className?: string }) {
  const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return (
    <ChartCard title="Participação ao longo do tempo" description="Participantes ativos, atividades e interações por dia" empty={data.every((d) => !d.activeParticipants && !d.submissions)} className={className} height={280}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} minTickGap={20} />
          <YAxis allowDecimals={false} tick={axis} />
          <RTooltip contentStyle={tooltipStyle} labelFormatter={(l: string) => fmt(l)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="activeParticipants" name="Participantes ativos" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} />
          <Area type="monotone" dataKey="submissions" name="Atividades" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.1} />
          <Area type="monotone" dataKey="tutorInteractions" name="Interações com tutor" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.08} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DifficultiesCard({ data, className }: { data: Charts['topDifficulties']; className?: string }) {
  const empty = !data.weakestCriteria.length && !data.frequentImprovements.length;
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Principais dificuldades identificadas</CardTitle>
        <CardDescription>Critérios de rubrica com menor média e melhorias mais apontadas</CardDescription>
      </CardHeader>
      <CardContent>
      {empty ? <EmptyState title="Dados insuficientes" description="Aparecerá quando houver atividades avaliadas." className="py-8" /> : <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critérios com menor desempenho</p>
          {data.weakestCriteria.map((c) => (
            <div key={c.criterion} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate pr-2">{c.criterion}</span>
                <span className="font-medium">{formatPct(c.average)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-warning" style={{ width: `${c.average ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Melhorias mais frequentes</p>
          <ul className="space-y-1.5 text-sm">
            {data.frequentImprovements.map((i) => (
              <li key={i.text} className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                <span>{i.text}</span>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">{i.count}×</span>
              </li>
            ))}
          </ul>
        </div>
      </div>}
      </CardContent>
    </Card>
  );
}
