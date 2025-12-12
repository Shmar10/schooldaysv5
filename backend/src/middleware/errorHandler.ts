import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to automatically catch and forward errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Get request ID from request object (set by requestId middleware)
 */
function getRequestId(req: Request): string | undefined {
  return (req as any).requestId;
}

/**
 * Centralized error handling middleware
 * Should be added after all routes
 */
export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = getRequestId(req);
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      errors: err.errors,
      path: req.path,
      method: req.method,
    }, requestId);

    res.status(400).json({
      error: 'Validation error',
      details: err.errors,
      requestId,
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('Database error', err, {
      code: err.code,
      meta: err.meta,
      path: req.path,
      method: req.method,
    }, requestId);

    // Handle specific Prisma error codes
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Unique constraint violation',
        message: 'A record with this value already exists',
        requestId,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
        requestId,
      });
      return;
    }

    res.status(500).json({
      error: 'Database error',
      requestId,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    logger.error(err.message, err, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    }, requestId);

    res.status(err.statusCode).json({
      error: err.message,
      requestId,
    });
    return;
  }

  // Handle generic errors
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  }, requestId);

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : undefined,
    requestId,
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = getRequestId(req);
  
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  }, requestId);

  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    requestId,
  });
};

