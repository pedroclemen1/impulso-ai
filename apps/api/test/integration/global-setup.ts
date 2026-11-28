import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

/**
 * Prepara o banco de TESTES: aplica as migrações (não destrutivo) e limpa os dados.
 * Proteção: recusa-se a rodar se o banco não terminar em "_test".
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://impulso:impulso@localhost:5432/impulso_test';
  const dbName = new URL(url).pathname.replace('/', '');
  if (!dbName.endsWith('_test')) throw new Error(`Banco de testes inválido ("${dbName}"): o nome precisa terminar em "_test".`);
  execSync('npx prisma migrate deploy', { stdio: 'pipe', env: { ...process.env, DATABASE_URL: url } });
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`);
  await prisma.$disconnect();
}
