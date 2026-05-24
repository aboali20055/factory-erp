import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';

export const productionController = {
  // ── Cutting Orders ──────────────────────────────
  async listCutting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query as { search?: string };
      const items = await prisma.cuttingOrder.findMany({
        where: {
          deletedAt: null,
          ...(search && {
            OR: [
              { cutDescription: { contains: search, mode: 'insensitive' } },
              { materialType: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          modelProductions: {
            where: { deletedAt: null },
            select: { id: true, modelCode: true, status: true, qtyReceived: true },
          },
        },
        orderBy: { date: 'desc' },
      });
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async createCutting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.cuttingOrder.findFirst({
        where: { cutNumber: req.body.cutNumber, deletedAt: null },
      });
      if (existing) throw new AppError(409, 'رقم القص موجود بالفعل');

      const item = await prisma.cuttingOrder.create({ data: req.body });

      await prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'CREATE', entity: 'cutting_orders', entityId: item.id, newValues: item },
      });

      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateCutting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.cuttingOrder.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'أمر القص غير موجود');

      const item = await prisma.cuttingOrder.update({ where: { id }, data: req.body });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteCutting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.cuttingOrder.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // ── Model Productions ───────────────────────────
  async listModelProd(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status } = req.query as { search?: string; status?: string };
      const items = await prisma.modelProduction.findMany({
        where: {
          deletedAt: null,
          ...(status && { status: status as any }),
          ...(search && {
            OR: [
              { modelCode: { contains: search, mode: 'insensitive' } },
              { modelDescription: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          cuttingOrder: { select: { cutNumber: true, cutDescription: true } },
        },
        orderBy: { date: 'desc' },
      });
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async createModelProd(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verify cutting order exists
      const cuttingOrder = await prisma.cuttingOrder.findFirst({
        where: { id: req.body.cuttingOrderId, deletedAt: null },
      });
      if (!cuttingOrder) throw new AppError(404, 'أمر القص غير موجود');

      const item = await prisma.modelProduction.create({
        data: req.body,
        include: { cuttingOrder: true },
      });

      await prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'CREATE', entity: 'model_productions', entityId: item.id, newValues: item },
      });

      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateModelProd(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.modelProduction.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'الموديل غير موجود');

      const item = await prisma.modelProduction.update({
        where: { id },
        data: req.body,
        include: { cuttingOrder: true },
      });

      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteModelProd(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.modelProduction.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },
};
