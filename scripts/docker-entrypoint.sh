#!/bin/sh
set -e
cd /app/apps/api
echo "▶ Aplicando migrações do banco..."
node /app/node_modules/prisma/build/index.js migrate deploy --schema /app/prisma/schema.prisma
if [ "$SEED_ON_START" = "true" ]; then
  echo "▶ Executando seed (idempotente)..."
  node dist/seed.js
fi
echo "▶ Iniciando Impulso AI na porta ${PORT}..."
exec node dist/server.js
