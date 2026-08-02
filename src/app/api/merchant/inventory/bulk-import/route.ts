import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { bulkImportService } from '../../../../../features/inventory/services/bulk-import.service';

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
    const { csvContent, warehouseId } = body;

    if (!csvContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parameter "csvContent" is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summaryReport = await bulkImportService.processCSVImport(
      auth.merchantId,
      csvContent,
      warehouseId || 'wh-main'
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `CSV import completed: ${summaryReport.succeededCount} succeeded, ${summaryReport.failedCount} failed out of ${summaryReport.totalProcessed} rows.`,
        data: summaryReport,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to process bulk CSV import.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
