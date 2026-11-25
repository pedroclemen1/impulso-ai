import type { SeedModule } from './types';

export const recruitmentModule5: SeedModule = {
  title: 'Ética, privacidade e vieses',
  description:
    'Use a IA de forma responsável: fundamentos de proteção de dados e LGPD, anonimização, vieses algorítmicos, prevenção da discriminação e os limites do uso de IA no recrutamento.',
  objectives: [
    'Aplicar princípios da LGPD ao uso de IA em recrutamento.',
    'Anonimizar e minimizar dados antes de usar ferramentas de IA.',
    'Reconhecer vieses algorítmicos e critérios discriminatórios.',
    'Definir limites e responsabilidades humanas no uso de IA.',
  ],
  lessons: [
    {
      title: 'Proteção de dados e tratamento responsável de informações',
      summary: 'Princípios da LGPD aplicados ao recrutamento com IA e técnicas práticas de anonimização.',
      estimatedMinutes: 25,
      learnContent: `## A LGPD no recrutamento

A **Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)** regula o tratamento de dados pessoais no Brasil. Processos seletivos tratam muitos dados pessoais — nome, contato, histórico profissional, às vezes dados sensíveis — e por isso estão sujeitos a ela.

### Conceitos essenciais

- **Dado pessoal**: informação que identifica ou pode identificar uma pessoa (nome, CPF, e-mail, telefone, endereço, foto).
- **Dado pessoal sensível**: origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, dados de saúde ou vida sexual, dados genéticos ou biométricos. Exigem proteção reforçada.
- **Tratamento**: qualquer operação com dados — coletar, armazenar, compartilhar, analisar e também **enviar a uma ferramenta de IA**.

### Princípios mais relevantes para o uso de IA

| Princípio | O que significa | Aplicação prática |
|---|---|---|
| Finalidade | Tratar dados para propósitos legítimos e informados | Dados do processo seletivo não devem ser usados para outros fins |
| Necessidade | Usar o mínimo de dados necessário | Não enviar contato e documentos para resumir competências |
| Transparência | Informar de forma clara como os dados são tratados | Comunicar aos candidatos o uso de ferramentas automatizadas |
| Segurança | Proteger os dados contra acessos indevidos | Usar apenas ferramentas aprovadas pela empresa |
| Não discriminação | Proibido tratar dados para fins discriminatórios | Não usar características pessoais para avaliar candidatos |

A LGPD também prevê que o titular pode solicitar a **revisão de decisões tomadas unicamente com base em tratamento automatizado** que afetem seus interesses — mais um motivo para manter a decisão humana nos processos seletivos.

## Anonimização e pseudonimização na prática

Antes de usar IA com informações de candidatos:

1. **Pergunte se precisa de dados pessoais** — muitas tarefas (anúncios, roteiros, modelos de mensagem) não precisam de nenhum.
2. **Remova identificadores diretos**: nome, CPF, RG, e-mail, telefone, endereço, foto, links de redes sociais.
3. **Remova dados sensíveis e irrelevantes**: idade, estado civil, filhos, saúde, religião.
4. **Use códigos**: "Candidato A", "Candidata B".
5. **Cuidado com identificadores indiretos**: combinações como "única engenheira de 52 anos da filial X" podem identificar alguém.

## Ferramentas públicas versus corporativas

Ferramentas públicas e gratuitas podem armazenar conversas e, dependendo dos termos de uso, utilizá-las para melhorar seus modelos. **Não envie currículos, CPFs ou documentos de candidatos a ferramentas não aprovadas pela empresa.** Em caso de dúvida, consulte o encarregado de dados (DPO) ou o jurídico.`,
      beginnerSupport: `### Uma regra simples para o dia a dia

Antes de colar qualquer coisa em uma ferramenta de IA, imagine que esse texto **poderia aparecer em um mural público**. Você se sentiria confortável?

- Um modelo de anúncio de vaga? ✅ Sem problema.
- Uma pergunta sobre como estruturar uma entrevista? ✅ Sem problema.
- O currículo completo de uma candidata, com telefone e CPF? ❌ Nunca.

Se precisar trabalhar com informações de candidatos, **troque nomes por códigos** e **apague dados de contato e informações pessoais**. E use apenas as ferramentas que a sua empresa aprovou.`,
      advancedDeepDive: `### Aprofundamento: bases legais, retenção e avaliação de impacto

- **Bases legais**: o tratamento precisa de uma base legal (como procedimentos preliminares a contrato, legítimo interesse ou consentimento, conforme o caso). Usar uma ferramenta de IA não cria uma base nova — o uso precisa ser compatível com a finalidade informada.
- **Operadores e transferência internacional**: fornecedores de IA podem atuar como operadores e processar dados fora do país; isso exige avaliação contratual e de segurança.
- **Retenção**: defina por quanto tempo dados de candidatos ficam armazenados, inclusive históricos de conversa em ferramentas de IA.
- **Relatório de impacto (RIPD)**: para tratamentos de maior risco, como avaliações automatizadas, a elaboração de relatório de impacto à proteção de dados é uma boa prática e pode ser exigida pela ANPD.
- **Anonimização real**: dados só são considerados anonimizados quando a reidentificação não é possível com esforços razoáveis — pseudonimização (troca de nome por código) continua sendo dado pessoal.`,
      contextContent: `### Antes e depois: anonimizando anotações

**Anotação original (fictícia) — NÃO enviar a uma IA:**

~~~
Juliana Prado Moreira, 34 anos, CPF 000.000.000-00, casada,
2 filhos, mora no bairro Jardim das Flores. Tel. (11) 90000-0000.
Liderou a implantação de um ERP em 6 meses, coordenando 8
pessoas. Comunicação clara, deu exemplos concretos de conflitos
resolvidos. Pouca experiência com orçamento.
~~~

**Versão anonimizada e minimizada:**

~~~
Candidata B. Liderou a implantação de um sistema de gestão (ERP)
em 6 meses, coordenando 8 pessoas. Comunicação clara, com
exemplos concretos de resolução de conflitos. Pouca experiência
com gestão de orçamento.
~~~

**O que foi removido e por quê:**
- nome, CPF e telefone → identificadores diretos;
- idade, estado civil e filhos → irrelevantes para a avaliação e potencial fonte de discriminação (nem deveriam constar nas anotações);
- bairro → identificador indireto e irrelevante.

O que restou são **evidências profissionais** — exatamente o que é necessário para um resumo por competências.`,
      reflectionPrompt:
        'Que dados pessoais circulam hoje nos seus processos seletivos que talvez nem precisassem ser coletados? O que mudaria se você aplicasse o princípio da necessidade?',
      keyTakeaways: [
        'Enviar dados a uma ferramenta de IA é tratamento de dados e está sujeito à LGPD.',
        'Use o mínimo de dados necessário — muitas tarefas não exigem dado pessoal algum.',
        'Anonimize: remova identificadores diretos, indiretos e dados sensíveis.',
        'Use apenas ferramentas de IA aprovadas pela empresa.',
      ],
      competencies: [{ key: 'responsible_ai', weight: 3 }],
      resources: [
        {
          label: 'Lei nº 13.709/2018 — LGPD (texto oficial)',
          url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
        },
        { label: 'ANPD — Autoridade Nacional de Proteção de Dados', url: 'https://www.gov.br/anpd/pt-br' },
      ],
    },
    {
      title: 'Vieses algorítmicos e discriminação em processos seletivos',
      summary: 'Como vieses surgem em sistemas de IA e como evitá-los em critérios, textos e decisões.',
      estimatedMinutes: 25,
      learnContent: `## O que é viés algorítmico

**Viés algorítmico** ocorre quando um sistema produz resultados sistematicamente desfavoráveis a determinados grupos. Em IA generativa, ele pode surgir porque os modelos aprendem com textos produzidos por pessoas — e esses textos refletem estereótipos e desigualdades históricas.

## Como o viés aparece no recrutamento

| Forma | Exemplo |
|---|---|
| Linguagem | Anúncios que usam apenas o masculino ou termos como "jovem e dinâmico" |
| Critérios | Exigir "boa aparência", faixa etária ou residência em determinadas regiões |
| Estereótipos | Associar liderança a um gênero ou cuidado a outro |
| Proxies | Usar CEP, escola ou nome como indicadores indiretos de origem social ou étnica |
| Histórico | Reproduzir o perfil de quem foi contratado no passado, perpetuando a falta de diversidade |

### Proxies: o viés escondido

Um critério aparentemente neutro pode funcionar como **proxy** (substituto) de característica protegida. Exemplos:
- **CEP ou bairro** pode refletir renda e origem racial;
- **anos de formado** pode refletir idade;
- **lacunas no currículo** podem refletir maternidade, cuidado de familiares ou problemas de saúde.

## Discriminação em processos seletivos

A legislação brasileira proíbe práticas discriminatórias no acesso ao emprego — por exemplo, a Constituição Federal e a Lei nº 9.029/1995, que veda práticas discriminatórias por motivo de sexo, origem, raça, cor, estado civil, situação familiar, deficiência, idade, entre outros, além de proibir a exigência de atestados de gravidez. A LGPD reforça o princípio da não discriminação no tratamento de dados.

**Usar IA não afasta a responsabilidade**: se um critério discriminatório for aplicado, a empresa e as pessoas envolvidas respondem por ele, independentemente de ter sido sugerido por uma ferramenta.

## Como prevenir vieses ao usar IA

1. **Critérios relacionados ao trabalho**: toda exigência deve ter relação demonstrável com as atividades do cargo.
2. **Restrições explícitas no prompt**: "não considere idade, gênero, raça, estado civil, aparência, local de moradia ou outras características pessoais".
3. **Revisão de linguagem**: peça à IA (e revise você mesmo) para identificar termos excludentes.
4. **Desconfie de padrões históricos**: "contratar perfis parecidos com os melhores do passado" pode perpetuar exclusões.
5. **Monitoramento agregado**: acompanhe, com dados tratados de forma segura, se determinados grupos avançam menos nas etapas.`,
      beginnerSupport: `### O espelho do passado

A IA aprendeu com uma enorme quantidade de textos escritos por pessoas ao longo de muitos anos. Se, no passado, muitos anúncios diziam "procura-se moça de boa aparência" ou associavam chefia a homens, a IA pode repetir esses padrões sem perceber.

Por isso, quando usar IA em recrutamento:
- **leia o texto procurando exclusões**: idade, gênero, aparência, local de moradia;
- **pergunte-se**: "isso tem relação com o trabalho?";
- **peça na instrução**: "use linguagem inclusiva e não use características pessoais como critério".`,
      advancedDeepDive: `### Aprofundamento: medindo impacto adverso

Uma forma de monitorar vieses é comparar **taxas de seleção** entre grupos em cada etapa. Uma referência usada internacionalmente é a "regra dos quatro quintos": se a taxa de seleção de um grupo é inferior a 80% da taxa do grupo mais selecionado, há indício de impacto adverso a ser investigado. Não é uma prova de discriminação, mas um **sinal de alerta**.

Cuidados:
- coletar dados demográficos apenas com base legal adequada, de forma voluntária e segregada da avaliação;
- analisar resultados de forma agregada, sem que avaliadores tenham acesso a essas informações individuais;
- investigar as causas (critérios, canais de divulgação, linguagem) antes de concluir.

Lembre também que remover a variável protegida não basta: **proxies** podem reintroduzir o viés. Avaliar os efeitos é tão importante quanto revisar os critérios.`,
      contextContent: `### Exemplo: revisando um anúncio com viés

**Rascunho gerado por IA (fictício):**

> Buscamos um vendedor jovem e dinâmico, com boa aparência, recém-formado, morador da Zona Sul, com disponibilidade total para viagens.

**Análise:**
- "vendedor" (só masculino) → exclui por gênero;
- "jovem" e "recém-formado" → etarismo;
- "boa aparência" → critério subjetivo e potencialmente discriminatório;
- "morador da Zona Sul" → proxy de renda e origem;
- "disponibilidade total" → pode excluir pessoas com responsabilidades de cuidado; especifique a real necessidade.

**Prompt de revisão:**

~~~
Revise o anúncio abaixo para eliminar linguagem e critérios
discriminatórios ou não relacionados ao trabalho. Use linguagem
neutra em gênero. Substitua exigências vagas por requisitos
objetivos da função. Liste ao final cada alteração feita e o
motivo.
~~~

**Versão revisada (trecho):**

> Buscamos uma pessoa para atuar em vendas consultivas, com boa comunicação e foco no cliente. A função envolve viagens regionais, em média duas vezes por mês.

Pedir a lista de alterações ajuda o recrutador a **aprender** com a revisão e a conferir se nada importante foi perdido.`,
      reflectionPrompt:
        'Você já viu, em algum processo seletivo, um critério que parecia neutro mas poderia funcionar como proxy de alguma característica pessoal? Como você o reformularia?',
      keyTakeaways: [
        'A IA pode reproduzir vieses presentes nos textos com que foi treinada.',
        'Critérios aparentemente neutros podem funcionar como proxies discriminatórios.',
        'Toda exigência deve ter relação demonstrável com o trabalho.',
        'Usar IA não transfere a responsabilidade por critérios discriminatórios.',
      ],
      competencies: [{ key: 'responsible_ai', weight: 3 }, { key: 'critical_thinking', weight: 1 }],
      resources: [
        {
          label: 'Lei nº 9.029/1995 — práticas discriminatórias no trabalho',
          url: 'https://www.planalto.gov.br/ccivil_03/leis/l9029.htm',
        },
      ],
    },
    {
      title: 'Responsabilidade humana e limites do uso de IA',
      summary: 'Onde a IA não deve ser usada, quem responde pelas decisões e como agir diante de sugestões inadequadas.',
      estimatedMinutes: 25,
      learnContent: `## A responsabilidade continua humana

Ferramentas de IA não têm personalidade jurídica nem responsabilidade profissional. Quando uma empresa usa IA em seu processo seletivo, **as pessoas e a organização respondem** pelos resultados: critérios aplicados, comunicações enviadas, decisões tomadas.

## Limites do uso de IA no recrutamento

### Usos geralmente adequados (com revisão)
- redigir e revisar textos (anúncios, mensagens, roteiros);
- organizar informações anonimizadas por competência;
- apoiar o planejamento e tarefas administrativas.

### Usos que exigem cautela elevada
- resumos de entrevistas e candidaturas (risco de distorção e de uso como decisão);
- sugestão de critérios de avaliação (risco de vieses e proxies);
- qualquer uso envolvendo dados pessoais.

### Usos inadequados
- **decidir** aprovação ou reprovação de candidatos sem decisão humana efetiva;
- inferir características pessoais (personalidade, saúde, orientação, gravidez, origem) a partir de textos, fotos, voz ou vídeo;
- analisar expressões faciais ou tom de voz para avaliar candidatos;
- monitorar redes sociais pessoais para "avaliar perfil";
- gerar justificativas para decisões já tomadas por critérios não declarados.

## Como agir diante de uma sugestão inadequada da IA

1. **Não aplique** a sugestão.
2. **Registre** o ocorrido (qual pedido gerou a resposta e o que foi sugerido).
3. **Revise o prompt** para incluir restrições explícitas.
4. **Comunique** a liderança, o jurídico ou a área responsável por IA, se o problema puder se repetir em outros processos.
5. **Reavalie** os processos que possam ter usado sugestões semelhantes.

## Transparência com candidatos

Boas práticas incluem informar quando ferramentas de IA são usadas no processo, explicar como as decisões são tomadas e oferecer um canal para dúvidas e solicitações relacionadas aos dados pessoais.

## Princípios para levar ao dia a dia

> **Humano no comando, dados mínimos, critérios ligados ao trabalho, transparência e registro.**`,
      beginnerSupport: `### A IA é uma ferramenta, não uma colega de decisão

Uma calculadora pode errar se você digitar o número errado — e, mesmo assim, quem assina o relatório é você. Com a IA é a mesma coisa, só que os erros podem ser mais difíceis de perceber.

Guarde três regras:
1. **A IA ajuda a escrever e a organizar; quem decide é uma pessoa.**
2. **Se a IA sugerir algo que pareça injusto, não use — e avise quem precisa saber.**
3. **Seja transparente**: candidatos têm o direito de saber como são avaliados.`,
      advancedDeepDive: `### Aprofundamento: governança de IA na área de pessoas

Organizações maduras estruturam a governança de IA em RH com:

- **Inventário de usos**: quais ferramentas são usadas, em quais etapas e com quais dados.
- **Classificação de risco**: usos de alto risco (que afetam decisões sobre pessoas) exigem avaliação prévia, documentação e monitoramento.
- **Política de uso aceitável**: o que é permitido, proibido e o que requer aprovação.
- **Comitê multidisciplinar**: RH, jurídico, segurança da informação, proteção de dados e representantes das áreas de negócio.
- **Canal de contestação**: forma de candidatos pedirem revisão humana.

No cenário regulatório internacional, decisões de emprego costumam ser classificadas como de **alto risco** em propostas e normas sobre IA. Acompanhar a evolução regulatória brasileira sobre IA faz parte da responsabilidade da área.`,
      contextContent: `### Exemplo: quando a IA sugere o inadequado

Uma recrutadora fictícia pediu à IA: *"Sugira critérios para filtrar candidatos mais comprometidos para a vaga de Analista Administrativo."*

Entre as sugestões, a IA incluiu: *"Priorize candidatos sem filhos pequenos, pois tendem a faltar menos."*

**Como ela agiu:**
1. **Não aplicou** o critério — ele é discriminatório (situação familiar) e afeta desproporcionalmente mulheres.
2. **Registrou** o pedido e a resposta.
3. **Reformulou o prompt**:

~~~
Sugira critérios objetivos, relacionados às atividades de um
Analista Administrativo, para avaliar comprometimento e
organização em entrevista. Os critérios devem ser observáveis
e não podem considerar situação familiar, idade, gênero, estado
civil, saúde ou outras características pessoais.
~~~

4. **Compartilhou** o caso com a equipe, para que todos incluíssem restrições semelhantes nos prompts.

**Resultado:** critérios como "descreve um método de organização de demandas que utiliza" e "apresenta exemplo de entrega cumprida em prazo apertado" — observáveis, ligados ao trabalho e justos.`,
      reflectionPrompt:
        'Se você recebesse de uma ferramenta de IA uma sugestão discriminatória, a quem comunicaria na sua organização? Existe hoje um caminho claro para isso?',
      keyTakeaways: [
        'Pessoas e organizações respondem pelas decisões, mesmo quando usam IA.',
        'Inferir características pessoais e decidir sobre candidatos são usos inadequados da IA.',
        'Diante de sugestões inadequadas: não aplicar, registrar, revisar o prompt e comunicar.',
        'Transparência com candidatos fortalece a confiança no processo.',
      ],
      competencies: [{ key: 'responsible_ai', weight: 2 }, { key: 'critical_thinking', weight: 1 }, { key: 'workflow_design', weight: 1 }],
      activity: {
        type: 'CASE_STUDY',
        title: 'Analise critérios de seleção sugeridos por IA',
        instructions: `Analise o caso abaixo, em que uma ferramenta de IA sugeriu critérios de seleção.

1. Identifique **quais critérios são inadequados** e explique por quê (discriminação, proxy, privacidade, falta de relação com o trabalho).
2. Indique se **algum critério é aceitável** e em que condições.
3. Proponha **critérios alternativos** objetivos e relacionados ao trabalho.
4. Descreva **como o recrutador deveria agir** diante dessa resposta da IA.`,
        scenario: `**Contexto:** a empresa fictícia Horizonte Varejo vai contratar 20 Operadores(as) de Caixa para uma nova loja. Para acelerar a triagem de cerca de 600 candidaturas, um supervisor pediu a uma ferramenta de IA: *"Crie critérios para eliminar rapidamente os candidatos menos adequados."*

**Critérios sugeridos pela IA:**

1. Priorizar candidatos com **até 30 anos**, por terem mais energia para a rotina de pé.
2. **Excluir candidatos que residam nos CEPs** dos bairros Vila Esperança e Jardim Nova Aurora, por estatisticamente apresentarem maior rotatividade.
3. Dar preferência a candidatos com **"boa aparência"**, já que lidarão com o público.
4. Analisar fotos e redes sociais para **identificar candidatas possivelmente grávidas** e evitar afastamentos logo após a contratação.
5. Exigir **ensino médio completo**.
6. Verificar **disponibilidade para trabalhar aos fins de semana em escala**, conforme a operação da loja.

*Caso fictício para fins educacionais.*`,
        guidedSteps: [
          'Analise cada critério separadamente e pergunte: tem relação com as atividades do cargo?',
          'Identifique critérios que envolvem características pessoais protegidas (idade, gravidez, aparência).',
          'Procure critérios aparentemente neutros que funcionem como proxy (como CEP).',
          'Verifique se algum critério é legítimo e em que condições.',
          'Proponha alternativas objetivas e descreva as ações do recrutador.',
        ],
        advancedChallenge:
          'Proponha como monitorar, de forma agregada e respeitando a LGPD, se o processo seletivo final apresenta impacto adverso para algum grupo.',
        socraticQuestions: [
          'Que relação existe entre a idade de uma pessoa e sua capacidade de exercer a função de operador(a) de caixa?',
          'Por que um critério baseado em CEP pode ser discriminatório, mesmo sem mencionar diretamente renda ou raça?',
          'O que diz a legislação sobre exigências relacionadas à gravidez em processos seletivos?',
          'Como o pedido original do supervisor ("eliminar rapidamente") influenciou o tipo de resposta da IA?',
        ],
        hints: [
          'Classifique os critérios em três grupos: claramente discriminatórios, proxies discriminatórios e potencialmente legítimos.',
          'Idade, aparência e gravidez envolvem características pessoais; o CEP funciona como proxy de origem social e racial. Escolaridade e disponibilidade de escala podem ser legítimas se forem necessárias para a função.',
          'Critérios 1, 3 e 4 são discriminatórios (o 4 também viola a privacidade e a Lei 9.029/1995); o 2 é proxy discriminatório; 5 e 6 podem ser aceitáveis se justificados e aplicados igualmente. Alternativas: experiência com atendimento, habilidade com operações numéricas básicas, disponibilidade para a escala informada.',
        ],
        modelAnswer: `**Análise dos critérios**

| Critério | Avaliação | Motivo |
|---|---|---|
| 1. Até 30 anos | ❌ Inadequado | Etarismo; idade não tem relação demonstrável com a função |
| 2. Exclusão por CEP | ❌ Inadequado | Proxy de renda e origem racial; discriminação indireta; a "estatística" não foi comprovada |
| 3. "Boa aparência" | ❌ Inadequado | Critério subjetivo, historicamente associado a discriminação racial e estética |
| 4. Identificar gravidez por fotos/redes | ❌ Inadequado e ilegal | Discriminação por sexo e situação familiar (Lei 9.029/1995), violação de privacidade e tratamento indevido de dados pessoais (LGPD) |
| 5. Ensino médio completo | ⚠️ Possível | Aceitável se for realmente necessário para a função e aplicado igualmente a todos |
| 6. Disponibilidade de escala | ✅ Aceitável | Relacionado à operação real, desde que informado com clareza no anúncio |

**Critérios alternativos:** experiência ou interesse em atendimento ao público; habilidade com operações numéricas básicas (avaliada em teste simples e igual para todos); disponibilidade para a escala informada; comportamento cordial demonstrado em entrevista estruturada.

**Ações do recrutador:** não aplicar os critérios inadequados; registrar o ocorrido; reformular o pedido com restrições explícitas ("critérios objetivos e relacionados à função; não considerar idade, aparência, local de moradia, gravidez ou outras características pessoais"); comunicar a liderança e o jurídico; alinhar com o supervisor que a triagem será feita por pessoas, com critérios definidos.

**Reflexão:** o pedido "eliminar rapidamente" induziu a IA a buscar atalhos excludentes. Pedidos devem focar em **avaliar adequação à função**, não em eliminar pessoas.`,
        maxAttempts: 4,
        passingScore: 70,
        rubric: {
          title: 'Rubrica — Análise ética de critérios de seleção',
          description: 'Avalia a identificação de discriminação, proxies e a proposição de alternativas responsáveis.',
          criteria: [
            {
              key: 'uso_responsavel',
              name: 'Uso responsável de IA',
              description: 'Identifica critérios discriminatórios, proxies e violações de privacidade.',
              weight: 3,
              indicators: [
                'Identifica idade, aparência e gravidez como discriminatórios',
                'Reconhece o CEP como proxy',
                'Menciona LGPD ou legislação antidiscriminação',
              ],
            },
            {
              key: 'pensamento_critico',
              name: 'Pensamento crítico',
              description: 'Diferencia critérios legítimos de inadequados com justificativas.',
              weight: 2,
              indicators: ['Avalia cada critério separadamente', 'Reconhece critérios potencialmente legítimos'],
            },
            {
              key: 'qualidade_solucao',
              name: 'Qualidade da solução',
              description: 'Propõe alternativas objetivas e ações adequadas.',
              weight: 2,
              indicators: ['Propõe critérios relacionados à função', 'Descreve ações de registro e comunicação'],
            },
            {
              key: 'contextualizacao',
              name: 'Contextualização profissional',
              description: 'Considera o contexto da vaga e do volume de candidaturas.',
              weight: 1,
              indicators: ['Relaciona critérios às atividades de operador(a) de caixa'],
            },
            {
              key: 'clareza',
              name: 'Clareza',
              description: 'Organização e objetividade.',
              weight: 1,
              indicators: ['Análise estruturada por critério'],
            },
          ],
        },
        expectedKeywords: [
          'idade',
          'etarismo',
          'cep',
          'proxy',
          'aparência',
          'aparencia',
          'gravidez',
          'discrimina',
          'lgpd',
          'privacidade',
          'função',
          'funcao',
          'objetivo',
          'registr',
          'jurídico',
        ],
      },
    },
  ],
  quiz: {
    kind: 'MODULE_QUIZ',
    title: 'Avaliação do módulo 5 — Ética, privacidade e vieses',
    description: 'Verifique sua compreensão sobre LGPD, vieses e limites do uso de IA.',
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Segundo a LGPD, qual destes é um dado pessoal sensível?',
        competencyKey: 'responsible_ai',
        explanation: 'Dados de saúde estão entre os dados sensíveis definidos pela LGPD, ao lado de origem racial, religião, opinião política, entre outros.',
        options: [
          { label: 'Cargo pretendido.', isCorrect: false },
          { label: 'Informação sobre a saúde do candidato.', isCorrect: true },
          { label: 'Anos de experiência profissional.', isCorrect: false },
          { label: 'Idiomas que fala.', isCorrect: false },
        ],
      },
      {
        type: 'SCENARIO',
        prompt: 'Você quer usar IA para resumir as competências demonstradas por finalistas. Qual conjunto de dados deve ser enviado?',
        competencyKey: 'responsible_ai',
        explanation: 'O princípio da necessidade indica enviar apenas evidências profissionais, com identificação por códigos.',
        options: [
          { label: 'Currículos completos, com contato e foto.', isCorrect: false, score: 0 },
          { label: 'Evidências profissionais com nomes substituídos por códigos e sem dados pessoais.', isCorrect: true, score: 100 },
          { label: 'Nome completo e evidências profissionais.', isCorrect: false, score: 30 },
          { label: 'Apenas fotos, para a IA avaliar a postura.', isCorrect: false, score: 0 },
        ],
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'Um critério aparentemente neutro, como o CEP de residência, pode funcionar como proxy discriminatório.',
        competencyKey: 'responsible_ai',
        explanation: 'Proxies podem refletir renda, origem social e racial, gerando discriminação indireta.',
        options: [
          { label: 'Verdadeiro', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Quais usos de IA são inadequados em processos seletivos? (selecione todos os corretos)',
        competencyKey: 'responsible_ai',
        explanation: 'Inferir características pessoais e decidir sobre candidatos sem decisão humana efetiva são usos inadequados.',
        options: [
          { label: 'Inferir gravidez ou estado de saúde a partir de fotos.', isCorrect: true },
          { label: 'Revisar um anúncio para linguagem inclusiva.', isCorrect: false },
          { label: 'Reprovar candidatos automaticamente sem revisão humana.', isCorrect: true },
          { label: 'Analisar expressões faciais para avaliar candidatos.', isCorrect: true },
        ],
      },
      {
        type: 'SINGLE_CHOICE',
        prompt: 'A IA sugeriu um critério discriminatório. Qual é a sequência de ações mais adequada?',
        competencyKey: 'critical_thinking',
        explanation: 'Não aplicar, registrar, revisar o prompt e comunicar as áreas responsáveis.',
        options: [
          { label: 'Aplicar apenas nesta vaga e observar os resultados.', isCorrect: false },
          { label: 'Não aplicar, registrar o ocorrido, revisar o prompt e comunicar as áreas responsáveis.', isCorrect: true },
          { label: 'Ignorar a sugestão e não comentar com ninguém.', isCorrect: false },
          { label: 'Trocar de ferramenta e repetir o mesmo pedido.', isCorrect: false },
        ],
      },
    ],
  },
};
