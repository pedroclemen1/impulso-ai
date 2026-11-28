/**
 * Dados demonstrativos: participantes fictícios percorrem a jornada usando os MESMOS serviços
 * da aplicação (diagnóstico, atividades avaliadas pelo provedor demo, tutor, consolidação,
 * avaliações). Depois, os registros são distribuídos ao longo das últimas semanas para que os
 * gráficos de participação façam sentido. Todos os indicadores derivam destes registros.
 */
import type { AssessmentAnswer } from '@prisma/client';
import { asStringArray } from '../../shared/http';
import { ActivitiesService } from '../../modules/activities/activities.service';
import { SocraticTutorService } from '../../modules/ai/services/socratic-tutor.service';
import { submitAttempt } from '../../modules/assessments/assessments.service';
import { hashPassword } from '../../modules/auth/password';
import { recalculateEnrollment } from '../../modules/learning/engine';
import { LearningService } from '../../modules/learning/learning.service';
import { prisma } from '../prisma';

export const DEMO_STUDENT_PASSWORD = 'Aluno@2026';
const DAY = 86_400_000;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Persona {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  /** Probabilidade de acerto em questões objetivas no diagnóstico (conhecimento prévio). */
  skill: number;
  /** Autopercepção 1–5. */
  confidence: number;
  /** 0 alocado · 1 diagnóstico · 2 módulo 1 · 3 módulos 1–3 · 4 todas as aulas · 5 concluído */
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  cohort: number;
}

const PERSONAS: Persona[] = [
  { name: 'Ana Beatriz Moura', email: 'ana.moura', jobTitle: 'Analista de Recrutamento Júnior', department: 'Recrutamento e Seleção', skill: 0.2, confidence: 1, stage: 5, cohort: 0 },
  { name: 'Bruno Carvalho Lima', email: 'bruno.lima', jobTitle: 'Analista de Recrutamento Pleno', department: 'Recrutamento e Seleção', skill: 0.45, confidence: 3, stage: 5, cohort: 0 },
  { name: 'Camila Ferreira Rocha', email: 'camila.rocha', jobTitle: 'Tech Recruiter', department: 'Talent Acquisition', skill: 0.75, confidence: 4, stage: 5, cohort: 1 },
  { name: 'Diego Nascimento', email: 'diego.nascimento', jobTitle: 'Coordenador de Talent Acquisition', department: 'Talent Acquisition', skill: 0.9, confidence: 5, stage: 5, cohort: 1 },
  { name: 'Elisa Martins Prado', email: 'elisa.prado', jobTitle: 'Analista de RH Generalista', department: 'Recursos Humanos', skill: 0.35, confidence: 2, stage: 5, cohort: 2 },
  { name: 'Felipe Araújo Santos', email: 'felipe.santos', jobTitle: 'Assistente de RH', department: 'Recursos Humanos', skill: 0.15, confidence: 2, stage: 4, cohort: 2 },
  { name: 'Gabriela Teixeira', email: 'gabriela.teixeira', jobTitle: 'Business Partner de RH', department: 'Recursos Humanos', skill: 0.6, confidence: 4, stage: 3, cohort: 2 },
  { name: 'Henrique Batista', email: 'henrique.batista', jobTitle: 'Analista de Recrutamento Pleno', department: 'Recrutamento e Seleção', skill: 0.5, confidence: 5, stage: 3, cohort: 0 },
  { name: 'Isabela Cunha Reis', email: 'isabela.reis', jobTitle: 'Tech Recruiter Sênior', department: 'Talent Acquisition', skill: 0.85, confidence: 4, stage: 3, cohort: 1 },
  { name: 'João Pedro Almeida', email: 'joao.almeida', jobTitle: 'Estagiário de RH', department: 'Recursos Humanos', skill: 0.1, confidence: 1, stage: 2, cohort: 2 },
  { name: 'Karina Lopes Duarte', email: 'karina.duarte', jobTitle: 'Analista de Atração de Talentos', department: 'Talent Acquisition', skill: 0.55, confidence: 3, stage: 2, cohort: 1 },
  { name: 'Lucas Mendes Viana', email: 'lucas.viana', jobTitle: 'Analista de Recrutamento Júnior', department: 'Recrutamento e Seleção', skill: 0.3, confidence: 3, stage: 2, cohort: 0 },
  { name: 'Mariana Gomes Freitas', email: 'mariana.freitas', jobTitle: 'Gerente de RH', department: 'Recursos Humanos', skill: 0.65, confidence: 3, stage: 1, cohort: 2 },
  { name: 'Natália Ribeiro', email: 'natalia.ribeiro', jobTitle: 'Analista de Recrutamento Pleno', department: 'Recrutamento e Seleção', skill: 0.4, confidence: 2, stage: 1, cohort: 0 },
  { name: 'Otávio Pires Campos', email: 'otavio.campos', jobTitle: 'Recrutador Operacional', department: 'Recrutamento e Seleção', skill: 0.25, confidence: 2, stage: 0, cohort: 0 },
];

const COHORTS = [
  { name: 'Recrutamento e Seleção — Turma Piloto', description: 'Turma piloto com analistas de recrutamento e seleção.' },
  { name: 'Talent Acquisition', description: 'Equipe de atração de talentos e tech recruiting.' },
  { name: 'Capacitação em IA 2026 — RH', description: 'Profissionais de RH generalista participantes do programa de capacitação em IA 2026.' },
];

type Q = { id: string; type: string; selfReported: boolean; isScored: boolean; dimension: string | null; likertLabels: unknown; options: { id: string; isCorrect: boolean; score: number | null }[] };

function answerQuestion(q: Q, p: number, confidence: number, r: () => number) {
  const correct = q.options.filter((o) => o.isCorrect);
  const wrong = q.options.filter((o) => !o.isCorrect);
  switch (q.type) {
    case 'LIKERT':
      return { questionId: q.id, likertValue: Math.max(1, Math.min(5, confidence + (r() < 0.3 ? 1 : 0) - (r() < 0.2 ? 1 : 0))) };
    case 'OPEN':
      return { questionId: q.id, textAnswer: q.dimension === 'ACTIVITIES' ? 'Conduzo triagem de currículos, entrevistas por competências e alinhamento de perfil com gestores.' : q.dimension === 'CHALLENGES' ? 'Volume alto de vagas, pouco tempo para personalizar a comunicação com candidatos e dificuldade em padronizar critérios.' : 'O curso foi útil para aplicar a IA com mais segurança no dia a dia.' };
    case 'MULTIPLE_CHOICE': {
      if (!correct.length) return { questionId: q.id, selectedOptionIds: q.options.slice(0, Math.max(1, Math.round(confidence / 2))).map((o) => o.id) };
      const pick = r() < p ? correct : [correct[0], ...(wrong[0] ? [wrong[0]] : [])];
      return { questionId: q.id, selectedOptionIds: pick.map((o) => o.id) };
    }
    default: {
      if (q.selfReported) {
        const target = (confidence - 1) * 25;
        const best = [...q.options].sort((a, b) => Math.abs((a.score ?? 0) - target) - Math.abs((b.score ?? 0) - target))[0];
        return { questionId: q.id, selectedOptionIds: best ? [best.id] : [] };
      }
      const right = correct[0] ?? [...q.options].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
      const partial = [...wrong].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
      const chosen = r() < p ? right : r() < 0.5 && partial ? partial : wrong[wrong.length - 1] ?? right;
      return { questionId: q.id, selectedOptionIds: chosen ? [chosen.id] : [] };
    }
  }
}

async function answerAssessment(userId: string, assessmentId: string, p: number, confidence: number, r: () => number) {
  const a = await prisma.assessment.findUniqueOrThrow({ where: { id: assessmentId }, include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } } });
  const answers = a.questions.map((q) => answerQuestion(q as Q, p, confidence, r));
  return submitAttempt({ id: userId, role: 'STUDENT' }, assessmentId, { answers });
}

function activityAnswer(activity: { guidedSteps: unknown; expectedKeywords: unknown; title: string }, quality: 'low' | 'mid' | 'high') {
  const steps = asStringArray(activity.guidedSteps);
  const kw = asStringArray(activity.expectedKeywords);
  if (quality === 'low') return `Eu usaria a IA para me ajudar com ${activity.title.toLowerCase()} e depois conferiria o resultado antes de usar.`;
  const half = kw.slice(0, Math.ceil(kw.length / 2));
  const lines = [
    `Proposta para "${activity.title}" (dados fictícios):`,
    ...steps.slice(0, quality === 'mid' ? 2 : steps.length).map((s, i) => `${i + 1}. ${s}`),
    `Pontos considerados: ${(quality === 'mid' ? half : kw).join(', ')}.`,
  ];
  if (quality === 'high') {
    lines.push(
      'Antes de usar qualquer resultado, valido as informações com o gestor e reviso criticamente o texto gerado, verificando possíveis alucinações e vieses.',
      'Não insiro dados pessoais de candidatos: uso informações anonimizadas, conforme a LGPD, e a decisão final permanece com a supervisão humana.',
    );
  }
  return lines.join('\n');
}

export async function seedDemoData(adminId: string) {
  if (await prisma.user.count({ where: { isDemo: true, role: 'STUDENT' } })) {
    console.log('  • Participantes demonstrativos já existem — simulação ignorada.');
    return;
  }
  const passwordHash = await hashPassword(DEMO_STUDENT_PASSWORD);
  const cohorts = [];
  for (const c of COHORTS) cohorts.push(await prisma.cohort.upsert({ where: { name: c.name }, create: c, update: {} }));

  const main = await prisma.course.findUniqueOrThrow({ where: { slug: 'ia-recrutamento-selecao' } });
  const communication = await prisma.course.findUniqueOrThrow({ where: { slug: 'ia-comunicacao-candidatos' } });
  const interviews = await prisma.course.findUniqueOrThrow({ where: { slug: 'entrevistas-estruturadas-ia' } });

  for (const [i, persona] of PERSONAS.entries()) {
    const r = rng(1000 + i * 7919);
    const user = await prisma.user.create({
      data: {
        name: persona.name,
        email: `${persona.email}@demo.impulso.ai`,
        passwordHash,
        role: 'STUDENT',
        isDemo: true,
        profile: { create: { jobTitle: persona.jobTitle, department: persona.department, company: 'Empresa Demonstrativa S.A. (fictícia)' } },
        cohortMemberships: { create: { cohortId: cohorts[persona.cohort].id } },
      },
    });
    const enroll = (course: typeof main, cohortId?: string) =>
      prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          courseVersionId: course.latestPublishedVersionId!,
          cohortId: cohortId ?? null,
          assignedById: adminId,
          dueDate: new Date(Date.now() + 45 * DAY),
        },
      });
    const enrollment = await enroll(main, cohorts[persona.cohort].id);
    if (persona.cohort === 1) await enroll(communication, cohorts[1].id);
    if (i % 5 === 0) await enroll(interviews);

    if (persona.stage >= 1) {
      process.stdout.write(`  • ${persona.name}: diagnóstico`);
      const diag = await prisma.assessment.findFirstOrThrow({ where: { courseVersionId: enrollment.courseVersionId, kind: 'DIAGNOSTIC' } });
      await answerAssessment(user.id, diag.id, persona.skill, persona.confidence, r);
    }
    if (persona.stage >= 2) {
      const version = await prisma.courseVersion.findUniqueOrThrow({
        where: { id: enrollment.courseVersionId },
        include: { modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { activity: true } } } }, assessments: true },
      });
      const moduleLimit = persona.stage === 2 ? 1 : persona.stage === 3 ? 3 : version.modules.length;
      const learned = Math.min(0.95, persona.skill + 0.3);
      for (const m of version.modules.slice(0, moduleLimit)) {
        process.stdout.write(` · M${m.order}`);
        for (const l of m.lessons) {
          await LearningService.lesson(user.id, main.id, l.id);
          if (l.activity) {
            const firstQuality = persona.skill < 0.35 ? 'low' : persona.skill < 0.7 ? 'mid' : 'high';
            await ActivitiesService.submit(user.id, l.activity.id, activityAnswer(l.activity, firstQuality));
            if (r() < 0.7) await SocraticTutorService.sendMessage(user.id, main.id, l.id, 'Fiquei em dúvida sobre como deixar minha resposta mais completa. O que eu deveria considerar primeiro?');
            if (firstQuality !== 'high') {
              if (r() < 0.5) await SocraticTutorService.hint(user.id, main.id, l.id);
              await ActivitiesService.submit(user.id, l.activity.id, activityAnswer(l.activity, firstQuality === 'low' && r() < 0.5 ? 'mid' : 'high'));
            }
          }
          await LearningService.consolidate(
            user.id,
            main.id,
            l.id,
            `Vou aplicar o que aprendi em "${l.title}" na minha rotina de ${persona.jobTitle.toLowerCase()}, sempre revisando os resultados e usando dados fictícios ou anonimizados.`,
          );
        }
        const quiz = version.assessments.find((a) => a.kind === 'MODULE_QUIZ' && a.moduleId === m.id);
        if (quiz) {
          const res = await answerAssessment(user.id, quiz.id, learned, persona.confidence, r);
          if (!res.attempt.passed && res.attemptsRemaining > 0) await answerAssessment(user.id, quiz.id, Math.min(0.97, learned + 0.2), persona.confidence, r);
        }
      }
      if (persona.stage === 5) {
        process.stdout.write(' · final');
        const final = version.assessments.find((a) => a.kind === 'FINAL')!;
        let res = await answerAssessment(user.id, final.id, Math.min(0.97, persona.skill + 0.45), persona.confidence, r);
        if (!res.attempt.passed) res = await answerAssessment(user.id, final.id, 0.97, persona.confidence, r);
        const sat = version.assessments.find((a) => a.kind === 'SATISFACTION');
        if (sat) await answerAssessment(user.id, sat.id, 1, Math.min(5, 3 + Math.round(r() * 2)), r);
      }
    }
    process.stdout.write('\n');
    await spreadTimeline(user.id, persona.stage, i);
  }

  // Uma revisão manual demonstrativa, preservando o histórico da avaliação automática.
  const toReview = await prisma.activitySubmission.findFirst({
    where: { evaluations: { some: { isCurrent: true, requiresHumanReview: true } } },
    include: { evaluations: { where: { isCurrent: true }, include: { scores: true } } },
  });
  if (toReview) {
    await ActivitiesService.review(toReview.id, adminId, {
      scores: toReview.evaluations[0].scores.map((s) => ({ criterionId: s.criterionId, score: Math.min(100, s.score + 10), justification: 'Ajuste após leitura humana: a resposta demonstra intenção correta, embora sucinta.' })),
      reviewNote: 'Revisão demonstrativa do administrador: nota ajustada considerando o contexto da resposta.',
    });
  }
}

/**
 * Redistribui os registros do participante ao longo das últimas semanas (ordem preservada)
 * e cria sessões de aprendizagem coerentes com esses dias.
 */
async function spreadTimeline(userId: string, stage: number, index: number) {
  if (stage === 0) return;
  const enrollments = await prisma.enrollment.findMany({ where: { userId } });
  const ids = enrollments.map((e) => e.id);
  const [attempts, submissions, progress, messages] = await Promise.all([
    prisma.assessmentAttempt.findMany({ where: { userId }, select: { id: true, submittedAt: true } }),
    prisma.activitySubmission.findMany({ where: { userId }, select: { id: true, createdAt: true } }),
    prisma.learningProgress.findMany({ where: { enrollmentId: { in: ids } }, select: { id: true, startedAt: true, completedAt: true } }),
    prisma.tutorMessage.findMany({ where: { conversation: { userId } }, select: { id: true, createdAt: true } }),
  ]);
  type Ev = { kind: 'attempt' | 'submission' | 'progress' | 'message'; id: string; at: Date };
  const events: Ev[] = [
    ...attempts.filter((a) => a.submittedAt).map((a) => ({ kind: 'attempt' as const, id: a.id, at: a.submittedAt! })),
    ...submissions.map((s) => ({ kind: 'submission' as const, id: s.id, at: s.createdAt })),
    ...progress.map((p) => ({ kind: 'progress' as const, id: p.id, at: p.completedAt ?? p.startedAt })),
    ...messages.map((m) => ({ kind: 'message' as const, id: m.id, at: m.createdAt })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id));
  if (!events.length) return;

  const spanDays = 6 + stage * 4 + (index % 4);
  const start = Date.now() - (spanDays + 1) * DAY;
  const virtual = (i: number) => new Date(start + Math.floor((i / Math.max(1, events.length - 1)) * spanDays) * DAY + (9 + (i % 9)) * 3600_000 + (i % 60) * 60_000);
  const mapped = events.map((e, i) => ({ ...e, v: virtual(i) }));

  for (const e of mapped) {
    if (e.kind === 'attempt') await prisma.assessmentAttempt.update({ where: { id: e.id }, data: { startedAt: new Date(e.v.getTime() - 12 * 60_000), submittedAt: e.v } });
    if (e.kind === 'submission') {
      await prisma.activitySubmission.update({ where: { id: e.id }, data: { createdAt: e.v } });
      await prisma.activityEvaluation.updateMany({ where: { submissionId: e.id, source: { not: 'HUMAN' } }, data: { createdAt: new Date(e.v.getTime() + 5000) } });
    }
    if (e.kind === 'progress') await prisma.learningProgress.update({ where: { id: e.id }, data: { startedAt: new Date(e.v.getTime() - 20 * 60_000), completedAt: (await prisma.learningProgress.findUnique({ where: { id: e.id } }))?.completedAt ? e.v : null } });
    if (e.kind === 'message') await prisma.tutorMessage.update({ where: { id: e.id }, data: { createdAt: e.v } });
  }
  const first = mapped[0].v;
  const last = mapped[mapped.length - 1].v;
  for (const en of enrollments) {
    if (!en.startedAt) continue;
    await prisma.enrollment.update({
      where: { id: en.id },
      data: { startDate: new Date(first.getTime() - DAY), startedAt: first, lastActivityAt: last, completedAt: en.completedAt ? last : null },
    });
  }
  await prisma.certificate.updateMany({ where: { userId }, data: { issuedAt: last } });
  await prisma.userAchievement.updateMany({ where: { userId }, data: { awardedAt: last } });

  // Sessões ativas por dia (pausas longas não contam como tempo de aprendizagem).
  const byDay = new Map<string, Date[]>();
  for (const e of mapped) byDay.set(e.v.toISOString().slice(0, 10), [...(byDay.get(e.v.toISOString().slice(0, 10)) ?? []), e.v]);
  const mainEnrollment = enrollments[0];
  for (const times of byDay.values()) {
    const s = times[0];
    const activeSeconds = Math.min(2700, 600 + times.length * 150);
    await prisma.learningSession.create({
      data: { userId, enrollmentId: mainEnrollment.id, startedAt: new Date(s.getTime() - 10 * 60_000), lastHeartbeatAt: new Date(s.getTime() - 10 * 60_000 + activeSeconds * 1000), activeSeconds },
    });
  }
  for (const en of enrollments) await recalculateEnrollment(en.id);
  // recalculateEnrollment não altera datas já definidas; reaplica a data de conclusão virtual.
  for (const en of enrollments) if (en.startedAt) await prisma.enrollment.updateMany({ where: { id: en.id, status: 'COMPLETED' }, data: { completedAt: last } });
}

export type { AssessmentAnswer };
