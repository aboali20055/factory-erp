import { z } from 'zod';

// ─── AUTH ────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

// ─── PAGINATION ──────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── SALES ───────────────────────────────────────
export const createSaleSchema = z.object({
  orderNumber: z.string().min(1, 'رقم الطلب مطلوب'),
  rowNumber: z.coerce.number().int().positive(),
  marketerName: z.string().min(1, 'اسم المسوق مطلوب'),
  clientName: z.string().min(1, 'اسم العميل مطلوب'),
  clientMobile: z.string().optional(),
  invoiceValue: z.coerce.number().min(0),
  depositPaid: z.coerce.number().min(0).default(0),
  depositReceiverId: z.coerce.number().int().positive().optional(),
  shippingNumber: z.string().optional(),
  shippingCollected: z.coerce.number().min(0).default(0),
  orderStatus: z.enum(['DISPATCHED', 'NOT_DISPATCHED', 'CLIENT_ACCOUNT']).default('NOT_DISPATCHED'),
  deliveryMethod: z.string().optional(),
  warehouseLocation: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    readyStockId: z.coerce.number().int().positive().optional(),
    modelCode: z.string().min(1, 'كود الموديل مطلوب'),
    modelName: z.string().optional(),
    color: z.string().min(1, 'اللون مطلوب'),
    quantity: z.coerce.number().int().positive('الكمية يجب أن تكون أكبر من صفر'),
    unitPrice: z.coerce.number().min(0).optional(),
  })).min(1, 'يجب إضافة منتج واحد على الأقل'),
});

export const updateSaleSchema = createSaleSchema.partial();

// ─── CUTTING ─────────────────────────────────────
export const createCuttingSchema = z.object({
  date: z.coerce.date(),
  cutNumber: z.coerce.number().int().positive('رقم القص مطلوب'),
  cutDescription: z.string().min(1, 'وصف القص مطلوب'),
  materialType: z.string().min(1, 'نوع الخامة مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  layersCount: z.coerce.number().int().positive(),
  spreadLengthM: z.coerce.number().positive(),
  totalPieces: z.coerce.number().int().positive(),
  kgConsumed: z.coerce.number().positive(),
  notes: z.string().optional(),
});

// ─── MODEL PRODUCTION ────────────────────────────
export const createModelProdSchema = z.object({
  date: z.coerce.date(),
  cuttingOrderId: z.coerce.number().int().positive('رقم القص مطلوب'),
  modelCode: z.string().min(1, 'كود الموديل مطلوب'),
  modelDescription: z.string().min(1, 'وصف الموديل مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  sizes: z.string().optional(),
  qtyFromCutting: z.coerce.number().int().positive(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'DEFECTIVE']).default('IN_PROGRESS'),
  wastage: z.coerce.number().int().min(0).default(0),
  qtyReceived: z.coerce.number().int().min(0).optional(),
  warehouseEntryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// ─── FABRIC ──────────────────────────────────────
export const createFabricSchema = z.object({
  date: z.coerce.date(),
  materialType: z.string().min(1, 'نوع الخامة مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  qtyIn: z.coerce.number().positive(),
  costPerKg: z.coerce.number().min(0),
  notes: z.string().optional(),
});

// ─── ACCESSORIES ─────────────────────────────────
export const createAccessorySchema = z.object({
  date: z.coerce.date(),
  itemName: z.string().min(1, 'اسم الإكسسوار مطلوب'),
  qtyIn: z.coerce.number().positive(),
  qtyConsumed: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0),
  notes: z.string().optional(),
});

// ─── READY STOCK ─────────────────────────────────
export const createReadyStockSchema = z.object({
  modelCode: z.string().min(1, 'كود الموديل مطلوب'),
  productName: z.string().min(1, 'اسم المنتج مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  openingBalance: z.coerce.number().int().min(0).default(0),
  costPerPiece: z.coerce.number().min(0).default(0),
  location: z.string().optional(),
});

// ─── EXPENSES ────────────────────────────────────
export const createExpenseSchema = z.object({
  date: z.coerce.date(),
  operationType: z.enum(['CAPITAL', 'OPERATING_EXP', 'SALES_REVENUE', 'LOAN', 'REPAYMENT']),
  statement: z.string().min(1, 'البيان مطلوب'),
  notes: z.string().optional(),
  lines: z.array(z.object({
    partnerId: z.coerce.number().int().positive(),
    amountIn: z.coerce.number().min(0).default(0),
    amountOut: z.coerce.number().min(0).default(0),
  })).min(1, 'يجب إضافة سطر واحد على الأقل'),
});

// ─── DEBTS ───────────────────────────────────────
export const createDebtSchema = z.object({
  date: z.coerce.date(),
  creditor: z.string().min(1, 'اسم الدائن مطلوب'),
  totalAmount: z.coerce.number().positive(),
  amountPaid: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

// ─── CLIENT ACCOUNTS ─────────────────────────────
export const createClientAccountSchema = z.object({
  date: z.coerce.date(),
  clientName: z.string().min(1, 'اسم العميل مطلوب'),
  modelName: z.string().min(1, 'اسم الموديل مطلوب'),
  quantity: z.coerce.number().int().positive(),
  totalAmount: z.coerce.number().positive(),
  amountPaid: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

// ─── RETURNS ─────────────────────────────────────
export const createReturnSchema = z.object({
  date: z.coerce.date(),
  saleId: z.coerce.number().int().positive().optional(),
  clientName: z.string().min(1, 'اسم العميل مطلوب'),
  refundPaidById: z.coerce.number().int().positive().optional(),
  modelCode: z.string().min(1, 'كود الموديل مطلوب'),
  modelColor: z.string().min(1, 'اللون مطلوب'),
  modelQty: z.coerce.number().int().positive(),
  refundAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});
