import { validateMerchantApiAccess } from '../../../../../core/auth/merchant-guard';
import { barcodeHistoryService } from '../../../../../features/barcode/services/history.service';

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
    const sku = searchParams.get('sku') || undefined;
    const generatedBy = searchParams.get('generatedBy') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const history = await barcodeHistoryService.getPrintHistory(auth.merchantId, {
      sku,
      generatedBy,
      limit,
    });

    return new Response(
      JSON.stringify({ success: true, data: history }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch barcode print history.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
