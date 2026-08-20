// Role Definitions and Access Enums
export type UserRole = 'APPLICANT' | 'PROGRAM_MANAGER' | 'FACILITATOR' | 'LEARNER';

export const USER_ROLES = {
  APPLICANT: 'APPLICANT' as UserRole,
  PROGRAM_MANAGER: 'PROGRAM_MANAGER' as UserRole,
  FACILITATOR: 'FACILITATOR' as UserRole,
  LEARNER: 'LEARNER' as UserRole,
} as const;

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DEACTIVATED';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  applicantProfileId?: string;
  learnerProfileId?: string;
  fullName?: string;
}

export type Permission = 
  // Applications
  | 'applications:create'
  | 'applications:read_own'
  | 'applications:read_all'
  | 'applications:update_own'
  | 'applications:review'
  | 'applications:decide'
  | 'applications:export'
  
  // Programmes & Cohorts
  | 'programmes:read'
  | 'programmes:create'
  | 'programmes:update'
  | 'programmes:delete'
  | 'cohorts:read'
  | 'cohorts:create'
  | 'cohorts:update'
  | 'cohorts:delete'

  // Application Forms
  | 'forms:read'
  | 'forms:create'
  | 'forms:update'
  | 'forms:publish'

  // Assessments
  | 'assessments:read'
  | 'assessments:take'
  | 'assessments:create'
  | 'assessments:grade'
  | 'assessments:manage'

  // Learners & Classes
  | 'learners:read_own'
  | 'learners:read_all'
  | 'learners:manage'
  | 'classes:read'
  | 'classes:manage'

  // Communications & Notifications
  | 'communications:send_broadcast'
  | 'communications:send_direct'
  | 'notifications:read_own'

  // M&E & Reports
  | 'reports:read'
  | 'reports:export'
  | 'audit:read';
