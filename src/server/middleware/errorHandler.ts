import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Do not expose stack traces in production
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && { details: err.details || err.stack }),
    },
  });
}
