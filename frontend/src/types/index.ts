// Shared TypeScript types for the Factory ERP frontend

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export type OrderStatus = 'DISPATCHED' | 'NOT_DISPATCHED' | 'CLIENT_ACCOUNT';
export type ProductionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'DEFECTIVE';
export type OperationType = 'CAPITAL' | 'OPERATING_EXP' | 'SALES_REVENUE' | 'LOAN' | 'REPAYMENT';
export type PaymentType = 'CLIENT_PAYMENT' | 'DEBT_PAYMENT';

// Arabic labels
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DISPATCHED: 'تم الصرف',
  NOT_DISPATCHED: 'لم يتم الصرف',
  CLIENT_ACCOUNT: 'حساب عميل',
};

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  IN_PROGRESS: 'قيد التشغيل',
  COMPLETED: 'تام',
  DEFECTIVE: 'هالك',
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  CAPITAL: 'رأس مالي',
  OPERATING_EXP: 'مصروف تشغيل',
  SALES_REVENUE: 'إيراد مبيعات',
  LOAN: 'استلاف',
  REPAYMENT: 'سداد',
};

// ── Entities ──────────────────────────────────────

export interface Partner {
  id: number;
  name: string;
  isActive: boolean;
}

export interface SaleItem {
  id: number;
  saleId: number;
  modelCode: string;
  modelName?: string;
  color: string;
  quantity: number;
  unitPrice?: number;
}

export interface Sale {
  id: number;
  orderNumber: string;
  rowNumber: number;
  marketerName: string;
  clientName: string;
  clientMobile?: string;
  invoiceValue: number;
  depositPaid: number;
  depositReceiverId?: number;
  depositReceiver?: Partner;
  remaining: number;
  shippingNumber?: string;
  shippingCollected: number;
  orderStatus: OrderStatus;
  deliveryMethod?: string;
  warehouseLocation?: string;
  notes?: string;
  items: SaleItem[];
  createdAt: string;
}

export interface ReadyStock {
  id: number;
  modelCode: string;
  productName: string;
  color: string;
  openingBalance: number;
  costPerPiece: number;
  location?: string;
  // Computed fields
  newProduction?: number;
  totalSales?: number;
  totalReturns?: number;
  actualBalance?: number;
}

export interface FabricEntry {
  id: number;
  date: string;
  materialType: string;
  color: string;
  qtyIn: number;
  costPerKg: number;
  notes?: string;
  // Computed
  qtyConsumed?: number;
  availableBalance?: number;
}

export interface AccessoryEntry {
  id: number;
  date: string;
  itemName: string;
  qtyIn: number;
  qtyConsumed: number;
  cost: number;
  notes?: string;
  // Computed
  availableBalance?: number;
}

export interface CuttingOrder {
  id: number;
  date: string;
  cutNumber: number;
  cutDescription: string;
  materialType: string;
  color: string;
  layersCount: number;
  spreadLengthM: number;
  totalPieces: number;
  kgConsumed: number;
  notes?: string;
}

export interface ModelProduction {
  id: number;
  date: string;
  cuttingOrderId: number;
  cuttingOrder?: { cutNumber: number; cutDescription: string };
  modelCode: string;
  modelDescription: string;
  color: string;
  sizes?: string;
  qtyFromCutting: number;
  status: ProductionStatus;
  wastage: number;
  qtyReceived?: number;
  warehouseEntryDate?: string;
  notes?: string;
}

export interface ExpenseLine {
  id?: number;
  partnerId: number;
  partner?: Partner;
  amountIn: number;
  amountOut: number;
}

export interface ExpenseRecord {
  id: number;
  date: string;
  operationType: OperationType;
  statement: string;
  notes?: string;
  lines: ExpenseLine[];
}

export interface Debt {
  id: number;
  date: string;
  creditor: string;
  totalAmount: number;
  amountPaid: number;
  remaining: number;
  notes?: string;
}

export interface ClientAccount {
  id: number;
  date: string;
  clientName: string;
  modelName: string;
  quantity: number;
  totalAmount: number;
  amountPaid: number;
  remaining: number;
  notes?: string;
}

export interface ReturnItem {
  id: number;
  date: string;
  saleId?: number;
  clientName: string;
  refundPaidById?: number;
  refundPaidBy?: Partner;
  modelCode: string;
  modelColor: string;
  modelQty: number;
  refundAmount: number;
  notes?: string;
}

// ── Dashboard ─────────────────────────────────────

export interface PartnerSummary {
  id: number;
  name: string;
  totalIn: number;
  totalOut: number;
  net: number;
}

export interface InventoryAlert {
  type: 'low_stock' | 'negative_stock';
  modelCode: string;
  productName: string;
  color: string;
  currentBalance: number;
}

export interface DashboardMetrics {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  remainingDebts: number;
  moneyOwedToUs: number;
  cashAvailable: number;
  totalCurrentAssets: number;
  partnerSummaries: PartnerSummary[];
  salesByMarketer: { name: string; value: number }[];
  orderStatusCounts: { name: string; value: number }[];
  recentSales: {
    id: number;
    orderNumber: string;
    clientName: string;
    invoiceValue: number;
    orderStatus: string;
    createdAt: string;
  }[];
  inventoryAlerts: InventoryAlert[];
}

// ── API response wrapper ──────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
