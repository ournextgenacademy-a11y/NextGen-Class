import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthUser, UserRole } from '../permissions/roles';

const DEFAULT_SECRET = 'nextgen-class-dev-secret-change-in-prod-must-be-256-bits';
const JWT_SECRET = process.env.AUTH_SECRET || DEFAULT_SECRET;
const JWT_EXPIRES_IN = process.env.AUTH_SESSION_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  status: string;
}

export function generateToken(user: AuthUser, customExpiry?: string): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const options: SignOptions = {
    expiresIn: (customExpiry || JWT_EXPIRES_IN) as any,
    issuer: 'nextgen-class-auth',
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: 'nextgen-class-auth' }) as TokenPayload;
  } catch (err: any) {
    const error: any = new Error('Invalid or expired authentication token');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }
}
