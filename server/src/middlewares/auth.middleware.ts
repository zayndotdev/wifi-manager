import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    role: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = authService.verifyToken(token);

  if (!user) {
    res.status(401).json({ error: 'Session expired or token invalid. Please log in again.', code: 'INVALID_TOKEN' });
    return;
  }

  req.user = user;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = authService.verifyToken(token);
    if (user) req.user = user;
  }
  next();
};
