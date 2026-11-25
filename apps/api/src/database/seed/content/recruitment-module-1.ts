import type { SeedModule } from './types';

export const recruitmentModule1: SeedModule = {
  title: 'Fundamentos de inteligência artificial',
  description:
    'Entenda o que é inteligência artificial, o que torna a IA generativa diferente das ferramentas tradicionais e como os grandes modelos de linguagem (LLMs) produzem respostas — incluindo suas limitações.',
  objectives: [
    'Diferenciar inteligência artificial, aprendizado de máquina e IA generativa.',
    'Explicar, em linguagem simples, como um LLM gera texto.',
    'Reconhecer limitações e alucinações em respostas de IA.',
    'Identificar situações do recrutamento em que a IA pode ajudar.',
  ],
  lessons: [
    {
      title: 'O que é inteligência artificial e IA generativa',
      summary: 'Conceitos essenciais: IA, aprendizado de máquina, IA generativa e LLMs, com exemplos do dia a dia de RH.',
      estimatedMinutes: 20,
      learnContent: `## Inteligência artificial, sem mistério

**Inteligência artificial (IA)** é o campo da computação que desenvolve sistemas capazes de executar tarefas que normalmente associamos à inteligência humana: reconhecer padrões, interpretar linguagem, fazer previsões e tomar decisões dentro de um escopo definido.

A IA não é uma tecnologia única. É um guarda-chuva que reúne várias abordagens:

- **Sistemas baseados em regras**: seguem instruções explícitas escritas por pessoas ("se o candidato não tiver o requisito X, sinalize"). São previsíveis, mas rígidos.
- **Aprendizado de máquina (machine learning)**: o sistema aprende padrões a partir de exemplos, em vez de receber todas as regras prontas. Um filtro de spam é um exemplo clássico.
- **Aprendizado profundo (deep learning)**: um tipo de aprendizado de máquina que usa redes neurais com muitas camadas, capaz de lidar com imagens, áudio e texto.
- **IA generativa**: modelos que **criam conteúdo novo** — textos, imagens, resumos, código — a partir de uma instrução.

## O que é IA generativa

A IA generativa ficou popular com ferramentas como ChatGPT, Gemini e Claude. A diferença central em relação a sistemas anteriores é que ela não apenas **classifica** ou **prevê**, mas **produz** algo: um rascunho de e-mail, uma descrição de vaga, uma lista de perguntas de entrevista.

| Tipo de ferramenta | O que faz | Exemplo em RH |
|---|---|---|
| Regras | Aplica critérios fixos | Triagem por campos obrigatórios em um ATS |
| Aprendizado de máquina | Identifica padrões e faz previsões | Estimar tempo médio de fechamento de vagas |
| IA generativa | Cria conteúdo novo | Redigir uma descrição de vaga ou um roteiro de entrevista |

## O que são LLMs

**LLM** significa *Large Language Model* — grande modelo de linguagem. É um modelo treinado com enormes volumes de texto para aprender padrões da linguagem: vocabulário, gramática, estilos, relações entre ideias. Com isso, ele consegue continuar textos, responder perguntas, resumir e reescrever conteúdos.

Pontos importantes desde já:

1. Um LLM **não "sabe" as coisas como uma pessoa sabe**. Ele gera a sequência de palavras mais provável para o contexto recebido.
2. A qualidade da resposta depende muito da **qualidade da instrução** (o *prompt*).
3. O LLM pode produzir informações **plausíveis, mas incorretas**. Por isso, a revisão humana é indispensável.

## Por que isso importa para recrutadores

Recrutamento envolve muita produção e organização de texto: vagas, mensagens, roteiros, relatórios. A IA generativa pode acelerar essas tarefas — desde que o profissional saiba **orientar**, **revisar** e **decidir**. A IA é uma assistente; a responsabilidade pelas decisões continua sendo humana.`,
      beginnerSupport: `### Uma analogia para começar

Pense em um **estagiário muito rápido que leu milhões de textos**, mas que nunca trabalhou na sua empresa. Ele escreve bem e rápido, conhece muitos formatos de documento, mas:

- não conhece a cultura da sua empresa, a não ser que você conte;
- às vezes completa lacunas "chutando" com confiança;
- precisa que alguém revise o que ele entrega.

A IA generativa funciona de modo parecido. Quanto mais claro você for no pedido, melhor será o resultado — e você sempre deve conferir o trabalho antes de usá-lo.

**Glossário rápido:**
- **IA**: sistemas que realizam tarefas "inteligentes".
- **IA generativa**: IA que cria textos, imagens e outros conteúdos.
- **LLM**: o "motor" de texto por trás de ferramentas como ChatGPT, Gemini e Claude.
- **Prompt**: a instrução que você escreve para a IA.`,
      advancedDeepDive: `### Aprofundamento: modelos fundacionais e ajuste fino

Os LLMs atuais são chamados de **modelos fundacionais**: são pré-treinados em grandes bases de texto de forma genérica e depois ajustados (*fine-tuning*) para seguir instruções e conversar. Uma etapa comum é o ajuste com feedback humano (RLHF ou variações), que torna as respostas mais úteis e alinhadas a diretrizes de segurança.

Isso tem implicações práticas:

- O modelo pode ter **data de corte** de conhecimento: eventos e mudanças legais posteriores ao treinamento podem ser desconhecidos.
- Comportamentos "educados" e confiantes são, em parte, fruto do ajuste — **tom confiante não é sinônimo de correção**.
- Ferramentas corporativas podem combinar o LLM com buscas em documentos internos (técnica conhecida como RAG — geração aumentada por recuperação), reduzindo, mas não eliminando, respostas inventadas.

Para quem já usa IA com frequência, a pergunta-chave deixa de ser "o que a IA consegue fazer?" e passa a ser "**em que condições posso confiar neste resultado, e como verifico?**".`,
      contextContent: `### Como isso aparece no dia a dia de um recrutador

Imagine Marina, analista de recrutamento fictícia de uma empresa de varejo. Em uma semana típica, ela:

- abre 6 vagas novas e precisa redigir as descrições;
- envia dezenas de mensagens de retorno a candidatos;
- prepara roteiros de entrevista para gestores;
- consolida relatórios de andamento das vagas.

Veja onde cada tipo de tecnologia ajuda:

| Tarefa | Ferramenta adequada | Papel de Marina |
|---|---|---|
| Filtrar candidaturas sem documento obrigatório | Regras do ATS | Definir corretamente os critérios |
| Prever quais vagas devem atrasar | Aprendizado de máquina (se disponível) | Interpretar a previsão com cautela |
| Rascunhar a descrição de uma vaga | IA generativa | Fornecer contexto e revisar o texto |
| Decidir quem avança no processo | **Pessoa** | Decidir com base em critérios objetivos |

Note a última linha: **decidir quem é contratado não é tarefa para a IA**. A IA pode organizar informações e sugerir perguntas, mas a avaliação de pessoas exige julgamento humano, critérios transparentes e responsabilidade.

**Exemplo de uso adequado:**

~~~
Prompt: "Sou recrutadora em uma rede de varejo. Liste 5 tarefas
administrativas do recrutamento que eu poderia acelerar com uma
ferramenta de IA generativa, explicando o ganho e o cuidado
necessário em cada uma."
~~~

A resposta tende a trazer ideias como rascunho de e-mails e resumos de requisitos — e a parte "cuidado necessário" já estimula o uso crítico.`,
      reflectionPrompt:
        'Pense na sua rotina: quais tarefas envolvem principalmente produzir ou organizar texto? Quais delas envolvem decidir sobre pessoas e, portanto, devem permanecer sob responsabilidade humana?',
      keyTakeaways: [
        'IA é um campo amplo; a IA generativa é a parte que cria conteúdo novo.',
        'LLMs geram texto com base em padrões de linguagem, não em compreensão humana.',
        'A qualidade do resultado depende da qualidade da instrução (prompt).',
        'A decisão sobre pessoas continua sendo responsabilidade humana.',
      ],
      competencies: [{ key: 'ai_fundamentals', weight: 2 }],
    },
    {
      title: 'Como os modelos de linguagem funcionam',
      summary: 'Tokens, probabilidade, contexto e por que a mesma pergunta pode gerar respostas diferentes.',
      estimatedMinutes: 20,
      learnContent: `## Do texto aos tokens

Um LLM não lê palavras como nós. O texto é dividido em **tokens** — pedaços de palavras, palavras inteiras ou sinais de pontuação. "Recrutamento" pode virar dois ou três tokens, por exemplo.

O funcionamento básico é:

1. Você envia um texto (o prompt).
2. O modelo converte esse texto em tokens.
3. Com base em tudo o que aprendeu no treinamento, ele calcula **quais tokens são mais prováveis** em seguida.
4. Ele escolhe um token, adiciona ao texto e repete o processo até concluir a resposta.

Em outras palavras, um LLM é uma máquina muito sofisticada de **prever a continuação de um texto**.

## A janela de contexto

O modelo só "enxerga" o que está dentro da sua **janela de contexto**: o prompt atual, o histórico da conversa e eventuais documentos anexados, até um certo limite. Consequências práticas:

- Se uma informação importante não está no contexto, o modelo **não tem como usá-la** — e pode preencher a lacuna com algo genérico ou inventado.
- Em conversas muito longas, informações do início podem ser menos consideradas.
- Contexto bem organizado gera respostas melhores.

## Por que as respostas variam

A geração envolve uma dose controlada de aleatoriedade (parâmetro conhecido como **temperatura**). Por isso:

- A mesma pergunta pode gerar respostas diferentes.
- Temperaturas baixas tornam o texto mais previsível; altas, mais criativo.
- Isso é útil para criar alternativas, mas exige atenção quando você precisa de consistência.

## O que o modelo não faz

| Mito | Realidade |
|---|---|
| "A IA consulta a internet sempre" | Depende da ferramenta; muitos modelos respondem só com o que aprenderam no treinamento |
| "A IA entende o que eu quis dizer" | Ela interpreta o texto recebido; ambiguidades geram respostas ambíguas |
| "Se a resposta é fluente, está correta" | Fluência e correção são coisas diferentes |
| "A IA lembra de todas as conversas" | Normalmente só usa o que está na conversa atual (salvo recursos específicos de memória) |

## Implicação para o seu trabalho

Saber que o LLM **prevê texto a partir do contexto** muda a forma de usá-lo: em vez de fazer perguntas vagas e esperar uma resposta perfeita, você passa a **fornecer o contexto necessário** e a **verificar** o que recebeu.`,
      beginnerSupport: `### Pense no corretor automático do celular

Quando você digita "Bom", o teclado sugere "dia". Ele não sabe que horas são — apenas aprendeu que "Bom dia" é uma combinação comum.

Um LLM faz algo parecido, mas em escala gigantesca: em vez de sugerir uma palavra, ele constrói parágrafos inteiros, considerando tudo o que você escreveu antes.

Por isso:
- se você der **poucas informações**, ele vai completar com o que é "mais comum", e não com o que é certo para a sua empresa;
- se você der **informações claras**, a "continuação mais provável" fica muito mais próxima do que você precisa.

Guarde esta ideia: **a IA completa o texto com base no que você entrega a ela**.`,
      advancedDeepDive: `### Aprofundamento: parâmetros e limites técnicos

- **Temperatura e top-p** controlam a diversidade da amostragem. Para extrair dados estruturados (ex.: requisitos de uma vaga em tabela), valores baixos reduzem variações indesejadas.
- **Limite de tokens de saída**: respostas longas podem ser cortadas. Em tarefas extensas, divida o trabalho em etapas.
- **Janela de contexto**: modelos modernos aceitam contextos longos, mas pesquisas indicam que informações no meio de textos muito extensos podem ser menos aproveitadas. Coloque as instruções essenciais no início ou no fim.
- **Raciocínio passo a passo**: pedir que o modelo "explique o raciocínio" pode melhorar tarefas analíticas, mas a explicação gerada **não é garantia** de que o processo interno foi esse; trate-a como mais um texto a validar.
- **Custos**: em APIs, o custo costuma ser proporcional aos tokens de entrada e saída — prompts enxutos e bem estruturados também são mais econômicos.`,
      contextContent: `### O efeito do contexto, na prática

**Prompt sem contexto:**

~~~
Escreva perguntas para uma entrevista.
~~~

**Resultado típico:** perguntas genéricas, como "Fale sobre você" e "Quais são seus pontos fortes?". Úteis para qualquer vaga — e, por isso mesmo, pouco úteis para a sua.

**Prompt com contexto:**

~~~
Sou recrutador em uma empresa de logística fictícia. Preciso de
6 perguntas comportamentais para uma entrevista de Supervisor(a)
de Operações, com foco em gestão de equipes em turnos e resolução
de problemas sob pressão. Use o formato STAR e indique, para cada
pergunta, qual competência ela avalia.
~~~

**Resultado típico:** perguntas específicas sobre conflitos entre turnos, atrasos de entrega e decisões rápidas, já associadas a competências.

O modelo é o mesmo. O que mudou foi o **contexto** que ele recebeu. Repare também que nenhum dado pessoal de candidato foi necessário para obter um resultado útil.

**Teste de variação:** se você enviar o segundo prompt duas vezes, receberá listas parecidas, mas não idênticas. Isso é esperado — e você pode aproveitar para escolher as melhores perguntas de cada versão.`,
      reflectionPrompt:
        'Lembre-se de uma vez em que você (ou um colega) recebeu uma resposta genérica de uma ferramenta de IA. Que informação de contexto estava faltando no pedido?',
      keyTakeaways: [
        'LLMs geram texto prevendo os próximos tokens com base no contexto.',
        'O modelo só usa o que está na janela de contexto — informações ausentes viram lacunas.',
        'Respostas variam por causa da temperatura; isso pode ser útil ou um risco.',
        'Fluência não é sinônimo de correção.',
      ],
      competencies: [{ key: 'ai_fundamentals', weight: 2 }, { key: 'prompt_engineering', weight: 1 }],
    },
    {
      title: 'Limitações, alucinações e IA tradicional versus generativa',
      summary: 'Por que a IA inventa informações, como reconhecer esse risco e onde ela realmente ajuda o recrutador.',
      estimatedMinutes: 30,
      learnContent: `## O que é uma alucinação

**Alucinação** é quando um modelo de IA gera uma informação **falsa, inventada ou sem base**, apresentada com aparência de verdade. Exemplos comuns:

- citar uma pesquisa, lei ou estatística que não existe;
- atribuir a uma empresa benefícios que ela não oferece;
- "completar" dados de um candidato que não estavam no material fornecido.

Alucinações acontecem porque o modelo otimiza **plausibilidade linguística**, não verdade. Ele não tem, por padrão, um mecanismo de checagem de fatos.

## Outras limitações importantes

| Limitação | Exemplo em recrutamento | Como mitigar |
|---|---|---|
| Conhecimento desatualizado | Desconhecer mudanças recentes em legislação | Consultar fontes oficiais |
| Vieses aprendidos | Associar certas profissões a um gênero | Revisar linguagem e critérios |
| Falta de contexto local | Ignorar a política salarial da empresa | Fornecer o contexto no prompt |
| Excesso de confiança | Afirmar conclusões sobre um candidato sem evidência | Exigir evidências e revisar |
| Inconsistência | Respostas diferentes para a mesma pergunta | Padronizar prompts e revisar |

## IA tradicional versus IA generativa

| Aspecto | Ferramentas tradicionais | IA generativa |
|---|---|---|
| Resultado | Classificação, filtro, previsão | Texto, resumo, sugestão nova |
| Previsibilidade | Alta | Variável |
| Ponto forte | Consistência em regras bem definidas | Flexibilidade e rapidez na redação |
| Risco típico | Regras mal definidas excluírem pessoas | Informações inventadas e vieses no texto |
| Verificação | Auditar regras e dados | Revisar cada resultado antes de usar |

As duas abordagens podem coexistir: um ATS aplica regras objetivas; a IA generativa ajuda a redigir e organizar.

## Onde a IA ajuda o recrutador

A IA generativa costuma agregar valor em tarefas de **produção, organização e revisão de texto**:

- rascunhar descrições de vagas e anúncios;
- sugerir perguntas de entrevista alinhadas a competências;
- resumir requisitos levantados com o gestor;
- adaptar o tom de mensagens a candidatos;
- revisar textos em busca de linguagem excludente.

E deve ser usada com **muito cuidado ou evitada** em:

- decisões de aprovação ou reprovação de candidatos;
- inferências sobre características pessoais;
- tratamento de dados pessoais sem base legal e sem anonimização.

## Regra de ouro

> Use a IA para **acelerar o trabalho**, nunca para **terceirizar o julgamento**.`,
      beginnerSupport: `### Alucinação, em palavras simples

Imagine pedir a alguém muito falante que explique um assunto que conhece só "de ouvir falar". Em vez de dizer "não sei", a pessoa monta uma explicação convincente. Às vezes acerta; às vezes inventa.

A IA pode fazer o mesmo. Ela **não avisa** quando está inventando — por isso você precisa desconfiar especialmente de:

- números e estatísticas;
- nomes de leis, pesquisas e autores;
- afirmações sobre pessoas.

Um bom hábito: sempre que a resposta trouxer um dado importante, pergunte-se **"de onde veio isso e como eu confirmo?"**.`,
      advancedDeepDive: `### Aprofundamento: estratégias para reduzir alucinações

- **Ancoragem em fontes**: forneça o material de referência (ex.: requisitos aprovados pelo gestor) e instrua o modelo a usar **apenas** esse conteúdo, respondendo "não informado" quando faltar dado.
- **Permissão explícita para não saber**: incluir "se não tiver certeza, diga que não sabe" reduz respostas inventadas.
- **Pedido de evidências**: solicite que cada afirmação venha acompanhada do trecho do material que a sustenta.
- **Validação cruzada**: compare com fontes oficiais ou com uma segunda revisão humana; usar outro modelo como "revisor" pode ajudar, mas não substitui a verificação.
- **Avaliação sistemática**: em uso recorrente (ex.: um prompt padrão de descrição de vaga), mantenha um pequeno conjunto de casos de teste e revise periodicamente a qualidade das saídas.

Lembre-se: técnicas reduzem o risco, mas **não o eliminam**. Processos com IA precisam de pontos formais de revisão humana.`,
      contextContent: `### Um exemplo de alucinação em recrutamento

Um recrutador fictício pediu:

~~~
Qual é o salário médio de um Analista de Dados Pleno em Curitiba?
~~~

A ferramenta respondeu com um valor exato, citando "pesquisa salarial de 2024 da Associação Brasileira de Analistas". Ao checar, o recrutador não encontrou nenhuma associação com esse nome nem a pesquisa citada.

**O que deu errado?** O modelo produziu um texto plausível, com número e fonte, mas sem base verificável.

**Uso mais adequado:**

~~~
Quero montar uma faixa salarial para Analista de Dados Pleno.
Liste quais fontes confiáveis eu deveria consultar (pesquisas
salariais reconhecidas, dados internos, consultorias) e quais
fatores devem ser considerados na definição da faixa. Não invente
valores.
~~~

Aqui a IA ajuda a **organizar o raciocínio**, e o dado em si vem de fontes verificáveis.

### Situações favoráveis e desfavoráveis

- ✅ "Reescreva este anúncio de vaga com linguagem inclusiva."
- ✅ "Sugira perguntas de entrevista para avaliar comunicação com clientes."
- ⚠️ "Resuma estas anotações de entrevista" — útil, desde que os dados estejam anonimizados e o resumo seja revisado.
- ❌ "Diga qual destes candidatos devo contratar."`,
      reflectionPrompt:
        'Que tipo de informação, no seu trabalho, seria mais perigosa se fosse inventada pela IA? Que verificação você faria antes de usá-la?',
      keyTakeaways: [
        'Alucinações são informações inventadas apresentadas com aparência de verdade.',
        'Números, leis, fontes e afirmações sobre pessoas exigem verificação.',
        'Ferramentas tradicionais e generativas têm forças e riscos diferentes.',
        'A IA acelera tarefas de texto; o julgamento sobre pessoas é humano.',
      ],
      competencies: [
        { key: 'ai_fundamentals', weight: 1 },
        { key: 'critical_thinking', weight: 2 },
        { key: 'ai_recruitment', weight: 1 },
      ],
      resources: [
        {
          label: 'ANPD — Autoridade Nacional de Proteção de Dados',
          url: 'https://www.gov.br/anpd/pt-br',
        },
      ],
      activity: {
        type: 'OPEN_RESPONSE',
        title: 'Onde a IA pode ajudar um recrutador?',
        instructions: `Analise a rotina fictícia descrita no cenário e identifique **pelo menos três situações** em que a IA generativa poderia auxiliar o recrutador.

Para cada situação, explique:
1. **o que** a IA faria;
2. **qual ganho** isso traria;
3. **qual cuidado ou revisão humana** seria necessário.

Indique também **pelo menos uma tarefa** da rotina que **não** deveria ser delegada à IA e justifique.`,
        scenario: `**Rotina de Rafael, recrutador da empresa fictícia Aurora Alimentos**

Rafael é responsável por 8 vagas simultâneas, de auxiliar de produção a coordenador de qualidade. Em uma semana típica ele:

- recebe do gestor anotações soltas sobre o perfil de cada vaga e precisa transformá-las em descrições de vaga;
- responde perguntas frequentes de candidatos sobre etapas do processo, benefícios e horários;
- prepara roteiros de entrevista para os gestores, que reclamam que as entrevistas "não seguem padrão";
- envia retornos para candidatos não aprovados — muitas vezes atrasados por falta de tempo;
- consolida, toda sexta-feira, um relatório com o status de cada vaga para a diretoria;
- decide, junto com os gestores, quais finalistas recebem proposta.

*Todos os dados são fictícios. Ao praticar com ferramentas reais, nunca insira nomes, CPFs ou currículos de candidatos reais.*`,
        guidedSteps: [
          'Liste todas as tarefas da rotina de Rafael.',
          'Marque quais envolvem principalmente produzir ou organizar texto.',
          'Para cada tarefa marcada, descreva o que a IA faria e o ganho esperado.',
          'Pense em qual revisão humana seria necessária em cada caso.',
          'Identifique a tarefa que envolve decidir sobre pessoas e explique por que ela deve ficar com humanos.',
        ],
        advancedChallenge:
          'Proponha um indicador simples para medir se o uso de IA realmente trouxe ganho em uma das situações (ex.: tempo médio de resposta a candidatos) e um risco que precisaria ser monitorado.',
        socraticQuestions: [
          'Das tarefas que você escolheu, qual delas teria o maior impacto na experiência do candidato?',
          'O que poderia dar errado se o texto gerado pela IA fosse enviado sem revisão?',
          'Por que a decisão sobre os finalistas é diferente das demais tarefas?',
          'Que informações você precisaria fornecer à IA para que o resultado fosse realmente útil?',
        ],
        hints: [
          'Observe quais tarefas consomem tempo com escrita repetitiva.',
          'As descrições de vaga, as respostas a perguntas frequentes, os roteiros de entrevista e os retornos são bons candidatos — mas cada um exige um cuidado diferente.',
          'Para cada situação, use a estrutura: "A IA faria X; o ganho seria Y; eu revisaria Z". Lembre que a decisão sobre finalistas envolve julgamento sobre pessoas.',
        ],
        modelAnswer: `**Resposta comentada (uma das possíveis):**

1. **Descrições de vaga** — A IA transforma as anotações do gestor em um rascunho estruturado (responsabilidades, requisitos, benefícios). *Ganho:* economia de tempo e padronização. *Cuidado:* validar requisitos com o gestor, remover exigências desnecessárias e revisar linguagem inclusiva.

2. **Perguntas frequentes de candidatos** — A IA ajuda a redigir respostas-modelo claras sobre etapas, horários e benefícios. *Ganho:* respostas mais rápidas e consistentes. *Cuidado:* conferir se as informações correspondem à política real da empresa (a IA pode inventar benefícios).

3. **Roteiros de entrevista** — A IA sugere perguntas comportamentais associadas a competências. *Ganho:* entrevistas mais padronizadas e justas. *Cuidado:* revisar se as perguntas são relevantes para o cargo e não invadem a vida pessoal.

4. **Retornos a candidatos** — A IA cria modelos de mensagem respeitosos. *Ganho:* reduzir atrasos. *Cuidado:* personalizar sem expor dados e revisar o tom.

**Tarefa que não deve ser delegada:** a escolha dos finalistas que recebem proposta. Ela envolve julgamento sobre pessoas, critérios do negócio e responsabilidade legal e ética. A IA pode, no máximo, ajudar a organizar evidências já anonimizadas — a decisão é humana.

*Por que esta resposta é boa:* ela é específica, conecta cada uso a um ganho concreto e sempre indica a revisão necessária.`,
        maxAttempts: 4,
        passingScore: 65,
        rubric: {
          title: 'Rubrica — Oportunidades de uso da IA no recrutamento',
          description: 'Avalia a identificação de usos adequados da IA e a consciência sobre seus limites.',
          criteria: [
            {
              key: 'compreensao_conceitual',
              name: 'Compreensão conceitual',
              description: 'Demonstra entender o que a IA generativa faz bem e onde falha.',
              weight: 2,
              indicators: [
                'Associa a IA a tarefas de produção e organização de texto',
                'Reconhece limitações como alucinações',
              ],
            },
            {
              key: 'contextualizacao',
              name: 'Contextualização profissional',
              description: 'Relaciona os usos à rotina descrita no cenário.',
              weight: 2,
              indicators: [
                'Cita tarefas concretas da rotina de Rafael',
                'Explica o ganho para o recrutador ou para o candidato',
              ],
            },
            {
              key: 'pensamento_critico',
              name: 'Pensamento crítico',
              description: 'Indica revisões humanas necessárias e riscos.',
              weight: 2,
              indicators: [
                'Descreve um cuidado específico para cada uso',
                'Identifica a decisão sobre pessoas como tarefa humana',
              ],
            },
            {
              key: 'clareza',
              name: 'Clareza da resposta',
              description: 'Organiza a resposta de forma compreensível.',
              weight: 1,
              indicators: ['Estrutura a resposta por situação', 'Usa linguagem objetiva'],
            },
          ],
        },
        expectedKeywords: [
          'descrição',
          'descricao',
          'vaga',
          'roteiro',
          'entrevista',
          'retorno',
          'revis',
          'humana',
          'decis',
          'ganho',
          'tempo',
          'alucina',
          'gestor',
        ],
      },
    },
  ],
  quiz: {
    kind: 'MODULE_QUIZ',
    title: 'Avaliação do módulo 1 — Fundamentos de IA',
    description: 'Verifique sua compreensão sobre IA, IA generativa, LLMs e suas limitações.',
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      {
        type: 'SINGLE_CHOICE',
        prompt: 'O que melhor descreve a IA generativa?',
        competencyKey: 'ai_fundamentals',
        explanation: 'A IA generativa se diferencia por criar conteúdo novo (textos, imagens, resumos) a partir de instruções.',
        options: [
          { label: 'Sistemas que apenas aplicam regras fixas definidas por pessoas.', isCorrect: false },
          { label: 'Modelos capazes de criar conteúdo novo, como textos e imagens, a partir de instruções.', isCorrect: true },
          { label: 'Bancos de dados que armazenam currículos.', isCorrect: false },
          { label: 'Ferramentas que garantem respostas sempre corretas.', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'Um LLM gera respostas prevendo as sequências de texto mais prováveis para o contexto recebido.',
        competencyKey: 'ai_fundamentals',
        explanation: 'Esse é o princípio básico de funcionamento: previsão de tokens com base no contexto.',
        options: [
          { label: 'Verdadeiro', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Uma ferramenta de IA cita uma "pesquisa nacional de 2024" com um dado salarial exato, mas você não encontra a fonte. O que provavelmente aconteceu?',
        competencyKey: 'critical_thinking',
        explanation: 'Fontes e números não verificáveis são sinais típicos de alucinação. Confirme sempre em fontes confiáveis.',
        options: [
          { label: 'A pesquisa existe, mas é sigilosa.', isCorrect: false },
          { label: 'A IA pode ter alucinado — gerado uma informação plausível, porém inventada.', isCorrect: true },
          { label: 'A IA acessou dados internos da empresa.', isCorrect: false },
          { label: 'É um erro de digitação do usuário.', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Quais tarefas são bons usos da IA generativa por um recrutador, desde que haja revisão humana? (selecione todas as corretas)',
        competencyKey: 'ai_recruitment',
        explanation: 'Redação e organização de textos são bons usos. Decidir sobre a contratação de pessoas não deve ser delegado à IA.',
        options: [
          { label: 'Rascunhar uma descrição de vaga.', isCorrect: true },
          { label: 'Sugerir perguntas de entrevista por competência.', isCorrect: true },
          { label: 'Decidir sozinha qual candidato será contratado.', isCorrect: false },
          { label: 'Adaptar o tom de uma mensagem de retorno.', isCorrect: true },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Por que a mesma pergunta feita duas vezes a um LLM pode gerar respostas diferentes?',
        competencyKey: 'ai_fundamentals',
        explanation: 'A geração envolve amostragem com certa aleatoriedade, controlada por parâmetros como a temperatura.',
        options: [
          { label: 'Porque o modelo aprende permanentemente a cada conversa.', isCorrect: false },
          { label: 'Porque a geração envolve uma dose controlada de aleatoriedade (temperatura).', isCorrect: true },
          { label: 'Porque a internet muda a cada minuto.', isCorrect: false },
          { label: 'Porque o modelo está com defeito.', isCorrect: false },
        ],
      },
    ],
  },
};
