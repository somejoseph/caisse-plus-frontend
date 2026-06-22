// ─── Token helpers (consommés aussi par store.tsx et upload.ts) ───────────────

export const TOKEN_KEY = 'caisse_token';
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

let _onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void): void => { _onUnauthorized = fn; };

// ─── Base URL ─────────────────────────────────────────────────────────────────

const _env = (import.meta as unknown as { env: Record<string, string> }).env;
const _envUrl: string | undefined = _env.VITE_API_URL;

export const API_BASE = _envUrl
  ? _envUrl.replace(/\/+$/, '')
  : '/api/v1';

// ─── Generic REST fetch ───────────────────────────────────────────────────────

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export async function apiFetch<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; params?: QueryParams } = {},
): Promise<T> {
  let url = `${API_BASE}${path}`;

  if (options.params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null) sp.set(k, String(v));
    }
    const q = sp.toString();
    if (q) url += `?${q}`;
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    _onUnauthorized?.();
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}) as Record<string, unknown>);
    throw new Error(
      (err as { detail?: string; title?: string; message?: string }).detail ??
      (err as { title?: string }).title ??
      (err as { message?: string }).message ??
      `Erreur ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
