import { UserRole, Permission } from './roles';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  APPLICANT: [
    'applications:create',
    'applications:read_own',
    'applications:update_own',
    'programmes:read',
    'cohorts:read',
    'forms:read',
    'assessments:read',
    'assessments:take',
    'notifications:read_own',
  ],

  PROGRAM_MANAGER: [
    'applications:create',
    'applications:read_own',
    'applications:read_all',
    'applications:update_own',
    'applications:review',
    'applications:decide',
    'applications:export',
    'programmes:read',
    'programmes:create',
    'programmes:update',
    'programmes:delete',
    'cohorts:read',
    'cohorts:create',
    'cohorts:update',
    'cohorts:delete',
    'forms:read',
    'forms:create',
    'forms:update',
    'forms:publish',
    'assessments:read',
    'assessments:take',
    'assessments:create',
    'assessments:grade',
    'assessments:manage',
    'learners:read_own',
    'learners:read_all',
    'learners:manage',
    'classes:read',
    'classes:manage',
    'communications:send_broadcast',
    'communications:send_direct',
    'notifications:read_own',
    'reports:read',
    'reports:export',
    'audit:read',
  ],

  FACILITATOR: [
    'programmes:read',
    'cohorts:read',
    'assessments:read',
    'assessments:grade',
    'learners:read_all',
    'classes:read',
    'classes:manage',
    'communications:send_direct',
    'notifications:read_own',
  ],

  LEARNER: [
    'programmes:read',
    'cohorts:read',
    'learners:read_own',
    'classes:read',
    'notifications:read_own',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function isStaff(role: UserRole): boolean {
  return role === 'PROGRAM_MANAGER' || role === 'FACILITATOR';
}
