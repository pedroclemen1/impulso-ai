# Impulso AI

**Plataforma de capacitação em Inteligência Artificial e LLMs para profissionais de Recursos Humanos, recrutamento e seleção.**

O Impulso AI não é uma plataforma de videoaulas nem um chatbot genérico. É um ambiente de **aprendizagem adaptativa e coleta de evidências pedagógicas** que:

1. **diagnostica** o conhecimento inicial do participante;
2. **ensina de forma contextualizada** ao dia a dia do recrutamento;
3. **estimula o raciocínio** com um tutor de IA que usa o método socrático;
4. **acompanha a evolução** em cada tentativa, feedback e revisão;
5. **mensura o desenvolvimento de competências** com indicadores transparentes.

> 🚧 **Status: em desenvolvimento ativo.** Este README descreve o escopo completo da entrega e indica com clareza o que já está implementado e o que ainda está em construção.

---

## Sumário

- [Proposta pedagógica](#proposta-pedagógica)
- [Status da entrega](#status-da-entrega)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como executar](#como-executar)
- [Provedores de IA](#provedores-de-ia)
- [Indicadores educacionais](#indicadores-educacionais)
- [Segurança e LGPD](#segurança-e-lgpd)
- [Decisões técnicas](#decisões-técnicas)

---

## Proposta pedagógica

| Princípio | Como aparece na plataforma |
|---|---|
| **Diagnóstico inicial** | Questionário com 12 dimensões (familiaridade, uso, LLMs, prompts, limitações, privacidade, objetivos…) e classificação em 4 níveis: Iniciante, Familiarizado, Intermediário e Avançado. |
| **Classificação justa** | Combina 75% desempenho objetivo + 25% autopercepção. A autopercepção **nunca** eleva o nível acima do que o desempenho objetivo sustenta. |
| **Sem exclusão** | O nível muda a ênfase da trilha (reforço, padrão, revisão rápida), mas todo conteúdo fundamental continua acessível. |
| **ADDIE** | Análise, Design, Desenvolvimento, Implementação e Avaliação registrados por curso e visualizados no painel administrativo. |
| **Jornada em 6 etapas por aula** | Aprender → Contextualizar → Praticar → Refletir → Aprimorar → Consolidar. |
| **Feedback socrático** | O tutor reconhece acertos, aponta lacunas, faz perguntas e oferece pistas progressivas; a solução comentada só aparece após tentativas suficientes. |
| **Avaliação por rubrica** | A IA sugere notas por critério; **pesos e critérios vêm sempre da rubrica do administrador** e a nota ponderada é calculada no backend. |
| **Evidência de aprendizagem** | Primeira resposta, feedback recebido e resposta revisada ficam armazenados, permitindo análise quantitativa e qualitativa. |

### A evolução em três momentos

Em vez de medir apenas a taxa de conclusão, o Impulso AI mostra a evolução do participante:

```
Diagnóstico      Durante o curso      Avaliação final
   35%      →         62%        →         87%

Evolução de conhecimento: +52 p.p.     Ganho normalizado: 80%
```

---

## Status da entrega

Legenda: ✅ implementado · 🟡 em andamento · ⬜ planejado

### Fundação

| Item | Status |
|---|---|
| Monorepo pnpm (`apps/web`, `apps/api`, `packages/shared`) | ✅ |
| Modelo de dados relacional completo (Prisma + PostgreSQL, 30+ entidades, versionamento de cursos) | ✅ |
| Migração inicial do banco | ✅ |
| Pacote compartilhado com constantes de domínio e esquemas Zod de validação | ✅ |
| PostgreSQL local embutido para desenvolvimento sem Docker (`pnpm db:local`) | ✅ |
| `docker-compose.yml` e Dockerfile para `docker compose up --build` | ⬜ |

### Backend (Node.js + Fastify + Prisma)

| Item | Status |
|---|---|
| Configuração validada por variáveis de ambiente | ✅ |
| Autenticação com sessões em cookie HttpOnly, hash bcrypt, expiração absoluta e por inatividade | ✅ |
| Autorização por perfil (SUPER_ADMIN / STUDENT) e por recurso | ✅ |
| Proteção CSRF, tratamento centralizado de erros e respostas padronizadas | ✅ |
| Usuários: CRUD, ativação/desativação e importação por CSV com relatório de erros | ✅ |
| Turmas e membros | ✅ |
| Competências (catálogo e visão de domínio médio) | ✅ |
| Cursos: criação, edição de rascunho, módulos, aulas, atividades, rubricas, avaliações, reordenação | ✅ |
| Versionamento: publicar, nova versão a partir da publicada, duplicar, arquivar (versões publicadas são imutáveis) | ✅ |
| Validação de publicação (conteúdo mínimo, diagnóstico, avaliação final, gabaritos) | ✅ |
| Regras determinísticas: pontuação de questões, classificação diagnóstica, nota ponderada, progresso e conclusão | ✅ |
| Motor adaptativo determinístico (apresentação por nível, trilha sugerida, nível estimado, dificuldades recorrentes) | ✅ |
| Cálculo de indicadores (conclusão, ativação, ganho, ganho normalizado, evolução após feedback, aprovação, engajamento, tempo ativo) | ✅ |
| Motor de matrícula: recálculo de progresso, notas, competências, certificado e conquistas | 🟡 |
| Alocações (individual, múltipla, por turma, sem duplicidade por versão) | ⬜ |
| Diagnóstico, avaliações de módulo, avaliação final e pesquisa de satisfação (rotas do estudante) | ⬜ |
| Submissão de atividades, avaliação com IA e revisão manual com histórico | ⬜ |
| Tutor socrático (chat, pistas, solução comentada, consolidação) | ⬜ |
| Dashboards e relatórios em CSV | ⬜ |
| Documentação OpenAPI em `/api/docs` | ⬜ |

### Inteligência artificial

| Item | Status |
|---|---|
| Interface `AIProvider` desacoplada de fornecedores | ✅ |
| Provedores: OpenAI, Anthropic, Google Gemini, compatíveis com OpenAI e Ollama | ✅ |
| **Provedor demonstrativo determinístico** (funciona sem chave de API) | ✅ |
| Gateway central: timeouts, retentativas limitadas, validação de saída estruturada com reparo, orçamento mensal, registro de uso (sem conteúdo sensível) e fallback | ✅ |
| Prompts de sistema separados da lógica de negócio, com o conteúdo do estudante tratado como dado não confiável | ✅ |
| Proteção LGPD: mascaramento de CPF, RG, e-mail e telefone antes do envio às LLMs; detecção de *prompt injection* | ✅ |
| Serviços: geração de cursos por etapas, tutor socrático, avaliação de atividades, personalização e insights pedagógicos | 🟡 |

### Frontend (React + TypeScript + Vite)

| Item | Status |
|---|---|
| Design system (Tailwind + componentes no padrão shadcn/ui, Inter, paleta índigo) | ⬜ |
| Login e redirecionamento por perfil | ⬜ |
| Área do estudante: dashboard, cursos, diagnóstico, player de aula em 6 etapas, tutor, avaliações, competências, histórico, certificados, perfil | ⬜ |
| Área administrativa: dashboard com gráficos e filtros, editor de cursos em árvore, gerador de cursos com IA, participantes, turmas, alocações, avaliações, competências, relatórios, configurações de IA | ⬜ |

### Conteúdo e dados demonstrativos

| Item | Status |
|---|---|
| Curso completo “Inteligência Artificial Aplicada ao Recrutamento e Seleção” (6 módulos, atividades, rubricas, questionários) | 🟡 |
| Dois cursos demonstrativos adicionais | 🟡 |
| Seed com 1 administrador, 15 participantes fictícios, 3 turmas e histórico de aprendizagem gerado pelos próprios serviços | ⬜ |

### Qualidade

| Item | Status |
|---|---|
| Testes unitários (classificação, progresso, indicadores, nota ponderada, autorização, validação de saída da IA) | ⬜ |
| Testes de integração (autenticação, cursos, alocação, diagnóstico, atividades, isolamento entre estudantes) | ⬜ |
| Testes end-to-end com Playwright (jornada completa administrador → estudante → indicadores) | ⬜ |
| Lint, typecheck e build | ⬜ |

---

## Arquitetura

**Monólito modular**, simples de executar e manter — sem microserviços, filas, Redis ou banco vetorial.

```
┌──────────────────────────┐        ┌───────────────────────────────────────────┐
│  apps/web                │  HTTP  │  apps/api (Fastify)                       │
│  React + React Router    │ ─────► │  auth · users · cohorts · courses         │
│  TanStack Query          │ cookie │  enrollments · assessments · activities   │
│  Tailwind + shadcn/ui    │HttpOnly│  learning · tutor · analytics · ai        │
└──────────────────────────┘        └──────────────┬──────────────┬─────────────┘
                                                   │ Prisma       │ AIProvider
                                            ┌──────▼─────┐  ┌─────▼──────────────┐
                                            │ PostgreSQL │  │ OpenAI · Anthropic │
                                            └────────────┘  │ Gemini · Ollama    │
                                                            │ Demo (determinist.)│
                                                            └────────────────────┘
```

**Regra central:** decisões pedagógicas fundamentais (classificação, progresso, conclusão, nota ponderada, trilha) são **determinísticas**. A IA é usada para contextualizar, explicar, gerar exemplos e dar feedback.

### Stack

- **Frontend:** React 18, TypeScript (strict), Vite, React Router, Tailwind CSS, shadcn/ui, Lucide, TanStack Query, React Hook Form, Zod, Recharts.
- **Backend:** Node.js, TypeScript, Fastify 5, Prisma 6, PostgreSQL, Zod, OpenAPI.
- **Testes:** Vitest e Playwright.

---

## Estrutura do projeto

```
ImpulsoAI/
├── apps/
│   ├── api/                 # Backend Fastify
│   │   └── src/
│   │       ├── config/      # Variáveis de ambiente validadas
│   │       ├── database/    # Prisma client e seed
│   │       ├── middlewares/ # Autenticação, CSRF, erros
│   │       ├── modules/     # Domínios: auth, users, cohorts, courses, learning,
│   │       │                # assessments, activities, tutor, ai, analytics...
│   │       └── shared/      # Erros, HTTP, auditoria, texto/LGPD, autorização
│   └── web/                 # Frontend React
├── packages/shared/         # Constantes e esquemas Zod compartilhados
├── prisma/                  # schema.prisma e migrações
├── scripts/                 # PostgreSQL local embutido
└── .env.example
```

---

## Como executar

> As instruções abaixo refletem o estado atual. Quando o Docker Compose estiver pronto, a execução completa será feita com `docker compose up --build`.

**Pré-requisitos:** Node.js 20+ e pnpm 10+.

```bash
pnpm install
cp .env.example .env

# Terminal 1 — PostgreSQL local (sem Docker)
pnpm db:local

# Terminal 2 — migrações e Prisma Client
pnpm db:deploy
pnpm db:generate
```

As credenciais de demonstração (somente para ambiente local) serão publicadas aqui quando o seed estiver concluído. Credenciais demonstrativas **não** são criadas automaticamente em produção.

---

## Provedores de IA

Configure em `.env` (variável `AI_PROVIDER`) e ajuste no painel em **Configurações de IA**:

| Provedor | Variáveis |
|---|---|
| `demo` (padrão) | nenhuma — respostas determinísticas, claramente identificadas |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| `anthropic` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `gemini` | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| `openai_compatible` | `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, `OPENAI_COMPATIBLE_MODEL` |
| `ollama` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

Se o provedor configurado falhar, conteúdos, questionários objetivos e progresso continuam funcionando; tutor e avaliação recorrem ao provedor demonstrativo e o resultado é marcado para revisão humana. As chaves de API nunca são expostas ao frontend.

---

## Indicadores educacionais

| Indicador | Definição |
|---|---|
| Taxa de conclusão | Alocações concluídas ÷ alocações elegíveis |
| Taxa de ativação | Participantes que iniciaram ÷ participantes alocados |
| Evolução de conhecimento | Avaliação final − diagnóstico (p.p., mesma escala e competências comparáveis) |
| Ganho normalizado | (final − inicial) ÷ (100 − inicial); indefinido quando inicial = 100 |
| Evolução após feedback | Última tentativa válida − primeira tentativa da mesma atividade (sem afirmação causal) |
| Domínio por competência | Média ponderada das evidências associadas à competência |
| Taxa de aprovação | Aprovados ÷ participantes que fizeram a avaliação final |
| Engajamento | Dias ativos, aulas concluídas, atividades, interações com o tutor e retornos |
| Tempo de aprendizagem | Soma de sessões ativas; pausas acima de 5 minutos são desconsideradas |
| Satisfação e aplicabilidade | Pesquisa Likert pós-curso — **dado autodeclarado**, exibido separadamente dos resultados objetivos |

---

## Segurança e LGPD

- Senhas com bcrypt; sessões em cookies HttpOnly (Secure em produção), SameSite e expiração por inatividade.
- CSRF por cabeçalho personalizado + verificação de origem; CORS restritivo; rate limiting; limite de tamanho de requisições.
- Autorização por perfil **e** por recurso: um estudante nunca acessa matrículas, avaliações ou conversas de outro.
- Markdown renderizado sem HTML bruto (prevenção de XSS); Prisma contra SQL injection.
- Dados pessoais (CPF, RG, e-mail, telefone) são mascarados antes de chegar às LLMs e de serem persistidos nas respostas.
- Respostas de estudantes são tratadas como dados não confiáveis nos prompts; tentativas de manipulação são sinalizadas para revisão.
- Auditoria das operações administrativas.
- Exercícios usam apenas dados fictícios. **A plataforma é educacional e não toma decisões automatizadas de contratação.**

---

## Decisões técnicas

- **Versionamento de cursos:** módulos, aulas, atividades e avaliações pertencem a uma `CourseVersion`. Publicar congela a versão; editar depois cria um novo rascunho. Tentativas e avaliações já realizadas nunca são alteradas silenciosamente.
- **Avaliações por IA são apoio pedagógico:** cada revisão manual gera uma nova avaliação e preserva o histórico.
- **Provedor demonstrativo:** permite demonstrar toda a plataforma sem contratar API e serve de fallback.
- **Sem cadastro público:** participantes são cadastrados ou importados pelo administrador.
- **Gamificação leve e individual:** conquistas e certificados, sem rankings públicos.
