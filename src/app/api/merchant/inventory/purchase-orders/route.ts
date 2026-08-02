import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { purchaseOrderService } from '../../../../../features/inventory/services/purchase-order.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pos = await purchaseOrderService.getPurchaseOrders(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: pos }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch purchase orders.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { action, supplierId, warehouseId, items, poId } = body;

    // Handle PO Receiving Trigger
    if (action === 'RECEIVE') {
      if (!poId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Parameter "poId" is required to receive Purchase Order.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const receiveRes = await purchaseOrderService.receivePurchaseOrder(auth.merchantId, poId);
      return new Response(
        JSON.stringify({ success: true, message: receiveRes.message, data: receiveRes }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default: Create Purchase Order
    if (!supplierId || !warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required PO parameters ("supplierId", "warehouseId", "items").',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const createdPO = await purchaseOrderService.createPurchaseOrder(auth.merchantId, {
      supplierId,
      warehouseId,
      items,
      notes: body.notes,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Purchase Order created.', data: createdPO }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to process purchase order.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
