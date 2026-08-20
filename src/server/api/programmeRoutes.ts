import { Router } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { 
  createProgrammeSchema, 
  updateProgrammeSchema, 
  createCohortSchema, 
  updateCohortSchema 
} from '../../validation/schemas';
import { logAuditEvent } from '../../audit/auditLogger';

export const programmeRoutes = Router();

export interface ProgrammeRecord {
  id: string;
  name: string;
  slug?: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | string;
  createdAt: string;
  updatedAt: string;
}

export interface CohortRecord {
  id: string;
  programmeId: string;
  name: string;
  applicationOpenDate?: string | Date;
  applicationCloseDate?: string | Date;
  programmeStartDate?: string | Date;
  programmeEndDate?: string | Date;
  capacity: number;
  description?: string;
  status: 'DRAFT' | 'APPLICATIONS_OPEN' | 'APPLICATIONS_CLOSED' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | string;
  createdAt: string;
  updatedAt: string;
}

export const inMemoryProgrammes: ProgrammeRecord[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Applied Machine Learning & Autonomous Systems',
    slug: 'applied-ml-autonomous-systems',
    description: 'Master practical LLM architectures, multi-agent frameworks, and vector search systems.',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

export const inMemoryCohorts: CohortRecord[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    programmeId: '20000000-0000-0000-0000-000000000001',
    name: 'Fall 2026 Flagship Fellowship',
    applicationOpenDate: '2026-08-01',
    applicationCloseDate: '2026-09-30',
    programmeStartDate: '2026-10-15',
    programmeEndDate: '2027-01-30',
    status: 'APPLICATIONS_OPEN',
    capacity: 50,
    description: 'Premier inaugural fellowship with intensive hands-on lab projects.',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

// ==========================================
// PROGRAMME ROUTES
// ==========================================

// GET /api/programmes - Accessible by all authenticated users
programmeRoutes.get('/', requireAuth, (req, res) => {
  res.json({ programmes: inMemoryProgrammes });
});

// GET /api/programmes/:id
programmeRoutes.get('/:id', requireAuth, (req, res) => {
  const programme = inMemoryProgrammes.find(p => p.id === req.params.id);
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' });
  }
  const cohorts = inMemoryCohorts.filter(c => c.programmeId === programme.id);
  res.json({ programme, cohorts });
});

// POST /api/programmes - Create programme (PROGRAM_MANAGER only)
programmeRoutes.post('/', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = createProgrammeSchema.parse(req.body);
    const now = new Date().toISOString();
    const newProg: ProgrammeRecord = {
      id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: validated.name,
      slug: validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: validated.description || '',
      status: (validated.status || 'ACTIVE').toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    inMemoryProgrammes.unshift(newProg);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'FORM_CREATED',
      entityType: 'PROGRAMME',
      entityId: newProg.id,
      metadata: { name: newProg.name, status: newProg.status },
      ipAddress: req.ip,
    });

    res.status(201).json({ programme: newProg });
  } catch (err) {
    next(err);
  }
});

// PUT /api/programmes/:id - Edit programme (PROGRAM_MANAGER only)
programmeRoutes.put('/:id', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const index = inMemoryProgrammes.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Programme not found' });
    }
    const validated = updateProgrammeSchema.parse(req.body);
    const now = new Date().toISOString();
    
    inMemoryProgrammes[index] = {
      ...inMemoryProgrammes[index],
      ...(validated.name && { name: validated.name }),
      ...(validated.slug && { slug: validated.slug }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.status && { status: validated.status.toUpperCase() }),
      updatedAt: now,
    };

    await logAuditEvent({
      userId: req.user?.id,
      action: 'ROLE_REVOKED', // Updates audit
      entityType: 'PROGRAMME',
      entityId: req.params.id,
      metadata: { updates: validated },
      ipAddress: req.ip,
    });

    res.json({ programme: inMemoryProgrammes[index] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/programmes/:id/status - Activate / Deactivate / Archive
programmeRoutes.patch('/:id/status', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'DRAFT', 'ARCHIVED', 'active', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required (ACTIVE, DRAFT, ARCHIVED)' });
    }
    const index = inMemoryProgrammes.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Programme not found' });
    }
    const now = new Date().toISOString();
    inMemoryProgrammes[index].status = status.toUpperCase();
    inMemoryProgrammes[index].updatedAt = now;

    res.json({ programme: inMemoryProgrammes[index] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/programmes/:id - Archive programme
programmeRoutes.delete('/:id', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res) => {
  const index = inMemoryProgrammes.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Programme not found' });
  }
  inMemoryProgrammes[index].status = 'ARCHIVED';
  inMemoryProgrammes[index].updatedAt = new Date().toISOString();
  res.json({ message: 'Programme archived successfully', programme: inMemoryProgrammes[index] });
});

// ==========================================
// COHORT ROUTES
// ==========================================

// GET /api/cohorts - Accessible by all authenticated users
programmeRoutes.get('/cohorts/all', requireAuth, (req, res) => {
  const { programmeId } = req.query;
  if (programmeId) {
    return res.json({ cohorts: inMemoryCohorts.filter(c => c.programmeId === programmeId) });
  }
  res.json({ cohorts: inMemoryCohorts });
});

programmeRoutes.get('/cohorts', requireAuth, (req, res) => {
  const { programmeId } = req.query;
  if (programmeId) {
    return res.json({ cohorts: inMemoryCohorts.filter(c => c.programmeId === programmeId) });
  }
  res.json({ cohorts: inMemoryCohorts });
});

// GET /api/cohorts/:id
programmeRoutes.get('/cohorts/:id', requireAuth, (req, res) => {
  const cohort = inMemoryCohorts.find(c => c.id === req.params.id);
  if (!cohort) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  res.json({ cohort });
});

// POST /api/cohorts - Create cohort (PROGRAM_MANAGER only)
programmeRoutes.post('/cohorts', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = createCohortSchema.parse(req.body);
    const now = new Date().toISOString();
    const newCohort: CohortRecord = {
      id: `coh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      programmeId: validated.programmeId,
      name: validated.name,
      applicationOpenDate: validated.applicationOpenDate || now.split('T')[0],
      applicationCloseDate: validated.applicationCloseDate || '',
      programmeStartDate: validated.programmeStartDate || '',
      programmeEndDate: validated.programmeEndDate || '',
      capacity: validated.capacity || 50,
      description: validated.description || '',
      status: (validated.status || 'APPLICATIONS_OPEN').toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    inMemoryCohorts.unshift(newCohort);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'FORM_CREATED',
      entityType: 'COHORT',
      entityId: newCohort.id,
      metadata: { name: newCohort.name, programmeId: newCohort.programmeId },
      ipAddress: req.ip,
    });

    res.status(201).json({ cohort: newCohort });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cohorts/:id - Edit cohort (PROGRAM_MANAGER only)
programmeRoutes.put('/cohorts/:id', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const index = inMemoryCohorts.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cohort not found' });
    }
    const validated = updateCohortSchema.parse(req.body);
    const now = new Date().toISOString();

    inMemoryCohorts[index] = {
      ...inMemoryCohorts[index],
      ...(validated.name && { name: validated.name }),
      ...(validated.programmeId && { programmeId: validated.programmeId }),
      ...(validated.applicationOpenDate !== undefined && { applicationOpenDate: validated.applicationOpenDate }),
      ...(validated.applicationCloseDate !== undefined && { applicationCloseDate: validated.applicationCloseDate }),
      ...(validated.programmeStartDate !== undefined && { programmeStartDate: validated.programmeStartDate }),
      ...(validated.programmeEndDate !== undefined && { programmeEndDate: validated.programmeEndDate }),
      ...(validated.capacity !== undefined && { capacity: validated.capacity }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.status && { status: validated.status.toUpperCase() }),
      updatedAt: now,
    };

    res.json({ cohort: inMemoryCohorts[index] });
  } catch (err) {
    next(err);
  }
});

// POST /api/cohorts/:id/open-applications - Shortcut to open applications
programmeRoutes.post('/cohorts/:id/open-applications', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res) => {
  const index = inMemoryCohorts.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  inMemoryCohorts[index].status = 'APPLICATIONS_OPEN';
  inMemoryCohorts[index].updatedAt = new Date().toISOString();
  res.json({ message: 'Applications opened', cohort: inMemoryCohorts[index] });
});

// POST /api/cohorts/:id/close-applications - Shortcut to close applications
programmeRoutes.post('/cohorts/:id/close-applications', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res) => {
  const index = inMemoryCohorts.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  inMemoryCohorts[index].status = 'APPLICATIONS_CLOSED';
  inMemoryCohorts[index].updatedAt = new Date().toISOString();
  res.json({ message: 'Applications closed', cohort: inMemoryCohorts[index] });
});

// DELETE /api/cohorts/:id - Archive cohort
programmeRoutes.delete('/cohorts/:id', requireAuth, requireRole(['PROGRAM_MANAGER']), async (req: AuthenticatedRequest, res) => {
  const index = inMemoryCohorts.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  inMemoryCohorts[index].status = 'ARCHIVED';
  inMemoryCohorts[index].updatedAt = new Date().toISOString();
  res.json({ message: 'Cohort archived', cohort: inMemoryCohorts[index] });
});

