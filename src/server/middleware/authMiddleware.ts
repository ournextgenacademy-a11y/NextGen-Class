import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../../auth/tokens';
import { UserRole, AuthUser, Permission } from '../../permissions/roles';
import { hasPermission } from '../../permissions/rbac';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please log in to access this endpoint.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload: TokenPayload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status as any,
      emailVerified: true,
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: err.message || 'Invalid or expired session token.',
      },
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. Role '${req.user.role}' is not authorized for this resource. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_PERMISSION',
          message: `Access denied. Required permission: '${permission}'.`,
        },
      });
      return;
    }

    next();
  };
}
