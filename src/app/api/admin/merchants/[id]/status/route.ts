import { merchantService } from '../../../../../../features/platform-admin/services/merchant.service';
import { APIResponse } from '../../../../../../types/api.types';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, reason } = body as { action: 'activate' | 'suspend'; reason?: string };

    if (!action || !['activate', 'suspend'].includes(action)) {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          errorCode: 'INVALID_ACTION',
          message: 'Action must be either "activate" or "suspend"',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated =
      action === 'suspend'
        ? await merchantService.suspendMerchant(params.id, reason)
        : await merchantService.activateMerchant(params.id);

    const responsePayload: APIResponse<typeof updated> = {
      success: true,
      statusCode: 200,
      message: `Merchant status updated to ${updated.status}`,
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
        errorCode: 'STATUS_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update merchant status',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
