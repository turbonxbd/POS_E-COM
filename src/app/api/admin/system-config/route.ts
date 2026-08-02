import { systemService } from '../../../../features/platform-admin/services/system.service';
import { authorizeSuperAdminRequest } from '../../../../core/auth/admin-middleware';
import { APIResponse } from '../../../../types/api.types';

export async function GET(request: Request) {
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
    const config = await systemService.getSystemConfig(true);

    const responsePayload: APIResponse<typeof config> = {
      success: true,
      statusCode: 200,
      message: 'System configuration retrieved successfully',
      data: config,
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
        statusCode: 500,
        errorCode: 'SYSTEM_CONFIG_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch system config',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
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
    const updated = await systemService.updateSystemConfig(body, auth.adminId);

    const responsePayload: APIResponse<typeof updated> = {
      success: true,
      statusCode: 200,
      message: 'System configuration updated successfully',
      data: updated,
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
        errorCode: 'SYSTEM_CONFIG_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update system config',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
