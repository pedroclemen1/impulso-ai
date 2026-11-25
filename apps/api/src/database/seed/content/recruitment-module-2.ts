import type { SeedModule } from './types';

export const recruitmentModule2: SeedModule = {
  title: 'Engenharia de prompts',
  description:
    'Aprenda a estruturar instruções claras para a IA: contexto, objetivo, restrições, exemplos e formato de saída — e a refinar o resultado de forma iterativa.',
  objectives: [
    'Identificar os elementos de um prompt bem estruturado.',
    'Contextualizar pedidos com informações relevantes e sem dados pessoais.',
    'Usar restrições, exemplos e formatos de saída para controlar o resultado.',
    'Refinar prompts de forma iterativa a partir das respostas recebidas.',
  ],
  lessons: [
    {
      title: 'Estrutura de um prompt: contexto e objetivo',
      summary: 'Os elementos de um bom prompt e por que contexto e objetivo claros fazem tanta diferença.',
      estimatedMinutes: 20,
      learnContent: `## O que é um prompt

**Prompt** é a instrução que você envia para uma ferramenta de IA. Como vimos no módulo anterior, o modelo responde com base **apenas** no que recebe. Um prompt bem construído reduz ambiguidades e aproxima o resultado do que você precisa.

## Os elementos de um bom prompt

Uma estrutura prática, fácil de lembrar, tem seis elementos:

| Elemento | Pergunta que responde | Exemplo |
|---|---|---|
| **Papel** | Quem a IA deve "ser"? | "Atue como especialista em recrutamento de tecnologia." |
| **Contexto** | Qual é a situação? | "Empresa de logística de médio porte, time de dados em expansão." |
| **Objetivo** | O que exatamente você quer? | "Criar uma descrição de vaga para atrair candidatos." |
| **Restrições** | O que deve ou não ser feito? | "Até 300 palavras; linguagem inclusiva; sem jargões." |
| **Exemplos** | Há um modelo a seguir? | "Siga o tom deste anúncio anterior: ..." |
| **Formato de saída** | Como a resposta deve vir? | "Em tópicos: Sobre a empresa, Responsabilidades, Requisitos." |

Nem todo prompt precisa dos seis elementos. Mas **contexto** e **objetivo** quase sempre fazem diferença.

## Contextualização

Contexto é tudo aquilo que a IA não tem como adivinhar:

- segmento e porte da empresa;
- nível de senioridade da vaga;
- tecnologias, ferramentas ou processos envolvidos;
- público que vai ler o texto;
- cultura e tom de comunicação da empresa.

**Atenção:** contexto **não** significa dados pessoais. Para obter uma boa descrição de vaga, você não precisa — e não deve — inserir nomes, CPF ou currículos de pessoas reais.

## Definição de objetivos

Um objetivo vago ("fale sobre a vaga") gera um texto vago. Um objetivo claro indica **o que** deve ser produzido e **para quê**:

- "Criar uma descrição de vaga" → produto.
- "...que atraia pessoas desenvolvedoras com experiência em sistemas de rastreamento" → finalidade.
- "...e deixe claro o modelo de trabalho híbrido" → informação obrigatória.

## Uma fórmula para começar

> **[Papel] + [Contexto] + [Objetivo] + [Restrições] + [Formato]**

Use a fórmula como ponto de partida, não como regra rígida. O mais importante é perguntar: **"Se eu entregasse este pedido a uma pessoa competente que não conhece minha empresa, ela teria o que precisa?"**`,
      beginnerSupport: `### Um prompt é como um briefing

Quando um gestor pede "preciso de alguém para o time", você faz várias perguntas antes de abrir a vaga: qual cargo, qual nível, quais habilidades, qual salário, presencial ou remoto?

Com a IA é igual — só que **ela não faz essas perguntas sozinha**. Você precisa antecipá-las.

Antes de escrever um prompt, responda mentalmente:
1. **O que** eu quero que seja produzido?
2. **Para quem** é esse conteúdo?
3. **O que** a IA precisa saber sobre a situação?
4. **Como** quero receber a resposta?

Se você responder a essas quatro perguntas no seu pedido, já estará escrevendo prompts melhores do que a maioria das pessoas.`,
      advancedDeepDive: `### Aprofundamento: instruções de sistema e separação de dados

Em ferramentas e APIs, é comum separar:

- **instrução de sistema** (regras permanentes: papel, tom, restrições éticas);
- **instrução do usuário** (a tarefa específica);
- **dados de entrada** (o material a ser processado).

Uma boa prática é **delimitar claramente os dados**, por exemplo entre marcadores como "### ANOTAÇÕES DO GESTOR ###". Isso reduz o risco de o modelo confundir dados com instruções — inclusive de textos que contenham comandos maliciosos (*prompt injection*).

Outras técnicas úteis:
- **Decomposição**: dividir tarefas complexas em etapas (primeiro extrair requisitos, depois redigir).
- **Prompts reutilizáveis**: criar modelos padronizados com campos variáveis para o time, garantindo consistência e facilitando auditoria.
- **Critérios de qualidade explícitos**: informar ao modelo como o resultado será avaliado ("o texto deve permitir que o candidato entenda o dia a dia do cargo").`,
      contextContent: `### Antes e depois

**Prompt fraco:**

~~~
Faça um anúncio de vaga de analista de RH.
~~~

**Por que é fraco:** não informa nível, contexto da empresa, foco do cargo, tom nem formato.

**Prompt estruturado:**

~~~
Papel: atue como especialista em employer branding.
Contexto: somos uma rede fictícia de clínicas odontológicas com
40 unidades no Sul do Brasil, em fase de expansão.
Objetivo: criar um anúncio para Analista de RH Pleno, focado em
recrutamento de profissionais de saúde e integração de novos
colaboradores.
Restrições: até 250 palavras; linguagem inclusiva; não mencionar
idade, gênero ou aparência; não inventar benefícios.
Formato: título, parágrafo de abertura, "O que você vai fazer"
(5 tópicos), "O que buscamos" (5 tópicos) e chamada final.
~~~

**Resultado esperado:** um anúncio com seções claras, coerente com o setor de saúde e sem exigências discriminatórias.

Observe a restrição "não inventar benefícios": como a IA pode alucinar, você deixa claro que benefícios só devem aparecer se forem informados — e os adiciona você mesmo depois de confirmar com a empresa.`,
      reflectionPrompt:
        'Pegue um pedido que você faria a uma IA no seu trabalho. Quais dos seis elementos (papel, contexto, objetivo, restrições, exemplos, formato) estariam faltando?',
      keyTakeaways: [
        'Um bom prompt combina papel, contexto, objetivo, restrições, exemplos e formato.',
        'Contexto e objetivo claros são os elementos de maior impacto.',
        'Contexto profissional não exige dados pessoais de candidatos.',
        'Pense no prompt como um briefing para alguém que não conhece sua empresa.',
      ],
      competencies: [{ key: 'prompt_engineering', weight: 2 }],
    },
    {
      title: 'Restrições, exemplos e formatos de saída',
      summary: 'Como controlar tamanho, tom, conteúdo e estrutura da resposta.',
      estimatedMinutes: 20,
      learnContent: `## Restrições: o que deve (e não deve) acontecer

Restrições delimitam o espaço de resposta. Elas podem tratar de:

- **Tamanho**: "até 200 palavras", "no máximo 6 perguntas".
- **Tom**: "acolhedor e profissional", "direto, sem jargões".
- **Conteúdo proibido**: "não mencione idade, gênero, estado civil ou aparência".
- **Fidelidade às fontes**: "use apenas as informações fornecidas; se faltar algo, escreva 'a confirmar'".
- **Público**: "o texto será lido por candidatos sem formação técnica".

Restrições de fidelidade são especialmente valiosas em recrutamento, porque reduzem a chance de a IA inventar requisitos, benefícios ou dados.

## Exemplos: mostrar em vez de explicar

Quando você quer um estilo específico, mostrar um exemplo costuma funcionar melhor do que descrever. Essa técnica é chamada de *few-shot prompting* (prompt com poucos exemplos).

~~~
Escreva mensagens de convite para entrevista seguindo o estilo
do exemplo abaixo.

Exemplo:
"Olá, [nome]! Gostamos muito do seu perfil para a vaga de
[cargo]. Que tal conversarmos? Temos horários em [datas]."
~~~

Cuidados:
- use exemplos **fictícios** ou anonimizados;
- o modelo tende a copiar o padrão do exemplo — inclusive seus defeitos.

## Formatos de saída

Pedir um formato facilita revisar e reutilizar o resultado:

| Formato | Quando usar |
|---|---|
| Tópicos | Listas de requisitos, responsabilidades |
| Tabela | Comparações, critérios de avaliação, matriz de competências |
| Seções com títulos | Anúncios de vaga, relatórios |
| Texto corrido curto | E-mails e mensagens |
| Estrutura padronizada (ex.: JSON) | Integração com sistemas e planilhas |

Exemplo:

~~~
Apresente o resultado em uma tabela com as colunas:
Competência | Pergunta de entrevista | O que observar na resposta.
~~~

## Combinando tudo

Restrições, exemplos e formato trabalham juntos. Um prompt com contexto rico, mas sem formato, pode gerar um texto difícil de revisar. Um prompt com formato perfeito, mas sem restrições, pode gerar conteúdo inadequado. O equilíbrio vem com a prática — e com o refinamento, que veremos na próxima aula.`,
      beginnerSupport: `### Restrições são como as regras de um jogo

Se você pedir a uma pessoa "escreva um texto sobre a vaga", ela pode escrever uma página inteira, em qualquer tom. Se você disser "escreva **um parágrafo**, em **tom acolhedor**, **sem mencionar salário**", ela sabe exatamente o que fazer.

Três restrições que valem quase sempre em recrutamento:
1. **Tamanho** — quanto texto você quer.
2. **Tom** — como o texto deve soar.
3. **"Não invente"** — peça para a IA usar apenas as informações que você deu.

E se você tem um texto de que gosta, **mostre como exemplo**: a IA aprende o estilo rapidamente.`,
      advancedDeepDive: `### Aprofundamento: saídas estruturadas e validação

Em integrações (por exemplo, enviar critérios de avaliação para uma planilha ou sistema), é comum pedir saídas em **JSON** com campos definidos. Boas práticas:

- descreva o esquema esperado (campos, tipos, valores permitidos);
- peça que campos desconhecidos fiquem vazios em vez de inventados;
- **valide** a saída automaticamente antes de usá-la — modelos podem omitir campos ou mudar nomes;
- tenha uma estratégia de nova tentativa limitada em caso de saída inválida.

Sobre exemplos (*few-shot*): variar os exemplos evita que o modelo copie detalhes irrelevantes. Exemplos enviesados (ex.: todos os candidatos-modelo com o mesmo perfil demográfico) **transmitem viés** para a saída. Prefira exemplos neutros e focados em comportamento e competências.`,
      contextContent: `### Um roteiro de entrevista bem formatado

**Prompt:**

~~~
Contexto: vaga fictícia de Analista de Atendimento ao Cliente
Júnior em uma empresa de telecomunicações; atendimento por chat
e telefone, metas de satisfação do cliente.
Objetivo: montar um roteiro de entrevista comportamental.
Restrições: 5 perguntas; foco em comunicação, empatia e resolução
de problemas; nenhuma pergunta sobre vida pessoal, idade, família
ou religião.
Formato: tabela com as colunas Competência | Pergunta |
Sinais de uma boa resposta.
~~~

**Trecho de resultado esperado:**

| Competência | Pergunta | Sinais de uma boa resposta |
|---|---|---|
| Empatia | Conte sobre uma vez em que um cliente estava muito insatisfeito. Como você conduziu a conversa? | Descreve escuta ativa, reconhece a emoção do cliente, apresenta solução concreta |
| Resolução de problemas | Descreva um problema que você resolveu sem ter todas as informações. | Explica como buscou informações, priorizou e verificou o resultado |

O formato em tabela permite que o gestor use o roteiro direto na entrevista — e a restrição sobre vida pessoal protege o processo contra perguntas inadequadas.`,
      reflectionPrompt:
        'Qual restrição você considera indispensável incluir em prompts relacionados a candidatos? Por quê?',
      keyTakeaways: [
        'Restrições controlam tamanho, tom, conteúdo e fidelidade às fontes.',
        'Exemplos ensinam estilo, mas também podem transmitir defeitos e vieses.',
        'Formatos de saída facilitam a revisão e a reutilização.',
        'Peça explicitamente que a IA não invente informações.',
      ],
      competencies: [{ key: 'prompt_engineering', weight: 2 }, { key: 'responsible_ai', weight: 1 }],
    },
    {
      title: 'Refinamento iterativo',
      summary: 'Raramente o primeiro prompt é o melhor. Aprenda a avaliar o resultado e ajustar o pedido.',
      estimatedMinutes: 25,
      learnContent: `## O primeiro resultado é um rascunho

Usar IA bem é um processo de **conversa e ajuste**. O ciclo de refinamento tem quatro passos:

1. **Pedir** — escrever o prompt inicial.
2. **Avaliar** — comparar o resultado com o que você precisa.
3. **Diagnosticar** — identificar o que faltou no pedido (contexto, restrição, formato?).
4. **Ajustar** — reescrever o prompt ou pedir mudanças específicas.

## Como avaliar uma resposta

Faça a si mesmo perguntas objetivas:

- O resultado atende ao **objetivo**?
- Há informações **inventadas** ou que eu não forneci?
- O **tom** está adequado ao público?
- O **formato** facilita o uso?
- Há linguagem **excludente** ou exigências desnecessárias?

## Tipos de ajuste

| Problema observado | Ajuste no prompt |
|---|---|
| Texto genérico | Acrescentar contexto específico |
| Texto longo demais | Definir limite de palavras ou tópicos |
| Tom inadequado | Descrever o tom e dar um exemplo |
| Requisitos inventados | "Use apenas as informações abaixo" |
| Difícil de revisar | Pedir formato em tabela ou seções |
| Linguagem excludente | "Revise para linguagem inclusiva e neutra" |

## Ajuste pontual versus reescrita

- **Ajuste pontual**: "Mantenha tudo, mas reduza os requisitos para os 5 essenciais." Bom quando o resultado está quase lá.
- **Reescrita do prompt**: quando a base está errada, recomece com um prompt melhor estruturado. Isso também gera um modelo reutilizável para próximas vagas.

## Peça ajuda à própria IA — com critério

Você pode pedir: "Que informações adicionais você precisaria para melhorar este texto?". A IA costuma listar lacunas úteis. Mas **quem decide** quais informações são verdadeiras e relevantes é você.

## Documente o que funciona

Quando chegar a um bom prompt, salve-o como **modelo** para o time, com campos a preencher. Isso aumenta a consistência e facilita a revisão de qualidade e de riscos.`,
      beginnerSupport: `### Como ajustar uma receita

Quando você testa uma receita nova e o bolo fica seco, você não desiste de cozinhar: na próxima vez, ajusta o tempo de forno ou a quantidade de líquido.

Com a IA é igual. Se a resposta não ficou boa:
1. Descubra **o que** não ficou bom (muito longo? genérico? tom errado?).
2. Diga isso à IA de forma específica: "Está longo demais; resuma em 5 tópicos."
3. Compare a nova versão com a anterior.

Evite pedidos vagos como "melhore isso". Prefira dizer **o que** melhorar e **como**.`,
      advancedDeepDive: `### Aprofundamento: avaliação sistemática de prompts

Para prompts que serão usados repetidamente pelo time, vale tratar o refinamento como um pequeno projeto de qualidade:

- **Conjunto de testes**: separe 3 a 5 vagas fictícias representativas e rode o prompt em todas.
- **Critérios de aceitação**: defina previamente o que é um bom resultado (ex.: nenhuma exigência discriminatória, requisitos fiéis ao briefing, até 300 palavras).
- **Comparação de versões**: altere uma variável por vez (contexto, exemplo, formato) para entender o efeito de cada mudança.
- **Registro de versões**: mantenha histórico do prompt e das mudanças, como faria com um documento oficial.

Essa abordagem reduz a dependência de "acertos de sorte" e torna o uso de IA auditável — um ponto importante em processos seletivos.`,
      contextContent: `### Um ciclo de refinamento real (fictício)

**Versão 1:**

~~~
Crie uma descrição de vaga para desenvolvedor.
~~~

*Problema:* texto genérico, sem senioridade, sem tecnologias, com benefícios inventados.

**Versão 2:**

~~~
Crie uma descrição de vaga de Desenvolvedor(a) Back-end Pleno
para uma fintech fictícia, trabalhando com Java e microsserviços,
modelo híbrido em São Paulo.
~~~

*Problema:* melhor, mas longa, com 15 requisitos e linguagem pouco inclusiva ("o desenvolvedor ideal").

**Versão 3 (ajuste pontual):**

~~~
Mantenha o conteúdo, mas: limite a 6 requisitos essenciais e
3 desejáveis; use linguagem neutra em gênero; não inclua
benefícios (vou adicioná-los depois); organize em seções:
Sobre o time, Responsabilidades, Requisitos, Diferenciais.
~~~

*Resultado:* texto enxuto, estruturado, inclusivo e fiel às informações fornecidas.

Em três iterações, o recrutador passou de um texto inutilizável para um rascunho pronto para revisão do gestor.`,
      reflectionPrompt:
        'Quando você recebe uma resposta ruim de uma IA, qual é o seu primeiro impulso? Como o ciclo pedir–avaliar–diagnosticar–ajustar mudaria essa reação?',
      keyTakeaways: [
        'O primeiro resultado é um rascunho; o refinamento faz parte do processo.',
        'Diagnostique o que faltou no pedido antes de ajustar.',
        'Ajustes específicos funcionam melhor do que "melhore isso".',
        'Bons prompts devem virar modelos reutilizáveis para o time.',
      ],
      competencies: [{ key: 'prompt_engineering', weight: 2 }, { key: 'critical_thinking', weight: 1 }],
      activity: {
        type: 'PROMPT_EXERCISE',
        title: 'Melhore um prompt genérico de descrição de vaga',
        instructions: `Um recrutador precisa utilizar IA para elaborar a descrição de uma vaga de desenvolvedor de software. O prompt inicial dele foi:

> "Crie uma descrição de vaga para desenvolvedor."

**Sua tarefa:** reescreva esse prompt usando as informações do cenário, de modo que a IA consiga gerar uma descrição de vaga adequada.

Depois do prompt, explique em 2 ou 3 frases **por que** a sua versão é melhor do que a original.`,
        scenario: `**Informações levantadas com a gestora (empresa fictícia NovaRota Mobilidade)**

- Empresa de tecnologia para gestão de frotas, com cerca de 300 colaboradores.
- Vaga: Desenvolvedor(a) Front-end **Pleno**.
- Tecnologias: React, TypeScript e testes automatizados; desejável experiência com mapas e geolocalização.
- Time de 6 pessoas, trabalho em squads com metodologia ágil.
- Modelo de trabalho: híbrido, 2 dias por semana no escritório em Belo Horizonte.
- A gestora quer atrair mais diversidade para o time e pediu um texto acolhedor.
- Os benefícios ainda serão confirmados pelo RH.

*Não inclua dados pessoais de pessoas reais no seu prompt.*`,
        guidedSteps: [
          'Defina o papel que a IA deve assumir (ex.: especialista em recrutamento de tecnologia).',
          'Inclua o contexto da empresa e da vaga: senioridade, tecnologias, time e modelo de trabalho.',
          'Deixe claro o objetivo do texto e o público que vai lê-lo.',
          'Acrescente restrições: tamanho, linguagem inclusiva, não inventar benefícios.',
          'Indique o formato de saída desejado (seções da descrição).',
        ],
        advancedChallenge:
          'Transforme seu prompt em um modelo reutilizável para o time, com campos variáveis entre colchetes (ex.: [CARGO], [SENIORIDADE]), e inclua uma instrução para que a IA liste, ao final, as informações que ficaram faltando.',
        socraticQuestions: [
          'Imagine que a IA receba apenas a instrução original: como ela saberá o nível de senioridade, as tecnologias utilizadas e o contexto da empresa?',
          'Quais informações adicionais poderiam tornar sua solicitação mais precisa?',
          'Como você garantiria que a IA não invente benefícios que a empresa não oferece?',
          'De que forma o pedido da gestora por mais diversidade pode aparecer no seu prompt?',
        ],
        hints: [
          'Compare o prompt original com as informações do cenário: quais delas a IA não teria como adivinhar?',
          'Use a fórmula Papel + Contexto + Objetivo + Restrições + Formato. Senioridade, tecnologias e modelo híbrido são contexto essencial.',
          'Inclua restrições como "linguagem inclusiva e neutra em gênero", "até 300 palavras" e "não mencione benefícios — serão adicionados depois", e peça seções como Sobre o time, Responsabilidades, Requisitos e Diferenciais.',
        ],
        modelAnswer: `**Prompt de referência:**

~~~
Atue como especialista em recrutamento de tecnologia e employer
branding.

Contexto: a NovaRota Mobilidade (empresa fictícia) desenvolve
soluções de gestão de frotas e tem cerca de 300 colaboradores.
Estamos contratando uma pessoa Desenvolvedora Front-end Pleno para
um squad de 6 pessoas que trabalha com metodologia ágil. Stack:
React, TypeScript e testes automatizados; experiência com mapas e
geolocalização é desejável. Modelo híbrido: 2 dias por semana no
escritório em Belo Horizonte.

Objetivo: escrever uma descrição de vaga acolhedora que atraia
profissionais diversos e deixe claro o dia a dia do cargo.

Restrições: até 300 palavras; linguagem inclusiva e neutra em
gênero; separar requisitos obrigatórios e desejáveis (no máximo 5
de cada); não mencionar benefícios nem salário (serão incluídos
pelo RH); não inventar informações que não estejam acima.

Formato: Título, Sobre a NovaRota, Sobre o time, O que você vai
fazer, Requisitos, Diferenciais, Convite final incentivando
candidaturas de grupos sub-representados.
~~~

**Por que é melhor:** o prompt fornece senioridade, tecnologias, contexto do time e modelo de trabalho — informações que a IA não poderia adivinhar. As restrições evitam benefícios inventados e linguagem excludente, e o formato facilita a revisão pela gestora.

*Observação:* o resultado ainda deve ser revisado com a gestora antes da publicação.`,
        maxAttempts: 4,
        passingScore: 70,
        rubric: {
          title: 'Rubrica — Engenharia de prompts para descrição de vaga',
          description: 'Avalia a qualidade estrutural do prompt e a consciência sobre riscos.',
          criteria: [
            {
              key: 'contextualizacao',
              name: 'Contextualização',
              description: 'O prompt fornece o contexto necessário sobre empresa, vaga e time.',
              weight: 3,
              indicators: [
                'Informa senioridade e tecnologias',
                'Descreve empresa, time e modelo de trabalho',
                'Indica o público do texto',
              ],
            },
            {
              key: 'qualidade_solucao',
              name: 'Qualidade da solução',
              description: 'O prompt define objetivo, restrições e formato de saída.',
              weight: 3,
              indicators: [
                'Objetivo claro do texto',
                'Restrições de tamanho e conteúdo',
                'Formato de saída estruturado',
              ],
            },
            {
              key: 'uso_responsavel',
              name: 'Uso responsável de IA',
              description: 'Considera linguagem inclusiva e evita informações inventadas.',
              weight: 2,
              indicators: [
                'Pede linguagem inclusiva',
                'Instrui a não inventar benefícios ou dados',
                'Não usa dados pessoais reais',
              ],
            },
            {
              key: 'clareza',
              name: 'Clareza',
              description: 'Prompt e justificativa são claros e bem organizados.',
              weight: 1,
              indicators: ['Instruções sem ambiguidade', 'Justificativa coerente com as mudanças feitas'],
            },
          ],
        },
        expectedKeywords: [
          'pleno',
          'senioridade',
          'react',
          'typescript',
          'contexto',
          'híbrido',
          'hibrido',
          'formato',
          'palavras',
          'inclusiva',
          'benefícios',
          'beneficios',
          'restri',
          'seções',
          'time',
        ],
      },
    },
  ],
  quiz: {
    kind: 'MODULE_QUIZ',
    title: 'Avaliação do módulo 2 — Engenharia de prompts',
    description: 'Verifique sua compreensão sobre estrutura, restrições, formatos e refinamento de prompts.',
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Quais elementos ajudam a tornar um prompt mais preciso? (selecione todos os corretos)',
        competencyKey: 'prompt_engineering',
        explanation: 'Contexto, objetivo, restrições e formato de saída reduzem ambiguidades. Dados pessoais de candidatos não são necessários.',
        options: [
          { label: 'Contexto da empresa e da vaga.', isCorrect: true },
          { label: 'Objetivo claro do resultado.', isCorrect: true },
          { label: 'CPF e currículo completo de um candidato real.', isCorrect: false },
          { label: 'Formato de saída desejado.', isCorrect: true },
        ],
      },
      {
        type: 'SCENARIO',
        prompt:
          'Você pediu à IA uma descrição de vaga e ela incluiu benefícios que a empresa não oferece. Qual é o melhor ajuste no prompt?',
        competencyKey: 'prompt_engineering',
        explanation: 'Restrições de fidelidade ("use apenas as informações fornecidas") reduzem conteúdo inventado.',
        options: [
          { label: 'Pedir "melhore o texto".', isCorrect: false, score: 10 },
          {
            label: 'Acrescentar: "Use apenas as informações fornecidas; não mencione benefícios — serão incluídos pelo RH."',
            isCorrect: true,
            score: 100,
          },
          { label: 'Aumentar o tamanho máximo do texto.', isCorrect: false, score: 0 },
          { label: 'Apagar os benefícios manualmente e não alterar o prompt.', isCorrect: false, score: 40 },
        ],
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'Exemplos incluídos no prompt (few-shot) podem transmitir vieses para o resultado gerado.',
        competencyKey: 'responsible_ai',
        explanation: 'O modelo tende a reproduzir padrões dos exemplos — inclusive vieses. Use exemplos neutros e fictícios.',
        options: [
          { label: 'Verdadeiro', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Qual pedido de ajuste é mais eficaz durante o refinamento iterativo?',
        competencyKey: 'prompt_engineering',
        explanation: 'Ajustes específicos indicam claramente o que mudar e como.',
        options: [
          { label: '"Ficou ruim, tente de novo."', isCorrect: false },
          { label: '"Melhore isso."', isCorrect: false },
          { label: '"Mantenha o conteúdo, mas reduza para 5 requisitos essenciais e use linguagem neutra em gênero."', isCorrect: true },
          { label: '"Escreva como um humano."', isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Para que o gestor use um roteiro de entrevista diretamente na conversa, qual formato de saída é mais útil?',
        competencyKey: 'prompt_engineering',
        explanation: 'Uma tabela com competência, pergunta e sinais de boa resposta facilita o uso e a padronização.',
        options: [
          { label: 'Um texto corrido longo.', isCorrect: false },
          { label: 'Uma tabela com Competência | Pergunta | Sinais de uma boa resposta.', isCorrect: true },
          { label: 'Uma lista de palavras-chave sem contexto.', isCorrect: false },
          { label: 'Um poema.', isCorrect: false },
        ],
      },
    ],
  },
};
