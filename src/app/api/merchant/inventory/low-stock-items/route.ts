import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { inventoryLogService } from '../../../../../features/inventory/services/inventory-log.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.isAuthorized || !auth.merchantId) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: auth.statusCode || 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || 'wh-main';

    const items = await inventoryLogService.getLowStockItems(auth.merchantId, warehouseId);

    return new Response(
      JSON.stringify({ success: true, data: items }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch low stock inventory items.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
