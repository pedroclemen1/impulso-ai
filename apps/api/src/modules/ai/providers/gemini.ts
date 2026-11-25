import { HttpLLMProvider, type CompletionRequest } from './http-provider';
import type { ChatGenerationResponse } from './types';

export class GeminiProvider extends HttpLLMProvider {
  readonly name = 'gemini';

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
    const generationConfig: Record<string, unknown> = {};
    if (req.temperature !== undefined) generationConfig.temperature = req.temperature;
    if (req.maxTokens) generationConfig.maxOutputTokens = req.maxTokens;
    if (req.json) generationConfig.responseMimeType = 'application/json';
    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig,
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(req.model)}:generateContent`;
    const data = await this.postJson(url, body, { 'x-goog-api-key': this.apiKey ?? '' }, req.signal);
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    return {
      content: parts.map((p: { text?: string }) => p.text ?? '').join(''),
      model: req.model,
      usage: { inputTokens: data?.usageMetadata?.promptTokenCount, outputTokens: data?.usageMetadata?.candidatesTokenCount },
    };
  }
}
