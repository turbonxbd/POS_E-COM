import { validateMerchantApiAccess } from '../../../../../lib/merchant-api-guard';
import { inventoryReportService } from '../../../../../features/reports/services/inventory-report.service';

export async function GET(request: Request) {
  try {
    const auth = await validateMerchantApiAccess(request);
    if (!auth.authorized || !auth.merchantId) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const thresholdDays = searchParams.get('deadStockThreshold')
      ? Number(searchParams.get('deadStockThreshold'))
      : 60;

    const valuation = await inventoryReportService.getInventoryValuationReport(
      auth.merchantId,
      warehouseId
    );

    const deadStock = await inventoryReportService.getDeadStockReport(
      auth.merchantId,
      thresholdDays
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          valuation,
          deadStock,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch inventory valuation report.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
