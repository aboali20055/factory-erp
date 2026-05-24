import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';

// ─── READY STOCK ─────────────────────────────────

export const inventoryController = {
  // Ready Stock
  async listReadyStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await prisma.readyStock.findMany({
        where: { deletedAt: null },
        orderBy: [{ modelCode: 'asc' }, { color: 'asc' }],
      });

      // Compute balances: opening + completed production - sales + returns
      const [productions, saleItems, returns] = await Promise.all([
        prisma.modelProduction.findMany({
          where: { status: 'COMPLETED', deletedAt: null },
          select: { modelCode: true, color: true, qtyReceived: true },
        }),
        prisma.saleItem.findMany({
          include: { sale: { select: { deletedAt: true } } },
        }),
        prisma.returnItem.findMany({ where: { deletedAt: null } }),
      ]);

      const prodMap = new Map<string, number>();
      productions.forEach((p) => {
        const key = `${p.modelCode}__${p.color}`;
        prodMap.set(key, (prodMap.get(key) ?? 0) + (p.qtyReceived ?? 0));
      });

      const salesMap = new Map<string, number>();
      saleItems
        .filter((si) => si.sale.deletedAt === null)
        .forEach((si) => {
          const key = `${si.modelCode}__${si.color}`;
          salesMap.set(key, (salesMap.get(key) ?? 0) + si.quantity);
        });

      const returnsMap = new Map<string, number>();
      returns.forEach((r) => {
        const key = `${r.modelCode}__${r.modelColor}`;
        returnsMap.set(key, (returnsMap.get(key) ?? 0) + r.modelQty);
      });

      const computed = items.map((item) => {
        const key = `${item.modelCode}__${item.color}`;
        const newProduction = prodMap.get(key) ?? 0;
        const totalSales = salesMap.get(key) ?? 0;
        const totalReturns = returnsMap.get(key) ?? 0;
        return {
          ...item,
          newProduction,
          totalSales,
          totalReturns,
          actualBalance: item.openingBalance + newProduction - totalSales + totalReturns,
        };
      });

      res.json({ success: true, data: computed });
    } catch (err) {
      next(err);
    }
  },

  async createReadyStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await prisma.readyStock.create({ data: req.body });
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateReadyStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const item = await prisma.readyStock.update({ where: { id }, data: req.body });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteReadyStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.readyStock.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // Fabric
  async listFabric(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await prisma.fabricEntry.findMany({
        where: { deletedAt: null },
        orderBy: { date: 'desc' },
      });

      const cuttingOrders = await prisma.cuttingOrder.findMany({
        where: { deletedAt: null },
        select: { materialType: true, color: true, kgConsumed: true },
      });

      const consumedMap = new Map<string, number>();
      cuttingOrders.forEach((c) => {
        const key = `${c.materialType}__${c.color}`;
        consumedMap.set(key, (consumedMap.get(key) ?? 0) + Number(c.kgConsumed));
      });

      const inMap = new Map<string, number>();
      entries.forEach((e) => {
        const key = `${e.materialType}__${e.color}`;
        inMap.set(key, (inMap.get(key) ?? 0) + Number(e.qtyIn));
      });

      const computed = entries.map((entry) => {
        const key = `${entry.materialType}__${entry.color}`;
        return {
          ...entry,
          qtyConsumed: consumedMap.get(key) ?? 0,
          availableBalance: (inMap.get(key) ?? 0) - (consumedMap.get(key) ?? 0),
        };
      });

      res.json({ success: true, data: computed });
    } catch (err) {
      next(err);
    }
  },

  async createFabric(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await prisma.fabricEntry.create({ data: req.body });
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateFabric(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const item = await prisma.fabricEntry.update({ where: { id }, data: req.body });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteFabric(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.fabricEntry.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // Accessories
  async listAccessories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await prisma.accessoryEntry.findMany({
        where: { deletedAt: null },
        orderBy: { date: 'desc' },
      });

      const aggMap = new Map<string, { qtyIn: number; qtyConsumed: number }>();
      items.forEach((a) => {
        const existing = aggMap.get(a.itemName) ?? { qtyIn: 0, qtyConsumed: 0 };
        aggMap.set(a.itemName, {
          qtyIn: existing.qtyIn + Number(a.qtyIn),
          qtyConsumed: existing.qtyConsumed + Number(a.qtyConsumed),
        });
      });

      const computed = items.map((item) => {
        const agg = aggMap.get(item.itemName) ?? { qtyIn: 0, qtyConsumed: 0 };
        return { ...item, availableBalance: agg.qtyIn - agg.qtyConsumed };
      });

      res.json({ success: true, data: computed });
    } catch (err) {
      next(err);
    }
  },

  async createAccessory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await prisma.accessoryEntry.create({ data: req.body });
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateAccessory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const item = await prisma.accessoryEntry.update({ where: { id }, data: req.body });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteAccessory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.accessoryEntry.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },
};
