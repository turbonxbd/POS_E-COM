import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { closingService } from '../../../../../features/pos/services/closing.service';

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error || 'Unauthorized merchant access.' }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { sessionId, actualCash, notes } = body;

    if (!sessionId || actualCash === undefined || actualCash === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters ("sessionId", "actualCash").',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await closingService.closeRegisterSession(
      auth.merchantId,
      sessionId,
      Number(actualCash),
      notes
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: {
          session: result.session,
          zReport: result.zReport,
          discrepancyStatus: result.discrepancyStatus,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to close register session.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
