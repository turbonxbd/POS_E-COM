import { validateMerchantApiAccess } from '../../../../../../lib/merchant-api-guard';
import { orderLifecycleService } from '../../../../../../features/order-management/services/order-lifecycle.service';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const orderId = params.id;
    const body = await request.json();
    const { newStatus, note } = body;

    if (!newStatus) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "newStatus" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = auth.user?.id || 'usr-merchant-admin';
    const result = await orderLifecycleService.updateOrderStatus(
      auth.merchantId,
      orderId,
      newStatus,
      userId,
      note
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
      JSON.stringify({ success: false, error: error.message || 'Failed to update order status.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
