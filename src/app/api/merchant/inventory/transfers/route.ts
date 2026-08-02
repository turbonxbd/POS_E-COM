import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { stockTransferService } from '../../../../../features/inventory/services/stock-transfer.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transfers = await stockTransferService.getTransfers(auth.merchantId);

    return new Response(
      JSON.stringify({ success: true, data: transfers }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch stock transfers.' }),
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
    const { sourceWarehouseId, destinationWarehouseId, items, notes } = body;

    if (!sourceWarehouseId || !destinationWarehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required transfer parameters ("sourceWarehouseId", "destinationWarehouseId", "items").',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await stockTransferService.transferStock(
      auth.merchantId,
      sourceWarehouseId,
      destinationWarehouseId,
      items,
      notes,
      auth.user?.name || 'merchant-staff'
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: result,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to process stock transfer.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
