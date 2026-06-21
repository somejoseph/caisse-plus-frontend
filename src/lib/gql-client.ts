import { GraphQLClient } from 'graphql-request';

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000/graphql';

export const TOKEN_KEY = 'caisse_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

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
});
