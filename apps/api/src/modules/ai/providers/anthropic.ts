import { HttpLLMProvider, type CompletionRequest } from './http-provider';
import type { ChatGenerationResponse } from './types';

export class AnthropicProvider extends HttpLLMProvider {
  readonly name = 'anthropic';

  constructor(
    private readonly apiKey: string | undefined,
    readonly defaultModel: string,
  ) {
    super();
  }

  isConfigured() {
    return !!this.apiKey;
  }

  protected async complete(req: CompletionRequest): Promise<ChatGenerationResponse> {
    const body: Record<string, unknown> = {
      model: req.model,
      system: req.system,
      messages: req.messages,
      max_tokens: req.maxTokens ?? 2000,
    };
    if (req.temperature !== undefined) body.temperature = Math.min(1, req.temperature);
    const data = await this.postJson(
      'https://api.anthropic.com/v1/messages',
      body,
      { 'x-api-key': this.apiKey ?? '', 'anthropic-version': '2023-06-01' },
      req.signal,
    );
    const text = Array.isArray(data?.content)
      ? data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
      : '';
    return {
      content: text,
      model: data?.model ?? req.model,
      usage: { inputTokens: data?.usage?.input_tokens, outputTokens: data?.usage?.output_tokens },
    };
  }
}
