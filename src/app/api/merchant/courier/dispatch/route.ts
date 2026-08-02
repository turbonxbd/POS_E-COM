import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { courierDispatchService } from '../../../../../features/order-management/services/courier-dispatch.service';

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const body = await request.json();
    const { orderIds, provider = 'STEADFAST' } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter "orderIds" must be a non-empty array of order IDs.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await courierDispatchService.dispatchToCourier(
      orderIds,
      provider,
      auth.merchantId
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to dispatch parcels to courier system.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
