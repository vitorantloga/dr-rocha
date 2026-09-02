/** Progress shown after leaving the homepage (no “Início”). */
export const PHASES = [
  { id: 'complaint', label: 'Queixa' },
  { id: 'questions', label: 'Perguntas' },
  { id: 'result', label: 'Resultado' },
  { id: 'help', label: 'Ajuda' },
]

export const DEMO_SEEDS = [
  {
    id: 'gastro',
    label: 'Dor abdominal (eletivo)',
    text: 'Estou há uns dois meses com muita dor na barriga depois de comer, às vezes fico enjoado e já passei no pronto atendimento duas vezes.',
  },
  {
    id: 'ortho',
    label: 'Dor no joelho (eletivo)',
    text: 'Há três semanas torci o joelho jogando futebol. Continua inchado, dói ao subir escada e estou mancando.',
  },
  {
    id: 'urgent',
    label: 'Dor no peito (urgente)',
    text: 'Desde ontem à noite estou com dor forte no peito que irradia para o braço esquerdo, falta de ar e suor frio.',
  },
  {
    id: 'unclear',
    label: 'Queixa vaga (indeterminado)',
    text: 'Não estou bem há um tempo, mas não sei explicar direito. Às vezes cansaço, às vezes nada.',
  },
]

const URGENT_PATTERNS = [
  /peito/,
  /torac/,
  /infart/,
  /falta de ar/,
  /suo[rt] frio/,
  /desmaio/,
  /paralis/,
  /sangue vivo/,
  /suicid/,
]

const ORTHO_PATTERNS = [
  /joelho/,
  /torci/,
  /torceu/,
  /ombro/,
  /coluna/,
  /lombar/,
  /fratura/,
  /mancando/,
  /ortoped/,
]

const GASTRO_PATTERNS = [
  /barriga/,
  /abdominal/,
  /abdomen/,
  /est[oô]mago/,
  /enjoad/,
  /n[aá]usea/,
  /v[oô]mit/,
  /gastro/,
  /digest/,
  /refei[cç]/,
]

export function detectRoute(text) {
  const t = (text || '').toLowerCase()
  if (!t.trim() || t.trim().length < 24) return 'short'
  if (URGENT_PATTERNS.some((re) => re.test(t))) return 'urgent'
  if (ORTHO_PATTERNS.some((re) => re.test(t))) return 'ortho'
  if (GASTRO_PATTERNS.some((re) => re.test(t))) return 'gastro'
  if (/crian[cç]a|filho|beb[eê]|gestant|gr[aá]vid/.test(t)) return 'excluded'
  return 'unclear'
}

export const QUESTION_BANKS = {
  gastro: [
    {
      id: 'g1',
      prompt: 'Há quanto tempo isso começou?',
      options: ['Menos de 1 semana', '1 a 4 semanas', 'Mais de 1 mês', 'Não sei dizer'],
      suggested: 'Mais de 1 mês',
    },
    {
      id: 'g2',
      prompt: 'Onde exatamente é a dor?',
      options: ['Parte alta da barriga', 'Lado direito', 'Lado esquerdo', 'Em toda a barriga'],
      suggested: 'Parte alta da barriga',
    },
    {
      id: 'g3',
      prompt: 'Qual a intensidade de 0 a 10?',
      options: ['0–3 (leve)', '4–6 (moderada)', '7–10 (forte)'],
      suggested: '4–6 (moderada)',
    },
    {
      id: 'g4',
      prompt: 'A dor piora depois de comer?',
      options: ['Sim', 'Não', 'Às vezes', 'Não notei'],
      suggested: 'Sim',
    },
    {
      id: 'g5',
      prompt: 'Existe febre?',
      options: ['Não', 'Sim, baixa', 'Sim, alta', 'Não medi'],
      suggested: 'Não',
    },
    {
      id: 'g6',
      prompt: 'Perdeu peso sem querer?',
      options: ['Não', 'Sim, pouco', 'Sim, bastante', 'Não sei'],
      suggested: 'Não',
    },
    {
      id: 'g7',
      prompt: 'Já procurou algum médico por esse problema?',
      options: ['Não', 'Sim, pronto atendimento', 'Sim, especialista', 'Várias vezes'],
      suggested: 'Sim, pronto atendimento',
    },
    {
      id: 'g8',
      prompt: 'Fez exames relacionados a essa queixa?',
      options: ['Não', 'Sim, sem alterações claras', 'Sim, ainda aguardo', 'Não sei'],
      suggested: 'Não',
    },
  ],
  ortho: [
    {
      id: 'o1',
      prompt: 'Há quanto tempo isso começou?',
      options: ['Menos de 1 semana', '1 a 4 semanas', 'Mais de 1 mês', 'Não sei dizer'],
      suggested: '1 a 4 semanas',
    },
    {
      id: 'o2',
      prompt: 'Onde exatamente é a dor?',
      options: ['Joelho', 'Tornozelo', 'Ombro', 'Coluna / costas'],
      suggested: 'Joelho',
    },
    {
      id: 'o3',
      prompt: 'Houve trauma, torção ou queda?',
      options: ['Sim', 'Não', 'Não tenho certeza'],
      suggested: 'Sim',
    },
    {
      id: 'o4',
      prompt: 'Consegue apoiar o peso normalmente?',
      options: ['Sim', 'Com dificuldade', 'Não consigo', 'Varia'],
      suggested: 'Com dificuldade',
    },
    {
      id: 'o5',
      prompt: 'Há inchaço ou deformidade visível?',
      options: ['Não', 'Inchaço leve', 'Inchaço importante', 'Não sei avaliar'],
      suggested: 'Inchaço leve',
    },
    {
      id: 'o6',
      prompt: 'A dor acorda você à noite?',
      options: ['Não', 'Às vezes', 'Com frequência'],
      suggested: 'Às vezes',
    },
    {
      id: 'o7',
      prompt: 'Já procurou atendimento por isso?',
      options: ['Não', 'Sim, pronto atendimento', 'Sim, ortopedista', 'Fisioterapia'],
      suggested: 'Não',
    },
  ],
  unclear: [
    {
      id: 'u1',
      prompt: 'Há quanto tempo você se sente assim?',
      options: ['Dias', 'Semanas', 'Meses', 'Não sei'],
      suggested: 'Semanas',
    },
    {
      id: 'u2',
      prompt: 'O que mais incomoda no dia a dia?',
      options: ['Cansaço', 'Dor', 'Mal-estar geral', 'Vários sintomas juntos'],
      suggested: 'Cansaço',
    },
    {
      id: 'u3',
      prompt: 'Os sintomas estão piorando?',
      options: ['Não', 'Um pouco', 'Sim, claramente', 'Não sei'],
      suggested: 'Um pouco',
    },
    {
      id: 'u4',
      prompt: 'Existe febre, falta de ar ou dor no peito?',
      options: ['Não', 'Febre', 'Falta de ar', 'Dor no peito'],
      suggested: 'Não',
    },
    {
      id: 'u5',
      prompt: 'Já passou com algum médico recentemente?',
      options: ['Não', 'Clínico geral', 'Vários especialistas', 'Só pronto atendimento'],
      suggested: 'Não',
    },
    {
      id: 'u6',
      prompt: 'Consegue descrever um sintoma principal com mais detalhe?',
      options: ['Ainda não', 'Sim, mas é confuso', 'Prefiro ajuda humana'],
      suggested: 'Prefiro ajuda humana',
    },
  ],
  urgent: [
    {
      id: 'ur1',
      prompt: 'A dor no peito ainda está presente agora?',
      options: ['Sim', 'Melhorou um pouco', 'Já passou', 'Não sei'],
      suggested: 'Sim',
    },
    {
      id: 'ur2',
      prompt: 'Há falta de ar, suor frio ou irradiação para o braço/mandíbula?',
      options: ['Sim', 'Não', 'Não tenho certeza'],
      suggested: 'Sim',
    },
    {
      id: 'ur3',
      prompt: 'Isso começou de forma súbita?',
      options: ['Sim', 'Foi piorando', 'Não sei'],
      suggested: 'Sim',
    },
  ],
}

export const RESULTS = {
  gastro: {
    kind: 'elective',
    specialty: 'Gastroenterologia',
    alternatives: ['Clínica Médica', 'Cirurgia do Aparelho Digestivo'],
    body: 'Pelas informações que você forneceu, Gastroenterologia parece ser uma das especialidades mais adequadas para iniciar a avaliação da sua queixa.',
  },
  ortho: {
    kind: 'elective',
    specialty: 'Ortopedia',
    alternatives: ['Clínica Médica', 'Reumatologia'],
    body: 'Pelas informações que você forneceu, Ortopedia parece ser uma das especialidades mais adequadas para iniciar a avaliação da sua queixa.',
  },
  urgent: {
    kind: 'urgent',
    title: 'Avaliação presencial rápida',
    body: 'Identificamos informações que merecem avaliação presencial rápida. Pelas respostas fornecidas, não recomendamos aguardar uma consulta eletiva ou contato da nossa equipe. Procure um serviço de urgência/emergência.',
  },
  unclear: {
    kind: 'indeterminate',
    title: 'Não foi possível determinar uma especialidade com segurança',
    body: 'As informações ainda são amplas demais para um direcionamento seguro só pelo fluxo automático. O próximo passo adequado é uma avaliação humana da sua queixa.',
  },
  excluded: {
    kind: 'indeterminate',
    title: 'Este fluxo não é o mais adequado',
    body: 'Pelo que você descreveu, o caminho automático do Dr. Rocha não deve ser usado sozinho. Busque orientação humana apropriada ao seu contexto (por exemplo, atendimento pediátrico, pré-natal ou serviço de emergência).',
  },
  short: {
    kind: 'indeterminate',
    title: 'Precisamos de um pouco mais de detalhe',
    body: 'A descrição ficou curta demais para orientar com segurança. Volte e conte o que está acontecendo com suas palavras — sintomas, há quanto tempo e o que mais preocupa você.',
  },
}

export function buildHistory({ complaint, route, answers, questions, result }) {
  const lines = []
  lines.push('Histórico Dr. Rocha')
  lines.push('—')
  lines.push(`Queixa: ${complaint}`)
  lines.push(`Rota: ${route}`)
  if (questions?.length) {
    lines.push('Perguntas:')
    questions.forEach((q) => {
      lines.push(`• ${q.prompt} → ${answers[q.id] || '—'}`)
    })
  }
  if (result?.kind === 'elective') {
    lines.push(`Orientação: ${result.specialty}`)
  } else if (result) {
    lines.push(`Orientação: ${result.title}`)
  }
  return lines.join('\n')
}
