import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(12),
  SESSION_IDLE_MINUTES: z.coerce.number().positive().default(120),
  COOKIE_SECURE: bool,
  SERVE_WEB_DIST: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),

  AI_PROVIDER: z.string().default('demo'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  /** Preços de referência (USD por milhão de tokens) para estimativa de custos. Opcionais. */
  AI_PRICE_INPUT_PER_MTOK: z.coerce.number().min(0).optional(),
  AI_PRICE_OUTPUT_PER_MTOK: z.coerce.number().min(0).optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENAI_COMPATIBLE_BASE_URL: z.string().optional(),
  OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
  OPENAI_COMPATIBLE_MODEL: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434/v1'),
  OLLAMA_MODEL: z.string().default('llama3.1'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const allowedOrigins = env.WEB_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
