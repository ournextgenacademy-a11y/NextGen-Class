import { AuthUser } from './roles';

/**
 * Validates that an authenticated user owns the requested resource,
 * or possesses staff permissions (Program Manager / Facilitator) to access it.
 */
export function validateResourceOwnership(
  user: AuthUser,
  resourceOwnerId: string
): boolean {
  if (user.role === 'PROGRAM_MANAGER') {
    return true; // Program Manager has consolidated platform access
  }
  return user.id === resourceOwnerId;
}

export function assertResourceOwnership(
  user: AuthUser,
  resourceOwnerId: string,
  resourceName: string = 'Resource'
): void {
  if (!validateResourceOwnership(user, resourceOwnerId)) {
    const error: any = new Error(`Forbidden: You do not have permission to access this ${resourceName}.`);
    error.statusCode = 403;
    error.code = 'FORBIDDEN_RESOURCE_ACCESS';
    throw error;
  }
}
