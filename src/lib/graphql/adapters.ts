import type { Category, ServerRole } from '@/lib/mock-data';
import type { UserRole, NotifTone, TableStatus } from '@/lib/store';

// ─── API enum key → frontend display string ──────────────────────────────────

export const CATEGORY_LABEL: Record<string, Category> = {
  Bieres: 'Bières',
  Spiritueux: 'Spiritueux',
  Vins: 'Vins',
  Softs: 'Softs',
  Eaux: 'Eaux',
  Liqueurs: 'Liqueurs',
};

export const METHOD_LABEL: Record<string, string> = {
  Especes: 'Espèces',
  MobileMoney: 'Mobile Money',
  Credit: 'Crédit',
};

export const STATUS_LABEL: Record<string, string> = {
  Payee: 'Payée',
  NonPayee: 'Non payée',
  Annulee: 'Annulée',
};

export const TABLE_STATUS_LABEL: Record<string, TableStatus> = {
  Libre: 'Libre',
  Occupee: 'Occupée',
  Addition: 'Addition',
};

export const SERVER_ROLE_LABEL: Record<string, ServerRole> = {
  Serveur: 'Serveur(e)',
  Gerant: 'Gérant(e)',
};

export const USER_ROLE_LABEL: Record<string, UserRole> = {
  Proprietaire: 'Propriétaire',
  Gerant: 'Gérant',
};

// ─── Frontend display string → API enum key ───────────────────────────────────

export const CATEGORY_KEY: Record<string, string> = {
  Bières: 'Bieres',
  Spiritueux: 'Spiritueux',
  Vins: 'Vins',
  Softs: 'Softs',
  Eaux: 'Eaux',
  Liqueurs: 'Liqueurs',
};

export const METHOD_KEY: Record<string, string> = {
  Espèces: 'Especes',
  'Mobile Money': 'MobileMoney',
  Crédit: 'Credit',
};

export const TABLE_STATUS_KEY: Record<string, string> = {
  Libre: 'Libre',
  Occupée: 'Occupee',
  Addition: 'Addition',
};

export const SERVER_ROLE_KEY: Record<string, string> = {
  'Serveur(e)': 'Serveur',
  'Gérant(e)': 'Gerant',
};

// ─── NotifTone — same values in DB and frontend ───────────────────────────────
export function toNotifTone(v: string): NotifTone {
  const valid: NotifTone[] = ['info', 'warning', 'success', 'danger'];
  return valid.includes(v as NotifTone) ? (v as NotifTone) : 'info';
}

// ─── Time helper ─────────────────────────────────────────────────────────────
export function fmtTime(iso: string): string {
  if (!iso) return '—';
  // PostgreSQL @db.Time(6) retourne "HH:MM:SS.ffffff" sans date
  if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(11, 16) || iso;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(11, 16);
  }
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return iso;
  }
}
