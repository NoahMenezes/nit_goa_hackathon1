// Audit logging utility for tracking admin actions and security events

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "signup"
  | "password_reset"
  | "role_change"
  | "bulk_update"
  | "status_change"
  | "assignment"
  | "file_upload"
  | "unauthorized_access"
  | "rate_limit_exceeded";

export type AuditResource =
  | "user"
  | "issue"
  | "comment"
  | "vote"
  | "auth"
  | "admin"
  | "upload";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

// In-memory store for audit logs
// In production, this should be stored in a database or external logging service
const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS_IN_MEMORY = 10000;

/**
 * Create an audit log entry
 */
export function createAuditLog(
  entry: Omit<AuditLogEntry, "id" | "timestamp">,
): AuditLogEntry {
  const log: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  auditLogs.push(log);

  // Keep only the most recent logs in memory
  if (auditLogs.length > MAX_LOGS_IN_MEMORY) {
    auditLogs.splice(0, auditLogs.length - MAX_LOGS_IN_MEMORY);
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[AUDIT]", {
      action: log.action,
      resource: log.resource,
      user: log.userEmail || log.userId || "anonymous",
      success: log.success,
    });
  }

  return log;
}

/**
 * Log successful action
 */
export function logSuccess(params: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}): AuditLogEntry {
  return createAuditLog({
    ...params,
    success: true,
  });
}

/**
 * Log failed action
 */
export function logFailure(params: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  errorMessage: string;
}): AuditLogEntry {
  return createAuditLog({
    ...params,
    success: false,
  });
}

/**
 * Log authentication event
 */
export function logAuth(params: {
  userId?: string;
  userEmail: string;
  action: "login" | "logout" | "signup" | "password_reset";
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}): AuditLogEntry {
  return createAuditLog({
    ...params,
    resource: "auth",
  });
}

/**
 * Log admin action
 */
export function logAdminAction(params: {
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}): AuditLogEntry {
  return createAuditLog({
    ...params,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(params: {
  userId?: string;
  userEmail?: string;
  action: "unauthorized_access" | "rate_limit_exceeded";
  resource: AuditResource;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  errorMessage: string;
}): AuditLogEntry {
  return createAuditLog({
    ...params,
    success: false,
  });
}

/**
 * Get audit logs with filters
 */
export function getAuditLogs(filters?: {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): {
  logs: AuditLogEntry[];
  total: number;
} {
  let filteredLogs = [...auditLogs];

  // Apply filters
  if (filters?.userId) {
    filteredLogs = filteredLogs.filter((log) => log.userId === filters.userId);
  }

  if (filters?.action) {
    filteredLogs = filteredLogs.filter((log) => log.action === filters.action);
  }

  if (filters?.resource) {
    filteredLogs = filteredLogs.filter(
      (log) => log.resource === filters.resource,
    );
  }

  if (filters?.success !== undefined) {
    filteredLogs = filteredLogs.filter(
      (log) => log.success === filters.success,
    );
  }

  if (filters?.startDate) {
    filteredLogs = filteredLogs.filter(
      (log) => log.timestamp >= filters.startDate!,
    );
  }

  if (filters?.endDate) {
    filteredLogs = filteredLogs.filter(
      (log) => log.timestamp <= filters.endDate!,
    );
  }

  // Sort by timestamp descending (most recent first)
  filteredLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const total = filteredLogs.length;
  const offset = filters?.offset || 0;
  const limit = filters?.limit || 100;

  // Apply pagination
  const paginatedLogs = filteredLogs.slice(offset, offset + limit);

  return {
    logs: paginatedLogs,
    total,
  };
}

/**
 * Get audit logs for a specific resource
 */
export function getResourceAuditLogs(
  resource: AuditResource,
  resourceId: string,
  limit: number = 50,
): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.resource === resource && log.resourceId === resourceId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

/**
 * Get recent audit logs for a user
 */
export function getUserAuditLogs(
  userId: string,
  limit: number = 50,
): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

/**
 * Get security events (failed logins, unauthorized access, etc.)
 */
export function getSecurityEvents(limit: number = 100): AuditLogEntry[] {
  return auditLogs
    .filter(
      (log) =>
        !log.success ||
        log.action === "unauthorized_access" ||
        log.action === "rate_limit_exceeded",
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

/**
 * Get statistics for audit logs
 */
export function getAuditStats(
  startDate?: string,
  endDate?: string,
): {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  actionBreakdown: Record<AuditAction, number>;
  resourceBreakdown: Record<AuditResource, number>;
  uniqueUsers: number;
} {
  let logs = [...auditLogs];

  if (startDate) {
    logs = logs.filter((log) => log.timestamp >= startDate);
  }

  if (endDate) {
    logs = logs.filter((log) => log.timestamp <= endDate);
  }

  const actionBreakdown: Partial<Record<AuditAction, number>> = {};
  const resourceBreakdown: Partial<Record<AuditResource, number>> = {};
  const uniqueUserIds = new Set<string>();

  let successCount = 0;
  let failureCount = 0;

  logs.forEach((log) => {
    // Count success/failure
    if (log.success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Action breakdown
    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;

    // Resource breakdown
    resourceBreakdown[log.resource] =
      (resourceBreakdown[log.resource] || 0) + 1;

    // Unique users
    if (log.userId) {
      uniqueUserIds.add(log.userId);
    }
  });

  return {
    totalLogs: logs.length,
    successCount,
    failureCount,
    actionBreakdown: actionBreakdown as Record<AuditAction, number>,
    resourceBreakdown: resourceBreakdown as Record<AuditResource, number>,
    uniqueUsers: uniqueUserIds.size,
  };
}

/**
 * Clear old audit logs
 */
export function clearOldLogs(olderThanDays: number = 90): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffTimestamp = cutoffDate.toISOString();

  const initialLength = auditLogs.length;
  const logsToKeep = auditLogs.filter(
    (log) => log.timestamp >= cutoffTimestamp,
  );

  auditLogs.length = 0;
  auditLogs.push(...logsToKeep);

  return initialLength - auditLogs.length;
}

/**
 * Export audit logs to JSON
 */
export function exportAuditLogs(filters?: {
  startDate?: string;
  endDate?: string;
}): string {
  const { logs } = getAuditLogs(filters);
  return JSON.stringify(logs, null, 2);
}

/**
 * Generate unique ID for audit log
 */
function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Helper to extract request metadata
 */
export function getRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown";
  const userAgent = headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}
