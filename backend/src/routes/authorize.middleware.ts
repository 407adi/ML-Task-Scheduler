import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

/**
 * Middleware to authorize users based on their role.
 * @param allowedRoles - An array of roles that are allowed to access the route.
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { role } = authReq.user;
    if (!allowedRoles.includes(role as UserRole)) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to perform this action' });
    }

    next();
  };
};