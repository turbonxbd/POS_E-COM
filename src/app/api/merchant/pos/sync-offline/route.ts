import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { checkoutService, POSCheckoutPayload, POSCheckoutResult } from '../../../../../features/pos/services/checkout.service';

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
    const { offlineOrders } = body as { offlineOrders: (POSCheckoutPayload & { offlineOrderId?: string })[] };

    if (!offlineOrders || !Array.isArray(offlineOrders) || offlineOrders.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter "offlineOrders" must be a non-empty array of queued sales.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const syncedOrders: POSCheckoutResult[] = [];
    const errors: { offlineOrderId: string; error: string }[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const orderPayload of offlineOrders) {
      const offlineId = orderPayload.offlineOrderId || `off-batch-${Date.now()}`;
      try {
        const result = await checkoutService.processPOSCheckout({
          ...orderPayload,
          merchantId: auth.merchantId,
        });

        if (result.success) {
          syncedCount++;
          syncedOrders.push(result);
        } else {
          failedCount++;
          errors.push({ offlineOrderId: offlineId, error: result.message });
        }
      } catch (err: any) {
        failedCount++;
        errors.push({
          offlineOrderId: offlineId,
          error: err.message || 'Error processing offline sale sync.',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Offline Sync completed. Synced: ${syncedCount}, Failed: ${failedCount}`,
        syncedCount,
        failedCount,
        data: {
          syncedOrders,
          errors,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to sync offline POS transactions.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
