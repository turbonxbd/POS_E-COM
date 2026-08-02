import { apiKeyService } from '../../../../../features/platform-admin/services/apikey.service';
import { authorizeSuperAdminRequest } from '../../../../../core/auth/admin-middleware';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
    const revoked = await apiKeyService.revokeAPIKey(params.id, auth.adminId);

    if (!revoked) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `API Key with ID "${params.id}" not found`,
          timestamp: new Date().toISOString(),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: `API Key "${params.id}" revoked successfully`,
        data: null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 500,
        errorCode: 'API_KEY_REVOKE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to revoke API key',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
