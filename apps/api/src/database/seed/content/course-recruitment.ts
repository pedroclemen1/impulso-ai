import { recruitmentModule1 } from './recruitment-module-1';
import { recruitmentModule2 } from './recruitment-module-2';
import { recruitmentModule3 } from './recruitment-module-3';
import { recruitmentModule4 } from './recruitment-module-4';
import { recruitmentModule5 } from './recruitment-module-5';
import { recruitmentModule6 } from './recruitment-module-6';
import type { SeedAssessment, SeedCourse } from './types';

const LIKERT_AGREEMENT = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];

const diagnostic: SeedAssessment = {
  kind: 'DIAGNOSTIC',
  title: 'Diagnóstico inicial — IA no recrutamento',
  description:
    'Este diagnóstico nos ajuda a entender sua familiaridade com inteligência artificial e seu contexto profissional para personalizar sua trilha. Não há aprovação ou reprovação: responda com sinceridade. Todos os conteúdos fundamentais ficam disponíveis, independentemente do resultado.',
  passingScore: 0,
  maxAttempts: 1,
  questions: [
    {
      type: 'LIKERT',
      dimension: 'FAMILIARITY',
      prompt: 'Como você avalia sua familiaridade com inteligência artificial?',
      selfReported: true,
      likertLabels: ['Nenhuma', 'Pouca', 'Moderada', 'Boa', 'Muito boa'],
    },
    {
      type: 'SINGLE_CHOICE',
      dimension: 'FREQUENCY',
      prompt: 'Com que frequência você utiliza ferramentas de IA (como ChatGPT, Gemini ou Claude) no trabalho?',
      selfReported: true,
      options: [
        { label: 'Nunca utilizei', score: 0 },
        { label: 'Já testei uma ou duas vezes', score: 25 },
        { label: 'Algumas vezes por mês', score: 50 },
        { label: 'Algumas vezes por semana', score: 75 },
        { label: 'Diariamente', score: 100 },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE',
      dimension: 'TOOLS',
      prompt: 'Quais ferramentas de IA você já utilizou? (selecione todas que se aplicam)',
      selfReported: true,
      isScored: false,
      options: [
        { label: 'ChatGPT' },
        { label: 'Google Gemini' },
        { label: 'Claude' },
        { label: 'Microsoft Copilot' },
        { label: 'Recursos de IA do ATS ou do LinkedIn' },
        { label: 'Nenhuma' },
      ],
    },
    {
      type: 'SINGLE_CHOICE',
      dimension: 'LLM_KNOWLEDGE',
      competencyKey: 'ai_fundamentals',
      prompt: 'O que é um LLM (Large Language Model)?',
      explanation: 'LLMs são modelos treinados com grandes volumes de texto que geram linguagem prevendo sequências prováveis.',
      options: [
        { label: 'Um banco de dados que armazena respostas prontas para cada pergunta.', isCorrect: false },
        { label: 'Um modelo treinado com grandes volumes de texto que gera respostas prevendo sequências prováveis de palavras.', isCorrect: true },
        { label: 'Um sistema de busca que sempre consulta a internet em tempo real.', isCorrect: false },
        { label: 'Um programa que entende emoções humanas como uma pessoa.', isCorrect: false },
        { label: 'Não sei.', isCorrect: false },
      ],
    },
    {
      type: 'TRUE_FALSE',
      dimension: 'LLM_KNOWLEDGE',
      competencyKey: 'ai_fundamentals',
      prompt: 'Uma ferramenta de IA generativa sempre utiliza informações atualizadas da internet para responder.',
      explanation: 'Muitos modelos respondem apenas com base no que aprenderam no treinamento e podem estar desatualizados.',
      options: [
        { label: 'Verdadeiro', isCorrect: false },
        { label: 'Falso', isCorrect: true },
      ],
    },
    {
      type: 'SCENARIO',
      dimension: 'PROMPTING',
      competencyKey: 'prompt_engineering',
      prompt: 'Você precisa que a IA crie uma descrição de vaga. Qual destes pedidos tende a gerar o melhor resultado?',
      explanation: 'O melhor prompt combina contexto, objetivo, restrições e formato de saída.',
      options: [
        { label: '"Crie uma vaga."', score: 0, isCorrect: false },
        { label: '"Crie uma descrição de vaga para analista de RH."', score: 30, isCorrect: false },
        {
          label: '"Crie uma descrição de vaga para Analista de RH Pleno em uma rede de clínicas, com foco em recrutamento; seja detalhado."',
          score: 60,
          isCorrect: false,
        },
        {
          label:
            '"Atue como especialista em recrutamento. Crie uma descrição de vaga para Analista de RH Pleno em uma rede de clínicas em expansão, com foco em recrutamento e integração; até 250 palavras, linguagem inclusiva, sem inventar benefícios, em seções: Sobre a empresa, Responsabilidades, Requisitos."',
          score: 100,
          isCorrect: true,
        },
      ],
    },
    {
      type: 'TRUE_FALSE',
      dimension: 'LIMITATIONS',
      competencyKey: 'critical_thinking',
      prompt: 'Uma IA pode apresentar informações inventadas com aparência de verdade, como estatísticas ou leis inexistentes.',
      explanation: 'Esse fenômeno é chamado de alucinação e exige verificação das informações.',
      options: [
        { label: 'Verdadeiro', isCorrect: true },
        { label: 'Falso', isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      dimension: 'LIMITATIONS',
      competencyKey: 'critical_thinking',
      prompt:
        'A IA afirmou: "Segundo pesquisa de 2024, 87,3% dos analistas de dados preferem trabalho remoto." O que você faz com essa informação?',
      explanation: 'Números precisos sem fonte verificável devem ser confirmados antes de qualquer uso.',
      options: [
        { label: 'Uso no relatório, pois a IA citou uma pesquisa.', score: 0, isCorrect: false },
        { label: 'Arredondo para 87% e uso.', score: 0, isCorrect: false },
        { label: 'Pergunto à IA se ela tem certeza e uso se ela confirmar.', score: 30, isCorrect: false },
        { label: 'Procuro a fonte original; se não encontrar uma fonte confiável, não uso o dado.', score: 100, isCorrect: true },
      ],
    },
    {
      type: 'SINGLE_CHOICE',
      dimension: 'RECRUITMENT_AI',
      competencyKey: 'ai_recruitment',
      prompt: 'Qual destas tarefas é um uso adequado da IA generativa no recrutamento?',
      explanation: 'Rascunhar roteiros de entrevista é um bom uso, desde que haja revisão humana. Decisões sobre pessoas devem ser humanas.',
      options: [
        { label: 'Decidir automaticamente quais candidatos serão contratados.', isCorrect: false },
        { label: 'Rascunhar um roteiro de entrevista estruturada para revisão do recrutador.', isCorrect: true },
        { label: 'Avaliar a personalidade de candidatos a partir de fotos.', isCorrect: false },
        { label: 'Definir sozinha a faixa salarial da vaga.', isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      dimension: 'RECRUITMENT_AI',
      competencyKey: 'workflow_design',
      prompt:
        'Você recebeu 300 candidaturas e quer usar IA para ganhar tempo na triagem. Qual abordagem é mais adequada?',
      explanation: 'A IA pode organizar evidências de dados anonimizados com critérios definidos, mas a decisão é do recrutador.',
      options: [
        { label: 'Pedir que a IA reprove automaticamente os candidatos menos aderentes.', score: 0, isCorrect: false },
        { label: 'Pedir que a IA ordene os candidatos do melhor para o pior e chamar os 10 primeiros.', score: 20, isCorrect: false },
        {
          label:
            'Definir critérios com o gestor, usar a IA para organizar evidências de candidaturas anonimizadas e decidir quem avança com base nos critérios.',
          score: 100,
          isCorrect: true,
        },
        { label: 'Não usar critérios definidos e confiar na intuição da IA.', score: 0, isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      dimension: 'PRIVACY',
      competencyKey: 'responsible_ai',
      prompt:
        'Um colega quer colar currículos completos de candidatos, com CPF e telefone, em uma ferramenta de IA gratuita para "resumir mais rápido". O que você recomenda?',
      explanation: 'Dados pessoais não devem ser enviados a ferramentas não aprovadas; anonimize e use apenas ferramentas corporativas aprovadas.',
      options: [
        { label: 'Pode enviar, pois a ferramenta é muito usada.', score: 0, isCorrect: false },
        { label: 'Pode enviar, desde que apague o histórico depois.', score: 10, isCorrect: false },
        { label: 'Remover apenas o CPF e enviar o restante.', score: 40, isCorrect: false },
        {
          label:
            'Não enviar; usar apenas ferramentas aprovadas pela empresa e, se necessário, anonimizar removendo dados pessoais e trocando nomes por códigos.',
          score: 100,
          isCorrect: true,
        },
      ],
    },
    {
      type: 'LIKERT',
      dimension: 'CONFIDENCE',
      prompt: 'Sinto-me confiante para usar IA no meu trabalho de forma segura e responsável.',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'MULTIPLE_CHOICE',
      dimension: 'GOALS',
      prompt: 'Quais são seus principais objetivos com este curso? (selecione até três)',
      isScored: false,
      options: [
        { label: 'Entender o básico sobre IA' },
        { label: 'Escrever prompts melhores' },
        { label: 'Ganhar tempo em tarefas repetitivas' },
        { label: 'Melhorar descrições de vagas e roteiros de entrevista' },
        { label: 'Usar IA com segurança e respeito à LGPD' },
        { label: 'Liderar a adoção de IA na minha equipe' },
      ],
    },
    {
      type: 'OPEN',
      dimension: 'ACTIVITIES',
      prompt: 'Descreva brevemente as principais atividades que você desempenha no seu trabalho.',
      helpText: 'Ex.: abertura de vagas, triagem, entrevistas, comunicação com candidatos, relatórios. Não inclua dados pessoais de terceiros.',
      isScored: false,
    },
    {
      type: 'OPEN',
      dimension: 'CHALLENGES',
      prompt: 'Quais são as principais dificuldades que você enfrenta hoje no seu trabalho?',
      helpText: 'Ex.: volume de candidaturas, falta de tempo, alinhamento com gestores, padronização de entrevistas.',
      isScored: false,
    },
  ],
};

const finalAssessment: SeedAssessment = {
  kind: 'FINAL',
  title: 'Avaliação final — IA aplicada ao recrutamento e seleção',
  description:
    'Avaliação somativa com 12 questões sobre as seis competências do curso. É necessário atingir 70% para aprovação. Você terá até duas tentativas.',
  passingScore: 70,
  maxAttempts: 2,
  questions: [
    {
      type: 'SINGLE_CHOICE',
      competencyKey: 'ai_fundamentals',
      prompt: 'Qual afirmação descreve corretamente o funcionamento de um LLM?',
      explanation: 'LLMs geram texto prevendo os tokens mais prováveis a partir do contexto recebido.',
      options: [
        { label: 'Ele consulta uma base de respostas verificadas.', isCorrect: false },
        { label: 'Ele gera texto prevendo os próximos tokens mais prováveis a partir do contexto.', isCorrect: true },
        { label: 'Ele compreende o mundo da mesma forma que uma pessoa.', isCorrect: false },
        { label: 'Ele só responde perguntas que já viu durante o treinamento.', isCorrect: false },
      ],
    },
    {
      type: 'TRUE_FALSE',
      competencyKey: 'ai_fundamentals',
      prompt: 'Se uma informação importante não está na janela de contexto, o modelo pode preencher a lacuna com conteúdo genérico ou inventado.',
      explanation: 'O modelo só usa o que está no contexto; lacunas tendem a ser preenchidas com o que é estatisticamente provável.',
      options: [
        { label: 'Verdadeiro', isCorrect: true },
        { label: 'Falso', isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      competencyKey: 'prompt_engineering',
      prompt: 'A IA gerou um roteiro de entrevista longo e genérico. Qual ajuste no prompt é mais eficaz?',
      explanation: 'Contexto da vaga, limite de perguntas, competências e formato orientam um resultado útil.',
      options: [
        { label: '"Melhore o roteiro."', score: 10, isCorrect: false },
        { label: '"Seja mais criativo."', score: 0, isCorrect: false },
        {
          label:
            '"Para a vaga de Supervisor de Logística, crie 5 perguntas comportamentais, uma por competência (liderança, planejamento, resolução de problemas, comunicação, segurança), em tabela com sinais de boa resposta."',
          score: 100,
          isCorrect: true,
        },
        { label: '"Crie mais perguntas."', score: 0, isCorrect: false },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE',
      competencyKey: 'prompt_engineering',
      prompt: 'Quais restrições são recomendadas em prompts de recrutamento? (selecione todas as corretas)',
      explanation: 'Fidelidade às informações, linguagem inclusiva e proibição de critérios pessoais são restrições essenciais.',
      options: [
        { label: '"Use apenas as informações fornecidas; não invente benefícios."', isCorrect: true },
        { label: '"Use linguagem inclusiva e neutra em gênero."', isCorrect: true },
        { label: '"Priorize candidatos jovens."', isCorrect: false },
        { label: '"Não inclua perguntas sobre vida pessoal, idade ou família."', isCorrect: true },
      ],
    },
    {
      type: 'SINGLE_CHOICE',
      competencyKey: 'ai_recruitment',
      prompt: 'Qual é a melhor forma de usar IA na comunicação de retorno a candidatos não aprovados?',
      explanation: 'Modelos respeitosos com campos variáveis, sem motivos inventados e revisados pelo recrutador.',
      options: [
        { label: 'Deixar a IA enviar mensagens automaticamente com justificativas que ela mesma criar.', isCorrect: false },
        { label: 'Criar modelos respeitosos com campos variáveis, sem motivos inventados, revisados antes do envio.', isCorrect: true },
        { label: 'Não enviar retorno, pois a IA não consegue personalizar.', isCorrect: false },
        { label: 'Colar os dados completos de cada candidato na IA para personalizar.', isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      competencyKey: 'ai_recruitment',
      prompt: 'O gestor enviou anotações soltas sobre uma nova vaga. Como a IA pode ajudar de forma mais útil?',
      explanation: 'Organizar o material em competências, anúncio e roteiro coerentes, com validação do gestor.',
      options: [
        { label: 'Publicar diretamente o anúncio gerado pela IA.', score: 10, isCorrect: false },
        {
          label: 'Organizar as anotações em competências, gerar rascunho do anúncio e do roteiro de entrevista e validar tudo com o gestor.',
          score: 100,
          isCorrect: true,
        },
        { label: 'Pedir à IA que complete os requisitos que o gestor esqueceu.', score: 20, isCorrect: false },
        { label: 'Gerar apenas o anúncio e definir os critérios depois das entrevistas.', score: 40, isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      competencyKey: 'critical_thinking',
      prompt:
        'A IA afirma que "a legislação permite exigir certidão de antecedentes criminais para qualquer vaga". O que fazer?',
      explanation: 'Afirmações jurídicas categóricas exigem verificação com fontes oficiais e com o jurídico.',
      options: [
        { label: 'Aplicar a regra, pois a IA citou a legislação.', score: 0, isCorrect: false },
        { label: 'Pedir que a IA confirme e aplicar se ela repetir.', score: 20, isCorrect: false },
        { label: 'Consultar o jurídico e fontes oficiais antes de qualquer uso.', score: 100, isCorrect: true },
        { label: 'Aplicar apenas em vagas de gestão.', score: 0, isCorrect: false },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE',
      competencyKey: 'critical_thinking',
      prompt: 'Quais elementos tornam a supervisão humana efetiva? (selecione todos os corretos)',
      explanation: 'Competência, autoridade para alterar, tempo real para revisar e registro.',
      options: [
        { label: 'Quem revisa entende do assunto e dos riscos.', isCorrect: true },
        { label: 'Quem revisa pode rejeitar ou alterar o resultado.', isCorrect: true },
        { label: 'A revisão é feita apenas lendo a última linha do resumo.', isCorrect: false },
        { label: 'Há registro de quem aprovou e com base em quê.', isCorrect: true },
      ],
    },
    {
      type: 'TRUE_FALSE',
      competencyKey: 'responsible_ai',
      prompt: 'Substituir o nome de um candidato por um código (pseudonimização) torna os dados totalmente anônimos perante a LGPD.',
      explanation: 'Dados pseudonimizados continuam sendo dados pessoais, pois podem ser reassociados à pessoa.',
      options: [
        { label: 'Verdadeiro', isCorrect: false },
        { label: 'Falso', isCorrect: true },
      ],
    },
    {
      type: 'SCENARIO',
      competencyKey: 'responsible_ai',
      prompt: 'A IA sugeriu "priorizar candidatos que morem perto da empresa, em bairros de classe média". Como você avalia esse critério?',
      explanation: 'Critérios baseados em local de moradia podem funcionar como proxies discriminatórios de renda e origem.',
      options: [
        { label: 'Adequado, pois reduz atrasos.', score: 0, isCorrect: false },
        { label: 'Adequado apenas para vagas operacionais.', score: 0, isCorrect: false },
        {
          label: 'Inadequado: funciona como proxy de renda e origem social; deve ser substituído por critérios ligados ao trabalho, como disponibilidade para o horário.',
          score: 100,
          isCorrect: true,
        },
        { label: 'Neutro, desde que não seja divulgado.', score: 0, isCorrect: false },
      ],
    },
    {
      type: 'SINGLE_CHOICE',
      competencyKey: 'workflow_design',
      prompt: 'Em um fluxo de recrutamento assistido por IA, em qual etapa a IA NÃO deve atuar de forma autônoma?',
      explanation: 'A decisão sobre aprovação e contratação de pessoas deve ser humana.',
      options: [
        { label: 'Rascunho do anúncio.', isCorrect: false },
        { label: 'Sugestão de roteiro de entrevista.', isCorrect: false },
        { label: 'Decisão sobre quem é aprovado ou contratado.', isCorrect: true },
        { label: 'Rascunho do relatório semanal de vagas.', isCorrect: false },
      ],
    },
    {
      type: 'SCENARIO',
      competencyKey: 'workflow_design',
      prompt: 'Qual descrição de etapa de fluxo está mais completa?',
      explanation: 'Uma etapa bem definida inclui papel da IA, responsável humano e riscos.',
      options: [
        { label: '"Triagem: IA."', score: 0, isCorrect: false },
        { label: '"Triagem: a IA classifica os candidatos e o recrutador confere os aprovados."', score: 30, isCorrect: false },
        {
          label:
            '"Triagem: a IA resume evidências de candidaturas anonimizadas frente a critérios definidos com o gestor; o recrutador decide quem avança e registra a evidência; risco: vieses — monitorar taxas de avanço."',
          score: 100,
          isCorrect: true,
        },
        { label: '"Triagem: o recrutador faz tudo sem IA."', score: 40, isCorrect: false },
      ],
    },
  ],
};

const satisfaction: SeedAssessment = {
  kind: 'SATISFACTION',
  title: 'Pesquisa de satisfação e aplicabilidade',
  description: 'Sua opinião nos ajuda a melhorar o curso. As respostas são autodeclaradas e não afetam sua nota.',
  passingScore: 0,
  maxAttempts: 1,
  questions: [
    {
      type: 'LIKERT',
      prompt: 'De forma geral, estou satisfeito(a) com o curso.',
      helpText: 'SATISFACAO',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'LIKERT',
      prompt: 'O tutor de IA me ajudou a refletir e a melhorar minhas respostas.',
      helpText: 'SATISFACAO',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'LIKERT',
      prompt: 'Sinto-me capaz de aplicar o que aprendi em situações reais do meu trabalho.',
      helpText: 'APLICABILIDADE',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'LIKERT',
      prompt: 'Pretendo aplicar, nas próximas semanas, pelo menos uma prática do curso no meu processo seletivo.',
      helpText: 'APLICABILIDADE',
      selfReported: true,
      likertLabels: LIKERT_AGREEMENT,
    },
    {
      type: 'OPEN',
      prompt: 'Deixe um comentário ou sugestão sobre o curso (opcional).',
      isScored: false,
    },
  ],
};

export const recruitmentCourse: SeedCourse = {
  slug: 'ia-recrutamento-selecao',
  title: 'Inteligência Artificial Aplicada ao Recrutamento e Seleção',
  description:
    'Um curso prático para profissionais de RH e recrutamento que querem usar inteligência artificial com segurança e senso crítico. Você vai entender como funcionam os modelos de linguagem, escrever prompts eficazes, aplicar IA em descrições de vagas, entrevistas e comunicação com candidatos, validar resultados e agir com ética, respeito à LGPD e prevenção de vieses — sempre com um tutor socrático acompanhando seu raciocínio.',
  objectives: [
    'Explicar o que são IA generativa e LLMs, suas capacidades e limitações.',
    'Elaborar prompts contextualizados, com restrições e formato de saída adequados.',
    'Aplicar IA em atividades de recrutamento e seleção com revisão humana.',
    'Validar criticamente respostas de IA e identificar alucinações.',
    'Utilizar IA com responsabilidade, respeitando a LGPD e prevenindo vieses.',
    'Desenhar fluxos de trabalho assistidos por IA com supervisão humana.',
  ],
  targetAudience:
    'Analistas, assistentes e especialistas de recursos humanos, recrutamento e seleção e talent acquisition, inclusive quem nunca usou ferramentas de IA.',
  prerequisites: 'Nenhum pré-requisito técnico. Recomenda-se experiência básica com rotinas de recrutamento.',
  difficulty: 'BEGINNER',
  estimatedHours: 6,
  coverColor: 'indigo',
  competencyKeys: [
    'ai_fundamentals',
    'prompt_engineering',
    'ai_recruitment',
    'critical_thinking',
    'responsible_ai',
    'workflow_design',
  ],
  addieNotes: {
    analysis:
      'A análise parte do diagnóstico inicial, que combina autopercepção (familiaridade, frequência e confiança) com questões objetivas e cenários práticos sobre LLMs, prompts, limitações, privacidade e aplicação no recrutamento. As respostas abertas sobre atividades e dificuldades profissionais contextualizam as necessidades de cada participante e orientam a personalização da trilha.',
    design:
      'O design instrucional organiza seis competências em seis módulos progressivos — dos fundamentos ao desafio integrador. Cada aula segue a jornada Aprender, Contextualizar, Praticar, Refletir, Aprimorar e Consolidar, com objetivos explícitos, rubricas transparentes por atividade e avaliações formativas (quizzes de módulo) e somativas (avaliação final).',
    development:
      'Os conteúdos foram desenvolvidos com textos objetivos, exemplos de antes e depois de prompts, estudos de caso fictícios do cotidiano de recrutamento, explicações introdutórias para iniciantes, aprofundamentos para participantes avançados, pistas progressivas e soluções comentadas. Todos os dados de exercícios são fictícios.',
    implementation:
      'O curso é disponibilizado por alocação individual ou por turma, com prazos opcionais. O progresso é salvo automaticamente e reflete atividades efetivamente concluídas. O tutor de IA acompanha cada atividade com feedback socrático, e a coordenação monitora participação, engajamento e dificuldades pelo painel administrativo.',
    evaluation:
      'A avaliação compara a parte objetiva do diagnóstico inicial com a avaliação final (evolução em pontos percentuais e ganho normalizado), acompanha o domínio por competência e a evolução entre a primeira e a última tentativa das atividades, e coleta satisfação e aplicabilidade profissional autodeclaradas — sempre diferenciando dados autodeclarados de resultados objetivos.',
  },
  diagnostic,
  modules: [
    recruitmentModule1,
    recruitmentModule2,
    recruitmentModule3,
    recruitmentModule4,
    recruitmentModule5,
    recruitmentModule6,
  ],
  finalAssessment,
  satisfaction,
};
