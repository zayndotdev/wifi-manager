import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Gateway Error',
    code: err.code || 'ERR_INTERNAL_SERVER',
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
