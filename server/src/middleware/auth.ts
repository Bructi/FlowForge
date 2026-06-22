import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { createError } from './errorHandler';
import { getDb } from '../db/database';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const doAuth = async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await getDb()('users').select('id', 'email', 'role').where('id', payload.userId).first();
    if (!user) throw createError('User not found', 401, 'UNAUTHORIZED');

    req.user = payload;
    next();
  };

  doAuth().catch((error: any) => {
    if (error.name === 'TokenExpiredError') next(createError('Token expired', 401, 'TOKEN_EXPIRED'));
    else if (error.name === 'JsonWebTokenError') next(createError('Invalid token', 401, 'INVALID_TOKEN'));
    else next(error);
  });
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(createError('Insufficient permissions', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
    }
  } catch { /* ignore */ }
  next();
}
