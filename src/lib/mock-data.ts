// Données fictives pour le frontend Caisse+ (aucun backend).
// Devise : FCFA.

export const ESTABLISHMENT = {
  name: "Maquis Le Repère",
  code: "9731",
  type: "Maquis",
  city: "Abidjan · Cocody",
};

export const CURRENT_USER = {
  name: "Awa Koné",
  role: "Gérant" as const,
  initials: "AK",
};

export function fcfa(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value)) + " F";
}

export type Category = "Bières" | "Spiritueux" | "Vins" | "Softs" | "Eaux" | "Liqueurs";

export interface Drink {
  id: string;
  name: string;
  category: Category;
  size: string;
  price: number;
  cost: number;
  stock: number;
  threshold: number;
  emoji: string;
}

export const DRINKS: Drink[] = [
  { id: "d1", name: "Flag", category: "Bières", size: "65 cl", price: 1000, cost: 650, stock: 84, threshold: 24, emoji: "🍺" },
  { id: "d2", name: "Castel", category: "Bières", size: "65 cl", price: 1000, cost: 650, stock: 18, threshold: 24, emoji: "🍺" },
  { id: "d3", name: "Bock", category: "Bières", size: "33 cl", price: 700, cost: 400, stock: 120, threshold: 36, emoji: "🍺" },
  { id: "d4", name: "Heineken", category: "Bières", size: "33 cl", price: 1500, cost: 950, stock: 0, threshold: 24, emoji: "🍺" },
  { id: "d5", name: "Awa", category: "Eaux", size: "1.5 L", price: 500, cost: 250, stock: 60, threshold: 20, emoji: "💧" },
  { id: "d6", name: "Coca-Cola", category: "Softs", size: "33 cl", price: 600, cost: 300, stock: 95, threshold: 30, emoji: "🥤" },
  { id: "d7", name: "Fanta", category: "Softs", size: "33 cl", price: 600, cost: 300, stock: 12, threshold: 30, emoji: "🥤" },
  { id: "d8", name: "Absolut Vodka", category: "Spiritueux", size: "75 cl", price: 25000, cost: 16000, stock: 7, threshold: 4, emoji: "🍾" },
  { id: "d9", name: "Bacardi", category: "Spiritueux", size: "75 cl", price: 22000, cost: 14000, stock: 5, threshold: 4, emoji: "🍾" },
  { id: "d10", name: "Vin rouge Bordeaux", category: "Vins", size: "75 cl", price: 12000, cost: 7500, stock: 22, threshold: 6, emoji: "🍷" },
  { id: "d11", name: "Baileys", category: "Liqueurs", size: "70 cl", price: 18000, cost: 11000, stock: 9, threshold: 4, emoji: "🥃" },
  { id: "d12", name: "Castel canette", category: "Bières", size: "33 cl", price: 800, cost: 500, stock: 0, threshold: 24, emoji: "🍺" },
];

export const CATEGORIES: Category[] = ["Bières", "Spiritueux", "Vins", "Softs", "Eaux", "Liqueurs"];

export interface SaleEntry {
  id: string;
  ticketNumber?: string;
  table: string;
  server: string;
  total: number;
  method: "Espèces" | "Mobile Money" | "Crédit";
  time: string;
  items: number;
  status: "Payée" | "Non payée";
}

export const RECENT_SALES: SaleEntry[] = [
  { id: "#1042", table: "Table 6", server: "Yao", total: 9500, method: "Espèces", time: "21:48", items: 7, status: "Payée" },
  { id: "#1041", table: "Comptoir", server: "Awa", total: 3000, method: "Mobile Money", time: "21:35", items: 3, status: "Payée" },
  { id: "#1040", table: "Table 2", server: "Fatou", total: 25600, method: "Crédit", time: "21:12", items: 12, status: "Non payée" },
  { id: "#1039", table: "Table 9", server: "Yao", total: 4200, method: "Espèces", time: "20:54", items: 4, status: "Payée" },
  { id: "#1038", table: "Comptoir", server: "Awa", total: 1500, method: "Mobile Money", time: "20:30", items: 1, status: "Payée" },
];

export interface Expense {
  id: string;
  label: string;
  category: string;
  amount: number;
  time: string;
  createdByName?: string | null;
}

export const EXPENSES: Expense[] = [
  { id: "e1", label: "Glace (sac x4)", category: "Achats", amount: 4000, time: "18:20" },
  { id: "e2", label: "Transport livraison", category: "Transport", amount: 6000, time: "16:05" },
  { id: "e3", label: "Avance salaire Yao", category: "Salaires", amount: 15000, time: "14:30" },
];

export const PAYMENT_BREAKDOWN = [
  { method: "Espèces", amount: 184500, color: "var(--color-primary)" },
  { method: "Mobile Money", amount: 96000, color: "var(--color-secondary)" },
  { method: "Crédit", amount: 41600, color: "var(--color-accent)" },
];

export const WEEK_SALES = [
  { day: "Lun", value: 142 },
  { day: "Mar", value: 168 },
  { day: "Mer", value: 131 },
  { day: "Jeu", value: 205 },
  { day: "Ven", value: 288 },
  { day: "Sam", value: 322 },
  { day: "Dim", value: 247 },
];

export const TABLES = [
  { id: "t1", name: "Table 1", status: "Libre" as const, seats: 4 },
  { id: "t2", name: "Table 2", status: "Occupée" as const, seats: 6 },
  { id: "t3", name: "Table 3", status: "Libre" as const, seats: 2 },
  { id: "t4", name: "Table 4", status: "Addition" as const, seats: 4 },
  { id: "t5", name: "Table 5", status: "Libre" as const, seats: 8 },
  { id: "t6", name: "Table 6", status: "Occupée" as const, seats: 4 },
  { id: "t7", name: "Table 7", status: "Libre" as const, seats: 2 },
  { id: "t8", name: "Table 8", status: "Occupée" as const, seats: 4 },
];

export type ServerRole = "Serveur(e)" | "Gérant(e)";

export const SERVERS = [
  { id: "s1", name: "Yao Kouassi", phone: "+225 07 00 00 01", role: "Serveur(e)" as ServerRole, startDate: "2024-03-12", active: true, sales: 142000, orders: 38 },
  { id: "s2", name: "Awa Koné", phone: "+225 07 00 00 02", role: "Gérant(e)" as ServerRole, startDate: "2023-11-02", active: true, sales: 98500, orders: 27 },
  { id: "s3", name: "Fatou Diabaté", phone: "+225 07 00 00 03", role: "Serveur(e)" as ServerRole, startDate: "2024-06-20", active: true, sales: 76000, orders: 21 },
  { id: "s4", name: "Ibrahim Touré", phone: "+225 07 00 00 04", role: "Serveur(e)" as ServerRole, startDate: "2025-01-08", active: false, sales: 0, orders: 0 },
];

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
  note?: string;
}

export const SUPPLIERS: Supplier[] = [
  { id: "f1", name: "Brasserie Solibra", contact: "Kouadio Yves", phone: "+225 27 21 00 11", category: "Bières", note: "Livraison mardi & vendredi" },
  { id: "f2", name: "Distrib' Abidjan", contact: "Mariam Sylla", phone: "+225 07 88 22 33", category: "Spiritueux", note: "Paiement à 15 jours" },
  { id: "f3", name: "Eau Awa SA", contact: "Service commercial", phone: "+225 05 44 66 77", category: "Eaux & Softs" },
];
