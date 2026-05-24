import { prisma } from '../config/database';
import type { DashboardMetrics } from '../types';

/**
 * Computes all dashboard metrics from the database.
 * All calculations happen server-side — no client polling needed.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Load all data in parallel for performance
  const [
    sales,
    expenseLines,
    debts,
    clientAccounts,
    returns,
    paymentLogs,
    partners,
    readyStockItems,
    fabricEntries,
    accessories,
    modelProductions,
    recentSales,
  ] = await Promise.all([
    prisma.sale.findMany({ where: { deletedAt: null }, include: { items: true } }),
    prisma.expenseLine.findMany({ include: { partner: true, expenseRecord: { select: { deletedAt: true } } } }),
    prisma.debt.findMany({ where: { deletedAt: null } }),
    prisma.clientAccount.findMany({ where: { deletedAt: null } }),
    prisma.returnItem.findMany({ where: { deletedAt: null }, include: { refundPaidBy: true } }),
    prisma.paymentLog.findMany({ include: { receivedBy: true } }),
    prisma.partner.findMany({ where: { isActive: true } }),
    prisma.readyStock.findMany({ where: { deletedAt: null } }),
    prisma.fabricEntry.findMany({ where: { deletedAt: null } }),
    prisma.accessoryEntry.findMany({ where: { deletedAt: null } }),
    prisma.modelProduction.findMany({ where: { deletedAt: null, status: 'COMPLETED' } }),
    prisma.sale.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, orderNumber: true, clientName: true, invoiceValue: true, orderStatus: true, createdAt: true },
    }),
  ]);

  // ── Total sales ──────────────────────────────────
  const totalSales = sales.reduce((s, sale) => s + Number(sale.invoiceValue), 0);

  // ── Per-partner summaries ────────────────────────
  const activeLines = expenseLines.filter((l) => l.expenseRecord.deletedAt === null);
  const partnerSummaries = partners.map((partner) => {
    const lines = activeLines.filter((l) => l.partnerId === partner.id);
    const expenseIn = lines.reduce((s, l) => s + Number(l.amountIn), 0);
    const expenseOut = lines.reduce((s, l) => s + Number(l.amountOut), 0);

    // Deposits received by this partner
    const depositIn = sales
      .filter((s) => s.depositReceiverId === partner.id)
      .reduce((s, sale) => s + Number(sale.depositPaid), 0);

    // Payment logs received by this partner
    const paymentIn = paymentLogs
      .filter((p) => p.receivedById === partner.id && p.type === 'CLIENT_PAYMENT')
      .reduce((s, p) => s + Number(p.amount), 0);

    const debtPaymentOut = paymentLogs
      .filter((p) => p.receivedById === partner.id && p.type === 'DEBT_PAYMENT')
      .reduce((s, p) => s + Number(p.amount), 0);

    // Return refunds paid by this partner
    const returnRefundOut = returns
      .filter((r) => r.refundPaidById === partner.id)
      .reduce((s, r) => s + Number(r.refundAmount), 0);

    const totalIn = expenseIn + depositIn + paymentIn;
    const totalOut = expenseOut + debtPaymentOut + returnRefundOut;

    return { id: partner.id, name: partner.name, totalIn, totalOut, net: totalIn - totalOut };
  });

  const totalIn = partnerSummaries.reduce((s, p) => s + p.totalIn, 0);
  const totalOut = partnerSummaries.reduce((s, p) => s + p.totalOut, 0);
  const netProfit = totalIn - totalOut;

  // ── Remaining debts ──────────────────────────────
  const remainingDebts = debts.reduce((s, d) => s + Number(d.remaining), 0);

  // ── Money owed to us ─────────────────────────────
  const moneyOwedToUs =
    sales
      .filter((s) => s.orderStatus === 'NOT_DISPATCHED')
      .reduce((s, sale) => s + Number(sale.remaining), 0) +
    clientAccounts.reduce((s, ca) => s + Number(ca.remaining), 0);

  const cashAvailable = totalIn - totalOut - remainingDebts;

  // ── Inventory values ─────────────────────────────
  // Fabric value
  const fabricConsumedMap = new Map<string, number>();
  const cuttingOrders = await prisma.cuttingOrder.findMany({ where: { deletedAt: null } });
  cuttingOrders.forEach((c) => {
    const key = `${c.materialType}__${c.color}`;
    fabricConsumedMap.set(key, (fabricConsumedMap.get(key) ?? 0) + Number(c.kgConsumed));
  });
  const fabricInMap = new Map<string, number>();
  fabricEntries.forEach((f) => {
    const key = `${f.materialType}__${f.color}`;
    fabricInMap.set(key, (fabricInMap.get(key) ?? 0) + Number(f.qtyIn));
  });
  const fabricValue = fabricEntries.reduce((sum, f) => {
    const key = `${f.materialType}__${f.color}`;
    const balance = Math.max(0, (fabricInMap.get(key) ?? 0) - (fabricConsumedMap.get(key) ?? 0));
    return sum + balance * Number(f.costPerKg);
  }, 0);

  // Stock value
  const prodMap = new Map<string, number>();
  modelProductions.forEach((p) => {
    const key = `${p.modelCode}__${p.color}`;
    prodMap.set(key, (prodMap.get(key) ?? 0) + (p.qtyReceived ?? 0));
  });
  const salesMap = new Map<string, number>();
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const key = `${item.modelCode}__${item.color}`;
      salesMap.set(key, (salesMap.get(key) ?? 0) + item.quantity);
    });
  });
  const stockValue = readyStockItems.reduce((sum, item) => {
    const key = `${item.modelCode}__${item.color}`;
    const balance = Math.max(
      0,
      item.openingBalance + (prodMap.get(key) ?? 0) - (salesMap.get(key) ?? 0),
    );
    return sum + balance * Number(item.costPerPiece);
  }, 0);

  // Accessories value
  const accessoriesValue = accessories.reduce((sum, a) => {
    const balance = Math.max(0, Number(a.qtyIn) - Number(a.qtyConsumed));
    return sum + balance * Number(a.cost);
  }, 0);

  const totalCurrentAssets = fabricValue + stockValue + accessoriesValue + moneyOwedToUs;

  // ── Charts data ──────────────────────────────────
  const salesByMarketerMap = new Map<string, number>();
  sales.forEach((s) => {
    salesByMarketerMap.set(s.marketerName, (salesByMarketerMap.get(s.marketerName) ?? 0) + Number(s.invoiceValue));
  });
  const salesByMarketer = Array.from(salesByMarketerMap.entries()).map(([name, value]) => ({ name, value }));

  const orderStatusMap = new Map<string, number>();
  sales.forEach((s) => {
    orderStatusMap.set(s.orderStatus, (orderStatusMap.get(s.orderStatus) ?? 0) + 1);
  });
  const statusLabels: Record<string, string> = {
    DISPATCHED: 'تم الصرف',
    NOT_DISPATCHED: 'لم يتم الصرف',
    CLIENT_ACCOUNT: 'حساب عميل',
  };
  const orderStatusCounts = Array.from(orderStatusMap.entries()).map(([status, value]) => ({
    name: statusLabels[status] ?? status,
    value,
  }));

  // ── Inventory alerts ─────────────────────────────
  const inventoryAlerts = readyStockItems
    .map((item) => {
      const key = `${item.modelCode}__${item.color}`;
      const balance = item.openingBalance + (prodMap.get(key) ?? 0) - (salesMap.get(key) ?? 0);
      return { ...item, balance };
    })
    .filter((item) => item.balance <= 5)
    .map((item) => ({
      type: (item.balance < 0 ? 'negative_stock' : 'low_stock') as 'low_stock' | 'negative_stock',
      modelCode: item.modelCode,
      productName: item.productName,
      color: item.color,
      currentBalance: item.balance,
    }));

  return {
    totalSales,
    totalExpenses: totalOut,
    netProfit,
    remainingDebts,
    moneyOwedToUs,
    cashAvailable,
    totalCurrentAssets,
    partnerSummaries,
    salesByMarketer,
    orderStatusCounts,
    recentSales: recentSales.map((s) => ({
      ...s,
      invoiceValue: Number(s.invoiceValue),
    })),
    inventoryAlerts,
  };
}
