import type { SeedModule } from './types';

export const recruitmentModule4: SeedModule = {
  title: 'Pensamento crítico e validação',
  description:
    'Desenvolva o hábito de avaliar criticamente respostas de IA: identificar erros e conclusões sem evidência, validar informações e evitar a dependência excessiva, mantendo a supervisão humana.',
  objectives: [
    'Identificar sinais de respostas incorretas ou sem fundamento.',
    'Aplicar um método de validação de informações geradas por IA.',
    'Reconhecer os riscos da dependência excessiva da IA.',
    'Definir o papel da supervisão humana em processos seletivos.',
  ],
  lessons: [
    {
      title: 'Identificando respostas incorretas e validando informações',
      summary: 'Sinais de alerta e um método prático de verificação em cinco passos.',
      estimatedMinutes: 25,
      learnContent: `## Por que a validação é indispensável

Como vimos, um LLM produz texto **plausível**, não necessariamente **verdadeiro**. Em recrutamento, um erro pode afetar pessoas reais: um requisito inventado exclui candidatos; uma afirmação legal incorreta expõe a empresa; uma conclusão sem base prejudica alguém injustamente.

## Sinais de alerta

Desconfie especialmente quando a resposta contém:

| Sinal | Exemplo |
|---|---|
| Números muito precisos sem fonte | "O salário médio é R$ 7.843,00" |
| Fontes difíceis de localizar | "Segundo estudo do Instituto Nacional de Talentos..." |
| Afirmações jurídicas categóricas | "A lei permite exigir..." |
| Conclusões sobre pessoas | "Este candidato não tem perfil de liderança" |
| Linguagem absoluta | "sempre", "nunca", "comprovadamente", "certamente" |
| Informações que você não forneceu | Detalhes sobre a empresa ou o candidato que não estavam no prompt |

## Método de validação em cinco passos

1. **Separe fatos de opiniões** — o que é afirmado como fato verificável? O que é sugestão ou interpretação?
2. **Rastreie a origem** — a informação veio do material que você forneceu ou foi "acrescentada" pela IA?
3. **Verifique em fontes confiáveis** — legislação no site oficial, dados salariais em pesquisas reconhecidas, políticas internas nos documentos da empresa.
4. **Teste a lógica** — as conclusões decorrem das evidências apresentadas? Há saltos de raciocínio?
5. **Avalie o impacto** — se a informação estiver errada, quem é prejudicado? Quanto maior o impacto, maior o rigor da verificação.

## Perguntas úteis para fazer à própria IA

- "Quais partes desta resposta você não tem como confirmar?"
- "Liste as premissas que você assumiu."
- "Mostre o trecho do material fornecido que sustenta cada conclusão."

Essas perguntas ajudam, mas **não substituem a verificação externa**: a IA também pode errar ao avaliar a si mesma.

## Validação proporcional ao risco

Nem tudo exige o mesmo esforço. Um rascunho de e-mail requer revisão de tom e de informações práticas. Uma afirmação sobre legislação trabalhista ou sobre o desempenho de um candidato exige verificação rigorosa — e, muitas vezes, consulta a especialistas.`,
      beginnerSupport: `### Seja o "editor" da IA

Imagine que a IA é um redator novo na equipe. O texto chega bonito, mas você é o editor: antes de publicar, você confere.

Três perguntas simples para cada resposta:
1. **Isso é um fato ou uma opinião?**
2. **Eu consigo confirmar isso em outro lugar?**
3. **Se estiver errado, alguém sai prejudicado?**

Se a resposta à terceira pergunta for "sim", confira com muito mais cuidado — ou não use.`,
      advancedDeepDive: `### Aprofundamento: vieses cognitivos do usuário

Além dos erros da IA, existem vieses de **quem usa** a IA:

- **Viés de automação**: tendência a confiar mais em respostas de sistemas automatizados do que no próprio julgamento.
- **Viés de confirmação**: aceitar sem questionar respostas que confirmam o que já pensávamos.
- **Efeito de fluência**: textos bem escritos parecem mais verdadeiros.

Estratégias para contrabalançar: definir critérios **antes** de ler a resposta da IA; pedir explicitamente argumentos contrários ("quais seriam os contra-argumentos?"); envolver uma segunda pessoa na revisão de decisões de alto impacto; e registrar as fontes usadas na verificação, o que facilita auditorias posteriores.`,
      contextContent: `### Exemplo: validando uma afirmação legal

Um recrutador fictício perguntou: "Posso pedir certidão de antecedentes criminais para todas as vagas?"

A IA respondeu: *"Sim, a legislação brasileira permite exigir certidão de antecedentes para qualquer vaga, conforme o artigo 7º da CLT."*

**Aplicando o método:**

1. **Fato ou opinião?** Afirmação jurídica categórica — fato a verificar.
2. **Origem?** Não veio de nenhum material fornecido.
3. **Fonte confiável?** O recrutador consulta o jurídico da empresa e materiais oficiais. A orientação recebida é de que o tema é sensível e que a exigência indiscriminada pode ser considerada discriminatória, sendo aceita em situações específicas, justificadas pela natureza do cargo. A citação ao "artigo 7º da CLT" não sustenta a afirmação.
4. **Lógica?** A resposta generalizou ("qualquer vaga") sem considerar a natureza do cargo.
5. **Impacto?** Alto — risco jurídico e de discriminação.

**Conclusão:** a resposta continha uma alucinação jurídica. O caminho correto foi buscar orientação do jurídico.

> Em temas legais, use a IA no máximo para **organizar perguntas** a serem levadas a especialistas — nunca como fonte final.`,
      reflectionPrompt:
        'Qual dos sinais de alerta você acha mais difícil de perceber no dia a dia? Que hábito você pode adotar para não deixá-lo passar?',
      keyTakeaways: [
        'Fluência não é evidência: valide fatos antes de usá-los.',
        'Números precisos, fontes obscuras, afirmações jurídicas e conclusões sobre pessoas são sinais de alerta.',
        'Use o método: separar fatos, rastrear origem, verificar fontes, testar lógica, avaliar impacto.',
        'O rigor da validação deve ser proporcional ao risco.',
      ],
      competencies: [{ key: 'critical_thinking', weight: 3 }],
      resources: [
        {
          label: 'Consolidação das Leis do Trabalho (Decreto-Lei 5.452/1943)',
          url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
        },
      ],
    },
    {
      title: 'Dependência excessiva e supervisão humana',
      summary: 'Como manter o julgamento profissional ativo e onde a supervisão humana é inegociável.',
      estimatedMinutes: 25,
      learnContent: `## O risco da dependência excessiva

À medida que a IA se torna útil, cresce a tentação de usá-la para tudo — e de revisar cada vez menos. Esse movimento traz riscos:

- **Perda de habilidade**: deixar de exercitar competências como redação, análise e entrevista.
- **Homogeneização**: todas as vagas e mensagens passam a soar iguais, sem identidade da empresa.
- **Erros silenciosos**: falhas que passam despercebidas porque ninguém mais confere.
- **Responsabilidade diluída**: "foi a IA que sugeriu" não é justificativa aceitável para uma decisão sobre uma pessoa.

## Supervisão humana: o que significa na prática

Supervisão humana não é apenas "dar uma olhada". Ela envolve:

1. **Competência** — quem revisa entende do assunto e dos riscos.
2. **Autoridade** — quem revisa pode rejeitar ou alterar o resultado da IA.
3. **Tempo** — há tempo real para revisar, não apenas para aprovar em massa.
4. **Registro** — fica documentado quem aprovou e com base em quê.

Uma revisão feita às pressas, com pressão para aprovar tudo, é supervisão apenas no papel.

## Níveis de autonomia

| Nível | Descrição | Exemplo em RH | Adequação |
|---|---|---|---|
| Assistência | IA sugere; pessoa decide e edita | Rascunho de anúncio | Adequado com revisão |
| Recomendação | IA indica opção; pessoa aprova | Sugestão de horários de entrevista | Adequado para baixo impacto |
| Automação com supervisão | IA executa; pessoa monitora | Envio de confirmação de candidatura | Apenas tarefas de baixo risco |
| Automação plena | IA decide sozinha | Reprovar candidatos automaticamente | **Inadequado** para decisões sobre pessoas |

## Mantendo o julgamento ativo

- Defina seus **critérios antes** de consultar a IA.
- Faça você mesmo, periodicamente, tarefas que costuma delegar.
- Questione respostas que "fazem sentido demais".
- Peça a colegas que revisem decisões importantes.

## O papel insubstituível do recrutador

A IA não tem responsabilidade, empatia nem conhecimento do contexto humano de cada processo. O recrutador é quem garante **justiça**, **transparência** e **respeito** aos candidatos — e é quem responde pelas decisões.`,
      beginnerSupport: `### O GPS e o motorista

O GPS sugere rotas excelentes na maior parte do tempo. Mas, se ele mandar entrar em uma rua interditada, o motorista não obedece cegamente — ele olha para a rua.

Com a IA é igual: ela é ótima para sugerir caminhos, mas **você continua dirigindo**. Se você parar de olhar para a rua, um erro do GPS vira um acidente.

No recrutamento, "olhar para a rua" significa: conferir as informações, pensar nas pessoas envolvidas e assumir a decisão.`,
      advancedDeepDive: `### Aprofundamento: desenho de revisão efetiva

Pesquisas sobre interação humano-automação mostram que revisões tendem a ser menos eficazes quando o sistema acerta quase sempre: as pessoas passam a aprovar por hábito. Algumas práticas ajudam:

- **Revisão ativa**: exigir que o revisor preencha um item (ex.: "evidência que sustenta a conclusão") em vez de só clicar em "aprovar".
- **Amostragem e auditoria**: revisar em profundidade uma amostra dos resultados periodicamente.
- **Exibir incerteza**: sinalizar quando o resultado depende de informações incompletas.
- **Separar papéis**: quem configura os prompts não deve ser o único a avaliar seus resultados.

Em contextos regulados, documentar a supervisão humana também é uma forma de demonstrar responsabilidade e prestação de contas.`,
      contextContent: `### Exemplo: quando a supervisão é só no papel

Uma equipe fictícia passou a usar IA para gerar resumos de candidaturas. No início, os recrutadores liam cada resumo com atenção. Depois de algumas semanas, com o aumento de vagas, passaram a ler apenas a última linha ("perfil aderente" ou "perfil pouco aderente").

Em uma revisão de rotina, o time percebeu que candidatos com transição de carreira estavam sendo classificados como "pouco aderentes" com frequência, embora tivessem experiências relevantes descritas de forma diferente.

**O que falhou:**
- o resumo passou a funcionar como **decisão**, e não como apoio;
- não havia **critérios definidos** previamente;
- não havia **auditoria** dos resultados.

**Ajustes feitos:**
- o prompt deixou de pedir qualquer classificação final;
- os recrutadores passaram a registrar a evidência que sustentava cada decisão;
- uma amostra semanal passou a ser revisada por outra pessoa.

A IA continuou útil — mas no papel correto.`,
      reflectionPrompt:
        'Em qual tarefa do seu trabalho você percebe (ou imagina) maior risco de passar a aprovar resultados da IA "no automático"? Que prática você adotaria para evitar isso?',
      keyTakeaways: [
        'A dependência excessiva reduz habilidades e deixa erros passarem despercebidos.',
        'Supervisão real exige competência, autoridade, tempo e registro.',
        'Automação plena é inadequada para decisões sobre pessoas.',
        'O recrutador responde pelas decisões — "a IA sugeriu" não é justificativa.',
      ],
      competencies: [{ key: 'critical_thinking', weight: 2 }, { key: 'workflow_design', weight: 1 }, { key: 'responsible_ai', weight: 1 }],
      activity: {
        type: 'CRITICAL_ANALYSIS',
        title: 'Identifique os problemas em uma resposta de IA',
        instructions: `Leia a resposta gerada por uma ferramenta de IA no cenário abaixo. Ela contém **vários problemas**.

1. Identifique **pelo menos quatro problemas** na resposta.
2. Para cada um, explique **por que** é um problema (risco de erro, discriminação, ilegalidade, falta de evidência etc.).
3. Indique **o que você faria** para corrigir ou validar cada ponto.
4. Conclua: essa resposta poderia ser usada como está? Por quê?`,
        scenario: `**Contexto:** uma recrutadora da empresa fictícia Solaris Energia pediu a uma ferramenta de IA: *"Analise os três finalistas para Coordenador(a) de Projetos e me diga quem contratar e qual salário oferecer."* Ela colou resumos dos candidatos (já identificados por letras).

**Resposta da IA:**

> **Análise dos finalistas — Coordenador(a) de Projetos**
>
> 1. **Faixa salarial:** segundo a Pesquisa Nacional de Remuneração em Energia 2024, o salário médio para o cargo é exatamente R$ 14.287,00. Recomendo oferecer esse valor.
>
> 2. **Ranking por fit cultural:**
>    - **Candidato B** — 1º lugar. Formado há poucos anos, tem a energia e a disposição de um time jovem como o da Solaris.
>    - **Candidata A** — 2º lugar. Muito experiente, mas com mais de 25 anos de carreira pode ter dificuldade de adaptação a novas tecnologias.
>    - **Candidato C** — 3º lugar. Mencionou que mora longe da empresa, o que indica baixo comprometimento.
>
> 3. **Aspecto legal:** de acordo com a Lei 14.982/2023, empresas do setor de energia podem priorizar candidatos com menos de 35 anos para cargos de coordenação.
>
> 4. **Conclusão:** o Candidato B é, sem dúvida, a melhor escolha e terá 95% de chance de sucesso no cargo. Você pode enviar a proposta hoje mesmo, sem necessidade de nova rodada com o gestor.

*Todos os dados e personagens são fictícios.*`,
        guidedSteps: [
          'Leia cada parágrafo e marque afirmações apresentadas como fatos.',
          'Verifique se há números, fontes ou leis que precisariam ser confirmados.',
          'Observe os critérios usados para ordenar os candidatos: são relacionados ao cargo?',
          'Procure linguagem de certeza absoluta e conclusões sem evidência.',
          'Analise se há espaço para a decisão humana e a participação do gestor.',
        ],
        advancedChallenge:
          'Reescreva o pedido original da recrutadora de forma que a IA pudesse ajudar de maneira adequada, sem decidir pela contratação e sem usar critérios discriminatórios.',
        socraticQuestions: [
          'Como você verificaria se a "Pesquisa Nacional de Remuneração em Energia 2024" e a "Lei 14.982/2023" realmente existem e dizem o que a IA afirma?',
          'Os critérios usados no ranking têm relação com as competências exigidas para coordenar projetos?',
          'Que evidência sustentaria a afirmação de "95% de chance de sucesso"?',
          'O que o pedido original da recrutadora revela sobre o papel que ela atribuiu à IA?',
        ],
        hints: [
          'Há problemas de três naturezas: informações possivelmente inventadas, critérios discriminatórios e ausência de supervisão humana.',
          'Observe o salário exato com "fonte" pouco verificável, a lei citada, as referências à idade e ao local de moradia, e a probabilidade de sucesso.',
          'Problemas a identificar: (1) estatística salarial sem fonte verificável; (2) lei possivelmente inexistente e conteúdo discriminatório; (3) ranking baseado em idade e local de moradia (etarismo e critério não relacionado ao cargo); (4) conclusão absoluta com probabilidade inventada; (5) dispensa do gestor e decisão delegada à IA.',
        ],
        modelAnswer: `**Problemas identificados:**

1. **Estatística salarial suspeita** — valor exato atribuído a uma pesquisa de difícil verificação. *Risco:* alucinação. *Ação:* verificar a existência da pesquisa e consultar a política salarial interna e pesquisas reconhecidas.

2. **Lei citada provavelmente inexistente e com conteúdo discriminatório** — priorizar candidatos por idade contraria princípios de não discriminação. *Risco:* jurídico e ético. *Ação:* consultar o jurídico e a legislação no site oficial; descartar a recomendação.

3. **Ranking por critérios discriminatórios** — "time jovem", "mais de 25 anos de carreira" (etarismo) e "mora longe" (critério não relacionado ao desempenho). *Risco:* discriminação e exclusão injusta. *Ação:* avaliar os finalistas apenas por competências e critérios definidos previamente.

4. **Conclusão absoluta e probabilidade inventada** — "sem dúvida" e "95% de chance de sucesso" não têm base. *Risco:* falsa sensação de certeza. *Ação:* exigir evidências e tratar a análise como hipótese.

5. **Ausência de supervisão humana** — a resposta dispensa o gestor e sugere enviar a proposta imediatamente. *Risco:* decisão delegada à IA. *Ação:* a decisão deve ser tomada por gestor e RH, com base na matriz de avaliação.

**Conclusão:** a resposta não pode ser usada. O próprio pedido ("diga quem contratar") atribuiu à IA um papel inadequado.

**Pedido reformulado (desafio):** "Organize, em tabela, as evidências apresentadas por cada finalista (A, B e C) para as competências: planejamento, gestão de stakeholders e liderança de equipe. Use apenas as informações fornecidas, não faça ranking nem recomendação de contratação e não considere idade, local de moradia ou características pessoais."`,
        maxAttempts: 4,
        passingScore: 70,
        rubric: {
          title: 'Rubrica — Análise crítica de resposta de IA',
          description: 'Avalia a capacidade de identificar erros, vieses e ausência de supervisão humana.',
          criteria: [
            {
              key: 'pensamento_critico',
              name: 'Pensamento crítico',
              description: 'Identifica os problemas da resposta e explica por que são problemas.',
              weight: 3,
              indicators: [
                'Identifica ao menos 4 problemas',
                'Aponta informações possivelmente inventadas',
                'Questiona conclusões sem evidência',
              ],
            },
            {
              key: 'uso_responsavel',
              name: 'Uso responsável e ética',
              description: 'Reconhece critérios discriminatórios e riscos legais.',
              weight: 3,
              indicators: ['Identifica etarismo e critérios não relacionados ao cargo', 'Reconhece risco jurídico'],
            },
            {
              key: 'qualidade_solucao',
              name: 'Qualidade das ações propostas',
              description: 'Propõe formas concretas de validar ou corrigir cada problema.',
              weight: 2,
              indicators: ['Indica fontes de verificação', 'Mantém a decisão com humanos'],
            },
            {
              key: 'clareza',
              name: 'Clareza',
              description: 'Organização da análise.',
              weight: 1,
              indicators: ['Lista estruturada de problemas', 'Conclusão explícita'],
            },
          ],
        },
        expectedKeywords: [
          'alucina',
          'inventad',
          'fonte',
          'lei',
          'idade',
          'etarismo',
          'discrimina',
          'moradia',
          'evidência',
          'evidencia',
          'gestor',
          'humana',
          'verificar',
          '95%',
        ],
      },
    },
  ],
  quiz: {
    kind: 'MODULE_QUIZ',
    title: 'Avaliação do módulo 4 — Pensamento crítico',
    description: 'Verifique sua capacidade de avaliar e validar respostas de IA.',
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Quais elementos de uma resposta de IA são sinais de alerta que exigem verificação? (selecione todos os corretos)',
        competencyKey: 'critical_thinking',
        explanation: 'Números precisos sem fonte, afirmações jurídicas categóricas e conclusões sobre pessoas exigem verificação rigorosa.',
        options: [
          { label: 'Números muito precisos sem fonte verificável.', isCorrect: true },
          { label: 'Afirmações jurídicas categóricas.', isCorrect: true },
          { label: 'Conclusões sobre o perfil de candidatos.', isCorrect: true },
          { label: 'Uma lista de sugestões de títulos para um e-mail.', isCorrect: false },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Qual é o primeiro passo do método de validação apresentado no módulo?',
        competencyKey: 'critical_thinking',
        explanation: 'Separar fatos de opiniões permite identificar o que precisa ser verificado.',
        options: [
          { label: 'Perguntar à IA se ela tem certeza.', isCorrect: false },
          { label: 'Separar fatos verificáveis de opiniões e sugestões.', isCorrect: true },
          { label: 'Enviar a resposta ao gestor.', isCorrect: false },
          { label: 'Reescrever o prompt.', isCorrect: false },
        ],
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'Pedir à própria IA que confirme suas respostas é suficiente para garantir que elas estão corretas.',
        competencyKey: 'critical_thinking',
        explanation: 'A IA também pode errar ao avaliar a si mesma; a verificação externa continua necessária.',
        options: [
          { label: 'Verdadeiro', isCorrect: false },
          { label: 'Falso', isCorrect: true },
        ],
      },
      {
        type: 'SCENARIO',
        prompt:
          'Sua equipe aprova resumos de candidaturas gerados por IA lendo apenas a última linha. Qual medida melhor fortalece a supervisão humana?',
        competencyKey: 'workflow_design',
        explanation: 'Remover a classificação final, exigir evidências e auditar amostras torna a supervisão efetiva.',
        options: [
          { label: 'Manter o processo, pois está mais rápido.', isCorrect: false, score: 0 },
          {
            label: 'Remover a classificação final do prompt, exigir o registro de evidências para cada decisão e auditar uma amostra periodicamente.',
            isCorrect: true,
            score: 100,
          },
          { label: 'Trocar a ferramenta de IA por outra.', isCorrect: false, score: 20 },
          { label: 'Pedir que a IA seja mais rigorosa nas classificações.', isCorrect: false, score: 10 },
        ],
      },
    ],
  },
};
