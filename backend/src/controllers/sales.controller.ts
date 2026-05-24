import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type { Prisma } from '@prisma/client';

export const salesController = {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 50, search, sortOrder = 'desc', sortBy = 'createdAt' } = req.query as any;
      const skip = (Number(page) - 1) * Number(limit);

      const where: Prisma.SaleWhereInput = {
        deletedAt: null,
        ...(search && {
          OR: [
            { orderNumber: { contains: search as string, mode: 'insensitive' } },
            { clientName: { contains: search as string, mode: 'insensitive' } },
            { marketerName: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            items: { orderBy: { id: 'asc' } },
            depositReceiver: { select: { id: true, name: true } },
          },
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: Number(limit),
        }),
        prisma.sale.count({ where }),
      ]);

      res.json({
        success: true,
        data: items,
        meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
      });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const sale = await prisma.sale.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: true,
          depositReceiver: true,
          returns: true,
          paymentLogs: { include: { receivedBy: true } },
        },
      });

      if (!sale) throw new AppError(404, 'الطلب غير موجود');
      res.json({ success: true, data: sale });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, ...saleData } = req.body;
      const remaining = saleData.invoiceValue - (saleData.depositPaid || 0);

      const sale = await prisma.sale.create({
        data: {
          ...saleData,
          remaining,
          items: { create: items },
        },
        include: { items: true },
      });

      // Audit log
      await prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'CREATE', entity: 'sales', entityId: sale.id, newValues: sale as any },
      });

      res.status(201).json({ success: true, data: sale });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'الطلب غير موجود');

      const { items, ...saleData } = req.body;
      const invoiceValue = saleData.invoiceValue ?? existing.invoiceValue;
      const depositPaid = saleData.depositPaid ?? existing.depositPaid;
      const remaining = Number(invoiceValue) - Number(depositPaid);

      const sale = await prisma.$transaction(async (tx) => {
        // Replace all items
        if (items) {
          await tx.saleItem.deleteMany({ where: { saleId: id } });
        }

        return tx.sale.update({
          where: { id },
          data: {
            ...saleData,
            remaining,
            ...(items && { items: { create: items } }),
          },
          include: { items: true },
        });
      });

      await prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'UPDATE', entity: 'sales', entityId: id, oldValues: existing as any, newValues: sale as any },
      });

      res.json({ success: true, data: sale });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'الطلب غير موجود');

      // Soft delete
      await prisma.sale.update({ where: { id }, data: { deletedAt: new Date() } });

      await prisma.auditLog.create({
        data: { userId: req.user.userId, action: 'DELETE', entity: 'sales', entityId: id, oldValues: existing as any },
      });

      res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // Returns
  async listReturns(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const returns = await prisma.returnItem.findMany({
        where: { deletedAt: null },
        include: { refundPaidBy: true, sale: { select: { orderNumber: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: returns });
    } catch (err) {
      next(err);
    }
  },

  async createReturn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnItem = await prisma.returnItem.create({ data: req.body });
      res.status(201).json({ success: true, data: returnItem });
    } catch (err) {
      next(err);
    }
  },
};
