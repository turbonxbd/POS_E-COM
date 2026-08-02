import { systemService } from '../../../../../features/platform-admin/services/system.service';
import { authorizeSuperAdminRequest } from '../../../../../core/auth/admin-middleware';
import { APIResponse } from '../../../../../types/api.types';

export async function POST(request: Request) {
  const auth = await authorizeSuperAdminRequest(request);
  if (!auth.authorized) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: auth.statusCode || 401,
        errorCode: 'UNAUTHORIZED',
        message: auth.error || 'Unauthorized',
        timestamp: new Date().toISOString(),
      }),
      { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { enabled } = body as { enabled: boolean };

    if (typeof enabled !== 'boolean') {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'INVALID_PAYLOAD',
          message: 'Field "enabled" (boolean) is required',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await systemService.toggleMaintenanceMode(enabled, auth.adminId);

    const responsePayload: APIResponse<typeof result> = {
      success: true,
      statusCode: 200,
      message: enabled ? 'Platform Maintenance Mode ENABLED' : 'Platform Maintenance Mode DISABLED',
      data: result,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 400,
        errorCode: 'MAINTENANCE_TOGGLE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to toggle maintenance mode',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
