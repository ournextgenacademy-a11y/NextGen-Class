import { Router } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { admissionDecisionSchema } from '../../validation/schemas';
import { logAuditEvent } from '../../audit/auditLogger';

export const admissionRoutes = Router();

admissionRoutes.post('/decision', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = admissionDecisionSchema.parse(req.body);
    const decisionRecord = {
      id: `dec_${Date.now()}`,
      applicationId: validated.applicationId,
      decision: validated.decision,
      reason: validated.reason,
      decidedBy: req.user?.id,
      decidedAt: new Date(),
    };

    const auditAction = 
      validated.decision === 'ACCEPTED' 
        ? 'APPLICATION_ACCEPTED' 
        : (validated.decision === 'WAITLISTED' ? 'APPLICATION_WAITLISTED' : 'APPLICATION_REJECTED');

    await logAuditEvent({
      userId: req.user?.id,
      action: auditAction,
      entityType: 'APPLICATION',
      entityId: validated.applicationId,
      metadata: { decision: validated.decision, reason: validated.reason },
      ipAddress: req.ip,
    });

    res.status(201).json({ decision: decisionRecord });
  } catch (err) {
    next(err);
  }
});
