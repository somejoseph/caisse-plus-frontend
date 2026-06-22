import { apiFetch } from '@/lib/gql-client';
import {
  CATEGORY_KEY, CATEGORY_LABEL, METHOD_KEY, METHOD_LABEL, STATUS_LABEL,
  TABLE_STATUS_LABEL, TABLE_STATUS_KEY, SERVER_ROLE_LABEL, SERVER_ROLE_KEY,
  USER_ROLE_LABEL, toNotifTone, fmtTime, fmtDate,
} from './adapters';
import type { Drink, Category, SaleEntry, Expense, Supplier, ServerRole } from '@/lib/mock-data';
import type { ServerItem, TableItem, AppNotification, UserRole, TableStatus } from '@/lib/store';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface ApiAuthPayload {
  accessToken: string;
  user: { id: string; name: string; role: string };
  establishment: { id: string; name: string; code: string; type: string; city: string | null; logoUrl: string | null };
}

interface ApiDrink {
  id: string; name: string; category: string; size: string;
  price: number; cost: number; stock: number; threshold: number;
  imageData: string | null; active: boolean;
}

interface ApiSale {
  id: string; ticketNumber: string; tableName: string; serverName: string;
  total: number; method: string; status: string; saleTime: string;
  itemsCount: number; daySessionId: string | null;
}

interface ApiExpense {
  id: string; label: string; category: string; amount: number;
  expenseTime: string; createdByName: string | null;
}

interface ApiServer {
  id: string; name: string; phone: string | null; role: string;
  startDate: string | null; active: boolean;
}

interface ApiTable {
  id: string; name: string; seats: number; status: string; active: boolean;
}

interface ApiSupplier {
  id: string; name: string; contact: string | null; phone: string | null;
  category: string | null; note: string | null; active: boolean;
}

interface ApiDaySession {
  id: string; openedAt: string; closedAt: string | null;
  openedByServerId: string | null; openedByUserId: string | null;
  openedByServer: { name: string } | null;
  openedByUser: { name: string } | null;
  countedAmount?: number | null;
  theoreticalAmount?: number | null;
  ecart?: number | null;
  notes?: string | null;
}

interface ApiNotification {
  id: string; title: string; body: string; tone: string; read: boolean; createdAt: string;
}

interface ApiUser {
  id: string; name: string; phone: string | null; role: string; active: boolean; createdAt: string;
}

interface ApiAuditEntry {
  id: string; eventType: string; level: string; label: string;
  detail: string | null; userName: string | null; eventTime: string;
}

// ─── Adapters ────────────────────────────────────────────────────────────────

export function adaptDrink(d: ApiDrink): Drink {
  return {
    id: d.id,
    name: d.name,
    category: (CATEGORY_LABEL[d.category] ?? d.category) as Category,
    size: d.size,
    price: d.price,
    cost: d.cost,
    stock: d.stock,
    threshold: d.threshold,
    emoji: d.imageData ?? '',
  };
}

export function adaptSale(s: ApiSale): SaleEntry {
  return {
    id: s.id,
    ticketNumber: s.ticketNumber,
    table: s.tableName,
    server: s.serverName,
    total: s.total,
    method: (METHOD_LABEL[s.method] ?? s.method) as SaleEntry['method'],
    time: s.saleTime,
    items: s.itemsCount,
    status: (STATUS_LABEL[s.status] ?? s.status) as SaleEntry['status'],
  };
}

export function adaptExpense(e: ApiExpense): Expense {
  return { id: e.id, label: e.label, category: e.category, amount: e.amount, time: e.expenseTime, createdByName: e.createdByName };
}

export function adaptServer(s: ApiServer): ServerItem {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone ?? '',
    role: (SERVER_ROLE_LABEL[s.role] ?? s.role) as ServerRole,
    startDate: s.startDate ?? '',
    active: s.active,
    sales: 0,
    orders: 0,
  };
}

export function adaptTable(t: ApiTable): TableItem {
  return {
    id: t.id,
    name: t.name,
    seats: t.seats,
    status: (TABLE_STATUS_LABEL[t.status] ?? t.status) as TableStatus,
  };
}

export function adaptSupplier(s: ApiSupplier): Supplier {
  return {
    id: s.id,
    name: s.name,
    contact: s.contact ?? '',
    phone: s.phone ?? '',
    category: s.category ?? '',
    note: s.note ?? undefined,
  };
}

export function adaptNotification(n: ApiNotification): AppNotification {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    tone: toNotifTone(n.tone),
    read: n.read,
    time: fmtTime(n.createdAt),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginApi(establishmentCode: string, pin: string): Promise<ApiAuthPayload> {
  return apiFetch<ApiAuthPayload>('POST', '/auth/login', {
    body: { establishmentCode, pin },
  });
}

export async function registerApi(input: {
  ownerName: string; establishmentName: string;
  phone: string; city?: string; establishmentType?: string; pin: string; logoUrl?: string;
}): Promise<ApiAuthPayload> {
  return apiFetch<ApiAuthPayload>('POST', '/auth/register', { body: input });
}

// ─── Drinks ──────────────────────────────────────────────────────────────────

export async function getDrinksApi(category?: string): Promise<Drink[]> {
  const drinks = await apiFetch<ApiDrink[]>('GET', '/drinks', {
    params: category ? { category } : {},
  });
  return drinks.map(adaptDrink);
}

export async function createDrinkApi(input: {
  name: string; category: string; size: string; price: number;
  cost?: number; stock?: number; threshold?: number; imageData?: string;
}): Promise<Drink> {
  const d = await apiFetch<ApiDrink>('POST', '/drinks', { body: input });
  return adaptDrink(d);
}

export async function restockDrinkApi(input: {
  drinkId: string; quantity: number; unitCost?: number; supplierId?: string;
}): Promise<void> {
  await apiFetch<unknown>('POST', `/drinks/${input.drinkId}/restock`, { body: input });
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export async function getSalesApi(limit?: number, from?: string, to?: string): Promise<SaleEntry[]> {
  const sales = await apiFetch<ApiSale[]>('GET', '/sales', {
    params: { limit, from, to },
  });
  return sales.map(adaptSale);
}

export async function recordSaleApi(input: {
  items: { drinkId: string; quantity: number }[];
  tableId?: string; tableName: string;
  serverId?: string; serverName: string;
  method: string; discountPct?: number;
}): Promise<SaleEntry> {
  const s = await apiFetch<ApiSale>('POST', '/sales', { body: input });
  return adaptSale(s);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpensesApi(limit?: number, daySessionId?: string): Promise<Expense[]> {
  const expenses = await apiFetch<ApiExpense[]>('GET', '/expenses', {
    params: { limit, daySessionId },
  });
  return expenses.map(adaptExpense);
}

export async function addExpenseApi(input: {
  label: string; category: string; amount: number;
}): Promise<Expense> {
  const e = await apiFetch<ApiExpense>('POST', '/expenses', { body: input });
  return adaptExpense(e);
}

// ─── Day Sessions ─────────────────────────────────────────────────────────────

export interface DaySessionInfo {
  id: string;
  openedAt: string;
  openedByName: string | null;
  date: string;
}

function adaptDaySessionInfo(s: ApiDaySession): DaySessionInfo {
  const openedByName = s.openedByServer?.name ?? s.openedByUser?.name ?? null;
  return {
    id: s.id,
    openedAt: fmtTime(s.openedAt),
    openedByName,
    date: fmtDate(s.openedAt),
  };
}

export async function getCurrentDaySessionApi(): Promise<DaySessionInfo | null> {
  const s = await apiFetch<ApiDaySession | null>('GET', '/day-sessions/current');
  if (!s) return null;
  return adaptDaySessionInfo(s);
}

export async function openDaySessionApi(): Promise<DaySessionInfo> {
  const s = await apiFetch<ApiDaySession>('POST', '/day-sessions/open', { body: {} });
  return adaptDaySessionInfo(s);
}

export async function closeDaySessionApi(input: {
  countedAmount?: number; notes?: string;
}): Promise<void> {
  await apiFetch<unknown>('POST', '/day-sessions/close', { body: input });
}

// ─── Servers ─────────────────────────────────────────────────────────────────

export async function getServersApi(): Promise<ServerItem[]> {
  const servers = await apiFetch<ApiServer[]>('GET', '/servers');
  return servers.map(adaptServer);
}

export async function createServerApi(input: {
  name: string; phone?: string; role?: string; startDate?: string;
}): Promise<ServerItem> {
  const s = await apiFetch<ApiServer>('POST', '/servers', { body: input });
  return adaptServer(s);
}

export async function updateServerApi(id: string, input: {
  name?: string; phone?: string; role?: string; startDate?: string; active?: boolean;
}): Promise<ServerItem> {
  const s = await apiFetch<ApiServer>('PATCH', `/servers/${id}`, { body: input });
  return adaptServer(s);
}

// ─── Tables ──────────────────────────────────────────────────────────────────

export async function getTablesApi(): Promise<TableItem[]> {
  const tables = await apiFetch<ApiTable[]>('GET', '/tables');
  return tables.filter((t) => t.active).map(adaptTable);
}

export async function createTableApi(input: { name: string; seats: number }): Promise<TableItem> {
  const t = await apiFetch<ApiTable>('POST', '/tables', { body: input });
  return adaptTable(t);
}

export async function updateTableStatusApi(id: string, status: TableStatus): Promise<TableItem> {
  const apiStatus = TABLE_STATUS_KEY[status] ?? status;
  const t = await apiFetch<ApiTable>('PATCH', `/tables/${id}/status`, { body: { status: apiStatus } });
  return adaptTable(t);
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export async function getSuppliersApi(): Promise<Supplier[]> {
  const suppliers = await apiFetch<ApiSupplier[]>('GET', '/suppliers');
  return suppliers.filter((s) => s.active).map(adaptSupplier);
}

export async function createSupplierApi(input: {
  name: string; contact?: string; phone?: string; category?: string; note?: string;
}): Promise<Supplier> {
  const s = await apiFetch<ApiSupplier>('POST', '/suppliers', { body: input });
  return adaptSupplier(s);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotificationsApi(limit?: number): Promise<AppNotification[]> {
  const notifs = await apiFetch<ApiNotification[]>('GET', '/notifications', {
    params: { limit },
  });
  return notifs.map(adaptNotification);
}

export async function getUnreadCountApi(): Promise<number> {
  return apiFetch<number>('GET', '/notifications/unread-count');
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await apiFetch<unknown>('POST', `/notifications/${id}/read`);
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiFetch<unknown>('POST', '/notifications/mark-all-read');
}

// ─── Users (Gérants) ─────────────────────────────────────────────────────────

export interface GerantUser {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
}

export async function getUsersApi(): Promise<GerantUser[]> {
  const users = await apiFetch<ApiUser[]>('GET', '/users');
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: (USER_ROLE_LABEL[u.role] ?? u.role) as UserRole,
    active: u.active,
  }));
}

export async function createGerantApi(input: { name: string; phone: string; pin: string }): Promise<GerantUser> {
  const u = await apiFetch<ApiUser>('POST', '/users', { body: input });
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: (USER_ROLE_LABEL[u.role] ?? 'Gérant') as UserRole,
    active: u.active,
  };
}

export async function deactivateUserApi(userId: string): Promise<void> {
  await apiFetch<unknown>('POST', `/users/${userId}/deactivate`);
}

export async function reactivateUserApi(userId: string): Promise<void> {
  await apiFetch<unknown>('POST', `/users/${userId}/reactivate`);
}

export async function updateUserApi(id: string, input: { active?: boolean; name?: string; phone?: string; pin?: string }): Promise<void> {
  await apiFetch<unknown>('POST', `/users/${id}/update`, { body: input });
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string; eventType: string; level: string; label: string;
  detail: string | null; userName: string | null; eventTime: string;
}

export async function getAuditLogApi(limit?: number): Promise<AuditEntry[]> {
  return apiFetch<AuditEntry[]>('GET', '/audit', { params: { limit } });
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function saveInventoryApi(input: {
  items: { drinkId: string; countedStock: number }[];
  applyAdjustment?: boolean;
  notes?: string;
}): Promise<{ id: string; totalEcartValue: number; itemsCounted: number }> {
  return apiFetch<{ id: string; totalEcartValue: number; itemsCounted: number }>(
    'POST', '/inventory', { body: input }
  );
}

// ─── Stock status ─────────────────────────────────────────────────────────────

export async function getStockStatusApi(): Promise<Drink[]> {
  interface ApiStockItem {
    id: string; name: string; category: string; size: string; price: number;
    cost: number; stock: number; threshold: number; imageData: string | null; active: boolean;
  }
  const items = await apiFetch<ApiStockItem[]>('GET', '/stock/status');
  return items.map((s) => ({
    id: s.id, name: s.name,
    category: (CATEGORY_LABEL[s.category] ?? s.category) as Category,
    size: s.size, price: s.price, cost: s.cost,
    stock: s.stock, threshold: s.threshold,
    emoji: s.imageData ?? '',
  }));
}

// ─── Sale detail ─────────────────────────────────────────────────────────────

export interface SaleItemDetail {
  id: string; drinkName: string; drinkSize: string;
  unitPrice: number; quantity: number; subtotal: number;
}

export interface SaleDetail {
  id: string; ticketNumber: string; table: string; server: string;
  total: number; method: string; status: string; time: string;
  itemsCount: number; items: SaleItemDetail[];
}

interface ApiSaleItem {
  id: string; drinkName: string; drinkSize: string;
  unitPrice: number; quantity: number; subtotal: number | null;
}

interface ApiSaleDetail extends ApiSale {
  items: ApiSaleItem[];
}

export async function getSaleDetailApi(id: string): Promise<SaleDetail> {
  const s = await apiFetch<ApiSaleDetail>('GET', `/sales/${id}`);
  return {
    id: s.id,
    ticketNumber: s.ticketNumber,
    table: s.tableName,
    server: s.serverName,
    total: s.total,
    method: METHOD_LABEL[s.method] ?? s.method,
    status: STATUS_LABEL[s.status] ?? s.status,
    time: s.saleTime,
    itemsCount: s.itemsCount,
    items: s.items.map((i) => ({
      id: i.id,
      drinkName: i.drinkName,
      drinkSize: i.drinkSize,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.subtotal ?? i.unitPrice * i.quantity,
    })),
  };
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface ReportSale {
  id: string; ticketNumber: string; table: string; server: string;
  serverId: string | null; total: number; method: string;
  time: string; date: string;
}

export interface ReportExpense {
  id: string; label: string; category: string; amount: number;
  time: string; date: string; createdByName: string | null;
}

export interface ReportSession {
  id: string; date: string; openedAt: string; closedAt: string | null;
  openedByName: string | null; countedAmount: number | null; ecart: number | null;
}

interface ApiReportSale {
  id: string; ticketNumber: string; tableName: string; serverName: string;
  serverId: string | null; total: number; method: string; status: string;
  saleTime: string; createdAt: string; itemsCount: number;
}

interface ApiReportExpense {
  id: string; label: string; category: string; amount: number;
  expenseTime: string; createdAt: string; createdByName: string | null;
}

export async function getReportSalesApi(params: { from?: string; to?: string; serverId?: string; limit?: number } = {}): Promise<ReportSale[]> {
  const sales = await apiFetch<ApiReportSale[]>('GET', '/sales', { params });
  return sales.map((s) => ({
    id: s.id,
    ticketNumber: s.ticketNumber,
    table: s.tableName,
    server: s.serverName,
    serverId: s.serverId,
    total: s.total,
    method: METHOD_LABEL[s.method] ?? s.method,
    time: s.saleTime,
    date: s.createdAt.slice(0, 10),
  }));
}

export async function getReportExpensesApi(params: { from?: string; to?: string; limit?: number } = {}): Promise<ReportExpense[]> {
  const expenses = await apiFetch<ApiReportExpense[]>('GET', '/expenses', { params });
  return expenses.map((e) => ({
    id: e.id,
    label: e.label,
    category: e.category,
    amount: e.amount,
    time: e.expenseTime,
    date: e.createdAt.slice(0, 10),
    createdByName: e.createdByName,
  }));
}

export async function getReportDaySessionsApi(params: { from?: string; to?: string; limit?: number } = {}): Promise<ReportSession[]> {
  const sessions = await apiFetch<ApiDaySession[]>('GET', '/day-sessions', { params });
  return sessions.map((s) => ({
    id: s.id,
    date: s.openedAt.slice(0, 10),
    openedAt: s.openedAt,
    closedAt: s.closedAt,
    openedByName: s.openedByServer?.name ?? s.openedByUser?.name ?? null,
    countedAmount: s.countedAmount ?? null,
    ecart: s.ecart ?? null,
  }));
}

// Re-export adapters for convenience
export { CATEGORY_KEY, METHOD_KEY, SERVER_ROLE_KEY, TABLE_STATUS_KEY };
