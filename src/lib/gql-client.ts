import { GraphQLClient } from 'graphql-request';

// En dev avec proxy Vite : les requêtes /graphql sont renvoyées vers localhost:3000.
// En prod : VITE_API_URL peut pointer vers l'URL complète du backend.
const _envUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL;
const API_URL = _envUrl
  ? _envUrl.startsWith('/')
    ? `${window.location.origin}${_envUrl}`
    : _envUrl
  : `${window.location.origin}/graphql`;

export const TOKEN_KEY = 'caisse_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Callback appelé quand le serveur répond 401 (token expiré/invalide)
let _onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void): void => { _onUnauthorized = fn; };

export const gqlClient = new GraphQLClient(API_URL, {
  requestMiddleware: (req) => {
    const token = getToken();
    return {
      ...req,
      headers: {
        ...req.headers,
        'Content-Type': 'application/json',
        'apollo-require-preflight': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  },
  responseMiddleware: (res) => {
    if (res instanceof Error && (res as { response?: { status?: number } }).response?.status === 401) {
      _onUnauthorized?.();
    }
  },
});
