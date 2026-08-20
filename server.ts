import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRoutes } from './src/server/api/authRoutes';
import { programmeRoutes } from './src/server/api/programmeRoutes';
import { applicationRoutes } from './src/server/api/applicationRoutes';
import { assessmentRoutes } from './src/server/api/assessmentRoutes';
import { admissionRoutes } from './src/server/api/admissionRoutes';
import { auditRoutes } from './src/server/api/auditRoutes';
import { errorHandler } from './src/server/middleware/errorHandler';
import { createRateLimiter } from './src/server/middleware/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // Vite Middleware / Static Asset Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NextGen Class Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
