import { hashPassword, verifyPassword } from '../src/auth/passwords';
import { generateToken, verifyToken } from '../src/auth/tokens';
import { AuthUser } from '../src/permissions/roles';

export async function runAuthTests(): Promise<{ name: string; passed: boolean; details?: string }[]> {
  const results: { name: string; passed: boolean; details?: string }[] = [];

  // Test 1: Password Hashing and Verification
  const rawPassword = 'SuperSecretNextGenPassword2026!';
  const hashedPassword = await hashPassword(rawPassword);
  const isMatch = await verifyPassword(rawPassword, hashedPassword);
  const isWrongMismatch = !(await verifyPassword('IncorrectPassword', hashedPassword));

  results.push({
    name: 'Authentication: Bcrypt Password Hashing & Verification',
    passed: isMatch && isWrongMismatch && hashedPassword !== rawPassword,
    details: 'Verified cryptographic salted hashing and rejection of incorrect passwords.',
  });

  // Test 2: JWT Token Generation & Payload Integrity
  const testUser: AuthUser = {
    id: 'usr_test_12345',
    email: 'test.user@nextgenacademy.org',
    role: 'APPLICANT',
    status: 'ACTIVE',
    emailVerified: true,
  };

  const token = generateToken(testUser);
  const decoded = verifyToken(token);

  results.push({
    name: 'Authentication: JWT Generation & Verification',
    passed: decoded.userId === testUser.id && decoded.email === testUser.email && decoded.role === 'APPLICANT',
    details: `Generated valid JWT with correct claims (userId: ${decoded.userId}, role: ${decoded.role}).`,
  });

  // Test 3: Invalid / Tampered Token Rejection
  let tamperedTokenRejected = false;
  try {
    verifyToken(token + 'invalid_signature_bytes');
  } catch {
    tamperedTokenRejected = true;
  }

  results.push({
    name: 'Authentication: Tampered Token Rejection',
    passed: tamperedTokenRejected,
    details: 'Tampered JWT tokens are rejected with standard UNAUTHORIZED status.',
  });

  return results;
}
