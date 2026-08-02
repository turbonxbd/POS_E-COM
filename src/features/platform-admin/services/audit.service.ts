import { AuditLog } from '../../../types/platform-admin.types';
import { PaginatedResponse, PaginationParams } from '../../../types/api.types';

export interface AuditLogQueryParams extends PaginationParams {
  adminId?: string;
  action?: string;
  targetResource?: string;
  startDate?: string;
  endDate?: string;
}

export interface LogAdminActionInput {
  adminId: string;
  action: string;
  targetResource: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

/**
 * Enterprise Audit Logging Service for security auditing and compliance.
 */
export class AuditService {
  private static instance: AuditService | null = null;
  private inMemoryLogs: AuditLog[] = [];

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Logs a Platform Super Admin action to audit records.
   */
  public async logAdminAction(input: LogAdminActionInput): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminId: input.adminId,
      action: input.action,
      targetResource: input.targetResource,
      ipAddress: input.ipAddress || '127.0.0.1',
      details: input.details || null,
      createdAt: new Date().toISOString(),
    };

    this.inMemoryLogs.unshift(newLog);
    return newLog;
  }

  /**
   * Retrieves paginated and filtered audit logs.
   */
  public async getAuditLogs(params: AuditLogQueryParams = {}): Promise<PaginatedResponse<AuditLog>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

    let filtered = [...this.inMemoryLogs];

    if (params.adminId) {
      filtered = filtered.filter((log) => log.adminId.toLowerCase() === params.adminId?.toLowerCase());
    }

    if (params.action) {
      filtered = filtered.filter((log) => log.action.toLowerCase().includes(params.action!.toLowerCase()));
    }

    if (params.targetResource) {
      filtered = filtered.filter((log) =>
        log.targetResource.toLowerCase().includes(params.targetResource!.toLowerCase())
      );
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(q) ||
          log.targetResource.toLowerCase().includes(q) ||
          log.adminId.toLowerCase().includes(q)
      );
    }

    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      filtered = filtered.filter((log) => new Date(log.createdAt).getTime() >= start);
    }

    if (params.endDate) {
      const end = new Date(params.endDate).getTime();
      filtered = filtered.filter((log) => new Date(log.createdAt).getTime() <= end);
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

export const auditService = AuditService.getInstance();
