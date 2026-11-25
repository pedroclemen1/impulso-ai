// Inicia um PostgreSQL local embutido (sem Docker) para desenvolvimento e testes.
// Uso: pnpm db:local  — mantém o processo em execução; Ctrl+C para encerrar.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const port = Number(process.env.LOCAL_PG_PORT ?? 5432);
const databaseDir = resolve(process.cwd(), '.pgdata');
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'impulso',
  password: 'impulso',
  port,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--no-locale'],
});

const fresh = !existsSync(databaseDir);
if (fresh) await pg.initialise();
await pg.start();
for (const db of ['impulso', 'impulso_test']) {
  try {
    await pg.createDatabase(db);
    console.log(`Banco "${db}" criado.`);
  } catch {
    // já existe
  }
}
console.log(`PostgreSQL local em postgresql://impulso:impulso@localhost:${port}/impulso`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
