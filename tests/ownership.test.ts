import { validateResourceOwnership, assertResourceOwnership } from '../src/permissions/ownership';
import { AuthUser } from '../src/permissions/roles';

export async function runOwnershipTests(): Promise<{ name: string; passed: boolean; details?: string }[]> {
  const results: { name: string; passed: boolean; details?: string }[] = [];

  const applicantA: AuthUser = {
    id: 'usr_applicant_a',
    email: 'a@example.com',
    role: 'APPLICANT',
    status: 'ACTIVE',
    emailVerified: true,
  };

  const applicantB: AuthUser = {
    id: 'usr_applicant_b',
    email: 'b@example.com',
    role: 'APPLICANT',
    status: 'ACTIVE',
    emailVerified: true,
  };

  const manager: AuthUser = {
    id: 'usr_manager',
    email: 'manager@example.com',
    role: 'PROGRAM_MANAGER',
    status: 'ACTIVE',
    emailVerified: true,
  };

  // Test 1: User accessing own resource
  const ownResourcePassed = validateResourceOwnership(applicantA, 'usr_applicant_a');

  // Test 2: User accessing someone else's resource
  const crossResourceBlocked = !validateResourceOwnership(applicantA, 'usr_applicant_b');

  // Test 3: Program Manager accessing applicant's resource
  const managerAccessGranted = validateResourceOwnership(manager, 'usr_applicant_a');

  // Test 4: Assert helper throws on unauthorized
  let threwExpected = false;
  try {
    assertResourceOwnership(applicantA, applicantB.id, 'Application');
  } catch (e: any) {
    threwExpected = e.statusCode === 403;
  }

  results.push({
    name: 'Resource Ownership: Multi-Tenant Data Isolation',
    passed: ownResourcePassed && crossResourceBlocked && managerAccessGranted && threwExpected,
    details: 'Applicant A is strictly prevented from reading Applicant B data; Program Manager retains operational review access.',
  });

  return results;
}
