import type { ZodType, ZodTypeDef } from 'zod';
import {
  AIProviderError,
  type AIProvider,
  type ChatGenerationRequest,
  type ChatGenerationResponse,
  type ChatMessage,
  type StructuredGenerationRequest,
  type StructuredGenerationResponse,
} from './types';

export interface CompletionRequest {
  system: string;
  messages: ChatMessage[];
  json: boolean;
  model: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/** Extrai o primeiro objeto JSON de um texto (tolerante a cercas de código). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) throw new AIProviderError('A resposta do modelo não contém JSON', 'INVALID_OUTPUT', true);
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new AIProviderError('JSON inválido na resposta do modelo', 'INVALID_OUTPUT', true);
    }
  }
}

export function parseStructured<T>(text: string, schema: ZodType<T, ZodTypeDef, unknown>): T {
  const json = extractJson(text);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new AIProviderError(`Estrutura inválida: ${issues}`, 'INVALID_OUTPUT', true);
  }
  return parsed.data;
}

/** Base para provedores HTTP: implementa saída estruturada com validação e uma tentativa de reparo. */
export abstract class HttpLLMProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;
  abstract isConfigured(): boolean;
  protected abstract complete(req: CompletionRequest): Promise<ChatGenerationResponse>;

  async generateChat(request: ChatGenerationRequest): Promise<ChatGenerationResponse> {
    return this.complete({
      system: request.system,
      messages: request.messages,
      json: false,
      model: request.model ?? this.defaultModel,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      signal: request.signal,
    });
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<StructuredGenerationResponse<T>> {
    const model = request.model ?? this.defaultModel;
    const system = `${request.system}\n\nResponda EXCLUSIVAMENTE com um objeto JSON válido, sem texto adicional e sem cercas de código.`;
    const messages: ChatMessage[] = [{ role: 'user', content: request.prompt }];
    const first = await this.complete({ ...request, system, messages, json: true, model });
    try {
      return { data: parseStructured(first.content, request.schema), model: first.model, usage: first.usage };
    } catch (err) {
      if (!(err instanceof AIProviderError) || err.code !== 'INVALID_OUTPUT') throw err;
      // Uma única tentativa de reparo, informando o erro de validação ao modelo.
      const repair = await this.complete({
        ...request,
        system,
        model,
        json: true,
        messages: [
          ...messages,
          { role: 'assistant', content: first.content.slice(0, 12000) },
          { role: 'user', content: `Sua resposta não seguiu o formato exigido (${err.message}). Reenvie apenas o JSON corrigido e completo.` },
        ],
      });
      const usage = {
        inputTokens: (first.usage?.inputTokens ?? 0) + (repair.usage?.inputTokens ?? 0),
        outputTokens: (first.usage?.outputTokens ?? 0) + (repair.usage?.outputTokens ?? 0),
      };
      return { data: parseStructured(repair.content, request.schema), model: repair.model, usage };
    }
  }

  protected async postJson(url: string, body: unknown, headers: Record<string, string>, signal?: AbortSignal) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
        throw new AIProviderError('Tempo limite excedido ao chamar o provedor de IA', 'TIMEOUT', true);
      }
      throw new AIProviderError(`Falha de rede ao chamar o provedor: ${(err as Error).message}`, 'NETWORK', true);
    }
    if (!res.ok) {
      const text = (await res.text().catch(() => '')).slice(0, 300);
      const retryable = res.status === 429 || res.status >= 500;
      throw new AIProviderError(`Provedor respondeu ${res.status}: ${text}`, 'HTTP_ERROR', retryable, res.status);
    }
    return res.json() as Promise<any>;
  }
}
