import { merchantService } from '../../../../../../features/platform-admin/services/merchant.service';
import { APIResponse } from '../../../../../../types/api.types';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await merchantService.resetMerchantPassword(params.id);

    const responsePayload: APIResponse<typeof result> = {
      success: true,
      statusCode: 200,
      message: 'Password reset link generated successfully',
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
        errorCode: 'PASSWORD_RESET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate reset link',
        timestamp: new Date().toISOString(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
