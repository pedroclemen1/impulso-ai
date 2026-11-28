import { env, isProduction } from '../../config/env';
import { hashPassword } from '../../modules/auth/password';
import { getAISettings, invalidateAISettings } from '../../modules/ai/ai.client';
import { prisma } from '../prisma';
import { achievements, competencies, seedCourses } from './content';
import { DEMO_STUDENT_PASSWORD, seedDemoData } from './demo-data';
import { loadCourse } from './load-course';

async function main() {
  const demoRequested = process.env.SEED_DEMO_DATA === 'true';
  const allowDemoInProd = process.env.ALLOW_DEMO_IN_PRODUCTION === 'true';
  const withDemo = demoRequested && (!isProduction || allowDemoInProd);
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@impulso.ai').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Impulso@2026';
  if (isProduction && adminPassword === 'Impulso@2026') {
    throw new Error('Defina SEED_ADMIN_PASSWORD com uma senha forte antes de executar o seed em produção.');
  }
  if (demoRequested && !withDemo) console.warn('⚠ SEED_DEMO_DATA ignorado em produção (defina ALLOW_DEMO_IN_PRODUCTION=true para forçar).');

  console.log('▶ Competências e conquistas');
  for (const c of competencies) await prisma.competency.upsert({ where: { key: c.key }, create: c, update: { name: c.name, description: c.description, category: c.category } });
  const compIds = new Map((await prisma.competency.findMany()).map((c) => [c.key, c.id]));
  for (const a of achievements) {
    const data = { title: a.title, description: a.description, icon: a.icon, criteria: a.criteria, competencyId: a.competencyKey ? compIds.get(a.competencyKey) ?? null : null };
    await prisma.achievement.upsert({ where: { key: a.key }, create: { key: a.key, ...data }, update: data });
  }

  console.log('▶ Super administrador');
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { name: 'Administração Impulso AI', email: adminEmail, role: 'SUPER_ADMIN', passwordHash: await hashPassword(adminPassword), isDemo: !isProduction },
    update: {},
  });

  // O seed usa sempre o provedor demonstrativo (determinístico e sem custo); a configuração original é restaurada ao final.
  const settings = await getAISettings();
  const originalProvider = settings.activeProvider;
  await prisma.aISettings.update({ where: { id: 'default' }, data: { activeProvider: 'demo' } });
  invalidateAISettings();

  try {
    console.log('▶ Cursos');
    const [main, ...others] = seedCourses;
    await loadCourse(main, { createdById: admin.id, isDemo: false });
    console.log(`  • ${main.title}`);
    if (withDemo) {
      for (const c of others) {
        await loadCourse(c, { createdById: admin.id, isDemo: true });
        console.log(`  • ${c.title} (demonstrativo)`);
      }
      console.log('▶ Participantes, turmas e jornadas demonstrativas');
      await seedDemoData(admin.id);
    }
  } finally {
    const restore = env.AI_PROVIDER && originalProvider === 'demo' ? env.AI_PROVIDER : originalProvider;
    await prisma.aISettings.update({ where: { id: 'default' }, data: { activeProvider: ['demo', 'openai', 'anthropic', 'gemini', 'openai_compatible', 'ollama'].includes(restore) ? restore : 'demo' } });
  }

  console.log('\n✔ Seed concluído.');
  console.log(`  Administrador: ${adminEmail} / ${isProduction ? '(senha definida em SEED_ADMIN_PASSWORD)' : adminPassword}`);
  if (withDemo) console.log(`  Participantes demonstrativos: ana.moura@demo.impulso.ai (e outros 14) / ${DEMO_STUDENT_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
