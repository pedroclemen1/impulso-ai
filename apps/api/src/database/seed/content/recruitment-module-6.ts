import type { SeedModule } from './types';

export const recruitmentModule6: SeedModule = {
  title: 'Desafio final',
  description:
    'Integre tudo o que você aprendeu estruturando um processo de recrutamento completo assistido por IA, com prompts, validação, uso ético e supervisão humana.',
  objectives: [
    'Integrar engenharia de prompts, pensamento crítico e uso ético em um processo completo.',
    'Demonstrar a preservação da supervisão humana em todas as etapas.',
  ],
  lessons: [
    {
      title: 'Desafio: processo seletivo assistido por IA',
      summary: 'Aplique todas as competências do curso em um caso integrado.',
      estimatedMinutes: 60,
      learnContent: `## Integrando as competências

Ao longo do curso, você desenvolveu seis competências. Neste desafio, elas se combinam:

| Competência | Como aparece no desafio |
|---|---|
| Fundamentos de IA e LLMs | Escolher tarefas adequadas à IA e reconhecer limitações |
| Engenharia de prompts | Escrever prompts contextualizados, com restrições e formato |
| IA aplicada ao recrutamento | Cobrir as etapas do processo seletivo |
| Pensamento crítico e validação | Definir como cada resultado será verificado |
| Ética, privacidade e vieses | Anonimizar dados e prevenir discriminação |
| Fluxos de trabalho assistidos por IA | Organizar etapas com pontos de controle humano |

## Checklist do desafio

Antes de enviar sua resposta, confira se ela contempla:

- [ ] **Etapas do processo** — do levantamento do perfil ao retorno aos candidatos.
- [ ] **Prompts** — pelo menos dois prompts completos (papel, contexto, objetivo, restrições, formato).
- [ ] **Validação** — como você verificará os resultados da IA e quais informações exigem fontes externas.
- [ ] **Privacidade** — quais dados serão (ou não) enviados à IA e como serão anonimizados.
- [ ] **Prevenção de vieses** — restrições e revisões para evitar critérios discriminatórios.
- [ ] **Supervisão humana** — quem decide em cada etapa e onde a IA não atua.
- [ ] **Indicadores** — como saber se o processo funcionou bem.

## Dicas para uma boa resposta

- Seja **específico**: use as informações da vaga do cenário.
- Mostre **raciocínio**: explique por que fez cada escolha.
- Seja **realista**: considere o tempo e os recursos disponíveis.
- Reconheça **limites**: indique o que a IA não deve fazer.

O tutor vai acompanhar seu raciocínio e fazer perguntas para ajudá-lo a aprimorar a proposta. Use as tentativas para evoluir sua resposta.`,
      beginnerSupport: `### Como começar sem travar

Se o desafio parecer grande, divida-o em partes:

1. **Desenhe as etapas** em uma lista simples: perfil da vaga → anúncio → triagem → entrevistas → decisão → retorno.
2. **Para cada etapa, responda três perguntas**: o que a IA faz? Quem confere? Qual o cuidado?
3. **Escolha duas etapas** e escreva um prompt completo para cada uma, usando a fórmula Papel + Contexto + Objetivo + Restrições + Formato.
4. **Revise** com o checklist da aula.

Não precisa ser perfeito na primeira tentativa — o tutor vai ajudar você a melhorar.`,
      advancedDeepDive: `### Para ir além

Se você já domina os fundamentos, eleve a qualidade da sua proposta com:

- **Modelos de prompt reutilizáveis** com campos variáveis e critérios de aceitação.
- **Matriz de avaliação** com pesos definidos antes das entrevistas e escala com âncoras comportamentais.
- **Plano de monitoramento de vieses** com análise agregada de taxas de avanço.
- **Plano de contingência** para indisponibilidade da ferramenta de IA.
- **Comunicação transparente** aos candidatos sobre o uso de IA e canal para dúvidas ou pedidos de revisão.
- **Registro (log)** do que foi gerado por IA e revisado por pessoas, para auditoria.`,
      contextContent: `### Lembrete: o que caracteriza um bom uso de IA no recrutamento

- A IA **acelera** a produção e a organização de textos.
- As pessoas **definem critérios**, **validam** informações e **decidem**.
- Os dados de candidatos são **minimizados e anonimizados**.
- Os critérios têm **relação com o trabalho**.
- O processo é **transparente** e **documentado**.

Exemplo de prompt bem construído para a etapa de entrevista:

~~~
Atue como especialista em seleção por competências.
Contexto: vaga fictícia de Analista de Customer Success Pleno em
uma empresa de software para clínicas; foco em retenção de
clientes, treinamentos e análise de indicadores de uso.
Objetivo: criar roteiro de entrevista estruturada.
Restrições: 6 perguntas comportamentais (1 por competência
fornecida); nada sobre vida pessoal, idade, família, saúde ou
religião; linguagem acessível.
Formato: tabela Competência | Pergunta | Sinais de boa resposta |
Escala 1-5 resumida.
~~~`,
      reflectionPrompt:
        'Olhando para o seu processo seletivo final, qual decisão você considera mais importante manter sob responsabilidade humana? Como você garantiria isso na prática?',
      keyTakeaways: [
        'Um bom processo com IA integra prompts claros, validação, privacidade e supervisão humana.',
        'A IA acelera tarefas; pessoas definem critérios e decidem.',
        'Documentação e indicadores tornam o uso de IA auditável e sustentável.',
      ],
      competencies: [
        { key: 'workflow_design', weight: 3 },
        { key: 'prompt_engineering', weight: 2 },
        { key: 'critical_thinking', weight: 2 },
        { key: 'responsible_ai', weight: 2 },
        { key: 'ai_recruitment', weight: 2 },
        { key: 'ai_fundamentals', weight: 1 },
      ],
      activity: {
        type: 'WORKFLOW_DESIGN',
        title: 'Desafio final: estruture um processo de recrutamento assistido por IA',
        instructions: `Estruture um **processo de recrutamento completo assistido por IA** para a vaga do cenário.

Sua proposta deve conter:

1. **Etapas do processo** (do perfil da vaga ao retorno aos candidatos), indicando em cada uma o papel da IA e o responsável humano.
2. **Pelo menos dois prompts completos** (papel, contexto, objetivo, restrições e formato).
3. **Validação**: como os resultados da IA serão verificados.
4. **Privacidade**: quais dados serão usados com a IA e como serão anonimizados.
5. **Prevenção de vieses**: quais cuidados serão adotados.
6. **Supervisão humana**: onde a IA não atuará e quem toma as decisões.

Opcional: indicadores para avaliar o processo.`,
        scenario: `**Vaga fictícia: Analista de Recursos Humanos Pleno (Generalista) — Grupo Ipê Saúde**

- **Empresa:** Grupo Ipê Saúde (fictício), rede de 12 clínicas de diagnóstico por imagem em Pernambuco e na Paraíba, com 900 colaboradores.
- **Contexto:** a empresa está expandindo e quer estruturar a área de RH. A pessoa contratada apoiará recrutamento, integração (onboarding), clima organizacional e indicadores de pessoas.
- **Requisitos do gestor:** experiência em recrutamento e seleção, conhecimento de legislação trabalhista básica, domínio de planilhas, boa comunicação com lideranças; desejável experiência no setor de saúde.
- **Modelo:** presencial em Recife, com visitas mensais às unidades.
- **Prazo:** 40 dias.
- **Recursos:** uma recrutadora com outras 6 vagas abertas; ferramenta corporativa de IA aprovada pelo jurídico (não utiliza dados para treinamento); ATS com campos estruturados.
- **Expectativa de volume:** cerca de 180 candidaturas.
- **Diretriz da diretoria:** aumentar a diversidade nas contratações e garantir um processo transparente.
- **Preocupação do jurídico:** por ser uma empresa de saúde, há grande sensibilidade em relação a dados pessoais e de saúde.

*Todos os dados são fictícios. Nunca utilize dados reais de candidatos em exercícios.*`,
        guidedSteps: [
          'Liste as etapas do processo e defina, para cada uma, o papel da IA e o responsável humano.',
          'Escreva dois prompts completos para as etapas em que a IA mais ajuda (ex.: anúncio e roteiro de entrevista).',
          'Defina como você validará os resultados (quem revisa, quais fontes consultar).',
          'Descreva quais dados serão enviados à IA e como serão anonimizados, considerando a preocupação do jurídico.',
          'Inclua cuidados para prevenir vieses e indique claramente onde a IA não atuará.',
        ],
        advancedChallenge:
          'Inclua uma matriz de avaliação com pesos definidos previamente, um plano de monitoramento agregado de vieses e uma mensagem de transparência aos candidatos sobre o uso de IA no processo.',
        socraticQuestions: [
          'Em quais etapas do seu processo a IA traz mais ganho de tempo, e em quais o risco supera o benefício?',
          'Como a diretriz de diversidade da diretoria aparece concretamente nos seus prompts e critérios?',
          'Considerando que a empresa é da área de saúde, que dados você garantiria que nunca chegassem à ferramenta de IA?',
          'Se um resultado da IA estiver errado, em que ponto do seu fluxo ele seria detectado?',
        ],
        hints: [
          'Use o mesmo padrão do módulo 3: para cada etapa, "IA faz X → pessoa Y revisa → cuidado Z".',
          'Seus dois prompts devem ter os cinco elementos. Bons candidatos: descrição de vaga (com linguagem inclusiva e sem inventar benefícios) e roteiro de entrevista estruturada (sem perguntas pessoais).',
          'Não esqueça: anonimização de candidaturas, proibição de dados de saúde, critérios ligados ao trabalho, decisão final com gestor e RH, validação de informações legais com o jurídico e comunicação transparente aos candidatos.',
        ],
        modelAnswer: `**Proposta de referência (resumida)**

**1. Etapas**

| Etapa | IA | Responsável humano | Cuidado |
|---|---|---|---|
| Perfil da vaga | Organiza anotações do gestor em competências e critérios observáveis | Gestor valida pesos antes da abertura | Requisitos desnecessários |
| Anúncio | Rascunha texto inclusivo | Recrutadora revisa; gestor aprova | Benefícios inventados, linguagem excludente |
| Triagem | Resume evidências de candidaturas **anonimizadas** frente aos critérios | Recrutadora decide quem avança | Viés; IA não ranqueia nem reprova |
| Entrevistas | Sugere roteiro estruturado e escala | Recrutadora e gestor conduzem e avaliam individualmente | Perguntas pessoais |
| Decisão | — | Gestor e RH, com base na matriz | Decisão exclusivamente humana |
| Retorno | Rascunha modelos de mensagem | Recrutadora personaliza fora da ferramenta | Motivos inventados |

**2. Prompts**

*Anúncio:* "Atue como especialista em employer branding. Contexto: Grupo Ipê Saúde (fictício), rede de 12 clínicas de diagnóstico por imagem em PE e PB, em expansão. Objetivo: anúncio de Analista de RH Pleno Generalista (recrutamento, onboarding, clima e indicadores). Restrições: até 300 palavras; linguagem inclusiva e neutra; separar requisitos obrigatórios e desejáveis; incentivar candidaturas de grupos sub-representados; não mencionar benefícios nem salário; não inventar informações. Formato: Título, Sobre o Grupo Ipê, O que você vai fazer, Requisitos, Diferenciais, Como será o processo."

*Roteiro:* "Atue como especialista em seleção por competências. Crie roteiro de entrevista estruturada para a vaga acima com 1 pergunta comportamental por competência: recrutamento e seleção, legislação trabalhista básica, análise em planilhas, comunicação com lideranças. Proibido: perguntas sobre vida pessoal, idade, família, saúde, religião. Formato: tabela Competência | Pergunta | Sinais de boa resposta | Escala 1–5."

**3. Validação:** gestor valida requisitos; afirmações legais conferidas com o jurídico; recrutadora confere resumos com as candidaturas originais; amostra revisada por uma segunda pessoa.

**4. Privacidade:** apenas evidências profissionais com códigos (Candidato A, B...); nenhum dado de contato, documento, foto ou dado de saúde enviado à IA; uso exclusivo da ferramenta corporativa aprovada.

**5. Vieses:** restrições explícitas nos prompts; revisão de linguagem; critérios definidos antes das entrevistas; monitoramento agregado das taxas de avanço.

**6. Supervisão humana:** a IA não decide quem avança nem quem é contratado; decisões registradas com evidências.

**Indicadores:** tempo por etapa, satisfação do gestor, taxa de resposta aos candidatos e taxas de avanço por etapa (análise agregada).`,
        maxAttempts: 5,
        passingScore: 70,
        rubric: {
          title: 'Rubrica — Desafio final',
          description: 'Avalia a integração das seis competências desenvolvidas no curso.',
          criteria: [
            {
              key: 'compreensao_conceitual',
              name: 'Compreensão conceitual',
              description: 'Demonstra entender o que a IA faz bem e suas limitações.',
              weight: 1,
              indicators: ['Atribui à IA tarefas adequadas', 'Reconhece limitações e riscos de erro'],
            },
            {
              key: 'qualidade_solucao',
              name: 'Qualidade dos prompts e do processo',
              description: 'Prompts completos e processo coerente de ponta a ponta.',
              weight: 3,
              indicators: [
                'Apresenta ao menos dois prompts com papel, contexto, objetivo, restrições e formato',
                'Cobre todas as etapas do processo',
                'Considera prazo e recursos',
              ],
            },
            {
              key: 'contextualizacao',
              name: 'Contextualização',
              description: 'Usa as informações da vaga e da empresa do cenário.',
              weight: 2,
              indicators: ['Cita requisitos e contexto do Grupo Ipê Saúde', 'Considera a diretriz de diversidade'],
            },
            {
              key: 'pensamento_critico',
              name: 'Pensamento crítico e validação',
              description: 'Define como os resultados serão verificados.',
              weight: 2,
              indicators: ['Descreve mecanismos de validação', 'Indica revisões por pessoas e fontes'],
            },
            {
              key: 'uso_responsavel',
              name: 'Uso ético e privacidade',
              description: 'Anonimização, prevenção de vieses e atenção a dados sensíveis.',
              weight: 3,
              indicators: [
                'Define dados que não serão enviados à IA',
                'Inclui cuidados contra vieses',
                'Considera a sensibilidade de dados de saúde',
              ],
            },
            {
              key: 'clareza',
              name: 'Supervisão humana e clareza',
              description: 'Explicita onde a IA não atua e quem decide, de forma organizada.',
              weight: 2,
              indicators: ['Decisão final humana explícita', 'Resposta organizada por seções'],
            },
          ],
        },
        expectedKeywords: [
          'etapa',
          'prompt',
          'contexto',
          'restri',
          'formato',
          'anonim',
          'saúde',
          'saude',
          'viés',
          'vies',
          'divers',
          'gestor',
          'decis',
          'humana',
          'valida',
        ],
      },
    },
  ],
};
