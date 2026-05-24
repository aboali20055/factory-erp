import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'هذا السجل موجود بالفعل' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'السجل غير موجود' });
      return;
    }
  }

  // Log unhandled errors
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'حدث خطأ في الخادم',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
