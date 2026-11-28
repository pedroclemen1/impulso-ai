/** Cliente HTTP: cookies HttpOnly (credentials: include) + cabeçalho anti-CSRF exigido pela API. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

type Query = Record<string, string | number | boolean | undefined | null>;

const qs = (q?: Query) => {
  if (!q) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const res = await fetch(`/api${path}${qs(query)}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      'x-requested-with': 'XMLHttpRequest',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
    const err = json?.error ?? {};
    throw new ApiError(res.status, err.code ?? 'ERROR', err.message ?? 'Não foi possível concluir a operação.', err.details);
  }
  return json as T;
}

/** Retorna apenas o campo `data` da resposta padronizada. */
const unwrap = async <T>(p: Promise<{ data: T }>) => (await p).data;

export const api = {
  get: <T>(path: string, query?: Query) => unwrap<T>(request('GET', path, undefined, query)),
  getPage: <T>(path: string, query?: Query) => request<Paginated<T>>('GET', path, undefined, query),
  post: <T>(path: string, body: unknown = {}) => unwrap<T>(request('POST', path, body)),
  put: <T>(path: string, body: unknown) => unwrap<T>(request('PUT', path, body)),
  patch: <T>(path: string, body: unknown) => unwrap<T>(request('PATCH', path, body)),
  delete: <T>(path: string) => unwrap<T>(request('DELETE', path)),
  /** URL para download direto (CSV), usando o cookie da sessão. */
  url: (path: string, query?: Query) => `/api${path}${qs(query)}`,
};

export const errorMessage = (e: unknown) => {
  if (e instanceof ApiError) {
    const issues = (e.details as { issues?: string[] } | undefined)?.issues;
    return issues?.length ? `${e.message} ${issues.join(' ')}` : e.message;
  }
  return 'Erro inesperado. Tente novamente.';
};
