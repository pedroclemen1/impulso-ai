import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const envFile = resolve(__dirname, '../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);
const testDb = process.env.TEST_DATABASE_URL ?? 'postgresql://impulso:impulso@localhost:5432/impulso_test';

export default defineConfig({
  test: {
    // Suítes de integração compartilham o mesmo banco de testes: execução sequencial.
    fileParallelism: false,
    projects: [
      { test: { name: 'unit', include: ['test/unit/**/*.test.ts'], environment: 'node', env: { DATABASE_URL: testDb, NODE_ENV: 'test' } } },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['test/integration/global-setup.ts'],
          env: { DATABASE_URL: testDb, NODE_ENV: 'test', AI_PROVIDER: 'demo', LOG_LEVEL: 'silent', WEB_ORIGIN: 'http://localhost:5173' },
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
