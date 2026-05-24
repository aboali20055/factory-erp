import { apiClient } from './client';
import type {
  Sale, ReadyStock, FabricEntry, AccessoryEntry,
  CuttingOrder, ModelProduction, ExpenseRecord, Debt,
  ClientAccount, ReturnItem, DashboardMetrics, User, Partner,
} from '../types';

// ── Helper to extract data ────────────────────────
const data = <T>(res: { data: { data: T } }) => res.data.data;

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ success: true; data: { token: string; user: User } }>('/auth/login', { email, password }),
  me: () => apiClient.get<{ success: true; data: User }>('/auth/me'),
  getUsers: () => apiClient.get('/auth/users').then(data<User[]>),
  listUsers: () => apiClient.get('/auth/users').then(data<User[]>),
  createUser: (payload: { name: string; email: string; password: string; role: string }) =>
    apiClient.post('/auth/users', payload).then(data<User>),
  updateUser: (id: number | string, payload: object) =>
    apiClient.patch(`/auth/users/${id}`, payload).then(data<User>),
};

// ── Dashboard ─────────────────────────────────────
export const dashboardApi = {
  getMetrics: () => apiClient.get('/dashboard').then(data<DashboardMetrics>),
};

// ── Sales ─────────────────────────────────────────
export const salesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/sales', { params }).then((res) => res.data),

  getOne: (id: number) => apiClient.get(`/sales/${id}`).then(data<Sale>),

  create: (payload: Partial<Sale> & { items: Partial<Sale['items'][0]>[] }) =>
    apiClient.post('/sales', payload).then(data<Sale>),

  update: (id: number, payload: Partial<Sale>) =>
    apiClient.put(`/sales/${id}`, payload).then(data<Sale>),

  remove: (id: number) => apiClient.delete(`/sales/${id}`),

  listReturns: () => apiClient.get('/sales/returns').then(data<ReturnItem[]>),

  createReturn: (payload: Partial<ReturnItem>) =>
    apiClient.post('/sales/returns', payload).then(data<ReturnItem>),
};

// ── Inventory ─────────────────────────────────────
export const inventoryApi = {
  // Ready Stock
  listReadyStock: (_params?: object) => apiClient.get('/inventory/ready-stock').then(data<ReadyStock[]>),
  createReadyStock: (payload: object) =>
    apiClient.post('/inventory/ready-stock', payload).then(data<ReadyStock>),
  updateReadyStock: (id: number, payload: object) =>
    apiClient.put(`/inventory/ready-stock/${id}`, payload).then(data<ReadyStock>),
  deleteReadyStock: (id: number | string) => apiClient.delete(`/inventory/ready-stock/${id}`),

  // Fabric
  listFabric: (_params?: object) => apiClient.get('/inventory/fabric').then(data<FabricEntry[]>),
  createFabric: (payload: object) =>
    apiClient.post('/inventory/fabric', payload).then(data<FabricEntry>),
  updateFabric: (id: number, payload: object) =>
    apiClient.put(`/inventory/fabric/${id}`, payload).then(data<FabricEntry>),
  deleteFabric: (id: number | string) => apiClient.delete(`/inventory/fabric/${id}`),

  // Accessories
  listAccessories: (_params?: object) => apiClient.get('/inventory/accessories').then(data<AccessoryEntry[]>),
  createAccessory: (payload: object) =>
    apiClient.post('/inventory/accessories', payload).then(data<AccessoryEntry>),
  updateAccessory: (id: number, payload: object) =>
    apiClient.put(`/inventory/accessories/${id}`, payload).then(data<AccessoryEntry>),
  deleteAccessory: (id: number | string) => apiClient.delete(`/inventory/accessories/${id}`),
};

// ── Production ────────────────────────────────────
export const productionApi = {
  // Cutting
  listCutting: (search?: string) =>
    apiClient.get('/production/cutting', { params: { search } }).then(data<CuttingOrder[]>),
  createCutting: (payload: Partial<CuttingOrder>) =>
    apiClient.post('/production/cutting', payload).then(data<CuttingOrder>),
  updateCutting: (id: number, payload: Partial<CuttingOrder>) =>
    apiClient.put(`/production/cutting/${id}`, payload).then(data<CuttingOrder>),
  deleteCutting: (id: number) => apiClient.delete(`/production/cutting/${id}`),

  // Model Productions
  listModelProd: (params?: { search?: string; status?: string }) =>
    apiClient.get('/production/models', { params }).then(data<ModelProduction[]>),
  createModelProd: (payload: Partial<ModelProduction>) =>
    apiClient.post('/production/models', payload).then(data<ModelProduction>),
  updateModelProd: (id: number, payload: Partial<ModelProduction>) =>
    apiClient.put(`/production/models/${id}`, payload).then(data<ModelProduction>),
  deleteModelProd: (id: number) => apiClient.delete(`/production/models/${id}`),
};

// ── Finance ───────────────────────────────────────
export const financeApi = {
  // Expenses
  listExpenses: (params?: string | object) =>
    apiClient.get('/finance/expenses', {
      params: typeof params === 'string' ? { search: params } : params,
    }).then((res) => res.data),
  createExpense: (payload: object) =>
    apiClient.post('/finance/expenses', payload).then(data<ExpenseRecord>),
  updateExpense: (id: number, payload: object) =>
    apiClient.put(`/finance/expenses/${id}`, payload).then(data<ExpenseRecord>),
  deleteExpense: (id: number | string) => apiClient.delete(`/finance/expenses/${id}`),

  // Debts
  listDebts: (_params?: object) => apiClient.get('/finance/debts').then(data<Debt[]>),
  createDebt: (payload: object) =>
    apiClient.post('/finance/debts', payload).then(data<Debt>),
  updateDebt: (id: number, payload: object) =>
    apiClient.put(`/finance/debts/${id}`, payload).then(data<Debt>),
  deleteDebt: (id: number | string) => apiClient.delete(`/finance/debts/${id}`),

  // Client Accounts
  listClientAccounts: (params?: string | object) =>
    apiClient.get('/finance/client-accounts', {
      params: typeof params === 'string' ? { search: params } : params,
    }).then(data<ClientAccount[]>),
  createClientAccount: (payload: object) =>
    apiClient.post('/finance/client-accounts', payload).then(data<ClientAccount>),
  updateClientAccount: (id: number, payload: object) =>
    apiClient.put(`/finance/client-accounts/${id}`, payload).then(data<ClientAccount>),
  deleteClientAccount: (id: number | string) => apiClient.delete(`/finance/client-accounts/${id}`),

  // Partners
  listPartners: () => apiClient.get('/finance/partners').then(data<Partner[]>),
  createPartner: (name: string) =>
    apiClient.post('/finance/partners', { name }).then(data<Partner>),

  // Payment Logs
  createPaymentLog: (payload: object) =>
    apiClient.post('/finance/payment-logs', payload).then(data<object>),
  addPayment: (debtId: number, payload: object) =>
    apiClient.post('/finance/payment-logs', { ...payload, debtId }).then(data<object>),
  addClientPayment: (accountId: number, payload: object) =>
    apiClient.post('/finance/payment-logs', { ...payload, clientAccountId: accountId }).then(data<object>),
};
