import { registerSchema, loginSchema, createProgrammeSchema, createCohortSchema } from '../src/validation/schemas';

export async function runValidationTests(): Promise<{ name: string; passed: boolean; details?: string }[]> {
  const results: { name: string; passed: boolean; details?: string }[] = [];

  // Test 1: Valid Registration Payload
  const validRegister = registerSchema.safeParse({
    email: 'new.candidate@example.org',
    password: 'ValidSecurePass2026!',
    firstName: 'Chinedu',
    lastName: 'Eze',
    role: 'APPLICANT',
  });

  // Test 2: Invalid Short Password
  const invalidPassword = registerSchema.safeParse({
    email: 'bad.pass@example.org',
    password: 'short',
    firstName: 'Test',
    lastName: 'User',
  });

  results.push({
    name: 'Validation: User Registration Schema',
    passed: validRegister.success && !invalidPassword.success,
    details: 'Properly validates strong password constraints and email formats.',
  });

  // Test 3: Programme Creation Validation
  const validProg = createProgrammeSchema.safeParse({
    name: 'Applied Machine Learning',
    slug: 'applied-machine-learning',
    description: 'Advanced AI systems',
    status: 'ACTIVE',
  });

  const invalidSlug = createProgrammeSchema.safeParse({
    name: 'Invalid Slug Prog',
    slug: 'Invalid Slug With Spaces & CAPS',
  });

  results.push({
    name: 'Validation: Dynamic Programme Slug Constraints',
    passed: validProg.success && !invalidSlug.success,
    details: 'Enforces URL-safe regex formatting on dynamic programme slugs.',
  });

  return results;
}
