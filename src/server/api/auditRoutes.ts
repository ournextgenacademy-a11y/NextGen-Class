import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { getAuditLogs } from '../../audit/auditLogger';

export const auditRoutes = Router();

auditRoutes.get('/', requireAuth, requireRole(['PROGRAM_MANAGER']), (req, res) => {
  const logs = getAuditLogs();
  res.json({ logs });
});
