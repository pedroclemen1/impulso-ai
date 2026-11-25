import type { SeedModule } from './types';

export const recruitmentModule3: SeedModule = {
  title: 'IA aplicada ao recrutamento',
  description:
    'Aplique a IA em atividades centrais do recrutamento: descrições de vagas, roteiros de entrevista, organização de informações, comunicação com candidatos, critérios de avaliação e tarefas administrativas.',
  objectives: [
    'Usar IA para rascunhar descrições de vagas e roteiros de entrevista estruturada.',
    'Organizar informações profissionais e comunicar-se com candidatos com apoio de IA.',
    'Estruturar critérios de avaliação objetivos e transparentes.',
    'Desenhar um fluxo de trabalho que combine IA e revisão humana.',
  ],
  lessons: [
    {
      title: 'Descrições de vagas e roteiros de entrevista',
      summary: 'Do briefing do gestor à descrição de vaga e ao roteiro de entrevista estruturada.',
      estimatedMinutes: 25,
      learnContent: `## Da conversa com o gestor ao texto da vaga

O levantamento de perfil (*intake*) com o gestor costuma gerar anotações soltas. A IA ajuda a transformar esse material em:

1. uma **descrição de vaga** clara e atrativa;
2. uma **lista de competências** priorizadas;
3. um **roteiro de entrevista** coerente com essas competências.

Fazer essas três peças a partir da mesma base garante **coerência**: o que é anunciado é o que será avaliado.

## Boas práticas para descrições de vagas

- Separe **requisitos obrigatórios** de **desejáveis** — listas longas de exigências afastam bons candidatos, especialmente de grupos sub-representados.
- Descreva o **dia a dia** do cargo, não apenas qualificações.
- Use **linguagem inclusiva** e evite termos como "jovem", "boa aparência" ou "disponibilidade total".
- Seja transparente sobre modelo de trabalho e etapas do processo.
- **Não deixe a IA inventar** benefícios, faixas salariais ou dados da empresa.

## Entrevista estruturada com apoio de IA

Uma entrevista **estruturada** usa as mesmas perguntas, na mesma ordem, com critérios definidos previamente para todos os candidatos. Esse formato tende a ser mais justo e mais preditivo do que conversas livres.

A IA pode ajudar a:

| Etapa | Contribuição da IA | Revisão humana |
|---|---|---|
| Definir competências | Sugerir competências a partir do briefing | Validar com o gestor |
| Criar perguntas | Propor perguntas comportamentais e situacionais | Verificar relevância e adequação legal |
| Definir sinais de boa resposta | Descrever indicadores observáveis | Calibrar com o time |
| Escala de avaliação | Sugerir escala de 1 a 5 com descritores | Ajustar à realidade da empresa |

## Perguntas que nunca devem estar no roteiro

Perguntas sobre idade, estado civil, filhos ou planos de gravidez, religião, orientação sexual, posicionamento político ou condições de saúde não relacionadas à função são inadequadas e podem configurar discriminação. Inclua essa restrição **explicitamente** no prompt e revise o resultado.`,
      beginnerSupport: `### Pense em um "kit da vaga"

Para cada vaga, você pode montar com a IA um pequeno kit:

1. **Anúncio** — o que o candidato vai ler.
2. **Competências** — o que realmente importa para o cargo.
3. **Roteiro de entrevista** — perguntas iguais para todos, ligadas às competências.

A IA escreve rápido os rascunhos. Você confere com o gestor se está tudo certo e se nada de inadequado entrou no texto.

**Dica:** guarde o prompt que funcionou bem. Na próxima vaga, basta trocar as informações.`,
      advancedDeepDive: `### Aprofundamento: âncoras comportamentais

Escalas de avaliação com **âncoras comportamentais** (BARS — *Behaviorally Anchored Rating Scales*) descrevem, para cada nota, um comportamento observável. Exemplo para "resolução de problemas":

- **1** — descreve o problema, mas não apresenta ação própria;
- **3** — apresenta ação estruturada, com resultado parcial;
- **5** — apresenta diagnóstico, alternativas, ação e aprendizado mensurável.

A IA pode gerar uma primeira versão dessas âncoras, mas elas precisam ser **calibradas** com entrevistadores experientes e revisadas para evitar critérios subjetivos como "postura" ou "presença" sem definição clara. Considere também a consistência entre entrevistadores: treinar o time no uso do roteiro é tão importante quanto o roteiro em si.`,
      contextContent: `### Exemplo: do briefing ao roteiro

**Anotações do gestor (fictícias):** "Preciso de alguém pra cuidar do estoque do CD, que organize o time do turno da noite, saiba Excel e não perca a calma quando atrasa caminhão."

**Prompt:**

~~~
Com base nas anotações abaixo, faça três coisas:
1) Liste até 5 competências essenciais para a vaga.
2) Escreva uma descrição de vaga de Líder de Estoque (turno
noturno) com até 250 palavras, linguagem inclusiva, sem inventar
benefícios.
3) Crie um roteiro de entrevista estruturada com 1 pergunta
comportamental por competência, em tabela: Competência | Pergunta
| Sinais de boa resposta.
Não inclua perguntas sobre vida pessoal, idade ou família.

### ANOTAÇÕES DO GESTOR ###
Cuidar do estoque do CD, organizar o time do turno da noite,
Excel, manter a calma com atrasos de caminhão.
~~~

**Competências que a IA tende a sugerir:** gestão de equipe, organização de estoque, uso de planilhas, resolução de problemas sob pressão, comunicação.

**Revisão do recrutador:** confirmar com o gestor o nível de Excel exigido e se "turno noturno" tem horário definido — informação que a IA não tinha e não deve inventar.`,
      reflectionPrompt:
        'Nos processos que você conduz, as perguntas de entrevista estão ligadas às competências anunciadas na vaga? Como a IA poderia ajudar a fortalecer essa coerência?',
      keyTakeaways: [
        'Descrição de vaga, competências e roteiro devem nascer da mesma base.',
        'Entrevistas estruturadas tendem a ser mais justas e consistentes.',
        'A IA rascunha perguntas e critérios; o gestor e o recrutador validam.',
        'Proíba explicitamente perguntas discriminatórias no prompt.',
      ],
      competencies: [{ key: 'ai_recruitment', weight: 2 }, { key: 'prompt_engineering', weight: 1 }],
    },
    {
      title: 'Organização de informações e comunicação com candidatos',
      summary: 'Resumos, quadros comparativos e mensagens a candidatos — com privacidade e empatia.',
      estimatedMinutes: 20,
      learnContent: `## Organizando informações profissionais

Recrutadores lidam com grande volume de informação: anotações de entrevistas, requisitos, feedback de gestores, status de vagas. A IA pode ajudar a **estruturar** esse material, por exemplo:

- resumir anotações de entrevista em tópicos por competência;
- consolidar o feedback de vários entrevistadores;
- transformar o status de várias vagas em um relatório semanal.

### Cuidados indispensáveis

1. **Anonimize antes de enviar**: substitua nomes por códigos (Candidato A, B, C) e remova CPF, endereço, telefone, data de nascimento, fotos e qualquer dado sensível.
2. **Use ferramentas aprovadas pela empresa**: ferramentas públicas podem armazenar ou usar os dados enviados conforme seus termos de uso.
3. **Resumo não é avaliação**: o resumo organiza evidências; a avaliação continua sendo feita por pessoas com base em critérios definidos.
4. **Confira com o original**: resumos podem omitir pontos importantes ou distorcer falas.

## Comunicação com candidatos

A experiência do candidato depende de comunicação **clara, respeitosa e rápida**. A IA ajuda a criar modelos de:

| Mensagem | Objetivo | Cuidado |
|---|---|---|
| Confirmação de candidatura | Informar próximos passos e prazos | Prazos reais, não estimados pela IA |
| Convite para entrevista | Dar informações práticas | Horários e local corretos |
| Retorno negativo | Encerrar com respeito | Evitar justificativas genéricas ou ofensivas |
| Proposta | Formalizar condições | Revisão obrigatória por RH e gestor |

### Tom e personalização

Peça à IA o tom desejado ("acolhedor, profissional, sem excesso de formalidade") e deixe campos para personalização: [nome], [vaga], [data]. Preencha esses campos **fora** da ferramenta de IA quando envolverem dados pessoais.

## Transparência

Se a empresa usa IA em etapas do processo, considere informar os candidatos sobre isso de forma clara. Transparência fortalece a confiança e está alinhada aos princípios da LGPD.`,
      beginnerSupport: `### Anonimizar é como tirar as etiquetas

Antes de pedir à IA para resumir anotações, "tire as etiquetas" que identificam a pessoa:

- **Nome** → Candidato A
- **Telefone, e-mail, CPF, endereço** → remova
- **Idade, estado civil, filhos, saúde** → remova (e reflita se isso deveria estar nas anotações)

O que sobra são as **evidências profissionais**: experiências, exemplos dados na entrevista, competências observadas. É isso que importa para o resumo — e é isso que pode ser processado com mais segurança.`,
      advancedDeepDive: `### Aprofundamento: minimização e retenção

Dois princípios da LGPD são centrais aqui:

- **Necessidade (minimização)**: tratar apenas os dados estritamente necessários para a finalidade. Se o objetivo é resumir competências, não há por que enviar dados de contato.
- **Finalidade e segurança**: dados coletados para o processo seletivo não devem ser reutilizados para outros fins sem base legal, e precisam de proteção adequada.

Em ferramentas corporativas, verifique: onde os dados ficam armazenados, por quanto tempo, se são usados para treinar modelos e quem tem acesso aos históricos. Em fluxos automatizados, prefira **pseudonimização** (códigos internos ligados à identidade apenas no sistema da empresa) e registre quais dados foram enviados a cada ferramenta.`,
      contextContent: `### Exemplo: retorno negativo respeitoso

**Prompt:**

~~~
Escreva um modelo de e-mail de retorno para candidatos que
participaram da entrevista final para Analista Financeiro e não
foram selecionados. Tom: respeitoso, humano e objetivo. Agradeça
a participação, informe que o perfil ficará no banco de talentos
por 6 meses (com possibilidade de o candidato pedir exclusão) e
deixe campos [NOME] e [VAGA]. Até 120 palavras. Não invente
motivos para a decisão.
~~~

**Resultado esperado (trecho):**

> Olá, [NOME]! Agradecemos muito sua participação no processo para [VAGA] e o tempo dedicado às nossas conversas. Após uma análise cuidadosa, seguimos com outro perfil nesta etapa...

Observe as escolhas: o prompt **proíbe motivos inventados** (que poderiam soar genéricos ou até gerar problemas jurídicos) e menciona a **possibilidade de exclusão dos dados**, um cuidado alinhado à LGPD.

### Exemplo: consolidando feedback anonimizado

~~~
Consolide os feedbacks abaixo sobre o Candidato B em uma tabela
por competência (Comunicação, Análise de dados, Trabalho em
equipe), citando a evidência de cada entrevistador. Não atribua
notas e não faça recomendação de contratação.
~~~`,
      reflectionPrompt:
        'Que dados você costuma ter em suas anotações de entrevista? Quais deles seriam realmente necessários para um resumo por competência?',
      keyTakeaways: [
        'A IA ajuda a estruturar informações, mas resumo não é avaliação.',
        'Anonimize e minimize dados antes de usar qualquer ferramenta de IA.',
        'Modelos de mensagem com campos variáveis aceleram uma comunicação respeitosa.',
        'Nunca deixe a IA inventar motivos, prazos ou condições.',
      ],
      competencies: [
        { key: 'ai_recruitment', weight: 2 },
        { key: 'responsible_ai', weight: 1 },
      ],
    },
    {
      title: 'Critérios de avaliação e otimização administrativa',
      summary: 'Critérios objetivos, matrizes de avaliação e automação de tarefas repetitivas com pontos de controle humano.',
      estimatedMinutes: 30,
      learnContent: `## Critérios de avaliação objetivos

Critérios claros tornam o processo mais justo, transparente e defensável. A IA pode ajudar a transformar competências em **critérios observáveis**:

| Competência | Critério vago | Critério observável |
|---|---|---|
| Comunicação | "Se comunica bem" | "Explica uma análise técnica para um público não técnico com exemplo concreto" |
| Organização | "É organizado" | "Descreve método de priorização usado em situação real" |
| Análise de dados | "Sabe dados" | "Interpreta um gráfico simples e aponta uma conclusão e uma limitação" |

### Matriz de avaliação

Uma matriz relaciona **competências**, **peso** de cada uma e **escala** com descritores. A IA pode rascunhar a matriz, mas **pesos e critérios são decisões do negócio** — devem ser definidos com o gestor antes das entrevistas, e não ajustados depois para favorecer alguém.

## Otimizando tarefas administrativas

Boa parte do tempo do recrutador vai para tarefas repetitivas. Exemplos de apoio da IA:

- gerar a **agenda semanal** de entrevistas a partir de uma lista de disponibilidade (sem dados pessoais desnecessários);
- criar **checklists** de abertura de vaga;
- padronizar o **relatório de status** das vagas;
- redigir **atas** de alinhamento com gestores.

## Desenhando um fluxo de trabalho assistido por IA

Um fluxo bem desenhado define, para cada etapa:

1. **Entrada** — que informação é usada.
2. **Papel da IA** — o que ela produz.
3. **Ponto de controle humano** — quem revisa e aprova.
4. **Saída** — o que segue para a próxima etapa.
5. **Riscos e cuidados** — privacidade, vieses, erros.

### Exemplo resumido

| Etapa | IA | Humano |
|---|---|---|
| Intake | Organiza anotações em perfil da vaga | Gestor valida |
| Anúncio | Rascunha descrição | Recrutador revisa linguagem e requisitos |
| Triagem | **Não decide**; pode resumir requisitos atendidos a partir de dados anonimizados | Recrutador avalia com critérios definidos |
| Entrevista | Sugere roteiro e escala | Entrevistadores conduzem e avaliam |
| Decisão | — | Gestor e RH decidem |
| Retorno | Rascunha mensagens | Recrutador revisa e envia |

## Medindo o resultado

Para saber se a IA está ajudando, acompanhe indicadores como tempo de abertura de vaga, tempo de resposta a candidatos e qualidade percebida pelos gestores — e monitore riscos, como reclamações de candidatos ou sinais de viés.`,
      beginnerSupport: `### Um fluxo é como uma linha de montagem com inspeções

Em uma fábrica, cada estação faz uma parte do trabalho, e há pontos de inspeção para garantir a qualidade.

No recrutamento com IA:
- a **IA** é uma estação rápida que produz rascunhos;
- o **recrutador** e o **gestor** são os inspetores que aprovam ou corrigem;
- a **decisão final** sobre pessoas fica sempre com os humanos.

Ao desenhar seu fluxo, pergunte em cada etapa: **"Quem confere isso antes de seguir?"**`,
      advancedDeepDive: `### Aprofundamento: governança do fluxo

Em fluxos recorrentes, considere elementos de governança:

- **Registro (log)** do que foi gerado por IA e do que foi alterado por pessoas.
- **Critérios de parada**: situações em que a IA não deve ser usada (ex.: decisões disciplinares, dados de saúde).
- **Monitoramento de impacto adverso**: comparar taxas de avanço entre grupos ao longo do processo (com dados tratados de forma agregada e segura) para detectar possíveis vieses.
- **Revisão periódica** dos prompts e critérios com RH, jurídico e gestores.
- **Plano de contingência**: o processo deve continuar funcionando se a ferramenta de IA ficar indisponível.

Esses elementos transformam o uso pontual de IA em uma prática **auditável e sustentável**.`,
      contextContent: `### Exemplo: relatório semanal em minutos

**Prompt:**

~~~
Transforme a tabela abaixo em um relatório executivo semanal com:
(1) resumo geral em 3 linhas; (2) vagas em risco de atraso e
motivo informado; (3) próximos passos por vaga. Use apenas os
dados fornecidos. Não inclua nomes de candidatos.

### STATUS DAS VAGAS ###
Analista Fiscal | aberta há 32 dias | 2 finalistas | aguardando gestor
Assistente Administrativo | aberta há 8 dias | triagem | sem bloqueio
Coordenador de Qualidade | aberta há 45 dias | 0 finalistas | perfil revisado
~~~

**Por que funciona:** o recrutador fornece os dados, define a estrutura e proíbe informações extras. A IA economiza tempo de redação; o recrutador confere se o texto reflete a realidade antes de enviar à diretoria.

### Exemplo: critérios a partir de competências

~~~
Para a competência "orientação ao cliente" em uma vaga de
Atendimento, proponha 3 critérios observáveis e uma escala de
1 a 5 com descritores comportamentais. Evite critérios ligados
a aparência, sotaque ou características pessoais.
~~~`,
      reflectionPrompt:
        'Pense em um processo seletivo recente. Em qual etapa a ausência de um ponto de controle humano claro geraria mais risco?',
      keyTakeaways: [
        'Critérios observáveis tornam a avaliação mais justa e transparente.',
        'Pesos e critérios são decisões do negócio, definidas antes das entrevistas.',
        'Um fluxo assistido por IA define entrada, papel da IA, controle humano, saída e riscos.',
        'A IA não decide quem avança no processo.',
      ],
      competencies: [
        { key: 'workflow_design', weight: 2 },
        { key: 'ai_recruitment', weight: 2 },
        { key: 'responsible_ai', weight: 1 },
      ],
      activity: {
        type: 'WORKFLOW_DESIGN',
        title: 'Fluxo de trabalho assistido por IA para uma vaga',
        instructions: `Construa um **fluxo de trabalho assistido por IA** para conduzir o processo seletivo da vaga descrita no cenário.

Seu fluxo deve ter **pelo menos 4 etapas**. Para cada uma, indique:
1. o que a IA faz (e um exemplo de prompt resumido);
2. qual é o **ponto de controle humano** (quem revisa ou decide);
3. um **risco ou cuidado** (privacidade, vieses, erros).

Termine indicando **qual etapa a IA não deve executar** e por quê.`,
        scenario: `**Vaga fictícia: Analista de Dados Pleno — Veridia Logística**

- **Empresa:** Veridia Logística (fictícia), transportadora regional com 1.200 colaboradores e sede em Campinas (SP).
- **Área:** Inteligência Operacional, time de 5 pessoas que apoia o planejamento de rotas e a redução de custos de frete.
- **Responsabilidades:** construir painéis de indicadores operacionais, analisar atrasos de entrega, apoiar projetos de otimização de rotas e apresentar resultados para gerentes regionais.
- **Requisitos levantados pelo gestor:** SQL intermediário, Power BI ou ferramenta similar, Python desejável, boa comunicação com áreas não técnicas, experiência com dados operacionais (desejável).
- **Modelo:** híbrido (3 dias presenciais).
- **Prazo:** o gestor quer a pessoa contratada em até 45 dias.
- **Contexto do RH:** o time de recrutamento tem 2 pessoas e outras 10 vagas abertas; a empresa possui uma ferramenta corporativa de IA aprovada pelo jurídico, configurada para não usar os dados para treinamento.
- **Volume esperado:** cerca de 250 candidaturas.

*Todos os dados são fictícios. Em situações reais, anonimize as informações dos candidatos antes de qualquer uso de IA.*`,
        guidedSteps: [
          'Liste as etapas do processo: levantamento do perfil, anúncio, triagem, entrevistas, decisão e retorno.',
          'Para cada etapa, escreva o que a IA poderia produzir e um prompt resumido.',
          'Defina quem revisa ou aprova o resultado de cada etapa.',
          'Aponte um risco por etapa (ex.: dados pessoais, critérios enviesados, informações inventadas).',
          'Indique a etapa em que a IA não deve atuar e justifique.',
        ],
        advancedChallenge:
          'Inclua no fluxo dois indicadores para avaliar se o uso de IA melhorou o processo (eficiência e qualidade) e um mecanismo para detectar possíveis vieses na triagem.',
        socraticQuestions: [
          'Em qual etapa do seu fluxo um erro da IA teria maior impacto sobre os candidatos?',
          'Com 250 candidaturas, como você usaria a IA para ganhar tempo sem transferir a ela a decisão sobre quem avança?',
          'Que dados dos candidatos realmente precisam chegar à ferramenta de IA em cada etapa?',
          'Como o gestor participa do fluxo para garantir que os critérios reflitam a necessidade real da vaga?',
        ],
        hints: [
          'Comece pelo fim: qual decisão precisa ser tomada e por quem? Depois organize as etapas que levam até ela.',
          'Bons usos de IA aqui: organizar o perfil da vaga, rascunhar o anúncio, sugerir roteiro de entrevista estruturada e rascunhar retornos. A triagem exige cuidado redobrado.',
          'Para cada etapa, use o padrão "IA faz X → pessoa Y revisa → cuidado Z". Na triagem, a IA pode, no máximo, organizar evidências a partir de dados anonimizados e critérios definidos previamente; a decisão é do recrutador.',
        ],
        modelAnswer: `**Fluxo de referência**

| Etapa | O que a IA faz | Controle humano | Risco / cuidado |
|---|---|---|---|
| 1. Perfil da vaga | Organiza as anotações do gestor em competências e critérios observáveis ("Organize estas anotações em até 5 competências com critérios observáveis") | Gestor valida competências e pesos **antes** da abertura | Requisitos excessivos ou irrelevantes |
| 2. Anúncio | Rascunha a descrição (prompt com contexto da Veridia, senioridade, stack, modelo híbrido, linguagem inclusiva, sem inventar benefícios) | Recrutador revisa linguagem e fidelidade; gestor aprova | Benefícios inventados, linguagem excludente |
| 3. Triagem | Resume, a partir de candidaturas **anonimizadas**, evidências relacionadas aos critérios definidos (ex.: experiência com SQL) | Recrutador analisa cada candidatura e decide quem avança | Viés, exclusão indevida, dados pessoais; a IA **não** ranqueia nem reprova |
| 4. Entrevistas | Sugere roteiro estruturado e escala com âncoras comportamentais | Recrutador e gestor calibram e conduzem; cada entrevistador avalia individualmente | Perguntas inadequadas sobre vida pessoal |
| 5. Decisão | — | Gestor e RH decidem com base na matriz | Não delegar à IA |
| 6. Retorno | Rascunha modelos de mensagem com campos variáveis | Recrutador revisa e personaliza fora da ferramenta | Motivos genéricos ou inventados |

**Etapa que a IA não deve executar:** a decisão sobre aprovação ou reprovação (triagem final e escolha do finalista). Ela envolve julgamento sobre pessoas, responsabilidade legal e risco de discriminação.

**Indicadores (desafio):** tempo médio por etapa e satisfação do gestor com os finalistas; para vieses, comparar de forma agregada as taxas de avanço entre etapas e revisar critérios se houver disparidades.

*Por que é uma boa resposta:* cada etapa tem papel da IA, responsável humano e risco explícito, e a decisão permanece humana.`,
        maxAttempts: 4,
        passingScore: 70,
        rubric: {
          title: 'Rubrica — Fluxo de trabalho assistido por IA',
          description: 'Avalia a qualidade do desenho do fluxo e a preservação da supervisão humana.',
          criteria: [
            {
              key: 'qualidade_solucao',
              name: 'Qualidade da solução',
              description: 'O fluxo é completo, coerente e aplicável à vaga.',
              weight: 3,
              indicators: [
                'Apresenta ao menos 4 etapas encadeadas',
                'Descreve o papel da IA com exemplos de prompt',
                'Considera o volume e o prazo do cenário',
              ],
            },
            {
              key: 'pensamento_critico',
              name: 'Supervisão humana e pensamento crítico',
              description: 'Define pontos de controle humano e reconhece limites da IA.',
              weight: 3,
              indicators: [
                'Indica quem revisa cada etapa',
                'Mantém a decisão sobre candidatos com humanos',
                'Aponta riscos específicos por etapa',
              ],
            },
            {
              key: 'uso_responsavel',
              name: 'Uso responsável de IA',
              description: 'Considera privacidade, anonimização e vieses.',
              weight: 2,
              indicators: ['Menciona anonimização ou minimização de dados', 'Considera vieses na triagem'],
            },
            {
              key: 'contextualizacao',
              name: 'Contextualização profissional',
              description: 'Usa as informações da vaga da Veridia Logística.',
              weight: 2,
              indicators: ['Cita requisitos e características da vaga', 'Relaciona o fluxo ao contexto do RH'],
            },
            {
              key: 'clareza',
              name: 'Clareza',
              description: 'Organização e objetividade da resposta.',
              weight: 1,
              indicators: ['Estrutura por etapas', 'Texto objetivo'],
            },
          ],
        },
        expectedKeywords: [
          'etapa',
          'gestor',
          'revis',
          'anonim',
          'triagem',
          'entrevista',
          'roteiro',
          'anúncio',
          'anuncio',
          'decis',
          'humano',
          'viés',
          'vies',
          'critérios',
          'criterios',
        ],
      },
    },
  ],
  quiz: {
    kind: 'MODULE_QUIZ',
    title: 'Avaliação do módulo 3 — IA aplicada ao recrutamento',
    description: 'Verifique sua capacidade de aplicar IA em atividades de recrutamento com responsabilidade.',
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Qual é a principal vantagem de criar descrição de vaga, competências e roteiro de entrevista a partir da mesma base?',
        competencyKey: 'ai_recruitment',
        explanation: 'A coerência garante que o que é anunciado seja o que é avaliado.',
        options: [
          { label: 'Reduzir o número de candidatos.', isCorrect: false },
          { label: 'Garantir coerência entre o que é anunciado e o que é avaliado.', isCorrect: true },
          { label: 'Permitir que a IA decida quem contratar.', isCorrect: false },
          { label: 'Eliminar a participação do gestor.', isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        prompt: 'Você precisa resumir anotações de entrevistas com apoio de IA. Qual procedimento é o mais adequado?',
        competencyKey: 'responsible_ai',
        explanation: 'Anonimizar, usar ferramenta aprovada e conferir o resumo com o original é a prática correta.',
        options: [
          { label: 'Colar as anotações completas, com nome e telefone, em uma ferramenta pública.', isCorrect: false, score: 0 },
          {
            label: 'Substituir nomes por códigos, remover dados pessoais, usar a ferramenta aprovada pela empresa e conferir o resumo com o original.',
            isCorrect: true,
            score: 100,
          },
          { label: 'Remover apenas o CPF e enviar o restante.', isCorrect: false, score: 30 },
          { label: 'Pedir à IA que dê uma nota final a cada candidato.', isCorrect: false, score: 0 },
        ],
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'Em um fluxo bem desenhado, a IA pode reprovar automaticamente candidatos na triagem, desde que o prompt seja bom.',
        competencyKey: 'workflow_design',
        explanation: 'Decisões sobre candidatos devem permanecer com pessoas; a IA pode, no máximo, organizar evidências.',
        options: [
          { label: 'Verdadeiro', isCorrect: false },
          { label: 'Falso', isCorrect: true },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Qual destes é um critério de avaliação observável?',
        competencyKey: 'ai_recruitment',
        explanation: 'Critérios observáveis descrevem comportamentos verificáveis, não impressões vagas.',
        options: [
          { label: '"Tem boa energia."', isCorrect: false },
          { label: '"Parece se encaixar na cultura."', isCorrect: false },
          { label: '"Explica uma análise técnica a um público não técnico com um exemplo concreto."', isCorrect: true },
          { label: '"Tem boa aparência."', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Quais elementos devem ser definidos para cada etapa de um fluxo assistido por IA? (selecione todos os corretos)',
        competencyKey: 'workflow_design',
        explanation: 'Entrada, papel da IA, controle humano, saída e riscos compõem um fluxo bem desenhado.',
        options: [
          { label: 'Ponto de controle humano.', isCorrect: true },
          { label: 'Papel da IA na etapa.', isCorrect: true },
          { label: 'Riscos e cuidados.', isCorrect: true },
          { label: 'Garantia de que a IA nunca erra.', isCorrect: false },
        ],
      },
    ],
  },
};
