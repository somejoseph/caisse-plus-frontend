import { API_BASE } from './gql-client';

const ADMIN_SESSION_KEY = 'caisse_admin_secret';

export const getAdminSecret = (): string | null =>
  sessionStorage.getItem(ADMIN_SESSION_KEY);

export const setAdminSecret = (s: string): void =>
  sessionStorage.setItem(ADMIN_SESSION_KEY, s);

export const clearAdminSecret = (): void =>
  sessionStorage.removeItem(ADMIN_SESSION_KEY);

async function adminFetch<T>(method: 'GET' | 'POST', path: string): Promise<T> {
  const secret = getAdminSecret();
  if (!secret) throw new Error('Non authentifié.');

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
  });

  if (res.status === 401) throw new Error('Clé admin invalide ou expirée.');

  if (!res.ok) {
    const err = await res.json().catch(() => ({}) as Record<string, unknown>);
    throw new Error(
      (err as { detail?: string; message?: string }).detail ??
      (err as { message?: string }).message ??
      `Erreur ${res.status}`,
    );
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalEstablishments: number;
  activeEstablishments: number;
  inactiveEstablishments: number;
  totalUsers: number;
  totalSales: number;
}

export interface AdminEstablishment {
  id: string;
  name: string;
  code: string;
  type: string;
  city: string | null;
  phone: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  salesCount: number;
  daySessionsCount: number;
  gerantsCount: number;
  proprietaireName: string | null;
  proprietairePhone: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

export interface AdminEstablishmentDetail {
  id: string;
  name: string;
  code: string;
  type: string;
  city: string | null;
  phone: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  salesCount: number;
  daySessionsCount: number;
  expensesCount: number;
  proprietaire: AdminUser | null;
  gerants: AdminUser[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const getAdminStats = () =>
  adminFetch<AdminStats>('GET', '/admin/stats');

export const getAdminEstablishments = () =>
  adminFetch<AdminEstablishment[]>('GET', '/admin/establishments');

export const getAdminEstablishmentDetail = (id: string) =>
  adminFetch<AdminEstablishmentDetail>('GET', `/admin/establishments/${id}`);

export const deactivateEstablishment = (id: string) =>
  adminFetch<{ id: string; name: string; active: boolean }>('POST', `/admin/establishments/${id}/deactivate`);

export const reactivateEstablishment = (id: string) =>
  adminFetch<{ id: string; name: string; active: boolean }>('POST', `/admin/establishments/${id}/reactivate`);

export async function verifyAdminSecret(secret: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { 'X-Admin-Secret': secret },
  });
  return res.ok;
}
