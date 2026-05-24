import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthRequest, JwtPayload } from '../types';
import type { UserRole } from '@prisma/client';

/**
 * Verifies the JWT token from Authorization header.
 * Attaches the decoded payload to req.user.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'مطلوب تسجيل الدخول' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' });
  }
}

/**
 * Role-based access control middleware factory.
 * Usage: authorize('ADMIN', 'MANAGER')
 */
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
      return;
    }
    next();
  };
}
