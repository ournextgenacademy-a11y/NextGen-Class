import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { validateResourceOwnership } from '../../permissions/ownership';

export function enforceResourceOwnership(getOwnerIdFromReq: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
      return;
    }

    const ownerId = getOwnerIdFromReq(req);
    if (!ownerId) {
      next();
      return;
    }

    const isAuthorized = validateResourceOwnership(req.user, ownerId);
    if (!isAuthorized) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_RESOURCE_OWNERSHIP',
          message: 'Access denied: You do not have permission to view or manipulate another user’s resource.',
        },
      });
      return;
    }

    next();
  };
}
