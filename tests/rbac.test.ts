import { hasPermission, ROLE_PERMISSIONS, isStaff } from '../src/permissions/rbac';
import { UserRole } from '../src/permissions/roles';

export async function runRbacTests(): Promise<{ name: string; passed: boolean; details?: string }[]> {
  const results: { name: string; passed: boolean; details?: string }[] = [];

  // Test 1: Applicant Role Boundaries
  const applicantCanCreateApp = hasPermission('APPLICANT', 'applications:create');
  const applicantCannotDecideApp = !hasPermission('APPLICANT', 'applications:decide');
  const applicantCannotReadAllApps = !hasPermission('APPLICANT', 'applications:read_all');

  results.push({
    name: 'RBAC: Applicant Strict Role Isolation',
    passed: applicantCanCreateApp && applicantCannotDecideApp && applicantCannotReadAllApps,
    details: 'Applicant can create own applications but is forbidden from reading all applications or issuing admission decisions.',
  });

  // Test 2: Program Manager Full Lifecycle Scope
  const managerCanReview = hasPermission('PROGRAM_MANAGER', 'applications:review');
  const managerCanDecide = hasPermission('PROGRAM_MANAGER', 'applications:decide');
  const managerCanCreateCohort = hasPermission('PROGRAM_MANAGER', 'cohorts:create');
  const managerCanPublishForm = hasPermission('PROGRAM_MANAGER', 'forms:publish');
  const managerIsStaff = isStaff('PROGRAM_MANAGER');

  results.push({
    name: 'RBAC: Program Manager Comprehensive Permissions',
    passed: managerCanReview && managerCanDecide && managerCanCreateCohort && managerCanPublishForm && managerIsStaff,
    details: 'Program Manager has full administrative, review, evaluation, cohort creation, and decision privileges.',
  });

  // Test 3: Facilitator Scoring and Grading Bounds
  const facilitatorCanGrade = hasPermission('FACILITATOR', 'assessments:grade');
  const facilitatorCannotDeleteProgramme = !hasPermission('FACILITATOR', 'programmes:delete');

  results.push({
    name: 'RBAC: Facilitator Assessment Bounds',
    passed: facilitatorCanGrade && facilitatorCannotDeleteProgramme,
    details: 'Facilitators can grade tests and view classes but cannot destroy programme architecture.',
  });

  return results;
}
