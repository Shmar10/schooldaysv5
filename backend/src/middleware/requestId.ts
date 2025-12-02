import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID middleware
 * 
 * Adds a unique request ID to each request for tracing and logging purposes.
 * The request ID is available in the request object and response headers.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get request ID from header or generate a new one
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  
  // Store in request object for use in handlers and error handlers
  (req as any).requestId = requestId;
  
  // Add to response headers for client tracing
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

