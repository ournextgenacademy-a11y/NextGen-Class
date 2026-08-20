import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAuditEvent } from '../../audit/auditLogger';

export const assessmentRoutes = Router();

// Server-side assessment attempt store
interface ServerAssessmentAttempt {
  id: string;
  assessmentId: string;
  applicantId: string;
  applicationId: string;
  status: 'in_progress' | 'submitted' | 'timed_out';
  startedAt: string;
  serverStartEpoch: number;
  durationMinutes: number;
  serverExpireEpoch: number;
  answers: Record<string, string | string[]>;
  flaggedQuestions: string[];
  lastSavedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  percentageScore?: number;
  passed?: boolean;
}

const inMemoryAttempts: ServerAssessmentAttempt[] = [];

// Endpoint to provide authoritative server time
assessmentRoutes.get('/server-time', (req, res) => {
  const now = new Date();
  res.json({
    serverTime: now.toISOString(),
    epochMs: now.getTime(),
    timezone: 'UTC',
  });
});

// List assessments
assessmentRoutes.get('/', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Start an attempt with strict server-side validation
assessmentRoutes.post('/:id/start-attempt', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { applicantId, applicationId, durationMinutes = 30, assessmentState = 'open', openDate, openTime, closeDate, closeTime } = req.body;
  const user = req.user;
  const effectiveApplicantId = applicantId || user?.id || 'anonymous-applicant';

  const now = new Date();
  const nowEpoch = now.getTime();

  // 1. Check assessment availability according to state and server time
  const normalizedState = (assessmentState || 'open').toLowerCase();
  if (normalizedState === 'draft') {
    return res.status(403).json({
      error: 'Assessment is currently in DRAFT mode and cannot be started.',
      code: 'ASSESSMENT_DRAFT',
    });
  }

  if (normalizedState === 'closed' || normalizedState === 'archived') {
    return res.status(403).json({
      error: 'Assessment is CLOSED by the admissions board.',
      code: 'ASSESSMENT_CLOSED',
    });
  }

  if (normalizedState === 'scheduled') {
    if (openDate) {
      const openTimeStr = openTime || '00:00';
      const openTimestamp = new Date(`${openDate}T${openTimeStr}:00`).getTime();
      if (!isNaN(openTimestamp) && nowEpoch < openTimestamp) {
        return res.status(403).json({
          error: `Assessment is scheduled to open at ${openDate} ${openTimeStr}.`,
          code: 'ASSESSMENT_NOT_STARTED',
        });
      }
    }
    if (closeDate) {
      const closeTimeStr = closeTime || '23:59';
      const closeTimestamp = new Date(`${closeDate}T${closeTimeStr}:00`).getTime();
      if (!isNaN(closeTimestamp) && nowEpoch > closeTimestamp) {
        return res.status(403).json({
          error: `Assessment testing window expired at ${closeDate} ${closeTimeStr}.`,
          code: 'ASSESSMENT_EXPIRED',
        });
      }
    }
  }

  // 2. Prevent unauthorized duplicate attempts
  const existingAttempt = inMemoryAttempts.find(
    a => a.assessmentId === id && 
         (a.applicantId === effectiveApplicantId || (applicationId && a.applicationId === applicationId))
  );

  if (existingAttempt) {
    if (existingAttempt.status === 'submitted') {
      return res.status(403).json({
        error: 'Assessment has already been completed and submitted. Duplicate attempts are not permitted.',
        code: 'ALREADY_SUBMITTED',
        attempt: existingAttempt,
      });
    }

    // Attempt is already in progress: return existing attempt with remaining time calculated strictly from original server start
    const remainingSeconds = Math.max(0, Math.floor((existingAttempt.serverExpireEpoch - nowEpoch) / 1000));
    return res.json({
      message: 'Resuming existing active attempt.',
      attempt: existingAttempt,
      remainingSeconds,
      serverTime: now.toISOString(),
    });
  }

  // 3. Create fresh attempt locked to server time
  const duration = Number(durationMinutes) || 30;
  const expireEpoch = nowEpoch + duration * 60 * 1000;

  const newAttempt: ServerAssessmentAttempt = {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    assessmentId: id,
    applicantId: effectiveApplicantId,
    applicationId: applicationId || `app_${Date.now()}`,
    status: 'in_progress',
    startedAt: now.toISOString(),
    serverStartEpoch: nowEpoch,
    durationMinutes: duration,
    serverExpireEpoch: expireEpoch,
    answers: {},
    flaggedQuestions: [],
    lastSavedAt: now.toISOString(),
  };

  inMemoryAttempts.push(newAttempt);

  await logAuditEvent({
    userId: effectiveApplicantId,
    action: 'ASSESSMENT_ATTEMPT_STARTED',
    entityType: 'ASSESSMENT',
    entityId: id,
    metadata: { attemptId: newAttempt.id, durationMinutes: duration },
    ipAddress: req.ip,
  });

  return res.status(201).json({
    message: 'Assessment attempt initialized.',
    attempt: newAttempt,
    remainingSeconds: duration * 60,
    serverTime: now.toISOString(),
  });
});

// Auto-save attempt progress (answers, flagged, bookmark state)
assessmentRoutes.put('/:id/save-attempt', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { attemptId, applicantId, answers, flaggedQuestions } = req.body;
  const effectiveApplicantId = applicantId || req.user?.id;

  const attempt = inMemoryAttempts.find(
    a => (attemptId && a.id === attemptId) || (a.assessmentId === id && a.applicantId === effectiveApplicantId)
  );

  if (!attempt) {
    return res.status(404).json({ error: 'Active attempt not found.' });
  }

  if (attempt.status === 'submitted') {
    return res.status(400).json({ error: 'Cannot update a locked, submitted assessment.' });
  }

  const now = new Date();
  if (answers) attempt.answers = { ...attempt.answers, ...answers };
  if (flaggedQuestions) attempt.flaggedQuestions = flaggedQuestions;
  attempt.lastSavedAt = now.toISOString();

  return res.json({
    success: true,
    savedAt: attempt.lastSavedAt,
    serverTime: now.toISOString(),
  });
});

// Submit and grade attempt
assessmentRoutes.post('/:id/submit-attempt', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { attemptId, applicantId, applicationId, answers, questions = [] } = req.body;
  const effectiveApplicantId = applicantId || req.user?.id;

  const now = new Date();

  let attempt = inMemoryAttempts.find(
    a => (attemptId && a.id === attemptId) || (a.assessmentId === id && a.applicantId === effectiveApplicantId)
  );

  if (!attempt) {
    attempt = {
      id: attemptId || `att_${Date.now()}`,
      assessmentId: id,
      applicantId: effectiveApplicantId || 'applicant',
      applicationId: applicationId || 'app_default',
      status: 'in_progress',
      startedAt: now.toISOString(),
      serverStartEpoch: now.getTime(),
      durationMinutes: 30,
      serverExpireEpoch: now.getTime() + 30 * 60 * 1000,
      answers: answers || {},
      flaggedQuestions: [],
      lastSavedAt: now.toISOString(),
    };
    inMemoryAttempts.push(attempt);
  }

  if (attempt.status === 'submitted') {
    return res.status(400).json({
      error: 'This assessment attempt is already submitted and locked.',
      attempt,
    });
  }

  const finalAnswers = answers || attempt.answers;

  // Grade questions
  let earnedScore = 0;
  let totalMaxScore = 0;

  questions.forEach((q: any) => {
    const qPoints = q.points || 10;
    totalMaxScore += qPoints;
    const ans = finalAnswers[q.id];

    if (q.questionType === 'multiple_choice' && Array.isArray(q.correctAnswers)) {
      if (Array.isArray(ans)) {
        const isCorrect = 
          ans.length === q.correctAnswers.length &&
          ans.every((a: string) => q.correctAnswers.includes(a));
        if (isCorrect) earnedScore += qPoints;
      }
    } else if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
      if (typeof ans === 'string' && typeof q.correctAnswer === 'string') {
        if (ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          earnedScore += qPoints;
        }
      }
    } else {
      // For subjective / open-ended questions without immediate auto-grader, award base completeness points
      if (ans && String(ans).trim().length > 10) {
        earnedScore += Math.round(qPoints * 0.85);
      }
    }
  });

  if (totalMaxScore === 0) totalMaxScore = 100;
  const percentage = Math.min(100, Math.max(0, Math.round((earnedScore / totalMaxScore) * 100)));
  const passingBenchmark = 70;
  const isPassed = percentage >= passingBenchmark;

  // Lock attempt
  attempt.status = 'submitted';
  attempt.answers = finalAnswers;
  attempt.submittedAt = now.toISOString();
  attempt.score = earnedScore;
  attempt.maxScore = totalMaxScore;
  attempt.percentageScore = percentage;
  attempt.passed = isPassed;

  await logAuditEvent({
    userId: effectiveApplicantId,
    action: 'ASSESSMENT_SUBMITTED',
    entityType: 'ASSESSMENT',
    entityId: id,
    metadata: {
      attemptId: attempt.id,
      score: earnedScore,
      maxScore: totalMaxScore,
      percentage,
      passed: isPassed,
    },
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: 'Assessment successfully submitted and locked.',
    attempt,
    grading: {
      score: earnedScore,
      maxScore: totalMaxScore,
      percentageScore: percentage,
      passed: isPassed,
      passingBenchmark,
      submittedAt: attempt.submittedAt,
    },
  });
});

// Fetch my attempt (for resuming or reviewing)
assessmentRoutes.get('/:id/my-attempt', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const applicantId = (req.query.applicantId as string) || req.user?.id;

  const attempt = inMemoryAttempts.find(
    a => a.assessmentId === id && a.applicantId === applicantId
  );

  const nowEpoch = Date.now();
  const remainingSeconds = attempt && attempt.status === 'in_progress'
    ? Math.max(0, Math.floor((attempt.serverExpireEpoch - nowEpoch) / 1000))
    : 0;

  res.json({
    attempt: attempt || null,
    remainingSeconds,
    serverTime: new Date().toISOString(),
  });
});
