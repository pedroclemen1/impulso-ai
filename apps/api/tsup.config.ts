import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { server: 'src/server.ts', seed: 'src/database/seed/index.ts' },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@impulso/shared'],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});
