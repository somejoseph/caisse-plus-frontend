import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { setToken, clearToken } from "./gql-client";

export type UserRole = "Propriétaire" | "Gérant";
export type NotifTone = "info" | "warning" | "success" | "danger";
export type TableStatus = "Libre" | "Occupée" | "Addition";

export interface TableItem {
  id: string;
  name: string;
  status: TableStatus;
  seats: number;
}

export interface ServerItem {
  id: string;
  name: string;
  phone: string;
  role: import("./mock-data").ServerRole;
  startDate: string;
  active: boolean;
  sales: number;
  orders: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: NotifTone;
}

export interface AuthEstablishment {
  id: string;
  name: string;
  code: string;
  type: string;
  city: string | null;
  logoUrl?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

const AUTH_KEY = "caisse_auth";

function loadSaved(): { user: AuthUser; establishment: AuthEstablishment } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as { user: AuthUser; establishment: AuthEstablishment }) : null;
  } catch {
    return null;
  }
}

interface StoreValue {
  loggedIn: boolean;
  currentRole: UserRole;
  currentUserName: string;
  establishment: AuthEstablishment | null;
  login: (token: string, user: AuthUser, establishment: AuthEstablishment) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const saved = useMemo(() => loadSaved(), []);

  const [loggedIn, setLoggedIn] = useState(!!saved);
  const [currentRole, setCurrentRole] = useState<UserRole>(saved?.user.role ?? "Gérant");
  const [currentUserName, setCurrentUserName] = useState(saved?.user.name ?? "");
  const [establishment, setEstablishment] = useState<AuthEstablishment | null>(saved?.establishment ?? null);

  const value = useMemo<StoreValue>(
    () => ({
      loggedIn,
      currentRole,
      currentUserName,
      establishment,
      login: (token, user, estab) => {
        setToken(token);
        localStorage.setItem(AUTH_KEY, JSON.stringify({ user, establishment: estab }));
        setLoggedIn(true);
        setCurrentRole(user.role);
        setCurrentUserName(user.name);
        setEstablishment(estab);
      },
      logout: () => {
        clearToken();
        localStorage.removeItem(AUTH_KEY);
        setLoggedIn(false);
        setCurrentRole("Gérant");
        setCurrentUserName("");
        setEstablishment(null);
      },
    }),
    [loggedIn, currentRole, currentUserName, establishment],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within AppStoreProvider");
  return ctx;
}
