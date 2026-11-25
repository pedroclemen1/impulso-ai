import type { AISettings } from '@prisma/client';
import { AI_PROVIDERS, type AIProviderName } from '@impulso/shared';
import { env } from '../../config/env';
import { prisma } from '../../database/prisma';
import { serviceUnavailable } from '../../shared/errors';
import { AnthropicProvider } from './providers/anthropic';
import { DemoProvider } from './providers/demo';
import { GeminiProvider } from './providers/gemini';
import { OpenAICompatibleProvider } from './providers/openai';
import {
  AIProviderError,
  type AIOperation,
  type AIProvider,
  type ChatGenerationRequest,
  type StructuredGenerationRequest,
  type TokenUsage,
} from './providers/types';

export interface AICallContext {
  userId?: string | null;
  /** Quando true, falhas do provedor caem no provedor demonstrativo (resultado marcado como fallback). */
  allowFallback?: boolean;
}

export interface AIResultMeta {
  provider: string;
  model: string;
  fallback: boolean;
}

const demo = new DemoProvider();

function buildProviders(): Record<AIProviderName, AIProvider> {
  return {
    demo,
    openai: new OpenAICompatibleProvider({
      name: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      officialApi: true,
      requiresKey: true,
    }),
    anthropic: new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL),
    gemini: new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL),
    openai_compatible: new OpenAICompatibleProvider({
      name: 'openai_compatible',
      baseUrl: env.OPENAI_COMPATIBLE_BASE_URL ?? '',
      apiKey: env.OPENAI_COMPATIBLE_API_KEY,
      model: env.OPENAI_COMPATIBLE_MODEL ?? '',
      officialApi: false,
      requiresKey: false,
    }),
    ollama: new OpenAICompatibleProvider({
      name: 'ollama',
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL,
      officialApi: false,
      requiresKey: false,
    }),
  };
}

const providers = buildProviders();

export function listProviders() {
  return AI_PROVIDERS.map((name) => ({
    name,
    configured: providers[name].isConfigured(),
    defaultModel: providers[name].defaultModel,
  }));
}

let settingsCache: { value: AISettings; at: number } | null = null;

export async function getAISettings(): Promise<AISettings> {
  if (settingsCache && Date.now() - settingsCache.at < 5000) return settingsCache.value;
  const initialProvider = (AI_PROVIDERS as readonly string[]).includes(env.AI_PROVIDER) ? env.AI_PROVIDER : 'demo';
  const value = await prisma.aISettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', activeProvider: initialProvider },
    update: {},
  });
  settingsCache = { value, at: Date.now() };
  return value;
}

export const invalidateAISettings = () => {
  settingsCache = null;
};

function estimateCost(provider: string, usage?: TokenUsage): number | null {
  if (provider === 'demo') return 0;
  if (env.AI_PRICE_INPUT_PER_MTOK === undefined || env.AI_PRICE_OUTPUT_PER_MTOK === undefined) return null;
  if (usage?.inputTokens === undefined && usage?.outputTokens === undefined) return null;
  return ((usage.inputTokens ?? 0) * env.AI_PRICE_INPUT_PER_MTOK + (usage.outputTokens ?? 0) * env.AI_PRICE_OUTPUT_PER_MTOK) / 1_000_000;
}

async function logUsage(data: {
  userId?: string | null;
  provider: string;
  model: string;
  operation: AIOperation;
  usage?: TokenUsage;
  latencyMs: number;
  status: 'SUCCESS' | 'ERROR' | 'FALLBACK';
  errorCode?: string;
}) {
  // Apenas metadados: nenhum conteúdo de prompts ou respostas é registrado.
  await prisma.aIUsageLog
    .create({
      data: {
        userId: data.userId ?? null,
        provider: data.provider,
        model: data.model,
        operation: data.operation,
        inputTokens: data.usage?.inputTokens ?? null,
        outputTokens: data.usage?.outputTokens ?? null,
        latencyMs: data.latencyMs,
        status: data.status,
        errorCode: data.errorCode ?? null,
        estimatedCostUsd: data.status === 'ERROR' ? null : estimateCost(data.provider, data.usage),
      },
    })
    .catch(() => undefined);
}

async function budgetExceeded(settings: AISettings): Promise<boolean> {
  if (!settings.monthlyBudgetUsd) return false;
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const agg = await prisma.aIUsageLog.aggregate({ _sum: { estimatedCostUsd: true }, where: { createdAt: { gte: start } } });
  return (agg._sum.estimatedCostUsd ?? 0) >= settings.monthlyBudgetUsd;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Runner<R> = (provider: AIProvider, opts: { model?: string; temperature: number; maxTokens: number; signal: AbortSignal }) => Promise<R & { model: string; usage?: TokenUsage }>;

async function execute<R>(operation: AIOperation, ctx: AICallContext, run: Runner<R>, overrides?: { maxTokens?: number; temperature?: number }) {
  const settings = await getAISettings();
  const name = settings.activeProvider as AIProviderName;
  const provider = providers[name] ?? demo;
  const opts = (p: AIProvider) => ({
    model: p.name === name && settings.model ? settings.model : undefined,
    temperature: overrides?.temperature ?? settings.temperature,
    maxTokens: Math.max(overrides?.maxTokens ?? 0, settings.maxOutputTokens),
  });

  let lastError: AIProviderError | null = null;
  if (!provider.isConfigured()) {
    lastError = new AIProviderError(`Provedor "${name}" não está configurado (verifique as variáveis de ambiente)`, 'NOT_CONFIGURED', false);
  } else if (provider.name !== 'demo' && (await budgetExceeded(settings))) {
    lastError = new AIProviderError('Orçamento mensal de IA atingido', 'BUDGET', false);
  } else {
    for (let attempt = 0; attempt <= env.AI_MAX_RETRIES; attempt++) {
      const started = Date.now();
      try {
        const result = await run(provider, { ...opts(provider), signal: AbortSignal.timeout(env.AI_TIMEOUT_MS) });
        await logUsage({ userId: ctx.userId, provider: provider.name, model: result.model, operation, usage: result.usage, latencyMs: Date.now() - started, status: 'SUCCESS' });
        return { result, meta: { provider: provider.name, model: result.model, fallback: false } as AIResultMeta };
      } catch (err) {
        lastError = err instanceof AIProviderError ? err : new AIProviderError((err as Error).message, 'NETWORK', false);
        await logUsage({ userId: ctx.userId, provider: provider.name, model: opts(provider).model ?? provider.defaultModel, operation, latencyMs: Date.now() - started, status: 'ERROR', errorCode: lastError.code });
        if (!lastError.retryable || attempt === env.AI_MAX_RETRIES) break;
        await sleep(800 * (attempt + 1));
      }
    }
  }

  if (ctx.allowFallback && provider.name !== 'demo') {
    const started = Date.now();
    const result = await run(demo, { ...opts(demo), signal: AbortSignal.timeout(10_000) });
    await logUsage({ userId: ctx.userId, provider: 'demo', model: result.model, operation, latencyMs: Date.now() - started, status: 'FALLBACK', errorCode: lastError?.code });
    return { result, meta: { provider: 'demo', model: result.model, fallback: true } as AIResultMeta };
  }
  throw serviceUnavailable(`O serviço de IA está indisponível no momento (${lastError?.message ?? 'erro desconhecido'}).`);
}

/** Gateway central de IA: a lógica de negócio chama apenas estas funções. */
export const ai = {
  async generateStructured<T>(request: StructuredGenerationRequest<T>, ctx: AICallContext = {}) {
    const { result, meta } = await execute(
      request.operation,
      ctx,
      (p, o) => p.generateStructured({ ...request, ...o }),
      { maxTokens: request.maxTokens, temperature: request.temperature },
    );
    return { data: result.data, ...meta };
  },
  async generateChat(request: ChatGenerationRequest, ctx: AICallContext = {}) {
    const { result, meta } = await execute(
      request.operation,
      ctx,
      (p, o) => p.generateChat({ ...request, ...o }),
      { maxTokens: request.maxTokens, temperature: request.temperature },
    );
    return { content: result.content, ...meta };
  },
};
