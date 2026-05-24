import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import type { AuthRequest } from '../types';

export const authController = {
  /**
   * POST /api/auth/login
   * Returns JWT token on successful credential verification.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.isActive) {
        res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   * Returns the current authenticated user's profile.
   */
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
        return;
      }

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/users  (ADMIN only)
   * Lists all users.
   */
  async listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/users  (ADMIN only)
   * Creates a new user account.
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body as {
        name: string; email: string; password: string; role: string;
      };

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: role as any },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/auth/users/:id  (ADMIN only)
   * Updates user role or active status.
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { role, isActive } = req.body as { role?: string; isActive?: boolean };

      const user = await prisma.user.update({
        where: { id },
        data: { ...(role && { role: role as any }), ...(isActive !== undefined && { isActive }) },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
