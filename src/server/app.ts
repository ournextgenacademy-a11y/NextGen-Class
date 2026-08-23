import express from 'express';
import { authRoutes } from './api/authRoutes';
import { programmeRoutes } from './api/programmeRoutes';
import { applicationRoutes } from './api/applicationRoutes';
import { assessmentRoutes } from './api/assessmentRoutes';
import { admissionRoutes } from './api/admissionRoutes';
import { auditRoutes } from './api/auditRoutes';
import { errorHandler } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimiter';

export function createApp() {
  const app = express();

  // Basic Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Rate Limiter for API
  app.use('/api', createRateLimiter({ windowMs: 60 * 1000, maxRequests: 300 }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'NextGen Class Core API',
      timestamp: new Date().toISOString(),
      version: '0.1.0-alpha',
    });
  });

  // Mount API Sub-routers
  app.use('/api/auth', authRoutes);
  app.use('/api/programmes', programmeRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/admissions', admissionRoutes);
  app.use('/api/audit-logs', auditRoutes);

  // Global API Error Handler
  app.use('/api', errorHandler);

  return app;
}

export const app = createApp();
export default app;
