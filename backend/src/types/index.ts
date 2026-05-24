import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  role: UserRole;
}

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user: JwtPayload;
}

// Standard API response shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Dashboard metric types
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
  recentSales: RecentSaleEntry[];
  inventoryAlerts: InventoryAlert[];
}

export interface PartnerSummary {
  id: number;
  name: string;
  totalIn: number;
  totalOut: number;
  net: number;
}

export interface RecentSaleEntry {
  id: number;
  orderNumber: string;
  clientName: string;
  invoiceValue: number;
  orderStatus: string;
  createdAt: Date;
}

export interface InventoryAlert {
  type: 'low_stock' | 'negative_stock';
  modelCode: string;
  productName: string;
  color: string;
  currentBalance: number;
}
