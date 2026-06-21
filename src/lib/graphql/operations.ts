import { gqlClient } from '@/lib/gql-client';
import {
  CATEGORY_KEY, CATEGORY_LABEL, METHOD_KEY, METHOD_LABEL, STATUS_LABEL,
  TABLE_STATUS_LABEL, TABLE_STATUS_KEY, SERVER_ROLE_LABEL, SERVER_ROLE_KEY,
  USER_ROLE_LABEL, toNotifTone, fmtTime, fmtDate,
} from './adapters';
import type { Drink, Category, SaleEntry, Expense, Supplier, ServerRole } from '@/lib/mock-data';
import type { ServerItem, TableItem, AppNotification, UserRole, TableStatus, NotifTone } from '@/lib/store';

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
  id: string; label: string; category: string; amount: number; expenseTime: string;
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
}

interface ApiNotification {
  id: string; title: string; body: string; tone: string; read: boolean; createdAt: string;
}

interface ApiUser {
  id: string; name: string; role: string; active: boolean; createdAt: string;
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
    id: s.ticketNumber,
    table: s.tableName,
    server: s.serverName,
    total: s.total,
    method: (METHOD_LABEL[s.method] ?? s.method) as SaleEntry['method'],
    time: s.saleTime?.slice(0, 5) ?? '—',
    items: s.itemsCount,
    status: (STATUS_LABEL[s.status] ?? s.status) as SaleEntry['status'],
  };
}

export function adaptExpense(e: ApiExpense): Expense {
  return { id: e.id, label: e.label, category: e.category, amount: e.amount, time: e.expenseTime?.slice(0, 5) ?? '—' };
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

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user { id name role }
      establishment { id name code type city logoUrl }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user { id name role }
      establishment { id name code type city logoUrl }
    }
  }
`;

export async function loginApi(establishmentCode: string, pin: string): Promise<ApiAuthPayload> {
  const data = await gqlClient.request<{ login: ApiAuthPayload }>(LOGIN_MUTATION, {
    input: { establishmentCode, pin },
  });
  return data.login;
}

export async function registerApi(input: {
  ownerName: string; establishmentName: string;
  city?: string; establishmentType?: string; pin: string; logoUrl?: string;
}): Promise<ApiAuthPayload> {
  const data = await gqlClient.request<{ register: ApiAuthPayload }>(REGISTER_MUTATION, { input });
  return data.register;
}

// ─── Drinks ──────────────────────────────────────────────────────────────────

const DRINKS_QUERY = `
  query Drinks($category: DrinkCategory) {
    drinks(category: $category) {
      id name category size price cost stock threshold imageData active
    }
  }
`;

const CREATE_DRINK_MUTATION = `
  mutation CreateDrink($input: CreateDrinkInput!) {
    createDrink(input: $input) { id name category size price cost stock threshold imageData active }
  }
`;

const RESTOCK_DRINK_MUTATION = `
  mutation RestockDrink($input: RestockDrinkInput!) {
    restockDrink(input: $input) { id stock cost }
  }
`;

export async function getDrinksApi(category?: string): Promise<Drink[]> {
  const vars = category ? { category } : {};
  const data = await gqlClient.request<{ drinks: ApiDrink[] }>(DRINKS_QUERY, vars);
  return data.drinks.map(adaptDrink);
}

export async function createDrinkApi(input: {
  name: string; category: string; size: string; price: number;
  cost?: number; stock?: number; threshold?: number; imageData?: string;
}): Promise<Drink> {
  const data = await gqlClient.request<{ createDrink: ApiDrink }>(CREATE_DRINK_MUTATION, { input });
  return adaptDrink(data.createDrink);
}

export async function restockDrinkApi(input: {
  drinkId: string; quantity: number; unitCost?: number; supplierId?: string;
}): Promise<void> {
  await gqlClient.request(RESTOCK_DRINK_MUTATION, { input });
}

// ─── Sales ───────────────────────────────────────────────────────────────────

const SALES_QUERY = `
  query Sales($limit: Int) {
    sales(limit: $limit) {
      id ticketNumber tableName serverName total method status saleTime itemsCount daySessionId
    }
  }
`;

const RECORD_SALE_MUTATION = `
  mutation RecordSale($input: RecordSaleInput!) {
    recordSale(input: $input) { id ticketNumber total tableName serverName method status saleTime itemsCount daySessionId }
  }
`;

export async function getSalesApi(limit?: number): Promise<SaleEntry[]> {
  const data = await gqlClient.request<{ sales: ApiSale[] }>(SALES_QUERY, { limit });
  return data.sales.map(adaptSale);
}

export async function recordSaleApi(input: {
  items: { drinkId: string; quantity: number }[];
  tableId?: string; tableName: string;
  serverId?: string; serverName: string;
  method: string; discountPct?: number;
}): Promise<SaleEntry> {
  const data = await gqlClient.request<{ recordSale: ApiSale }>(RECORD_SALE_MUTATION, { input });
  return adaptSale(data.recordSale);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

const EXPENSES_QUERY = `
  query Expenses($limit: Int) {
    expenses(limit: $limit) { id label category amount expenseTime daySessionId }
  }
`;

const ADD_EXPENSE_MUTATION = `
  mutation AddExpense($input: AddExpenseInput!) {
    addExpense(input: $input) { id label category amount expenseTime }
  }
`;

export async function getExpensesApi(limit?: number): Promise<Expense[]> {
  const data = await gqlClient.request<{ expenses: ApiExpense[] }>(EXPENSES_QUERY, { limit });
  return data.expenses.map(adaptExpense);
}

export async function addExpenseApi(input: {
  label: string; category: string; amount: number;
}): Promise<Expense> {
  const data = await gqlClient.request<{ addExpense: ApiExpense }>(ADD_EXPENSE_MUTATION, { input });
  return adaptExpense(data.addExpense);
}

// ─── Day Sessions ─────────────────────────────────────────────────────────────

const CURRENT_DAY_SESSION_QUERY = `
  query CurrentDaySession {
    currentDaySession { id openedAt closedAt openedByServerId openedByUserId }
  }
`;

const OPEN_DAY_SESSION_MUTATION = `
  mutation OpenDaySession($input: OpenDaySessionInput!) {
    openDaySession(input: $input) { id openedAt }
  }
`;

const CLOSE_DAY_SESSION_MUTATION = `
  mutation CloseDaySession($input: CloseDaySessionInput!) {
    closeDaySession(input: $input) { id closedAt countedAmount ecart }
  }
`;

export interface DaySessionInfo {
  id: string;
  openedAt: string;
  openedBy: string;
  date: string;
}

export async function getCurrentDaySessionApi(): Promise<DaySessionInfo | null> {
  const data = await gqlClient.request<{ currentDaySession: ApiDaySession | null }>(CURRENT_DAY_SESSION_QUERY);
  const s = data.currentDaySession;
  if (!s) return null;
  return {
    id: s.id,
    openedAt: fmtTime(s.openedAt),
    openedBy: '',
    date: fmtDate(s.openedAt),
  };
}

export async function openDaySessionApi(input: {
  serverId?: string; serverName?: string;
}): Promise<DaySessionInfo> {
  const data = await gqlClient.request<{ openDaySession: ApiDaySession }>(OPEN_DAY_SESSION_MUTATION, { input });
  const s = data.openDaySession;
  return {
    id: s.id,
    openedAt: fmtTime(s.openedAt),
    openedBy: input.serverName ?? '',
    date: fmtDate(s.openedAt),
  };
}

export async function closeDaySessionApi(input: {
  countedAmount?: number; notes?: string;
}): Promise<void> {
  await gqlClient.request(CLOSE_DAY_SESSION_MUTATION, { input });
}

// ─── Servers ─────────────────────────────────────────────────────────────────

const SERVERS_QUERY = `
  query Servers {
    servers { id name phone role startDate active createdAt }
  }
`;

const CREATE_SERVER_MUTATION = `
  mutation CreateServer($input: CreateServerInput!) {
    createServer(input: $input) { id name phone role startDate active }
  }
`;

const UPDATE_SERVER_MUTATION = `
  mutation UpdateServer($id: ID!, $input: UpdateServerInput!) {
    updateServer(id: $id, input: $input) { id name phone role startDate active }
  }
`;

export async function getServersApi(): Promise<ServerItem[]> {
  const data = await gqlClient.request<{ servers: ApiServer[] }>(SERVERS_QUERY);
  return data.servers.map(adaptServer);
}

export async function createServerApi(input: {
  name: string; phone?: string; role?: string; startDate?: string;
}): Promise<ServerItem> {
  const data = await gqlClient.request<{ createServer: ApiServer }>(CREATE_SERVER_MUTATION, { input });
  return adaptServer(data.createServer);
}

export async function updateServerApi(id: string, input: {
  name?: string; phone?: string; role?: string; startDate?: string; active?: boolean;
}): Promise<ServerItem> {
  const data = await gqlClient.request<{ updateServer: ApiServer }>(UPDATE_SERVER_MUTATION, { id, input });
  return adaptServer(data.updateServer);
}

// ─── Tables ──────────────────────────────────────────────────────────────────

const TABLES_QUERY = `
  query Tables {
    tables { id name seats status active }
  }
`;

const CREATE_TABLE_MUTATION = `
  mutation CreateTable($input: CreateTableInput!) {
    createTable(input: $input) { id name seats status active }
  }
`;

const UPDATE_TABLE_STATUS_MUTATION = `
  mutation UpdateTableStatus($id: ID!, $status: TableStatus!) {
    updateTableStatus(id: $id, status: $status) { id name seats status active }
  }
`;

export async function getTablesApi(): Promise<TableItem[]> {
  const data = await gqlClient.request<{ tables: ApiTable[] }>(TABLES_QUERY);
  return data.tables.filter((t) => t.active).map(adaptTable);
}

export async function createTableApi(input: { name: string; seats: number }): Promise<TableItem> {
  const data = await gqlClient.request<{ createTable: ApiTable }>(CREATE_TABLE_MUTATION, { input });
  return adaptTable(data.createTable);
}

export async function updateTableStatusApi(id: string, status: TableStatus): Promise<TableItem> {
  const apiStatus = TABLE_STATUS_KEY[status] ?? status;
  const data = await gqlClient.request<{ updateTableStatus: ApiTable }>(UPDATE_TABLE_STATUS_MUTATION, { id, status: apiStatus });
  return adaptTable(data.updateTableStatus);
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

const SUPPLIERS_QUERY = `
  query Suppliers {
    suppliers { id name contact phone category note active }
  }
`;

const CREATE_SUPPLIER_MUTATION = `
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) { id name contact phone category note active }
  }
`;

export async function getSuppliersApi(): Promise<Supplier[]> {
  const data = await gqlClient.request<{ suppliers: ApiSupplier[] }>(SUPPLIERS_QUERY);
  return data.suppliers.filter((s) => s.active).map(adaptSupplier);
}

export async function createSupplierApi(input: {
  name: string; contact?: string; phone?: string; category?: string; note?: string;
}): Promise<Supplier> {
  const data = await gqlClient.request<{ createSupplier: ApiSupplier }>(CREATE_SUPPLIER_MUTATION, { input });
  return adaptSupplier(data.createSupplier);
}

// ─── Notifications ────────────────────────────────────────────────────────────

const NOTIFICATIONS_QUERY = `
  query Notifications($limit: Int) {
    notifications(limit: $limit) { id title body tone read createdAt }
  }
`;

const UNREAD_COUNT_QUERY = `
  query UnreadCount {
    unreadNotificationsCount
  }
`;

const MARK_READ_MUTATION = `
  mutation MarkRead($id: ID!) {
    markNotificationRead(id: $id) { id read }
  }
`;

const MARK_ALL_READ_MUTATION = `
  mutation MarkAllRead {
    markAllNotificationsRead
  }
`;

export async function getNotificationsApi(limit?: number): Promise<AppNotification[]> {
  const data = await gqlClient.request<{ notifications: ApiNotification[] }>(NOTIFICATIONS_QUERY, { limit });
  return data.notifications.map(adaptNotification);
}

export async function getUnreadCountApi(): Promise<number> {
  const data = await gqlClient.request<{ unreadNotificationsCount: number }>(UNREAD_COUNT_QUERY);
  return data.unreadNotificationsCount;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await gqlClient.request(MARK_READ_MUTATION, { id });
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await gqlClient.request(MARK_ALL_READ_MUTATION);
}

// ─── Users (Gérants) ─────────────────────────────────────────────────────────

const USERS_QUERY = `
  query Users {
    users { id name role active createdAt }
  }
`;

const CREATE_GERANT_MUTATION = `
  mutation CreateGerant($input: CreateGerantInput!) {
    createGerant(input: $input) { id name role active }
  }
`;

const DEACTIVATE_USER_MUTATION = `
  mutation DeactivateUser($userId: ID!) {
    deactivateUser(userId: $userId) { id active }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) { id name role active }
  }
`;

export interface GerantUser {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export async function getUsersApi(): Promise<GerantUser[]> {
  const data = await gqlClient.request<{ users: ApiUser[] }>(USERS_QUERY);
  return data.users.map((u) => ({
    id: u.id,
    name: u.name,
    role: (USER_ROLE_LABEL[u.role] ?? u.role) as UserRole,
    active: u.active,
  }));
}

export async function createGerantApi(input: { name: string; pin: string }): Promise<GerantUser> {
  const data = await gqlClient.request<{ createGerant: ApiUser }>(CREATE_GERANT_MUTATION, { input });
  return {
    id: data.createGerant.id,
    name: data.createGerant.name,
    role: (USER_ROLE_LABEL[data.createGerant.role] ?? 'Gérant') as UserRole,
    active: data.createGerant.active,
  };
}

export async function deactivateUserApi(userId: string): Promise<void> {
  await gqlClient.request(DEACTIVATE_USER_MUTATION, { userId });
}

export async function updateUserApi(id: string, input: { active?: boolean; name?: string }): Promise<void> {
  await gqlClient.request(UPDATE_USER_MUTATION, { id, input });
}

// ─── Audit ────────────────────────────────────────────────────────────────────

const AUDIT_QUERY = `
  query AuditLog($limit: Int) {
    auditLog(limit: $limit) { id eventType level label detail userName eventTime createdAt }
  }
`;

export interface AuditEntry {
  id: string; eventType: string; level: string; label: string;
  detail: string | null; userName: string | null; eventTime: string;
}

export async function getAuditLogApi(limit?: number): Promise<AuditEntry[]> {
  const data = await gqlClient.request<{ auditLog: ApiAuditEntry[] }>(AUDIT_QUERY, { limit });
  return data.auditLog;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

const SAVE_INVENTORY_MUTATION = `
  mutation SaveInventory($input: SaveInventoryInput!) {
    saveInventory(input: $input) { id totalEcartValue itemsCounted createdAt }
  }
`;

export async function saveInventoryApi(input: {
  items: { drinkId: string; countedStock: number }[];
  applyAdjustment?: boolean;
  notes?: string;
}): Promise<{ id: string; totalEcartValue: number; itemsCounted: number }> {
  const data = await gqlClient.request<{ saveInventory: { id: string; totalEcartValue: number; itemsCounted: number } }>(
    SAVE_INVENTORY_MUTATION, { input }
  );
  return data.saveInventory;
}

// ─── Stock status ─────────────────────────────────────────────────────────────

const STOCK_STATUS_QUERY = `
  query StockStatus {
    stockStatus {
      id name category size price cost margin marginPct stock threshold stockValue stockAlert imageData active
    }
  }
`;

export async function getStockStatusApi(): Promise<Drink[]> {
  interface ApiStockItem {
    id: string; name: string; category: string; size: string; price: number;
    cost: number; margin: number; stock: number; threshold: number; imageData: string | null; active: boolean;
  }
  const data = await gqlClient.request<{ stockStatus: ApiStockItem[] }>(STOCK_STATUS_QUERY);
  return data.stockStatus.map((s) => ({
    id: s.id, name: s.name,
    category: (CATEGORY_LABEL[s.category] ?? s.category) as Category,
    size: s.size, price: s.price, cost: s.cost,
    stock: s.stock, threshold: s.threshold,
    emoji: s.imageData ?? '',
  }));
}

// Re-export adapters for convenience
export { CATEGORY_KEY, METHOD_KEY, SERVER_ROLE_KEY, TABLE_STATUS_KEY };
