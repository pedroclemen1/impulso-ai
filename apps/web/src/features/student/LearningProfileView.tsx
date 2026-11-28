import { CheckCircle2, Compass, Lightbulb, Target, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { LearningProfile, PathItem } from '@/types/student';

export const EMPHASIS: Record<PathItem['emphasis'], { label: string; variant: 'warning' | 'default' | 'success' }> = {
  REFORCO: { label: 'Reforço recomendado', variant: 'warning' },
  PADRAO: { label: 'Trilha padrão', variant: 'default' },
  REVISAO_RAPIDA: { label: 'Revisão rápida', variant: 'success' },
};

/** Perfil de aprendizagem resultante do diagnóstico inicial. */
export function LearningProfileView({ profile }: { profile: LearningProfile }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex gap-1.5" aria-label={`Nível ${profile.level} de 4`}>
            {[1, 2, 3, 4].map((l) => (
              <span key={l} className={cn('h-14 w-4 rounded-full', l <= profile.level ? 'bg-white' : 'bg-white/20')} style={{ height: 24 + l * 10 }} />
            ))}
          </div>
          <div>
            <p className="text-sm text-indigo-100">Seu nível atual</p>
            <p className="text-3xl font-semibold">
              Nível {profile.level} — {profile.levelLabel}
            </p>
            <p className="mt-1 max-w-xl text-sm text-indigo-100">O nível ajusta explicações, exemplos e desafios. Todos os conteúdos fundamentais continuam disponíveis para você.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success" /> Conhecimentos identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.knowledgeIdentified.length ? (
              profile.knowledgeIdentified.map((k) => (
                <div key={k.id} className="flex items-center justify-between text-sm">
                  <span>{k.name}</span>
                  <Badge variant="success">{Math.round(k.score)}%</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Ainda não identificamos domínio consolidado — ótimo ponto de partida para evoluir!</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-warning" /> Lacunas de aprendizagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.gaps.length ? (
              profile.gaps.map((k) => (
                <div key={k.id} className="flex items-center justify-between text-sm">
                  <span>{k.name}</span>
                  <Badge variant="warning">{Math.round(k.score)}%</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma lacuna significativa identificada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> Competências que serão desenvolvidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {profile.competenciesToDevelop.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="text-muted-foreground">{c.score == null ? '—' : `${Math.round(c.score)}%`}</span>
              </div>
              <Progress value={c.score ?? 0} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Recomendações personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {profile.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {profile.rationale.length > 0 && (
            <details className="mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">Como seu nível foi calculado</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {profile.rationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </details>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-4 w-4 text-primary" /> Trilha sugerida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-3 border-l-2 border-muted pl-6">
            {profile.path.map((p) => (
              <li key={p.moduleId} className="relative">
                <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{p.order}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{p.title}</p>
                  <Badge variant={EMPHASIS[p.emphasis].variant}>{EMPHASIS[p.emphasis].label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.reason}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
