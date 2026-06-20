import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DRINKS as SEED_DRINKS,
  EXPENSES as SEED_EXPENSES,
  RECENT_SALES as SEED_SALES,
  SERVERS as SEED_SERVERS,
  SUPPLIERS as SEED_SUPPLIERS,
  TABLES as SEED_TABLES,
  CURRENT_USER,
  ESTABLISHMENT,
  type Drink,
  type Expense,
  type SaleEntry,
  type Supplier,
  type ServerRole,
} from "./mock-data";

export type { Supplier, ServerRole } from "./mock-data";

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
  role: ServerRole;
  startDate: string;
  active: boolean;
  sales: number;
  orders: number;
}

export type NotifTone = "info" | "warning" | "success" | "danger";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: NotifTone;
}

function nowTime(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function uid(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

function seedNotifications(drinks: Drink[]): AppNotification[] {
  const list: AppNotification[] = [];
  drinks
    .filter((d) => d.stock === 0)
    .forEach((d) =>
      list.push({
        id: uid("n"),
        title: "Rupture de stock",
        body: `${d.name} (${d.size}) est en rupture. Réapprovisionnement conseillé.`,
        time: "Aujourd'hui",
        read: false,
        tone: "danger",
      }),
    );
  drinks
    .filter((d) => d.stock > 0 && d.stock <= d.threshold)
    .slice(0, 3)
    .forEach((d) =>
      list.push({
        id: uid("n"),
        title: "Stock bas",
        body: `${d.name} sous le seuil (${d.stock} restants).`,
        time: "Aujourd'hui",
        read: false,
        tone: "warning",
      }),
    );
  list.push({
    id: uid("n"),
    title: "Journée ouverte",
    body: "La journée de caisse a été ouverte à 17:02 par Yao.",
    time: "17:02",
    read: true,
    tone: "info",
  });
  return list;
}

interface StoreValue {
  user: typeof CURRENT_USER;
  establishment: typeof ESTABLISHMENT;
  loggedIn: boolean;
  drinks: Drink[];
  expenses: Expense[];
  sales: SaleEntry[];
  servers: ServerItem[];
  tables: TableItem[];
  suppliers: Supplier[];
  notifications: AppNotification[];
  unreadCount: number;
  // actions
  login: () => void;
  logout: () => void;
  addExpense: (data: { label: string; category: string; amount: number }) => void;
  addServer: (data: { name: string; phone: string; role: ServerRole; startDate: string }) => void;
  editServer: (id: string, data: { name: string; phone: string; role: ServerRole; startDate: string }) => void;
  toggleServer: (id: string) => void;
  addTable: (data: { name: string; seats: number }) => void;
  cycleTableStatus: (id: string) => void;
  addSupplier: (data: Omit<Supplier, "id">) => void;
  addDrink: (data: Omit<Drink, "id" | "emoji"> & { emoji?: string }) => void;
  restockDrink: (id: string, qty: number, unitCost?: number, supplier?: string) => void;
  recordSale: (data: { table: string; server: string; total: number; method: SaleEntry["method"]; items: number }) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "read" | "time"> & { time?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const STATUS_CYCLE: TableStatus[] = ["Libre", "Occupée", "Addition"];

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(true);
  const [drinks, setDrinks] = useState<Drink[]>(() => SEED_DRINKS.map((d) => ({ ...d })));
  const [expenses, setExpenses] = useState<Expense[]>(() => SEED_EXPENSES.map((e) => ({ ...e })));
  const [sales, setSales] = useState<SaleEntry[]>(() => SEED_SALES.map((s) => ({ ...s })));
  const [servers, setServers] = useState<ServerItem[]>(() => SEED_SERVERS.map((s) => ({ ...s })));
  const [tables, setTables] = useState<TableItem[]>(() => SEED_TABLES.map((t) => ({ ...t })));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => SEED_SUPPLIERS.map((s) => ({ ...s })));
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    seedNotifications(SEED_DRINKS),
  );

  const value = useMemo<StoreValue>(() => {
    const pushNotification: StoreValue["pushNotification"] = (n) =>
      setNotifications((prev) => [
        { id: uid("n"), read: false, time: n.time ?? nowTime(), title: n.title, body: n.body, tone: n.tone },
        ...prev,
      ]);

    return {
      user: CURRENT_USER,
      establishment: ESTABLISHMENT,
      loggedIn,
      drinks,
      expenses,
      sales,
      servers,
      tables,
      suppliers,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      login: () => setLoggedIn(true),
      logout: () => setLoggedIn(false),
      pushNotification,
      addExpense: ({ label, category, amount }) => {
        setExpenses((prev) => [{ id: uid("e"), label, category, amount, time: nowTime() }, ...prev]);
        pushNotification({
          title: "Dépense enregistrée",
          body: `${label} · ${new Intl.NumberFormat("fr-FR").format(amount)} F`,
          tone: "info",
        });
      },
      addServer: ({ name, phone }) => {
        setServers((prev) => [...prev, { id: uid("s"), name, phone, active: true, sales: 0, orders: 0 }]);
        pushNotification({ title: "Serveur ajouté", body: `${name} a rejoint l'équipe.`, tone: "success" });
      },
      toggleServer: (id) =>
        setServers((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))),
      addTable: ({ name, seats }) => {
        setTables((prev) => [...prev, { id: uid("t"), name, seats, status: "Libre" }]);
        pushNotification({ title: "Table ajoutée", body: `${name} (${seats} places) créée.`, tone: "success" });
      },
      cycleTableStatus: (id) =>
        setTables((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(t.status) + 1) % STATUS_CYCLE.length] }
              : t,
          ),
        ),
      addDrink: (data) => {
        setDrinks((prev) => [
          ...prev,
          { ...data, id: uid("d"), emoji: data.emoji ?? "🍶" } as Drink,
        ]);
        pushNotification({ title: "Boisson ajoutée", body: `${data.name} ajoutée au catalogue.`, tone: "success" });
      },
      restockDrink: (id, qty) => {
        setDrinks((prev) => prev.map((d) => (d.id === id ? { ...d, stock: d.stock + qty } : d)));
        const d = drinks.find((x) => x.id === id);
        pushNotification({
          title: "Réapprovisionnement",
          body: `${d?.name ?? "Boisson"} : +${qty} unités.`,
          tone: "success",
        });
      },
      recordSale: ({ table, server, total, method, items }) => {
        const id = `#${1043 + sales.length}`;
        setSales((prev) => [
          { id, table, server, total, method, items, time: nowTime(), status: method === "Crédit" ? "Non payée" : "Payée" },
          ...prev,
        ]);
        setServers((prev) =>
          prev.map((s) => (s.name.startsWith(server) ? { ...s, sales: s.sales + total, orders: s.orders + 1 } : s)),
        );
        pushNotification({
          title: "Vente encaissée",
          body: `${id} · ${new Intl.NumberFormat("fr-FR").format(total)} F (${method}).`,
          tone: "success",
        });
      },
      markRead: (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    };
  }, [loggedIn, drinks, expenses, sales, servers, tables, notifications]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within AppStoreProvider");
  return ctx;
}
