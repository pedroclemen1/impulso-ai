export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Hash determinístico simples (FNV-1a) para escolhas reproduzíveis no provedor demonstrativo. */
export function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const SENSITIVE_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'CPF', regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { label: 'RG', regex: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dxX]\b/g },
  { label: 'e-mail', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { label: 'telefone', regex: /(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g },
];

/**
 * Proteção LGPD: identifica e mascara dados pessoais antes de enviá-los a um provedor de LLM.
 * Retorna o texto mascarado e os tipos de dados encontrados.
 */
export function redactSensitiveData(text: string): { text: string; found: string[] } {
  const found = new Set<string>();
  let out = text;
  for (const { label, regex } of SENSITIVE_PATTERNS) {
    out = out.replace(regex, () => {
      found.add(label);
      return `[${label.toUpperCase()} REMOVIDO]`;
    });
  }
  return { text: out, found: [...found] };
}

const INJECTION_PATTERNS = [
  /ignore (todas )?(as )?(instru|regras)/i,
  /ignore (all|previous|the above)/i,
  /esque[cç]a (as |suas )?(instru|regras)/i,
  /voc[eê] agora [eé]/i,
  /system prompt|prompt do sistema|suas instru[cç][oõ]es internas/i,
  /aja como (administrador|admin|sistema)/i,
  /d[eê] (nota|pontua[cç][aã]o) (m[aá]xima|100|10)/i,
];

/** Detecta tentativas de manipular o tutor/avaliador por meio do texto do estudante. */
export const looksLikePromptInjection = (text: string) => INJECTION_PATTERNS.some((r) => r.test(text));
