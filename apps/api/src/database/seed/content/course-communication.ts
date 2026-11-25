import { buildSatisfactionSurvey, LIKERT_AGREEMENT, LIKERT_FAMILIARITY } from './shared-assessments';
import type { SeedCourse } from './types';

export const communicationCourse: SeedCourse = {
  slug: 'ia-comunicacao-candidatos',
  title: 'Comunicação com Candidatos Assistida por IA',
  description:
    'Aprenda a usar IA para criar comunicações claras, acolhedoras e transparentes em todas as etapas do processo seletivo — da confirmação de candidatura ao retorno final — protegendo dados pessoais e evitando linguagem excludente.',
  objectives: [
    'Criar modelos de mensagens para cada etapa da jornada do candidato com apoio de IA.',
    'Ajustar tom, clareza e personalização sem expor dados pessoais.',
    'Redigir retornos respeitosos e transparentes, sem motivos inventados.',
    'Revisar comunicações para linguagem inclusiva e conformidade com a LGPD.',
  ],
  targetAudience: 'Profissionais de recrutamento e seleção que se comunicam diretamente com candidatos.',
  prerequisites: 'Nenhum. Recomenda-se ter concluído ou estar cursando "Inteligência Artificial Aplicada ao Recrutamento e Seleção".',
  difficulty: 'BEGINNER',
  estimatedHours: 2,
  coverColor: 'violet',
  competencyKeys: ['prompt_engineering', 'ai_recruitment', 'responsible_ai'],
  addieNotes: {
    analysis:
      'O diagnóstico identifica a frequência de uso de IA, a familiaridade com prompts de comunicação e o entendimento sobre privacidade de dados, além das principais dificuldades dos participantes na comunicação com candidatos (volume, atrasos e tom).',
    design:
      'Dois módulos curtos cobrem a jornada do candidato e os retornos difíceis. Cada aula traz exemplos de antes e depois, e cada módulo termina com uma atividade prática avaliada por rubrica e feedback socrático.',
    development:
      'Os conteúdos incluem modelos de mensagens comentados, prompts reutilizáveis com campos variáveis e casos fictícios de comunicação. Todos os exemplos usam dados fictícios.',
    implementation:
      'O curso pode ser alocado a recrutadores individualmente ou por turma, como complemento ao curso principal de IA no recrutamento. O progresso e as interações com o tutor são acompanhados no painel administrativo.',
    evaluation:
      'Compara-se o diagnóstico com a avaliação final, acompanha-se a evolução entre tentativas nas atividades e coletam-se satisfação e aplicabilidade autodeclaradas.',
  },
  diagnostic: {
    kind: 'DIAGNOSTIC',
    title: 'Diagnóstico — Comunicação com candidatos',
    description: 'Ajude-nos a entender seu ponto de partida. Não há aprovação ou reprovação.',
    passingScore: 0,
    maxAttempts: 1,
    questions: [
      {
        type: 'LIKERT',
        dimension: 'FAMILIARITY',
        prompt: 'Como você avalia sua familiaridade com ferramentas de IA para redigir mensagens?',
        selfReported: true,
        likertLabels: LIKERT_FAMILIARITY,
      },
      {
        type: 'SINGLE_CHOICE',
        dimension: 'FREQUENCY',
        prompt: 'Com que frequência você usa IA para escrever mensagens profissionais?',
        selfReported: true,
        options: [
          { label: 'Nunca', score: 0 },
          { label: 'Raramente', score: 25 },
          { label: 'Algumas vezes por mês', score: 50 },
          { label: 'Algumas vezes por semana', score: 75 },
          { label: 'Diariamente', score: 100 },
        ],
      },
      {
        type: 'SCENARIO',
        dimension: 'PROMPTING',
        competencyKey: 'prompt_engineering',
        prompt: 'Qual pedido tende a gerar a melhor mensagem de convite para entrevista?',
        explanation: 'Contexto, tom, campos variáveis e limite de tamanho orientam a IA.',
        options: [
          { label: '"Escreva um convite."', score: 0, isCorrect: false },
          { label: '"Escreva um convite para entrevista."', score: 25, isCorrect: false },
          {
            label: '"Escreva um convite para entrevista on-line da vaga de Analista Financeiro, tom cordial, até 100 palavras, com campos [NOME], [DATA] e [LINK]."',
            score: 100,
            isCorrect: true,
          },
          { label: '"Escreva um convite bem formal e longo."', score: 15, isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        dimension: 'RECRUITMENT_AI',
        competencyKey: 'ai_recruitment',
        prompt: 'Qual é um bom uso da IA na comunicação com candidatos?',
        explanation: 'Modelos revisados aceleram a comunicação mantendo a responsabilidade humana.',
        options: [
          { label: 'Enviar automaticamente justificativas de reprovação criadas pela IA.', isCorrect: false },
          { label: 'Criar modelos de mensagens que o recrutador revisa e personaliza.', isCorrect: true },
          { label: 'Responder candidatos com informações de benefícios que a IA supõe existir.', isCorrect: false },
          { label: 'Analisar o perfil de redes sociais dos candidatos.', isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        dimension: 'PRIVACY',
        competencyKey: 'responsible_ai',
        prompt: 'Você quer personalizar 40 mensagens de retorno usando IA. Qual é a abordagem mais segura?',
        explanation: 'Gerar o modelo com campos variáveis e preencher os dados pessoais fora da ferramenta de IA.',
        options: [
          { label: 'Colar a lista completa de candidatos com e-mails e telefones na IA.', score: 0, isCorrect: false },
          { label: 'Gerar um modelo com campos variáveis e preencher os dados fora da ferramenta de IA.', score: 100, isCorrect: true },
          { label: 'Enviar apenas os nomes completos e as notas de entrevista.', score: 20, isCorrect: false },
          { label: 'Usar uma ferramenta gratuita qualquer.', score: 0, isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE',
        dimension: 'LIMITATIONS',
        competencyKey: 'responsible_ai',
        prompt: 'Ao redigir um retorno negativo, é aceitável que a IA crie um motivo plausível para a reprovação caso o recrutador não tenha um.',
        explanation: 'Motivos inventados são inadequados, podem ser falsos e gerar problemas éticos e jurídicos.',
        options: [
          { label: 'Verdadeiro', isCorrect: false },
          { label: 'Falso', isCorrect: true },
        ],
      },
      {
        type: 'LIKERT',
        dimension: 'CONFIDENCE',
        prompt: 'Sinto-me confiante para usar IA na comunicação com candidatos de forma responsável.',
        selfReported: true,
        likertLabels: LIKERT_AGREEMENT,
      },
      {
        type: 'OPEN',
        dimension: 'CHALLENGES',
        prompt: 'Quais são suas maiores dificuldades na comunicação com candidatos hoje?',
        helpText: 'Ex.: volume de mensagens, atrasos nos retornos, tom adequado. Não inclua dados pessoais.',
        isScored: false,
      },
    ],
  },
  modules: [
    {
      title: 'A jornada de comunicação do candidato',
      description: 'Mapeie os pontos de contato com candidatos e crie modelos de mensagens claros e acolhedores com apoio de IA.',
      objectives: [
        'Mapear os pontos de contato da jornada do candidato.',
        'Criar modelos de mensagens com tom e clareza adequados.',
      ],
      lessons: [
        {
          title: 'Pontos de contato e expectativas do candidato',
          summary: 'Quando e como se comunicar com candidatos em cada etapa do processo.',
          estimatedMinutes: 15,
          learnContent: `## A comunicação como parte da experiência

Para o candidato, o processo seletivo é uma sequência de **pontos de contato** com a empresa. Cada mensagem — ou a falta dela — forma sua percepção sobre a organização.

### Pontos de contato típicos

| Etapa | Mensagem | O que o candidato precisa saber |
|---|---|---|
| Candidatura | Confirmação de recebimento | Que a candidatura chegou e quais são os próximos passos |
| Triagem | Atualização de status | Prazos estimados e como será informado |
| Entrevista | Convite e orientações | Data, formato, duração, quem participará |
| Pós-entrevista | Agradecimento | Quando receberá retorno |
| Decisão | Proposta ou retorno negativo | Resultado de forma clara e respeitosa |

### Princípios de uma boa comunicação

1. **Clareza** — informações práticas e objetivas.
2. **Previsibilidade** — prazos reais e cumpridos.
3. **Respeito** — tom cordial em todas as etapas, inclusive no retorno negativo.
4. **Transparência** — como funciona o processo e como os dados são tratados.
5. **Consistência** — todos os candidatos recebem o mesmo nível de informação.

## Onde a IA ajuda

A IA é excelente para criar **modelos** de mensagens para cada ponto de contato, ajustar o tom e gerar variações. O recrutador mantém a responsabilidade por **informações corretas** (datas, etapas, condições) e pelo **envio**.`,
          beginnerSupport: `### Pense em como você gostaria de ser tratado

Lembre-se de uma vez em que você se candidatou a uma vaga. Você gostaria de:
- saber que sua candidatura foi recebida?
- ter uma ideia de quando receberia notícias?
- receber um retorno, mesmo que negativo?

A IA pode ajudar você a escrever essas mensagens rapidamente. Seu papel é garantir que as informações estejam corretas e que o tom seja respeitoso.`,
          advancedDeepDive: `### Aprofundamento: métricas de experiência do candidato

Para gerenciar a comunicação de forma estratégica, acompanhe indicadores como tempo médio de resposta por etapa, percentual de candidatos que recebem retorno final e pesquisas rápidas de experiência (por exemplo, uma pergunta de satisfação após a entrevista). A IA pode ajudar a analisar comentários abertos dessas pesquisas — desde que anonimizados — identificando temas recorrentes como "falta de retorno" ou "instruções confusas".`,
          contextContent: `### Exemplo: confirmação de candidatura

**Prompt:**

~~~
Escreva um modelo de mensagem de confirmação de candidatura para
uma rede fictícia de farmácias. Tom acolhedor e objetivo, até 90
palavras. Informe que a análise leva até 10 dias úteis e que a
pessoa receberá retorno por e-mail em qualquer caso. Use os
campos [NOME] e [VAGA]. Não inclua informações que eu não
forneci.
~~~

**Resultado esperado (trecho):**

> Olá, [NOME]! Recebemos sua candidatura para [VAGA] — obrigado pelo interesse em fazer parte do nosso time. Nossa equipe vai analisar seu perfil em até 10 dias úteis e você receberá um retorno por e-mail, seja qual for o resultado...

O prazo foi **fornecido** pelo recrutador — a IA não deve estimá-lo por conta própria.`,
          reflectionPrompt: 'Em qual ponto de contato do seu processo seletivo os candidatos ficam mais tempo sem informação? Como a IA poderia ajudar a resolver isso?',
          keyTakeaways: [
            'Cada mensagem compõe a experiência do candidato com a empresa.',
            'Clareza, previsibilidade, respeito, transparência e consistência guiam a comunicação.',
            'A IA cria modelos; o recrutador garante informações corretas.',
          ],
          competencies: [{ key: 'ai_recruitment', weight: 2 }],
        },
        {
          title: 'Tom, clareza e personalização com segurança',
          summary: 'Como ajustar o tom das mensagens e personalizar sem expor dados pessoais.',
          estimatedMinutes: 20,
          learnContent: `## Ajustando o tom

O tom deve refletir a cultura da empresa e o momento do processo. Ao pedir à IA, descreva o tom com **adjetivos e exemplos**:

- "cordial e direto, sem formalidade excessiva";
- "acolhedor, próximo, usando 'você'";
- "formal, adequado a cargos executivos".

Se a empresa tiver um guia de comunicação, inclua trechos relevantes como referência.

## Clareza

Mensagens claras:
- trazem a informação principal no início;
- usam frases curtas;
- destacam datas, horários e links;
- evitam jargões internos ("etapa de fit", "BP").

Peça à IA: "Reescreva com frases curtas e destaque as informações práticas em tópicos."

## Personalização sem expor dados

Personalizar é importante, mas **dados pessoais não precisam passar pela IA**. A estratégia recomendada é:

1. Gerar o **modelo** na IA com campos variáveis: [NOME], [VAGA], [DATA], [LINK].
2. Preencher os campos no **ATS** ou no **e-mail corporativo**, fora da ferramenta de IA.
3. Revisar a mensagem final antes do envio.

## Linguagem inclusiva

- Prefira formas neutras: "pessoa candidata", "você", "boas-vindas".
- Evite suposições sobre gênero, idade ou situação familiar.
- Ofereça adaptações: "Caso precise de algum recurso de acessibilidade para a entrevista, responda a este e-mail."

A IA pode revisar textos em busca de linguagem excludente — mas confira o resultado.`,
          beginnerSupport: `### Campos variáveis são como um formulário

Sabe aqueles modelos de carta com espaços em branco para preencher? A IA pode criar exatamente isso: uma mensagem pronta com [NOME] e [DATA] no lugar dos dados.

Assim, você nunca precisa colocar o nome, o e-mail ou o telefone do candidato na ferramenta de IA — e economiza tempo do mesmo jeito.`,
          advancedDeepDive: `### Aprofundamento: biblioteca de modelos versionada

Equipes maduras mantêm uma **biblioteca de modelos** de mensagens, com versão, data de revisão e responsável. Os prompts usados para gerar cada modelo também são documentados. Isso permite revisar periodicamente o tom, atualizar informações (como prazos e etapas) e garantir que todos os recrutadores ofereçam a mesma experiência. Em ATS que suportam automação, os modelos podem ser acionados por mudança de status — mantendo a revisão humana sobre modelos e regras de disparo.`,
          contextContent: `### Antes e depois: convite para entrevista

**Antes (gerado sem orientação de tom e clareza):**

> Prezado candidato, vimos por meio desta convidá-lo a comparecer à etapa de entrevista do processo seletivo, a qual será realizada em data a ser oportunamente informada...

**Prompt de ajuste:**

~~~
Reescreva o convite com tom cordial e direto, linguagem neutra em
gênero, até 100 palavras. Destaque em tópicos: data [DATA],
horário [HORA], formato on-line, link [LINK] e duração de 45
minutos. Inclua uma frase oferecendo recursos de acessibilidade.
~~~

**Depois:**

> Olá, [NOME]! Que bom ter você na próxima etapa do processo para [VAGA]. Sua entrevista será:
> - **Data:** [DATA] — **Horário:** [HORA]
> - **Formato:** on-line, pelo link [LINK]
> - **Duração:** cerca de 45 minutos
>
> Se precisar de algum recurso de acessibilidade, é só responder este e-mail. Até breve!`,
          reflectionPrompt: 'Como é o tom das mensagens que sua equipe envia hoje? Ele combina com a cultura que a empresa quer transmitir?',
          keyTakeaways: [
            'Descreva o tom desejado com adjetivos e exemplos.',
            'Mensagens claras trazem a informação principal primeiro e destacam dados práticos.',
            'Personalize com campos variáveis, preenchidos fora da ferramenta de IA.',
            'Use linguagem inclusiva e ofereça recursos de acessibilidade.',
          ],
          competencies: [
            { key: 'prompt_engineering', weight: 2 },
            { key: 'responsible_ai', weight: 1 },
          ],
          activity: {
            type: 'PROMPT_EXERCISE',
            title: 'Crie um prompt para mensagens da jornada do candidato',
            instructions: `Com base no cenário, escreva **um prompt** que gere **dois modelos de mensagem**: (1) confirmação de candidatura e (2) convite para entrevista.

Seu prompt deve definir tom, informações obrigatórias, campos variáveis, tamanho e restrições. Em seguida, explique em 2 ou 3 frases **como você garantiria a proteção dos dados** dos candidatos ao usar esses modelos.`,
            scenario: `**Empresa fictícia: Trilha Educação** — rede de escolas de idiomas com 25 unidades.

- Vaga: **Coordenador(a) Pedagógico(a)**.
- Processo: análise de candidaturas em até 7 dias úteis; entrevista on-line de 1 hora com a gerente regional; retorno final por e-mail.
- Cultura: comunicação próxima, usando "você", sem formalidade excessiva.
- A empresa quer deixar claro que todas as pessoas candidatas recebem retorno.
- Ferramenta de IA aprovada pela empresa disponível; o ATS permite preencher campos automaticamente.

*Dados fictícios.*`,
            guidedSteps: [
              'Defina o contexto: empresa, vaga e etapas do processo.',
              'Descreva o tom desejado de acordo com a cultura da empresa.',
              'Liste as informações obrigatórias de cada mensagem (prazos, formato, duração).',
              'Inclua campos variáveis e um limite de tamanho.',
              'Acrescente restrições: não inventar informações e usar linguagem inclusiva.',
            ],
            advancedChallenge: 'Inclua no prompt uma terceira mensagem de atualização para o caso de o processo atrasar, mantendo a transparência sem prometer novos prazos que você não definiu.',
            socraticQuestions: [
              'Que informações o candidato precisa ter em mãos para se preparar bem para a entrevista?',
              'Como a IA saberia o prazo de análise se ele não estivesse no seu prompt?',
              'Em que momento os dados pessoais dos candidatos entram no processo — e por que esse momento não precisa envolver a IA?',
            ],
            hints: [
              'Comece pelo contexto: Trilha Educação, vaga de Coordenador(a) Pedagógico(a), etapas e prazos.',
              'Para cada mensagem, liste as informações obrigatórias: prazo de 7 dias úteis, retorno garantido, entrevista on-line de 1 hora com a gerente regional.',
              'Inclua tom ("próximo, usando você"), campos [NOME], [VAGA], [DATA], [LINK], limite de palavras, "não invente informações" e linguagem inclusiva. Os dados são preenchidos no ATS, fora da IA.',
            ],
            modelAnswer: `**Prompt de referência:**

~~~
Atue como especialista em experiência do candidato.
Contexto: Trilha Educação (fictícia), rede de 25 escolas de
idiomas, vaga de Coordenador(a) Pedagógico(a). Processo: análise
em até 7 dias úteis; entrevista on-line de 1 hora com a gerente
regional; todas as pessoas recebem retorno final por e-mail.
Objetivo: criar dois modelos de mensagem:
1) confirmação de candidatura;
2) convite para entrevista.
Tom: próximo e cordial, usando "você", sem formalidade excessiva.
Restrições: até 100 palavras cada; linguagem inclusiva e neutra
em gênero; use apenas as informações acima; inclua oferta de
recursos de acessibilidade no convite.
Campos variáveis: [NOME], [VAGA], [DATA], [HORA], [LINK].
Formato: título de cada mensagem seguido do texto.
~~~

**Proteção de dados:** o prompt não contém nenhum dado pessoal. Os modelos são cadastrados no ATS, que preenche os campos automaticamente; nenhum nome ou e-mail de candidato é enviado à ferramenta de IA. Cada mensagem é revisada antes de ser ativada.`,
            maxAttempts: 4,
            passingScore: 70,
            rubric: {
              title: 'Rubrica — Prompt de comunicação com candidatos',
              description: 'Avalia a estrutura do prompt e o cuidado com dados.',
              criteria: [
                {
                  key: 'contextualizacao',
                  name: 'Contextualização',
                  description: 'Inclui empresa, vaga, etapas e prazos.',
                  weight: 2,
                  indicators: ['Informa prazos e formato da entrevista', 'Descreve a cultura e o tom'],
                },
                {
                  key: 'qualidade_solucao',
                  name: 'Qualidade do prompt',
                  description: 'Define objetivo, campos variáveis, tamanho e formato.',
                  weight: 3,
                  indicators: ['Pede os dois modelos', 'Usa campos variáveis', 'Limita o tamanho'],
                },
                {
                  key: 'uso_responsavel',
                  name: 'Uso responsável',
                  description: 'Protege dados e usa linguagem inclusiva.',
                  weight: 2,
                  indicators: ['Não inclui dados pessoais', 'Explica que dados são preenchidos fora da IA', 'Pede linguagem inclusiva'],
                },
                {
                  key: 'clareza',
                  name: 'Clareza',
                  description: 'Instruções organizadas e sem ambiguidade.',
                  weight: 1,
                  indicators: ['Prompt estruturado'],
                },
              ],
            },
            expectedKeywords: ['tom', 'prazo', 'dias', 'entrevista', 'on-line', 'online', '[nome]', 'campos', 'palavras', 'inclusiva', 'ats', 'dados', 'invente'],
          },
        },
      ],
      quiz: {
        kind: 'MODULE_QUIZ',
        title: 'Avaliação do módulo 1 — Jornada de comunicação',
        description: 'Verifique sua compreensão sobre comunicação com candidatos assistida por IA.',
        passingScore: 60,
        maxAttempts: 3,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            competencyKey: 'ai_recruitment',
            prompt: 'Qual informação o recrutador deve fornecer à IA, em vez de deixar que ela estime?',
            explanation: 'Prazos e etapas reais devem vir do recrutador para evitar informações inventadas.',
            options: [
              { label: 'O sinônimo de uma palavra.', isCorrect: false },
              { label: 'O prazo real de análise das candidaturas.', isCorrect: true },
              { label: 'A estrutura de uma frase.', isCorrect: false },
              { label: 'Uma saudação cordial.', isCorrect: false },
            ],
          },
          {
            type: 'TRUE_FALSE',
            competencyKey: 'responsible_ai',
            prompt: 'Para personalizar mensagens, é necessário enviar o nome e o e-mail de cada candidato à ferramenta de IA.',
            explanation: 'Campos variáveis preenchidos fora da IA permitem personalizar sem expor dados.',
            options: [
              { label: 'Verdadeiro', isCorrect: false },
              { label: 'Falso', isCorrect: true },
            ],
          },
          {
            type: 'MULTIPLE_CHOICE',
            competencyKey: 'prompt_engineering',
            prompt: 'Quais elementos tornam um prompt de mensagem a candidatos mais eficaz? (selecione todos os corretos)',
            explanation: 'Tom, informações obrigatórias, campos variáveis e limite de tamanho orientam a IA.',
            options: [
              { label: 'Descrição do tom desejado.', isCorrect: true },
              { label: 'Informações obrigatórias, como prazos e formato.', isCorrect: true },
              { label: 'Campos variáveis como [NOME] e [DATA].', isCorrect: true },
              { label: 'Lista de e-mails dos candidatos.', isCorrect: false },
            ],
          },
        ],
      },
    },
    {
      title: 'Retornos difíceis e transparência',
      description: 'Redija retornos negativos respeitosos, responda dúvidas sensíveis e comunique o uso de IA com transparência.',
      objectives: [
        'Redigir retornos negativos respeitosos e sem motivos inventados.',
        'Comunicar com transparência o tratamento de dados e o uso de IA.',
      ],
      lessons: [
        {
          title: 'Retornos negativos com respeito',
          summary: 'Como usar IA para dar retornos humanos, claros e sem justificativas inventadas.',
          estimatedMinutes: 20,
          learnContent: `## Por que o retorno negativo importa

O retorno negativo é um dos momentos mais sensíveis da jornada. Um retorno respeitoso preserva a relação com o candidato — que pode ser um futuro colaborador, cliente ou indicador da empresa.

## Características de um bom retorno

1. **Agradecimento genuíno** pelo tempo e interesse.
2. **Resultado claro**, sem rodeios excessivos.
3. **Sem motivos inventados** — se a empresa não informa motivos individualmente, não crie um.
4. **Próximos passos**, quando houver (banco de talentos, outras vagas).
5. **Informação sobre dados**: por quanto tempo o perfil ficará armazenado e como pedir exclusão.

## O risco dos motivos inventados

A IA, ao ser solicitada a "explicar por que o candidato não passou", pode criar justificativas plausíveis, mas falsas — ou até inadequadas ("buscamos um perfil mais jovem"). Isso pode gerar:
- frustração e desconfiança;
- exposição jurídica da empresa;
- reforço de critérios discriminatórios.

**Regra:** só comunique motivos que sejam **reais, objetivos e relacionados à vaga** — e definidos por pessoas.

## Feedback individual

Quando a empresa oferece feedback individual (comum em etapas finais), ele deve ser baseado nas **evidências registradas** pelos entrevistadores. A IA pode ajudar a **redigir** o feedback de forma construtiva a partir dessas evidências (anonimizadas), mas não a **criá-lo**.`,
          beginnerSupport: `### Um retorno é como fechar uma porta com cuidado

Você pode fechar uma porta batendo ou com delicadeza. O resultado é o mesmo — a porta fechada —, mas a sensação é muito diferente.

Um bom retorno negativo agradece, informa o resultado com clareza e deixa uma porta aberta para o futuro. E nunca inventa motivos: se você não tem um motivo para compartilhar, simplesmente não compartilhe.`,
          advancedDeepDive: `### Aprofundamento: feedback baseado em evidências

Para feedback individual de etapas finais, uma estrutura eficaz é: (1) uma competência demonstrada com evidência; (2) uma competência em que outros finalistas apresentaram mais evidências; (3) uma sugestão de desenvolvimento. A IA pode transformar anotações técnicas dos entrevistadores nesse formato, desde que as anotações sejam objetivas, anonimizadas e revisadas antes do envio. Evite comparações diretas com outros candidatos e qualquer referência a características pessoais.`,
          contextContent: `### Antes e depois

**Pedido inadequado à IA:**

~~~
Explique ao candidato por que ele não foi aprovado.
~~~

**Resposta típica (problemática):** *"Infelizmente, buscamos um perfil com maior maturidade e energia para o ritmo da equipe..."* — motivo genérico, inventado e com possível conotação etária.

**Pedido adequado:**

~~~
Escreva um modelo de retorno para candidatos não aprovados após
a entrevista final da vaga [VAGA]. Agradeça o tempo dedicado,
informe com clareza que o processo seguirá com outro perfil,
informe que o currículo ficará no banco de talentos por 6 meses
e que a pessoa pode pedir a exclusão dos dados a qualquer
momento. Não inclua motivos para a decisão. Tom respeitoso e
humano, até 120 palavras, campo [NOME].
~~~`,
          reflectionPrompt: 'Qual foi o retorno de processo seletivo mais respeitoso que você já recebeu ou enviou? O que o tornava diferente?',
          keyTakeaways: [
            'Retornos respeitosos preservam a relação com o candidato e a marca da empresa.',
            'Nunca peça à IA que invente motivos para uma decisão.',
            'Feedback individual deve se basear em evidências registradas por pessoas.',
          ],
          competencies: [
            { key: 'ai_recruitment', weight: 2 },
            { key: 'responsible_ai', weight: 1 },
          ],
        },
        {
          title: 'Transparência sobre dados e uso de IA',
          summary: 'Como informar candidatos sobre tratamento de dados e uso de IA de forma clara.',
          estimatedMinutes: 15,
          learnContent: `## Transparência como princípio

A LGPD (Lei 13.709/2018) estabelece a **transparência** como princípio: o titular dos dados deve receber informações claras sobre como seus dados são tratados. No recrutamento, isso inclui:

- quais dados são coletados e para quê;
- por quanto tempo serão armazenados;
- com quem podem ser compartilhados;
- como exercer direitos (acesso, correção, exclusão);
- se há uso de ferramentas automatizadas no processo.

## Comunicando o uso de IA

Se a empresa usa IA em alguma etapa, comunique de forma simples:

> "Utilizamos ferramentas de inteligência artificial para apoiar a redação de comunicações e a organização das etapas. Todas as decisões sobre o processo seletivo são tomadas por pessoas da nossa equipe."

Evite termos vagos ("usamos tecnologia avançada") e promessas que não podem ser cumpridas.

## Respondendo dúvidas sensíveis

Candidatos podem perguntar: "Uma IA avaliou meu currículo?" ou "Quero que meus dados sejam excluídos." A IA pode ajudar a criar **respostas-modelo** para essas perguntas frequentes, revisadas pelo jurídico ou pelo encarregado de dados (DPO), garantindo respostas consistentes e corretas.`,
          beginnerSupport: `### Contar como funciona gera confiança

Quando um restaurante mostra a cozinha, os clientes confiam mais. No recrutamento é parecido: explicar como o processo funciona — incluindo o uso de IA — deixa os candidatos mais tranquilos.

Uma frase simples, honesta e clara já faz muita diferença.`,
          advancedDeepDive: `### Aprofundamento: aviso de privacidade em camadas

Uma boa prática é o aviso de privacidade **em camadas**: uma mensagem curta e clara no momento da candidatura, com link para a política completa. A primeira camada responde ao essencial (finalidade, retenção, contato do encarregado); a segunda detalha bases legais, compartilhamentos e direitos. Esse formato aumenta a chance de o candidato realmente ler e compreender as informações.`,
          contextContent: `### Exemplo: resposta a pedido de exclusão

**Prompt:**

~~~
Crie um modelo de resposta para candidatos que pedem a exclusão
dos seus dados do banco de talentos. Tom cordial e objetivo.
Confirme o recebimento, informe que o pedido será atendido em até
15 dias e que a pessoa receberá confirmação por e-mail. Inclua o
campo [NOME]. Não mencione prazos ou informações legais que eu
não forneci.
~~~

O prazo de 15 dias foi definido pela empresa com o encarregado de dados — a IA apenas redige. O modelo é revisado pelo DPO antes de ser usado.`,
          reflectionPrompt: 'Os candidatos dos seus processos sabem como seus dados são tratados? O que poderia ser comunicado de forma mais clara?',
          keyTakeaways: [
            'Transparência é um princípio da LGPD e fortalece a confiança.',
            'Comunique o uso de IA de forma simples e honesta.',
            'Respostas-modelo sobre dados devem ser revisadas pelo jurídico ou DPO.',
          ],
          competencies: [{ key: 'responsible_ai', weight: 2 }],
          resources: [
            {
              label: 'Lei nº 13.709/2018 — LGPD (texto oficial)',
              url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
            },
          ],
          activity: {
            type: 'CASE_STUDY',
            title: 'Reescreva um retorno negativo inadequado',
            instructions: `O cenário traz um retorno negativo gerado por IA e enviado sem revisão.

1. Identifique **os problemas** da mensagem.
2. Escreva uma **nova versão** adequada (até 130 palavras).
3. Explique **como evitaria** que mensagens assim fossem enviadas novamente.`,
            scenario: `**Empresa fictícia: Mosaico Engenharia** — vaga de Assistente de Projetos.

Um recrutador pediu à IA: *"Explique ao candidato Carlos Mendes, CPF 000.000.000-00, por que ele foi reprovado."* e enviou a resposta sem revisar:

> Prezado Carlos Mendes (CPF 000.000.000-00),
>
> Após análise, concluímos que você não possui o perfil adequado para a vaga. Nossa equipe busca profissionais mais jovens e com maior disponibilidade, sem compromissos familiares que possam interferir na rotina. Além disso, nossa IA identificou que seu perfil apresenta baixa compatibilidade cultural (42%).
>
> Seus dados serão mantidos em nossa base por tempo indeterminado.
>
> Atenciosamente.

*Nome e dados fictícios.*`,
            guidedSteps: [
              'Observe quais dados pessoais aparecem na mensagem e no pedido feito à IA.',
              'Identifique os motivos apresentados e avalie se são reais, objetivos e não discriminatórios.',
              'Analise o que é dito sobre o armazenamento dos dados.',
              'Reescreva a mensagem com agradecimento, resultado claro e informações sobre dados.',
              'Proponha medidas de processo para evitar o problema.',
            ],
            advancedChallenge: 'Crie também um prompt reutilizável para retornos negativos que impeça a IA de gerar motivos e exija revisão humana antes do envio.',
            socraticQuestions: [
              'Quais informações da mensagem original nunca deveriam ter sido enviadas à ferramenta de IA?',
              'Os motivos apresentados têm relação com a capacidade de exercer a função?',
              'O que significa um "índice de compatibilidade cultural de 42%" e como ele poderia ser verificado?',
              'Que etapa do processo faltou para que essa mensagem não fosse enviada?',
            ],
            hints: [
              'Procure problemas de três tipos: dados pessoais expostos, motivos discriminatórios ou inventados e informações sobre dados inadequadas.',
              'O CPF foi exposto à IA e na mensagem; "mais jovens" e "compromissos familiares" são discriminatórios; o índice de 42% não tem base; "tempo indeterminado" contraria a LGPD.',
              'A nova versão deve agradecer, informar o resultado sem motivos inventados, indicar o prazo de retenção e a possibilidade de exclusão. Como medida: revisão obrigatória e modelos aprovados.',
            ],
            modelAnswer: `**Problemas:**
1. **Dados pessoais expostos**: nome completo e CPF enviados à IA e repetidos na mensagem.
2. **Motivos discriminatórios**: preferência por "mais jovens" (idade) e "sem compromissos familiares" (situação familiar) — vedados pela Lei 9.029/1995.
3. **Métrica inventada**: "compatibilidade cultural de 42%" sem base e sem relação com a função.
4. **Retenção indefinida**: contraria os princípios de necessidade e finalidade da LGPD.
5. **Ausência de revisão humana** antes do envio.

**Nova versão:**

> Olá, [NOME]! Agradecemos sua participação no processo para Assistente de Projetos e o tempo dedicado às nossas conversas. Após concluir as etapas, seguimos com outro perfil para esta vaga.
>
> Com sua autorização, seu currículo ficará em nosso banco de talentos por 6 meses para oportunidades futuras. Se preferir a exclusão dos seus dados, basta responder a este e-mail.
>
> Desejamos sucesso na sua trajetória!

**Medidas:** usar apenas modelos aprovados; proibir dados pessoais nos prompts; revisão obrigatória antes do envio; orientar a equipe a nunca pedir motivos à IA.`,
            maxAttempts: 4,
            passingScore: 70,
            rubric: {
              title: 'Rubrica — Retorno negativo responsável',
              description: 'Avalia a análise dos problemas e a qualidade da nova mensagem.',
              criteria: [
                {
                  key: 'pensamento_critico',
                  name: 'Pensamento crítico',
                  description: 'Identifica os problemas da mensagem original.',
                  weight: 2,
                  indicators: ['Identifica motivos discriminatórios', 'Questiona a métrica inventada'],
                },
                {
                  key: 'uso_responsavel',
                  name: 'Uso responsável',
                  description: 'Reconhece exposição de dados e problemas de retenção.',
                  weight: 3,
                  indicators: ['Aponta a exposição do CPF', 'Corrige a retenção de dados', 'Menciona LGPD ou discriminação'],
                },
                {
                  key: 'qualidade_solucao',
                  name: 'Qualidade da nova mensagem',
                  description: 'Mensagem respeitosa, clara e sem motivos inventados.',
                  weight: 2,
                  indicators: ['Agradece e informa o resultado', 'Não inventa motivos', 'Informa sobre dados'],
                },
                {
                  key: 'clareza',
                  name: 'Clareza',
                  description: 'Resposta organizada.',
                  weight: 1,
                  indicators: ['Separa análise, mensagem e medidas'],
                },
              ],
            },
            expectedKeywords: ['cpf', 'dados', 'jovens', 'idade', 'familiar', 'discrimina', 'lgpd', '42%', 'invent', 'revis', 'exclus', 'banco de talentos', 'agrade'],
          },
        },
      ],
      quiz: {
        kind: 'MODULE_QUIZ',
        title: 'Avaliação do módulo 2 — Retornos e transparência',
        description: 'Verifique sua compreensão sobre retornos negativos e transparência.',
        passingScore: 60,
        maxAttempts: 3,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            competencyKey: 'ai_recruitment',
            prompt: 'Qual elemento NÃO deve estar em um retorno negativo gerado com apoio de IA?',
            explanation: 'Motivos inventados pela IA não devem ser comunicados.',
            options: [
              { label: 'Agradecimento pela participação.', isCorrect: false },
              { label: 'Resultado claro.', isCorrect: false },
              { label: 'Um motivo plausível criado pela IA.', isCorrect: true },
              { label: 'Informação sobre o armazenamento dos dados.', isCorrect: false },
            ],
          },
          {
            type: 'TRUE_FALSE',
            competencyKey: 'responsible_ai',
            prompt: 'A transparência sobre o tratamento de dados é um dos princípios da LGPD.',
            explanation: 'A transparência é um dos princípios previstos na LGPD.',
            options: [
              { label: 'Verdadeiro', isCorrect: true },
              { label: 'Falso', isCorrect: false },
            ],
          },
          {
            type: 'SCENARIO',
            competencyKey: 'responsible_ai',
            prompt: 'Um candidato pergunta se uma IA decidiu sua reprovação. Qual resposta é mais adequada (considerando que as decisões são humanas)?',
            explanation: 'Resposta honesta, clara e consistente com a prática real da empresa.',
            options: [
              { label: 'Ignorar a pergunta.', score: 0, isCorrect: false },
              {
                label: 'Explicar que ferramentas de IA apoiam tarefas como a redação de comunicações, mas que todas as decisões são tomadas por pessoas da equipe.',
                score: 100,
                isCorrect: true,
              },
              { label: 'Dizer que a decisão foi da IA para evitar conflitos.', score: 0, isCorrect: false },
              { label: 'Responder que isso é confidencial.', score: 20, isCorrect: false },
            ],
          },
        ],
      },
    },
  ],
  finalAssessment: {
    kind: 'FINAL',
    title: 'Avaliação final — Comunicação com candidatos',
    description: 'Seis questões sobre as competências do curso. Nota mínima: 70%.',
    passingScore: 70,
    maxAttempts: 2,
    questions: [
      {
        type: 'SCENARIO',
        competencyKey: 'prompt_engineering',
        prompt: 'Qual prompt gera o melhor modelo de convite para entrevista?',
        explanation: 'Contexto, tom, informações obrigatórias, campos variáveis e tamanho.',
        options: [
          { label: '"Faça um convite de entrevista."', score: 0, isCorrect: false },
          { label: '"Faça um convite cordial."', score: 25, isCorrect: false },
          {
            label: '"Convite para entrevista presencial da vaga de Recepcionista, tom cordial, até 90 palavras, com [NOME], [DATA], [HORA] e [ENDEREÇO], oferecendo recursos de acessibilidade."',
            score: 100,
            isCorrect: true,
          },
          { label: '"Faça um convite com todas as informações possíveis."', score: 10, isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        competencyKey: 'prompt_engineering',
        prompt: 'Como pedir à IA que ajuste uma mensagem muito formal?',
        explanation: 'Descrever o tom desejado com clareza e dar restrições específicas.',
        options: [
          { label: '"Melhore."', isCorrect: false },
          { label: '"Reescreva com tom cordial e direto, frases curtas, usando você e até 100 palavras."', isCorrect: true },
          { label: '"Deixe mais bonito."', isCorrect: false },
          { label: '"Use mais palavras difíceis."', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE',
        competencyKey: 'ai_recruitment',
        prompt: 'Quais pontos de contato devem ter mensagens planejadas na jornada do candidato? (selecione todos os corretos)',
        explanation: 'Confirmação, convite e retorno final são pontos de contato essenciais.',
        options: [
          { label: 'Confirmação de candidatura.', isCorrect: true },
          { label: 'Convite para entrevista.', isCorrect: true },
          { label: 'Retorno final, positivo ou negativo.', isCorrect: true },
          { label: 'Monitoramento das redes sociais do candidato.', isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        competencyKey: 'ai_recruitment',
        prompt: 'Quem deve definir os prazos informados nas mensagens aos candidatos?',
        explanation: 'Prazos reais vêm da equipe de recrutamento; a IA apenas redige.',
        options: [
          { label: 'A IA, com base em médias de mercado.', isCorrect: false },
          { label: 'A equipe de recrutamento, com base no processo real.', isCorrect: true },
          { label: 'O próprio candidato.', isCorrect: false },
          { label: 'Ninguém; é melhor não informar prazos.', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE',
        competencyKey: 'responsible_ai',
        prompt: 'Manter dados de candidatos por tempo indeterminado, sem informar o titular, está de acordo com a LGPD.',
        explanation: 'A retenção deve ser limitada à finalidade e comunicada com transparência.',
        options: [
          { label: 'Verdadeiro', isCorrect: false },
          { label: 'Falso', isCorrect: true },
        ],
      },
      {
        type: 'SCENARIO',
        competencyKey: 'responsible_ai',
        prompt: 'Você quer usar IA para responder dúvidas frequentes de candidatos sobre exclusão de dados. Qual abordagem é mais adequada?',
        explanation: 'Respostas-modelo revisadas pelo DPO ou jurídico garantem correção e consistência.',
        options: [
          { label: 'Deixar a IA responder livremente cada candidato.', score: 0, isCorrect: false },
          { label: 'Criar respostas-modelo com a IA e submetê-las à revisão do encarregado de dados (DPO) ou do jurídico.', score: 100, isCorrect: true },
          { label: 'Copiar respostas de outras empresas.', score: 10, isCorrect: false },
          { label: 'Não responder pedidos de exclusão.', score: 0, isCorrect: false },
        ],
      },
    ],
  },
  satisfaction: buildSatisfactionSurvey('Comunicação com Candidatos Assistida por IA'),
};
