import { Router } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { submitApplicationSchema } from '../../validation/schemas';
import { logAuditEvent } from '../../audit/auditLogger';

export const applicationRoutes = Router();

const inMemoryApplications = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    applicantId: '00000000-0000-0000-0000-000000000001',
    programmeId: '20000000-0000-0000-0000-000000000001',
    cohortId: '30000000-0000-0000-0000-000000000001',
    status: 'ADMITTED',
    submittedAt: new Date('2026-08-10'),
    decision: 'ACCEPTED',
  },
];

// GET /api/applications - Program Manager gets all; Applicant gets only their own
applicationRoutes.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user?.role === 'PROGRAM_MANAGER') {
    res.json({ applications: inMemoryApplications });
  } else {
    const own = inMemoryApplications.filter(a => a.applicantId === req.user?.id);
    res.json({ applications: own });
  }
});

// GET /api/applications/:id - Enforces ownership
applicationRoutes.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const app = inMemoryApplications.find(a => a.id === req.params.id);
  if (!app) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } });
    return;
  }

  // Ownership verification
  if (req.user?.role !== 'PROGRAM_MANAGER' && app.applicantId !== req.user?.id) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'You are not authorized to view another applicant’s application.' },
    });
    return;
  }

  res.json({ application: app });
});

// POST /api/applications - Create / Submit Application
applicationRoutes.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = submitApplicationSchema.parse(req.body);
    const newApp = {
      id: `app_${Date.now()}`,
      applicantId: req.user?.id!,
      programmeId: validated.programmeId,
      cohortId: validated.cohortId,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    };

    inMemoryApplications.push(newApp as any);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: newApp.id,
      ipAddress: req.ip,
    });

    res.status(201).json({ application: newApp });
  } catch (err) {
    next(err);
  }
});
