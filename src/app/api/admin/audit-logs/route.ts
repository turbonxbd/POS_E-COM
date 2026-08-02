import { auditService } from '../../../../features/platform-admin/services/audit.service';
import { APIResponse } from '../../../../types/api.types';

// Populate seed audit logs for demonstration if empty
async function ensureSeedLogs() {
  const existing = await auditService.getAuditLogs({ pageSize: 1 });
  if (existing.totalItems === 0) {
    await auditService.logAdminAction({
      adminId: 'admin-super-01',
      action: 'UPDATE_SYSTEM_CONFIG',
      targetResource: 'SystemConfig',
      ipAddress: '192.168.1.1',
      details: { updatedField: 'isMaintenanceMode', newValue: false },
    });
    await auditService.logAdminAction({
      adminId: 'admin-super-01',
      action: 'SUSPEND_MERCHANT',
      targetResource: 'Merchant:m3',
      ipAddress: '192.168.1.1',
      details: { reason: 'Payment overdue for 30 days' },
    });
  }
}

export async function GET(request: Request) {
  try {
    await ensureSeedLogs();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || undefined;
    const adminId = searchParams.get('adminId') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await auditService.getAuditLogs({
      page,
      pageSize,
      search,
      adminId,
      action,
      startDate,
      endDate,
    });

    const responsePayload: APIResponse<typeof result> = {
      success: true,
      statusCode: 200,
      message: 'Audit logs retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorPayload = {
      success: false,
      statusCode: 500,
      errorCode: 'AUDIT_LOG_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch audit logs',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
