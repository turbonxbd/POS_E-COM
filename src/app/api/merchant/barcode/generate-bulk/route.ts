import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { bulkBarcodeService } from '../../../../../features/barcode/services/bulk-barcode.service';

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
    const { items, presetId, symbology } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Array parameter "items" is required and cannot be empty.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const batchResult = bulkBarcodeService.generateBulkBarcodes(
      auth.merchantId,
      items,
      presetId || 'preset-50x25-single',
      symbology || 'CODE128'
    );

    return new Response(
      JSON.stringify({ success: true, message: `Batch payload compiled for ${batchResult.totalLabelsCount} labels.`, data: batchResult }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate bulk barcode print payload.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
