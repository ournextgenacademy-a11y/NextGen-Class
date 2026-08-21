export type AuditAction = 
  | 'LOGIN'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'EMAIL_VERIFIED'
  | 'ROLE_CHANGED'
  | 'ROLE_REVOKED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_UPDATED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_WAITLISTED'
  | 'FORM_CREATED'
  | 'FORM_PUBLISHED'
  | 'FORM_UPDATED'
  | 'QUESTION_UPLOADED'
  | 'ASSESSMENT_CREATED'
  | 'ASSESSMENT_OPENED'
  | 'ASSESSMENT_CLOSED'
  | 'ASSESSMENT_ATTEMPT_STARTED'
  | 'ASSESSMENT_ATTEMPT_SAVED'
  | 'ASSESSMENT_SUBMITTED'
  | 'ASSESSMENT_GRADED'
  | 'USER_ROLE_CHANGED';

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

// In-memory audit log stream
export const auditLogStore: AuditLogEntry[] = [];

export async function logAuditEvent(params: {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    createdAt: new Date(),
  };

  auditLogStore.push(entry);
  return entry;
}

export function getAuditLogs(filter?: { userId?: string; action?: AuditAction; entityType?: string }): AuditLogEntry[] {
  return auditLogStore.filter(entry => {
    if (filter?.userId && entry.userId !== filter.userId) return false;
    if (filter?.action && entry.action !== filter.action) return false;
    if (filter?.entityType && entry.entityType !== filter.entityType) return false;
    return true;
  });
}

