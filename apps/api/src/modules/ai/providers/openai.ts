import { HttpLLMProvider, type CompletionRequest } from './http-provider';
import type { ChatGenerationResponse } from './types';

interface OpenAIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  /** API oficial da OpenAI usa max_completion_tokens; endpoints compatíveis normalmente usam max_tokens. */
  officialApi: boolean;
  requiresKey: boolean;
}

/** Provedor para a API da OpenAI e quaisquer endpoints compatíveis (inclui Ollama em /v1). */
export class OpenAICompatibleProvider extends HttpLLMProvider {
  readonly name: string;
  readonly defaultModel: string;

  constructor(private readonly config: OpenAIConfig) {
    super();
    this.name = config.name;
    this.defaultModel = config.model;
  }

  isConfigured() {
    return !!this.config.baseUrl && !!this.config.model && (!this.config.requiresKey || !!this.config.apiKey);
  }

  protected async complete(req: CompletionRequest): Promise<ChatGenerationResponse> {
    const body: Record<string, unknown> = {
      model: req.model,
      messages: [{ role: 'system', content: req.system }, ...req.messages],
    };
    if (req.temperature !== undefined) body.temperature = req.temperature;
    if (req.maxTokens) body[this.config.officialApi ? 'max_completion_tokens' : 'max_tokens'] = req.maxTokens;
    if (req.json) body.response_format = { type: 'json_object' };
    const headers: Record<string, string> = {};
    if (this.config.apiKey) headers.authorization = `Bearer ${this.config.apiKey}`;
    const data = await this.postJson(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, body, headers, req.signal);
    return {
      content: data?.choices?.[0]?.message?.content ?? '',
      model: data?.model ?? req.model,
      usage: { inputTokens: data?.usage?.prompt_tokens, outputTokens: data?.usage?.completion_tokens },
    };
  }
}
