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
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const changeType = (searchParams.get('changeType') as any) || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const logs = await inventoryLogService.getInventoryLogs(auth.merchantId, {
      warehouseId,
      changeType,
      limit,
    });

    return new Response(
      JSON.stringify({ success: true, data: logs }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch inventory logs.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
