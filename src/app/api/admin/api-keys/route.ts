import { apiKeyService } from '../../../../features/platform-admin/services/apikey.service';
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
    const keys = await apiKeyService.getAPIKeys();

    const responsePayload: APIResponse<typeof keys> = {
      success: true,
      statusCode: 200,
      message: 'System API Keys retrieved successfully',
      data: keys,
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
        errorCode: 'API_KEYS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch API keys',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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
    const { keyName, permissions, expiresInDays } = body as { keyName: string; permissions?: string[]; expiresInDays?: number };

    if (!keyName || keyName.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Key name is required.',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await apiKeyService.createAPIKey(
      {
        keyName,
        permissions: permissions || ['*'],
        expiresInDays: expiresInDays || 365,
      },
      auth.adminId
    );

    const responsePayload: APIResponse<typeof result> = {
      success: true,
      statusCode: 201,
      message: 'API Key generated successfully. Save the rawApiKey now; it will not be shown again.',
      data: result,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 400,
        errorCode: 'API_KEY_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create API key',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
