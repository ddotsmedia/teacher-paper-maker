export interface ApiError {
  error: string;
  issues?: Record<string, string>;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: ApiError;
}

/** Client-side JSON fetch helper with typed success/error handling. */
export async function apiRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const error = (payload as ApiError | null) ?? { error: 'Request failed' };
    return { ok: false, status: response.status, data: null, error };
  }

  return { ok: true, status: response.status, data: payload as T };
}
