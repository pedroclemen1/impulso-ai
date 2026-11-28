# ─── Build: instala dependências, gera o Prisma Client e compila API e frontend ───
FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @impulso/api prisma:generate \
  && pnpm --filter @impulso/api build \
  && pnpm --filter @impulso/web build

# ─── Runtime: API Fastify servindo também o frontend compilado (SPA) ───
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    SERVE_WEB_DIST=/app/apps/web/dist
COPY --from=build /app /app
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && useradd -r -u 1001 impulso && chown -R impulso /app
USER impulso
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s CMD node -e "fetch('http://localhost:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
