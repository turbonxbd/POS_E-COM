import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { orderLifecycleService } from '../../../../../../features/order-management/services/order-lifecycle.service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const orderId = params.id;
    const historyLogs = await orderLifecycleService.getOrderStatusHistory(
      auth.merchantId,
      orderId
    );

    return new Response(
      JSON.stringify({ success: true, data: historyLogs }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch order status transition history.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
