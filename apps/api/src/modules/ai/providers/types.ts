import type { ZodType } from 'zod';

export type AIOperation =
  | 'course_outline'
  | 'module_content'
  | 'course_assessments'
  | 'activity_evaluation'
  | 'tutor_chat'
  | 'tutor_solution'
  | 'consolidation'
  | 'personalized_example'
  | 'reflection_feedback'
  | 'pedagogical_insights'
  | 'connection_test';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface StructuredGenerationRequest<T> extends GenerationOptions {
  operation: AIOperation;
  system: string;
  prompt: string;
  schema: ZodType<T>;
  /** Entrada estruturada da operação — usada por provedores determinísticos (demo). */
  input: unknown;
}

export interface ChatGenerationRequest extends GenerationOptions {
  operation: AIOperation;
  system: string;
  messages: ChatMessage[];
  input: unknown;
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface ChatGenerationResponse {
  content: string;
  model: string;
  usage?: TokenUsage;
}

export interface StructuredGenerationResponse<T> {
  data: T;
  model: string;
  usage?: TokenUsage;
}

/** Contrato comum para todos os provedores de LLM. A lógica de negócio depende apenas desta interface. */
export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  isConfigured(): boolean;
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<StructuredGenerationResponse<T>>;
  generateChat(request: ChatGenerationRequest): Promise<ChatGenerationResponse>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'HTTP_ERROR' | 'INVALID_OUTPUT' | 'NOT_CONFIGURED' | 'NETWORK' | 'BUDGET',
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
