import express from 'express';
import cors from 'cors';
import { schoolYearRoutes } from './routes/schoolYears';
import { dayRoutes } from './routes/days';
import { scheduleRoutes } from './routes/schedules';
import { breakRoutes } from './routes/breaks';
import { uploadRoutes } from './routes/uploads';
import { dashboardRoutes } from './routes/dashboard';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

// Environment variables are validated in ./config/env.ts
// Importing env will validate all required variables and exit if invalid

const app = express();
const PORT = env.PORT;

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware for requests
app.use((req, res, next) => {
  const requestId = (req as any).requestId;
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, requestId);
  next();
});

// Root route - API information
app.get('/', (req, res) => {
  const requestId = (req as any).requestId;
  res.json({
    name: 'School Year Calendar API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      schoolYears: '/api/school-years',
      days: '/api/days',
      schedules: '/api/schedules',
      breaks: '/api/breaks',
      uploads: '/api/uploads',
      dashboard: '/api/dashboard',
    },
    requestId,
  });
});

// Routes
app.use('/api/school-years', schoolYearRoutes);
app.use('/api/days', dayRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const requestId = (req as any).requestId;
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    requestId,
  });
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    nodeEnv: env.NODE_ENV,
  });
});

