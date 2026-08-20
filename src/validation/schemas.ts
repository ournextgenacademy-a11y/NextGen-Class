import { z } from 'zod';

export const userRoleSchema = z.enum(['APPLICANT', 'PROGRAM_MANAGER', 'FACILITATOR', 'LEARNER']);

// Auth Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: userRoleSchema.default('APPLICANT'),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export const publicApplicantRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  country: z.string().optional(),
  // Strict rule: Public registration CANNOT specify elevated staff roles
  role: z.literal('APPLICANT').default('APPLICANT'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(6, 'Verification token is required'),
});


// Programme & Cohort Validation Schemas
export const createProgrammeSchema = z.object({
  name: z.string().min(2, 'Programme name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and dashes').optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'draft', 'active', 'archived']).default('ACTIVE'),
});

export const updateProgrammeSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'draft', 'active', 'archived']).optional(),
});

export const createCohortSchema = z.object({
  programmeId: z.string().min(1, 'Programme ID is required'),
  name: z.string().min(2, 'Cohort name is required'),
  applicationOpenDate: z.string().or(z.date()).optional(),
  applicationCloseDate: z.string().or(z.date()).optional(),
  programmeStartDate: z.string().or(z.date()).optional(),
  programmeEndDate: z.string().or(z.date()).optional(),
  capacity: z.number().int().positive().default(50),
  description: z.string().optional(),
  status: z.enum([
    'DRAFT', 'APPLICATIONS_OPEN', 'APPLICATIONS_CLOSED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED',
    'draft', 'applications_open', 'applications_closed', 'active', 'in_progress', 'completed', 'archived'
  ]).default('APPLICATIONS_OPEN'),
});

export const updateCohortSchema = z.object({
  programmeId: z.string().optional(),
  name: z.string().min(2).optional(),
  applicationOpenDate: z.string().or(z.date()).optional(),
  applicationCloseDate: z.string().or(z.date()).optional(),
  programmeStartDate: z.string().or(z.date()).optional(),
  programmeEndDate: z.string().or(z.date()).optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  status: z.enum([
    'DRAFT', 'APPLICATIONS_OPEN', 'APPLICATIONS_CLOSED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED',
    'draft', 'applications_open', 'applications_closed', 'active', 'in_progress', 'completed', 'archived'
  ]).optional(),
});

// Application Form Validation
export const createFormFieldSchema = z.object({
  fieldType: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'FILE_UPLOAD', 'DATE', 'EMAIL', 'PHONE', 'URL']),
  label: z.string().min(2, 'Field label is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validationRules: z.record(z.string(), z.any()).optional(),
  displayOrder: z.number().int().default(0),
});

export const submitApplicationSchema = z.object({
  programmeId: z.string().uuid(),
  cohortId: z.string().uuid(),
  formId: z.string().uuid(),
  responses: z.array(z.object({
    fieldId: z.string().uuid(),
    value: z.string().optional(),
    fileUrl: z.string().url().optional(),
  })),
});

// Assessment Submission
export const submitAssessmentAttemptSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.string(),
  })),
});

// Admission Decision
export const admissionDecisionSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(['ACCEPTED', 'REJECTED', 'WAITLISTED']),
  reason: z.string().optional(),
});
