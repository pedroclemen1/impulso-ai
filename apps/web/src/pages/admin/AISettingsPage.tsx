import { zodResolver } from '@hookform/resolvers/zod';
import { AI_PROVIDER_LABELS, aiSettingsSchema, type AIProviderName, type AISettingsInput } from '@impulso/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Bot, CheckCircle2, CircleDollarSign, Gauge, PlugZap, Save, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState, QueryState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { api, errorMessage, type Paginated } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Settings extends AISettingsInput {
  id: string;
  updatedAt: string;
}
interface Provider {
  name: AIProviderName;
  configured: boolean;
  defaultModel: string;
}
interface Usage {
  totals: { calls: number; averageLatencyMs: number | null; inputTokens: number; outputTokens: number; estimatedCostUsd: number | null };
  byOperation: { operation: string; calls: number; averageLatencyMs: number | null; inputTokens: number | null; outputTokens: number | null; estimatedCostUsd: number | null }[];
  byStatus: { status: string; calls: number }[];
  logs: { id: string; provider: string; model: string; operation: string; inputTokens: number | null; outputTokens: number | null; latencyMs: number; status: string; errorCode: string | null; estimatedCostUsd: number | null; createdAt: string; user: { name: string } | null }[];
}

const OPERATION_LABELS: Record<string, string> = {
  course_outline: 'Geração de curso — estrutura',
  module_content: 'Geração de curso — módulo',
  course_assessments: 'Geração de curso — avaliações',
  activity_evaluation: 'Avaliação de atividade',
  tutor_chat: 'Tutor socrático',
  tutor_solution: 'Solução comentada',
  consolidation: 'Consolidação',
  personalized_example: 'Exemplo personalizado',
  reflection_feedback: 'Feedback de reflexão',
  pedagogical_insights: 'Insights pedagógicos',
  connection_test: 'Teste de conexão',
};

function SettingsForm({ settings, providers }: { settings: Settings; providers: Provider[] }) {
  const qc = useQueryClient();
  const form = useForm<AISettingsInput>({ resolver: zodResolver(aiSettingsSchema), defaultValues: settings });
  useEffect(() => form.reset(settings), [settings, form]);
  const e = form.formState.errors;
  const provider = form.watch('activeProvider');
  const submit = form.handleSubmit(async (v) => {
    try {
      await api.put('/ai/settings', { ...v, model: v.model || null, monthlyBudgetUsd: v.monthlyBudgetUsd === undefined || Number.isNaN(v.monthlyBudgetUsd) ? null : v.monthlyBudgetUsd });
      toast.success('Configurações de IA salvas');
      qc.invalidateQueries({ queryKey: ['ai', 'settings'] });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });
  const num = (name: keyof AISettingsInput) => form.register(name, { valueAsNumber: true });
  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provedor e modelo</CardTitle>
          <CardDescription>As chaves de API ficam apenas no servidor (variáveis de ambiente) e nunca são enviadas ao navegador.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provedor ativo">
              <Controller
                control={form.control}
                name="activeProvider"
                render={({ field }) => <SimpleSelect value={field.value} onChange={field.onChange} options={providers.filter((p) => p.configured).map((p) => ({ value: p.name, label: AI_PROVIDER_LABELS[p.name] }))} />}
              />
            </Field>
            <Field label="Modelo (opcional)" hint={`Padrão: ${providers.find((p) => p.name === provider)?.defaultModel ?? '—'}`}>
              <Input {...form.register('model')} placeholder="Usar modelo padrão do provedor" />
            </Field>
            <Field label="Temperatura" error={e.temperature?.message}>
              <Input type="number" step="0.1" min={0} max={1.5} {...num('temperature')} />
            </Field>
            <Field label="Máximo de tokens de saída" error={e.maxOutputTokens?.message}>
              <Input type="number" min={256} max={16000} {...num('maxOutputTokens')} />
            </Field>
            <Field label="Orçamento mensal (USD, opcional)" hint="Ao atingir o limite, as chamadas passam ao provedor demonstrativo.">
              <Input type="number" step="1" min={0} {...form.register('monthlyBudgetUsd', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })} />
            </Field>
            <Field label="Revisão humana abaixo de (%)" error={e.humanReviewBelowScore?.message} hint="Avaliações automáticas abaixo desta nota são marcadas para revisão.">
              <Input type="number" min={0} max={100} {...num('humanReviewBelowScore')} />
            </Field>
          </div>
          {provider === 'demo' && (
            <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
              O provedor <strong>demonstrativo</strong> é determinístico: gera feedback, avaliações por rubrica e cursos a partir de regras e do conteúdo cadastrado, sem chamar serviços externos. As respostas são identificadas como demonstrativas.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comportamento pedagógico do tutor</CardTitle>
          <CardDescription>O tutor usa o método socrático; estes limites evitam ciclos infinitos e definem quando a solução comentada é liberada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tentativas antes da solução comentada" error={e.tutorAttemptsBeforeSolution?.message}>
              <Input type="number" min={1} max={10} {...num('tutorAttemptsBeforeSolution')} />
            </Field>
            <Field label="Pistas por atividade" error={e.tutorMaxHints?.message}>
              <Input type="number" min={1} max={5} {...num('tutorMaxHints')} />
            </Field>
            <Field label="Mensagens por aula" error={e.tutorMaxMessagesPerLesson?.message}>
              <Input type="number" min={5} max={200} {...num('tutorMaxMessagesPerLesson')} />
            </Field>
          </div>
          <Field label="Tom do tutor">
            <Input {...form.register('tutorTone')} />
          </Field>
          <Field label="Orientações pedagógicas adicionais" hint="Não substituem as regras de segurança: o tutor nunca revela instruções internas nem estimula práticas discriminatórias.">
            <Textarea rows={3} {...form.register('tutorExtraInstructions')} placeholder="Ex.: sempre relacione as perguntas a vagas do varejo." />
          </Field>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" loading={form.formState.isSubmitting}>
          <Save /> Salvar configurações
        </Button>
      </div>
    </form>
  );
}

export default function AISettingsPage() {
  const [page, setPage] = useState(1);
  const settings = useQuery({ queryKey: ['ai', 'settings'], queryFn: () => api.get<{ settings: Settings; providers: Provider[] }>('/ai/settings') });
  const usage = useQuery({ queryKey: ['ai', 'usage', page], queryFn: async () => (await api.getPage<never>('/ai/usage', { days: 30, page, pageSize: 15 })) as unknown as Omit<Paginated<never>, 'data'> & { data: Usage } });
  const test = useMutation({
    mutationFn: () => api.post<{ data: { status: string; message: string }; provider: string; model: string; fallback: boolean; latencyMs: number }>('/ai/test'),
    onSuccess: (r) => toast.success(`Conexão OK — ${r.provider} (${r.model})`, { description: `${r.data.message} · ${r.latencyMs} ms` }),
    onError: (e) => toast.error('Falha na conexão', { description: errorMessage(e) }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações de IA"
        description="Provedor de LLM, parâmetros e comportamento pedagógico do tutor. A plataforma continua funcionando (conteúdos, questionários e progresso) mesmo se o provedor estiver indisponível."
        actions={
          <Button variant="outline" onClick={() => test.mutate()} loading={test.isPending}>
            <PlugZap /> Testar conexão
          </Button>
        }
      />
      <QueryState query={settings}>
        {(d) => (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <SettingsForm settings={d.settings} providers={d.providers} />
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4" /> Provedores
                </CardTitle>
                <CardDescription>Configurados via variáveis de ambiente do servidor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.providers.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">{AI_PROVIDER_LABELS[p.name]}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.defaultModel || '—'}</div>
                    </div>
                    {p.configured ? (
                      <Badge variant="success">
                        <CheckCircle2 /> {d.settings.activeProvider === p.name ? 'ativo' : 'configurado'}
                      </Badge>
                    ) : (
                      <Badge variant="muted">
                        <XCircle /> não configurado
                      </Badge>
                    )}
                  </div>
                ))}
                <p className="flex items-start gap-1.5 pt-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Dados pessoais são mascarados antes do envio às LLMs e os logs registram apenas metadados.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </QueryState>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Uso nos últimos 30 dias</h2>
        <QueryState query={usage}>
          {({ data: u, meta }) => (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Chamadas" value={u.totals.calls} icon={Activity} hint={u.byStatus.map((s) => `${s.status}: ${s.calls}`).join(' · ')} />
                <StatCard label="Latência média" value={u.totals.averageLatencyMs === null ? '—' : `${u.totals.averageLatencyMs} ms`} icon={Gauge} />
                <StatCard label="Tokens (entrada / saída)" value={`${u.totals.inputTokens.toLocaleString('pt-BR')} / ${u.totals.outputTokens.toLocaleString('pt-BR')}`} />
                <StatCard label="Custo estimado" value={u.totals.estimatedCostUsd === null ? '—' : `US$ ${u.totals.estimatedCostUsd.toFixed(4)}`} icon={CircleDollarSign} definition="Calculado quando AI_PRICE_INPUT_PER_MTOK e AI_PRICE_OUTPUT_PER_MTOK estão definidos no servidor." />
              </div>
              {!u.totals.calls ? (
                <EmptyState title="Nenhuma chamada de IA no período" />
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Por operação</CardTitle>
                    </CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Operação</TableHead>
                          <TableHead>Chamadas</TableHead>
                          <TableHead>Latência média</TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead>Custo estimado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {u.byOperation.map((o) => (
                          <TableRow key={o.operation}>
                            <TableCell>{OPERATION_LABELS[o.operation] ?? o.operation}</TableCell>
                            <TableCell>{o.calls}</TableCell>
                            <TableCell>{o.averageLatencyMs === null ? '—' : `${o.averageLatencyMs} ms`}</TableCell>
                            <TableCell className="text-xs">
                              {o.inputTokens ?? 0} / {o.outputTokens ?? 0}
                            </TableCell>
                            <TableCell>{o.estimatedCostUsd === null ? '—' : `US$ ${o.estimatedCostUsd.toFixed(4)}`}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Registros recentes</CardTitle>
                      <CardDescription>Somente metadados — o conteúdo de prompts e respostas não é registrado.</CardDescription>
                    </CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Operação</TableHead>
                          <TableHead>Provedor / modelo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Latência</TableHead>
                          <TableHead>Usuário</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {u.logs.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</TableCell>
                            <TableCell className="text-sm">{OPERATION_LABELS[l.operation] ?? l.operation}</TableCell>
                            <TableCell className="text-xs">
                              {l.provider} / {l.model}
                            </TableCell>
                            <TableCell>
                              <Badge variant={l.status === 'SUCCESS' ? 'success' : l.status === 'FALLBACK' ? 'warning' : 'destructive'}>
                                {l.status}
                                {l.errorCode ? ` · ${l.errorCode}` : ''}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{l.latencyMs} ms</TableCell>
                            <TableCell className="text-xs">{l.user?.name ?? '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                  <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
                </>
              )}
            </div>
          )}
        </QueryState>
      </div>
    </div>
  );
}
