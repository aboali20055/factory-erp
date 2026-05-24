import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';

export const financeController = {
  // ── Expenses ────────────────────────────────────
  async listExpenses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query as { search?: string };
      const items = await prisma.expenseRecord.findMany({
        where: {
          deletedAt: null,
          ...(search && { statement: { contains: search as string, mode: 'insensitive' } }),
        },
        include: { lines: { include: { partner: true } } },
        orderBy: { date: 'desc' },
      });
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async createExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lines, ...expenseData } = req.body;
      const record = await prisma.expenseRecord.create({
        data: { ...expenseData, lines: { create: lines } },
        include: { lines: { include: { partner: true } } },
      });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  async updateExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { lines, ...expenseData } = req.body;
      const record = await prisma.$transaction(async (tx) => {
        if (lines) await tx.expenseLine.deleteMany({ where: { expenseRecordId: id } });
        return tx.expenseRecord.update({
          where: { id },
          data: { ...expenseData, ...(lines && { lines: { create: lines } }) },
          include: { lines: { include: { partner: true } } },
        });
      });
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  async deleteExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.expenseRecord.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // ── Debts ───────────────────────────────────────
  async listDebts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await prisma.debt.findMany({
        where: { deletedAt: null },
        include: { paymentLogs: true },
        orderBy: { date: 'desc' },
      });
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async createDebt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { totalAmount, amountPaid = 0, ...rest } = req.body;
      const item = await prisma.debt.create({
        data: { ...rest, totalAmount, amountPaid, remaining: totalAmount - amountPaid },
      });
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateDebt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.debt.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'الدين غير موجود');

      const totalAmount = req.body.totalAmount ?? existing.totalAmount;
      const amountPaid = req.body.amountPaid ?? existing.amountPaid;
      const remaining = Number(totalAmount) - Number(amountPaid);

      const item = await prisma.debt.update({
        where: { id },
        data: { ...req.body, remaining },
      });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteDebt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.debt.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // ── Client Accounts ─────────────────────────────
  async listClientAccounts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query as { search?: string };
      const items = await prisma.clientAccount.findMany({
        where: {
          deletedAt: null,
          ...(search && { clientName: { contains: search, mode: 'insensitive' } }),
        },
        include: { paymentLogs: { include: { receivedBy: true } } },
        orderBy: { date: 'desc' },
      });
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async createClientAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { totalAmount, amountPaid = 0, ...rest } = req.body;
      const item = await prisma.clientAccount.create({
        data: { ...rest, totalAmount, amountPaid, remaining: totalAmount - amountPaid },
      });
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateClientAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.clientAccount.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'حساب العميل غير موجود');

      const totalAmount = req.body.totalAmount ?? existing.totalAmount;
      const amountPaid = req.body.amountPaid ?? existing.amountPaid;
      const remaining = Number(totalAmount) - Number(amountPaid);

      const item = await prisma.clientAccount.update({
        where: { id },
        data: { ...req.body, remaining },
      });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async deleteClientAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await prisma.clientAccount.update({ where: { id }, data: { deletedAt: new Date() } });
      res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (err) {
      next(err);
    }
  },

  // ── Partners ────────────────────────────────────
  async listPartners(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const partners = await prisma.partner.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: partners });
    } catch (err) {
      next(err);
    }
  },

  async createPartner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await prisma.partner.create({ data: req.body });
      res.status(201).json({ success: true, data: partner });
    } catch (err) {
      next(err);
    }
  },

  // ── Payment Logs ────────────────────────────────
  async createPaymentLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await prisma.paymentLog.create({
        data: req.body,
        include: { receivedBy: true },
      });
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },
};
