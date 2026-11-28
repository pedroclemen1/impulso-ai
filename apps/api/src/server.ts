import { buildApp } from './app';
import { env } from './config/env';
import { prisma } from './database/prisma';
import { CourseGenerationService } from './modules/ai/services/course-generation.service';

async function main() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
  await CourseGenerationService.resumeInterrupted();

  const shutdown = async (signal: string) => {
    app.log.info(`Recebido ${signal}, encerrando...`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
