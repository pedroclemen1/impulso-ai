import { buildSatisfactionSurvey, LIKERT_AGREEMENT, LIKERT_FAMILIARITY } from './shared-assessments';
import type { SeedCourse } from './types';

export const interviewsCourse: SeedCourse = {
  slug: 'entrevistas-estruturadas-ia',
  title: 'Entrevistas Estruturadas com Apoio de IA',
  description:
    'Construa entrevistas estruturadas mais justas e consistentes com apoio de IA: da definição de competências e perguntas comportamentais às escalas de avaliação com âncoras, passando pela consolidação de evidências e pela prevenção de vieses.',
  objectives: [
    'Definir competências e perguntas comportamentais e situacionais com apoio de IA.',
    'Construir escalas de avaliação com âncoras comportamentais.',
    'Consolidar evidências de entrevistas de forma anonimizada e crítica.',
    'Prevenir vieses na condução e na avaliação de entrevistas.',
  ],
  targetAudience: 'Recrutadores e profissionais de RH que conduzem ou estruturam entrevistas, e que já têm alguma familiaridade com IA.',
  prerequisites: 'Familiaridade básica com ferramentas de IA e engenharia de prompts.',
  difficulty: 'INTERMEDIATE',
  estimatedHours: 3,
  coverColor: 'sky',
  competencyKeys: ['ai_recruitment', 'critical_thinking', 'workflow_design', 'responsible_ai'],
  addieNotes: {
    analysis:
      'O diagnóstico avalia o uso atual de entrevistas estruturadas, a capacidade de identificar perguntas inadequadas e a compreensão sobre consolidação de evidências, além das dificuldades relatadas na padronização das entrevistas.',
    design:
      'Dois módulos: o primeiro foca no desenho do roteiro e das escalas; o segundo, na consolidação de evidências e na prevenção de vieses. Atividades práticas com rubricas reforçam a aplicação.',
    development:
      'Os conteúdos incluem exemplos de perguntas comportamentais e situacionais, escalas com âncoras comportamentais e casos fictícios de consolidação de evidências.',
    implementation:
      'Indicado para recrutadores e gestores entrevistadores, alocados por turma. O tutor apoia a construção dos roteiros com perguntas socráticas.',
    evaluation:
      'Mede-se a evolução entre diagnóstico e avaliação final, a qualidade dos roteiros produzidos (rubrica) e a percepção de aplicabilidade.',
  },
  diagnostic: {
    kind: 'DIAGNOSTIC',
    title: 'Diagnóstico — Entrevistas estruturadas',
    description: 'Ajude-nos a entender seu ponto de partida. Não há aprovação ou reprovação.',
    passingScore: 0,
    maxAttempts: 1,
    questions: [
      {
        type: 'LIKERT',
        dimension: 'FAMILIARITY',
        prompt: 'Como você avalia sua familiaridade com entrevistas estruturadas por competências?',
        selfReported: true,
        likertLabels: LIKERT_FAMILIARITY,
      },
      {
        type: 'SINGLE_CHOICE',
        dimension: 'FREQUENCY',
        prompt: 'Com que frequência você usa IA para preparar entrevistas?',
        selfReported: true,
        options: [
          { label: 'Nunca', score: 0 },
          { label: 'Raramente', score: 25 },
          { label: 'Algumas vezes por mês', score: 50 },
          { label: 'Algumas vezes por semana', score: 75 },
          { label: 'Sempre que preparo uma entrevista', score: 100 },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        dimension: 'RECRUITMENT_AI',
        competencyKey: 'ai_recruitment',
        prompt: 'O que caracteriza uma entrevista estruturada?',
        explanation: 'Mesmas perguntas, mesma ordem e critérios definidos previamente para todos os candidatos.',
        options: [
          { label: 'Uma conversa livre que se adapta a cada candidato.', isCorrect: false },
          { label: 'Mesmas perguntas, na mesma ordem, com critérios de avaliação definidos previamente.', isCorrect: true },
          { label: 'Uma entrevista conduzida por uma IA.', isCorrect: false },
          { label: 'Uma entrevista com testes técnicos obrigatórios.', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE',
        dimension: 'LIMITATIONS',
        competencyKey: 'responsible_ai',
        prompt: 'Quais perguntas são inadequadas em uma entrevista? (selecione todas as corretas)',
        explanation: 'Perguntas sobre planos de gravidez, religião e idade são inadequadas e podem configurar discriminação.',
        options: [
          { label: '"Você pretende ter filhos nos próximos anos?"', isCorrect: true },
          { label: '"Conte sobre um projeto em que você precisou negociar prazos."', isCorrect: false },
          { label: '"Qual é a sua religião?"', isCorrect: true },
          { label: '"Quantos anos você tem?"', isCorrect: true },
        ],
      },
      {
        type: 'SCENARIO',
        dimension: 'LIMITATIONS',
        competencyKey: 'critical_thinking',
        prompt: 'A IA resumiu uma entrevista concluindo: "candidato demonstra falta de liderança". O que você faz?',
        explanation: 'Conclusões sobre pessoas exigem evidências registradas; o resumo deve ser conferido com as anotações.',
        options: [
          { label: 'Registro a conclusão na avaliação.', score: 0, isCorrect: false },
          { label: 'Peço à IA que suavize a frase.', score: 10, isCorrect: false },
          { label: 'Confiro as anotações originais e avalio a competência com base nas evidências e na escala definida.', score: 100, isCorrect: true },
          { label: 'Descarto o candidato para evitar riscos.', score: 0, isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        dimension: 'RECRUITMENT_AI',
        competencyKey: 'workflow_design',
        prompt: 'Qual é o momento adequado para definir os critérios e pesos de avaliação de uma entrevista?',
        explanation: 'Critérios e pesos devem ser definidos antes das entrevistas para garantir justiça e consistência.',
        options: [
          { label: 'Depois das entrevistas, conforme os candidatos que apareceram.', score: 0, isCorrect: false },
          { label: 'Durante cada entrevista.', score: 10, isCorrect: false },
          { label: 'Antes das entrevistas, validados com o gestor.', score: 100, isCorrect: true },
          { label: 'Não é necessário definir critérios.', score: 0, isCorrect: false },
        ],
      },
      {
        type: 'LIKERT',
        dimension: 'CONFIDENCE',
        prompt: 'Sinto-me confiante para usar IA na preparação e avaliação de entrevistas de forma responsável.',
        selfReported: true,
        likertLabels: LIKERT_AGREEMENT,
      },
      {
        type: 'OPEN',
        dimension: 'CHALLENGES',
        prompt: 'Quais são as principais dificuldades nas entrevistas que você conduz ou acompanha?',
        helpText: 'Ex.: falta de padrão entre entrevistadores, perguntas genéricas, dificuldade de comparar candidatos.',
        isScored: false,
      },
    ],
  },
  modules: [
    {
      title: 'Desenhando o roteiro estruturado',
      description: 'Defina competências, crie perguntas comportamentais e situacionais e construa escalas com âncoras comportamentais com apoio de IA.',
      objectives: [
        'Traduzir competências em perguntas comportamentais e situacionais.',
        'Construir escalas de avaliação com âncoras comportamentais.',
      ],
      lessons: [
        {
          title: 'Competências e perguntas comportamentais',
          summary: 'Do perfil da vaga às perguntas que geram evidências.',
          estimatedMinutes: 25,
          learnContent: `## Por que estruturar entrevistas

Entrevistas não estruturadas tendem a ser influenciadas por impressões iniciais, afinidade e estereótipos. A **entrevista estruturada** — mesmas perguntas, mesma ordem, critérios definidos — tende a ser mais justa, comparável e preditiva do desempenho.

## Das competências às perguntas

1. **Defina 4 a 6 competências** essenciais para a vaga, validadas com o gestor.
2. **Para cada competência, escolha o tipo de pergunta:**

| Tipo | Formato | Exemplo |
|---|---|---|
| Comportamental | "Conte sobre uma situação em que..." | "Conte sobre uma vez em que você precisou reorganizar prioridades por causa de uma mudança inesperada." |
| Situacional | "O que você faria se..." | "O que você faria se dois clientes importantes pedissem entregas urgentes no mesmo dia?" |

3. **Use o método STAR** para orientar as respostas comportamentais: Situação, Tarefa, Ação e Resultado.
4. **Prepare perguntas de aprofundamento** padronizadas: "Qual foi exatamente o seu papel?", "O que você faria diferente?".

## Como a IA ajuda

A IA pode sugerir competências a partir do perfil da vaga, propor perguntas para cada competência e gerar perguntas de aprofundamento. O recrutador **seleciona, ajusta e valida** — verificando relevância para a função e ausência de perguntas inadequadas.

## Perguntas a evitar

Perguntas sobre idade, estado civil, filhos, gravidez, religião, orientação sexual, posicionamento político, saúde (sem relação com a função) ou origem são inadequadas. Inclua essa proibição no prompt e revise o resultado.`,
          beginnerSupport: `### Perguntas que pedem histórias

Uma pergunta como "Você trabalha bem em equipe?" quase sempre recebe "sim" como resposta. Já "Conte sobre uma vez em que houve um conflito no seu time e o que você fez" pede uma **história real** — e histórias trazem evidências.

A IA é ótima para transformar competências em perguntas desse tipo. Seu trabalho é escolher as melhores e garantir que todas sejam adequadas.`,
          advancedDeepDive: `### Aprofundamento: validade e consistência

Para aumentar a qualidade do roteiro: (1) faça uma análise da função para garantir que cada competência tenha relação demonstrável com o trabalho; (2) evite perguntas que favoreçam experiências específicas de determinados grupos (por exemplo, intercâmbio ou cargos de liderança formal), oferecendo alternativas equivalentes; (3) treine os entrevistadores e realize sessões de calibração com casos fictícios; (4) avalie, ao longo do tempo, a consistência entre avaliadores. A IA pode gerar casos fictícios para calibração.`,
          contextContent: `### Exemplo de prompt

~~~
Atue como especialista em seleção por competências.
Vaga fictícia: Analista de Planejamento de Produção Pleno em uma
indústria de alimentos.
Competências validadas: planejamento, análise de dados,
comunicação com áreas, resolução de problemas.
Objetivo: para cada competência, crie 1 pergunta comportamental
(formato STAR) e 1 situacional, com 2 perguntas de aprofundamento.
Restrições: nada sobre vida pessoal, idade, família, saúde ou
religião; linguagem clara.
Formato: tabela Competência | Tipo | Pergunta | Aprofundamentos.
~~~

**Revisão do recrutador:** conferir se a pergunta situacional de "resolução de problemas" reflete situações reais da fábrica — validando com o gestor — e remover perguntas redundantes.`,
          reflectionPrompt: 'As perguntas que você usa hoje geram evidências ou opiniões? Escolha uma e reescreva-a no formato comportamental.',
          keyTakeaways: [
            'Entrevistas estruturadas tendem a ser mais justas e comparáveis.',
            'Perguntas comportamentais e situacionais geram evidências.',
            'A IA sugere perguntas; o recrutador seleciona, ajusta e valida.',
          ],
          competencies: [
            { key: 'ai_recruitment', weight: 2 },
            { key: 'workflow_design', weight: 1 },
          ],
        },
        {
          title: 'Escalas de avaliação com âncoras comportamentais',
          summary: 'Como avaliar respostas de forma consistente entre entrevistadores.',
          estimatedMinutes: 25,
          learnContent: `## O problema das notas sem critério

Se cada entrevistador interpreta "nota 4" de um jeito, as avaliações deixam de ser comparáveis. Escalas com **âncoras comportamentais** resolvem isso: cada nível da escala descreve um comportamento observável.

## Exemplo de escala (competência: comunicação com áreas)

| Nota | Descritor |
|---|---|
| 1 | Não apresenta exemplo concreto ou descreve comunicação apenas reativa |
| 2 | Apresenta exemplo, mas sem clareza sobre a própria ação |
| 3 | Descreve ação de comunicação adequada com resultado parcial |
| 4 | Descreve ação estruturada, adaptada ao público, com resultado claro |
| 5 | Descreve ação estruturada, adaptada ao público, com resultado mensurável e aprendizado aplicado |

## Boas práticas

- Avalie **cada competência separadamente**, logo após a resposta.
- Registre a **evidência** que justifica a nota.
- Cada entrevistador avalia **individualmente** antes de discutir com os demais (evita efeito manada).
- Defina os **pesos** das competências antes das entrevistas.

## Como a IA ajuda

A IA pode rascunhar descritores para cada nível da escala. Esses descritores precisam ser **revisados e calibrados** com entrevistadores experientes, eliminando critérios subjetivos ("postura", "presença", "energia") que não tenham definição comportamental clara.`,
          beginnerSupport: `### Uma régua igual para todos

Imagine medir uma sala com réguas diferentes: cada pessoa chegaria a um número. A escala com âncoras é uma **régua comum** para todos os entrevistadores: a nota 3 significa a mesma coisa para todos.

A IA pode ajudar a desenhar essa régua; o time decide se ela está correta.`,
          advancedDeepDive: `### Aprofundamento: calibração e confiabilidade

Após definir as escalas, realize uma sessão de **calibração**: os entrevistadores avaliam respostas fictícias (que a IA pode gerar) e comparam as notas. Divergências grandes indicam descritores ambíguos. Ao longo do tempo, acompanhe a concordância entre avaliadores e revise descritores que geram discordância recorrente. Cuidado com o **efeito halo** (uma boa resposta influenciar todas as notas) e com o **viés de contraste** (comparar com o candidato anterior em vez de com a escala).`,
          contextContent: `### Prompt para gerar âncoras

~~~
Para a competência "resolução de problemas" em uma vaga de
Supervisor(a) de Loja, crie uma escala de 1 a 5 com descritores
comportamentais observáveis em respostas no formato STAR.
Não use critérios subjetivos como postura, aparência ou energia.
Formato: tabela Nota | Descritor | Exemplo de evidência.
~~~

**Revisão:** o recrutador e dois gestores avaliam três respostas fictícias usando a escala. Como houve divergência entre as notas 3 e 4, o descritor da nota 4 foi ajustado para exigir "análise de causa antes da ação".`,
          reflectionPrompt: 'Nas entrevistas de que você participa, dois avaliadores dariam a mesma nota para a mesma resposta? O que ajudaria a aumentar essa consistência?',
          keyTakeaways: [
            'Âncoras comportamentais tornam as notas comparáveis entre entrevistadores.',
            'Registre a evidência que justifica cada nota.',
            'Descritores gerados por IA precisam ser revisados e calibrados.',
          ],
          competencies: [
            { key: 'ai_recruitment', weight: 1 },
            { key: 'critical_thinking', weight: 1 },
            { key: 'workflow_design', weight: 2 },
          ],
          activity: {
            type: 'WORKFLOW_DESIGN',
            title: 'Monte um roteiro estruturado com escala',
            instructions: `Com base no cenário, construa um **roteiro de entrevista estruturada**:

1. Escolha **3 competências** e justifique brevemente cada uma.
2. Para cada competência, escreva **1 pergunta comportamental** e **1 pergunta de aprofundamento**.
3. Crie uma **escala de 1 a 5 com âncoras** para **uma** das competências.
4. Escreva o **prompt** que você usaria para pedir à IA um primeiro rascunho desse roteiro.`,
            scenario: `**Vaga fictícia: Coordenador(a) de Atendimento — Clínica Vida Plena**

- Rede fictícia de clínicas médicas com 8 unidades.
- A pessoa coordenará 15 atendentes de recepção e call center.
- Desafios atuais: filas nos horários de pico, reclamações sobre tempo de espera, rotatividade da equipe.
- O gestor destaca: liderança de equipe, gestão de indicadores de atendimento e resolução de conflitos com pacientes.
- Entrevistas serão conduzidas pela recrutadora e pelo gerente de operações.

*Dados fictícios.*`,
            guidedSteps: [
              'Escolha as competências a partir dos desafios da vaga.',
              'Escreva perguntas comportamentais no formato "Conte sobre uma situação em que...".',
              'Crie perguntas de aprofundamento sobre o papel e o resultado da pessoa.',
              'Descreva comportamentos observáveis para cada nota da escala.',
              'Escreva o prompt com contexto, competências, restrições e formato.',
            ],
            advancedChallenge: 'Proponha como os dois entrevistadores devem registrar e consolidar suas notas para evitar efeito halo e efeito manada.',
            socraticQuestions: [
              'Como cada competência escolhida se conecta aos desafios atuais da clínica?',
              'Sua pergunta comportamental leva o candidato a contar uma situação real ou a dar uma opinião?',
              'O que diferencia, de forma observável, uma resposta nota 3 de uma resposta nota 5 na sua escala?',
              'Que restrição no prompt evita que a IA sugira perguntas inadequadas?',
            ],
            hints: [
              'Os desafios da clínica (filas, reclamações, rotatividade) indicam as competências.',
              'Liderança de equipe, gestão de indicadores e resolução de conflitos são boas escolhas. Use "Conte sobre uma situação em que..." e aprofunde com "Qual foi o seu papel?" e "Qual foi o resultado?".',
              'Na escala, descreva ações e resultados observáveis (nota 1: sem exemplo concreto; nota 5: ação estruturada com resultado mensurável). No prompt, proíba perguntas sobre vida pessoal, idade, família, saúde e religião e peça formato em tabela.',
            ],
            modelAnswer: `**Competências:**
1. **Liderança de equipe** — reduzir rotatividade e desenvolver atendentes.
2. **Gestão de indicadores** — enfrentar filas e tempo de espera.
3. **Resolução de conflitos** — lidar com reclamações de pacientes.

**Perguntas:**
| Competência | Pergunta comportamental | Aprofundamento |
|---|---|---|
| Liderança | Conte sobre uma vez em que a sua equipe estava desmotivada. O que você fez? | Que resultado você observou e como mediu? |
| Indicadores | Descreva uma situação em que você usou indicadores para melhorar um processo de atendimento. | Quais indicadores e qual foi a variação? |
| Conflitos | Conte sobre um atendimento difícil com um cliente ou paciente muito insatisfeito. | O que você faria diferente hoje? |

**Escala — Resolução de conflitos:**
1 — Não apresenta exemplo concreto; 2 — exemplo sem clareza sobre a própria ação; 3 — escuta e resolve o caso pontual; 4 — escuta ativa, solução e comunicação com o paciente sobre os próximos passos; 5 — resolve o caso, identifica a causa e implementa melhoria para evitar recorrência, com resultado observável.

**Prompt:** "Atue como especialista em seleção por competências. Vaga fictícia de Coordenador(a) de Atendimento em rede de 8 clínicas, liderando 15 atendentes; desafios: filas, reclamações e rotatividade. Para as competências liderança de equipe, gestão de indicadores e resolução de conflitos, crie 1 pergunta comportamental e 1 de aprofundamento cada, e uma escala 1–5 com âncoras comportamentais para resolução de conflitos. Proibido: perguntas sobre vida pessoal, idade, família, saúde ou religião. Formato: tabelas."

**Desafio:** cada entrevistador registra notas e evidências individualmente, logo após cada resposta; a consolidação ocorre depois, discutindo evidências antes das notas.`,
            maxAttempts: 4,
            passingScore: 70,
            rubric: {
              title: 'Rubrica — Roteiro estruturado',
              description: 'Avalia a qualidade do roteiro e da escala.',
              criteria: [
                {
                  key: 'qualidade_solucao',
                  name: 'Qualidade do roteiro',
                  description: 'Perguntas comportamentais, aprofundamentos e escala bem construídos.',
                  weight: 3,
                  indicators: ['Perguntas pedem situações reais', 'Escala com comportamentos observáveis'],
                },
                {
                  key: 'contextualizacao',
                  name: 'Contextualização',
                  description: 'Competências conectadas aos desafios da vaga.',
                  weight: 2,
                  indicators: ['Relaciona competências a filas, reclamações e rotatividade'],
                },
                {
                  key: 'uso_responsavel',
                  name: 'Uso responsável',
                  description: 'Prompt com restrições contra perguntas inadequadas.',
                  weight: 2,
                  indicators: ['Proíbe perguntas pessoais', 'Prevê revisão humana'],
                },
                {
                  key: 'clareza',
                  name: 'Clareza',
                  description: 'Organização da resposta.',
                  weight: 1,
                  indicators: ['Estrutura em seções ou tabelas'],
                },
              ],
            },
            expectedKeywords: ['liderança', 'lideranca', 'indicadores', 'conflito', 'conte sobre', 'situação', 'escala', 'nota', 'evidência', 'evidencia', 'prompt', 'vida pessoal', 'tabela'],
          },
        },
      ],
      quiz: {
        kind: 'MODULE_QUIZ',
        title: 'Avaliação do módulo 1 — Roteiro estruturado',
        description: 'Verifique sua compreensão sobre perguntas e escalas.',
        passingScore: 60,
        maxAttempts: 3,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            competencyKey: 'ai_recruitment',
            prompt: 'Qual destas é uma pergunta comportamental?',
            explanation: 'Perguntas comportamentais pedem situações reais vividas pelo candidato.',
            options: [
              { label: '"Você é uma pessoa organizada?"', isCorrect: false },
              { label: '"Conte sobre uma vez em que precisou reorganizar prioridades por causa de uma mudança inesperada."', isCorrect: true },
              { label: '"Onde você se vê em cinco anos?"', isCorrect: false },
              { label: '"Qual é seu maior defeito?"', isCorrect: false },
            ],
          },
          {
            type: 'TRUE_FALSE',
            competencyKey: 'workflow_design',
            prompt: 'Em escalas com âncoras comportamentais, cada nota descreve um comportamento observável.',
            explanation: 'Esse é o princípio das escalas ancoradas, que tornam notas comparáveis.',
            options: [
              { label: 'Verdadeiro', isCorrect: true },
              { label: 'Falso', isCorrect: false },
            ],
          },
          {
            type: 'SCENARIO',
            competencyKey: 'critical_thinking',
            prompt: 'A IA sugeriu o descritor "nota 5: candidato com ótima presença e energia". O que fazer?',
            explanation: 'Critérios subjetivos devem ser substituídos por comportamentos observáveis.',
            options: [
              { label: 'Manter, pois a IA sugeriu.', score: 0, isCorrect: false },
              { label: 'Substituir por um comportamento observável relacionado à competência.', score: 100, isCorrect: true },
              { label: 'Usar apenas para cargos de liderança.', score: 0, isCorrect: false },
              { label: 'Pedir que a IA aumente o descritor.', score: 20, isCorrect: false },
            ],
          },
        ],
      },
    },
    {
      title: 'Evidências, consolidação e vieses',
      description: 'Consolide evidências de entrevistas com apoio de IA de forma crítica e previna vieses na avaliação.',
      objectives: [
        'Consolidar evidências de múltiplos entrevistadores com apoio de IA.',
        'Identificar e prevenir vieses na condução e na avaliação.',
      ],
      lessons: [
        {
          title: 'Consolidando evidências com apoio de IA',
          summary: 'Como usar IA para organizar anotações sem transformar resumos em decisões.',
          estimatedMinutes: 20,
          learnContent: `## Evidência versus impressão

**Evidência** é o que o candidato disse ou fez: "Relatou ter reduzido o tempo de espera em 20% reorganizando escalas." **Impressão** é a interpretação do entrevistador: "Parece organizado." Avaliações sólidas se baseiam em evidências.

## Fluxo de consolidação

1. Cada entrevistador registra **evidências e notas individualmente**.
2. As anotações são **anonimizadas** (Candidato A, B...).
3. A IA **organiza** as evidências por competência, indicando divergências entre entrevistadores.
4. Os entrevistadores **discutem as evidências** e chegam à avaliação final.
5. A decisão é registrada com as evidências que a sustentam.

## O que pedir (e não pedir) à IA

| Pedir | Não pedir |
|---|---|
| "Organize as evidências por competência" | "Diga quem é o melhor candidato" |
| "Aponte divergências entre os entrevistadores" | "Dê uma nota final" |
| "Indique competências sem evidência suficiente" | "Avalie a personalidade do candidato" |

## Validação

Confira sempre o resumo com as anotações originais: a IA pode **omitir** evidências, **distorcer** falas ou **acrescentar** interpretações. Desconfie de adjetivos que não estavam nas anotações.`,
          beginnerSupport: `### Organizar não é julgar

A IA pode funcionar como uma assistente que separa as anotações em pastas: uma para cada competência. Ela não deve dizer quem é o melhor — isso é tarefa das pessoas que entrevistaram.

E lembre-se: antes de pedir ajuda à IA, troque os nomes por letras e retire dados pessoais.`,
          advancedDeepDive: `### Aprofundamento: detecção de linguagem enviesada nas anotações

A própria IA pode ajudar a revisar anotações em busca de linguagem enviesada ou irrelevante ("muito jovem", "sotaque forte", "parece cansada"), sinalizando trechos que não descrevem comportamentos ligados à função. Esse uso fortalece a qualidade das avaliações — desde que as sinalizações sejam analisadas por pessoas e usadas para educação dos entrevistadores, não como punição automática.`,
          contextContent: `### Exemplo de prompt de consolidação

~~~
Abaixo estão as anotações anonimizadas de dois entrevistadores
sobre o Candidato C, para a vaga fictícia de Coordenador(a) de
Atendimento. Organize as evidências em tabela por competência
(liderança, indicadores, conflitos), indicando a fonte de cada
evidência (Entrevistador 1 ou 2) e as divergências entre eles.
Sinalize competências sem evidência suficiente. Não atribua notas,
não faça recomendação e não acrescente interpretações.

### ANOTAÇÕES ###
(anotações anonimizadas)
~~~

O resultado serve de base para a reunião de consolidação — em que as pessoas decidem.`,
          reflectionPrompt: 'Releia mentalmente suas últimas anotações de entrevista: quanto delas era evidência e quanto era impressão?',
          keyTakeaways: [
            'Avaliações devem se basear em evidências, não em impressões.',
            'A IA organiza evidências; pessoas avaliam e decidem.',
            'Resumos de IA precisam ser conferidos com as anotações originais.',
          ],
          competencies: [
            { key: 'critical_thinking', weight: 2 },
            { key: 'workflow_design', weight: 1 },
            { key: 'responsible_ai', weight: 1 },
          ],
        },
        {
          title: 'Prevenindo vieses na entrevista',
          summary: 'Vieses comuns em entrevistas e como o processo estruturado e a IA podem ajudar a reduzi-los.',
          estimatedMinutes: 20,
          learnContent: `## Vieses comuns em entrevistas

| Viés | Descrição | Mitigação |
|---|---|---|
| Afinidade | Favorecer quem se parece conosco | Critérios definidos e roteiro estruturado |
| Primeira impressão | Decidir nos primeiros minutos | Avaliar competência por competência |
| Efeito halo | Um ponto forte contamina as demais notas | Notas separadas por competência |
| Contraste | Comparar com o candidato anterior | Comparar com a escala, não com pessoas |
| Confirmação | Buscar evidências que confirmem a impressão inicial | Registrar evidências contrárias |
| Estereótipos | Associar competências a grupos | Revisão de linguagem e critérios |

## O papel da IA

A IA **pode ajudar** a: gerar roteiros estruturados, revisar perguntas e anotações em busca de linguagem enviesada, e organizar evidências de forma padronizada.

A IA **pode prejudicar** quando: reproduz estereótipos em perguntas ou critérios, gera resumos com adjetivos enviesados ou é usada para "analisar" vídeo, voz ou expressões faciais — práticas sem base científica sólida e com alto risco de discriminação.

## Responsabilidade

A estrutura do processo e a revisão humana são as principais defesas contra vieses. Nenhuma ferramenta elimina vieses sozinha — e algumas podem amplificá-los.`,
          beginnerSupport: `### Todos temos vieses

Vieses não são defeitos de caráter: são atalhos do cérebro. O problema é quando eles decidem por nós.

Uma entrevista estruturada funciona como um "cinto de segurança": mesmas perguntas, mesma régua de avaliação e anotações baseadas no que a pessoa disse — não no que achamos dela.`,
          advancedDeepDive: `### Aprofundamento: ferramentas de análise de vídeo e voz

Ferramentas que prometem avaliar personalidade, honestidade ou competências a partir de expressões faciais, tom de voz ou microexpressões têm fundamentação científica contestada e podem discriminar pessoas com deficiência, sotaques regionais, diferenças culturais ou neurodivergência. Além disso, envolvem dados biométricos, que são dados sensíveis pela LGPD. A recomendação é não utilizá-las para decisões sobre candidatos.`,
          contextContent: `### Exemplo: revisando anotações

**Anotação original (fictícia):** "Candidata B — muito jovem para coordenar, mas comunicativa. Sotaque forte."

**Prompt de revisão:**

~~~
Revise a anotação abaixo e sinalize trechos que não descrevem
comportamentos relacionados às competências da vaga ou que possam
refletir vieses. Sugira como reescrever em termos de evidências.
~~~

**Resultado esperado:** sinalização de "muito jovem" (idade, irrelevante e discriminatório) e "sotaque forte" (característica pessoal irrelevante), com sugestão de registrar evidências como "relatou ter coordenado 6 pessoas em projeto de reorganização de escalas".`,
          reflectionPrompt: 'Qual dos vieses da tabela você acha mais difícil de perceber em si mesmo? Que prática ajudaria a reduzi-lo?',
          keyTakeaways: [
            'Vieses como afinidade, halo e contraste afetam entrevistas não estruturadas.',
            'Estrutura e revisão humana são as principais defesas.',
            'Evite ferramentas que avaliam candidatos por vídeo, voz ou expressões faciais.',
          ],
          competencies: [
            { key: 'responsible_ai', weight: 2 },
            { key: 'critical_thinking', weight: 1 },
          ],
          activity: {
            type: 'CRITICAL_ANALYSIS',
            title: 'Analise um resumo de entrevista gerado por IA',
            instructions: `Leia o resumo gerado por IA no cenário.

1. Identifique **os problemas** do resumo (vieses, interpretações sem evidência, recomendações indevidas, dados pessoais).
2. Explique **como cada problema poderia afetar** a decisão.
3. Reescreva o **pedido feito à IA** para obter um resumo adequado.`,
            scenario: `**Contexto:** após entrevistar a Candidata D para Coordenador(a) de Atendimento (Clínica Vida Plena, fictícia), uma entrevistadora colou suas anotações completas — com nome, idade e telefone — em uma ferramenta de IA e pediu: *"Resuma e diga se devo aprovar."*

**Resumo gerado:**

> **Mariana Souza, 47 anos, (81) 90000-0000**
>
> - Demonstrou boa comunicação, embora tenha um ritmo mais lento, possivelmente pela idade.
> - Mencionou ter reduzido o tempo de espera de uma recepção, mas provavelmente com ajuda da equipe.
> - Parece pouco familiarizada com tecnologia.
> - Tem dois filhos, o que pode limitar sua disponibilidade.
> - **Recomendação:** não aprovar. Perfil com baixa aderência (score 3,1/10).

*Dados fictícios.*`,
            guidedSteps: [
              'Verifique quais dados pessoais foram enviados à IA e aparecem no resumo.',
              'Separe evidências de interpretações em cada tópico.',
              'Identifique referências a características pessoais irrelevantes para a função.',
              'Analise a recomendação e o score.',
              'Reescreva o pedido com anonimização, foco em evidências e sem recomendação.',
            ],
            advancedChallenge: 'Proponha uma regra de processo para a equipe que evite que situações como esta se repitam, incluindo orientação sobre o uso de ferramentas aprovadas.',
            socraticQuestions: [
              'Que evidência sustenta a afirmação de "ritmo mais lento, possivelmente pela idade"?',
              'A informação sobre filhos tem alguma relação com as competências da vaga? Por que ela estava nas anotações?',
              'O "score 3,1/10" foi calculado com base em quais critérios?',
              'Como o pedido "diga se devo aprovar" influenciou o tipo de resposta gerada?',
            ],
            hints: [
              'Há problemas em três dimensões: privacidade, vieses e papel indevido da IA.',
              'Nome, idade e telefone foram expostos; idade e filhos são características pessoais irrelevantes e discriminatórias; "provavelmente com ajuda da equipe" e "parece pouco familiarizada" são interpretações sem evidência.',
              'A recomendação e o score inventado transferem a decisão para a IA. O novo pedido deve usar anotações anonimizadas, organizar evidências por competência e proibir notas e recomendações.',
            ],
            modelAnswer: `**Problemas:**
1. **Privacidade:** nome, idade e telefone enviados à IA e reproduzidos no resumo.
2. **Etarismo:** "ritmo mais lento, possivelmente pela idade" — interpretação discriminatória e sem evidência.
3. **Minimização de mérito:** "provavelmente com ajuda da equipe" desvaloriza uma evidência sem base.
4. **Impressão sem evidência:** "parece pouco familiarizada com tecnologia".
5. **Situação familiar:** "dois filhos" é irrelevante e discriminatório (Lei 9.029/1995) — nem deveria estar nas anotações.
6. **Recomendação e score inventados:** a IA assumiu a decisão com uma métrica sem critérios.

**Impacto:** a decisão poderia excluir injustamente uma candidata qualificada com base em idade e situação familiar, expondo a empresa a riscos jurídicos e éticos.

**Pedido reformulado:** "Organize as anotações anonimizadas da Candidata D em tabela por competência (liderança, indicadores, conflitos), citando apenas evidências relatadas. Sinalize competências sem evidência suficiente e trechos que não descrevam comportamentos relacionados à função. Não atribua notas, não faça recomendação e não acrescente interpretações."

**Regra de processo:** anotações apenas sobre evidências; anonimização obrigatória; uso exclusivo de ferramentas aprovadas; decisões registradas pelos entrevistadores com base na escala.`,
            maxAttempts: 4,
            passingScore: 70,
            rubric: {
              title: 'Rubrica — Análise de resumo de entrevista',
              description: 'Avalia a identificação de vieses, problemas de privacidade e papel indevido da IA.',
              criteria: [
                {
                  key: 'pensamento_critico',
                  name: 'Pensamento crítico',
                  description: 'Separa evidências de interpretações e questiona o score.',
                  weight: 3,
                  indicators: ['Identifica interpretações sem evidência', 'Questiona a recomendação e o score'],
                },
                {
                  key: 'uso_responsavel',
                  name: 'Uso responsável',
                  description: 'Identifica vieses e exposição de dados.',
                  weight: 3,
                  indicators: ['Aponta idade e filhos como critérios discriminatórios', 'Aponta exposição de dados pessoais'],
                },
                {
                  key: 'qualidade_solucao',
                  name: 'Qualidade do novo pedido',
                  description: 'Pedido anonimizado, focado em evidências, sem recomendação.',
                  weight: 2,
                  indicators: ['Anonimiza', 'Proíbe notas e recomendações'],
                },
                {
                  key: 'clareza',
                  name: 'Clareza',
                  description: 'Organização da análise.',
                  weight: 1,
                  indicators: ['Lista estruturada'],
                },
              ],
            },
            expectedKeywords: ['idade', 'etarismo', 'filhos', 'familiar', 'telefone', 'anonim', 'evidência', 'evidencia', 'score', 'recomenda', 'discrimina', 'viés', 'vies'],
          },
        },
      ],
      quiz: {
        kind: 'MODULE_QUIZ',
        title: 'Avaliação do módulo 2 — Evidências e vieses',
        description: 'Verifique sua compreensão sobre consolidação de evidências e vieses.',
        passingScore: 60,
        maxAttempts: 3,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            competencyKey: 'critical_thinking',
            prompt: 'Qual destes registros é uma evidência?',
            explanation: 'Evidências descrevem o que o candidato disse ou fez.',
            options: [
              { label: '"Parece organizado."', isCorrect: false },
              { label: '"Relatou ter reduzido o tempo de espera em 20% ao reorganizar escalas."', isCorrect: true },
              { label: '"Tem cara de líder."', isCorrect: false },
              { label: '"Não gostei da energia."', isCorrect: false },
            ],
          },
          {
            type: 'MULTIPLE_CHOICE',
            competencyKey: 'responsible_ai',
            prompt: 'Quais práticas reduzem vieses em entrevistas? (selecione todas as corretas)',
            explanation: 'Estrutura, notas por competência e avaliação individual reduzem vieses.',
            options: [
              { label: 'Mesmas perguntas para todos os candidatos.', isCorrect: true },
              { label: 'Notas separadas por competência.', isCorrect: true },
              { label: 'Avaliação individual antes da discussão em grupo.', isCorrect: true },
              { label: 'Análise de expressões faciais por IA.', isCorrect: false },
            ],
          },
          {
            type: 'TRUE_FALSE',
            competencyKey: 'workflow_design',
            prompt: 'No fluxo de consolidação, a IA deve atribuir a nota final de cada candidato.',
            explanation: 'A IA organiza evidências; as notas e decisões são dos entrevistadores.',
            options: [
              { label: 'Verdadeiro', isCorrect: false },
              { label: 'Falso', isCorrect: true },
            ],
          },
        ],
      },
    },
  ],
  finalAssessment: {
    kind: 'FINAL',
    title: 'Avaliação final — Entrevistas estruturadas',
    description: 'Seis questões sobre as competências do curso. Nota mínima: 70%.',
    passingScore: 70,
    maxAttempts: 2,
    questions: [
      {
        type: 'SINGLE_CHOICE',
        competencyKey: 'ai_recruitment',
        prompt: 'Qual é a principal vantagem da entrevista estruturada?',
        explanation: 'Comparabilidade e justiça, com critérios definidos previamente.',
        options: [
          { label: 'Permitir conversas livres e espontâneas.', isCorrect: false },
          { label: 'Tornar as avaliações mais comparáveis e justas, com critérios definidos previamente.', isCorrect: true },
          { label: 'Dispensar o registro de evidências.', isCorrect: false },
          { label: 'Permitir que a IA conduza a entrevista.', isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        competencyKey: 'ai_recruitment',
        prompt: 'Qual prompt gera o roteiro de entrevista mais útil?',
        explanation: 'Contexto, competências validadas, tipos de pergunta, restrições e formato.',
        options: [
          { label: '"Crie perguntas de entrevista."', score: 0, isCorrect: false },
          { label: '"Crie perguntas difíceis para um coordenador."', score: 20, isCorrect: false },
          {
            label: '"Para Coordenador(a) de Logística, competências planejamento, liderança e segurança: 1 pergunta comportamental e 1 situacional por competência, sem perguntas pessoais, em tabela com aprofundamentos."',
            score: 100,
            isCorrect: true,
          },
          { label: '"Crie 50 perguntas variadas."', score: 10, isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        competencyKey: 'critical_thinking',
        prompt: 'Dois entrevistadores deram notas muito diferentes para a mesma resposta. Qual é a melhor ação?',
        explanation: 'Discutir evidências e calibrar a escala, revisando descritores ambíguos.',
        options: [
          { label: 'Fazer a média e seguir.', score: 30, isCorrect: false },
          { label: 'Usar a nota do entrevistador mais experiente.', score: 20, isCorrect: false },
          { label: 'Discutir as evidências registradas e revisar descritores ambíguos da escala.', score: 100, isCorrect: true },
          { label: 'Pedir à IA que escolha a nota correta.', score: 0, isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE',
        competencyKey: 'critical_thinking',
        prompt: 'Um resumo de entrevista gerado por IA deve ser conferido com as anotações originais antes de ser usado.',
        explanation: 'A IA pode omitir, distorcer ou acrescentar informações.',
        options: [
          { label: 'Verdadeiro', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        competencyKey: 'workflow_design',
        prompt: 'Qual sequência de consolidação de entrevistas é mais adequada?',
        explanation: 'Registro individual, anonimização, organização pela IA, discussão e decisão humana registrada.',
        options: [
          { label: 'IA define a nota → entrevistadores confirmam.', isCorrect: false },
          { label: 'Registro individual → anonimização → IA organiza evidências → discussão → decisão humana registrada.', isCorrect: true },
          { label: 'Discussão em grupo → registro individual depois.', isCorrect: false },
          { label: 'Gestor decide sem registros.', isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        competencyKey: 'responsible_ai',
        prompt: 'Um fornecedor oferece uma ferramenta que avalia candidatos por expressões faciais em vídeo. O que você recomenda?',
        explanation: 'Fundamentação contestada, risco de discriminação e uso de dados biométricos sensíveis.',
        options: [
          { label: 'Adotar, pois agiliza a triagem.', score: 0, isCorrect: false },
          { label: 'Adotar apenas para vagas de atendimento.', score: 0, isCorrect: false },
          {
            label: 'Não adotar para decisões sobre candidatos: fundamentação científica contestada, risco de discriminação e tratamento de dados biométricos sensíveis.',
            score: 100,
            isCorrect: true,
          },
          { label: 'Testar sem informar os candidatos.', score: 0, isCorrect: false },
        ],
      },
    ],
  },
  satisfaction: buildSatisfactionSurvey('Entrevistas Estruturadas com Apoio de IA'),
};
